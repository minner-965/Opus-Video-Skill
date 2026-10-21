#!/usr/bin/env python3
"""compare.py <seq_dir> <out.jpg> <t1> <t2> ... — 把参考片与我渲染的同一时刻并排(左参考 / 右复刻),每行两组。
seq_dir 是 remotion render --sequence 的输出(element-0000.jpeg ...),30 fps。"""
import os, subprocess, sys, glob
from PIL import Image, ImageDraw, ImageFont

seq, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
is_video = os.path.isfile(seq)
files = [] if is_video else sorted(glob.glob(os.path.join(seq, "*.jp*g")) + glob.glob(os.path.join(seq, "*.png")))
first = 0 if is_video else int("".join(ch for ch in os.path.basename(files[0]).split(".")[0] if ch.isdigit()) or 0)
cw, ch = 480, 270
font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 18)
per_row = 2
rows = (len(ts) + per_row - 1) // per_row
sheet = Image.new("RGB", (per_row * (2 * cw + 12), rows * (ch + 6)), (128, 0, 128))
d = ImageDraw.Draw(sheet)
tmp = out + "._t.png"
for i, t in enumerate(ts):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", "ref/refB.mp4", "-frames:v", "1", "-vf", f"scale={cw}:{ch}", tmp], check=True)
    ref = Image.open(tmp).convert("RGB")
    if is_video:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", seq, "-frames:v", "1", "-vf", f"scale={cw}:{ch}", tmp], check=True)
        mine = Image.open(tmp).convert("RGB")
    else:
        k = int(round(t * 30)) - first
        mine = Image.open(files[max(0, min(k, len(files) - 1))]).convert("RGB").resize((cw, ch), Image.LANCZOS)
    x, y = (i % per_row) * (2 * cw + 12), (i // per_row) * (ch + 6)
    sheet.paste(ref, (x, y)); sheet.paste(mine, (x + cw, y))
    d.rectangle([x, y, x + 150, y + 22], fill=(200, 0, 200)); d.text((x + 4, y + 2), f"REF {t:5.2f}", font=font, fill="white")
    d.rectangle([x + cw, y, x + cw + 60, y + 22], fill=(0, 140, 0)); d.text((x + cw + 4, y + 2), "MINE", font=font, fill="white")
os.remove(tmp)
os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
sheet.save(out, quality=88); print(out, sheet.size)
