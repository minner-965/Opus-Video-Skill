#!/usr/bin/env python3
"""analyze_ref.py <video> [outdir] — 读取参考视频的"结构",不拷贝任何画面。
输出 <outdir>/ref_analysis.json + contact_sheet.jpg
依赖: ffmpeg/ffprobe, numpy, librosa, Pillow
"""
import json, re, subprocess, sys, os, colorsys
import numpy as np, librosa
from PIL import Image

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "ref/analysis_" + os.path.splitext(os.path.basename(src))[0]
os.makedirs(out, exist_ok=True)
sh = lambda *a: subprocess.run(a, capture_output=True, text=True)

# 1) 基本信息
p = json.loads(sh("ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", src).stdout)
v = next(s for s in p["streams"] if s["codec_type"] == "video")
fps = eval(v["r_frame_rate"]); dur = float(p["format"]["duration"])
info = dict(file=os.path.basename(src), duration=round(dur, 2), width=v["width"], height=v["height"], fps=round(fps, 2),
            orientation="竖屏" if v["height"] > v["width"] else "横屏", has_audio=any(s["codec_type"] == "audio" for s in p["streams"]))

# 2) 音频:BPM / 节拍 / 能量曲线
wav = f"{out}/audio.wav"
sh("ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "22050", wav)
y, sr = librosa.load(wav, sr=22050)
tempo, bf = librosa.beat.beat_track(y=y, sr=sr)
bpm = float(np.atleast_1d(tempo)[0]); beats = librosa.frames_to_time(bf, sr=sr)
rms = librosa.feature.rms(y=y)[0]; rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
step = 5
energy = [round(float(rms[(rt >= s) & (rt < s + step)].mean()), 3) for s in range(0, int(dur), step)]
# 简单分段:能量相对均值的高/低区间(粗略定位主歌/副歌)
mean_e = np.mean(energy)
sections = ["高" if e > mean_e * 1.15 else "低" if e < mean_e * 0.85 else "中" for e in energy]

# 3) 镜头切点
r = sh("ffmpeg", "-v", "info", "-i", src, "-vf", "select='gt(scene,0.25)',showinfo", "-an", "-f", "null", "-")
cuts = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", r.stderr)]
cuts = [c for i, c in enumerate(cuts) if i == 0 or c - cuts[i - 1] > 0.08]  # 合并相邻重复
if cuts:
    d = np.diff(cuts)
    beat_dist = [float(np.min(np.abs(beats - c))) for c in cuts]
    cut_stats = dict(count=len(cuts), median_shot_len=round(float(np.median(d)), 2) if len(d) else None,
                     fast_cuts_under_0_4s=int((d < 0.4).sum()),
                     cuts_on_beat_pct=round(100 * sum(x < 0.1 for x in beat_dist) / len(cuts)),
                     beats_per_median_shot=round(float(np.median(d)) * bpm / 60, 1) if len(d) else None)
else:
    cut_stats = dict(count=0, note="几乎没有硬切:大概率是连续运镜/形状连续转场/长镜头")

# 4) 主色板(忽略画面内容,只统计颜色)
def frames(n=24):
    for t in np.linspace(1, dur - 1, n):
        sh("ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", src, "-frames:v", "1", "-vf", "scale=160:-1", f"{out}/_f.png")
        yield np.array(Image.open(f"{out}/_f.png").convert("RGB")).reshape(-1, 3)
px = np.vstack(list(frames())); q = (px // 32) * 32 + 16
vals, cnt = np.unique(q, axis=0, return_counts=True)
bg = [("#%02x%02x%02x" % tuple(vals[i]), round(100 * cnt[i] / len(q), 1)) for i in np.argsort(-cnt)[:3]]
sat = {}
for r_, g_, b_ in px / 255.:
    h, s, vv = colorsys.rgb_to_hsv(r_, g_, b_)
    if s > .6 and vv > .5: k = int(h * 12) * 30; sat[k] = sat.get(k, 0) + 1
accent_hues = [h for h, _ in sorted(sat.items(), key=lambda x: -x[1])[:3]]
os.remove(f"{out}/_f.png")

# 5) 联系表(用来"看"画风和叙事结构)
every = max(dur / 20, 1)
sh("ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"fps=1/{every:.2f},scale=480:-1,tile=5x4", "-frames:v", "1", f"{out}/contact_sheet.jpg")

res = dict(info=info, music=dict(bpm=round(bpm, 1), bar_seconds_4_4=round(240 / bpm, 2), first_beats=[round(float(b), 2) for b in beats[:8]],
           energy_per_5s=energy, energy_levels=sections), cuts=dict(times=[round(c, 2) for c in cuts], **cut_stats),
           palette=dict(background_top3=bg, accent_hue_degrees=accent_hues))
json.dump(res, open(f"{out}/ref_analysis.json", "w"), ensure_ascii=False, indent=2)
print(json.dumps({k: res[k] for k in ("info", "cuts")}, ensure_ascii=False, indent=1)); print("bpm", res["music"]["bpm"], "| 背景色", bg, "| 强调色相°", accent_hues)
print("→", out)
