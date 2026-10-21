// bl_set.js: 《玻璃》的世界 —— 雨夜街角,一扇亮着暖光的咖啡店玻璃窗;角色和公共道具。镜头在 bl_shots.js。
// 三种光:night(雨夜)、clear(雨停,云开)、dawn(结尾的桃色暖光)。

const GROUND = 880;                 // 人行道:角色的脚踩在这条线上
const WIN = { x: 1010, y: 300, w: 760, h: 470 };   // 咖啡店的窗(世界坐标)
const LOOKS = {
  night: { sky: '#232750', sky2: '#343B78', wall: '#3A3560', wallDk: '#2A2648', trim: '#57507F', walk: '#4A4870', walkDk: '#35335A', kerb: '#6C6A94',
           room: '#F2C879', roomDk: '#D99A52', glass: '#BFE3F0', rain: 1, warm: 0 },
  clear: { sky: '#4A4E8C', sky2: '#C98FA6', wall: '#544C7C', wallDk: '#3C3660', trim: '#7A70A0', walk: '#6A6690', walkDk: '#4C4A74', kerb: '#8C88B0',
           room: '#F6D58C', roomDk: '#E0A862', glass: '#CFEAF4', rain: 0, warm: .5 },
  dawn:  { sky: '#F2B49A', sky2: '#FBDDB8', wall: '#B98A94', wallDk: '#94687A', trim: '#D9A9A6', walk: '#C9A2A4', walkDk: '#A67E88', kerb: '#E6C6BE',
           room: '#FBE3A6', roomDk: '#EDBB78', glass: '#E2F3F6', rain: 0, warm: 1 },
};
const mixLook = (a, b, k) => { const o = {}; for (const key in a) o[key] = typeof a[key] === 'string' ? mixCol(a[key], b[key], k) : lerp(a[key], b[key], k); return o; };

const HEART = '#E8567A';
const ME = { col: PAL.clay, dk: PAL.clayDk, lt: '#F5B394' };
const HER = { col: '#5FB7C4', dk: '#3A8794', lt: '#A9E0E6' };
const GLASS = { col: '#CFE8F2', dk: '#A5CADB', lt: '#F4FCFF' };
const GLASS_HER = { col: '#D2EFEA', dk: '#A6D2CC', lt: '#F4FFFC' };
const GREY = { col: '#8A88A6', dk: '#66648A', lt: '#AAA8C2' };
const mix3 = (a, b, k) => ({ col: mixCol(a.col, b.col, k), dk: mixCol(a.dk, b.dk, k), lt: mixCol(a.lt, b.lt, k) });

// ---------- 角色 ----------
// 身体里的那颗心:画在身体坐标里(正面:身体 x −5u..5u,y −8u..−2u)。k = 可见度 0..1,beat = 跳动 0..1。
function innerHeart(u, sw, k, beat, o = {}) {
  if (k <= .02) return;
  const r = u * (1.1 + .3 * beat) * (o.size || 1), cy = -4.0 * u;
  glow(0, cy, r * (2.6 + 1.4 * beat), '#FF8FA8', (.35 + .4 * beat) * k);
  paint(heartPts(0, cy - r * .1, r), { wash: HEART, washOp: 255 * clamp(k * 1.2), ink: PAL.ink, sw: sw * .7 });
  paint(ellPts(-r * .36, cy - r * .42, r * .2, r * .13, 8, 0, -.5), { wash: '#FFD9E2', washOp: 220 * k, ink: null });
}
// 玻璃身体上的反光:两道斜的亮条 + 底边一条冷色。g = 玻璃化程度 0..1。
function glassShine(u, sw, g) {
  if (g <= .02) return;
  const a = 235 * g;
  paint([[-4.1 * u, -7.3 * u], [-3.2 * u, -7.3 * u], [-4.3 * u, -4.9 * u], [-4.5 * u, -5.6 * u]], { wash: '#FFFFFF', washOp: a, ink: null });
  paint([[-2.7 * u, -7.3 * u], [-2.3 * u, -7.3 * u], [-3.5 * u, -4.4 * u], [-3.8 * u, -4.6 * u]], { wash: '#FFFFFF', washOp: a * .8, ink: null });
  paint([[3.3 * u, -2.5 * u], [4.5 * u, -2.5 * u], [4.5 * u, -3.7 * u]], { wash: '#FFFFFF', washOp: a * .6, ink: null });
}
// 他。o.glass 0..1 把陶土色褪成玻璃;o.heart 0..1 让身体里的心显出来(不透明时只是一团透出来的微光)。
function me(x, y, u, o = {}) {
  const g = clamp(o.glass || 0), hk = clamp(o.heart || 0), beat = pulse(T, 5);
  const user = o.draw;
  clawd(x, y, u, {
    ...o, ...mix3(ME, GLASS, g), tint: null,
    draw: (uu, sw) => {
      if (hk > 0 && g < .5) glow(0, -4.0 * uu, uu * (2.6 + 1.2 * beat), '#FF8FA8', hk * (1 - g) * .8);   // 藏在心底:隔着陶土透出的光
      innerHeart(uu, sw, hk * g, beat);
      glassShine(uu, sw, g);
      user && user(uu, sw);
    },
  });
}
// 她:青蓝色,头上一朵小花。
function her(x, y, u, o = {}) {
  const g = clamp(o.glass || 0), hk = clamp(o.heart || 0), beat = pulse(T - (o.lag || 0), 5);
  const user = o.draw;
  clawd(x, y, u, {
    ...o, ...mix3(HER, GLASS_HER, g), tint: null, hat: 'flower',
    draw: (uu, sw) => { innerHeart(uu, sw, hk * g, beat); glassShine(uu, sw, g); user && user(uu, sw); },
  });
}
// 一颗可以拿在手里的心(世界坐标)。r = 半径。
function heartProp(x, y, r, k = 1, key = 'hp') {
  boilSeed(key);
  const beat = pulse(T, 5);
  glow(x, y, r * (3 + 1.5 * beat), '#FF8FA8', .75 * k);
  paint(heartPts(x, y - r * .1, r * (1 + .12 * beat)), { wash: HEART, ink: PAL.ink, sw: clamp(r / 40, .5, 1.2) });
  paint(ellPts(x - r * .36, y - r * .42, r * .2, r * .13, 8, 0, -.5), { wash: '#FFD9E2', ink: null });
}
// 路人:灰色小方块,撑一把伞,没有表情。dir = ±1 走的方向。
function passer(x, y, u, t, dir, i) {
  const umb = ['#6E6C92', '#5A6A8E', '#7A6A90', '#56608A'][i % 4];
  clawd(x, y, u, { ...GREY, tint: null, view: 'side', flip: dir < 0, walk: t * 5 + i * 1.7, eyes: 'closed', noShadow: true, boilKey: 'p' + i,
    dy: -.15 * Math.abs(Math.sin(t * 5 + i * 1.7)) });
  boilSeed('umb' + i);
  const ux = x + dir * u * .6, uy = y - u * 11.2 - u * .15 * Math.abs(Math.sin(t * 5 + i * 1.7));
  inkLine([[ux, uy + u * .4], [ux, uy + u * 4.6]], clamp(u / 16, .6, 1.4), PAL.ink, 'ink', 0);
  paint(through([[ux - u * 5.2, uy + u * 1.2], [ux - u * 3.4, uy - u * 1.4], [ux, uy - u * 2.3], [ux + u * 3.4, uy - u * 1.4], [ux + u * 5.2, uy + u * 1.2], [ux + u * 2.6, uy + u * .5], [ux, uy + u * 1.1], [ux - u * 2.6, uy + u * .5]]),
    { wash: umb, fill: mixCol(umb, PAL.ink, .35), fillOp: 70, tex: .5, ink: PAL.ink, sw: clamp(u / 18, .5, 1.2) });
}

// ---------- 世界 ----------
function lumpy(cx, cy, rx, ry, seed, n = 22) {
  const p = []; for (let k = 0; k < n; k++) { const a = k / n * TAU, w = 1 + .13 * Math.sin(a * 5 + seed) + .07 * Math.sin(a * 9 + seed * 2); p.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
  return p;
}
function skyBg(L, t) {
  boilSeed('sky');
  paint(rectPts(-900, -1200, W + 1800, 2600), { wash: L.sky, ink: null });
  paint(ellPts(W * .3, 620, 1300, 330, 30, 10), { fill: L.sky2, fillOp: 150, bleed: .3, tex: .5, ink: null });
  for (let i = 0; i < 4; i++) {
    boilSeed('cl' + i);
    const x = ((hash(i + 20) * 2400 + t * (10 + 5 * i)) % 2900) - 500, y = 90 + i * 85;
    paint(lumpy(x, y, 260 + 70 * i, 56, 20 + i), { fill: mixCol(L.sky, L.warm > .5 ? PAL.cream : '#151838', L.warm > .5 ? .5 : .35), fillOp: 130, bleed: .25, tex: .5, ink: null });
  }
  if (L.warm > .05) glow(520, 300, 620, '#FFD9A0', .8 * L.warm);
}
// 远处的楼:几块深色剪影,零星亮着窗。
function cityBg(L, t) {
  for (let i = 0; i < 7; i++) {
    boilSeed('bld' + i);
    const x = -260 + i * 190 + 40 * hash(i), w = 150 + 60 * hash(i + 4), h = 260 + 240 * hash(i + 8);
    const c = mixCol(L.wallDk, L.sky, .45);
    paint(rectPts(x, GROUND - 130 - h, w, h + 40, 1.5), { wash: c, ink: PAL.ink, sw: .5 });
    for (let k = 0; k < 6; k++) if (hash(i * 7 + k) < .45) {
      const wx = x + 22 + (k % 2) * (w * .45), wy = GROUND - 100 - h + 40 + Math.floor(k / 2) * 80;
      paint(rectPts(wx, wy, w * .22, 34), { wash: mixCol(L.room, c, .25 + .3 * L.warm), ink: null });
    }
  }
}
// 咖啡店的墙和那扇窗。o.inside(L):在窗玻璃后面画店里的东西(她);o.fog 0..1 玻璃起雾;o.mark 0..1 雾上的心形印记。
function cafe(L, t, o = {}) {
  const { x, y, w, h } = WIN;
  boilSeed('wall');
  paint(rectPts(x - 190, -400, 2200, GROUND + 400 - 24), { wash: L.wall, fill: L.wallDk, fillOp: 70, tex: .6, bleed: .04, ink: PAL.ink, sw: 1 });
  for (let i = 0; i < 9; i++) inkLine([[x - 190, 40 + i * 105], [W + 900, 40 + i * 105 + 6 * hash(i)]], .5, mixCol(L.wall, PAL.ink, .35), 'inkfine', 0);
  // 窗里:暖光的房间
  boilSeed('room');
  paint(rectPts(x, y, w, h), { wash: L.room, fill: L.roomDk, fillOp: 90, tex: .5, bleed: .05, ink: null });
  paint(rectPts(x, y + h * .72, w, h * .28), { wash: mixCol(L.roomDk, '#8A5A3C', .55), ink: null });          // 吧台
  paint(ellPts(x + w * .8, y + h * .2, 46, 30, 14), { wash: '#FFF0C2', ink: PAL.ink, sw: .7 });               // 吊灯
  inkLine([[x + w * .8, y], [x + w * .8, y + h * .14]], 1, PAL.ink, 'ink', 0);
  if (o.inside) o.inside(L);
  // 玻璃:一层很薄的冷色 + 两道斜反光
  boilSeed('pane');
  paint(rectPts(x, y, w, h), { wash: L.glass, washOp: 26 + 150 * clamp(o.fog || 0), ink: null });
  paint([[x + w * .12, y], [x + w * .2, y], [x + w * .04, y + h], [x - w * .04 + w * .0, y + h]].map(p => [clamp(p[0], x, x + w), p[1]]), { wash: '#FFFFFF', washOp: 34, ink: null });
  paint([[x + w * .26, y], [x + w * .29, y], [x + w * .13, y + h], [x + w * .1, y + h]], { wash: '#FFFFFF', washOp: 26, ink: null });
  if (o.onGlass) o.onGlass(L);
  // 窗框、窗台、雨棚
  boilSeed('frame');
  paint(rectPts(x, y, w, h), { ink: PAL.ink, sw: 1.6 });
  for (const fx of [x - 22, x + w]) paint(rectPts(fx, y - 22, 22, h + 44), { wash: L.trim, ink: PAL.ink, sw: .9 });
  paint(rectPts(x - 22, y - 22, w + 44, 22), { wash: L.trim, ink: PAL.ink, sw: .9 });
  paint(rectPts(x - 40, y + h, w + 80, 30), { wash: L.trim, ink: PAL.ink, sw: 1 });
  inkLine([[x + w / 2, y], [x + w / 2, y + h]], 2.4, L.trim, 'ink', 0);
  const aw = [[x - 80, y - 60], [x + w + 80, y - 60], [x + w + 130, y - 150], [x - 130, y - 150]];
  paint(aw, { wash: '#B5485A', fill: '#7E2C3E', fillOp: 80, tex: .6, ink: PAL.ink, sw: 1.1 });
  for (let i = 1; i < 8; i++) { const k = i / 8; inkLine([[lerp(aw[3][0], aw[2][0], k), y - 150], [lerp(aw[0][0], aw[1][0], k), y - 60]], .7, '#F2D6C6', 'inkfine', 0); }
  glow(x + w / 2, y + h / 2, 760, '#FFC766', .5 + .2 * L.rain);
}
function street(L, t) {
  boilSeed('walk');
  paint([[-900, GROUND - 26], [W + 900, GROUND - 26], [W + 900, 1500], [-900, 1500]], { wash: L.walk, fill: L.walkDk, fillOp: 70, tex: .6, bleed: .03, ink: PAL.ink, sw: 1 });
  inkLine([[-900, GROUND - 26 + 9], [W / 2, GROUND - 26 + 10], [W + 900, GROUND - 26 + 9]], 3, L.kerb, 'ink', 0);
  for (let i = -3; i < 13; i++) inkLine([[i * 230, GROUND - 14], [i * 230 - 90, 1100]], .5, mixCol(L.walk, PAL.ink, .4), 'inkfine', 0);
  if (L.rain > .05) {   // 窗光在湿地面上的倒影
    boilSeed('refl');
    paint(ellPts(WIN.x + WIN.w / 2, GROUND + 78, 420, 34, 20, 6), { fill: L.room, fillOp: 70 * L.rain, bleed: .3, tex: .4, ink: null });
  }
}
// 雨:斜的细线,每一滴从自己的时钟算出来。amt 0..1。front = 画在角色前面的少量大雨滴。
function rain(t, amt, front = false) {
  if (amt <= .02) return;
  const n = Math.round((front ? 26 : 70) * amt);
  for (let i = 0; i < n; i++) {
    const sp = (front ? 1500 : 1150) * (.8 + .4 * hash(i + 3)), len = front ? 90 : 54;
    const x0 = hash(i * 1.7 + (front ? 9 : 0)) * (W + 500) - 150, ph = (t * sp + hash(i + 11) * 1500) % 1500;
    const x = x0 - ph * .22, y = ph - 220;
    boilSeed((front ? 'rf' : 'r') + i);
    inkLine([[x, y], [x - len * .22, y + len]], front ? 1.1 : .6, front ? '#DDE6FF' : '#AEB8E6', 'inkfine', 0);
  }
}
// 地上的雨点溅起的小圈。
function splashes(t, amt) {
  if (amt <= .02) return;
  for (let i = 0; i < 12; i++) {
    const life = .45, ph = (t + hash(i) * 3) % (.9 + hash(i + 5)), k = ph / life;
    if (k > 1) continue;
    const gen = Math.floor((t + hash(i) * 3) / (.9 + hash(i + 5)));
    const x = hash(i * 3.1 + gen * 7.7) * W, y = GROUND + 20 + hash(i + gen) * 150;
    boilSeed('sp' + i);
    paint(ellPts(x, y, 6 + 26 * k, 2 + 7 * k, 12), { ink: '#C9D2F2', sw: .6 * (1 - k) + .1 });
  }
}
// 整个街角的背景(不含角色)。
function corner(L, t, o = {}) {
  skyBg(L, t); cityBg(L, t); cafe(L, t, o); street(L, t);
}
