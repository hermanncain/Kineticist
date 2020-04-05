本文档只讲述自底向上设计刘成霞系统的使用方法，具体原理见README中的论文

## 1 单元设计 <img src="css/icons/menubar/unit-scene.svg" width = "20" height = "20"/> 

单元形状由轴套、叶片、点缀和传动机构组成，此步进行叶片和点缀的设计。轴套将由系统自动生成。

叶片和点缀的生成依靠骨架线引导。通过顶端工具栏中的<img src="css/icons/toolbar/add-end.svg" width = "10" height = "10"/> 按钮绘制末点 ，在场景中添加骨架的端点，系统自动生成直线骨架。

选中骨架后可以用<img src="css/icons/toolbar/ca.svg" width = "10" height = "10"/> 按钮生成圆周阵列。

在左侧工具栏中的`semantics`对曲线形状进行配置。

单元叶片是可控扫掠体，在左侧工具栏blade sweeping中对扫掠缩放和扭转进行配置。

点缀是叶片上修饰结构。在左侧工具栏中的accessory添加和删除点缀，并配置点缀在叶片上的位置、大小和形状

点击顶端工具栏的确认按钮对单元几何体进行生成。不满意可以点击垃圾桶按钮删除几何体，调整各项配置后再生成

## 2 单元布局和变形<img src="css/icons/menubar/sculpture-scene.svg" width = "15" height = "15"/> 

### 2.1 主轴和参考绘制  

> 顶端工具栏

单元布局是将单元进行克隆并将其排列在主轴上的过程，依靠主轴和参考线引导。系统目前只开发了直线和插值样条两种绘图方法，并提供一些可调整的参数曲线。

选中一条曲线后，点击顶端工具栏的<img src="css/icons/toolbar/axis.svg" width = "10" height = "10"/>按钮将其提升为主轴，点击<img src="css/icons/toolbar/reference.svg" width = "10" height = "10"/>将其设置为布局参考线

### 2.2 快速布局

> 左侧工具栏`LAYOUT`模块

配置单元数量、尺寸和扭转

### 2.3 协同变形

> 左侧工具栏`MORPH`模块

在`Interpolation method`选择插值方法

在`Morph mode`中选择变形类型，此时场景中的变形控制单元会高亮。选中任意非高亮单元，勾选`set as control`可以将之设置为控制单元。选中控制单元可以通过调整变形参数或直接在场景中拖动对其进行变形。此时其他非控制单元会跟随变形。

## 3 机构生成

> 左侧工具栏`MECHANISM`模块

点击`solve transmissions`<img src="css/icons/leftbar/transmissions.svg" width = "10" height = "10"/>按钮，系统会自动求解并生成可行的传动机构，如果某些段无解，系统会红色高亮相关的单元。此时用户需要调整主轴的局部形状，减小曲率。

## 4 运动模拟

> 菜单栏

在动态雕塑场景中，点击播放和暂停按钮可以预览雕塑的运动效果。目前所有单元等速转动，尚未支持差速配置。

## 5 实物加工

> 左侧工具栏`MECHANISM`模块

点击`refine models`按钮对零件进行细化

点击`export stl`按钮下载所有单元轴套的stl模型。

## 6 显示控制

> 右侧工具栏

`CAMERA`模块中的按钮控制点线面等图形的显隐

`MATERIAL`模块中可以对场景的背景图片和雕塑的材质进行配置。