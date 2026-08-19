"""
Import Sukhmal products from Product_Listings_Master.xlsx into the frontend catalog.

Source of truth (products only):
  - Product_Listings_Master.xlsx  (copy, prices, SEO, allergens, Image 1–5)

Outputs:
  - frontend/public/products/<slug>-{1..5}.jpg   (--images-only or --catalog)
  - frontend/src/data/mockCatalog.js             (--catalog only)

Run with --help for flags. A bare run does nothing (avoids wiping images).
"""

from __future__ import annotations

import json
import re
import sys
import zipfile
from collections import defaultdict
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

import openpyxl
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MASTER_XLSX = ROOT / "data" / "Product_Listings_Master.xlsx"
MASTER_IMAGES_XLSX = MASTER_XLSX
OUT_IMG = ROOT / "frontend" / "public" / "products"
OUT_CATALOG = ROOT / "frontend" / "src" / "data" / "mockCatalog.js"

# Excel Image 1–3 are often 140×140 unique shots; Image 4–5 are 1024px.
# We keep all five, enhance the small ones so the gallery stays clear.
MIN_NATIVE_SIDE = 400
TARGET_SIDE = 1024
JPEG_QUALITY = 92
CANVAS_COLOR = (247, 241, 232)  # warm cream — matches storefront

CATEGORY_MAP = {
    "Cashew (Kaju)": "nuts",
    "Almonds (Badam)": "nuts",
    "Mamra Almonds (Irani)": "nuts",
    "Pistachio (Pista)": "nuts",
    "Raisins (Kishmish & Munakka)": "dry-fruits",
    "Figs (Anjeer)": "dry-fruits",
    "Walnuts (Akhrot)": "nuts",
    "Pine Nuts (Chilgoza)": "nuts",
    "Exotic & Mixed Nuts": "nuts",
    "Makhana": "seeds",
    "Dates & Apricot": "dates",  # overridden per-product for apricot
    "Seeds": "seeds",
    "Cardamom (Elaichi)": "seeds",
    "Mishri": "dry-fruits",
    "Gaund / Gum": "dry-fruits",
    "Murabba": "dry-fruits",
    "Dried Fruits": "dry-fruits",
    "Berries": "berries",
    "Namkeen, Chips & Snacks": "dry-fruits",
    "Mouth Fresheners": "dry-fruits",
}

BESTSELLER_NAMES = {
    "Kaju 320 N",
    "Badam CF",
    "Pista",
    "Kishmish Kandhari",
    "Anjeer Jumbo",
    "Walnut Premium",
    "Medjoul Dates",
    "Chia Seeds",
    "Cranberries",
    "Mix Nuts",
    "Irani Mamra Medium",
    "Pumpkin Seeds",
}

NATURAL_HINTS = ("chia", "flax", "kishmish", "munakka", "anjeer", "khubani", "dates", "seeds", "makhana")


def slugify(text: str) -> str:
    s = text.lower().strip()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "product"


def clean_text(val) -> str:
    if val is None:
        return ""
    t = str(val).replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def clean_description(val) -> str:
    """Collapse Excel soft-wraps; keep blank-line paragraph breaks."""
    t = clean_text(val)
    if not t:
        return ""
    paras = re.split(r"\n\s*\n", t)
    fixed = []
    for para in paras:
        # Join soft-wrapped lines; keep checkmark bullets on their own lines
        if "✅" in para:
            bits = []
            for line in para.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if line.startswith("✅") or not bits:
                    bits.append(line)
                else:
                    bits[-1] = bits[-1].rstrip() + " " + line
            fixed.append("\n".join(bits))
        else:
            fixed.append(re.sub(r"\s*\n\s*", " ", para).strip())
    return "\n\n".join(p for p in fixed if p)


def one_line(val, max_len=120) -> str:
    t = clean_text(val).replace("\n", " ")
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) > max_len:
        t = t[: max_len - 1].rsplit(" ", 1)[0] + "…"
    return t


def parse_highlights(raw) -> list[str]:
    """Parse Excel highlight cells; join soft-wrapped lines into full bullets."""
    t = clean_text(raw)
    if not t:
        return []
    # Prefer checkmark-delimited bullets (master sheet style)
    if "✅" in t:
        chunks = [c.strip() for c in t.split("✅") if c.strip()]
    else:
        chunks = [c.strip() for c in re.split(r"[\n•]+", t) if c.strip()]

    lines = []
    for chunk in chunks:
        # Soft wraps inside a bullet → single line
        p = re.sub(r"\s*\n\s*", " ", chunk)
        p = re.sub(r"\s+", " ", p).strip().lstrip("✅").strip()
        if not p:
            continue
        if p.lower().startswith("pack sizes"):
            continue
        lines.append(p)
    return lines[:6]


def hash_rating(slug: str) -> tuple[float, int]:
    h = 0
    for ch in slug:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    rating = round(4.5 + (h % 40) / 100, 1)  # 4.5–4.9
    reviews = 120 + (h % 1100)
    return rating, reviews


def round_mrp(price: int) -> int:
    """Slightly higher display MRP ending in 99 (UI-only; not a sheet column)."""
    if not price:
        return price
    target = int(round(price * 1.18))
    # bump to next …99
    base = (target // 100) * 100 + 99
    if base <= price:
        base += 100
    return base


def map_category(excel_cat: str, product_name: str) -> str:
    name_l = (product_name or "").lower()
    if "apricot" in name_l or "khubani" in name_l:
        return "dry-fruits"
    if "date" in name_l or "medjoul" in name_l or "medjool" in name_l:
        return "dates"
    return CATEGORY_MAP.get(excel_cat or "", "dry-fruits")


def load_master_rows():
    wb = openpyxl.load_workbook(MASTER_XLSX, read_only=True, data_only=True)
    ws = wb["Product Listings"]
    rows = []
    for i, row in enumerate(ws.iter_rows(min_row=4, values_only=True), start=4):
        if not row or row[2] is None:
            continue
        sno, cat, name = row[0], row[1], row[2]
        if name is None:
            continue
        rows.append(
            {
                "excel_row": i,  # 1-based sheet row
                "sno": sno,
                "excel_category": clean_text(cat),
                "name": clean_text(name),
                "seo_title": clean_text(row[3]) if len(row) > 3 else "",
                "short": clean_text(row[4]) if len(row) > 4 else "",
                "description": clean_text(row[5]) if len(row) > 5 else "",
                "highlights_raw": clean_text(row[6]) if len(row) > 6 else "",
                "best_for": clean_text(row[7]) if len(row) > 7 else "",
                "allergen": clean_text(row[8]) if len(row) > 8 else "",
                "price_250": int(row[9]) if row[9] is not None else None,
                "price_500": int(row[10]) if row[10] is not None else None,
                "price_1kg": int(row[11]) if row[11] is not None else None,
                "seo_keywords": clean_text(row[17]) if len(row) > 17 else "",
                "status": clean_text(row[18]) if len(row) > 18 else "",
            }
        )
    wb.close()
    return rows


def extract_row_images():
    """Return dict excel_row_0idx -> list of (col, zip_path, data, format) for ALL sheet images.

    Prefers Product_Listings_Master.xlsx.backup when present (original PNG quality).
    """
    NS = {"xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"}
    by_row = defaultdict(list)
    source = MASTER_IMAGES_XLSX
    print(f"  image source: {source.name}")
    with zipfile.ZipFile(source) as z:
        rels_root = ET.fromstring(z.read("xl/drawings/_rels/drawing1.xml.rels"))
        rid_to_media = {}
        for rel in rels_root:
            rid = rel.attrib.get("Id")
            target = (rel.attrib.get("Target") or "").lstrip("/")
            if target.startswith("../"):
                target = "xl/" + target[3:]
            rid_to_media[rid] = target.replace("\\", "/")

        droot = ET.fromstring(z.read("xl/drawings/drawing1.xml"))
        for anc in droot:
            from_el = anc.find("xdr:from", NS)
            if from_el is None:
                continue
            col = int(from_el.find("xdr:col", NS).text)
            row = int(from_el.find("xdr:row", NS).text)
            blip = anc.find(
                ".//{http://schemas.openxmlformats.org/drawingml/2006/main}blip"
            )
            if blip is None:
                continue
            rid = blip.attrib.get(
                "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
            )
            media = rid_to_media.get(rid)
            if not media:
                continue
            data = z.read(media)
            im = Image.open(BytesIO(data))
            by_row[row].append((col, media, data, im.format or "PNG"))
    for row in by_row:
        by_row[row].sort(key=lambda x: x[0])
    return by_row


def _to_rgb(im: Image.Image) -> Image.Image:
    if im.mode in ("RGBA", "P"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        rgba = im.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[-1])
        return bg
    if im.mode != "RGB":
        return im.convert("RGB")
    return im


def enhance_sheet_image(im: Image.Image) -> Image.Image:
    """Normalize every sheet embed to a crisp TARGET_SIDE square.

    Native hi-res shots are kept full-bleed.
    Small Excel embeds (unique alternate angles at ~140px) are step-upscaled,
    sharpened, and centered on a cream canvas so they read clearly in the gallery
    instead of being stretched blurry across the viewport.
    """
    im = _to_rgb(im)
    side = max(im.size)

    if side >= MIN_NATIVE_SIDE:
        if side != TARGET_SIDE:
            scale = TARGET_SIDE / side
            im = im.resize(
                (max(1, int(im.size[0] * scale)), max(1, int(im.size[1] * scale))),
                Image.Resampling.LANCZOS,
            )
        canvas = Image.new("RGB", (TARGET_SIDE, TARGET_SIDE), CANVAS_COLOR)
        canvas.paste(im, ((TARGET_SIDE - im.size[0]) // 2, (TARGET_SIDE - im.size[1]) // 2))
        return canvas

    # --- small unique sheet shot: gentle multi-step upscale + plate ---
    # Cap magnification so edges stay readable (~5× → ~700px on 1024 plate)
    target_photo = min(TARGET_SIDE - 80, max(side * 5, 560))
    while max(im.size) * 2 <= target_photo:
        im = im.resize((im.size[0] * 2, im.size[1] * 2), Image.Resampling.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=2))
    if max(im.size) < target_photo:
        scale = target_photo / max(im.size)
        im = im.resize(
            (max(1, int(im.size[0] * scale)), max(1, int(im.size[1] * scale))),
            Image.Resampling.LANCZOS,
        )
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=135, threshold=2))
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = ImageEnhance.Color(im).enhance(1.06)
    im = ImageEnhance.Sharpness(im).enhance(1.25)

    canvas = Image.new("RGB", (TARGET_SIDE, TARGET_SIDE), CANVAS_COLOR)
    x = (TARGET_SIDE - im.size[0]) // 2
    y = (TARGET_SIDE - im.size[1]) // 2
    # soft drop shadow under the photo plate
    shadow = Image.new("RGBA", (TARGET_SIDE, TARGET_SIDE), (0, 0, 0, 0))
    sh = Image.new("RGBA", (im.size[0] + 8, im.size[1] + 8), (0, 0, 0, 36))
    shadow.paste(sh, (x + 6, y + 8))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=10))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow).convert("RGB")
    canvas.paste(im, (x, y))
    return canvas


# Excel drawing columns M–Q (0-based 12–16) = Image 1–5, in that order.
# Image 1 is the product close-up; 2 jar; 3 feature graphic; 4 lifestyle; 5 nutrition.
DISPLAY_IMAGE_COLS = [12, 13, 14, 15, 16]
SAME_SHOT_MSE = 20000
_ICLOUD_CACHE = None


def _icloud_maps():
    """High-res originals live in iCloud `images/image1`…`image5`, matching Excel Image 1–5."""
    global _ICLOUD_CACHE
    if _ICLOUD_CACHE is None:
        scripts_dir = str(Path(__file__).resolve().parent)
        if scripts_dir not in sys.path:
            sys.path.insert(0, scripts_dir)
        try:
            from apply_icloud_product_images import collect, to_jpeg

            assignments, unmapped = collect()
            if unmapped:
                print(f"  iCloud unmapped keys ignored: {len(unmapped)}")
            _ICLOUD_CACHE = (assignments, to_jpeg)
            print(f"  iCloud hi-res slots: {len(assignments)}")
        except Exception as exc:
            print(f"  iCloud images unavailable ({exc}); falling back to Excel embeds")
            _ICLOUD_CACHE = ({}, None)
    return _ICLOUD_CACHE


def _crop_letterbox(im: Image.Image, thresh: int = 248) -> Image.Image:
    """Trim white padding so 140px Excel thumbs can be compared to landscape photos."""
    rgb = im.convert("RGB")
    px = rgb.load()
    w, h = rgb.size

    def white(x: int, y: int) -> bool:
        r, g, b = px[x, y]
        return r >= thresh and g >= thresh and b >= thresh

    top = 0
    while top < h - 1 and all(white(x, top) for x in range(w)):
        top += 1
    bot = h - 1
    while bot > top and all(white(x, bot) for y in range(h)):
        bot -= 1
    left = 0
    while left < w - 1 and all(white(left, y) for y in range(h)):
        left += 1
    right = w - 1
    while right > left and all(white(right, y) for y in range(h)):
        right -= 1
    return rgb.crop((left, top, right + 1, bot + 1))


def _content_thumb(im: Image.Image, n: int = 32) -> Image.Image:
    return _crop_letterbox(im).resize((n, n), Image.Resampling.LANCZOS)


def _mse(a: Image.Image, b: Image.Image) -> float:
    pa, pb = list(a.getdata()), list(b.getdata())
    return sum(
        (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
        for (r1, g1, b1), (r2, g2, b2) in zip(pa, pb)
    ) / len(pa)


def _same_excel_slot(existing: Image.Image, native: Image.Image, other_natives: list) -> bool:
    """True when the local file is a sharper copy of this Excel slot, not a different column."""
    this = _mse(_content_thumb(existing), _content_thumb(native))
    if this >= SAME_SHOT_MSE:
        return False
    for other in other_natives:
        if _mse(_content_thumb(existing), _content_thumb(other)) < this:
            return False
    return True


def save_product_images(slug: str, embeds: list) -> list[str]:
    """Save sheet Image 1–5 as gallery JPEGs.

    Prefer the matching iCloud original (same slot as Excel Image N).
    If that file is missing, enhance the Excel embed — and never keep a
    different shot (e.g. the feature graphic) in slot 1.
    """
    paths = []
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    by_col = {item[0]: item for item in embeds}
    assignments, to_jpeg = _icloud_maps()

    for i, col in enumerate(DISPLAY_IMAGE_COLS, start=1):
        fname = f"{slug}-{i}.jpg"
        dest = OUT_IMG / fname
        pair = assignments.get((slug, i))
        if pair and to_jpeg:
            to_jpeg(pair[0], dest)
            paths.append(f"/products/{fname}")
            continue

        picked = by_col.get(col)
        if not picked:
            used = set(DISPLAY_IMAGE_COLS[: i - 1])
            picked = next((by_col[c] for c in sorted(by_col) if c not in used), None)
        if not picked:
            break
        native = Image.open(BytesIO(picked[2]))
        native_side = max(native.size)
        if dest.exists() and native_side < 400:
            try:
                existing = Image.open(dest)
                others = [Image.open(BytesIO(by_col[c][2])) for c in by_col if c != col]
                if max(existing.size) >= 800 and _same_excel_slot(existing, native, others):
                    paths.append(f"/products/{fname}")
                    continue
            except Exception:
                pass
        im = enhance_sheet_image(native)
        im.save(
            dest,
            "JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=True,
            subsampling=0,
        )
        paths.append(f"/products/{fname}")
    return paths


def js_string(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def emit_product(obj: dict) -> str:
    # Keep a compact but readable object literal
    images = ", ".join(js_string(x) for x in obj["images"])
    variants = ", ".join(
        "{ w: %s, price: %s }" % (js_string(v["w"]), v["price"]) for v in obj["variants"]
    )
    highlights = ", ".join(js_string(h) for h in obj["highlights"])
    parts = [
        f"  {{ id: {js_string(obj['id'])}, slug: {js_string(obj['slug'])}, name: {js_string(obj['name'])},",
        f"    category: {js_string(obj['category'])}, subcategory: {js_string(obj['subcategory'])},",
        f"    tagline: {js_string(obj['tagline'])}, price: {obj['price']}, mrp: {obj['mrp']},",
        f"    rating: {obj['rating']}, reviews: {obj['reviews']},",
    ]
    flags = []
    if obj.get("bestseller"):
        flags.append("bestseller: true")
    if obj.get("natural"):
        flags.append("natural: true")
    if flags:
        parts.append(f"    {', '.join(flags)},")
    parts.append(f"    images: [{images}],")
    parts.append(f"    variants: [{variants}],")
    if highlights:
        parts.append(f"    highlights: [{highlights}],")
    if obj.get("description"):
        parts.append(f"    description: {js_string(obj['description'])},")
    if obj.get("allergen"):
        parts.append(f"    allergen: {js_string(obj['allergen'])},")
    if obj.get("bestFor"):
        parts.append(f"    bestFor: {js_string(obj['bestFor'])},")
    if obj.get("seoTitle"):
        parts.append(f"    seoTitle: {js_string(obj['seoTitle'])},")
    if obj.get("seoKeywords"):
        parts.append(f"    seoKeywords: {js_string(obj['seoKeywords'])},")
    if obj.get("status"):
        parts.append(f"    status: {js_string(obj['status'])},")
    if obj.get("sku"):
        parts.append(f"    sku: {js_string(obj['sku'])},")
    parts.append("  }")
    return "\n".join(parts)


def existing_export_block(name: str, fallback: str) -> str:
    """Keep curated gift hampers (not in Excel) when regenerating the catalog."""
    if not OUT_CATALOG.exists():
        return fallback
    text = OUT_CATALOG.read_text(encoding="utf-8")
    m = re.search(rf"(export const {name} = \[.*?\n\];)", text, re.S)
    if m and "silver-crystal-tray" in m.group(1):
        return m.group(1).strip()
    return fallback


# Original 10 Sukhmal gift hampers — never replace with placeholder festival SKUs.
HAMPERS_BLOCK = r'''
export const HAMPERS = [
  {
    id: 'h_silver_crystal_tray', slug: 'silver-crystal-tray', name: 'Silver Crystal Tray',
    tier: 'Premium', weight: '700 g', price: 3299, mrp: 3299, trayPrice: 2041,
    packagingKind: 'tray', packaging: 'Silver crystal tray',
    image: '/brand/hampers/hamper-silver-tray-hero.png',
    images: ['/brand/hampers/hamper-silver-tray-hero.png', '/brand/hampers/hamper-silver-tray-overhead.png', '/brand/hampers/hamper-silver-tray-detail.png'],
    tags: ['Wedding', 'Luxury', 'Festival'],
    contents: ['Badam 350g', 'Kaju 350g', 'Silver crystal tray'],
    description: '350g Badam and 350g Kaju presented in a silver mirrored tray with crystal-knob boxes. Tray value ₹2,041 (hamper ₹3,299 − products ₹1,258).',
  },
  {
    id: 'h_pearl_namkeen_basket', slug: 'pearl-namkeen-basket', name: 'Pearl Namkeen Basket',
    tier: 'Luxury', weight: '2.2 kg', price: 4399, mrp: 4399, trayPrice: 484,
    packagingKind: 'basket', packaging: 'Tan rope basket with pearls',
    image: '/brand/hampers/hamper-tan-rope-hero.png',
    images: ['/brand/hampers/hamper-tan-rope-hero.png', '/brand/hampers/hamper-tan-rope-angle.png', '/brand/hampers/hamper-tan-rope-detail.png'],
    tags: ['Wedding', 'Festival', 'Luxury'],
    contents: ['Pista 500g', 'Kaju 500g', 'Badam 500g', 'Roasted Namkeen 3 boxes', 'Basket'],
    description: '500g Pista, 500g Kaju, 500g Badam and 3 boxes of roasted namkeen in a tan rope basket with pearls and pompoms.',
  },
  {
    id: 'h_navy_peacock_box', slug: 'navy-peacock-box', name: 'Navy Peacock Box',
    tier: 'Premium', weight: '1 kg', price: 3399, mrp: 3399, trayPrice: 1603,
    packagingKind: 'box', packaging: 'Navy peacock gift box',
    image: '/brand/hampers/hamper-navy-crocodile-closed-hero.png',
    images: ['/brand/hampers/hamper-navy-crocodile-closed-hero.png', '/brand/hampers/hamper-navy-crocodile-open.png', '/brand/hampers/hamper-navy-crocodile-overhead.png'],
    tags: ['Wedding', 'Luxury', 'Corporate', 'Festival'],
    contents: ['Kaju 250g', 'Badam 250g', 'Pista 250g', 'Kishmish 250g', 'Decorative box'],
    description: '250g each of Kaju, Badam, Pista and Kishmish in a navy gift box with a peacock lid.',
  },
  {
    id: 'h_ganesha_blessing_box', slug: 'ganesha-blessing-box', name: 'Ganesha Blessing Box',
    tier: 'Deluxe', weight: '500 g', price: 1699, mrp: 1699, trayPrice: 801,
    packagingKind: 'box', packaging: 'Sage-and-gold window box',
    image: '/brand/hampers/hamper-ganesha-goldbox-hero.png',
    images: ['/brand/hampers/hamper-ganesha-goldbox-hero.png', '/brand/hampers/hamper-ganesha-goldbox-overhead.png', '/brand/hampers/hamper-sage-window-hero.png'],
    tags: ['Festival', 'Diwali', 'Rakhi', 'Wedding'],
    contents: ['Kaju 250g', 'Badam 250g', 'Ganesh ji', 'Diya'],
    description: '250g Kaju, 250g Badam, Ganesh ji and a diya in a sage-and-gold window box.',
  },
  {
    id: 'h_classic_four_nut_basket', slug: 'classic-four-nut-basket', name: 'Classic Four Nut Basket',
    tier: 'Premium', weight: '1 kg', price: 3299, mrp: 3299, trayPrice: 1503,
    packagingKind: 'basket', packaging: 'Round wicker basket',
    image: '/brand/hampers/hamper-classic-basket-hero.png',
    images: ['/brand/hampers/hamper-classic-basket-hero.png', '/brand/hampers/hamper-classic-basket-angle.png', '/brand/hampers/hamper-classic-basket-detail.png'],
    tags: ['Festival', 'Birthday', 'Wedding'],
    contents: ['Kaju 250g', 'Badam 250g', 'Pista 250g', 'Kishmish 250g', 'Basket'],
    description: '250g each of Kaju, Badam, Pista and Kishmish in a round wicker basket with pearls and flowers.',
  },
  {
    id: 'h_orchard_mixed_basket', slug: 'orchard-mixed-basket', name: 'Orchard Mixed Basket',
    tier: 'Premium', weight: '1.5 kg', price: 3299, mrp: 3299, trayPrice: 605,
    packagingKind: 'basket', packaging: 'Festive woven basket',
    image: '/brand/hampers/hamper-orchard-basket-hero.png',
    images: ['/brand/hampers/hamper-orchard-basket-hero.png', '/brand/hampers/hamper-orchard-basket-detail.png', '/brand/hampers/hamper-orchard-basket-angle.png'],
    tags: ['Festival', 'Birthday', 'Wedding'],
    contents: ['Kaju 250g', 'Badam 250g', 'Pista 250g', 'Raisins 250g', 'Mix Seeds 250g', 'Apricot 250g', 'Basket'],
    description: '250g each of Kaju, Badam, Pista, Raisins, Mix Seeds and Apricot in a festive woven basket.',
  },
  {
    id: 'h_grand_celebration_basket', slug: 'grand-celebration-basket', name: 'Grand Celebration Basket',
    tier: 'Luxury', weight: '3 kg', price: 6399, mrp: 6399, trayPrice: 806,
    packagingKind: 'basket', packaging: 'Large round celebration basket',
    image: '/brand/hampers/hamper-grand-basket-hero.png',
    images: ['/brand/hampers/hamper-grand-basket-hero.png', '/brand/hampers/hamper-grand-basket-overhead.png', '/brand/hampers/hamper-grand-basket-detail.png'],
    tags: ['Wedding', 'Luxury', 'Festival', 'Corporate'],
    contents: ['Roasted Namkeen 750g', 'Kaju 500g', 'Badam 500g', 'Pista 500g', 'Kishmish 500g', 'Walnut 250g', 'Basket'],
    description: '750g roasted namkeen, 500g each of Kaju, Badam, Pista and Kishmish, plus 250g Walnut in a large round basket.',
  },
  {
    id: 'h_pink_tulle_basket', slug: 'pink-tulle-basket', name: 'Pink Tulle Basket',
    tier: 'Premium', weight: '1.5 kg', price: 3599, mrp: 3599, trayPrice: 405,
    packagingKind: 'basket', packaging: 'Rope basket with pink tulle',
    image: '/brand/hampers/hamper-pink-tulle-hero.png',
    images: ['/brand/hampers/hamper-pink-tulle-hero.png', '/brand/hampers/hamper-pink-tulle-angle.png', '/brand/hampers/hamper-pink-tulle-front.png'],
    tags: ['Birthday', 'Festival', 'Wedding'],
    contents: ['Kaju 250g', 'Badam 250g', 'Pista 250g', 'Kishmish 250g', 'Akhrot 250g', 'Roasted Namkeen', 'Basket'],
    description: '250g each of Kaju, Badam, Pista, Kishmish and Akhrot, plus roasted namkeen, in a rope basket with pink tulle.',
  },
  {
    id: 'h_royal_copper_tray', slug: 'royal-copper-tray', name: 'Royal Copper Tray',
    tier: 'Luxury', weight: '2 kg', price: 4299, mrp: 4299, trayPrice: 803,
    packagingKind: 'tray', packaging: 'Ornate round copper tray',
    image: '/brand/hampers/hamper-copper-tray-hero.png',
    images: ['/brand/hampers/hamper-copper-tray-hero.png', '/brand/hampers/hamper-copper-tray-overhead.png', '/brand/hampers/hamper-copper-tray-detail.png'],
    tags: ['Wedding', 'Luxury', 'Festival', 'Diwali', 'Eid'],
    contents: ['Cashew 500g', 'Almond 500g', 'Raisins 500g', 'Pistachio 500g', 'Copper tray'],
    description: '500g each of Cashew, Almond, Raisins and Pistachio arranged on an ornate round copper tray.',
  },
  {
    id: 'h_gold_elephant_stand', slug: 'gold-elephant-stand', name: 'Gold Elephant Stand',
    tier: 'Luxury', weight: '1 kg', price: 3999, mrp: 3999, trayPrice: 2203,
    packagingKind: 'tray', packaging: 'Gold elephant stand',
    image: '/brand/hampers/hamper-gold-elephant-hero.png',
    images: ['/brand/hampers/hamper-gold-elephant-hero.png', '/brand/hampers/hamper-gold-elephant-profile.png', '/brand/hampers/hamper-gold-elephant-detail.png'],
    tags: ['Wedding', 'Luxury', 'Festival', 'Diwali'],
    contents: ['Kaju 250g', 'Badam 250g', 'Pista 250g', 'Kishmish 250g', 'Gold elephant stand'],
    description: '250g each of Kaju, Badam, Pista and Kishmish presented on an ornate gold elephant stand.',
  },
];
'''.strip()

FESTIVALS_BLOCK = r'''
export const FESTIVALS = [
  { key: 'diwali',    name: 'Diwali',    hue: '#E8A11A', copy: 'Light up celebrations with our signature Diwali hampers.', hero: verifiedImg('diwali-hero') },
  { key: 'rakhi',     name: 'Rakhi',     hue: '#B4587A', copy: 'Sisterly love, sweetened with premium dry fruits.',        hero: verifiedImg('rakhi-hero') },
  { key: 'eid',       name: 'Eid',       hue: '#4E8C4E', copy: 'Elegant Ajwa & Medjool hampers for the holy month.',        hero: verifiedImg('eid-hero') },
  { key: 'christmas', name: 'Christmas', hue: '#8C1F28', copy: 'Warm, spiced gifting for the festive season.',                hero: verifiedImg('christmas-hero') },
  { key: 'new-year',  name: 'New Year',  hue: '#3E2715', copy: 'Ring in the new year with premium indulgence.',              hero: verifiedImg('new-year-hero') },
];
'''.strip()

TESTIMONIALS_BLOCK = r'''
export const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Mumbai',    rating: 5, verified: true, text: 'The Royal Gold Hamper I sent to my mother-in-law for Diwali was the highlight of our gift exchange. Everyone kept asking where I ordered from!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Arjun Mehta',  city: 'Bengaluru', rating: 5, verified: true, text: 'We’ve been ordering corporate hampers from Sukhmal for 3 years. The consistency, packaging, and delivery timing are always spot-on.',                     avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { name: 'Nikita Verma', city: 'Delhi',     rating: 5, verified: true, text: 'Freshness like I’ve never seen. The Medjool dates were plump and syrupy — like they were picked yesterday.',                                        avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { name: 'Rakesh Iyer',  city: 'Chennai',   rating: 4, verified: true, text: 'Loved the Build-Your-Own hamper feature. Curated exactly what my father likes and it arrived beautifully packed.',                                            avatar: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { name: 'Sanya Kapoor', city: 'Pune',      rating: 5, verified: true, text: 'Beautiful gifting for my daughter’s wedding welcome. Guests loved the personal card touch. Highly recommend!',                                        avatar: 'https://randomuser.me/api/portraits/women/25.jpg' },
];
'''.strip()


def main():
    print("Loading master listings…")
    master = load_master_rows()
    print(f"  {len(master)} products")

    print("Mapping all embedded product images (Image 1–5)…")
    embeds = extract_row_images()
    print(f"  rows with images: {len(embeds)}")
    print(
        "  image counts:",
        {n: sum(1 for v in embeds.values() if len(v) == n) for n in sorted({len(v) for v in embeds.values()})},
    )

    # Update gallery JPEGs in place. Never wipe the folder — that deleted
    # sharper iCloud originals and leftover assets on a full import.
    OUT_IMG.mkdir(parents=True, exist_ok=True)

    products = []
    used_slugs = set()
    issues = []
    cat_counts = defaultdict(int)

    for row in master:
        name = row["name"]
        slug = slugify(name)
        if slug in used_slugs:
            slug = slugify(f"{name}-{row['sno']}")
        used_slugs.add(slug)

        category = map_category(row["excel_category"], name)
        cat_counts[category] += 1

        p250 = row["price_250"]
        p500 = row["price_500"]
        p1kg = row["price_1kg"]
        if p250 is None or p500 is None or p1kg is None:
            issues.append(f"Missing price for {name}")
            continue

        variants = [
            {"w": "250g", "price": p250},
            {"w": "500g", "price": p500},
            {"w": "1kg", "price": p1kg},
        ]

        # MRP is display-only (not a sheet column) — modest strikethrough above sheet price
        mrp_250 = round_mrp(p250)

        rating, reviews = hash_rating(slug)
        tagline = one_line(row["short"] or row["seo_title"] or row["best_for"], 110)
        highlights = parse_highlights(row["highlights_raw"])
        description = clean_description(row["description"]) or tagline

        # images: excel row is 1-based; drawing uses 0-based (row 4 -> index 3)
        row0 = row["excel_row"] - 1
        img_embeds = embeds.get(row0, [])
        images = save_product_images(slug, img_embeds) if img_embeds else []
        images = [f"/products/{slug}-{i}.jpg" for i in range(1, 6) if (OUT_IMG / f"{slug}-{i}.jpg").exists()] or images
        if not images:
            issues.append(f"No images for {name} (row {row['excel_row']})")
        elif len(images) != 5:
            issues.append(f"Expected 5 images for {name}, got {len(images)} (row {row['excel_row']})")

        natural = any(h in name.lower() for h in NATURAL_HINTS)
        sku = f"SK-{str(row['sno']).zfill(3)}" if row["sno"] is not None else f"SK-{slug[:12].upper()}"

        products.append(
            {
                "id": f"p_{slug.replace('-', '_')}"[:48],
                "slug": slug,
                "name": name,
                "category": category,
                "subcategory": row["excel_category"],
                "tagline": tagline,
                "price": p250,
                "mrp": mrp_250,
                "rating": rating,
                "reviews": reviews,
                "bestseller": name in BESTSELLER_NAMES,
                "natural": natural,
                "images": images,
                "variants": variants,
                "highlights": highlights,
                "description": description,
                "allergen": one_line(row["allergen"], 160),
                "bestFor": one_line(row["best_for"], 120),
                "seoTitle": one_line(row["seo_title"], 160),
                "seoKeywords": one_line(row["seo_keywords"], 240),
                "status": row["status"] or "Ready",
                "sku": sku,
            }
        )

    product_block = ",\n".join(emit_product(p) for p in products)

    def cover_for(cat_slug: str) -> str:
        for p in products:
            if p["category"] == cat_slug and p["images"]:
                return p["images"][0]
        for p in products:
            if p["images"]:
                return p["images"][0]
        return "/products/placeholder.jpg"

    cat_defs = [
        ("dry-fruits", "Dry Fruits", "Sun-dried premium selections"),
        ("nuts", "Nuts", "Crunchy, hand-picked wholesomeness"),
        ("seeds", "Seeds", "Nutrient-packed daily essentials"),
        ("dates", "Dates", "Nature's candy — rich & syrupy"),
        ("berries", "Berries", "Antioxidant-rich sweet-tart bites"),
        ("gift-hampers", "Gift Hampers", "Curated for every celebration"),
    ]
    cat_lines = []
    for slug, name, tagline in cat_defs:
        cover = cover_for(slug if slug != "gift-hampers" else "nuts")
        count = cat_counts.get(slug, 0)
        if slug == "gift-hampers":
            cover = "/brand/hampers/hamper-copper-tray-hero.png"
            cat_lines.append(
                f"  {{ slug: '{slug}', name: '{name}', tagline: {js_string(tagline)}, image: {js_string(cover)} }},"
            )
        else:
            cat_lines.append(
                f"  {{ slug: '{slug}', name: '{name}', tagline: {js_string(tagline)}, image: {js_string(cover)}, count: {count} }},"
            )

    catalog = f"""import {{ verifiedImg }} from './verifiedImages';

/**
 * Sukhmal catalog — sourced only from Product_Listings_Master.xlsx.
 * Product images: all sheet embeds (Image 1–5); small embeds enhanced for clarity.
 * Gift hampers retained from curated mock set (not present in Excel).
 * Regenerated by: scripts/import_excel_catalog.py
 */

export const CATEGORIES = [
{chr(10).join(cat_lines)}
];

export const PRODUCTS = [
{product_block}
];

{existing_export_block("HAMPERS", HAMPERS_BLOCK)}

{FESTIVALS_BLOCK}

{TESTIMONIALS_BLOCK}

export const INSTAGRAM_POSTS = Array.from({{ length: 6 }}).map((_, i) => verifiedImg('ig-' + i));
"""

    OUT_CATALOG.write_text(catalog, encoding="utf-8")
    print(f"\nWrote {OUT_CATALOG}")
    print(f"Products: {len(products)}")
    print("By app category:", dict(cat_counts))
    print(f"Images dir: {OUT_IMG} ({len(list(OUT_IMG.glob('*')))} files)")
    if issues:
        print(f"\nParsing notes ({len(issues)}):")
        for msg in issues[:40]:
            print(" -", msg)
        if len(issues) > 40:
            print(f" - … +{len(issues) - 40} more")


def sync_images_only():
    """Align `{slug}-1.jpg`…`{slug}-5.jpg` to Excel Image 1–5 without rewriting the catalog."""
    print("Loading master listings…")
    master = load_master_rows()
    print(f"  {len(master)} products")
    print("Mapping embedded product images (Image 1–5)…")
    embeds = extract_row_images()
    written = 0
    kept = 0
    used_slugs = set()
    for row in master:
        name = row["name"]
        slug = slugify(name)
        if slug in used_slugs:
            slug = slugify(f"{name}-{row['sno']}")
        used_slugs.add(slug)
        row0 = row["excel_row"] - 1
        img_embeds = embeds.get(row0, [])
        before = {
            i: (OUT_IMG / f"{slug}-{i}.jpg").stat().st_mtime
            for i in range(1, 6)
            if (OUT_IMG / f"{slug}-{i}.jpg").exists()
        }
        save_product_images(slug, img_embeds)
        for i in range(1, 6):
            dest = OUT_IMG / f"{slug}-{i}.jpg"
            if not dest.exists():
                continue
            if before.get(i) == dest.stat().st_mtime:
                kept += 1
            else:
                written += 1
                print(f"  wrote {dest.name}")
    print(f"\nUpdated {written} files, kept {kept} matching sharper locals.")


def _print_usage() -> None:
    print(
        """Import Sukhmal products from data/Product_Listings_Master.xlsx

  python3 scripts/import_excel_catalog.py --images-only
      Sync frontend/public/products/{slug}-1.jpg … -5.jpg to Excel Image 1–5
      (uses iCloud originals when present). Does not rewrite mockCatalog.js.

  python3 scripts/import_excel_catalog.py --catalog
      Rewrite frontend/src/data/mockCatalog.js from the sheet. Keeps the
      10 gift hampers. Updates product images in place (does not delete the folder).

  python3 scripts/import_excel_catalog.py --help
"""
    )


if __name__ == "__main__":
    args = set(sys.argv[1:])
    if not args or "--help" in args or "-h" in args:
        _print_usage()
        sys.exit(0)
    if "--images-only" in args:
        sync_images_only()
    elif "--catalog" in args:
        main()
    else:
        _print_usage()
        sys.exit(2)
