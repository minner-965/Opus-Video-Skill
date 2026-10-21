# PLAN.md · 参考视频驱动的「代码动画视频」流水线(v2)

> **用法**:把本文件放进项目文件夹 → 在该目录运行 `claude` → 对它说:
> **「读 PLAN.md。先确认『二、我本人先做』已完成,再填好『六、本次任务单』,然后从阶段 0 开始,每个 🛑 检查点停下来等我确认。」**

---

## 零、给 Claude Code 的执行规则(最先读)

1. 按阶段顺序执行,遇到 🛑 **必须停下等我确认**,不要自己往下跑。
2. 安装任何东西前,先把要执行的命令列给我;不要用 `sudo`,除非我同意。
3. 进度写进 `PROGRESS.md`(已完成 / 下一步 / 遇到的问题)。新会话先读它再续做。
4. 目录约定:参考视频放 `ref/`(只读,不改动)、音乐 `music/`、字幕 `sub/`、工具脚本 `tools/`、产出 `out/`。
5. **参考素材怎么用,由『六、任务单』里的 `素材使用` 决定**:
   - `允许复用`(**当前默认**,我已确认可以):可以复用参考视频的**文案 / 台词 / 数字 / 音轨**,并按参考画面做**同款复刻**。不需要再就此提醒我。
   - `仅借鉴结构`:只提取节奏 / 镜头 / 配色 / 叙事骨架,文案和画面原创。
   - 无论哪种,**只处理我放进 `ref/` 的文件**,不要自己去网上抓取我没提供的内容。
6. **你听不到音频,也看不到动态。** 音频只能靠节拍/RMS/频谱数据校验,画面只能靠渲染出的静帧和联系表审片。汇报时如实说明哪些是"检查过的"、哪些是"推断的",不要说"听起来不错"。
7. 各 skill 的 API 和命令以它们自己的 `SKILL.md` 为准;本文件里的命令是示例,拿不准先 `--help`,不要凭记忆硬写。

---

## 一、这条流水线怎么工作

```
参考视频(ref/)
   │  tools/analyze_ref.py(只读结构,不拷贝内容)
   ▼
结构数据:BPM · 镜头时长 · 切点密度 · 色板 · 叙事骨架
   │
   ├─ 音乐:① 我指定 song.mp3   ② 代码合成配乐   ③ 套用参考节奏到我的音乐   ④ 直接复用参考音轨
   ▼
节拍网格(bpm / offset / 小节线)
   │
   ├─ 字幕全自动:(可选人声分离) → Whisper 转写或强制对齐 → 词级时间戳 → lrc / json / srt
   ▼
分镜表 cue sheet(时间 · 拍 · 文案 · 画面机制 · 转场)  🛑我确认
   ▼
引擎逐镜头制作 + 联系表审片  🛑
   ▼
全片渲染 → 混音 → 编码 → 质检  →  out/final.mp4
```

**关键事实**:这类视频是用代码**从零重画每一帧**(每帧 = 时间 t 的纯函数,无头 Chrome 逐帧渲染,ffmpeg 编码)。所以参考视频**不能被"剪辑替换"**(想在原片上直接换音乐 / 换字幕,那是剪映的活)。这里的"搬运"指的是:**读取**参考视频的结构、文案、音轨,再**用代码重画同款**;画面是近似复刻,不是像素级拷贝。

---

## 二、我本人先做(只有这几步 Claude Code 代替不了)

1. 安装 Claude Code(已装跳过)
   - macOS / Linux:`curl -fsSL https://claude.ai/install.sh | bash`
   - Windows:`winget install Anthropic.ClaudeCode`(渲染链路建议在 **WSL2** 里跑,见第十节)
2. 在项目目录启动 `claude`,输入:
   ```
   /plugin marketplace add tuzhechen2005/opus-video-skills
   /plugin install painted-animation@opus-video-skills
   /plugin install kinetic-reel@opus-video-skills
   /model            ← 选 Opus 5.5
   ```
3. 把参考视频放进 `ref/`,把音乐(如果自己指定)放进 `music/song.mp3`。

> Remotion 官方 skill **由 Claude Code 在阶段 0 尝试自己安装**;只有它确认没有非交互方式时,才需要我在终端里手动运行 `npx skills add remotion-dev/skills`,并在菜单里勾选 Claude Code。

> 旧坑:若以前把 painted-animation 直接克隆到 `~/.claude/skills/painted-animation`,先删掉旧文件夹,它和新插件布局冲突。

---

## 三、工具箱(一次装齐,以后换风格不用再装)

| 工具 | 用途 | 哪些风格要用 |
|---|---|---|
| Node.js(建议 LTS,≥18) | 所有渲染脚本 | 全部 |
| Google Chrome | 无头浏览器逐帧渲染 | kinetic-reel / painted-animation / Remotion |
| ffmpeg | 编码、混音、转码、质检 | 全部 |
| Python 3 + numpy + librosa + Pillow | **分析参考视频**、节拍网格 | 全部 |
| stable-ts(基于 Whisper) | **字幕自动转写 / 歌词强制对齐** | 带字幕的全部 |
| demucs *(可选)* | 分离人声,显著提高"唱歌"识别率 | 有人声的歌曲 |
| Noto Sans SC / Noto Serif SC | 中文字幕字体(OFL 许可,可商用) | 全部 |
| skill:opus-video-skills | painted-animation + kinetic-reel 两个引擎 | 见第四节 |
| skill:remotion-dev/skills + Remotion | React 做动画、排版、批量模板 | 见第四节 |

**不需要单独装的**:ffmpeg skill(Claude 本身熟 ffmpeg)、剪映(只在你想**人工精修成片**时才用,不参与自动流程)。

macOS 参考命令(先让我确认再执行):
```bash
brew install node ffmpeg python git
brew install --cask google-chrome
python3 -m venv ~/.venvs/video && source ~/.venvs/video/bin/activate   # 用虚拟环境,避免 pip 的 externally-managed 报错
pip install numpy librosa pillow stable-ts
pip install demucs        # 可选;会拉 PyTorch,体积大(数 GB),首次还要下载模型
```
字体:从 Google Fonts 下载安装 Noto Sans SC、Noto Serif SC(或用系统已有的 CJK 字体)。**中文字体的加载方式以各 skill / Remotion 自己的说明为准**(例如 kinetic-reel 要求把所有出现的汉字列进 `CJK` 常量,否则会缺字)。

---

## 四、引擎选择(决定性的一步)

| 想做的风格 | 引擎 | 说明 |
|---|---|---|
| 电影感数据叙事、连续运镜、粒子/3D、形状连续转场(**参考 A**) | **kinetic-reel 的技术骨架** | Canvas2D + three.js + WebGL,`cues.js` 时间线,节拍锁定,可合成配乐 |
| 动态排版 / 歌词字幕 / 一屏一句(**参考 B**) | **Remotion**(默认)或 kinetic-reel | 文字排版最强,中文字体用 CSS 直接加载,改字幕 = 改 JSON |
| React 信息动画、产品演示、可批量套模板 | **Remotion** | |
| 手绘水彩**角色**动画、有角色表演的 MV | painted-animation | ⚠ 它的规则是**画面里不允许有文字**(仅歌词卡拉 OK 例外),主角是手绘角色 —— **不适合参考 A、B** |
| 已有素材的剪切 / 拼接 / 转码 / 调尺寸 | 直接用 ffmpeg | |

**注意**:kinetic-reel 自带的美术规范(Anton 字体、黑 / 米 / 荧光绿、HUD)是它自己 Work Reel 的风格,**和参考 A、B 的配色字体不同**。用它时:**沿用技术骨架**(每帧=t 的纯函数、`cues.js`、`render.mjs`、节拍锁定),**美术规范改用第五节的风格卡**。

默认:**A → kinetic-reel 骨架;B → Remotion。** 阶段 1 读完两个 skill 的 `SKILL.md` 后,如果你认为换引擎更合适,可以提议,**经我同意再换**。

---

## 五、风格卡(从两支参考视频实测提取,作为起点)

> 数据来自 `tools/analyze_ref.py` 的实际测量(BPM、切点、色板)+ 对 20 张关键帧的目测(叙事、排版)。**目测部分是推断,请在阶段 1 对着联系表自己再核对。**

### 风格卡 A · 电影感数据叙事
| 项 | 数值 / 特征 |
|---|---|
| 规格 | 130.4 s · 1280×720 · 30 fps · 横屏 |
| 音乐 | ≈ 112 BPM(一小节 ≈ 2.1 s);能量:20–50 s 与 110 s→结尾偏高,80–110 s 最低 |
| 剪辑 | **几乎没有硬切**(全片仅检出 1 处)→ 连续运镜 + 形状连续转场(缩进某个元素、从光点展开) |
| 色板 | 深蓝黑底(≈73%,`#101010`~`#101030`)+ **青绿(≈180°)与橙(≈0–30°)两种强调色 = 两位主角**;结尾转暖橙棕 |
| 画面 | 俯视城市(地铁、斑马线、雨夜路灯、长椅、地图轨迹),主角用发光色点 / 伞表示 |
| 字幕 | 短句,**衬线(宋体类)小字,左下**,低饱和白 |
| 数据层 | 画面里叠"被量化的细节":距离、次数、年份、里程、时间(用数字制造重量) |
| 叙事骨架 | 相遇却错过 → 反复擦肩被量化 → 其中一方开始改变行为 → 分离(能量最低)→ 回归 → 暖色收尾 + 一句对观众的**提问** |

> 叙事骨架、台词、数字:`素材使用=允许复用` 时可以沿用原片;`仅借鉴结构` 时必须原创。

### 风格卡 B · 程序员风歌词动态排版
| 项 | 数值 / 特征 |
|---|---|
| 规格 | 47.0 s · 1920×1080 · 30 fps · 横屏 |
| 音乐 | ≈ 123 BPM(一小节 ≈ 1.95 s) |
| 剪辑 | 31 次切点;**中位镜头长 1.93 s ≈ 4 拍 = 1 小节**;**9 次极快切(<0.4 s)集中成爆发段**(约 32.6–33.7 s、38.5–39.5 s,即高潮连切);约 52% 的切点落在拍点 ±0.1 s 内,其余跟随歌词句首 |
| 色板 | **黑白交替**:白底 `#f0f0f0`(≈39%)/ 黑底 `#101010`(≈55%);强调色 **蓝(≈210°)、橙(≈0–30°)、绿(≈120°)** |
| 排版 | **一屏一句**,超粗黑体大字;**关键词单独着色 / 放大**;逐字或逐词出现 |
| 装饰层 | 代码 / 终端微型文字(注释、命令、报错、进度条、心电线)+ 一个颜文字小人当"主角"(`仅借鉴结构` 时请原创自己的小角色和梗) |

**节奏规则(可迁移)**:
- 默认 **1 小节 1 镜头**;副歌 / 高潮改成 **半拍~1 拍连切**;
- 切点 = **歌词句首吸附到最近的拍**;但**字幕出现的真实时间不动**(别为了卡点让字幕偏离人声);
- 黑 / 白底交替用来区分"段落情绪",强调色只给关键词。

---

## 六、本次任务单(我填,Claude Code 照此执行)

```yaml
# 2026-10-12 Simon 在线程里口头填写,Claude 代录。本次是「复刻测试」。
风格:        B 动态排版歌词
主题或故事:   本次沿用原片(复刻测试)。以后的片子:Simon 给主题,Claude 自己讲故事
参考视频:
  - ref/refA.mp4:  本次不用
  - ref/refB.mp4:  全部(节奏 / 镜头 / 配色 / 文案),同款复刻
画幅:        与参考一致 16:9 1920×1080(Claude 默认,Simon 未反对)
时长:        与参考一致 ≈47 s(Claude 默认,Simon 未反对)
音乐模式:     待确认 —— Simon 回的是「33」,读作 ③,但 music/ 里没有他的音乐;阶段 1 检查点再问
歌词/文案:    没有 lyrics.txt,取自参考视频(Claude 默认,Simon 未反对)
成片用途:     自己看 / 测试(Claude 默认,Simon 未反对)
素材使用:     允许复用 —— 仅限本次复刻测试;以后做视频不复用,要原创
复刻程度:     同款复刻
```

---

## 七、执行阶段

### 阶段 0 · 环境检查  🛑
1. 判断我的系统(`uname -a` 或 Windows 版本)和是否有可用 GPU。
2. 逐项检查第三节工具(`node -v`、`ffmpeg -version`、`python3 -c "import librosa, numpy, PIL"`、`python3 -c "import stable_whisper"`、Chrome 是否存在),列出缺项和对应安装命令,**等我确认再装**。
3. **安装 Remotion 官方 skill**:先运行 `npx skills add --help`,找能跳过交互菜单的参数(指定 agent 为 claude-code、自动确认之类)。有就直接安装 `remotion-dev/skills`,再用 `npx skills list --agent claude-code` 验证能看到 remotion-best-practices;**没有就停下来告诉我**,由我在终端手动安装。不要运行会卡在交互菜单里的命令。
4. **Windows 注意**:winget 安装可能弹管理员确认窗口,提醒我去点;新装的 Node / Git 若在当前会话找不到,提醒我重启 Claude Code,不要反复重试。
5. 确认 kinetic-reel / painted-animation / remotion-best-practices 三个 skill 都已被识别。
6. 创建 `PROGRESS.md`,把 `tools/analyze_ref.py`(附录 A)存好。

### 阶段 1 · 分析参考视频  🛑
1. 对 `ref/` 里每个视频运行:`python3 tools/analyze_ref.py ref/xxx.mp4`。
2. 用图片读取工具**打开每个 `contact_sheet.jpg`**,对照第五节风格卡,在 `ref/REF_NOTES.md` 里写:节奏规则、镜头规则、色板、版式、叙事骨架(**只写结构,不抄文案**),并标注哪些是"测量值"、哪些是"目测推断"。
3. **若 `素材使用=允许复用`**,再提取以下素材(都存进 `ref/`,不改原文件):
   ```bash
   # (a) 音轨:AAC 直接拷贝,不重编码
   ffmpeg -i ref/refA.mp4 -vn -c:a copy music/refA_audio.m4a
   # (b) 关键帧:无硬切的片子每 3 秒一帧(第 n 张 ≈ (n-1)×3 秒)
   mkdir -p ref/framesA && ffmpeg -i ref/refA.mp4 -vf "fps=1/3,scale=1280:-1" ref/framesA/%04d.jpg
   ```
   有硬切的片子:在 `ref_analysis.json` 的每个切点后 0.15 s 抽一帧,文件名带时间戳(写 `tools/extract_frames.py`)。
   - (c) **屏幕文字**:用图片读取工具逐张读关键帧,把画面上的文字连同时间写入 `ref/onscreen_text.json`(OCR 作兜底);
   - (d) **旁白 / 歌词**:对参考音轨跑 Whisper 转写,存 `ref/transcript.json`。
   这些只是素材,**哪些真的用、怎么改,在分镜表里逐条写明,等我确认。**
4. 读 kinetic-reel 与 painted-animation 的 `SKILL.md`,以及 Remotion skill,确认本次用哪个引擎;若与第四节默认不同,说明理由。
5. 🛑 把「节奏规则 + 引擎选择 + 可复用素材清单」汇报给我确认。

### 阶段 2 · 音乐与节拍网格
- **模式①(我提供音乐)**:对 `music/song.mp3` 测 BPM 与第一拍位置(可用 librosa,或 painted-animation 自带的 `scripts/beat_grid.py`,位置以实际安装路径为准)。在**小节线**上截取要用的段落,头尾做淡入淡出;记录 `bpm`、`offset`、每小节秒数。
- **模式②(代码合成配乐)**:用引擎自带的方式(kinetic-reel 的 `music/score.mjs` 由 `cues.js` 生成,每个音效对齐到帧)。再强调一次:你听不到,用频谱图 + 分段 RMS 校验,并如实说明。
- **模式③(套用参考的节奏到我的音乐)**:把风格卡里的节奏规则(1 小节 1 镜头、高潮连切等)映射到**我的音乐**的节拍网格上。**不要从参考视频里抽音轨来用。**
- **模式④(复用参考音轨)**:用阶段 1 提取的 `music/refA_audio.m4a`,同样测 BPM 与小节线;参考视频的音轨可能带旁白 / 音效,先确认是否需要分离人声(demucs)。
- 输出 `music/grid.json`:`{bpm, offset, bar_seconds, beats:[...], sections:[{name,start,end}]}`。

### 阶段 3 · 字幕全自动
> 目标:**我不手动标时间轴。** 唯一可能需要我的是"校对文字"(不是时间)。

1. *(有人声时,可选但推荐)* `demucs --two-stems=vocals -o stems music/song.mp3`,取 `stems/*/song/vocals.wav` 做识别 / 对齐。
2. **字幕文字来源**:我的 `lyrics.txt` > 参考视频的 `ref/onscreen_text.json` / `ref/transcript.json`(仅 `允许复用` 时)> Whisper 转写。
   **有文字** → 用 stable-ts 做**强制对齐**(以我的文字为准,避免 AI 听错字);**没有歌词** → Whisper 转写 `language="zh"`,输出 `sub/lyrics.draft.txt`。
   示例(以 `stable-ts` 实际 API 为准,先看它的 README / `--help`):
   ```python
   import stable_whisper
   m = stable_whisper.load_model("medium")        # 唱歌建议 medium 或更大
   r = m.align("vocals.wav", open("music/lyrics.txt", encoding="utf-8").read(), language="zh")
   # 无歌词: r = m.transcribe("vocals.wav", language="zh")
   r.save_as_json("sub/lyrics.json")              # 词级时间戳
   r.to_srt_vtt("sub/song.srt", word_level=False)
   ```
3. 🛑 **仅在"无歌词转写"时**:把 `lyrics.draft.txt` 给我看,我只改错字;我确认后再做一次强制对齐。
4. 写 `tools/make_lrc.py`,从 `sub/lyrics.json` 生成 `sub/song.lrc`(行级,`[mm:ss.xx]`)和引擎需要的格式(painted-animation 的卡拉 OK 要 LRC;Remotion 直接读 JSON)。
5. **自检**(因为你听不到):对每一行,检查其起点附近音频的 onset / RMS 是否确有上升;把"起点附近没有明显人声起音"的行列为**可疑行**报告给我,而不是默默放过。
6. 切点吸附:把**镜头切点**吸附到最近的拍(±0.12 s 内),**字幕出现时间保持真实时间不变**;报告吸附前后的偏差。

### 阶段 4 · 分镜表  🛑
写 `STORYBOARD.md`,每个镜头一行:

| # | 起止(s) | 小节/拍 | 歌词/文案 | 画面机制 | 转场进入 | 色调 | 声音 |
|---|---|---|---|---|---|---|---|

要求:
- 每个镜头必须有"**机制**"(这一屏靠什么画面手段把意思演出来),不能只是"字显示出来";
- 总时长对齐音乐;段落比例有主次(别让某一段占过半);
- 套用风格卡的节奏规则,并写明每个镜头的**拍数**。
**🛑 给我确认后再开始画。**

### 阶段 5 · 逐镜头制作 + 审片
1. 用所选引擎搭项目(kinetic-reel / painted-animation 用各自的 `scripts/new_project.sh`;Remotion 用 `npx create-video@latest`)。
2. **一次只做一个镜头 / 一个章节**,做完用引擎自带的命令渲染**联系表 + 全分辨率静帧**,然后**用图片读取工具逐张打开检查**,再给我看。
3. 审片清单:文字是否溢出 / 被遮 / 与装饰层碰撞;**中文有没有缺字(方块)**;安全边距;黑白底对比度;首尾帧;转场是否"从某个元素开始、落在干净画面上";字幕是否与音频时间一致;每个镜头是否有机制。
4. **复刻对照(`复刻程度=同款复刻` 时)**:每个镜头把"我渲染的静帧"与 `ref/frames*/` 里**同一时间点的参考帧**并排拼图,逐项对比构图、配色、字号、元素位置、动效节奏:
   ```bash
   ffmpeg -i ref_frame.jpg -i my_still.png -filter_complex "[0:v]scale=640:-1[a];[1:v]scale=640:-1[b];[a][b]hstack" out/check/cmp_03.jpg
   ```
   打开对照图,把差异列成清单再改,迭代到"肉眼难以区分风格"即可,**不追求像素一致**。
5. 发现问题就改,再渲染再看。**不要一次性全渲完才第一次看画面。**

### 阶段 6 · 渲染 / 混音 / 编码 / 质检
1. 全片渲染(引擎支持分块与续跑,中断后只补缺帧)。
2. 混音:音乐响度用 `loudnorm`(目标约 -14 LUFS);只改音频时**不用重渲画面**,直接 remux。
3. 编码:H.264、`yuv420p`、30 fps、`-movflags +faststart`。
4. 质检并写入 `out/qc_report.md`:
   - `ffprobe`:分辨率、帧率、时长(与音频差 < 0.05 s)、确有音轨;
   - `blackdetect`(异常黑帧)、`silencedetect`(异常静音);
   - 抽 10~20 帧生成联系表;
   - 抽查 5 处"字幕出现点"对应的帧。
5. 产出:`out/final.mp4`(需要竖屏则再出 `out/final-9x16.mp4`,**重排版**而不是裁切)。

### 阶段 7 · 迭代
- 只改文案 / 字幕 / 切点 → 改 `cues` 或 JSON,**不必从头渲**;只改音频 → 只 remux。
- 我提意见时,按"镜头号 + 具体问题"处理,别重写整个方案。

---

## 八、以后换风格怎么办

流程**不变**,只换三样:**新的参考视频 → 新风格卡 → 选引擎**。
1. `python3 tools/analyze_ref.py ref/新视频.mp4` → 看联系表 → 写新风格卡(需要复用素材就走阶段 1 的第 3 步);
2. 按第四节选引擎;
3. 从阶段 2 开始走同一流水线。

Remotion 项目:`npx create-video@latest`(创建时可顺带装 skills);官方文档说明 Remotion 对个人 / 小团队免费、较大公司商用需付费,**以 remotion.dev 的 License 说明为准**。

---

## 九、版权与合规

- `素材使用=允许复用`:我已确认可以使用参考素材,权利与后果由我自己承担,Claude Code 不需要再提示。
- (只供我自己评估)抖音等平台对"搬运 / 洗稿"有判定,别人的音乐用于发布可能被静音或限流;代码合成的配乐没有这个问题。
- 字体:Noto 系列(OFL)可商用;其他字体先确认授权。

---

## 十、排障速查

| 现象 | 处理 |
|---|---|
| 找不到 Chrome | 给渲染命令传 `--chrome=<路径>`(见各 skill 说明) |
| WebGL 很慢 / 黑屏 | macOS 用 Metal(skill 已内置);Windows 建议 WSL2 且预期更慢,先降分辨率试跑;`--workers` 调小防内存不足 |
| 中文变方块 | 字体子集缺字:把画面出现的全部汉字加入 CJK 常量 / 字体加载列表 |
| `pip` 报 externally-managed-environment | 用虚拟环境(第三节) |
| 唱歌识别错字很多 | 先 demucs 分离人声;用 medium 或更大模型;**务必提供歌词做强制对齐** |
| 渲染中途崩了 | 引擎的 `--frames` 可续跑,只删出问题的那段帧再跑 |
| 渲染极慢 | 减少填充 / 描边数量、降低分辨率先试跑、确认 GPU 是否生效 |

---

## 附录 A · `tools/analyze_ref.py`(请原样保存;已在两支参考视频上实测通过)

```python
#!/usr/bin/env python3
"""analyze_ref.py <video> [outdir] — 读取参考视频的"结构",不拷贝任何画面。
输出 <outdir>/ref_analysis.json + contact_sheet.jpg
依赖: ffmpeg/ffprobe, numpy, librosa, Pillow
"""
import json, re, subprocess, sys, os, colorsys
import numpy as np, librosa
from PIL import Image

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "ref/analysis_" + os.path.splitext(os.path.basename(src))[0]
os.makedirs(out, exist_ok=True)
sh = lambda *a: subprocess.run(a, capture_output=True, text=True)

# 1) 基本信息
p = json.loads(sh("ffprobe", "-v", "error", "-print_format", "json", "-show_streams", "-show_format", src).stdout)
v = next(s for s in p["streams"] if s["codec_type"] == "video")
fps = eval(v["r_frame_rate"]); dur = float(p["format"]["duration"])
info = dict(file=os.path.basename(src), duration=round(dur, 2), width=v["width"], height=v["height"], fps=round(fps, 2),
            orientation="竖屏" if v["height"] > v["width"] else "横屏", has_audio=any(s["codec_type"] == "audio" for s in p["streams"]))

# 2) 音频:BPM / 节拍 / 能量曲线
wav = f"{out}/audio.wav"
sh("ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "22050", wav)
y, sr = librosa.load(wav, sr=22050)
tempo, bf = librosa.beat.beat_track(y=y, sr=sr)
bpm = float(np.atleast_1d(tempo)[0]); beats = librosa.frames_to_time(bf, sr=sr)
rms = librosa.feature.rms(y=y)[0]; rt = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
step = 5
energy = [round(float(rms[(rt >= s) & (rt < s + step)].mean()), 3) for s in range(0, int(dur), step)]
# 简单分段:能量相对均值的高/低区间(粗略定位主歌/副歌)
mean_e = np.mean(energy)
sections = ["高" if e > mean_e * 1.15 else "低" if e < mean_e * 0.85 else "中" for e in energy]

# 3) 镜头切点
r = sh("ffmpeg", "-v", "info", "-i", src, "-vf", "select='gt(scene,0.25)',showinfo", "-an", "-f", "null", "-")
cuts = [float(x) for x in re.findall(r"pts_time:([0-9.]+)", r.stderr)]
cuts = [c for i, c in enumerate(cuts) if i == 0 or c - cuts[i - 1] > 0.08]  # 合并相邻重复
if cuts:
    d = np.diff(cuts)
    beat_dist = [float(np.min(np.abs(beats - c))) for c in cuts]
    cut_stats = dict(count=len(cuts), median_shot_len=round(float(np.median(d)), 2) if len(d) else None,
                     fast_cuts_under_0_4s=int((d < 0.4).sum()),
                     cuts_on_beat_pct=round(100 * sum(x < 0.1 for x in beat_dist) / len(cuts)),
                     beats_per_median_shot=round(float(np.median(d)) * bpm / 60, 1) if len(d) else None)
else:
    cut_stats = dict(count=0, note="几乎没有硬切:大概率是连续运镜/形状连续转场/长镜头")

# 4) 主色板(忽略画面内容,只统计颜色)
def frames(n=24):
    for t in np.linspace(1, dur - 1, n):
        sh("ffmpeg", "-v", "error", "-y", "-ss", str(t), "-i", src, "-frames:v", "1", "-vf", "scale=160:-1", f"{out}/_f.png")
        yield np.array(Image.open(f"{out}/_f.png").convert("RGB")).reshape(-1, 3)
px = np.vstack(list(frames())); q = (px // 32) * 32 + 16
vals, cnt = np.unique(q, axis=0, return_counts=True)
bg = [("#%02x%02x%02x" % tuple(vals[i]), round(100 * cnt[i] / len(q), 1)) for i in np.argsort(-cnt)[:3]]
sat = {}
for r_, g_, b_ in px / 255.:
    h, s, vv = colorsys.rgb_to_hsv(r_, g_, b_)
    if s > .6 and vv > .5: k = int(h * 12) * 30; sat[k] = sat.get(k, 0) + 1
accent_hues = [h for h, _ in sorted(sat.items(), key=lambda x: -x[1])[:3]]
os.remove(f"{out}/_f.png")

# 5) 联系表(用来"看"画风和叙事结构)
every = max(dur / 20, 1)
sh("ffmpeg", "-v", "error", "-y", "-i", src, "-vf", f"fps=1/{every:.2f},scale=480:-1,tile=5x4", "-frames:v", "1", f"{out}/contact_sheet.jpg")

res = dict(info=info, music=dict(bpm=round(bpm, 1), bar_seconds_4_4=round(240 / bpm, 2), first_beats=[round(float(b), 2) for b in beats[:8]],
           energy_per_5s=energy, energy_levels=sections), cuts=dict(times=[round(c, 2) for c in cuts], **cut_stats),
           palette=dict(background_top3=bg, accent_hue_degrees=accent_hues))
json.dump(res, open(f"{out}/ref_analysis.json", "w"), ensure_ascii=False, indent=2)
print(json.dumps({k: res[k] for k in ("info", "cuts")}, ensure_ascii=False, indent=1)); print("bpm", res["music"]["bpm"], "| 背景色", bg, "| 强调色相°", accent_hues)
print("→", out)
```

## 附录 B · 两支参考视频的实测结果

| | 参考 A | 参考 B |
|---|---|---|
| 时长 / 规格 | 130.4 s · 1280×720 · 30 fps | 47.0 s · 1920×1080 · 30 fps |
| BPM(librosa) | ≈ 112.3 | ≈ 123.0 |
| 切点数(scene>0.25) | 0~1(连续运镜) | 31(中位镜头 1.93 s ≈ 4 拍) |
| 极快切(<0.4 s) | — | 9 |
| 切点落在拍点 ±0.1 s | — | ≈ 52% |
| 背景主色 | `#101010` 72%、`#101030` 6% | `#101010` 55%、`#f0f0f0` 39% |
| 强调色相 | 180°(青)、0–30°(橙) | 0–30°(橙)、210°(蓝)、120°(绿) |

> BPM 由节拍追踪算法估算,可能有倍频 / 半频误差(例如 123 也可能是 ≈ 61.5 的两倍速);阶段 2 请用该曲目的实际感觉与 `beat_grid` 交叉验证。


---

## 十一、类型三 · 知识大赏(2026-10-16 新增)

参考:`ref/refD.mp4`(Iwanau《Vibe 知识大赏|月老的算法》,143 s,960×544,30 fps)。

**这类片子长什么样**(看了 48 帧,转写了音轨):
- **没有旁白**,音轨只有器乐。信息全部靠**底部字幕 + 动画图解**传达,字幕里关键词标色。
- **一个知识点讲透**:反直觉的钩子 → 标题卡 → 来历(带出处小字)→ 把概念定义清楚 → 用一个小例子一步一步演示 → 换个条件再演示一遍、对比 → 揭示结论 → 金句 → 真实世界的应用 / 获奖 → 免责声明 → 结尾金句 + 参考文献。
- **几乎没有硬切**:同一套角色和道具在画面里连续变形、移动来推进。
- 风格:深色夜空底、暖金强调、红色关系线;衬线标题;右上角固定标注「数学模型演示」。

**流程**(在第七节各阶段基础上替换):
1. **选题**:Simon 给题目,或由 Claude 提 3 个、标推荐。避开参考作者已经做过的题。
2. **上网搜资料**:每个事实都要能追到来源;数字能算的自己算一遍。写进 `<项目>/RESEARCH.md`,逐条标 [算] / [源] / [二手]。转述来的(没看到原始出处)要在片子里写「据 ×× 统计」。容易讲错的延伸知识宁可不放。
3. **分镜表**:每一屏写清字幕文案 + 画面机制 + 转场。🛑 给 Simon 确认。
4. **音乐**:默认代码合成配乐(无版权风险);Simon 给音乐就用他的。
5. **制作**:Remotion(字幕、图表、矢量插画)。逐段渲染、对照、修改。
6. **质检**:除第七节阶段 6 的项目外,再逐条核对片中每个数字和 `RESEARCH.md` 一致,片尾必须有前提说明和参考文献。

---

## 十二、三种视频类型总览(2026-10-16 整理)

接到新片子,先定是哪一类,再走对应的流程。三类共用第七节的阶段和第零节的规则。

| 类型 | 适合 | 引擎 | 参考片 | 做过的片子 | 详细做法 |
|---|---|---|---|---|---|
| **一 · 动态排版歌词** | 节奏强、歌词有梗的歌 | Remotion | `ref/refB.mp4` | `video/`(复刻测试,合成 `RefB`)→ `out/final.mp4` | 第五节风格卡 B + 下面「类型一」 |
| **二 · 角色故事** | 有画面感、讲故事的歌 | painted-animation(canvas 手绘水彩) | `ref/refC.mp4`(方块螃蟹) | `boli/`《玻璃》→ `boli/out/boli_final.mp4` | 下面「类型二」 |
| **三 · 知识大赏** | 讲透一个知识点,无旁白 | Remotion(SVG 图解) | `ref/refD.mp4`(月老的算法) | `kb_prisoner/`《囚徒困境》→ `kb_prisoner/prisoner_final.mp4` | 第十一节 |

**类型一 · 动态排版歌词**
- 输入:Simon 给歌(`music/song.mp3`,模式 ③)。歌词由 Claude 自己提取:demucs 分离人声 → Whisper 转写 → 能搜到歌词就对照 → 给 Simon 改错字 → stable-ts 强制对齐。
- 画面:一屏一句,黑白底交替,关键词上色放大,角落代码梗,颜文字小人;每句一个「画面机制」。内容和梗由 Claude 原创,不复用参考片素材。
- 关键经验:字比人声对齐时间早约 0.15 s 出现更自然;切点跟歌词句首走。

**类型二 · 角色故事**
- 输入:Simon 给歌,可以只给副歌。选段在小节线上切,头尾淡入淡出;片长跟着歌走,不在半句截断。
- 画面:Claude 自编一句话的故事和贯穿道具,每句歌词配一个小剧情;底部卡拉 OK 歌词条。先出分镜表和一张概念图,🛑 Simon 确认后再做。
- 引擎规则以 `vendor/opus-video-skills/skills/painted-animation/` 的 `ANIMATION_GUIDE.md` 为准(每帧是 t 的纯函数、boilSeed、glow、关键动作在歌词条上方)。渲染约 1 秒/帧,用 `--frames --workers=4`。

**类型三 · 知识大赏**:见第十一节。资料先上网查、逐条标出处,数字能算就自己算,片尾必须有声明和参考文献。

**抖音留存规则(2026-10-21 Simon 提出,三类都适用)**:
- **黄金开头**:第 0 帧就是全片最抓人的一句话 + 画面(它也常被当封面),不从黑场淡入,字幕第 0 秒就在。前 3 秒给冲突,3–5 秒给证据量,5–8 秒留一个「看到最后」的悬念。
- **开头必须有声**:配乐不能有前奏空白。`tools/synth_piano.py ... <intro_bars=0> <hits=0,2.4,...>`,第 0 秒就有钢琴并加重音;检查前 6 秒的瞬时响度,不要比正片低很多。
- **引导看主页**:开头显示系列标识「知识大赏 · 第 N 期 · 每期讲透一个知识点」。结尾**不要点名某一支旧视频**(Simon 2026-10-21 否掉了「主页还有《囚徒困境》」);改用互动加关注:「还想知道哪个知识点?评论区点题,下期就讲 · 关注「知识大赏」」,配几张翻转的问号卡片。

**发布**:Simon 自己发。需要时 Claude 写抖音标题和简介(系列名 + 《片名》+ 一句问题钩子;简介数字和片中一致;结尾留一个互动提问;3–5 个话题标签)。
