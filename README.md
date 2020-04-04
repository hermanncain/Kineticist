# Kineticist：动态雕塑设计工具

## 1 概述

![](https://c-ssl.duitang.com/uploads/blog/201601/18/20160118135505_CM4Td.gif)

![](https://3-im.guokr.com/Vo_Z3Cu3kQxqHlzIeUU-79MXZv-t8QukO7DDuoAfUTf0AQAAGgEAAEdJ.gif?imageView2/1)

动态雕塑是装置艺术的一种，上图的回转式动态雕塑（by [Anthony Howe](https://www.howeart.net/)）效果魔性，引人注目。但此类雕塑结构复杂，设计困难，对设计师的机械背景要求很高。

为了使普通设计师也可快速设计可行的动态雕塑，我将动态雕塑的设计拆解为

1. 单元造型
2. 整体造型
3. 机构设计

三大步骤，并开发本系统对其进行集成和实现。其中：

1→2→3为自底向上的设计流程：先对单个单元进行造型，然后对其进行复制和排列，通过对多单元联合变形实现雕塑整体造型。最后进行机构求解。本工具已完整实现该流程。

2→1→3为自顶向下的设计流程：先通过草图绘制和模拟整体的雕塑造型和运动效果，再生成和配置单元造型，最后进行机构求解。本工具已实现草图绘制和单速运动模拟，单元的生成和配置有待开发。

## 2 记录

- 2016.8：接触动态雕塑
- 2017：实物仿制、用户研究、设计过程分析、procedural modeling尝试、[digital gallery](https://hermanncain.github.io/kinetic_sculptor/)制作
- 2018：技术选型、系统架构和MVP开发
- 2018.9：指导学弟撰写设计交互论文，投稿CHI因没删除基金号被desk reject
- 2018.12：指导学弟修改，投稿CHI短文，仍被拒
- 2019.1：新一轮用研，迭代更新[digital gallery](https://hermanncain.github.io/kinetic_sculptor/)，功能拆解和流程制定，创新点挖掘
- 2019.3：1.0版开发完成，爆肝一个月论文投稿SMI2019
- 2019.4：SMI2019被拒
- 2019.5：修改后投稿IEEE CGA
- 2019.7：重写CHI被拒论文，投稿ICPID 2019
- 2019.8：ICPID 2019论文接收
- 2019.9：赴伦敦参加ICPID 2019会议，讲解设计方法和系统
- 2019.10：IEEE CGA论文大修，补实验、完善系统，爆肝23天修回
- 2019.12：对自顶向下方法系统研究，迭代至1.5版本系统，撰写论文投稿ICAMD 2020
- 2019.12：IEEE CGA论文小修
- 2020.1：ICAMD 2020论文接收，将赴曼谷开会的机会给学弟
- 2020.2：受疫情影响，学弟无法参会，发送poster
- 2020.2：IEE CGA论文接收，online地址 https://ieeexplore.ieee.org/document/8989968

## 3 使用说明

[document.md](document.md)

## 4 成果

- 本系统
- 1篇SCI论文，1篇EI会议oral，1篇普通会议oral
- 1篇发明专利（实审中）

## 5 致谢

- 本项目在国家自然科学基金（51775492）下资助完成
- 感谢设计师Yu Liu, Yuanxuan Huang参与用户研究和产品测试
- 感谢Jinsong Xiao, Shuting Zhong, Yupeng Duan参与用户测试
- 感谢Yuxiao Zhang, Zhentao Shuai, Zhihe Yang协助机械实物加工与测试

## License

MIT