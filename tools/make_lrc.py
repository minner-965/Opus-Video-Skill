#!/usr/bin/env python3
"""make_lrc.py <sub/lyrics.json> <lyrics.txt> <outdir> — 从 stable-ts 结果生成:
  song.lrc(行级 [mm:ss.xx])、captions.json(Remotion 用:每行 + 逐字时间,文字严格取自 lyrics.txt)。
stable-ts 的 token 可能把两个字并在一起,这里按字数把该 token 的时间均分回单字。"""
import json, os, sys

src, lyr, out = sys.argv[1], sys.argv[2], sys.argv[3]
segs = json.load(open(src, encoding="utf-8"))["segments"]
lines = [l.strip() for l in open(lyr, encoding="utf-8") if l.strip()]
assert len(segs) == len(lines), (len(segs), len(lines))
caps, lrc = [], []
for i, (s, text) in enumerate(zip(segs, lines)):
    chars = []
    for w in s["words"]:
        t = w["word"].strip()
        if not t: continue
        n = len(t); a, b = w["start"], max(w["end"], w["start"])
        for k, c in enumerate(t):
            chars.append([c, round(a + (b - a) * k / n, 3)])
    got = "".join(c for c, _ in chars)
    if got != text:                               # 末行被片尾截断等情况:按原文补齐,时间取最后一个已知时间
        last = chars[-1][1] if chars else s["start"]
        fixed, j = [], 0
        for c in text:
            if j < len(chars) and chars[j][0] == c: fixed.append(chars[j]); j += 1
            else: fixed.append([c, fixed[-1][1] if fixed else last])
        chars, note = fixed, f"aligned text was '{got}'"
    else: note = None
    cap = dict(i=i + 1, text=text, start=round(s["start"], 3), end=round(s["end"], 3), chars=[dict(c=c, t=t) for c, t in chars])
    if note: cap["note"] = note
    caps.append(cap)
    lrc.append("[%02d:%05.2f]%s" % (int(s["start"] // 60), s["start"] % 60, text))
os.makedirs(out, exist_ok=True)
open(os.path.join(out, "song.lrc"), "w", encoding="utf-8").write("\n".join(lrc) + "\n")
json.dump(caps, open(os.path.join(out, "captions.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\n".join(lrc)); print([c["note"] for c in caps if "note" in c])
