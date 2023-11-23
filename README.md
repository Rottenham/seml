# Seml: Survival Endless Markup Langauge

Seml 是为 Plants vs. Zombies Survival Endless 定制的标记语言, 可用于描述波长, 用炮, 用垫等信息, 并内置了砸率测试,炮伤测试等功能.

## 快速开始: 砸率测试

1. 下载本插件.
2. 新建 `.seml` 后缀文件, 输入以下内容:
```
# 测试 PE.垫材24 旧PDc解的砸率
scene:PE
protect:18 28 58 68  # 要保护的炮位
repeat:300           # 测试选卡数 (可省略, 默认300), 每个选卡总计 1000 只红眼

w 601
PP 225 25 9
C 539~619 1265 9

w 601
PP 225 25 9 
DD +107 15 8.1875
C 539~619 1256 9

w 601
PP 225 25 9
DD +107 15 8.1875
C 539~619 1256 9
```

3. 使用 `Ctrl + Shift + P` 呼出命令菜单, 键入 `测试砸率` 即可.

## 快速开始: 炮伤测试

1. 下载本插件.
2. 新建 `.seml` 后缀文件, 输入以下内容:
```
# 测试 NE 无铲炮伤 (分别于 776, 800, 824 垫的三种情况)
scene:NE
protect:18 28 38 48 58  # 要保护的炮位
repeat:10000            # 测试波数 (可省略, 默认 10000), 每波梯/丑/橄/篮各 5 只

SET x 776

w1~3 0 1200~1700        # 完美预判冰, 记录 1200~1500cs 的数据, 共三种情况
C_NUM x+266 1"234'5' 9
SET x x+24
```

3. 使用 `Ctrl + Shift + P` 呼出命令菜单, 键入 `测试炮伤` 即可.

## 快速开始: 刷新测试

1. 下载本插件.
2. 新建 `.seml` 后缀文件, 输入以下内容:
```
# 测试红白关 225 / 260 PP 刷新意外率
scene:PE
require:红白            # 必出的僵尸类型, 可用中文单字或英文四字缩写
# ban: ...             # 禁出的僵尸类型
huge:false             # true 为旗帜波, false 为普通波
assume_activate:true   # true 为激活, false 为分离
dance:true             # true 为使用 dance cheat, false 为不使用 
repeat:1000            # 测试选卡数 (可省略, 默认 1000)

w 601
PP 225 25 9

w 601
PP 260 25 9
```
> 参考: [僵尸命名一览](https://forum.crescb.com/postid/5885/)

3. 使用 `Ctrl + Shift + P` 呼出命令菜单, 键入 `测试刷新` 即可.

## 快速开始: 跳跳测试

1. 下载本插件.
2. 新建 `.seml` 后缀文件, 输入以下内容:
```
# 测试后院有 5炮 7炮 时全收跳跳的最大波次
scene:PE
protect:15 17   # 场上存在的炮, 只有列数会被用到, 无需提供多行
repeat:1000     # 测试波数 (可省略, 默认 1000), 每波 1000 只跳跳

w 0 1200~1800   # 完美预判冰, 记录 1200~1800cs 的数据
    # 如果测试屋顶场合, 这里需要加一个用炮操作
    # 如 P3 300 2 9, 代表考虑的炮尾列 (其它参数不会用到)
```

3. 使用 `Ctrl + Shift + P` 呼出命令菜单, 键入 `测试跳跳` 即可.

## 语法一览

### 波长

可提供多个用冰时机. 可省略波数.

```
w1 0 300   # wave1 完美预判冰, 波长为300
           # 使用炮等效时间, 0 冰为完美预判冰, 10 冰为 Ice3
w 0 300    # 自动推测波数
```

### 用炮

使用一门或两门炮. 可用 B/D 代替 P 传递更精确的语义. 大小写均可.

```
P 318 2 9     # 318cs 生效炸 (2,9) 的炮
PP 318 25 9   # 318cs 生效炸 (2,9), (5,9) 的炮
D +220 1 7    # 延迟 220cs 生效
```

屋顶场合下, 使用数字后缀表示炮尾所在列.

```
P3 318 2 9   # 用炮尾在 3 列的炮炸 (2,9)
```

### 用垫

使用垫材.

```
C 446 1256 9     # 446cs 于 1-9, 2-9, 5-9, 6-9 放垫
C 446+134 ...    # 134cs 后铲
C 446~601 ...    # 601cs 铲
C +220+134 ...   # 延迟 220cs 种植, 种植后 134cs 铲
```

在行数后加 `'` 表示用小喷 / 阳光菇, 加 `"` 表示用花盆.


```
C 446 1'2'56 9   # 于 1-9, 2-9 垫小喷/阳光菇, 于 5-9, 6-9 放普通垫材
```

根据红眼坐标智能用垫. 如果省略 `wave`, 考虑所有波次的红眼. 后缀按优先级排序, 与行数不绑定.

```
C_POS 446 1"2'56 9 choose:3 waves:1,2 # 1,2,5,6 路中选择 3 个红眼 x 最小的行垫
                                      # 只考虑 w1,w2 的红眼
                                      # 优先用花盆，其次优先用小喷
```

根据梯丑总数智能用垫. 如果省略 `choose`, 选择所有行. 如果省略 `wave`, 考虑所有波次的梯丑. 后缀按优先级排序, 与行数不绑定.

```
C_NUM 446 1"2'56 9 choose:3 # 1,2,5,6 路中选择 3 个梯丑总数最多的垫
                            # 优先用花盆，其次优先用小喷
```

### 用卡

使用卡片. 基于炮等效时间. 支持樱桃 (A), 辣椒 (J), 窝瓜 (a), 大蒜 (G).

```
J 318 2 1       # 318cs 于 2-1 生效辣椒
G 776+266 5 9   # 776cs 于 5-9 放置大蒜, 266cs 后铲除
```

根据巨人总数智能用卡. 支持樱桃 (A), 辣椒 (J), 窝瓜 (a).

```
A_NUM 225 25 9    # 2,5 路中选择巨人数最多 (包含邻行) 的行放樱桃
J_NUM 225 1256 9  # 1,2,5,6 路中选择巨人数最多的行放辣椒
```

### 循环与变量

在 `w` 后指定波次范围代表循环; 使用 `SET` 设定变量.

```
SET x 776        # 变量名不可为纯数字; 表达式可包含加减乘除括号与其它变量, 结果必须是数字 
w1~4 0 1672      # 以下语句重复 4 遍
C x+266 1256 9
SET x x+24
```


## 设定测试参数

除上述表达操作的语句外, seml 也支持设定测试参数.

### 砸率测试

```
scene:PE             # 场地, 六场地大小写皆可
protect:17 27 57 67  # 要保护的位置, 默认为炮, 加'表示普通植物
repeat:300           # 测试选卡数 (默认 300), 每个选卡总计 1000 只红眼
```

### 炮伤测试

```
scene:PE                # 场地, 六场地大小写皆可
protect:18 28 38 48 58  # 要保护的位置, 默认为炮, 加'表示普通植物
repeat:10000            # 测试波数 (默认 10000), 每波梯/丑/橄/篮各 5 只
```

### 刷新测试

```
scene:PE                # 场地, 六场地大小写皆可
require:红白             # 必出的僵尸类型, 可用中文单字或英文四字缩写
ban:foot zomb           # 禁出的僵尸类型
huge:false              # true 为旗帜波, false 为普通波
assume_activate:true    # true 为激活, false 为分离
dance:true              # true 为使用 dance cheat (测激活用 fast, 测分离用 slow), false 为不使用 
repeat:1000             # 测试选卡数 (默认 1000)
```
> 参考: [僵尸命名一览](https://forum.crescb.com/postid/5885/)

### 跳跳测试

```
scene:PE            # 场地, 六场地大小写皆可
protect:15 17       # 场上存在的植物, 默认为炮, 加'表示普通植物
                    # 只有列数会被用到, 无需提供多行
repeat:10000        # 测试波数 (默认 1000), 每波 1000 只跳跳
```

## 主要版本

### 1.5.0 - 2023/11/22

- 增加刷新测试功能

### 1.4.0 - 2023/10/21

- 增加跳跳测试功能

### 1.3.0 - 2023/10/20

- 增加炮伤测试功能

### 1.2.0 - 2023/10/10

- 增加对智能用垫的砸率测试支持

### 1.1.0 - 2023/10/10

- 增加砸率测试功能

### 1.0.0 - 2023/10/03

- 正式发布