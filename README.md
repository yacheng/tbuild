# tbuild

包括了一些常用的打包工具，java to nodejs

## 安装
    npm install tbuild

or

    git clone git://github.com/czy88840616/tbuild.git

## 包含的工具有
* ModuleComplier：KISSY ModuleComplier的nodejs版本
* EasyCombo：一个简单的合并文件工具

### ModuleComplier

*Example:*

    var ModuleComplier = require('tbuild').ModuleComplier;

    ModuleComplier.build({
        target:'/tc/cart',
        base:'D:\\project\\tradeface\\assets\\4.0',
        inputEncoding:'gbk',
        outputEncoding:'gbk',
        output:'D:\\project\\tradeface\\assets\\120324'
    });

*API:*

    ModuleComplier.build(cfg);

* cfg:{Object} 参数

    * base：{String} 需要打包的根目录，可以使用相对路径
    * target：{String} 基于根目录的入口目录
    * inputEncoding：{String} 输入文件编码，可选，默认GBK
    * outputEncoding：{String} 输出文件编码，可选，默认GBK
    * output：{String} 输出目录，可以使用相对路径
    * exclude：{Array} 黑名单正则数组，可选，默认不处理[/.combine.js/, /-min.js/]

### EasyCombo

*Example:*

    var EasyCombo = require('tbuild').EasyCombo;

    EasyCombo.build({
        base:'D:\\project\\tradeface\\assets\\4.0',
        outputBase:'D:\\project\\tradeface\\assets\\testbuild',
        output:'tc/cart/cart.combine.css',
        includes:[
            'tc/cart/cart.css',
            'tc/cart/order.css',
            'tc/cart/item.css'
        ]
    });

*API:*

    EasyComplier.build(cfg);

* cfg:{Object} 参数

    * base：{String} 需要打包的根目录，可以使用相对路径
    * outputBase：{String} 输出目录，可选，如果不填，那么output将以base作为根目录
    * output：{String} 输出文件，相对路径
    * includes: {Array} 基于base的等待打包文件列表
    * inputEncoding：{String} 输入文件编码，可选，默认GBK
    * outputEncoding：{String} 输出文件编码，可选，默认GBK

## License
tbulid 遵守 "MIT"：https://github.com/czy88840616/tbuild/blob/master/LICENSE.md 协议