# tbuild

包括了一些常用的打包工具，java to nodejs

## 安装
    npm install tbuild

or

    git clone git://github.com/czy88840616/tbuild.git

## 包含的工具有
* KISSY ModuleComplier
* SmartCombo

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

    * base：需要打包的根目录，可以使用相对路径
    * target：基于根目录的入口目录
    * inputEncoding：输入文件编码，可选
    * outputEncoding：输出文件编码，可选
    * output：输出目录，可以使用相对路径
    * exclude：{Array} 黑名单正则数组，可选，默认不处理[/.combine.js/, /-min.js/]

### SmartCombo

## License
tbulid 遵守 "MIT"：https://github.com/czy88840616/tbuild/blob/master/LICENSE.md 协议