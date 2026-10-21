#!/usr/bin/env python3
"""tile_frames.py <frames_dir> <outdir> [cols=2] [rows=2] [cell_w=960] [pattern=] — 把关键帧拼成带文件名标签的审阅表。"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 2
rows = int(sys.argv[4]) if len(sys.argv) > 4 else 2
cw = int(sys.argv[5]) if len(sys.argv) > 5 else 960
pat = sys.argv[6] if len(sys.argv) > 6 else ""
os.makedirs(out, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.endswith(".jpg") and pat in f)
font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 22)
n = cols * rows
for k in range(0, len(files), n):
    chunk = files[k:k + n]
    ims = [Image.open(os.path.join(src, f)).convert("RGB") for f in chunk]
    ch = int(cw * ims[0].height / ims[0].width)
    sheet = Image.new("RGB", (cols * cw, rows * ch), (128, 0, 128))
    d = ImageDraw.Draw(sheet)
    for i, (f, im) in enumerate(zip(chunk, ims)):
        x, y = (i % cols) * cw, (i // cols) * ch
        sheet.paste(im.resize((cw, ch), Image.LANCZOS), (x, y))
        d.rectangle([x, y, x + 250, y + 28], fill=(200, 0, 200))
        d.text((x + 6, y + 3), f[:-4], font=font, fill=(255, 255, 255))
    name = f"sheet_{k // n + 1:02d}.jpg"
    sheet.save(os.path.join(out, name), quality=88)
    print(name, chunk[0], "…", chunk[-1])
