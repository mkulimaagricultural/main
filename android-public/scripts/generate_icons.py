"""Generate launcher icons for the public MAo app from its official logo."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = root / "assets" / "img" / "mao-logo.png"
target = root / "android-public" / "app" / "src" / "main" / "res"
densities = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
logo = Image.open(source).convert("RGBA")
for density, size in densities.items():
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    resized = logo.copy()
    resized.thumbnail((int(size * .91), int(size * .91)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(resized, ((size - resized.width)//2,(size - resized.height)//2))
    dst = target / ("mipmap-" + density)
    dst.mkdir(parents=True, exist_ok=True)
    canvas.save(dst / "ic_launcher.png")
    canvas.save(dst / "ic_launcher_round.png")
print("Public MAo Android icons generated")
