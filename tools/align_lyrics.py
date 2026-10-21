#!/usr/bin/env python3
"""align_lyrics.py <vocals.wav> <lyrics.txt> <out.json> [model] — stable-ts 强制对齐(文字以 lyrics.txt 为准),逐字时间戳。"""
import sys, torch, stable_whisper

audio, lyr, out = sys.argv[1], sys.argv[2], sys.argv[3]
model = sys.argv[4] if len(sys.argv) > 4 else "medium"
text = open(lyr, encoding="utf-8").read().strip()
m = stable_whisper.load_model(model, device="cuda" if torch.cuda.is_available() else "cpu")
r = m.align(audio, text, language="zh", original_split=True)
r.save_as_json(out)
r.to_srt_vtt(out.replace(".json", ".srt"), word_level=False)
for s in r.segments:
    print(f"{s.start:6.2f} {s.end:6.2f}  {s.text.strip()}  |  " + " ".join(f"{w.word.strip()}@{w.start:.2f}" for w in s.words))
