var fs = require('fs'),
    path = require('path'),
    fileUtil = require('./fileUtil'),
    iconv = require('iconv-lite');

var ModuleComplier = function() {

    var debug = false,
        exclude = [/.combine.js/, /-min.js/];

    var isExcludeFile = function(filename) {
        for (var idx in exclude) {
            if(exclude[idx].test(filename)) {
                return true;
            }
        }

        return false;
    };

    /**
     * 简单压缩
     * 去掉注释，压缩方式效仿YUIcompressor
     * by yacheng.sz @ 2012-5-16
     */
    var compressor = function(str){
    
        var totallen = str.length, token;
        
        // 去掉单行注释
        var startIndex = 0; 
        var endIndex = 0; 
        var comments = []; // 记录注释内容
        while ((startIndex = str.indexOf("//", startIndex)) >= 0) {
            endIndex = str.indexOf("\n", startIndex + 2);
            if (endIndex < 0) {
                endIndex = totallen;
            }
            token = str.slice(startIndex + 2, endIndex);
            comments.push(token);
            // str = str.slice(0, startIndex + 2) + "___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___" + css.slice(endIndex);
            startIndex += 2;
        }
        for (i=0,max=comments.length; i<max; i = i+1){
            str = str.replace("//" + comments[i] + "\n", "");
        }
        
        // 去掉多行注释
        startIndex = 0; 
        endIndex = 0; 
        comments = [];
        while ((startIndex = str.indexOf("/*", startIndex)) >= 0) {
            endIndex = str.indexOf("*/", startIndex + 2);
            if (endIndex < 0) {
                endIndex = totallen;
            }
            token = str.slice(startIndex + 2, endIndex);
            comments.push(token);
            // str = str.slice(0, startIndex + 2) + "___YUICSSMIN_PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___" + css.slice(endIndex);
            startIndex += 2;
        }
        for (i=0,max=comments.length; i<max; i = i+1){
            str = str.replace("/*" + comments[i] + "*/", "");
        }
        
        // 压缩空格
        str = str.replace(/\s+/g, " ");
        
        return str;
    };
    
    /**
     * 分析依赖
     */
    var analyzeDepends = function(target, base) {
        if(debug) {
            console.log('start analyze %s\r\n', target);
        }
        var caches = [];

        if(!path.existsSync(target)) {
            console.error('\'%s\' is not exists, ignore\r\n', target);
            return caches;
        }
        var text = fs.readFileSync(target).toString();

        // 去掉注释
        text = compressor(text);
        
        var requires = text.match(/{\s*requires[\s\S]*}/);

        if(!requires || !requires.length) {
            if(debug) {
                console.log('\'%s\' don\'t have depends, ignore\r\n', path.relative(base, target));
            }
            return caches;
        }
        //string to json
        requires = eval(requires[0]);

        if(debug) {
            console.log('find requires [%s]\r\n', requires);
        }

        var curDepends = analyzePath(base||__dirname, path.dirname(target) ,requires);

        // analyze depends of current file
        for (var idx in curDepends) {
            caches = caches.concat(analyzeDepends(curDepends[idx], base));
        }

        if(debug) {
            console.log('after find depends,result:[%s]\r\n', caches);
        }

        caches = caches.concat(curDepends);

        if(debug) {
            console.log('end analyze %s\r\n', target);
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
                //不存在后缀才add，或者已经是.js
                var ext = path.extname(current);
                if(!ext) {
                    current = current + '.js';
                }

                if(!ext || ext === '.js') {
                    if(path.existsSync(current)) {
                        c.push(current);
                    } else {
                        if(debug) {
                            console.log('\'%s\' ignore\r\n', require);
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
            '/*\r\n',
            'combined files : \r\n',
            '\r\n'
        ];

        for (var idx in files) {
            commentTpl.push(files[idx] + '\r\n');
        }

        commentTpl.push('*/\r\n');
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
            var content = iconv.decode(fs.readFileSync(f, cfg.inputEncoding), cfg.inputEncoding || 'gbk');

            //add module path
            var start = content.indexOf('KISSY.add(');
            if(start == -1) {
                start = content.indexOf('.add(');
                if(start != -1) {
                    start = start + 5;
                }
            } else {
                start = start + 10;
            }

            var end = content.indexOf('function', start);

            var relativefile = path.relative(cfg.base, f).replace(/\\/g, '\/'),
                basename = path.basename(relativefile, '.js'),
                dirname = path.dirname(relativefile);

            //find it
            if(start > -1 && end > start) {
                //KISSY.add(/*xxx*/function(xxx))
                content = content.replace(content.substring(start, end), '\'' + dirname + '/' +  basename + '\',');
            } else if(start > -1 && end == start) {
                //KISSY.add(function(xxx))
                content = [content.slice(0, start), '\'' + dirname + '/' +  basename + '\',', content.slice(end)].join('');
            }

            var buffer = iconv.encode(content, cfg.inputEncoding || 'gbk');
            fs.writeSync(fd, buffer, 0,buffer.length);
        }

        fs.closeSync(fd);

        //print console
        console.info('%s ===> %s', path.relative(cfg.base, target), combineFile);
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
            console.log('%s has %s depends to combine!\r\n', target, caches.length);
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

            if(cfg.exclude && cfg.exclude.length) {
                exclude = exclude.concat(cfg.exclude);
            }

            cfg.base = cfg.base || __dirname;

            var target = path.join(cfg.base, cfg.target);
            //处理目录
            if(fs.statSync(target).isDirectory()) {
                var targets = fs.readdirSync(target);
                for (var idx in targets) {
                    if(path.extname(targets[idx])==='.js' && !isExcludeFile(targets[idx])) {
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
