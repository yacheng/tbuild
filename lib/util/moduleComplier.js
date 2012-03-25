var fs = require('fs'),
    path = require('path'),
    fileUtil = require('./fileUtil');

var ModuleComplier = function() {

    var debug = false;

    /**
     * 分析依赖
     */
    var analyzeDepends = function(target, base) {
        if(debug) {
            console.log('start analyze %s\r', target);
        }
        var caches = [];

        if(!path.existsSync(target)) {
            console.log('\'%s\' is not exists, ignore\r', target);
            return caches;
        }
        var text = fs.readFileSync(target).toString();

        var requires = text.match(/{\s*requires[\s\S]*}/);

        if(!requires || !requires.length) {
            if(debug) {
                console.log('\'%s\' don\'t have depends, ignore\r', path.relative(base, target));
            }
            return caches;
        }
        //string to json
        requires = eval(requires[0]);

        if(debug) {
            console.log('find requires [%s]\r', requires);
        }

        var curDepends = analyzePath(base||__dirname, path.dirname(target) ,requires);

        // analyze depends of current file
        for (var idx in curDepends) {
            caches = caches.concat(analyzeDepends(curDepends[idx], base));
        }

        if(debug) {
            console.log('after find depends,result:[%s]\r', caches);
        }

        caches = caches.concat(curDepends);

        if(debug) {
            console.log('end analyze %s\r', target);
        }

        return caches;
    };

    /**
     * 分析路径
     * @param base 基本根目录，绝对路径起始
     * @param curPath 当前文件目录，相对路径起始
     * @param requires 当前文件依赖数组
     * @return {Array}
     */
    var analyzePath = function(base, curPath, requires) {
        var c = [];
        //absolute path && relative path
        for (var idx in requires) {
            var require = requires[idx];
            if(require) {
                var current;
                //相对路径处理
                if(require.match(/^\.{1,2}/)) {
                    current = path.normalize(path.join(curPath, require));
                } else {
                    //绝对路径处理
                    current = path.join(base, require);
                }
                //不存在后缀才add
                if(!path.extname(current)) {
                    if(path.existsSync(current + '.js')) {
                        c.push(current + '.js');
                    } else {
                        if(debug) {
                            console.log('\'%s\' ignore\r', require);
                        }
                    }
                }
            }
        }

        return c;
    };

    /**
     * 合并文件
     * @param target
     * @param files
     * @param cfg
     */
    var comboFiles = function(target, files, cfg){
        var commentTpl = [
            '/*\r',
            'combined files : \r',
            '\r'
        ];

        for (var idx in files) {
            commentTpl.push(files[idx] + '\r');
        }

        commentTpl.push('*/\r');
        var combineFile = path.join(cfg.output, path.relative(cfg.base, target)).replace('.js', '.combine.js');

        //prepare output dir
        fileUtil.mkdirsSync(path.dirname(combineFile));

        var fd = fs.openSync(combineFile, 'w');
        //write comment
        fs.writeSync(fd, commentTpl.join(''), 0, cfg.outputEncoding);
        fs.closeSync(fd);

        fd = fs.openSync(combineFile, 'a');
        //append depends
        for (var idx in files) {
            var f = files[idx];
            var buffer = fs.readFileSync(f, cfg.inputEncoding);
            fs.writeSync(fd, buffer, 0,buffer.length, cfg.outputEncoding);
        }

        fs.closeSync(fd);
    };
    /**
     * 打包单个文件
     * @param target
     * @param cfg
     */
    var buildOnce = function(target, cfg) {
        if(cfg.debug) {
            debug = cfg.debug;
        }
        var caches = analyzeDepends(target, cfg.base);
        caches = noDuplicate(caches);

        if(debug) {
            console.log('%s has %s depends to combine!\r', target, caches.length);
        }

        //add self
        caches.push(target);

        comboFiles(target, caches, cfg);

    };

    function noDuplicate(ar){
        var m,n=[],o= {};
        for (var i=0;(m= ar[i])!==undefined;i++)
        if (!o[m]){n.push(m);o[m]=true;}
        return n.sort(function(a,b){return a-b});
    }

    return {
        build: function(cfg){
            if(!cfg.target) {
                console.log('please enter an complier path\r\n');
                return;
            }

            if(!cfg.inputEncoding || cfg.inputEncoding == 'gbk' || cfg.inputEncoding == 'GBK' || cfg.inputEncoding == 'gb2312') {
                cfg.inputEncoding = '';
            }

            if(!cfg.outputEncoding || cfg.outputEncoding == 'gbk' || cfg.outputEncoding == 'GBK' || cfg.outputEncoding == 'gb2312') {
                cfg.outputEncoding = '';
            }

            if(cfg.base) {
                //防止相对路径
                cfg.base = path.resolve(cfg.base);
            }

            if(cfg.output) {
                //防止相对路径
                cfg.output = path.resolve(cfg.output);
            }

            cfg.base = cfg.base || __dirname;

            var target = path.join(cfg.base, cfg.target);
            //处理目录
            if(fs.statSync(target).isDirectory()) {
                var targets = fs.readdirSync(target);
                for (var idx in targets) {
                    if(targets[idx].indexOf('.js') != -1) {
                        buildOnce(path.join(target, targets[idx]), cfg);
                    }
                }
            } else {
                buildOnce(target, cfg);
            }

        }
    }
}();

module.exports = ModuleComplier;
