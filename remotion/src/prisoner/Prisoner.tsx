// 知识大赏 ·《囚徒困境》。分镜见 kb_prisoner/STORYBOARD.md,事实见 kb_prisoner/RESEARCH.md。
// 整片是一个连续的画面:每个元素的位置、透明度都是全片时间 t 的函数,不硬切。
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const W = 1920, H = 1080;
export const PD_DUR = 116;
const SERIF = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";
const SANS = "'Noto Sans SC', 'Microsoft YaHei', sans-serif";
const GOLD = "#F2C14E", GOLD_LT = "#FFE7A3", RED = "#E5484D", INK = "#E9E4F2", DIM = "#8C88A8";
const A_COL = "#5C7FB8", B_COL = "#C0674A";

// ---------- 时间工具 ----------
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (x: number) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const backOut = (x: number) => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const kf = (t: number, keys: [number, number][], e = ease) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return lerp(va, vb, e((t - a) / (b - a))); }
  return keys[keys.length - 1][1];
};
/** 在 [a, b] 里可见:淡入 fi 秒、淡出 fo 秒 */
const vis = (t: number, a: number, b: number, fi = .45, fo = .45) => seg(t, a, a + fi) * (1 - seg(t, b - fo, b));
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- 背景:夜空 ----------
export const Sky: React.FC<{ t: number }> = ({ t }) => (
  <>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0B0D26" /><stop offset=".6" stopColor="#151840" /><stop offset="1" stopColor="#1E1F4A" />
      </linearGradient>
      <radialGradient id="band" cx=".5" cy=".45" r=".5"><stop offset="0" stopColor="#3A3C7A" stopOpacity=".55" /><stop offset="1" stopColor="#3A3C7A" stopOpacity="0" /></radialGradient>
      <radialGradient id="moonGlow"><stop offset="0" stopColor="#FFF4D6" stopOpacity=".55" /><stop offset="1" stopColor="#FFF4D6" stopOpacity="0" /></radialGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="14" /></filter>
    </defs>
    <rect width={W} height={H} fill="url(#sky)" />
    <ellipse cx={W * .5} cy={H * .45} rx={W * .16} ry={H * .7} fill="url(#band)" transform={`rotate(-8 ${W * .5} ${H * .45})`} />
    {Array.from({ length: 140 }, (_, i) => {
      const tw = .45 + .55 * Math.abs(Math.sin(t * (.6 + hash(i + 3) * 1.4) + i));
      return <circle key={i} cx={hash(i) * W} cy={hash(i + 50) * H * .8} r={.6 + hash(i + 9) * 1.6} fill="#FFFFFF" opacity={.25 + .6 * tw * hash(i + 21)} />;
    })}
    <circle cx={W * .88} cy={H * .13} r={90} fill="url(#moonGlow)" />
    <circle cx={W * .88} cy={H * .13} r={30} fill="#F3EEDC" />
    <circle cx={W * .878} cy={H * .126} r={5} fill="#DCD6C2" /><circle cx={W * .89} cy={H * .14} r={3.5} fill="#DCD6C2" />
    <path d={`M0 ${H} L0 ${H * .86} Q${W * .18} ${H * .78} ${W * .34} ${H * .87} T${W * .7} ${H * .85} Q${W * .86} ${H * .79} ${W} ${H * .86} L${W} ${H} Z`} fill="#24244F" opacity=".9" />
    <path d={`M0 ${H} L0 ${H * .93} Q${W * .25} ${H * .88} ${W * .5} ${H * .94} T${W} ${H * .92} L${W} ${H} Z`} fill="#1A1A3C" />
  </>
);

// ---------- 小人 ----------
export type Expr = "calm" | "smile" | "worry" | "sly" | "think" | "sad";
export const Person: React.FC<{ x: number; y: number; s: number; col: string; tag: string; hair: "a" | "b"; expr: Expr; back?: boolean; op?: number; bob?: number }> = ({
  x, y, s, col, tag, hair, expr, back = false, op = 1, bob = 0,
}) => {
  const eye = (cx: number) =>
    expr === "smile" ? <path d={`M${cx - 7} 0 q7 -8 14 0`} stroke="#2A2340" strokeWidth={3.2} fill="none" strokeLinecap="round" />
      : expr === "sly" ? <path d={`M${cx - 8} -2 l16 2`} stroke="#2A2340" strokeWidth={3.6} strokeLinecap="round" />
        : expr === "sad" ? <path d={`M${cx - 7} -3 q7 6 14 0`} stroke="#2A2340" strokeWidth={3} fill="none" strokeLinecap="round" />
          : <ellipse cx={cx} cy={0} rx={4.2} ry={expr === "worry" ? 6.5 : 5.2} fill="#2A2340" />;
  const mouth = {
    calm: "M-7 22 q7 4 14 0", smile: "M-10 19 q10 12 20 0", worry: "M-8 25 q8 -7 16 0", sly: "M-9 21 q12 6 16 -4", think: "M-5 23 l10 0", sad: "M-9 26 q9 -9 18 0",
  }[expr];
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`} opacity={op}>
      <ellipse cx={0} cy={96} rx={52} ry={9} fill="#000" opacity=".28" />
      <path d="M-46 92 Q-48 40 -26 30 L26 30 Q48 40 46 92 Z" fill={col} stroke="#1E1A33" strokeWidth={2.5} />
      <path d="M-14 30 L0 46 L14 30" fill="none" stroke="#F4EEE4" strokeWidth={4} strokeLinejoin="round" />
      {!back ? (
        <g><rect x={-16} y={56} width={32} height={20} rx={3} fill="#F4EEE4" stroke="#1E1A33" strokeWidth={1.6} />
          <text x={0} y={71} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={14} fill="#1E1A33">{tag}</text></g>
      ) : null}
      <circle cx={0} cy={-8} r={40} fill="#F6E3D3" stroke="#1E1A33" strokeWidth={2.5} />
      {back ? (
        <path d="M-41 -8 A41 41 0 0 1 41 -8 L40 6 Q0 20 -40 6 Z" fill="#2B2440" />
      ) : (
        <>
          {hair === "a"
            ? <path d="M-41 -6 Q-42 -52 0 -50 Q42 -52 41 -6 Q30 -30 6 -28 Q-18 -36 -41 -6 Z" fill="#2B2440" />
            : <path d="M-41 -4 Q-46 -54 0 -50 Q46 -54 41 -4 Q36 -24 20 -26 L14 -36 L4 -24 Q-24 -30 -41 -4 Z" fill="#2B2440" />}
          <g transform="translate(0 2)">{eye(-14)}{eye(14)}</g>
          <circle cx={-24} cy={14} r={7} fill="#F2A3A3" opacity=".55" /><circle cx={24} cy={14} r={7} fill="#F2A3A3" opacity=".55" />
          <path d={mouth} transform="translate(0 -4)" stroke="#2A2340" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

// 头顶的刑期:n 块,一块一年
const Years: React.FC<{ x: number; y: number; n: number; col: string; op: number; label?: string }> = ({ x, y, n, col, op, label }) => {
  const k = Math.ceil(n - 1e-6), w = 26, g = 8, tot = k * w + (k - 1) * g;
  return (
    <g opacity={op}>
      {Array.from({ length: k }, (_, i) => {
        const p = clamp(n - i);
        return <rect key={i} x={x - tot / 2 + i * (w + g)} y={y - w * p} width={w} height={w * p} rx={4} fill={col} stroke="#1E1A33" strokeWidth={1.5} />;
      })}
      {label ? <text x={x} y={y + 34} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={26} fill={col}>{label}</text> : null}
    </g>
  );
};

// 金线:两人之间的「信任」。cutL / cutR 0..1 表示这一端被剪断了多少(线会缩回并变红)。
const Thread: React.FC<{ a: [number, number]; b: [number, number]; lift: number; cutL: number; cutR: number; op: number; t: number; taut?: number }> = ({ a, b, lift, cutL, cutR, op, t, taut = 0 }) => {
  if (op <= .01) return null;
  const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - lift + taut * 6 * Math.sin(t * 40);
  const pt = (k: number): [number, number] => [(1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * mx + k * k * b[0], (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * my + k * k * b[1]];
  const path = (k0: number, k1: number) => { let d = ""; for (let i = 0; i <= 24; i++) { const [x, y] = pt(lerp(k0, k1, i / 24)); d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `; } return d; };
  const cut = Math.max(cutL, cutR);
  const col = cut > .05 ? RED : GOLD;
  // 被剪断:中点出现缺口,向剪断的那一侧缩回
  const gapL = .5 - .5 * cutL * .9, gapR = .5 + .5 * cutR * .9;
  return (
    <g opacity={op}>
      {cut < .02 ? (
        <path d={path(0, 1)} stroke={GOLD} strokeWidth={4} fill="none" filter="url(#glow)" />
      ) : (
        <>
          <path d={path(0, cutL > 0 || cutR > 0 ? Math.min(gapL, .5 - .02) : .5)} stroke={col} strokeWidth={4} fill="none" filter="url(#glow)" />
          <path d={path(Math.max(gapR, .5 + .02), 1)} stroke={col} strokeWidth={4} fill="none" filter="url(#glow)" />
        </>
      )}
      <circle cx={a[0]} cy={a[1]} r={6} fill={col} /><circle cx={b[0]} cy={b[1]} r={6} fill={col} />
    </g>
  );
};

// ---------- 字幕 ----------
type Seg = string | [string, string];   // [文字, 颜色]
const SUBS: [number, number, Seg[]][] = [
  [0.6, 4.6, ["两个人,只要都", ["闭嘴", GOLD], ",各坐 ", ["1 年", GOLD], "。"]],
  [4.6, 8.8, ["可最后,两个人都坐了 ", ["2 年", RED], "。"]],
  [10.6, 14.8, ["每个人都做了最聪明的选择,结局却最糟"]],
  [15.4, 20.0, [["1950 年", GOLD], ",兰德公司的两位数学家设计了这个博弈"]],
  [20.0, 24.8, ["后来,", ["图克", GOLD], "把它讲成了两个囚犯的故事"]],
  [25.4, 29.0, ["两人被分开审讯,彼此见不到"]],
  [29.0, 33.2, ["选择只有两个:", ["沉默", GOLD], ",或", ["揭发", RED], "对方"]],
  [33.2, 35.8, ["都沉默:各 ", ["1 年", GOLD]]],
  [35.8, 38.8, ["一人揭发:他", ["释放", GOLD], ",对方 ", ["3 年", RED]]],
  [38.8, 41.8, ["都揭发:各 ", ["2 年", RED]]],
  [42.2, 45.0, ["站在", ["甲", "#9DB8E8"], "的位置想一想"]],
  [45.0, 50.0, ["如果乙沉默:我揭发 ", ["0 年", GOLD], ",沉默 ", ["1 年", DIM]]],
  [50.0, 55.0, ["如果乙揭发:我揭发 ", ["2 年", GOLD], ",沉默 ", ["3 年", DIM]]],
  [55.0, 57.9, ["不管乙怎么选,", ["揭发都更划算", GOLD]]],
  [58.2, 60.6, [["乙", "#E8A68E"], "也是这么想的"]],
  [60.6, 63.2, ["于是:各 ", ["2 年", RED]]],
  [63.2, 65.9, ["明明还有 ", ["各 1 年", GOLD], " 的结局"]],
  [66.3, 71.2, ["谁单独改主意,都会更吃亏——这就是", ["纳什均衡", GOLD]]],
  [71.2, 75.8, ["个人的聪明,加起来是集体的糟糕"]],
  [76.3, 79.0, ["可如果,不只玩一次呢?"]],
  [79.0, 82.6, ["1950 年,他们请两位同事连玩 ", ["100 轮", GOLD]]],
  [82.6, 85.9, ["两人一起合作的,多达 ", ["60 轮", GOLD]]],
  [86.3, 90.0, ["1980 年前后,", ["阿克塞尔罗德", GOLD], "办了一场电脑锦标赛"]],
  [90.0, 93.0, ["第二届,", ["63 个程序", GOLD], "两两对战"]],
  [93.0, 96.6, ["冠军是最简单的一个:", ["以牙还牙", GOLD], ",只有 4 行代码"]],
  [96.6, 99.0, ["第一轮合作,之后照抄对方上一步"]],
  [99.0, 101.9, ["它", ["善良", GOLD], "、", ["会报复", RED], "、", ["会原谅", GOLD], "、", ["清晰", GOLD]]],
  [102.3, 105.6, ["价格战、军备竞赛、气候谈判……"]],
  [105.6, 108.9, ["每一方,都在等", ["对方先停手", RED]]],
];

const Subtitle: React.FC<{ t: number }> = ({ t }) => {
  const cur = SUBS.find(([a, b]) => t >= a && t < b);
  if (!cur) return null;
  const [a, b, segs] = cur, op = vis(t, a, b, .25, .25);
  return (
    <text x={W / 2} y={H * .925} textAnchor="middle" fontFamily={SERIF} fontWeight={600} fontSize={46} fill={INK} opacity={op} letterSpacing={3}
      style={{ paintOrder: "stroke", stroke: "#0B0D26", strokeWidth: 6 }}>
      {segs.map((s, i) => (typeof s === "string" ? <tspan key={i}>{s}</tspan> : <tspan key={i} fill={s[1]}>{s[0]}</tspan>))}
    </text>
  );
};

// ---------- 收益表 ----------
const CELLS = [
  { r: 0, c: 0, txt: "各 1 年", at: 33.4 }, { r: 0, c: 1, txt: "甲 3 年 · 乙 释放", at: 36.0 },
  { r: 1, c: 0, txt: "甲 释放 · 乙 3 年", at: 36.0 }, { r: 1, c: 1, txt: "各 2 年", at: 39.0 },
];
const Matrix: React.FC<{ t: number; op: number; cx: number; cy: number }> = ({ t, op, cx, cy }) => {
  if (op <= .01) return null;
  const cw = 400, ch = 100, x0 = cx - cw, y0 = cy - ch;
  // 推理高亮:甲看「乙沉默」这一列(45–50),再看「乙揭发」(50–55)
  const colHi = (c: number) => (c === 0 ? vis(t, 45, 50.2, .3, .3) : vis(t, 50, 55.2, .3, .3)) * (t < 58 ? 1 : 0);
  const check = (r: number, c: number) => (r === 1 && c === 0 ? seg(t, 47.6, 48.0) : r === 1 && c === 1 ? seg(t, 52.6, 53.0) : 0) * (1 - seg(t, 75.5, 76.2));
  const rowGlow = vis(t, 55, 58.2, .3, .4);
  const nashLock = seg(t, 66.6, 67.4);
  const pareto = vis(t, 63.2, 66.2, .3, .6);
  return (
    <g opacity={op}>
      <text x={cx - cw / 2} y={y0 - 22} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill="#E8A68E">乙 沉默</text>
      <text x={cx + cw / 2} y={y0 - 22} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill="#E8A68E">乙 揭发</text>
      <text x={x0 - 24} y={y0 + ch / 2 + 10} textAnchor="end" fontFamily={SERIF} fontWeight={700} fontSize={28} fill="#9DB8E8">甲 沉默</text>
      <text x={x0 - 24} y={y0 + ch * 1.5 + 10} textAnchor="end" fontFamily={SERIF} fontWeight={700} fontSize={28} fill="#9DB8E8">甲 揭发</text>
      {[0, 1].map((c) => colHi(c) > .01 ? <rect key={"h" + c} x={x0 + c * cw - 4} y={y0 - 6} width={cw + 8} height={ch * 2 + 12} rx={10} fill="none" stroke={GOLD_LT} strokeWidth={3} strokeDasharray="10 8" opacity={colHi(c)} /> : null)}
      {rowGlow > .01 ? <rect x={x0 - 4} y={y0 + ch - 4} width={cw * 2 + 8} height={ch + 8} rx={10} fill={GOLD} opacity={.18 * rowGlow} /> : null}
      {CELLS.map((cell, i) => {
        const k = backOut(seg(t, cell.at, cell.at + .35));
        const x = x0 + cell.c * cw, y = y0 + cell.r * ch;
        const both2 = cell.r === 1 && cell.c === 1, both1 = cell.r === 0 && cell.c === 0;
        const red = both2 ? seg(t, 60.6, 61.0) : 0, gold1 = both1 ? pareto : 0;
        return (
          <g key={i}>
            <rect x={x + 3} y={y + 3} width={cw - 6} height={ch - 6} rx={8} fill={red > 0 ? `rgba(229,72,77,${.2 + .25 * red})` : gold1 > 0 ? `rgba(242,193,78,${.12 + .3 * gold1})` : "rgba(255,255,255,.05)"} stroke="#4A4878" strokeWidth={2} />
            <text x={x + cw / 2} y={y + ch / 2 + 11} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={38} fill={INK} opacity={clamp(k)}
              transform={`translate(${x + cw / 2} ${y + ch / 2}) scale(${.6 + .4 * k}) translate(${-(x + cw / 2)} ${-(y + ch / 2)})`}>{cell.txt}</text>
            {check(cell.r, cell.c) > 0 ? <path d={`M${x + cw - 50} ${y + 52} l12 14 l26 -30`} stroke={GOLD} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={check(cell.r, cell.c)} /> : null}
          </g>
        );
      })}
      {nashLock > 0 ? (
        <g opacity={nashLock * (1 - seg(t, 75.5, 76.2))}>
          <rect x={x0 + cw - 4} y={y0 + ch - 4} width={cw + 8} height={ch + 8} rx={12} fill="none" stroke={GOLD} strokeWidth={6} filter="url(#glow)" />
          <text x={x0 + cw * 1.5} y={y0 + ch * 2 + 52} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={34} fill={GOLD}>纳什均衡</text>
        </g>
      ) : null}
    </g>
  );
};

// ---------- 主画面 ----------
export const Prisoner: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // 两人的位置:开场并排 → 标题时退到两侧 → 进牢房 → 第 8 段起退场 → 结尾回来
  const ax = kf(t, [[0, W * .4], [9.5, W * .4], [11.5, W * .2], [25, W * .2], [26.5, W * .27], [109, W * .27]]);
  const bx = kf(t, [[0, W * .6], [9.5, W * .6], [11.5, W * .8], [25, W * .8], [26.5, W * .73], [109, W * .73]]);
  const py = kf(t, [[0, H * .5], [9.5, H * .5], [11.5, H * .56], [25, H * .56], [26.5, H * .29], [109, H * .29], [110.5, H * .48]]);
  const ps = kf(t, [[0, 1.5], [9.5, 1.5], [11.5, 1.15], [25, 1.15], [26.5, 1.12], [109, 1.12], [110.5, 1.25]]);
  const pOp = (1 - vis(t, 15.2, 25.2, .5, .5) * .75) * (1 - vis(t, 76, 109.6, .6, .6));
  const turned = t > 5.2 && t < 9.2;
  const exprA: Expr = t < 4.6 ? "calm" : t < 9.5 ? "sad" : t < 42 ? "worry" : t < 58 ? "think" : t < 63 ? "sly" : t < 76 ? "sad" : t > 111 ? "smile" : "calm";
  const exprB: Expr = t < 4.6 ? "calm" : t < 9.5 ? "sad" : t < 58 ? "worry" : t < 61 ? "sly" : t < 76 ? "sad" : t > 111 ? "smile" : "calm";
  const bob = (ph: number) => -4 * Math.abs(Math.sin(t * 1.9 + ph));

  // 墙:标题时升起,结尾降下
  const wallH = kf(t, [[10, 0], [12, 1], [110, 1], [112.5, 0]]) * (1 - vis(t, 76, 109.6, .6, .6) * 0);
  const wallOp = 1 - vis(t, 76, 109.4, .6, .6);
  const cellOp = vis(t, 25.4, 76.6, .8, .6) + vis(t, 109.2, 114, .8, 1.2);

  // 金线的剪断状态
  const handA: [number, number] = [ax + 44 * ps, py + 50 * ps], handB: [number, number] = [bx - 44 * ps, py + 50 * ps];
  let cutL = 0, cutR = 0;
  if (t > 5.0 && t < 9.4) { cutL = seg(t, 5.0, 5.5); cutR = seg(t, 5.2, 5.7); }
  if (t > 35.9 && t < 38.6) cutR = seg(t, 36.0, 36.4);            // 演示:一人揭发
  if (t > 38.9 && t < 42) { cutL = seg(t, 39.0, 39.4); cutR = seg(t, 39.1, 39.5); }
  if (t > 60.5 && t < 76) { cutL = seg(t, 60.6, 61.0); cutR = seg(t, 60.7, 61.1); }
  const threadOp = (vis(t, .4, 9.6, .6, .4) + vis(t, 26.5, 76.2, .8, .6) + seg(t, 111.2, 112.4)) * (t > 41.8 && t < 60.4 ? .55 : 1);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0D26" }}>
      <Audio src={staticFile("prisoner_music.wav")} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Sky t={t} />
        {/* 角标 */}
        <text x={36} y={46} fontFamily={SANS} fontWeight={700} fontSize={22} fill="#CFCBE6" opacity=".8"><tspan fill={RED}>▣ </tspan>知识大赏</text>
        <text x={W - 36} y={46} textAnchor="end" fontFamily={SANS} fontSize={18} fill="#9C98BA" opacity={vis(t, 25.5, 109, 1, 1) * .85}>博弈论模型演示 · 刑期为教学示例</text>

        {/* 两间牢房 */}
        <g opacity={cellOp}>
          {[[W * .08, W * .38], [W * .54, W * .38]].map(([x, w], i) => (
            <g key={i}>
              <rect x={x} y={H * .06} width={w} height={H * .43} rx={14} fill="rgba(20,20,52,.55)" stroke="#3E3C70" strokeWidth={3} />
              {Array.from({ length: 7 }, (_, k) => <line key={k} x1={x + w * (k + 1) / 8} y1={H * .06} x2={x + w * (k + 1) / 8} y2={H * .49} stroke="#3E3C70" strokeWidth={4} opacity=".55" />)}
              <line x1={x + w / 2} y1={H * .06} x2={x + w / 2} y2={H * .12} stroke="#6C6A9A" strokeWidth={2} />
              <circle cx={x + w / 2} cy={H * .13} r={60} fill="url(#moonGlow)" opacity=".7" />
              <path d={`M${x + w / 2 - 16} ${H * .12} h32 l-6 14 h-20 Z`} fill="#F2C14E" />
            </g>
          ))}
        </g>
        {/* 墙 */}
        {wallH > .01 ? <rect x={W * .493} y={H * .62 - H * .58 * wallH} width={W * .014} height={H * .58 * wallH} rx={6} fill="#3A3768" stroke="#57548C" strokeWidth={2} opacity={wallOp} /> : null}

        {/* 第 3 段:手稿与图克 */}
        <g opacity={vis(t, 15.2, 25.4, .6, .6)} transform={`translate(${W * .5} ${H * .43 - 30 * seg(t, 24.8, 25.4)}) rotate(-3)`}>
          <rect x={-230} y={-290} width={460} height={560} rx={6} fill="#EFE6CF" stroke="#BCAE8C" strokeWidth={2} />
          <text x={0} y={-226} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fill="#4A3F2C" letterSpacing={2}>A NON-COOPERATIVE GAME</text>
          <line x1={-180} y1={-206} x2={180} y2={-206} stroke="#8C7E60" strokeWidth={1.5} />
          {[0, 1, 2, 3].map((k) => <line key={k} x1={-180} y1={-176 + k * 22} x2={k === 3 ? 60 : 180} y2={-176 + k * 22} stroke="#B8AA88" strokeWidth={6} strokeLinecap="round" />)}
          <g transform="translate(0 40)">
            <rect x={-130} y={-80} width={260} height={160} fill="none" stroke="#4A3F2C" strokeWidth={2.5} />
            <line x1={0} y1={-80} x2={0} y2={80} stroke="#4A3F2C" strokeWidth={2.5} /><line x1={-130} y1={0} x2={130} y2={0} stroke="#4A3F2C" strokeWidth={2.5} />
            <text x={-65} y={-30} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fill="#7C6E52">?</text>
            <text x={65} y={50} textAnchor="middle" fontFamily="Georgia, serif" fontSize={22} fill="#7C6E52">?</text>
          </g>
          <text x={0} y={190} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={22} fill="#4A3F2C">Flood &amp; Dresher · RAND</text>
          <g transform="translate(150 -250) rotate(10)"><rect x={-56} y={-24} width={112} height={48} rx={6} fill="none" stroke={RED} strokeWidth={3} /><text x={0} y={10} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={28} fill={RED}>1950</text></g>
        </g>
        <g opacity={vis(t, 20.0, 25.4, .5, .6)} transform={`translate(${lerp(W * .86, W * .78, easeOut(seg(t, 20, 20.8)))} ${H * .55})`}>
          <rect x={-150} y={-60} width={300} height={120} rx={12} fill="rgba(30,30,70,.85)" stroke={GOLD} strokeWidth={2} />
          <text x={0} y={-10} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={30} fill={GOLD}>A. W. Tucker</text>
          <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontSize={22} fill={INK}>给斯坦福心理学家讲课</text>
        </g>

        {/* 选择牌 */}
        <g opacity={vis(t, 29.2, 42, .4, .5)}>
          {[ax, bx].map((x, i) => (
            <g key={i} transform={`translate(${x} ${H * .1})`}>
              <rect x={-118} y={-26} width={108} height={52} rx={10} fill="rgba(242,193,78,.18)" stroke={GOLD} strokeWidth={2} />
              <text x={-64} y={11} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill={GOLD}>沉默</text>
              <rect x={10} y={-26} width={108} height={52} rx={10} fill="rgba(229,72,77,.18)" stroke={RED} strokeWidth={2} />
              <text x={64} y={11} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill={RED}>揭发</text>
            </g>
          ))}
        </g>

        <Thread a={handA} b={handB} lift={kf(t, [[0, 110], [10, 110], [26.5, 150]])} cutL={cutL} cutR={cutR} op={clamp(threadOp)} t={t} />

        {/* 两个人 */}
        <Person x={ax} y={py} s={ps} col={A_COL} tag="甲" hair="a" expr={exprA} back={turned} op={pOp} bob={bob(0)} />
        <Person x={bx} y={py} s={ps} col={B_COL} tag="乙" hair="b" expr={exprB} back={turned} op={pOp} bob={bob(1.3)} />

        {/* 开场的刑期和印章 */}
        <Years x={ax} y={py - 70 * ps} n={t < 5.2 ? easeOut(seg(t, .9, 1.4)) : 1 + easeOut(seg(t, 5.6, 6.1))} col={t < 5.2 ? GOLD : RED} op={vis(t, .8, 9.6, .3, .5)} />
        <Years x={bx} y={py - 70 * ps} n={t < 5.2 ? easeOut(seg(t, 1.0, 1.5)) : 1 + easeOut(seg(t, 5.7, 6.2))} col={t < 5.2 ? GOLD : RED} op={vis(t, .8, 9.6, .3, .5)} />
        {t > 6.4 && t < 9.6 ? (
          <g opacity={vis(t, 6.4, 9.6, .1, .5)} transform={`translate(${W / 2} ${H * .25}) rotate(-12) scale(${lerp(1.8, 1, easeOut(seg(t, 6.4, 6.7)))})`}>
            <rect x={-90} y={-44} width={180} height={88} rx={8} fill="none" stroke={RED} strokeWidth={6} />
            <text x={0} y={18} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={52} fill={RED}>判 决</text>
          </g>
        ) : null}

        {/* 标题 */}
        <g opacity={vis(t, 9.4, 15.2, .6, .6)}>
          <text x={W / 2} y={H * .42} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={148} fill={GOLD} letterSpacing={24} filter="url(#glow)">囚徒困境</text>
          <text x={W / 2} y={H * .5} textAnchor="middle" fontFamily="Georgia, serif" fontSize={26} fill="#B9B4D6" letterSpacing={10}>PRISONER'S DILEMMA · 1950</text>
        </g>

        {/* 思考泡泡 */}
        {[[ax, 42.2, 57.9], [bx, 58.2, 60.5]].map(([x, a, b], i) => {
          const op = vis(t, a, b, .3, .3);
          if (op <= .01) return null;
          const ok = i === 0 ? seg(t, 55, 55.4) : seg(t, 59.0, 59.4);
          return (
            <g key={i} opacity={op} transform={`translate(${x + (i ? -110 : 110)} ${H * .1})`}>
              <circle cx={i ? 70 : -70} cy={110} r={8} fill="#E9E4F2" /><circle cx={i ? 48 : -48} cy={84} r={12} fill="#E9E4F2" />
              <ellipse cx={0} cy={18} rx={110} ry={56} fill="#E9E4F2" />
              <text x={0} y={30} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={34} fill={ok > .5 ? RED : "#2A2340"}>{ok > .5 ? "揭发 ✓" : "怎么选?"}</text>
            </g>
          );
        })}

        <Matrix t={t} op={vis(t, 32.8, 76.4, .6, .6)} cx={W / 2} cy={H * .715} />
        <text x={W / 2} y={H * .87} textAnchor="middle" fontFamily={SANS} fontSize={20} fill="#9C98BA" opacity={vis(t, 68.5, 76, .5, .5)}>纳什均衡:John Nash,1950 · 1994 年诺贝尔经济学奖</text>

        {/* 第 8 段:100 轮 */}
        {(() => {
          const op = vis(t, 76.6, 86.4, .6, .6);
          if (op <= .01) return null;
          const coop = new Set<number>(); let c = 0; for (let i = 0; i < 100 && c < 60; i++) if (hash(i * 3.3 + 1) < .66 || 100 - i <= 60 - c) { coop.add(i); c++; }
          let shown = 0, cnt = 0;
          const cells = Array.from({ length: 100 }, (_, i) => {
            const at = 79.4 + i * .055, k = seg(t, at, at + .12);
            if (k > .5) { shown++; if (coop.has(i)) cnt++; }
            const x = W / 2 - 5 * 66 + (i % 10) * 66, y = H * .16 + Math.floor(i / 10) * 54;
            const col = k < .5 ? "rgba(255,255,255,.06)" : coop.has(i) ? GOLD : "#5A577F";
            return <rect key={i} x={x + 4} y={y + 4} width={58} height={46} rx={7} fill={col} opacity={k < .5 ? 1 : .9} transform={`translate(${x + 33} ${y + 27}) scale(${k < .5 ? 1 - .3 * k : 1}, 1) translate(${-(x + 33)} ${-(y + 27)})`} />;
          });
          return (
            <g opacity={op}>
              {cells}
              <text x={W / 2} y={H * .16 + 10 * 54 + 50} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={40} fill={INK}>
                第 <tspan fill={GOLD}>{shown}</tspan> 轮 · 一起合作 <tspan fill={GOLD}>{cnt}</tspan> 轮
              </text>
              <text x={W - 40} y={H * .78} textAnchor="end" fontFamily={SANS} fontSize={18} fill="#9C98BA">Flood–Dresher 实验(1950)· 统计口径各有出入</text>
            </g>
          );
        })()}

        {/* 第 9 段:锦标赛 */}
        {(() => {
          const op = vis(t, 86.6, 102.4, .6, .6);
          if (op <= .01) return null;
          const N = 63, cx = W / 2, cy = H * .44, R = 300;
          const win = easeOut(seg(t, 93, 94.2));
          const pos = (i: number) => { const a = (i / N) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(a) * R * 1.45, cy + Math.sin(a) * R * .95]; };
          const lines = [];
          if (t < 93.5) for (let k = 0; k < 18; k++) {
            const f = Math.floor(t * 6) + k * 7, i = Math.floor(hash(f) * N), j = Math.floor(hash(f + 1) * N);
            const [x1, y1] = pos(i), [x2, y2] = pos(j);
            lines.push(<line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={k % 3 ? GOLD : RED} strokeWidth={1.4} opacity={.35 * seg(t, 89.5, 90.5)} />);
          }
          return (
            <g opacity={op}>
              {lines}
              {Array.from({ length: N }, (_, i) => {
                const [x, y] = pos(i), k = seg(t, 87 + i * .03, 87.4 + i * .03), me = i === 0;
                return <rect key={i} x={x - 13} y={y - 13} width={26} height={26} rx={5} fill={me ? GOLD : "#4C4A80"} stroke="#7A77B0" strokeWidth={1.5} opacity={k * (me ? 1 - win : 1 - .5 * win)} />;
              })}
              <g opacity={win} transform={`translate(${cx} ${lerp(cy - R * .95, cy - 40, win)}) scale(${lerp(.3, 1, win)})`}>
                <rect x={-250} y={-74} width={500} height={148} rx={18} fill="rgba(40,36,80,.95)" stroke={GOLD} strokeWidth={4} filter="url(#glow)" />
                <text x={0} y={-6} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={62} fill={GOLD}>以牙还牙</text>
                <text x={0} y={44} textAnchor="middle" fontFamily="Georgia, serif" fontSize={26} fill={INK}>Tit for Tat · Anatol Rapoport</text>
              </g>
              <g opacity={vis(t, 95.0, 102.4, .5, .6)} transform={`translate(${cx} ${cy + 130})`}>
                {["第 1 轮:合作", "之后:照抄对方上一步", "对方合作 → 我合作", "对方背叛 → 我背叛"].map((s, i) => (
                  <text key={i} x={-220} y={i * 40} fontFamily="'Cascadia Mono', Consolas, monospace" fontSize={28} fill={i < 2 ? INK : DIM} opacity={seg(t, 95.2 + i * .35, 95.5 + i * .35)}>
                    <tspan fill={GOLD}>{i + 1} </tspan>{s}</text>
                ))}
              </g>
              {["善良", "会报复", "会原谅", "清晰"].map((s, i) => {
                const k = backOut(seg(t, 99.1 + i * .45, 99.5 + i * .45));
                const x = cx - 3 * 150 / 2 + i * 150 + (i - 1.5) * 40;
                return (
                  <g key={s} opacity={clamp(k)} transform={`translate(${x} ${H * .82}) scale(${k})`}>
                    <circle r={58} fill={i === 1 ? "rgba(229,72,77,.22)" : "rgba(242,193,78,.2)"} stroke={i === 1 ? RED : GOLD} strokeWidth={3} />
                    <text y={11} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={s.length > 2 ? 28 : 32} fill={i === 1 ? RED : GOLD}>{s}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* 第 10 段:现实里的困境 */}
        {(() => {
          const op = vis(t, 102.4, 109.4, .6, .6);
          if (op <= .01) return null;
          const items = [["价格战", "shop"], ["军备竞赛", "tower"], ["气候谈判", "globe"]];
          return (
            <g opacity={op}>
              {items.map(([name, kind], i) => {
                const y = H * (.2 + i * .23), k = easeOut(seg(t, 102.6 + i * .5, 103.2 + i * .5)), sx = W * .5;
                const icon = (x: number, col: string) => kind === "shop" ? (
                  <g transform={`translate(${x} ${y})`}><rect x={-46} y={-20} width={92} height={56} fill={col} stroke="#1E1A33" strokeWidth={2.5} /><path d="M-56 -20 L-40 -48 L40 -48 L56 -20 Z" fill="#F4EEE4" stroke="#1E1A33" strokeWidth={2.5} /><rect x={-14} y={6} width={28} height={30} fill="#1E1A33" opacity=".6" /></g>
                ) : kind === "tower" ? (
                  <g transform={`translate(${x} ${y})`}><rect x={-26} y={-50} width={52} height={86} fill={col} stroke="#1E1A33" strokeWidth={2.5} />{[-26, -9, 8].map((dx) => <rect key={dx} x={dx} y={-64} width={14} height={16} fill={col} stroke="#1E1A33" strokeWidth={2} />)}</g>
                ) : (
                  <g transform={`translate(${x} ${y})`}><circle r={40} fill="#3C79B8" stroke="#1E1A33" strokeWidth={2.5} /><path d="M-24 -18 q14 -10 24 4 q10 14 22 2 M-30 14 q16 -6 26 8" stroke="#6FBF73" strokeWidth={9} fill="none" strokeLinecap="round" /></g>
                );
                return (
                  <g key={name} opacity={k}>
                    <Thread a={[sx - 300 + 76, y]} b={[sx + 300 - 76, y]} lift={8} cutL={0} cutR={0} op={1} t={t} taut={1} />
                    <g transform={`translate(${sx - 300} ${y}) scale(1.5) translate(${-(sx - 300)} ${-y})`}>{icon(sx - 300, A_COL)}</g><g transform={`translate(${sx + 300} ${y}) scale(1.5) translate(${-(sx + 300)} ${-y})`}>{icon(sx + 300, B_COL)}</g>
                    <text x={sx} y={y - 22} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={34} fill={INK}>{name}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {/* 结尾金句与参考 */}
        <g opacity={vis(t, 112.2, 116.2, .8, .01)}>
          <text x={W / 2} y={H * .72} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={54} fill={INK} letterSpacing={6}>
            一次的博弈里,<tspan fill={RED}>背叛</tspan>最聪明;
          </text>
          <text x={W / 2} y={H * .81} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={54} fill={INK} letterSpacing={6} opacity={seg(t, 113.2, 113.9)}>
            一辈子的博弈里,<tspan fill={GOLD}>善良</tspan>才赢。
          </text>
          <text x={W / 2} y={H * .915} textAnchor="middle" fontFamily={SANS} fontSize={17} fill="#8C88A8" opacity={seg(t, 114, 114.6)}>
            声明:博弈论模型演示,刑期为教学示例 · 参考:Flood &amp; Dresher (RAND, 1950);Axelrod, The Evolution of Cooperation (1984);Stanford Encyclopedia of Philosophy「Prisoner's Dilemma」
          </text>
        </g>

        <Subtitle t={t} />
        {/* 开头从黑场亮起、结尾收黑 */}
        <rect width={W} height={H} fill="#05060F" opacity={1 - seg(t, 0, .6) + seg(t, 115.4, 116)} />
      </svg>
    </AbsoluteFill>
  );
};
