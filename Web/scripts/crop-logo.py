from PIL import Image

path = r"d:\CITIZEN COMPLAINT MANAGEMENT SYSTEM\Web\public\assets\branding\spo-logo.png"
im = Image.open(path).convert("RGBA")
pixels = im.load()
w, h = im.size
thresh = 12
minx, miny, maxx, maxy = w, h, 0, 0

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a < 8:
            continue
        if abs(r - 255) > thresh or abs(g - 255) > thresh or abs(b - 255) > thresh:
            minx = min(minx, x)
            miny = min(miny, y)
            maxx = max(maxx, x)
            maxy = max(maxy, y)

pad = 20
minx = max(0, minx - pad)
miny = max(0, miny - pad)
maxx = min(w - 1, maxx + pad)
maxy = min(h - 1, maxy + pad)
cropped = im.crop((minx, miny, maxx + 1, maxy + 1))
cw, ch = cropped.size
side = max(cw, ch)
sq = Image.new("RGBA", (side, side), (255, 255, 255, 255))
sq.paste(cropped, ((side - cw) // 2, (side - ch) // 2), cropped)

mark = r"d:\CITIZEN COMPLAINT MANAGEMENT SYSTEM\Web\public\assets\branding\spo-logo-mark.png"
sq.save(mark, "PNG")
sq.save(path, "PNG")
print("ok", (minx, miny, maxx, maxy), "from", (w, h), "->", sq.size)
