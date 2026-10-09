"""Convert the existing MAo emblem into a Windows multi-resolution application icon.

Executed by the Windows GitHub Actions runner, avoiding checked-in binary files.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets" / "img" / "mao-logo.png"
OUTPUT = ROOT / "desktop" / "build" / "icon.ico"

source = Image.open(SOURCE).convert("RGBA")
size = 256
source.thumbnail((size - 12, size - 12), Image.Resampling.LANCZOS)
canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
canvas.alpha_composite(source, ((size - source.width) // 2, (size - source.height) // 2))
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT, format="ICO", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print(f"Created Windows icon: {OUTPUT} ({OUTPUT.stat().st_size} bytes)")
