#!/usr/bin/env python3
"""check_subs.py <vocals.wav> <captions.json> <captions_mix.json|-> <grid.json> <ref_analysis.json> <out.md>
自检(因为听不到):
 1) 每行起点:人声轨 RMS 在起点后 0.25 s 相对起点前 0.25 s 的上升倍数 + 起点 ±0.15 s 内是否有 onset;
 2) 人声轨对齐 vs 混音轨对齐 的行起点差;
 3) 参考切点吸附到最近的拍(±0.12 s):吸附前后偏差。字幕时间不动。"""
import json, sys
import numpy as np, librosa

voc, capf, mixf, gridf, af, out = sys.argv[1:7]
y, sr = librosa.load(voc, sr=22050)
hop = 256
rms = librosa.feature.rms(y=y, frame_length=1024, hop_length=hop)[0]
rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
on = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, units="time", backtrack=True)
floor = float(np.percentile(rms, 10)) + 1e-4
caps = json.load(open(capf, encoding="utf-8"))
mix = json.load(open(mixf, encoding="utf-8")) if mixf != "-" else None
rows, suspects = [], []
for k, c in enumerate(caps):
    t = c["start"]
    pre = float(rms[(rt >= t - 0.25) & (rt < t)].mean()) if t > 0.05 else floor
    post = float(rms[(rt >= t) & (rt < t + 0.25)].mean())
    ratio = post / max(pre, floor)
    d_on = float(np.min(np.abs(on - t))) if len(on) else 9
    dm = (mix[k]["start"] - t) if mix else 0.0
    why = []
    if post < 3 * floor: why.append("起点后人声能量很低")
    if d_on > 0.15: why.append(f"最近的起音在 {d_on:.2f} s 外")
    if abs(dm) > 0.15: why.append(f"两次对齐相差 {dm:+.2f} s")
    if len({x['t'] for x in c['chars']}) < len(c['chars']) * 0.7: why.append("多个字挤在同一时间")
    rows.append((c["i"], t, c["text"], pre, post, ratio, d_on, dm, ";".join(why)))
    if why: suspects.append(c["i"])

g = json.load(open(gridf, encoding="utf-8")); beats = np.array(g["beats"])
cuts = json.load(open(af, encoding="utf-8"))["cuts"]["times"]
snap = []
for c in cuts:
    b = float(beats[np.argmin(np.abs(beats - c))]); d = b - c
    snap.append((c, b if abs(d) <= 0.12 else c, d, abs(d) <= 0.12))
L = ["# 字幕自检报告(数据校验,不是听感)", "",
     f"人声轨:{voc};噪声底 RMS≈{floor:.4f};检出起音 {len(on)} 个。", "",
     "## 1. 每行起点", "", "| 行 | 起点 s | 歌词 | 起点前 RMS | 起点后 RMS | 上升倍数 | 距最近起音 s | 与混音轨对齐差 s | 可疑原因 |", "|---|---|---|---|---|---|---|---|---|"]
for r in rows:
    L.append(f"| {r[0]} | {r[1]:.2f} | {r[2]} | {r[3]:.4f} | {r[4]:.4f} | {r[5]:.1f}× | {r[6]:.2f} | {r[7]:+.2f} | {r[8] or '—'} |")
L += ["", f"**可疑行:{suspects or '无'}**", "", "## 2. 切点吸附(只动镜头切点,字幕时间不动)", "",
      f"节拍网格:{g['bpm']} BPM,拍长 {g['beat_seconds']} s,offset {g['offset']} s。", "",
      "| 参考切点 s | 最近的拍 s | 偏差 s | 是否吸附(±0.12) | 吸附后 s |", "|---|---|---|---|---|"]
for c, s, d, ok in snap:
    b = c + d
    L.append(f"| {c:.2f} | {b:.3f} | {d:+.3f} | {'是' if ok else '否,保留原值'} | {s:.3f} |")
n = sum(ok for *_, ok in snap)
L += ["", f"{n}/{len(snap)} 个切点在 ±0.12 s 内可吸附;吸附的平均位移 {np.mean([abs(d) for _, _, d, ok in snap if ok]) * 1000:.0f} ms。"]
open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
print("\n".join(L))
