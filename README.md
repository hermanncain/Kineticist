# 动态雕塑快速原型工具

## 1 概述

本工具用于快速设计具有大量重复回转单元的动态雕塑。使用本工具设计此类雕塑分为以下3个步骤：
- 单元造型
- 单元布局和变形
- 传动机构求解

## 2 单元设计 <img src="css/icons/leftbar/separated.svg" width = "20" height = "20"/> 

单元形状由轴套、叶片、点缀和传动机构组成，此步进行叶片和点缀的设计。轴套将由系统自动生成。

叶片和点缀的生成依靠骨架线引导。骨架线的绘制步骤如下：
- 绘制末点 <img src="css/icons/leftbar/dot.svg" width = "10" height = "10"/> ，提供了末点的圆周阵列 <img src="css/icons/leftbar/ca.svg" width = "10" height = "10"/> 功能进行快速绘制，但需要先选中末点才能执行
- 生成初始化骨架线 <img src="css/icons/leftbar/separated.svg" width = "10" height = "10"/> ，此时是直线
- 通过对骨架线的形状语义参数`shape semantics`进行设置，调整骨架线的形状

叶片是可控扫掠体，用户可以通过切换到 <img src="css/icons/leftbar/blade.svg" width = "10" height = "10"/> 选项卡调整扫掠截面的形状、扭转、缩放。

点缀目前支持圆盘、球、碗、环、叶五种几何体。在左侧面板的 <img src="css/icons/leftbar/accessory.svg" width = "10" height = "10"/> 部分添加和删除点缀及参数，第一个参数是在骨架线上的位置(0~1)，第二个参数是缩放比例。

上述参数设置完成后便可以生成单元的网格 <img src="css/icons/leftbar/automation.svg" width = "10" height = "10"/> 。不满意就调整参数，或者删掉结果 <img src="css/icons/leftbar/clear.svg" width = "10" height = "10"/> 修改骨架线再重新生成。

## 2 单元布局

### 2.1 主轴和参考绘制 <img src="css/icons/leftbar/brush2d.svg" width = "15" height = "15"/>  

单元布局是将单元进行克隆并将其排列在主轴上的过程，依靠主轴和参考线引导。系统目前的绘图功能尚未开发完全，纯手绘 <img src="css/icons/leftbar/brush2d.svg" width = "10" height = "10"/>  <img src="css/icons/leftbar/brush3d.svg" width = "10" height = "10"/> 不要使用，推荐使用直线、样条和绘图工具中部直接能够导入的参数曲线。

可以绘制多条草图线条，选中一条后，可以在右侧面板的结构选项卡 <img src="css/icons/rightbar/mechanism-tab.svg" width = "10" height = "10"/> 将其提升为主轴 <img src="css/icons/sidebar/axis.svg" width = "10" height = "10"/> ，或降级为普通曲线 <img src="css/icons/sidebar/contour.svg" width = "10" height = "10"/> 。还可以为主轴添加参考线 <img src="css/icons/sidebar/tree.svg" width = "10" height = "10"/> ，在点击该按钮后到绘图区选择一条曲线即可。如果没指定参考线，后续单元排列会使用主轴的PTF标架调整空间旋转。如果指定了参考线会根据参考线调整空间旋转。然后准备进入下一步：
- 如果绘制了多条主轴，进入下一步之前记得要选中一个作为后续单元布局的主轴
- 如果绘制了一条曲线但未指定主轴，进入下一步时系统会自动将其升级为主轴

### 2.2 参数化布局 <img src="css/icons/topbar/mechanism.svg" width = "15" height = "15"/> 

进入此步时，系统会根据主轴最小曲率半径和单元最大半径调整单元的缩放比例。这一步可能会造成单元过小，请自行再做调整。

指定要克隆的单元数量和扭转角，点击`layout`按钮进行初步排列。

### 2.3 协同变形

对雕塑进行调整就是调整每个单元的形状。这里使用插值实现通过调整少量单元形状而改变所有单元形状的效果。每个单元都有形态变换，只改变单元内部叶片和点缀的形状，不会改变单元整体的空间变换。对于某个形态变换，通过指定若干个控制单元并赋予不同的值，其他单元对应的形态变换会在这些值之间进行线性插值，从而所有单元的形状都会发生改变。雕塑的首末单元会自动成为控制单元。新控制单元的添加和修改操作如下：

- 选中一个单元，右侧面板会转到空间变换选项卡 <img src="css/icons/rightbar/geometry-tab.svg" width = "15" height = "15"/> 。关注`Morph ops`部分
    - `translation`：控制偏移量，试一下就知道
    - `rotation`：其中最后一个值可以用来控制单元在主轴上的扭转
    - `scale`：可以控制不同方向的缩放
- `+`按钮：将选中的单元添加为该Inner transform的控制单元
- `-` 按钮：将选中的单元从该Inner transform的控制单元中移除
- 左侧面板的`Morph control`部分可以用来查看各形态变换有哪些控制单元。但都显示的话高亮颜色会发生覆盖
- 请尽量使用输入而不是拖动的形式修改形态变换，因为每变换一点都会对所有单元进行形状调整，计算量比较大，连续拖动会卡

## 3 机构生成

### 3.1 最后一步

不用多说，前面都做好了之后点击`solve transmissions`，系统会自动求解并生成传动件，现在速度已经很快了~注意一些3D曲线生成的传动件在实际转动过程中是不等速的，但系统的动画目前是设置为所有单元等速旋转，因此在模拟运动中一些传动件会分离，暂时先忽略这一点。

### 3.2 修改

如果想要换主轴，回到绘制曲线的页面进行绘制即可。旧的主轴可以不用删除，记得进入布局页面前选中新的主轴，忘了也没关系，系统会提示。

> 绘制了新的主轴后，进行单元布局时，如果想使用之前生成雕塑的内部变换插值，则应该使用`relayout`按钮。如果就想生成全新的雕塑不再关注之前的内部变换插值，那就使用`generate`按钮。


### 3.3 显示控制

右侧面板场景 <img src="css/icons/rightbar/scene-tab.svg" width = "10" height = "10"/> 选项卡的`camera`部分的 <img src="css/icons/leftbar/dot.svg" width = "10" height = "10"/> 等按钮可以控制点、线的显隐。