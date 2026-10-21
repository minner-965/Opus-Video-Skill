#!/usr/bin/env python3
"""transcribe_ref.py <audio> <out.json> [model] — 用 stable-ts(Whisper)转写参考音轨,词级时间戳。"""
import sys, torch, stable_whisper

audio, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else "medium"
dev = "cuda" if torch.cuda.is_available() else "cpu"
m = stable_whisper.load_model(model, device=dev)
r = m.transcribe(audio, language="zh")
r.save_as_json(out)
print("device", dev, "| model", model)
for s in r.segments:
    print(f"{s.start:6.2f} {s.end:6.2f}  {s.text}")
