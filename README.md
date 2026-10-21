# Opus-Video-Skill

用 Claude Code 把「一首歌」或「一个题目」变成短视频的流水线。每一帧都是代码画出来的(无头 Chrome 逐帧渲染,ffmpeg 编码),配乐可以用你的歌,也可以由代码合成。

## 能做三种视频

| 类型 | 输入 | 引擎 | 样片 |
|---|---|---|---|
| **动态排版歌词** | 一首歌 | [Remotion](https://www.remotion.dev) | 一屏一句、关键词上色、角落代码梗 |
| **角色故事** | 一首歌(可只给副歌) | [painted-animation](https://github.com/tuzhechen2005/opus-video-skills) | `examples/glass-painted/`:雨夜窗外的小方块,身体变成透明玻璃 |
| **知识大赏** | 一个题目 | Remotion(SVG 图解) | `examples/prisoners-dilemma/`、`examples/protein-kidney/` |

知识大赏没有旁白,靠字幕和连续变形的动画讲透一个知识点。资料要上网查证,每条都标出处,片尾附参考文献。

## 用到的 skill(已作为子模块放在 `skills/`)

| skill | 来源 | 用在 | 许可 |
|---|---|---|---|
| **remotion-best-practices** 等 12 个 Remotion 官方 skill | https://github.com/remotion-dev/skills → `skills/remotion-skills/` | 动态排版歌词、知识大赏 | 见该仓库 |
| **painted-animation**(手绘水彩角色动画) | https://github.com/tuzhechen2005/opus-video-skills → `skills/opus-video-skills/skills/painted-animation/` | 角色故事 | MIT |
| **kinetic-reel**(电影感数据叙事) | 同上 → `skills/opus-video-skills/skills/kinetic-reel/` | 备选引擎 | MIT |

克隆时连子模块一起拉下来:

```bash
git clone --recursive https://github.com/minner-965/Opus-Video-Skill
# 已经克隆过但没带子模块:
git submodule update --init --recursive
```

装进 Claude Code(任选一种):

```bash
# A. Remotion 官方 skill:按 skills-lock.json 装到当前项目的 .claude/skills/
npx skills add remotion-dev/skills -a claude-code -y

# B. opus-video-skills:在 Claude Code 里
/plugin marketplace add tuzhechen2005/opus-video-skills
/plugin install painted-animation@opus-video-skills
/plugin install kinetic-reel@opus-video-skills

# C. 不装插件也行:直接读子模块里的 SKILL.md(本流水线就是这么用的)
```

角色故事样片 `examples/glass-painted/` 的场景文件,要放进 `skills/opus-video-skills/skills/painted-animation/template/` 复制出来的工程里运行(把 `src/scenes/bl_*.js` 加进 `studio.html`)。

## 怎么用

1. 准备环境(Windows / macOS / Linux 都行):
   - Node.js 18+、ffmpeg、Google Chrome
   - Python 3 虚拟环境:
     ```bash
     python -m venv .venv
     .venv/Scripts/python -m pip install numpy librosa pillow stable-ts   # macOS/Linux: .venv/bin/python
     .venv/Scripts/python -m pip install demucs                          # 可选,分离人声
     ```
   - skill:见上一节(`git clone --recursive` 已经带上)
2. 在这个目录启动 Claude Code,对它说:
   > 读 PLAN.md。先确认环境,再填好任务单,然后从阶段 0 开始,每个 🛑 检查点停下来等我确认。
3. 给它一首歌(放进 `music/song.mp3`),或者一个题目。它会依次产出:
   - 分镜表(等你确认)
   - 资料汇总(知识大赏)
   - 配乐
   - 逐段审片图
   - 成片
   - 质检报告

## 直接渲染两支知识大赏样片

```bash
cd remotion && npm install
cd ..
.venv/Scripts/python tools/synth_piano.py remotion/public/prisoner_music.wav 116 72
.venv/Scripts/python tools/synth_piano.py remotion/public/protein_music.wav 104 80 CGAmF 0 "0,2.4,5.0,7.6"
cd remotion
npx remotion render Prisoner out/prisoner.mp4
npx remotion render Protein out/protein.mp4
```

PLAN.md 第七节阶段 6 有混音命令:用 `loudnorm` 把响度调到 -14 LUFS,编码成 H.264 / yuv420p / faststart。

## 目录

```
PLAN.md                  规则和流程(先读这个)
SKILL.md                 作为 Claude Code skill 使用时的入口
skills/                  用到的 skill(git 子模块):remotion-skills、opus-video-skills
skills-lock.json         Remotion skill 的安装锁定文件
tools/                   分析参考视频、节拍网格、歌词对齐、审片拼图、配乐合成
remotion/                Remotion 工程(知识大赏两支样片)
examples/
  prisoners-dilemma/     《囚徒困境》分镜表 + 资料汇总
  protein-kidney/        《蛋白粉喝了真的伤肾吗》分镜表 + 资料汇总
  glass-painted/         角色故事的场景代码(需要放进 painted-animation 模板里运行)
```

## 工具脚本

| 脚本 | 用途 |
|---|---|
| `analyze_ref.py` | 读参考视频:BPM、切点、色板、联系表 |
| `extract_frames.py` / `ref_strips.py` / `tile_frames.py` | 按切点抽帧、按 6 fps 抽连续帧、拼审阅表 |
| `beat_grid.py` | 拍点拟合、小节线,用参考切点交叉验证 |
| `transcribe_ref.py` / `align_lyrics.py` | Whisper 转写、stable-ts 歌词强制对齐 |
| `make_lrc.py` / `check_subs.py` | 生成 LRC 和逐字时间;字幕自检(起音、两次对齐差、切点吸附) |
| `compare.py` / `seq_sheet.py` | 参考帧和成片并排对照;从渲染序列按时间抽帧 |
| `synth_piano.py` | 代码合成钢琴配乐(无版权素材),可设开场重音 |

## 没有包含的东西

- **参考视频和截图**:都是别人的作品,只在本地用于分析。
- **歌曲音频和歌词**:有版权。用你自己的歌,或者用代码合成。
- **成片 mp4、依赖包**:体积大,按上面的命令重新生成。

## 许可说明

- Remotion 对个人和小团队免费,较大的公司商用需要购买许可,以 [remotion.dev/license](https://www.remotion.dev/license) 为准。
- 角色故事用的 painted-animation 模板来自 opus-video-skills / ClaudeAnimationBase(MIT),这里只放了自己写的场景文件。
- 中文字体用 Noto Sans SC / Noto Serif SC(OFL,可商用)。
