# Apple 公布的尺度

- 调查日期：2026-10-07
- 问题：Human Interface Guidelines 和第一方 API 文档怎样定义圆角、间距、字体、字重和阴影。现有 Tailwind 主题里，`rounded-xl` 到 `rounded-4xl` 都是 16px。要确认 Apple 有没有一套多级圆角阶梯，以及其他尺度是怎么组织的，再决定更大的圆角类名要不要留。
- 资料：当天打开的 HIG 文章，以及这些文章指向的 SwiftUI、UIKit、AppKit、QuartzCore 符号页。设计资源页只用来核对它自己有没有印出尺度表。
- 范围：只记页面上写明的内容。某页没有的数字，记为未公布。不把示例代码里的半径当成阶梯，也不把组件专用尺寸推广成全局 token。

文中的 HIG 链接对应文档站上的文章。文章正文由页面再取一份 JSON，下面是这次打开过的地址：

- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/layout.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/typography.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json
- https://developer.apple.com/tutorials/data/design/human-interface-guidelines/app-icons.json
- https://developer.apple.com/tutorials/data/documentation/swiftui/concentricrectangle.json

接口链接对应符号页。

## 1. 圆角：同心或固定，没有命名阶梯

Apple 没有公布一套像 `sm` / `md` / `lg` / `xl` 这样、每一档一个固定像素的圆角名单。Layout 页讲安全区、边距和参考线，不讲圆角档位。

当前模型是三种角，不是一列越来越大的半径：

- 直角。
- 固定半径。半径是调用方传入的一个数。
- 同心圆角。这个角的半径和容器对应角的半径共用圆心，由系统按容器和位置计算。离容器角太远时，算出来的半径可以是 0，角就是直角。

来源：

- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [`ConcentricRectangle`](https://developer.apple.com/documentation/swiftui/concentricrectangle)
- [`Edge.Corner.Style`](https://developer.apple.com/documentation/swiftui/edge/corner/style)

`Edge.Corner.Style` 只有 `concentric`、`concentric(minimum:)` 和 `fixed(_:)`。`fixed` 接收一个 `CGFloat`。这个类型可以用浮点或整数字面量表达，页面没有预置 4、8、12、16 这种档。`concentric(minimum:)` 只保证一个下限，仍然不是一列档位。

[`ConcentricRectangle`](https://developer.apple.com/documentation/swiftui/concentricrectangle) 的概述用 `8.0`、`12.0`、`24.0`、`0.0` 演示固定半径、最小半径和直角。这些是示例，页面没有说它们是系统圆角阶梯。系统控件如 sheet、popover 会自动做同心；自定义视图要用 `containerShape(_:)` 提供符合 `RoundedRectangularShape` 的容器形状，系统才按容器计算。容器形状不符合时，行为退回内缩后的容器形状，和 [`ContainerRelativeShape`](https://developer.apple.com/documentation/swiftui/containerrelativeshape) 同类。`ContainerRelativeShape` 本身没有半径参数；没有当前容器形状时，系统给一个矩形。

曲线样式是另一件事，也不构成尺寸阶梯：

- [`RoundedCornerStyle`](https://developer.apple.com/documentation/swiftui/roundedcornerstyle) 只有 `circular`（四分之一圆）和 `continuous`（连续曲率）。
- [`CALayer.cornerRadius`](https://developer.apple.com/documentation/quartzcore/calayer/cornerradius) 是一个 `CGFloat`，默认 `0.0`。大于 0 时背景和边框画圆角。
- [`CALayerCornerCurve`](https://developer.apple.com/documentation/quartzcore/calayercornercurve) 只有 `circular` 和 `continuous`。

本次请求的 [UICornerConfiguration](https://developer.apple.com/documentation/uikit/uicornerconfiguration) 返回 404。本文不把这个名字当作现行符号。

组件页上能查到的半径，都绑在具体控件上，不能排成一条全局阶梯：

| 页面上的说法 | 适用对象 |
|---|---|
| 配件视图最大高度 154 pt，圆角 16 pt | visionOS 警告里的配件视图。来源：[Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts) |
| Dynamic Island 圆角 44 pt，形状与 TrueDepth 相机一致 | 灵动岛，不是通用卡片。来源：[Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) |
| 两种大图版式自带 4 pt 圆角 | watchOS 复杂功能的大图版式。来源：[Complications](https://developer.apple.com/design/human-interface-guidelines/complications) |
| 标准按钮、文本框、页眉、页脚的圆角默认与条的圆角同心；自定义组件也要同心。页面没有给出条的半径 | 工具栏。来源：[Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) |
| 弹性高度按钮与普通按钮使用同一圆角和同一内容内边距。页面没有写出这个半径 | 按钮。来源：[Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) |
| 内容圆角要和小组件圆角协调，用 SwiftUI 容器取正确半径。指向 `ContainerRelativeShape`，没有固定 pt 值 | 小组件。来源：[Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets) |
| 圆角矩形靠近 Live Activity 角时，用外圆角减去边距，再用 SwiftUI 容器套上。指向 `ContainerRelativeShape` | Live Activity。来源：[Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) |

图标也不提供一列半径。[App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) 写的是：iOS、iPadOS、macOS 图标由系统遮罩成圆角，曲率对齐系统里其他圆角元素和设备外框；tvOS 图标是矩形，边缘同心；visionOS 和 watchOS 由系统做成圆形遮罩。页面没有图标圆角的 pt 表。

[Apple Design Resources](https://developer.apple.com/design/resources/) 当天的页面列出各平台 UI kit、图标模板和 SF Pro、SF Compact 下载。页面正文没有圆角、间距或阴影尺度表。

因此：更大的类名如果只是再写一遍 16px，并不对应 Apple 公布的下一档。Apple 这边要么是调用方自定的一个固定半径，要么是相对容器算出来的同心半径。

## 2. 间距：有安全区和个别规格，没有 4px 工具阶梯

[Layout](https://developer.apple.com/design/human-interface-guidelines/layout) 要求遵守系统定义的安全区、边距和参考线（平台提供时），并用布局修饰符微调位置。参考线是一块矩形，系统用预定义参考线套标准边距，并限制文本宽度。安全区是窗口里不被硬件或工具栏、标签栏、状态栏挡住的区域。

这一页没有公布 iOS 的标准边距是多少点，也没有 4 / 8 / 12 / 16 / 24 这种公共阶梯。开发文档链接指向 `UILayoutGuide`、`NSLayoutGuide`、`SafeAreaRegions` 等类型，那些页面定义的是区域，不是一列间距 token。SwiftUI 的 [`padding(_:_:)`](https://developer.apple.com/documentation/swiftui/view/padding(_:_:)) 接收调用方给出的量；HIG 在小组件和 Live Activity 里把“见开发文档”指到这个修饰符，修饰符本身仍然没有预置档位。

页面上写明的点值，都限在该平台或该组件：

| 写明的值 | 适用对象 | 来源 |
|---|---|---|
| 主内容上、下各缩进 60 pt，左右各 80 pt | tvOS 屏幕安全区 | [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| 未聚焦行、列：水平间距 40 pt，垂直间距至少 100 pt | tvOS 网格。同一节还按 2 到 9 列给出未聚焦内容宽度，从 860 pt 到 160 pt | 同上 |
| 按钮中心至少相距 60 pt | visionOS 窗口里的按钮 | 同上 |
| 命中区域至少 44×44 pt；visionOS 为 60×60 pt | 按钮 | [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) |
| 按钮本身已达 60 pt 或更大时，周围再加 4 pt，避免悬停效果重叠 | visionOS 按钮 | 同上 |
| 图片按钮边缘内大约 10 像素 | macOS 图片按钮。这里写的是像素，不是 pt | 同上 |
| 多数小组件标准边距 16 pt；更紧的分组可用 11 pt。Mac 桌面和锁屏（含 StandBy）更小，该页没有写出更小的数 | 小组件 | [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets) |
| 锁屏上标准布局边距 14 pt。图形或按钮可以更紧，但不要挤到边缘 | Live Activity | [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) |
| 画布大约 10% 作为边距，图像主体大约占画布 80% | 自定义界面图标的光学对齐，不是界面间距阶梯 | [Icons](https://developer.apple.com/design/human-interface-guidelines/icons) |

tvOS 标签栏高度 68 pt、顶边距屏幕顶部 46 pt，是这个控件的尺寸，不是间距 token。[Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)。

## 3. 字体：语义样式和 Dynamic Type，不是一条固定 px 阶梯

[Typography](https://developer.apple.com/design/human-interface-guidelines/typography) 把文字组织成文本样式。一个样式是字重、字号和行距的组合，并且随 Dynamic Type 改变。iOS、iPadOS、tvOS、visionOS、watchOS 支持 Dynamic Type；macOS 不支持。样式要随辅助功能里的更大字号继续排得下，而不是只准备一个 px。

接口侧同样只有语义名，符号页不附默认磅值：

- [`UIFont.TextStyle`](https://developer.apple.com/documentation/uikit/uifont/textstyle)：`largeTitle`、`extraLargeTitle`、`extraLargeTitle2`、`title1`、`title2`、`title3`、`headline`、`subheadline`、`body`、`callout`、`footnote`、`caption1`、`caption2`。传给 `preferredFont(forTextStyle:)`。[`body`](https://developer.apple.com/documentation/uikit/uifont/textstyle/body) 的页面只写“正文字体”，没有磅值。
- [`Font.TextStyle`](https://developer.apple.com/documentation/swiftui/font/textstyle)：`extraLargeTitle2`、`extraLargeTitle`、`largeTitle`、`title`、`title2`、`title3`、`headline`、`subheadline`、`body`、`callout`、`caption`、`caption2`、`footnote`。同样没有磅值。

磅值在 HIG 的 Specifications 一节。该节还说明：强调变体用符号特征取用；SwiftUI 用修饰符，UIKit 用相应 API。强调字重可以是 medium、semibold、bold 或 heavy，具体落在哪一档由每个样式的表给出。HIG 同时说，各平台的 Dynamic Type 尺寸表也可以从 [Apple Design Resources](https://developer.apple.com/design/resources/) 下载。下面的表是 HIG 页面上印出的默认档，不是那些下载文件，也不是 xSmall、AX1 等其余档。

各平台建议的默认字号和最小字号：

| 平台 | 默认 | 最小 |
|---|---|---|
| iOS、iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| tvOS | 29 pt | 23 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

来源：[Typography](https://developer.apple.com/design/human-interface-guidelines/typography)。最小字号同时约束自定义字体。细字重要再加大。

iOS、iPadOS，Dynamic Type 的 Large（default）。表下注明：字号按 @2x 144 ppi、@3x 216 ppi 的图计算。

| 样式 | 字重 | 字号（pt） | 行距（pt） | 强调字重 |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

同一页还有 xSmall、Small、Medium、xLarge、xxLarge、xxxLarge，以及更大的辅助功能档 AX1–AX5。那些不是默认档，不抄进这里。

macOS 只有一张内置样式表，没有 Dynamic Type 分档。行高列的表头是 Line height，不是 Leading。字号按 @2x 144 ppi 的图计算。

| 样式 | 字重 | 字号（pt） | 行高（pt） | 强调字重 |
|---|---|---|---|---|
| Large Title | Regular | 26 | 32 | Bold |
| Title 1 | Regular | 22 | 26 | Bold |
| Title 2 | Regular | 17 | 22 | Bold |
| Title 3 | Regular | 15 | 20 | Semibold |
| Headline | Bold | 13 | 16 | Heavy |
| Body | Regular | 13 | 16 | Semibold |
| Callout | Regular | 12 | 15 | Semibold |
| Subheadline | Regular | 11 | 14 | Semibold |
| Footnote | Regular | 10 | 13 | Semibold |
| Caption 1 | Regular | 10 | 13 | Medium |
| Caption 2 | Medium | 10 | 13 | Semibold |

tvOS 也是一张内置表。字号按 @1x 72 ppi、@2x 144 ppi 的图计算。

| 样式 | 字重 | 字号（pt） | 行距（pt） | 强调字重 |
|---|---|---|---|---|
| Title 1 | Medium | 76 | 96 | Bold |
| Title 2 | Medium | 57 | 66 | Bold |
| Title 3 | Medium | 48 | 56 | Bold |
| Headline | Medium | 38 | 46 | Bold |
| Subtitle 1 | Regular | 38 | 46 | Medium |
| Callout | Medium | 31 | 38 | Bold |
| Body | Medium | 29 | 36 | Bold |
| Caption 1 | Medium | 25 | 32 | Bold |
| Caption 2 | Medium | 23 | 30 | Bold |

watchOS 的默认档随表壳尺寸分三张，不能收成一行。HIG 的样式名在这里是 Caption、Footnote 1、Footnote 2，和 iOS 表不完全相同。

Small（default 38mm）：

| 样式 | 字重 | 字号（pt） | 行距（pt） | 强调字重 |
|---|---|---|---|---|
| Large Title | Regular | 32 | 34.5 | Bold |
| Title 1 | Regular | 30 | 32.5 | Semibold |
| Title 2 | Regular | 26 | 28.5 | Semibold |
| Title 3 | Regular | 18 | 20.5 | Semibold |
| Headline | Semibold | 15 | 17.5 | Semibold |
| Body | Regular | 15 | 17.5 | Semibold |
| Caption 1 | Regular | 14 | 16.5 | Semibold |
| Caption 2 | Regular | 13 | 15.5 | Semibold |
| Footnote 1 | Regular | 12 | 14.5 | Semibold |
| Footnote 2 | Regular | 11 | 13.5 | Semibold |

Large（default 40mm/41mm/42mm）：

| 样式 | 字重 | 字号（pt） | 行距（pt） | 强调字重 |
|---|---|---|---|---|
| Large Title | Regular | 36 | 38.5 | Bold |
| Title 1 | Regular | 34 | 36.5 | Semibold |
| Title 2 | Regular | 28 | 30.5 | Semibold |
| Title 3 | Regular | 19 | 21.5 | Semibold |
| Headline | Semibold | 16 | 18.5 | Semibold |
| Body | Regular | 16 | 18.5 | Semibold |
| Caption 1 | Regular | 15 | 17.5 | Semibold |
| Caption 2 | Regular | 14 | 16.5 | Semibold |
| Footnote 1 | Regular | 13 | 15.5 | Semibold |
| Footnote 2 | Regular | 12 | 14.5 | Semibold |

xLarge（default 44mm/45mm/49mm）：

| 样式 | 字重 | 字号（pt） | 行距（pt） | 强调字重 |
|---|---|---|---|---|
| Large Title | Regular | 40 | 42.5 | Bold |
| Title 1 | Regular | 38 | 40.5 | Semibold |
| Title 2 | Regular | 30 | 32.5 | Semibold |
| Title 3 | Regular | 20 | 22.5 | Semibold |
| Headline | Semibold | 17 | 19.5 | Semibold |
| Body | Regular | 17 | 19.5 | Semibold |
| Caption 1 | Regular | 16 | 18.5 | Semibold |
| Caption 2 | Regular | 15 | 17.5 | Semibold |
| Footnote 1 | Regular | 14 | 16.5 | Semibold |
| Footnote 2 | Regular | 13 | 15.5 | Semibold |

上面“易读性”表里的 watchOS 默认 16 pt，与 Large（default 40mm/41mm/42mm）的 Body 一致。38mm 和 44mm 及以上的默认 Body 分别是 15 pt 和 17 pt。

visionOS 使用更粗的 Dynamic Type 正文和标题样式，并增加 Extra Large Title 1、Extra Large Title 2，供宽的编辑型版面使用。这次打开的 Specifications 没有单独的 visionOS 默认磅值表。`Font.TextStyle` 有 `extraLargeTitle` 和 `extraLargeTitle2` 这两个 case，符号页也没有磅值。来源：[Typography 的 visionOS 一节](https://developer.apple.com/design/human-interface-guidelines/typography)、[`Font.TextStyle`](https://developer.apple.com/documentation/swiftui/font/textstyle)。

同一 Specifications 还公布 SF Pro、SF Pro Rounded、New York、SF Compact 等的字距表，按字号列出 1/1000 em 和 pt。那是字距，不是界面间距阶梯，这里不抄。

系统字体是 San Francisco（SF Pro、SF Compact，以及阿拉伯文、亚美尼亚文、格鲁吉亚文、希伯来文、SF Mono 等变体）和 New York。另有圆角变体。可变字体把字重和光学尺寸插值，运行中的系统字体会按每个字号调整字距。macOS 另有一组动态系统字体变体，名称包括 Control content、Label、Menu、Menu bar、Message、Palette、Title、Tool tips、Document text、Monospaced document text、Bold system font、System font，各自对应一个 API。HIG 表的 API 列是符号链接，本文不改写那些符号名。

### 字重

HIG 写：系统字体的字重从 Ultralight 到 Black；SF 还有 Condensed、Expanded 等宽度。界面里优先 Regular、Medium、Semibold、Bold，避免 Ultralight、Thin、Light，小字尤其如此。来源：[Typography](https://developer.apple.com/design/human-interface-guidelines/typography)。

接口把这些名字列成常量，不附一条公开的数值阶梯：

- [`Font.Weight`](https://developer.apple.com/documentation/swiftui/font/weight)：`black`、`bold`、`heavy`、`light`、`medium`、`regular`、`semibold`、`thin`、`ultraLight`。
- [`UIFont.Weight`](https://developer.apple.com/documentation/uikit/uifont/weight)：同上九个，外加用 `CGFloat` 构造。概述说每个常量对应不同的字重值，并在没有正好匹配的字面时取最近的。当天打开的 [`regular`](https://developer.apple.com/documentation/uikit/uifont/weight/regular) 页只写“regular 字重”，没有写出那个 `CGFloat`。
- [`NSFont.Weight`](https://developer.apple.com/documentation/appkit/nsfont/weight)：同样九个名字，也可用 `CGFloat` 构造。页面没有印出各常量的原始数值。
- [`UIImage.SymbolWeight`](https://developer.apple.com/documentation/uikit/uiimage/symbolweight)：`unspecified`、`ultraLight`、`thin`、`light`、`regular`、`medium`、`semibold`、`bold`、`heavy`、`black`。概述写明：字重让符号的部分或全部线条逐步变粗，不对应某一具体线宽。可用 `fontWeight()` 对到 `UIFont.Weight`。
- [`Font.Width`](https://developer.apple.com/documentation/swiftui/font/width)：`compressed`、`condensed`、`standard`、`expanded`，另可传入 `CGFloat`。这是宽度，不是字重。

未公布的是：这些字重常量在网页上的原始数值，以及一套可以照抄进 `font-weight: 100…900` 的对照表。

## 4. 阴影和材质：按材料分层，不是 shadow-xs…xl

这次打开的 HIG 没有阴影高度阶梯，也没有模糊半径、偏移、扩展的分档。Layout 等页脚里出现的 “cast shadows” 来自一条视频简介，不是尺度表。

[Materials](https://developer.apple.com/design/human-interface-guidelines/materials) 用材料做深度、分层和层次，分两类：

- Liquid Glass：控件和导航（标签栏、侧边栏等）浮在内容之上。不要把它用在内容层。内容层里短暂交互的控件，例如滑块和开关，激活时可以呈现 Liquid Glass。自定义控件要少用。
- 标准材料：用在 Liquid Glass 下面的内容层，靠模糊、vibrancy 和混合模式区分结构。按语义和推荐用途选，不要按它当时看起来的颜色选。

Liquid Glass 有两个变体。`regular` 模糊并调整背景明度，多数系统组件用它，适合文字多或背景可能影响辨认的情况，例如警告、侧边栏、popover。`clear` 更透，适合浮在照片、视频上。底层内容亮时，可以在 clear 背后加一层 35% 不透明度的暗色压暗；底层已经够暗，或 AVKit 媒体控件自带压暗时，不必再加。变体的外观会随系统里对 Liquid Glass 的偏好，以及降低透明度、提高对比度而变。来源：[Materials](https://developer.apple.com/design/human-interface-guidelines/materials)。开发符号是 [`Glass`](https://developer.apple.com/documentation/swiftui/glass)：`regular`、`clear`，另有 `identity`（等于不施加玻璃）。HIG 正文没有把 `identity` 写成设计变体。

标准材料在 iOS、iPadOS 上，HIG 列出四种：ultra-thin、thin、regular（默认）、thick。更厚的更不透明，更适合细小文字；更薄的更透，用来保留背景语境。SwiftUI [`Material`](https://developer.apple.com/documentation/swiftui/material) 在这四种之外还有 `ultraThick`（大部分不透明）和 `bar`（对齐系统工具栏）。HIG 的“四种”和 API 的六个静态值不是同一张名单，使用时以各自页面为准。UIKit [`UIBlurEffect.Style`](https://developer.apple.com/documentation/uikit/uiblureffect/style) 按厚度列出 `systemUltraThinMaterial`、`systemThinMaterial`、`systemMaterial`、`systemThickMaterial`、`systemChromeMaterial`，并有始终为浅色或深色的对应项，以及较早的 `extraLight`、`light`、`dark`、`extraDark`、`regular`、`prominent`。这些是外观样式，不是海拔。

macOS 的标准材料按用途区分，并有两种背景混合：窗口之后、窗口之内。HIG 指向 `NSVisualEffectView.Material` 和 `NSVisualEffectView.BlendingMode`，没有在 Materials 页上列出一份阴影参数表。visionOS 窗口使用系统定义、不可改的 glass，并自动适应背后的亮度；文本层次用 vibrancy（`label`、`secondaryLabel`、`tertiaryLabel`），不是投影档。

和“阴影”这个词有关、但仍然不是 elevation scale 的条目：

- [Color](https://developer.apple.com/design/human-interface-guidelines/color) 把 Shadow color 解释为屏幕上抬起物体投下的虚拟阴影，并指向 [`NSColor.shadowColor`](https://developer.apple.com/documentation/appkit/nscolor/shadowcolor)。该属性是一个颜色。`shadow(withLevel:)` 用一个 `CGFloat` 在当前色和这个阴影色之间混合，页面没有预置 level 档。
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) 的 visionOS 指导：文字不在背景上时，优先加粗；一般不要加阴影来提高对比。空间里往往没有可投影的面，也没法预测合适的阴影大小和密度。
- [App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)：层与层之间的阴影、高光由系统画。不要在图标层上自带投影、斜面、模糊、发光。
- [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)：水平表面上的小组件会投下一道软阴影。这是一句现象描述，没有模糊半径或偏移。
- [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)：tvOS 上，焦点落在标签栏时，选中项带投影以强调选中。没有投影参数。

`Material` 文档里的 `RoundedRectangle(cornerRadius: 8)` 是示例形状，不是材料或阴影的一档。来源：[`Material`](https://developer.apple.com/documentation/swiftui/material)。

## 5. 对已经有类名的 Tailwind 主题

保留一条短的圆角阶梯，每一档用不同的值。不要为了填满 `rounded-2xl`、`rounded-3xl`、`rounded-4xl` 再造几个同样的 16px。Apple 没有这种多级固定半径名单；同心半径随容器变化，固定半径是单独传入的一个数。类名如果没有各自的值，就不是阶梯。

也不要把上面的表当成可以整份抄进 `@theme` 的像素表。

- 圆角只在个别组件上有 pt 数，而且单位是点，不是 CSS 像素。16 pt 的警告配件、44 pt 的灵动岛、4 pt 的表盘大图，不能排成 `xl` 到 `4xl`。
- 间距是安全区、参考线和组件自己的边距。小组件 16 pt、Live Activity 14 pt、tvOS 安全区 60/80 pt，都不是一条 4px 公用阶梯。
- 字体按语义样式和 Dynamic Type 分档。默认磅值随平台，watchOS 还随表壳尺寸变化。接口页不公布这些磅值。
- 字重是九个有名字的常量。网页没有给出可抄的原始数值，符号字重也不对应固定线宽。
- 层次靠 Liquid Glass 和标准材料的厚度，不靠 `shadow-xs` … `shadow-xl`。

主题里需要固定圆角、间距或阴影时，按这个 Web 界面自己的档位取一组互不相同的值即可。那是项目的尺度，不是 Apple 公布过的尺度。
