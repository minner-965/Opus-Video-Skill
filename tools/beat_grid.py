#!/usr/bin/env python3
"""beat_grid.py <audio> <analysis_json> <out grid.json> — 测 BPM / 第一拍 / 小节线,并用参考切点交叉验证。
做法:librosa 节拍追踪给出拍点 → 对拍点做最小二乘直线拟合得到恒定 bpm 与 offset →
在 4 个可能的小节相位里,选"参考切点离小节线最近"的那个作为小节起点。
"""
import json, sys
import numpy as np, librosa

audio, ajson, out = sys.argv[1], sys.argv[2], sys.argv[3]
y, sr = librosa.load(audio, sr=22050)
dur = len(y) / sr
tempo, bf = librosa.beat.beat_track(y=y, sr=sr)
bt = librosa.frames_to_time(bf, sr=sr)
idx = np.arange(len(bt))
slope, icpt = np.polyfit(idx, bt, 1)            # 每拍秒数, 第 0 个追踪拍的时间
resid = bt - (slope * idx + icpt)
bpm = 60.0 / slope
beat = slope
first = icpt - np.floor(icpt / beat) * beat      # 折回到 [0, beat)
beats = np.arange(first, dur, beat)

cuts = np.array(json.load(open(ajson, encoding="utf-8"))["cuts"]["times"])
main = cuts[np.r_[True, np.diff(cuts) > 0.6]]     # 去掉快闪段,只留"小节级"切点
best = None
for ph in range(4):
    bars = beats[ph::4]
    d = np.array([np.min(np.abs(bars - c)) for c in main])
    score = float(np.median(d))
    if best is None or score < best[0]:
        best = (score, ph, d)
score, ph, d = best
bars = beats[ph::4]
if bars[0] - 4 * beat > -0.05:                    # 第一条小节线之前若还够一整小节则补上
    bars = np.r_[bars[0] - 4 * beat, bars]
beat_d = np.array([np.min(np.abs(beats - c)) for c in cuts])

rms = librosa.feature.rms(y=y)[0]
rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
bar_rms = [round(float(rms[(rt >= a) & (rt < a + 4 * beat)].mean()), 4) for a in bars if a >= 0]

grid = dict(
    bpm=round(float(bpm), 3), librosa_tempo=round(float(np.atleast_1d(tempo)[0]), 1),
    beat_seconds=round(float(beat), 4), bar_seconds=round(float(4 * beat), 4),
    offset=round(float(first), 4), bar_phase_beats=int(ph), first_bar=round(float(bars[0]), 4), duration=round(dur, 3),
    fit=dict(tracked_beats=int(len(bt)), residual_ms_rms=round(float(np.sqrt((resid ** 2).mean()) * 1000), 1),
             residual_ms_max=round(float(np.abs(resid).max()) * 1000, 1)),
    check_vs_ref_cuts=dict(bar_level_cuts=int(len(main)), median_dist_to_bar_ms=round(score * 1000, 1),
                           within_120ms=int((d < 0.12).sum()),
                           all_cuts_within_100ms_of_beat_pct=round(100 * float((beat_d < 0.1).mean()))),
    beats=[round(float(b), 3) for b in beats], bars=[round(float(b), 3) for b in bars], bar_rms=bar_rms)
json.dump(grid, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print({k: grid[k] for k in ("bpm", "librosa_tempo", "beat_seconds", "bar_seconds", "offset", "bar_phase_beats", "first_bar")})
print("fit", grid["fit"]); print("check", grid["check_vs_ref_cuts"])
print("bars", grid["bars"]); print("bar_rms", bar_rms)
print("main cuts", [round(float(c), 2) for c in main]); print("dist ms", [int(x * 1000) for x in d])
