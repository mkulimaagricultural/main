"""Create Android launcher icons from MAo's existing official logo (no new branding)."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = root / "assets" / "img" / "mao-logo.png"
target = root / "android" / "app" / "src" / "main" / "res"

# Android launcher densities relative to a 48x48 mdpi icon.
densities = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
logo = Image.open(source).convert("RGBA")
for density, size in densities.items():
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    resized = logo.copy()
    resized.thumbnail((int(size * 0.91), int(size * 0.91)), Image.Resampling.LANCZOS)
    icon.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    destination = target / ("mipmap-" + density)
    destination.mkdir(parents=True, exist_ok=True)
    icon.save(destination / "ic_launcher.png")
    icon.save(destination / "ic_launcher_round.png")
print("MAo Android launcher icons generated in all five densities")
