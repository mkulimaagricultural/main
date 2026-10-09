"""Generate a proper Windows multi-size icon from the official MAo brand logo."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets" / "img" / "mao-logo.png"
OUTPUT = ROOT / "desktop-public" / "build" / "icon.ico"

source = Image.open(SOURCE).convert("RGBA")
source.thumbnail((244, 244), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
canvas.alpha_composite(source, ((256 - source.width) // 2, (256 - source.height) // 2))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print(f"Windows app icon created: {OUTPUT}")
