#!/usr/bin/env python3
"""extract_frames.py <video> <analysis_dir> <outdir> — 有硬切的参考片:每个镜头抽两帧。
  *_a.jpg = 切点后 0.15 s(镜头刚开始)
  *_z.jpg = 下一个切点前 0.10 s(镜头结束前,逐字出现的文字此时最全)
文件名带镜头号和时间戳:s03_0490_a.jpg = 第 3 镜,4.90 s。
"""
import json, os, subprocess, sys

src, adir, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
a = json.load(open(os.path.join(adir, "ref_analysis.json"), encoding="utf-8"))
dur = a["info"]["duration"]
edges = [0.0] + a["cuts"]["times"] + [dur]
shots = []
for i in range(len(edges) - 1):
    t0, t1 = edges[i], edges[i + 1]
    picks = [("a", min(t0 + 0.15, (t0 + t1) / 2))]
    if t1 - t0 > 0.5:
        picks.append(("z", t1 - 0.10))
    for tag, t in picks:
        name = f"s{i + 1:02d}_{int(round(t * 100)):04d}_{tag}.jpg"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1",
                        "-vf", "scale=1280:-1", "-q:v", "3", os.path.join(out, name)], check=True)
    shots.append(dict(shot=i + 1, start=round(t0, 2), end=round(t1, 2), len=round(t1 - t0, 2)))
json.dump(shots, open(os.path.join(out, "shots.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(shots), "shots →", out)
