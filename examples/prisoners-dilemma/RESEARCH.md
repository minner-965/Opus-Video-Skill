# 资料汇总 · 囚徒困境(知识大赏)

日期:2026-10-16。标记:**[源]** 来自下列网页;**[二手]** 只找到转述;**[算]** 自己推的。

## 规则(片中用这一版收益)
两个同伙被分开关押,警方证据不足,只够判轻罪。各自可以「沉默」或「揭发对方」:[源] Wikipedia「Prisoner's dilemma」
| | 乙 沉默 | 乙 揭发 |
|---|---|---|
| **甲 沉默** | 各 1 年 | 甲 3 年,乙 释放 |
| **甲 揭发** | 甲 释放,乙 3 年 | 各 2 年 |

推理 [算]:
- 乙沉默时:甲揭发 0 年 < 沉默 1 年。乙揭发时:甲揭发 2 年 < 沉默 3 年。所以不管乙怎么选,揭发对甲都更好(占优策略)。乙同理。
- 结局:各 2 年。可如果都沉默,各 1 年,两人都更好。总刑期 4 年 vs 2 年。
- 「都揭发」就是纳什均衡:谁单独改主意都会更吃亏。

## 来历
- **1950 年,兰德公司(RAND)的 Merrill Flood 和 Melvin Dresher** 设计了这个博弈。[源] Wikipedia、SEP
- **Albert W. Tucker** 为了给斯坦福的心理学家讲明白,把它改编成两个囚犯的故事;一般认为这个名字也来自他。[源] SEP、MAA 传记。
  - 注意:SEP 提到,印刷品里最早用这个名字的是 Luce 和 Raiffa 1957 年的书。所以片中只写「图克把它讲成了两个囚犯的故事」,不写「命名于某年某月」。
- 纳什均衡:John Nash 1950 年提出;1994 年诺贝尔经济学奖(与 Harsanyi、Selten 共享)。[源] 常识级事实,Wikipedia 可查。片中只放小字。

## 真实实验:Flood–Dresher(1950 年初)
- 请两位同事**连续玩 100 轮**。[源] SEP、斯坦福 CS 课程页
- 结果:**两人同时合作是最常见的结局,100 轮里有 60 轮**。[二手] 有的来源说是「后 89 轮里的 60 轮」,统计口径不一。另有来源说两人都背叛只有 14 次。
- 片中写法:「100 轮里,两人一起合作的多达 60 轮」,并加小字「统计口径各有出入」。
- 参与者:Wikipedia 写作经济学家 Armen Alchian 和数学家 John Williams;一个搜索结果称没找到这两人的名字。**片中不写名字**,只说「两位同事」。

## 阿克塞尔罗德的电脑锦标赛
- 政治学家 **Robert Axelrod** 邀请各领域学者提交程序,让程序两两重复对局。结果 1980 年发表在《冲突解决杂志》(Journal of Conflict Resolution),1984 年写成书《合作的进化》。[源] PLoS ONE 综述(2015)、Wikipedia
- **冠军:「以牙还牙」(Tit for Tat),由 Anatol Rapoport 提交,两届都是第一。** [源] PLoS ONE、Wikipedia
- 它是**最简单的参赛程序,只有 4 行 BASIC**。[源] Wikipedia
- 规则:第一轮合作,之后每轮照抄对方上一轮。[源] SEP
- 第二届有 **63 个参赛程序**,参赛者事先都看过第一届的结果。[源] SEP。第一届数量(常见说法 14 个)没有核实到,**片中不写**。
- 胜出的原因(Axelrod 总结):**善良**(从不先背叛)、**会报复**、**会原谅**、**清晰**(好预测)。[源] SEP;Wikipedia 第四条写作「不嫉妒」,片中用 SEP 的四条。
- 「8 个善良的程序,正好排名前 8」。[源] SEP

## 现实
- 气候:各国都希望气候稳定,但都不愿先减排。[源] Wikipedia
- 军备竞赛、价格战:属于同类结构(Wikipedia 用「安全困境」描述国际关系)。片中只作一句概括,不举具体年份和数字。

## 来源
- https://en.wikipedia.org/wiki/Prisoner%27s_dilemma
- https://plato.stanford.edu/entries/prisoner-dilemma/
- https://cs.stanford.edu/people/eroberts/courses/soco/projects/game-theory/flood.html
- https://doaj.org/article/6c213202b8324e8c98beaea09479c89e (PLoS ONE, 2015)
- https://www.maa.org/node/555
