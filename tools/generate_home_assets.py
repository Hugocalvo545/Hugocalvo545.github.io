"""Generate responsive photo variants and the OG image."""
import re
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(r"C:/Users/Hugo/Downloads/Currículum+Portfolio")
SCRATCH = Path(__file__).parent
src = Image.open(ROOT / "img" / "porfile.jpg").convert("RGB")

# --- photo variants ---
for size in (400, 200):
    im = src.resize((size, size), Image.LANCZOS)
    im.save(ROOT / "img" / f"hugo-{size}.webp", "WEBP", quality=82, method=6)
    try:
        im.save(ROOT / "img" / f"hugo-{size}.avif", "AVIF", quality=60)
        print(f"hugo-{size}: webp + avif")
    except Exception as e:
        print(f"hugo-{size}: webp ok, AVIF NO ({e.__class__.__name__})")

# --- Poppins TTF for og.png (css2 without modern UA returns ttf urls) ---
ttf_path = SCRATCH / "Poppins-700.ttf"
if not ttf_path.exists():
    css = urllib.request.urlopen(
        "https://fonts.googleapis.com/css2?family=Poppins:wght@700", timeout=30
    ).read().decode()
    url = re.search(r"url\((https://[^)]+\.ttf)\)", css).group(1)
    ttf_path.write_bytes(urllib.request.urlopen(url, timeout=30).read())

BG, ACCENT, TEXT, MUTED = "#0e1117", "#3ddc97", "#f3f4f6", "#9aa3b2"
og = Image.new("RGB", (1200, 630), BG)
d = ImageDraw.Draw(og)
f_big = ImageFont.truetype(str(ttf_path), 64)
f_small = ImageFont.truetype(str(ttf_path), 28)
f_tiny = ImageFont.truetype(str(ttf_path), 24)

d.rectangle([0, 0, 1200, 8], fill=ACCENT)
lines = ["Webs, software y visibilidad", "en ChatGPT para tu negocio."]
y = 180
for i, line in enumerate(lines):
    d.text((80, y), line, font=f_big, fill=TEXT)
    y += 82
d.text((80, y + 26), "hugocalvo", font=f_small, fill=TEXT)
w = d.textlength("hugocalvo", font=f_small)
d.text((80 + w, y + 26), ".dev", font=f_small, fill=ACCENT)
d.text((80, y + 70), "Desarrollador full-stack · Madrid", font=f_tiny, fill=MUTED)
og.save(ROOT / "img" / "og.png", "PNG", optimize=True)
print("og.png:", (ROOT / "img" / "og.png").stat().st_size // 1024, "KB")
for f in sorted((ROOT / "img").glob("hugo-*")):
    print(f.name, f.stat().st_size // 1024, "KB")
