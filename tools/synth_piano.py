#!/usr/bin/env python3
"""synth_piano.py <out.wav> <seconds> [bpm=72] [prog=AmFCG|CGAmF] [intro_bars=2] [hits=0,2.4,...]
intro_bars = 开头只有铺底的小节数(短视频开头要有声,用 0);hits = 在这些秒数加一下低频重音。 — 代码合成配乐:慢速钢琴分解和弦 + 柔和铺底(无版权素材)。
和弦循环 Am – F – C – G(每和弦一小节),片头 2 小节只有铺底,片尾 2 小节渐弱。"""
import sys, numpy as np, wave

out, dur = sys.argv[1], float(sys.argv[2])
bpm = float(sys.argv[3]) if len(sys.argv) > 3 else 72
sr = 44100
n = int(dur * sr)
L = np.zeros(n); R = np.zeros(n)
beat = 60 / bpm
bar = 4 * beat
f = lambda m: 440 * 2 ** ((m - 69) / 12)
PROGS = {"AmFCG": [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], "CGAmF": [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]]}
CH = PROGS[sys.argv[4] if len(sys.argv) > 4 else "AmFCG"]
rng = np.random.default_rng(7)
INTRO = int(sys.argv[5]) if len(sys.argv) > 5 else 2
HITS = [float(x) for x in sys.argv[6].split(",")] if len(sys.argv) > 6 and sys.argv[6] else []

def piano(m, t0, vel, pan):
    i0 = int(t0 * sr)
    if i0 >= n: return
    ln = min(int(3.2 * sr), n - i0)
    t = np.arange(ln) / sr
    fr = f(m)
    tone = sum(a * np.sin(2 * np.pi * fr * k * t * (1 + .0004 * k * k)) for k, a in [(1, 1), (2, .45), (3, .22), (4, .12), (5, .06)])
    env = np.minimum(1, t / .006) * np.exp(-t * (1.6 + fr / 900))
    s = vel * tone * env
    L[i0:i0 + ln] += s * (1 - pan); R[i0:i0 + ln] += s * pan

def pad(ms, t0, t1, vol):
    i0, i1 = int(t0 * sr), min(int(t1 * sr), n)
    if i0 >= i1: return
    t = np.arange(i1 - i0) / sr
    a = np.minimum(1, t / 1.2) * np.minimum(1, (t[::-1]) / 1.2)
    for m in ms:
        for det, p in ((-.08, .3), (.08, .7)):
            s = vol * a * np.sin(2 * np.pi * f(m) * (1 + det / 100) * t) * (.7 + .3 * np.sin(2 * np.pi * .23 * t))
            L[i0:i1] += s * (1 - p); R[i0:i1] += s * p

nbars = int(np.ceil(dur / bar))
for b in range(nbars):
    t0 = b * bar
    ch = CH[b % 4]
    fade = min(1, (dur - t0) / (2 * bar))
    pad([c - 12 for c in ch], t0, t0 + bar + .6, .035 * fade)
    if b < INTRO: continue
    piano(ch[0] - 12, t0, .22 * fade, .45)                          # 低音
    seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[2], ch[1]]
    for k, m in enumerate(seq):
        piano(m, t0 + k * beat / 2 + rng.normal(0, .006), (.12 + .03 * (k == 0)) * fade * (.9 + .2 * rng.random()), .3 + .4 * (k % 2))
    if b >= 6 and b % 2 == 0:                                           # 中段起加一条旋律
        mel = [ch[2] + 12, ch[1] + 12, ch[0] + 12, ch[1] + 12]
        for k, m in enumerate(mel): piano(m, t0 + k * beat, .1 * fade, .55)

# 重音:低频下滑的「咚」+ 一小段噪声
for h in HITS:
    i0 = int(h * sr); ln = min(int(1.4 * sr), n - i0)
    if ln <= 0: continue
    tt = np.arange(ln) / sr
    boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 3) + 38) / sr) * np.exp(-tt * 3.2) * .32
    noise = rng.normal(0, 1, ln) * np.exp(-tt * 18) * .08
    L[i0:i0 + ln] += boom + noise; R[i0:i0 + ln] += boom + noise * .8

# 简单混响:几条延迟反馈
for d, g in ((.031, .35), (.047, .3), (.071, .25), (.113, .2)):
    k = int(d * sr)
    L[k:] += g * L[:-k] * .5; R[k:] += g * R[:-k] * .5
mx = max(np.abs(L).max(), np.abs(R).max())
L, R = L / mx * .8, R / mx * .8
tail = int(1.5 * sr); L[-tail:] *= np.linspace(1, 0, tail); R[-tail:] *= np.linspace(1, 0, tail)
pcm = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())
print(out, round(dur, 2), "s", bpm, "bpm, bar", round(bar, 3), "s")
