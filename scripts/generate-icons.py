"""Generates the PWA PNG icons from the same geometry as public/icons/favicon.svg."""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
TOP = (59, 130, 246)
BOTTOM = (29, 78, 216)


def gradient(size: int) -> Image.Image:
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            pixels[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
    return image


def draw_mark(draw: ImageDraw.ImageDraw, size: int, scale: float, color) -> None:
    offset = size * (1 - scale) / 2
    unit = size * scale / 64

    def p(x: float, y: float):
        return (offset + x * unit, offset + y * unit)

    width = max(2, round(4 * unit))
    outline = [p(14, 24), p(32, 15), p(50, 24), p(50, 44), p(32, 53), p(14, 44), p(14, 24), p(32, 15)]
    draw.line(outline, fill=color, width=width, joint="curve")
    draw.line([p(14, 24), p(32, 33), p(50, 24)], fill=color, width=width, joint="curve")
    draw.line([p(32, 33), p(32, 53)], fill=color, width=width)


def icon(size: int, *, maskable: bool = False) -> Image.Image:
    background = gradient(size).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    radius = 0 if maskable else round(size * 14 / 64)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(background, mask=mask)
    draw_mark(ImageDraw.Draw(result), size, 0.62 if maskable else 1.0, (255, 255, 255, 255))
    return result


def badge(size: int) -> Image.Image:
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(result), size, 1.0, (255, 255, 255, 255))
    return result


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon(192).save(OUT / "icon-192.png")
    icon(512).save(OUT / "icon-512.png")
    icon(512, maskable=True).save(OUT / "icon-maskable-512.png")
    icon(180, maskable=True).convert("RGB").save(OUT / "apple-touch-icon.png")
    badge(96).save(OUT / "badge-96.png")


if __name__ == "__main__":
    main()
