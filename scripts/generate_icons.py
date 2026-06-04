"""Generate KickMod extension icons (Kick-style bold K on green)."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Install Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

BG = (14, 14, 16, 255)
GREEN = (0, 230, 118, 255)
KICK_GREEN_DARK = (0, 200, 100, 255)

FONT_CANDIDATES = [
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/impact.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
]


def load_font(size: int):
    for path in FONT_CANDIDATES:
        p = Path(path)
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), BG)
    draw = ImageDraw.Draw(img)
    margin = max(2, size // 10)
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=max(4, size // 5),
        fill=KICK_GREEN_DARK,
    )
    font = load_font(int(size * 0.58))
    text = "K"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1] - max(0, size // 32)
    draw.text((x, y), text, fill=GREEN, font=font)
    return img


for s in (16, 48, 128):
    draw_icon(s).save(OUT / f"icon{s}.png")
print("Generated", list(OUT.glob("icon*.png")))
