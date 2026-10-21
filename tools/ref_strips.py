import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
src, out, fps = "ref/refB.mp4", "ref/framesB/strips", 6.0
shots = json.load(open("ref/framesB/shots.json", encoding="utf-8"))
lo, hi = float(sys.argv[1]), float(sys.argv[2])
os.makedirs(out, exist_ok=True); font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 20)
t = lo; k = 0
while t < hi:
    ts = [round(t + i / fps, 3) for i in range(12) if t + i / fps < hi]
    sheet = Image.new("RGB", (4 * 480, 3 * 270), (128, 0, 128)); d = ImageDraw.Draw(sheet)
    for i, x in enumerate(ts):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{x:.3f}", "-i", src, "-frames:v", "1", "-vf", "scale=480:270", out + "/_t.png"], check=True)
        px, py = (i % 4) * 480, (i // 4) * 270
        sheet.paste(Image.open(out + "/_t.png").convert("RGB"), (px, py)); d.rectangle([px + 380, py + 244, px + 480, py + 270], fill=(200, 0, 200)); d.text((px + 386, py + 247), f"{x:6.2f}", font=font, fill=(255, 255, 255))
    name = f"{out}/strip_{int(t * 100):04d}.jpg"; sheet.save(name, quality=85); print(name); t += 12 / fps
os.remove(out + "/_t.png")