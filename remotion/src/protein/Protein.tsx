// 知识大赏 ·《蛋白粉喝了真的伤肾吗》。分镜见 kb_protein/STORYBOARD.md,事实见 kb_protein/RESEARCH.md。
// 和《囚徒困境》同一套画风:整片连续,每个元素都是全片时间 t 的函数。
import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Person, Sky } from "../prisoner/Prisoner";

const W = 1920, H = 1080;
export const PT_DUR = 104;
const SERIF = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";
const SANS = "'Noto Sans SC', 'Microsoft YaHei', sans-serif";
const GOLD = "#F2C14E", RED = "#E5484D", INK = "#E9E4F2", SRC = "#9C98BA";
const OK = "#5BC48A", AMBER = "#E8A23A", BLUE = "#7FA7E8";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = (x: number) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const backOut = (x: number) => { const c = 1.7, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const vis = (t: number, a: number, b: number, fi = .45, fo = .45) => seg(t, a, a + fi) * (1 - seg(t, b - fo, b));
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), c = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp(k)));
  return "#" + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
};

// ---------- 肾 ----------
// 一颗豆形肾,里面一排小滤网(肾小球)在转。health 1 = 绿色正常,0 = 琥珀色受损;speed = 滤网转速;dark 0..1 = 变暗。
const Kidney: React.FC<{ x: number; y: number; s: number; t: number; health: number; speed?: number; dark?: number; sweat?: number; glow?: number; op?: number }> = ({
  x, y, s, t, health, speed = 1, dark = 0, sweat = 0, glow = 0, op = 1,
}) => {
  const col = mix(mix(AMBER, OK, health), "#3A3550", dark * .7);
  const d = "M-60 -110 C40 -150 120 -80 110 0 C100 80 40 140 -40 120 C-110 100 -80 40 -40 20 C-20 10 -20 -20 -40 -30 C-90 -50 -120 -90 -60 -110 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      {glow > 0 ? <circle r={190} fill={OK} opacity={.12 * glow} filter="url(#soft)" /> : null}
      <path d={d} fill={col} stroke="#1E1A33" strokeWidth={5} />
      <path d="M-30 -80 C30 -100 80 -50 74 0" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth={8} fill="none" strokeLinecap="round" />
      {[[20, -60], [56, -10], [44, 48], [0, 80], [-24, -76]].map(([cx, cy], i) => {
        const a = t * 2.2 * speed + i;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) rotate(${(a * 57.3) % 360})`}>
            <circle r={15} fill="none" stroke="#1E1A33" strokeWidth={3} opacity=".7" />
            <path d="M-11 0 L11 0 M0 -11 L0 11" stroke="#1E1A33" strokeWidth={3} opacity=".7" />
          </g>
        );
      })}
      <path d="M-40 0 C-90 10 -120 40 -150 90" stroke="#C25A6A" strokeWidth={10} fill="none" strokeLinecap="round" />
      {sweat > 0 ? [0, 1].map((i) => {
        const k = ((t * 1.3 + i * .5) % 1);
        return <path key={i} transform={`translate(${80 + i * 34} ${-120 + k * 60})`} d="M0 -14 C8 -2 10 4 0 10 C-10 4 -8 -2 0 -14 Z" fill="#9CD3FF" opacity={sweat * (1 - k)} />;
      }) : null}
    </g>
  );
};

// ---------- 字幕 ----------
type Seg = string | [string, string];
const SUBS: [number, number, Seg[]][] = [
  [0.0, 2.4, ["营销号喊了好多年:喝蛋白粉,", ["伤肾", RED]]],
  [2.4, 5.0, ["我们翻了 ", ["28 项研究、1358 个人", GOLD], "的数据"]],
  [5.0, 7.6, ["结论,可能和你想的", ["正好相反", GOLD]]],
  [7.9, 10.8, ["「健身的人,肾都不好」「一勺蛋白粉 = 慢性毒药」……"]],
  [10.8, 13.9, ["这些说法,到底从哪来?"]],
  [14.3, 18.0, ["这个说法,最早来自 ", ["1982 年", GOLD], "的一篇论文"]],
  [18.0, 21.4, ["蛋白吃得多,肾就要", ["加班过滤", GOLD]]],
  [21.4, 25.8, ["但它研究的,是", ["本来就受损的肾", AMBER]]],
  [26.3, 29.2, ["健康人呢?"]],
  [29.2, 33.0, ["2018 年,一项荟萃分析汇总了 ", ["28 项研究、1358 人", GOLD]]],
  [33.0, 36.6, ["每天吃 ", ["100 克以上", GOLD], "蛋白的人,和吃得正常的人比"]],
  [36.6, 39.8, ["肾功能的变化:", ["没有差别", OK]]],
  [40.3, 44.8, ["更极端的:每天每公斤 ", ["约 3 克", GOLD], ",连吃一年"]],
  [44.8, 49.8, ["14 名训练者,肝肾指标", ["都没有变坏", OK]]],
  [50.3, 53.6, ["真正要小心的,是", ["已经有肾病", AMBER], "的人"]],
  [53.6, 57.4, ["一项 11 年的跟踪:肾正常的人,", ["吃多吃少没关系", OK]]],
  [57.4, 61.0, ["已有轻度肾功能不全的,", ["吃得越多,下降越快", RED]]],
  [61.0, 63.8, ["所以肾病患者,蛋白质要", ["听医生的", GOLD]]],
  [64.3, 67.4, ["再看看,大家吃够了吗?"]],
  [67.4, 70.4, ["美国成年男性,每天约 ", ["97 克", BLUE]]],
  [70.4, 74.4, ["中国 18–49 岁男性,中位数 ", ["61.6 克", AMBER], ",推荐量 ", ["65 克", GOLD]]],
  [74.4, 77.8, ["女性:", ["50 克", AMBER], ",推荐 ", ["55 克", GOLD]]],
  [78.3, 80.4, ["按研究口径,18–49 岁里,", ["一半以上", RED], "没吃到推荐量"]],
  [80.4, 82.0, ["50–64 岁,", ["六成以上", RED]]],
  [82.0, 85.6, ["65 岁以上,超过 ", ["七成", RED]]],
  [85.6, 89.8, ["官方报告说", ["人均够", GOLD], ";分到每个人头上,", ["很多人不够", RED]]],
  [90.3, 93.0, ["吃够蛋白,先靠鸡蛋、牛奶、豆制品、鱼和肉"]],
  [93.0, 95.6, ["蛋白粉只是", ["方便的补充", GOLD], ",一勺约 20 多克"]],
  [95.6, 97.9, ["真正该挑的是来源:", ["选正规产品,看第三方检测", GOLD]]],
];
const Subtitle: React.FC<{ t: number }> = ({ t }) => {
  const cur = SUBS.find(([a, b]) => t >= a && t < b);
  if (!cur) return null;
  const [a, b, segs] = cur;
  return (
    <text x={W / 2} y={H * .925} textAnchor="middle" fontFamily={SERIF} fontWeight={600} fontSize={46} fill={INK} opacity={a < .05 ? 1 - seg(t, b - .25, b) : vis(t, a, b, .25, .25)} letterSpacing={3}
      style={{ paintOrder: "stroke", stroke: "#0B0D26", strokeWidth: 6 }}>
      {segs.map((s, i) => (typeof s === "string" ? <tspan key={i}>{s}</tspan> : <tspan key={i} fill={s[1]}>{s[0]}</tspan>))}
    </text>
  );
};
const Src: React.FC<{ x: number; y: number; op: number; children: React.ReactNode; anchor?: "start" | "middle" | "end" }> = ({ x, y, op, children, anchor = "middle" }) =>
  op > .01 ? <text x={x} y={y} textAnchor={anchor} fontFamily={SANS} fontSize={20} fill={SRC} opacity={op}>{children}</text> : null;

// ---------- 主画面 ----------
const FEED = ["喝蛋白粉伤肾!赶紧停!", "健身的人,肾都不好", "医生不会告诉你的真相", "一勺蛋白粉 = 慢性毒药?", "蛋白粉 = 伤肾粉", "专家:年轻人肾衰,都怪它", "转给家人看!"];

export const Protein: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B0D26" }}>
      <Audio src={staticFile("protein_music.wav")} />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Sky t={t} />
        <text x={36} y={46} fontFamily={SANS} fontWeight={700} fontSize={22} fill="#CFCBE6" opacity=".8"><tspan fill={RED}>▣ </tspan>知识大赏</text>
        <text x={W - 36} y={46} textAnchor="end" fontFamily={SANS} fontSize={18} fill={SRC} opacity={vis(t, 8, 103, 1, 1) * .85}>科普演示 · 不构成医疗建议</text>

        {/* 0 · 黄金开头(0–7.6):冲突 → 证据量 → 悬念。第 0 秒就有字、有声 */}
        {(() => {
          const op = t < 7.8 ? 1 - seg(t, 7.4, 7.8) : 0;
          if (op <= .01) return null;
          const p1 = 1 - seg(t, 2.3, 2.5), p2 = vis(t, 2.4, 5.1, .15, .2), p3 = vis(t, 5.0, 7.8, .15, .4);
          const slam = backOut(seg(t, 0, .35)), shake = t < .6 ? 10 * Math.sin(t * 90) * (1 - t / .6) : 0;
          const n28 = Math.round(28 * easeOut(seg(t, 2.5, 3.6))), n1358 = Math.round(1358 * easeOut(seg(t, 2.7, 4.0)));
          return (
            <g opacity={op}>
              {/* 系列标识:让人知道这是一个系列,想去主页翻 */}
              <g transform={`translate(${W / 2} ${H * .1})`}>
                <rect x={-250} y={-34} width={500} height={68} rx={34} fill="rgba(229,72,77,.18)" stroke={RED} strokeWidth={3} />
                <text y={13} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={36} fill={INK} letterSpacing={4}>知识大赏 · 第 2 期</text>
                <text y={72} textAnchor="middle" fontFamily={SANS} fontSize={24} fill={SRC}>每期讲透一个知识点</text>
              </g>
              {p1 > .01 ? (
                <g opacity={p1} transform={`translate(${shake} 0)`}>
                  <Kidney x={W * .2} y={H * .55} s={.9} t={t} health={0} speed={3} sweat={1} />
                  <text x={W / 2} y={H * .4} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={120} fill={INK}>喝蛋白粉</text>
                  <text x={W / 2} y={H * .62} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={190 * (1.25 - .25 * slam)} fill={RED} filter="url(#glow)">= 伤肾?</text>
                  <g transform={`translate(${W * .8} ${H * .56}) rotate(-14)`}>
                    <path d="M-80 -10 Q0 60 80 -10 Z" fill="#D9CDB8" stroke="#1E1A33" strokeWidth={4} />
                    <rect x={70} y={-26} width={130} height={18} rx={9} fill="#D9CDB8" stroke="#1E1A33" strokeWidth={4} transform="rotate(-18)" />
                    <ellipse cx={0} cy={-12} rx={70} ry={16} fill="#F4EEE0" />
                  </g>
                </g>
              ) : null}
              {p2 > .01 ? (
                <g opacity={p2}>
                  {Array.from({ length: 9 }, (_, i) => {
                    const k = easeOut(seg(t, 2.4 + i * .06, 2.9 + i * .06)), a = (i - 4) * 7 * k;
                    return (
                      <g key={i} transform={`translate(${W / 2} ${H * .78}) rotate(${a}) translate(0 -330)`}>
                        <rect x={-120} y={-150} width={240} height={300} rx={6} fill="#EFE6CF" stroke="#BCAE8C" strokeWidth={2} opacity={.5 + .05 * i} />
                        {[0, 1, 2, 3, 4].map((r) => <line key={r} x1={-90} y1={-100 + r * 34} x2={r === 4 ? 20 : 90} y2={-100 + r * 34} stroke="#C8BA98" strokeWidth={8} strokeLinecap="round" />)}
                      </g>
                    );
                  })}
                  <rect x={W * .2} y={H * .3} width={W * .6} height={H * .32} rx={24} fill="rgba(11,13,38,.82)" />
                  <text x={W * .36} y={H * .5} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={150} fill={GOLD} filter="url(#glow)">{n28}</text>
                  <text x={W * .36} y={H * .58} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill={INK}>项研究</text>
                  <text x={W * .64} y={H * .5} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={150} fill={GOLD} filter="url(#glow)">{n1358}</text>
                  <text x={W * .64} y={H * .58} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill={INK}>个人的数据</text>
                </g>
              ) : null}
              {p3 > .01 ? (
                <g opacity={p3}>
                  {[[.97, BLUE], [.69, BLUE], [.616, AMBER], [.5, AMBER]].map(([v, col], i) => (
                    <rect key={i} x={W * .26} y={H * .3 + i * 70} width={W * .48 * (v as number) * easeOut(seg(t, 5.0 + i * .12, 5.6 + i * .12))} height={44} rx={8} fill={col as string} opacity=".45" />
                  ))}
                  <text x={W * .8} y={H * .6} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={300 * backOut(seg(t, 5.3, 5.8))} fill={GOLD} filter="url(#glow)">?</text>
                  <text x={W / 2} y={H * .78} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={54} fill={INK}>
                    看到最后:中国人的蛋白质,<tspan fill={RED}>真的吃够了吗?</tspan>
                  </text>
                </g>
              ) : null}
            </g>
          );
        })()}

        {/* 1 · 营销号信息流(7.6–14.2):这些说法从哪来 */}
        {(() => {
          const op = vis(t, 7.6, 14.3, .4, .5);
          if (op <= .01) return null;
          const scroll = (t - 7.6) * 130;
          return (
            <g opacity={op}>
              <rect x={W / 2 - 280} y={70} width={560} height={800} rx={48} fill="#14163A" stroke="#4A4878" strokeWidth={4} />
              <clipPath id="feedClip"><rect x={W / 2 - 256} y={110} width={512} height={730} rx={20} /></clipPath>
              <g clipPath="url(#feedClip)">
                {Array.from({ length: 14 }, (_, i) => {
                  const y = 130 + i * 128 - scroll + 120;
                  return (
                    <g key={i}>
                      <rect x={W / 2 - 236} y={y} width={472} height={108} rx={14} fill="#1F2150" stroke="#3A3870" strokeWidth={2} />
                      <circle cx={W / 2 - 196} cy={y + 54} r={24} fill={RED} />
                      <text x={W / 2 - 196} y={y + 66} textAnchor="middle" fontFamily={SANS} fontWeight={900} fontSize={34} fill="#fff">!</text>
                      <text x={W / 2 - 156} y={y + 64} fontFamily={SANS} fontWeight={700} fontSize={28} fill={INK}>{FEED[i % FEED.length]}</text>
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })()}

        {/* 3 · 1982 年 */}
        {(() => {
          const op = vis(t, 14.2, 26.2, .6, .6);
          if (op <= .01) return null;
          const damaged = easeOut(seg(t, 21.4, 22.4));
          return (
            <g opacity={op}>
              <g transform={`translate(${W * .3} ${H * .44}) rotate(-3)`}>
                <rect x={-200} y={-250} width={400} height={480} rx={6} fill="#EFE6CF" stroke="#BCAE8C" strokeWidth={2} />
                <text x={0} y={-196} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={26} fill="#4A3F2C">The New England</text>
                <text x={0} y={-164} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={26} fill="#4A3F2C">Journal of Medicine</text>
                <line x1={-160} y1={-146} x2={160} y2={-146} stroke="#8C7E60" strokeWidth={1.5} />
                <text x={0} y={-108} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={20} fill="#4A3F2C">Dietary protein intake and the</text>
                <text x={0} y={-82} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={20} fill="#4A3F2C">progressive nature of kidney disease</text>
                {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={-160} y1={-40 + k * 30} x2={k === 5 ? 40 : 160} y2={-40 + k * 30} stroke="#B8AA88" strokeWidth={7} strokeLinecap="round" />)}
                <text x={0} y={190} textAnchor="middle" fontFamily="Georgia, serif" fontSize={20} fill="#4A3F2C">Brenner, Meyer &amp; Hostetter</text>
                <g transform="translate(140 -220) rotate(10)"><rect x={-56} y={-24} width={112} height={48} rx={6} fill="none" stroke={RED} strokeWidth={3} /><text x={0} y={10} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={28} fill={RED}>1982</text></g>
              </g>
              <Kidney x={W * .66} y={H * .42} s={1.25} t={t} health={1 - damaged} speed={1 + 3 * seg(t, 18.0, 19.0)} sweat={seg(t, 18.6, 19.2)} />
              <g opacity={damaged} transform={`translate(${W * .66} ${H * .74})`}>
                <ellipse cx={0} cy={0} rx={70} ry={36} fill="#B9B4C8" stroke="#1E1A33" strokeWidth={3} />
                <circle cx={58} cy={-18} r={22} fill="#B9B4C8" stroke="#1E1A33" strokeWidth={3} />
                <circle cx={64} cy={-24} r={4} fill="#1E1A33" />
                <path d="M-70 8 C-110 20 -120 -10 -150 0" stroke="#B9B4C8" strokeWidth={6} fill="none" strokeLinecap="round" />
                <text x={0} y={80} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill={AMBER}>实验对象:肾已受损的大鼠</text>
              </g>
            </g>
          );
        })()}

        {/* 4 · 2018 荟萃分析 */}
        {(() => {
          const op = vis(t, 26.2, 40.2, .6, .6);
          if (op <= .01) return null;
          const gather = easeOut(seg(t, 29.2, 31.5)), split = easeOut(seg(t, 33.0, 34.5));
          const needle = (side: number) => {
            const settle = seg(t, 36.6, 37.6);
            return lerp(-40 + 30 * Math.sin(t * 5 + side * 2), 8, ease(settle));
          };
          const dots = Array.from({ length: 260 }, (_, i) => {
            const side = i % 2 ? 1 : -1;
            const a = hash(i) * Math.PI * 2, r = Math.sqrt(hash(i + 7)) * 150;
            const sx = hash(i + 3) * W, sy = hash(i + 5) * H * .7;
            const tx = W / 2 + side * 380 * split + Math.cos(a) * r, ty = H * .6 + Math.sin(a) * r * .6;
            return <circle key={i} cx={lerp(sx, tx, gather)} cy={lerp(sy, ty, gather)} r={4} fill={side > 0 ? "#B9B4D6" : GOLD} opacity={.85} />;
          });
          return (
            <g opacity={op}>
              {dots}
              <g opacity={split}>
                <text x={W / 2 - 380} y={H * .82} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={30} fill={GOLD}>高蛋白(≥100 克/天)</text>
                <text x={W / 2 + 380} y={H * .82} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={30} fill="#B9B4D6">正常 / 偏低</text>
                {[-1, 1].map((side) => (
                  <g key={side} transform={`translate(${W / 2 + side * 380} ${H * .3})`}>
                    <path d="M-130 0 A130 130 0 0 1 130 0" stroke="#4A4878" strokeWidth={16} fill="none" />
                    <path d="M-130 0 A130 130 0 0 1 130 0" stroke={OK} strokeWidth={16} fill="none" strokeDasharray="410" strokeDashoffset={410 * (1 - seg(t, 34, 35))} opacity=".6" />
                    <line x1={0} y1={0} x2={0} y2={-112} stroke={INK} strokeWidth={6} strokeLinecap="round" transform={`rotate(${needle(side)})`} />
                    <circle r={12} fill={INK} />
                    <text y={44} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={SRC}>肾小球滤过率的变化</text>
                  </g>
                ))}
                <text x={W / 2} y={H * .32} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={110} fill={OK} opacity={backOut(seg(t, 37.0, 37.5))} filter="url(#glow)">=</text>
              </g>
              <text x={W / 2} y={H * .6 + 12} textAnchor="middle" fontFamily={SERIF} fontWeight={800} fontSize={44} fill={INK} opacity={gather * (1 - split)}>1358 人</text>
              <Src x={W - 40} y={H * .87} anchor="end" op={vis(t, 29.2, 40, .5, .5)}>Devries 等,《营养学杂志》(J Nutr),2018 · 健康成年人,无慢性肾病</Src>
            </g>
          );
        })()}

        {/* 5 · 一年 3 g/kg */}
        {(() => {
          const op = vis(t, 40.2, 50.2, .6, .6);
          if (op <= .01) return null;
          const month = Math.min(12, 1 + Math.floor(seg(t, 41, 47.5) * 12));
          return (
            <g opacity={op}>
              <g transform={`translate(${W / 2} ${H * .27})`}>
                <rect x={-150} y={-120} width={300} height={230} rx={16} fill="#F4EEE4" stroke="#1E1A33" strokeWidth={4} />
                <rect x={-150} y={-120} width={300} height={62} rx={16} fill={RED} />
                <text y={-76} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={30} fill="#fff">第 {month} 个月</text>
                <text y={50} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={96} fill="#1E1A33">~3</text>
                <text y={94} textAnchor="middle" fontFamily={SANS} fontSize={22} fill="#5A5470">克 / 公斤体重 / 天</text>
              </g>
              {Array.from({ length: 14 }, (_, i) => {
                const x = W / 2 + (i - 6.5) * 118, k = seg(t, 42 + i * .1, 42.4 + i * .1);
                return (
                  <g key={i} opacity={k}>
                    <Person x={x} y={H * .6} s={.72} col={i % 3 === 0 ? "#5C7FB8" : i % 3 === 1 ? "#C0674A" : "#5E9C78"} tag="" hair={i % 2 ? "a" : "b"} expr="smile" bob={-3 * Math.abs(Math.sin(t * 2 + i))} />
                    <Kidney x={x} y={H * .6 - 70} s={.16} t={t} health={1} />
                  </g>
                );
              })}
              <Src x={W - 40} y={H * .87} anchor="end" op={vis(t, 44.8, 50, .5, .5)}>Antonio 等,J Nutr Metab,2016 · 样本小:14 名有训练经验的健康男性,约 2.5–3.3 g/kg/天</Src>
            </g>
          );
        })()}

        {/* 6 · 已有肾病的人 */}
        {(() => {
          const op = vis(t, 50.2, 64.2, .6, .6);
          if (op <= .01) return null;
          const blocks = Math.floor(seg(t, 54, 59.5) * 6);
          const decline = easeOut(seg(t, 57.6, 60.8));
          return (
            <g opacity={op}>
              <Kidney x={W * .3} y={H * .42} s={1.05} t={t} health={1} glow={vis(t, 53.6, 57.4, .4, .4)} />
              <Kidney x={W * .7} y={H * .42} s={1.05} t={t} health={0} dark={decline} speed={1 - .6 * decline} />
              <text x={W * .3} y={H * .7} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={32} fill={OK}>肾功能正常</text>
              <text x={W * .7} y={H * .7} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={32} fill={AMBER}>轻度肾功能不全</text>
              {Array.from({ length: 6 }, (_, i) => i < blocks ? (
                <g key={i}>
                  <rect x={W / 2 - 34} y={H * .62 - i * 52} width={68} height={44} rx={8} fill={GOLD} stroke="#1E1A33" strokeWidth={3} />
                  <text x={W / 2} y={H * .62 - i * 52 + 31} textAnchor="middle" fontFamily={SANS} fontWeight={800} fontSize={20} fill="#1E1A33">蛋白</text>
                </g>
              ) : null)}
              <Src x={W / 2} y={H * .79} op={vis(t, 53.6, 64, .5, .5)}>Knight 等,《内科学年鉴》,2003:1624 名女性跟踪 11 年(观察性研究)</Src>
              <Src x={W / 2} y={H * .825} op={vis(t, 61, 64, .4, .4)}>KDIGO 2024 慢性肾病指南:3–5 期未透析,约 0.8 g/kg/天;有进展风险者不超过 1.3 g/kg/天</Src>
            </g>
          );
        })()}

        {/* 7 · 吃够了吗:柱状图 */}
        {(() => {
          const op = vis(t, 64.2, 78.2, .6, .6);
          if (op <= .01) return null;
          const X0 = W * .3, SC = 9.5;   // 1 克 = 9.5 px
          const bars: [string, number, string, number, number | null][] = [
            ["美国 · 成年男性", 97, BLUE, 67.4, null], ["美国 · 成年女性", 69, BLUE, 68.4, null],
            ["中国 · 18–49 岁男性", 61.6, AMBER, 70.4, 65], ["中国 · 18–49 岁女性", 50.0, AMBER, 74.4, 55],
          ];
          return (
            <g opacity={op}>
              {bars.map(([name, g, col, at, rec], i) => {
                const k = easeOut(seg(t, at, at + .9)), y = H * .2 + i * 130;
                return (
                  <g key={name} opacity={seg(t, at - .2, at + .1)}>
                    <text x={X0 - 24} y={y + 44} textAnchor="end" fontFamily={SERIF} fontWeight={700} fontSize={32} fill={INK}>{name}</text>
                    <rect x={X0} y={y + 10} width={g * SC * k} height={52} rx={8} fill={col} />
                    <text x={X0 + 104 * SC} y={y + 48} fontFamily={SERIF} fontWeight={800} fontSize={36} fill={col}>{(g * k).toFixed(g % 1 ? 1 : 0)} 克</text>
                    {rec ? (
                      <g opacity={seg(t, at + .8, at + 1.2)}>
                        <line x1={X0 + rec * SC} y1={y - 4} x2={X0 + rec * SC} y2={y + 76} stroke={GOLD} strokeWidth={4} strokeDasharray="8 6" />
                        <text x={X0 + rec * SC} y={y - 12} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={22} fill={GOLD}>推荐 {rec}</text>
                      </g>
                    ) : null}
                  </g>
                );
              })}
              <Src x={W - 40} y={H * .78} anchor="end" op={vis(t, 67.4, 78, .5, .5)}>美国:NHANES 2015–2016 均值 · 中国:营养与健康监测 2015–2017 中位数(Nutrients 2024)· 推荐量:中国 DRIs 2023</Src>
            </g>
          );
        })()}

        {/* 8 · 多少人没吃够 */}
        {(() => {
          const op = vis(t, 78.2, 90.2, .6, .6);
          if (op <= .01) return null;
          const groups: [number, string, number, string][] = [[78.3, "18–49 岁", 57, "男 56.6% · 女 60.9%"], [80.4, "50–64 岁", 63, "男 63.2% · 女 64.1%"], [82.0, "65–79 岁", 72, "男 72.4% · 女 72.5%"], [83.8, "80 岁以上", 79, "男 79.4% · 女 78.1%"]];
          let gi = 0; for (let i = 0; i < groups.length; i++) if (t >= groups[i][0]) gi = i;
          const [, label, pct, detail] = groups[gi];
          const shown = Math.round(pct * easeOut(seg(t, groups[gi][0], groups[gi][0] + .8)));
          const contrast = easeOut(seg(t, 85.8, 86.8));
          return (
            <g opacity={op}>
              <g opacity={1 - contrast}>
                {Array.from({ length: 100 }, (_, i) => {
                  const x = W / 2 - 4.5 * 62 + (i % 10) * 62, y = H * .12 + Math.floor(i / 10) * 58;
                  return <circle key={i} cx={x} cy={y + 20} r={20} fill={i < shown ? RED : "#4C4A80"} opacity={i < shown ? .9 : .7} />;
                })}
                <text x={W / 2 + 380} y={H * .3} fontFamily={SERIF} fontWeight={800} fontSize={40} fill={INK}>{label}</text>
                <text x={W / 2 + 380} y={H * .42} fontFamily={SERIF} fontWeight={900} fontSize={96} fill={RED}>{shown}%</text>
                <text x={W / 2 + 380} y={H * .48} fontFamily={SANS} fontSize={24} fill={SRC}>{detail}</text>
                <text x={W / 2 - 380} y={H * .35} textAnchor="end" fontFamily={SANS} fontSize={24} fill={SRC}>● 低于推荐需要量</text>
              </g>
              {contrast > .01 ? (
                <g opacity={contrast}>
                  <line x1={W * .2} y1={H * .5} x2={W * .8} y2={H * .5} stroke={GOLD} strokeWidth={4} strokeDasharray="10 8" />
                  <text x={W * .8} y={H * .5 - 14} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={22} fill={GOLD}>推荐量</text>
                  <rect x={W * .3 - 60} y={H * .46} width={120} height={H * .3} fill={GOLD} opacity=".85" />
                  <text x={W * .3} y={H * .82} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={32} fill={GOLD}>人均</text>
                  {Array.from({ length: 70 }, (_, i) => {
                    const v = .2 + .6 * hash(i + 31) + .2 * hash(i + 77);
                    return <circle key={i} cx={W * .62 + (hash(i + 3) - .5) * 360} cy={H * .76 - v * H * .4} r={9} fill={v < .58 ? RED : OK} opacity=".9" />;
                  })}
                  <text x={W * .62} y={H * .82} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={32} fill={INK}>每个人</text>
                  <text x={W * .8} y={H * .8} textAnchor="end" fontFamily={SANS} fontSize={20} fill={SRC}>示意图</text>
                </g>
              ) : null}
              <Src x={W - 40} y={H * .87} anchor="end" op={vis(t, 78.3, 90, .5, .5)}>Wei 等,Nutrients 2024(研究口径,脚注定义为低于平均需要量)· 官方:《中国居民营养与慢性病状况报告(2020 年)》</Src>
            </g>
          );
        })()}

        {/* 9 · 怎么吃 */}
        {(() => {
          const op = vis(t, 90.2, 98.2, .6, .6);
          if (op <= .01) return null;
          const foods: [string, (x: number, y: number) => React.ReactNode][] = [
            ["鸡蛋", (x, y) => <g transform={`translate(${x} ${y})`}><ellipse rx={46} ry={58} fill="#F6EBD8" stroke="#1E1A33" strokeWidth={3} /><circle cy={6} r={22} fill="#F2B544" /></g>],
            ["牛奶", (x, y) => <g transform={`translate(${x} ${y})`}><path d="M-34 -50 L34 -50 L42 -26 L42 60 L-42 60 L-42 -26 Z" fill="#F4F4F8" stroke="#1E1A33" strokeWidth={3} /><rect x={-42} y={0} width={84} height={30} fill="#7FA7E8" /></g>],
            ["豆制品", (x, y) => <g transform={`translate(${x} ${y})`}><rect x={-52} y={-38} width={104} height={76} rx={10} fill="#F2E6C8" stroke="#1E1A33" strokeWidth={3} /><line x1={-52} y1={0} x2={52} y2={0} stroke="#D8C9A4" strokeWidth={3} /></g>],
            ["鱼", (x, y) => <g transform={`translate(${x} ${y})`}><path d="M-56 0 Q-10 -44 40 0 Q-10 44 -56 0 Z" fill="#8FB8D8" stroke="#1E1A33" strokeWidth={3} /><path d="M40 0 L66 -24 L66 24 Z" fill="#8FB8D8" stroke="#1E1A33" strokeWidth={3} /><circle cx={-30} cy={-6} r={5} fill="#1E1A33" /></g>],
            ["肉", (x, y) => <g transform={`translate(${x} ${y})`}><path d="M-50 -20 Q-30 -54 20 -40 Q60 -24 50 20 Q30 50 -20 40 Q-60 24 -50 -20 Z" fill="#D9776A" stroke="#1E1A33" strokeWidth={3} /><path d="M-20 -10 Q10 -24 30 0" stroke="#F4D6CC" strokeWidth={8} fill="none" strokeLinecap="round" /></g>],
          ];
          const cx = W / 2, cy = H * .44, R = 300;
          const stamp = backOut(seg(t, 95.6, 96.1));
          return (
            <g opacity={op}>
              {foods.map(([name, draw], i) => {
                const a = (i / foods.length) * Math.PI * 2 - Math.PI / 2, k = backOut(seg(t, 90.4 + i * .25, 90.8 + i * .25));
                const x = cx + Math.cos(a) * R * 1.35, y = cy + Math.sin(a) * R * .95;
                return <g key={name} opacity={clamp(k)}>{draw(x, y)}<text x={x} y={y + 96} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={28} fill={INK}>{name}</text></g>;
              })}
              <g transform={`translate(${cx} ${cy})`} opacity={seg(t, 92.8, 93.3)}>
                <rect x={-90} y={-120} width={180} height={230} rx={22} fill="#2B2E66" stroke="#1E1A33" strokeWidth={4} />
                <rect x={-96} y={-150} width={192} height={44} rx={12} fill="#4A4E96" stroke="#1E1A33" strokeWidth={4} />
                <text y={-20} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={40} fill={INK}>蛋白粉</text>
                <text y={30} textAnchor="middle" fontFamily={SANS} fontSize={22} fill={SRC}>一勺约 20 多克</text>
                <text y={58} textAnchor="middle" fontFamily={SANS} fontSize={18} fill={SRC}>以产品标签为准</text>
                {stamp > .01 ? (
                  <g transform={`translate(40 84) rotate(-12) scale(${stamp})`}>
                    <rect x={-96} y={-30} width={192} height={60} rx={8} fill="rgba(91,196,138,.18)" stroke={OK} strokeWidth={4} />
                    <text y={11} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={32} fill={OK}>第三方检测</text>
                  </g>
                ) : null}
              </g>
              <Src x={W - 40} y={H * .87} anchor="end" op={vis(t, 95.6, 98, .4, .4)}>《消费者报告》2025:植物蛋白粉平均铅含量约为乳制品类的 9 倍</Src>
            </g>
          );
        })()}

        {/* 10 · 结尾 */}
        <g opacity={vis(t, 98.0, 104.2, .8, .01)}>
          <Kidney x={W / 2} y={H * .36} s={1.1} t={t} health={1} glow={1} speed={.7} />
          <text x={W / 2} y={H * .7} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={64} fill={OK} letterSpacing={8} filter="url(#glow)">健康的肾,不怕蛋白质。</text>
          <text x={W / 2} y={H * .79} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={40} fill={INK} opacity={seg(t, 99.6, 100.3)}>怕的是没病被吓住,有病不去查。</text>
          <text x={W / 2} y={H * .875} textAnchor="middle" fontFamily={SANS} fontSize={20} fill={SRC} opacity={seg(t, 100.6, 101.2)}>科普演示,不构成医疗建议;有肾病、糖尿病、高血压,请先问医生</text>
          <text x={W / 2} y={H * .915} textAnchor="middle" fontFamily={SANS} fontSize={15} fill="#77739A" opacity={seg(t, 101, 101.6)}>
            参考:Brenner 等 NEJM 1982;Devries 等 J Nutr 2018;Antonio 等 J Nutr Metab 2016;Knight 等 Ann Intern Med 2003;KDIGO 2024;Wei 等 Nutrients 2024;NHANES 2015–2016;中国居民营养与慢性病状况报告(2020)
          </text>
        </g>

        {/* 结尾引导去主页 */}
        <g opacity={vis(t, 100.8, 104.2, .5, .01)} transform={`translate(${W / 2 + 90} ${H * .11})`}>
          {[-1, 0, 1].map((k) => {
            const f = Math.abs(Math.cos((t - 101 + k * .35) * 2.2));
            return (
              <g key={k} transform={`translate(${k * 120 - 520} 0) scale(${f} 1)`}>
                <rect x={-44} y={-56} width={88} height={112} rx={10} fill="rgba(242,193,78,.16)" stroke={GOLD} strokeWidth={3} />
                <text y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={60} fill={GOLD}>?</text>
              </g>
            );
          })}
          <text x={-330} y={-6} fontFamily={SERIF} fontWeight={800} fontSize={40} fill={INK}>还想知道哪个知识点?<tspan fill={GOLD}>评论区点题</tspan>,下期就讲</text>
          <text x={-330} y={42} fontFamily={SANS} fontSize={26} fill={SRC}>关注「知识大赏」· 每期讲透一个知识点</text>
        </g>

        <Subtitle t={t} />
        <rect width={W} height={H} fill="#05060F" opacity={seg(t, 103.4, 104)} />
      </svg>
    </AbsoluteFill>
  );
};