#!/usr/bin/env python3
"""seq_sheet.py <seq_dir> <out.jpg> <fps> <cols> <t1> <t2> ... — 从渲染出的帧序列里取指定时刻拼成带时间标签的审阅表。"""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont

seq, out, fps, cols = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
ts = [float(x) for x in sys.argv[5:]]
files = sorted(glob.glob(os.path.join(seq, "*.jp*g")))
im0 = Image.open(files[0]); cw, ch = im0.size
rows = (len(ts) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cw, rows * ch), (128, 0, 128)); d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 16)
for i, t in enumerate(ts):
    k = min(len(files) - 1, int(round(t * fps)))
    x, y = (i % cols) * cw, (i // cols) * ch
    sheet.paste(Image.open(files[k]).convert("RGB"), (x, y))
    d.rectangle([x, y, x + 64, y + 20], fill=(200, 0, 200)); d.text((x + 4, y + 2), f"{t:6.1f}", font=font, fill="white")
sheet.save(out, quality=88); print(out, sheet.size)
