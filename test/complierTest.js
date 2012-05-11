var ModuleComplier = require('../lib/base').ModuleComplier;

ModuleComplier.build({
    target:'/tc/cart',
    base:'D:\\project\\tradeface\\assets\\4.0',
    debug: false,
    inputEncoding:'gbk',
    outputEncoding:'gbk',
    output:'D:\\testbuild'
});
