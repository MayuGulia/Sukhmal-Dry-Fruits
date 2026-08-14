"""
Import Sukhmal products from Excel workbooks into frontend mock catalog.

Sources:
  - Dry_Fruits_Price_List_excelsheet.xlsx (prices / categories)
  - Product_Listings_Master.xlsx (copy + embedded images)

Outputs:
  - frontend/public/products/<slug>-{1,2}.jpg  (hi-res embeds)
  - frontend/src/data/mockCatalog.js
"""

from __future__ import annotations

import json
import re
import zipfile
from collections import defaultdict
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree as ET

import openpyxl
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PRICE_XLSX = ROOT / "Dry_Fruits_Price_List_excelsheet.xlsx"
MASTER_XLSX = ROOT / "Product_Listings_Master.xlsx"
OUT_IMG = ROOT / "frontend" / "public" / "products"
OUT_CATALOG = ROOT / "frontend" / "src" / "data" / "mockCatalog.js"

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
    """Slightly higher display MRP ending in 99."""
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
            }
        )
    wb.close()
    return rows


def load_price_printed():
    """Printed Price (₹/Kg) from filterable sheet, keyed by product name."""
    wb = openpyxl.load_workbook(PRICE_XLSX, data_only=True)
    ws = wb["All Products (Filterable)"]
    out = {}
    for r in range(2, (ws.max_row or 1) + 1):
        name = ws.cell(r, 2).value
        printed = ws.cell(r, 3).value
        if name and printed is not None:
            out[clean_text(name)] = int(printed)
    wb.close()
    return out


def extract_hires_images():
    """Return dict excel_row_0idx -> list of (col, zip_path) for hi-res images only."""
    NS = {"xdr": "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"}
    by_row = defaultdict(list)
    with zipfile.ZipFile(MASTER_XLSX) as z:
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
            if im.size[0] >= 400:
                by_row[row].append((col, media, data, im.format or "PNG"))
    # sort by column so Image order is stable
    for row in by_row:
        by_row[row].sort(key=lambda x: x[0])
    return by_row


def save_product_images(slug: str, embeds: list) -> list[str]:
    """Save hi-res embeds as JPEG under /products/<slug>-N.jpg. Returns public paths."""
    paths = []
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for i, (_col, _media, data, fmt) in enumerate(embeds, start=1):
        im = Image.open(BytesIO(data))
        if im.mode in ("RGBA", "P"):
            im = im.convert("RGB")
        fname = f"{slug}-{i}.jpg"
        dest = OUT_IMG / fname
        im.save(dest, "JPEG", quality=88, optimize=True)
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
    if obj.get("sku"):
        parts.append(f"    sku: {js_string(obj['sku'])},")
    parts.append("  }")
    return "\n".join(parts)


# Preserve existing hampers / festivals / testimonials from current file structure
HAMPERS_BLOCK = r'''
export const HAMPERS = [
  { id: 'h_royal_gold', slug: 'royal-gold-hamper', name: 'Royal Gold Hamper', tier: 'Luxury', weight: '1.2 kg', price: 2499, mrp: 2999, image: verifiedImg('royal-gold'), tags: ['Wedding', 'Luxury'], contents: ['Californian Almonds 250g', 'Kashmiri Walnuts 200g', 'Medjool Dates 250g', 'Roasted Cashews 250g', 'Dried Apricots 150g', 'Gift Card + Wooden Basket'] },
  { id: 'h_diwali_delight', slug: 'diwali-delight-hamper', name: 'Diwali Delight Hamper', tier: 'Premium', weight: '900 g', price: 1799, mrp: 2199, image: verifiedImg('diwali'), tags: ['Festival', 'Diwali'], contents: ['Almonds 200g', 'Cashews 200g', 'Pistachios 150g', 'Raisins 200g', 'Anjeer 150g', 'Diyas + Gift Card'] },
  { id: 'h_wedding_classic', slug: 'wedding-classic-hamper', name: 'Wedding Classic Hamper', tier: 'Deluxe', weight: '1.5 kg', price: 3499, mrp: 3999, image: verifiedImg('wedding-c'), tags: ['Wedding'], contents: ['Almonds 300g', 'Cashews 300g', 'Pistachios 250g', 'Walnuts 250g', 'Medjool Dates 200g', 'Wooden Box + Ribbon'] },
  { id: 'h_corporate_elite', slug: 'corporate-elite-hamper', name: 'Corporate Elite Hamper', tier: 'Premium', weight: '800 g', price: 1499, mrp: 1899, image: verifiedImg('corp-elite'), tags: ['Corporate'], contents: ['Almonds 200g', 'Cashews 200g', 'Pistachios 100g', 'Cranberries 100g', 'Branded Box'] },
  { id: 'h_birthday_bliss', slug: 'birthday-bliss-hamper', name: 'Birthday Bliss Hamper', tier: 'Premium', weight: '700 g', price: 1299, mrp: 1599, image: verifiedImg('birthday'), tags: ['Birthday'], contents: ['Almonds 150g', 'Cashews 150g', 'Chocolate-covered Dates', 'Personalized Card'] },
  { id: 'h_rakhi_special', slug: 'rakhi-special-hamper', name: 'Rakhi Special Hamper', tier: 'Deluxe', weight: '1 kg', price: 1999, mrp: 2499, image: verifiedImg('rakhi'), tags: ['Festival', 'Rakhi'], contents: ['Almonds 200g', 'Cashews 200g', 'Pistachios 150g', 'Anjeer 150g', 'Rakhi + Roli-Chawal', 'Gift Card'] },
  { id: 'h_eid_mubarak', slug: 'eid-mubarak-hamper', name: 'Eid Mubarak Hamper', tier: 'Premium', weight: '900 g', price: 1899, mrp: 2299, image: verifiedImg('eid'), tags: ['Festival', 'Eid'], contents: ['Ajwa Dates 200g', 'Almonds 200g', 'Pistachios 150g', 'Anjeer 150g', 'Gift Card'] },
  { id: 'h_christmas_cheer', slug: 'christmas-cheer-hamper', name: 'Christmas Cheer Hamper', tier: 'Deluxe', weight: '1.1 kg', price: 2299, mrp: 2799, image: verifiedImg('christmas'), tags: ['Festival', 'Christmas'], contents: ['Assorted Nuts Tin', 'Dried Cranberries', 'Chocolate Almonds', 'Xmas Card'] },
  { id: 'h_new_year_glow', slug: 'new-year-glow-hamper', name: 'New Year Glow Hamper', tier: 'Premium', weight: '1 kg', price: 1799, mrp: 2199, image: verifiedImg('new-year'), tags: ['Festival', 'New Year'], contents: ['Almonds 250g', 'Cashews 200g', 'Dates 200g', 'Berries 150g', 'Gift Card'] },
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

    print("Loading printed prices…")
    printed = load_price_printed()

    print("Mapping hi-res embedded images…")
    embeds = extract_hires_images()
    print(f"  rows with hi-res: {len(embeds)}")

    # Clear old product images
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    for old in OUT_IMG.glob("*"):
        if old.is_file():
            old.unlink()

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

        # Prefer printed kg as MRP basis for 250g display: printed/4 rounded to 99, else +18%
        printed_kg = printed.get(name)
        if printed_kg and printed_kg > p1kg:
            mrp_250 = max(round_mrp(p250), int(round(printed_kg / 4 / 100) * 100 + 99))
            if mrp_250 <= p250:
                mrp_250 = round_mrp(p250)
        else:
            mrp_250 = round_mrp(p250)

        rating, reviews = hash_rating(slug)
        tagline = one_line(row["short"] or row["seo_title"] or row["best_for"], 110)
        highlights = parse_highlights(row["highlights_raw"])
        description = clean_description(row["description"]) or tagline

        # images: excel row is 1-based; drawing uses 0-based (row 4 -> index 3)
        row0 = row["excel_row"] - 1
        img_embeds = embeds.get(row0, [])
        images = save_product_images(slug, img_embeds) if img_embeds else []
        if not images:
            issues.append(f"No hi-res image for {name} (row {row['excel_row']})")
            # leave empty — PDP has fallback; prefer not inventing Unsplash for real catalog

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
                "sku": sku,
            }
        )

    product_block = ",\n".join(emit_product(p) for p in products)

    catalog = f"""import {{ verifiedImg }} from './verifiedImages';

/**
 * Sukhmal catalog — sourced from Excel price list + Product_Listings_Master.
 * Product images live under /public/products (extracted hi-res embeds).
 * Gift hampers retained from curated mock set (not present in Excel).
 * Regenerated by: scripts/import_excel_catalog.py
 */

export const CATEGORIES = [
  {{ slug: 'dry-fruits',   name: 'Dry Fruits',   tagline: 'Sun-dried premium selections',        image: verifiedImg('dry-fruits') }},
  {{ slug: 'nuts',         name: 'Nuts',         tagline: 'Crunchy, hand-picked wholesomeness', image: verifiedImg('nuts') }},
  {{ slug: 'seeds',        name: 'Seeds',        tagline: 'Nutrient-packed daily essentials',    image: verifiedImg('seeds') }},
  {{ slug: 'dates',        name: 'Dates',        tagline: 'Nature’s candy — rich & syrupy', image: verifiedImg('dates') }},
  {{ slug: 'berries',      name: 'Berries',      tagline: 'Antioxidant-rich sweet-tart bites',   image: verifiedImg('berries') }},
  {{ slug: 'gift-hampers', name: 'Gift Hampers', tagline: 'Curated for every celebration',       image: verifiedImg('gift-hampers') }},
];

export const PRODUCTS = [
{product_block}
];

{HAMPERS_BLOCK}

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


if __name__ == "__main__":
    main()
