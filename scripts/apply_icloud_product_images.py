#!/usr/bin/env python3
"""Map iCloud product photos onto website files — explicit names only, no guessing."""
from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/images"
DEST = ROOT / "frontend" / "public" / "products"
CATALOG = ROOT / "frontend" / "src" / "data" / "mockCatalog.js"

MAX_SIDE = 1600
JPEG_QUALITY = 90
CANVAS = (247, 241, 232)

# Every iCloud filename stem → catalog slug. Aliases listed explicitly.
KEY_TO_SLUG = {
    "amla_murabba": "amla-murabba",
    "anjeer_jumbo": "anjeer-jumbo",
    "anjeer_medium": "anjeer-medium",
    "anjeer_small": "anjeer-small",
    "apple": "apple",
    "apple_dried": "apple",
    "apple_murabba": "apple-murabba",
    "badam_as": "badam-as",
    "badam_cf": "badam-cf",
    "badam_roasted": "badam-roasted",
    "beetroot_chips": "beetroot-chips",
    "black_kishmish": "black-kishmish",
    "blue_berry": "blue-berry",
    "blueberry": "blue-berry",
    "blueberry_dried": "blue-berry",
    "brazil_nuts": "brazil-nuts",
    "broccoli_chips": "broccoli-chips",
    "cherry": "cherry",
    "cherry_dried": "cherry",
    "chia_seeds": "chia-seeds",
    "chilgoza_giri": "pine-nuts-chilgoza-giri",
    "chilgoza_inshell": "pine-nut-chilgoza-in-shell",
    "corn_chips": "corn-chips",
    "cranberries": "cranberries",
    "dried_apple": "apple",
    "dried_cherry": "cherry",
    "dried_kiwi": "kiwi",
    "dried_mango": "mango",
    "dried_pineapple": "pineapple",
    "flax_seeds": "flax-seeds",
    "gaund_katira": "gaund-katira",
    "golden_berry": "golden-berry",
    "green_cardamom": "green-cardamom",
    "green_pista": "green-pista",
    "harad_ka_murabba": "harad-ka-murabba",
    "harad_murabba": "harad-ka-murabba",
    "hazel_nut": "hazel-nut",
    "irani_mamra_jumbo": "irani-mamra-jumbo",
    "irani_mamra_medium": "irani-mamra-medium",
    "irani_mamra_small": "irani-mamra-small",
    "jalebi_gaund": "jalebi-gaund",
    "jawar_puff": "jawar-puff",
    "jowar_puff": "jawar-puff",
    "kaju_180n": "kaju-180-n",
    "kaju_210n": "kaju-210-n",
    "kaju_240n": "kaju-240-n",
    "kaju_320n": "kaju-320-n",
    "kaju_fry_salted": "kaju-fry-salted",
    "kaju_masala": "kaju-masala",
    "kaju_roasted": "kaju-roasted",
    "kesar_mishri": "kesar-mishri",
    "kharbuja_giri": "kharbuja-giri",
    "khubani": "khubani-apricot",
    "khubani_apricot": "khubani-apricot",
    "khus_khus": "khus-khus",
    "kishmish_indian": "kishmish-indian",
    "kishmish_indian_long": "kishmish-indian-long",
    "kishmish_kandhari": "kishmish-kandhari",
    "kishmish_long": "kishmish-indian-long",
    "kiwi": "kiwi",
    "kiwi_dried": "kiwi",
    "macadamia_nut": "macadamia-nut",
    "makhana": "makhana",
    "mamra_jumbo": "irani-mamra-jumbo",
    "mamra_medium": "irani-mamra-medium",
    "mamra_small": "irani-mamra-small",
    "mango": "mango",
    "mango_candy": "mango-candy",
    "mango_dried": "mango",
    "medjool_dates": "medjoul-dates",
    "medjoul_dates": "medjoul-dates",
    "melon_seeds": "melon-seeds",
    "millets_bhujia": "millets-bhujia",
    "millets_namkeen": "millets-namkeen",
    "mishri_crystal": "mishri-crystal",
    "mishri_dhaga": "mishri-dhaga",
    "mix_berries": "mix-berrys",
    "mix_berrys": "mix-berrys",
    "mix_fruit_chips": "mix-fruits-chips",
    "mix_fruits": "mix-fruits",
    "mix_fruits_chips": "mix-fruits-chips",
    "mix_nuts": "mix-nuts",
    "mix_seeds": "mix-seeds",
    "mix_veg_chips": "mix-veg-chips",
    "munakka_basic": "munakka-basic",
    "munakka_premium": "munakka-premium",
    "nachos": "nachos",
    "paan_mix_saunf": "paan-mix-saunf",
    "pecan_nut": "pecan-nut",
    "pine_nut_inshell": "pine-nut-chilgoza-in-shell",
    "pine_nuts_giri": "pine-nuts-chilgoza-giri",
    "pine_nuts_inshell": "pine-nut-chilgoza-in-shell",
    "pineapple": "pineapple",
    "pineapple_dried": "pineapple",
    "pista": "pista",
    "pista_green_barik": "pista-green-barik",
    "pista_irani": "pista-irani",
    "pumpkin_seeds": "pumpkin-seeds",
    "quinoa_fingers": "quinoa-fingers",
    "roasted_namkeen": "roasted-namkeen",
    "sabza_seeds": "sabza-seeds",
    "silver_cardamom": "silver-cardamom",
    "silver_mishri": "silver-mishri",
    "soya_sticks": "soya-sticks",
    "sunflower_seeds": "sunflower-seeds",
    "sweet_saunf": "sweet-saunf",
    "walnut_basic": "walnut-basic",
    "walnut_in_shell": "walnut-in-shell",
    "walnut_inshell": "walnut-in-shell",
    "walnut_premium": "walnut-premium",
    "white_til": "white-til",
}

PAT_IMAGE_N = re.compile(r"^(.+)_image([1-5])\.(jpg|jpeg|png|webp)$", re.I)
PAT_IMG3 = re.compile(r"^(.+)_img3\.(jpg|jpeg|png|webp)$", re.I)
PAT_NUTRITION = re.compile(r"^\d+_(.+)_nutrition\.(jpg|jpeg|png|webp)$", re.I)


def parse_file(path: Path, folder: str):
    name = path.name
    m = PAT_NUTRITION.match(name)
    if m and folder == "image5":
        return m.group(1).lower(), 5
    m = PAT_IMG3.match(name)
    if m and folder == "image3":
        return m.group(1).lower(), 3
    m = PAT_IMAGE_N.match(name)
    if m:
        key, slot = m.group(1).lower(), int(m.group(2))
        expected = f"image{slot}"
        if folder != expected:
            raise SystemExit(f"Folder/slot mismatch: {folder}/{name}")
        return key, slot
    raise SystemExit(f"Unparsed file: {folder}/{name}")


def catalog_slugs():
    text = CATALOG.read_text()
    return re.findall(r'\{ id: "p_[^"]+", slug: "([^"]+)"', text)


def to_jpeg(src: Path, dest: Path) -> None:
    im = Image.open(src)
    im = im.convert("RGBA")
    canvas = Image.new("RGBA", im.size, CANVAS + (255,))
    canvas.alpha_composite(im)
    rgb = canvas.convert("RGB")
    w, h = rgb.size
    longest = max(w, h)
    if longest > MAX_SIDE:
        scale = MAX_SIDE / longest
        rgb = rgb.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    rgb.save(dest, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def collect():
    assignments = {}  # (slug, slot) -> (src, key)
    unmapped = []
    for folder in sorted(p for p in SRC.iterdir() if p.is_dir()):
        for f in sorted(folder.iterdir()):
            if f.name.startswith("."):
                continue
            key, slot = parse_file(f, folder.name)
            slug = KEY_TO_SLUG.get(key)
            if not slug:
                unmapped.append((key, folder.name, f.name))
                continue
            pair = (slug, slot)
            if pair in assignments:
                prev = assignments[pair]
                raise SystemExit(
                    f"COLLISION slot {slot} for {slug}:\n  {prev[0].name} (key={prev[1]})\n  {f.name} (key={key})"
                )
            assignments[pair] = (f, key)
    return assignments, unmapped


def main():
    apply = "--apply" in sys.argv
    slugs = catalog_slugs()
    slug_set = set(slugs)
    unknown_slugs = sorted(set(KEY_TO_SLUG.values()) - slug_set)
    if unknown_slugs:
        raise SystemExit(f"Map points at unknown slugs: {unknown_slugs}")

    assignments, unmapped = collect()
    if unmapped:
        print("UNMAPPED KEYS:")
        for row in unmapped:
            print(" ", row)
        raise SystemExit("Abort: unmapped iCloud keys")

    print(f"catalog products: {len(slugs)}")
    print(f"icloud files mapped: {len(assignments)}")
    print()
    print(f"{'slug':40s}  1  2  3  4  5")
    print("-" * 58)
    missing_slots = []
    for slug in slugs:
        marks = []
        for slot in range(1, 6):
            ok = (slug, slot) in assignments
            marks.append("Y" if ok else ".")
            if not ok:
                missing_slots.append((slug, slot))
        print(f"{slug:40s}  {'  '.join(marks)}")

    print()
    print(f"slots that will be replaced: {len(assignments)}")
    print(f"slots with no iCloud file: {len(missing_slots)}")

    fills = {}
    for slug, slot in missing_slots:
        dest = DEST / f"{slug}-{slot}.jpg"
        if dest.exists():
            print(f"  keep existing {dest.name}")
            continue
        # Same product only — prefer a real product photo over the nutrition label.
        donor = None
        for cand in (1, 3, 2, 4, 5):
            if cand == slot:
                continue
            if (slug, cand) in assignments:
                donor = assignments[(slug, cand)]
                break
        if not donor:
            raise SystemExit(f"No iCloud or existing file for {dest.name}")
        fills[(slug, slot)] = donor
        print(f"  fill {dest.name} from same product {donor[0].name}")

    if not apply:
        print("\nDry-run only. Re-run with --apply to write files.")
        return

    written = 0
    for (slug, slot), (src, key) in sorted({**assignments, **fills}.items()):
        dest = DEST / f"{slug}-{slot}.jpg"
        to_jpeg(src, dest)
        written += 1
        print(f"wrote {dest.name:42s}  from {src.parent.name}/{src.name}  ({key})")
    print(f"\nDone. Wrote {written} product images.")


if __name__ == "__main__":
    main()
