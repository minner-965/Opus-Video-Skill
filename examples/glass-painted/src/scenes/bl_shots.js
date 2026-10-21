// bl_shots.js: 《玻璃》的四段镜头。分镜见 STORYBOARD.md(A–I)。
//   street 0–25.9   A–F:雨夜街角,一个不断移动的长镜头(鼓起勇气 → 举出心 → 她早知道 → 藏不住 → 变玻璃 → 人海)
//   pane   25.9–30.9 G:起雾的玻璃上那颗冲不掉的心
//   after  30.9–36.8 H:雨停,两人站到同一侧,她也变透明
//   inside 36.8–40.6 I:从店里往外看,心形收拢
(() => {
  const UM = 28;                       // 他的大小
  const HER_IN = { x: 1440, y: 765, u: 21 };
  const WIPE_FG = ['#56608A', '#8A88A6'], WIPE_HI = [HEART, '#F2B49A'];
  const MARK = { x: 1200, y: 600, r: 96 };          // 玻璃上那颗心(左半扇窗的中间)

  // 玻璃上手指画出的心:p = 画了多少 0..1。
  function fogMark(L, p, t, k = 1) {
    if (p <= .01) return;
    boilSeed('mark');
    const pts = heartPts(MARK.x, MARK.y, MARK.r, 30), n = Math.max(2, Math.ceil(p * pts.length) + (p >= 1 ? 1 : 0));
    const line = p >= 1 ? pts.concat([pts[0]]) : pts.slice(0, n);
    if (p >= 1) glow(MARK.x, MARK.y, 190, '#FFB7C8', (.3 + .3 * pulse(t, 4)) * k);
    inkLine(line, 9, mixCol(L.room, '#FFFFFF', .25), 'ink', .5);
    inkLine(line, 2.2, mixCol(L.roomDk, HEART, .5), 'inkfine', .5);
  }

  // ------------------------------------------------------------------ A–F
  function street1(t, lt, dur) {
    const L = LOOKS.night;
    const c = kf(t, [
      [0, [640, 650, 1.5]], [2.9, [650, 650, 1.6]], [4.6, [740, 640, 1.45]], [5.6, [900, 610, 1.3]], [6.4, [1090, 585, 1.1]], [8.0, [1120, 580, 1.12]],
      [8.5, [1400, 610, 1.75]], [9.35, [1400, 610, 1.82]], [9.85, [870, 650, 1.9]], [11.5, [870, 650, 2.0]],
      [12.0, [1070, 600, 1.2]], [15.9, [1090, 600, 1.27]],
      [16.9, [850, 655, 2.25]], [21.3, [850, 645, 2.5]],
      [21.95, [960, 560, .93]], [25.9, [960, 560, .88]]]);
    camBegin(c[0] + 6 * Math.sin(t * .7), c[1] + 4 * Math.sin(t * .9), c[2]);

    // ---- 他 ----
    const hx = kf(t, [[0, 600], [3.9, 600], [4.6, 690], [5.3, 850]]), walking = t > 3.9 && t < 5.3;
    const hv = t < 11.6 ? spinView(.125) : t < 11.85 ? turn(t, 11.6, 11.85, .125, 0) : t < 13.2 ? spinView(0)
      : t < 13.5 ? turn(t, 13.2, 13.5, 0, .5) : t < 15.2 ? spinView(.5) : t < 15.5 ? turn(t, 15.2, 15.5, .5, 0) : spinView(0);
    const hm = emotions(t, [[0, 'nervous'], [2.95, 'determined'], [5.55, 'hopeful'], [9.95, 'surprised', { lookY: 1, lookX: 0 }], [10.7, 'shy'],
      [11.65, 'scared'], [15.05, 'sad', { emote: null, gloom: 0 }], [16.5, 'relieved', { emote: null }], [18.0, 'hopeful', { lookY: 0 }], [20.35, 'happy'], [21.6, 'hopeful', { lookX: .7, lookY: 0 }]]);
    const inhale = kf(t, [[2.45, 0], [2.85, .15], [3.15, -.15], [3.6, 0]]);
    const hide = seg(t, 11.9, 12.2) * (1 - seg(t, 14.9, 15.2));               // 想把光捂住
    const raise = ease(seg(t, 5.0, 5.6)) * (1 - ease(seg(t, 9.5, 10.2)));     // 把心举起来
    const glass = ease(seg(t, 18.0, 20.2)), hk = seg(t, 9.9, 10.4);
    const pose = { ...hm, ...hv, sq: (hm.sq || 0) + inhale + .1 * hide, walk: walking ? (hx - 600) / (4 * UM) : undefined,
      dy: (hm.dy || 0) - (walking ? .5 * Math.abs(Math.sin((hx - 600) / (4 * UM) * Math.PI)) : 0),
      aL: lerp(lerp(hm.aL ?? .2, 1.35, raise), -1.25, hide), aR: lerp(hm.aR ?? .2, -1.25, hide), glass, heart: hk };
    // 手里的那颗心:先藏在背后,再举过头顶,最后收回胸口
    const behind = [hx - 5.9 * UM, GROUND - 3.4 * UM], over = [hx + 3.6 * UM, GROUND - 11.2 * UM + 8 * Math.sin(t * 3)], chest = [hx, GROUND - 4.0 * UM];
    const hp = t < 5.0 ? behind : t < 5.6 ? arcPt(behind, over, 60, ease(seg(t, 5.0, 5.6))) : t < 9.5 ? over : arcPt(over, chest, 30, ease(seg(t, 9.5, 10.3)));
    const hr = UM * 1.5 * (1 - .5 * seg(t, 9.8, 10.3)), heldVisible = t < 10.3;

    // ---- 她 ----
    const inside = t < 21.0;
    const sm = emotions(t, [[0, 'bored'], [6.45, 'surprised', { lookX: -.9 }], [7.3, 'happy', { lookX: -.8 }], [8.3, 'smug', { lookX: -.7 }], [11.8, 'playful'],
      [13.6, 'laugh'], [15.9, 'happy', { lookX: -.8 }], [18.6, 'surprised', { lookX: -.8 }], [20.4, 'love']]);
    const point = kf(t, [[8.55, 0], [8.85, 1], [9.7, 1], [10.1, 0]]);
    const her1 = () => her(HER_IN.x, HER_IN.y, HER_IN.u, { ...sm, aL: lerp(sm.aL ?? .2, .22 + .06 * Math.sin(t * 14), point), noShadow: true, boilKey: 'herIn' });
    const sx = t < 24.93 ? 1500 : 1240, som = emotions(t, [[21.0, 'hopeful', { lookX: -.7 }], [24.93, 'love']]);

    corner(L, t, { inside: () => { if (inside) her1(); } });
    rain(t, 1);

    // 后排路人:从画面两侧走进来,在两人身后穿过
    if (t > 21.5) for (let i = 0; i < 6; i++) {
      const dir = i % 2 ? 1 : -1, sp = 250 + 120 * hash(i + 3), age = t - 21.5 - i * .32;
      if (age < 0) continue;
      passer(dir > 0 ? -420 + sp * age : 2360 - sp * age, GROUND - 8, 21, t, dir, i);
    }
    // 心光:从他的胸口照到她身上
    if (t > 23.0) {
      const p = easeOut(seg(t, 23.0, 23.7)), a = [hx, GROUND - 4.0 * UM], b = [sx, GROUND - 4.2 * 26];
      boilSeed('beam');
      for (let k = 0; k <= 24; k++) { const q = k / 24; if (q > p) break; glow(lerp(a[0], b[0], q), lerp(a[1], b[1], q) - 30 * Math.sin(q * Math.PI), 64 + 40 * Math.sin(q * Math.PI) + 14 * pulse(t, 5), '#FF8FAE', .85); }
      inkLine([a, [lerp(a[0], b[0], p * .5), lerp(a[1], b[1], p * .5) - 30], [lerp(a[0], b[0], p), lerp(a[1], b[1], p)]], 5, '#FFE3EA', 'ink', .5);
    }
    if (heldVisible && t < 5.0) heartProp(hp[0], hp[1], hr, 1, 'held');
    me(hx, GROUND, UM, { ...pose, boilKey: 'me' });
    if (heldVisible && t >= 5.0) heartProp(hp[0], hp[1], hr, 1, 'held');
    if (!inside) her(sx, GROUND, 26, { ...som, boilKey: 'herOut' });
    // 变成玻璃的那一下:边角闪一颗星
    if (t > 20.2 && t < 21.1) {
      const k = seg(t, 20.2, 20.4) * (1 - seg(t, 20.7, 21.1));
      boilSeed('glint'); glow(hx + 5 * UM, GROUND - 8 * UM, 150 * k, '#FFFFFF', .9 * k);
      paint(starPts(hx + 5 * UM, GROUND - 8 * UM, 58 * k, .28, 4, t * 2), { wash: '#FFFFFF', ink: PAL.ink, sw: .6 });
    }
    splashes(t, 1);
    // 人海:贴着镜头走过的一排排伞
    if (t > 21.3) for (let i = 0; i < 12; i++) {
      const dir = i % 2 ? 1 : -1, sp = 170 + 110 * hash(i + 5), y = GROUND + 140 + 60 * hash(i + 2) + 300 * (1 - ease(seg(t, 21.3, 21.95))), u = 17 + 4 * hash(i + 9);
      const x = (((hash(i + 7) * 2900 + dir * sp * t) % 2900) + 2900) % 2900 - 480;
      passer(x, y, u, t, dir, 20 + i);
    }
    if (t > 24.2 && t < 25.6) passer(lerp(-560, 2560, seg(t, 24.3, 25.5)), GROUND + 330, 80, t, 1, 40);     // 挡住画面的那一位
    rain(t, 1, true);
    const at = toScreen(hx, GROUND - 4 * UM);
    camEnd();
    if (lt < 1.1) iris(at[0], at[1], lerp(0, 1500, easeIn(lt / 1.1)), '#1A1D3A');
    if (t > 25.6) brushWipe((t - 25.6) / .6, WIPE_FG);
  }

  // ------------------------------------------------------------------ G
  function pane(t, lt, dur) {
    const L = LOOKS.night;
    const zin = easeIn(seg(t, 30.35, 30.9));
    camBegin(lerp(1300, MARK.x, zin) + 4 * Math.sin(t * .8), lerp(585, MARK.y, zin), lerp(lerp(1.55, 1.66, seg(t, 25.9, 30.35)), 6, zin));
    const fog = ease(seg(t, 25.9, 26.6)) * .78;
    const sm = emotions(t, [[25.9, 'hopeful', { lookX: -.6 }], [26.35, 'determined', { lookX: -.8 }], [27.6, 'happy', { lookX: -.7 }], [29.45, 'love']]);
    const drawing = seg(t, 26.25, 26.45) * (1 - seg(t, 27.5, 27.8));
    const p = ease(seg(t, 26.4, 27.5));
    corner(L, t, {
      fog,
      inside: () => her(HER_IN.x - 20, HER_IN.y, 22, { ...sm, aL: lerp(sm.aL ?? .2, .5 + .25 * Math.sin(t * 9), drawing), noShadow: true, boilKey: 'herIn' }),
      onGlass: () => {
        // 雨水一道道流下来,把雾冲花
        for (let i = 0; i < 11; i++) {
          const x = WIN.x + 30 + i * 68 + 20 * hash(i), t0 = 27.55 + .16 * i * hash(i + 4) * 2, len = clamp((t - t0) * (520 + 200 * hash(i + 2)), 0, WIN.h - 8);
          if (len <= 4) continue;
          boilSeed('drip' + i);
          const wv = k => 9 * Math.sin(k * 5 + i);
          paint(ribbon([[x + wv(0), WIN.y + 4], [x + wv(.33), WIN.y + len * .33], [x + wv(.66), WIN.y + len * .66], [x + wv(1), WIN.y + len]], 9 + 5 * hash(i), 16), { wash: L.room, washOp: 205, ink: null });
          paint(ellPts(x + wv(1), WIN.y + len, 9, 12, 10), { wash: '#EAF6FF', ink: PAL.ink, sw: .5 });
        }
        fogMark(L, p, t);
      },
    });
    rain(t, 1);
    const touch = ease(seg(t, 29.2, 29.6));
    const hm = emotions(t, [[25.9, 'neutral'], [29.4, 'happy']]);
    me(1005, GROUND + 62, 34, { ...hm, view: 'back', glass: 1, heart: 1, aL: lerp(-.3, 1.3, touch), aR: -.4, boilKey: 'me' });
    if (touch > .5) { boilSeed('touch'); glow(MARK.x, MARK.y + MARK.r, 80 * touch, '#FFFFFF', .5 * touch); }
    rain(t, 1, true);
    camEnd();
    if (lt < .3) brushWipe((lt + .3) / .6, WIPE_FG);
    flash(seg(t, 30.55, 30.9), '#FFF6EC');
  }

  // ------------------------------------------------------------------ H
  const BOW = ['#F28B82', '#FBD06A', '#A8E6A1', '#8EC5F5', '#C3A6F2'];
  function after(t, lt, dur) {
    const k1 = ease(seg(t, 30.9, 32.6)), k2 = ease(seg(t, 33.4, 36.4));
    const L = k2 > 0 ? mixLook(LOOKS.clear, LOOKS.dawn, k2) : mixLook(LOOKS.night, LOOKS.clear, k1);
    camBegin(lerp(1015, 1005, lt / dur) + 5 * Math.sin(t * .6), 625, lerp(1.2, 1.42, ease(lt / dur)));
    corner(L, t, { inside: () => {}, onGlass: () => fogMark(L, 1, t, .6) });
    const hm = emotions(t, [[30.9, 'relieved', { emote: null }], [32.4, 'happy', { lookX: .6 }], [35.7, 'love']]);
    const sm = emotions(t, [[30.9, 'shy', { lookX: -.4 }], [32.9, 'starstruck', { lookX: -.6 }], [34.1, 'hopeful', { lookX: -.6 }], [35.7, 'love']]);
    const hx = 790, sx = 1170;
    // 光穿过玻璃的他,在地上投下一片彩色光斑
    const bow = ease(seg(t, 32.5, 33.5));
    if (bow > .01) {
      boilSeed('bow');
      glow(hx + 150, GROUND + 58, 230 * bow, '#FFF1C8', .5 * bow);
      BOW.forEach((col, i) => paint(ellPts(hx + 60 + i * 44, GROUND + 58 + 5 * Math.sin(i * 1.3), 36, 15, 14, 2, -.25), { wash: col, washOp: 215 * bow, ink: null }));
    }
    me(hx, GROUND, UM, { ...hm, glass: 1, heart: 1, boilKey: 'me' });
    her(sx, GROUND, 27, { ...sm, glass: ease(seg(t, 34.0, 35.6)), heart: 1, lag: lerp(BEAT * .5, 0, ease(seg(t, 35.0, 36.2))), boilKey: 'herOut' });
    camEnd();
    flash(1 - seg(t, 30.9, 31.5), '#FFF6EC');
    if (t > 36.5) brushWipe((t - 36.5) / .6, WIPE_HI);
  }

  // ------------------------------------------------------------------ I
  function inside(t, lt, dur) {
    const L = LOOKS.dawn, O = { x: 330, y: 130, w: 1260, h: 670 }, HC = [960, 520];
    camBegin(960, 540 + 3 * Math.sin(t * .8), lerp(1.12, 1.0, ease(lt / dur)));
    skyBg(L, t);
    boilSeed('far');
    paint(rectPts(-200, 660, W + 400, 300), { wash: L.walk, fill: L.walkDk, fillOp: 60, tex: .5, ink: PAL.ink, sw: .8 });
    for (let i = 0; i < 5; i++) { boilSeed('fb' + i); const x = 380 + i * 250, h = 150 + 120 * hash(i + 3); paint(rectPts(x, 660 - h, 170, h, 1.5), { wash: mixCol(L.wallDk, L.sky, .55), ink: PAL.ink, sw: .5 }); }
    glow(700, 300, 520, '#FFE2B0', .7);
    BOW.forEach((col, i) => paint(ellPts(900 + i * 30, 716, 24, 8, 12, 1, -.2), { wash: col, washOp: 210, ink: null }));
    me(872, 692, 15, { ...feel('love', t), glass: 1, heart: 1, boilKey: 'me' });
    her(1046, 692, 14.5, { ...feel('love', t + .3), glass: 1, heart: 1, boilKey: 'herOut' });
    // 玻璃和那颗心
    boilSeed('paneI');
    paint(rectPts(O.x, O.y, O.w, O.h), { wash: L.glass, washOp: 46, ink: null });
    glow(HC[0], HC[1], 420, '#FFB7C8', .28 + .2 * pulse(t, 4));
    const hp = heartPts(HC[0], HC[1], 262, 34), line = hp.concat([hp[0]]);
    boilSeed('markI');
    inkLine(line, 15, '#F59AB2', 'ink', .5);
    inkLine(line, 4, '#FFD9E3', 'ink', .5);
    // 店里:窗周围的墙、窗框、吧台和一杯冒着热气的咖啡
    boilSeed('wallI');
    const wall = '#5E3F3C', wallDk = '#3F2A2C';
    for (const r of [[-300, -300, O.x + 300, 1700], [O.x + O.w, -300, 1000, 1700], [-300, -300, 2500, O.y + 300], [-300, O.y + O.h, 2500, 700]])
      paint(rectPts(...r), { wash: wall, fill: wallDk, fillOp: 70, tex: .6, ink: null });
    paint(rectPts(O.x, O.y, O.w, O.h), { ink: PAL.ink, sw: 2 });
    paint(rectPts(O.x - 26, O.y + O.h, O.w + 52, 34), { wash: '#8A5A3C', ink: PAL.ink, sw: 1.1 });
    paint(rectPts(-300, O.y + O.h + 70, 2500, 500), { wash: '#7A4E36', fill: '#4E3024', fillOp: 80, tex: .6, ink: PAL.ink, sw: 1.2 });
    boilSeed('cup');
    paint(rrPts(1380, 800, 110, 76, 16), { wash: PAL.cream, ink: PAL.ink, sw: 1.1 });
    paint(ellPts(1500, 838, 22, 20, 12), { ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 3; i++) {
      const q = ((t * .35 + i / 3) % 1), x = 1435 + 16 * Math.sin(q * 6 + i * 2), y = 790 - 150 * q;
      boilSeed('st' + i); paint(lumpy(x, y, 18 + 26 * q, 14 + 20 * q, i * 3, 14), { wash: '#FFF3E0', washOp: 150 * (1 - q), ink: null });
    }
    const hs = toScreen(HC[0], HC[1] - 20);
    camEnd();
    if (lt < .3) brushWipe((lt + .3) / .6, WIPE_HI);
    const r = lerp(1700, 0, easeIn(seg(t, 38.7, 40.25)));
    if (t > 38.7) { if (r < 8) paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#1A1424', ink: null }); else irisShape(heartPts(hs[0], hs[1], r, 40), '#1A1424'); }
  }

  shots([[0, street1], [25.9, pane], [30.9, after], [36.8, inside]]);
})();
