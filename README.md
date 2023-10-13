# Seml: Survival Endless Markup Langauge

Seml 是为 Plants vs. Zombies Survival Endless 定制的标记语言, 可用于描述波长, 用炮, 用垫等信息, 并内置了砸率测试等功能.

## 快速开始: 砸率测试

1. 下载本插件.
2. 新建 `.seml` 后缀文件, 输入以下内容:
```
# 测试 PE.垫材24 旧PDc解的砸率
scene:PE
protect:17 27 57 67  # 要保护的炮位
repeat:300           # 重复次数, 可以省略 (默认为 300)
thread:16            # 并行进程数, 可以省略 (默认为 CPU 核心数) 

w1 601
PP 225 25 9
C 539~619 1265 9

w2 601
PP 225 25 9 
DD +107 15 8.1875
C 539~619 1256 9

w3 601
PP 225 25 9
DD +107 15 8.1875
C 539~619 1256 9
```

3. 使用 `Ctrl + Shift + P` 呼出命令菜单, 键入 `测试砸率` 即可.


## 语法一览

### 波长

可提供多个用冰时机.

```
w1 1 300   # wave1 于 1 生效冰, 波长为300
```

### 用炮

使用一门或两门炮. 可用 B/D 代替 P 传递更精确的语义. 大小写均可.

```
P 318 2 9     # 318cs 生效炸 (2,9) 的炮
PP 318 25 9   # 318cs 生效炸 (2,9), (5,9) 的炮
D +220 1 7    # 延迟 220cs 生效
```


### 用垫

使用垫材. 大小写均可.

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
C_POS 446 1"2'56 9 choose:3 waves:12 # 1,2,5,6 路中选择 3 个红眼 x 最小的行垫
                                     # 只考虑 w1,w2 的红眼
                                     # 优先用花盆，其次优先用小喷
```

根据梯丑总数智能用垫. 如果省略 `choose`, 选择所有行. 如果省略 `wave`, 考虑所有波次的梯丑. 后缀按优先级排序, 与行数不绑定.

```
C_NUM 446 1256 9 choose:3 # 1,2,5,6 路中选择 3 个红眼 x 最小的行垫
                          # 只考虑 w1,w2 的红眼
```

### 循环与变量

在 `w` 后指定波次范围代表循环; 使用 `SET` 设定变量.

```
SET x 776        # 变量名不可为纯数字; 表达式可包含加减乘除括号与其它变量, 结果必须是数字 
w1~4 1 1672      # 以下语句重复 4 遍
C x~1292 1256 9
SET x x+24
```


## 设定测试参数

除上述表达操作的语句外, seml 也支持设定测试参数.

### 砸率测试

```
scene:PE             # 场地, 六场地大小写皆可
protect:17 27 57 67  # 要保护的位置, 默认为炮, 加'表示普通植物
repeat:1             # 重复次数, 可以省略 (默认为 300)
thread:16            # 并行进程数, 可以省略 (默认为 CPU 核心数) 
```

## 主要版本

### 1.2.0 - 2023/10/10

- 增加对智能用垫的砸率测试支持

### 1.1.0 - 2023/10/10

- 增加砸率测试功能

### 1.0.0 - 2023/10/03

- 正式发布