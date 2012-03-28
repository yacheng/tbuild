/**
 * @fileoverview 通过combo的形式进行打包
 * @author czy88840616 <czy88840616@gmail.com>
 *
 */
var fs = require('fs'),
    path = require('path'),
    fileUtil = require('./fileUtil');

var EasyCombo = function() {

    var debug = false;

    var comboFiles = function(cfg){

        var commentTpl = [
            '/*\r\n',
            'combined files : \r\n',
            '\r\n'
        ],
        depends = cfg.includes || [];

        for (var idx in depends) {
            commentTpl.push(path.join(cfg.base, depends[idx]) + '\r\n');
        }

        commentTpl.push('*/\r\n');

        var combineFile = path.join(cfg.outputBase||cfg.base, cfg.output);
        //prepare output dir
        fileUtil.mkdirsSync(path.dirname(combineFile));

        if(debug) {
            console.log('waiting combined target file=%s', combineFile);
        }

        var fd = fs.openSync(combineFile, 'w');
        //write comment
        fs.writeSync(fd, commentTpl.join(''), 0, cfg.outputEncoding);
        fs.closeSync(fd);

        fd = fs.openSync(combineFile, 'a');

        //append depends
        for (var idx in depends) {
            var f = path.join(cfg.base, depends[idx]);
            if(debug) {
                console.log('comboing:%s', f);
            }
            var buffer = fs.readFileSync(f, cfg.inputEncoding);
            fs.writeSync(fd, buffer, 0,buffer.length, cfg.outputEncoding);
        }

        fs.closeSync(fd);
    };

    return {
        build:function(cfg) {

            debug = cfg.debug || debug;

            if(!cfg.base) {
                cfg.base = __dirname;
            } else {
                cfg.base = path.resolve(cfg.base);
            }

            if(!cfg.inputEncoding || cfg.inputEncoding == 'gbk' || cfg.inputEncoding == 'GBK' || cfg.inputEncoding == 'gb2312') {
                cfg.inputEncoding = '';
            }

            if(!cfg.outputEncoding || cfg.outputEncoding == 'gbk' || cfg.outputEncoding == 'GBK' || cfg.outputEncoding == 'gb2312') {
                cfg.outputEncoding = '';
            }

            comboFiles(cfg);

            console.info('[done]：output %s', path.join(cfg.outputBase||cfg.base, cfg.output));
        }
    }
}();

module.exports = EasyCombo;