var fs = require('fs'),
    path = require('path');

var ModuleComplier = function() {

    /**
     * 分析依赖
     */
    var analyzeDepends = function(target, base) {
        var caches = [];

        if(!path.existsSync(target)) {
            console.log('\'%s\' is not exists, ignore\r', target);
            return;
        }
        var text = fs.readFileSync(target).toString();

        var requires = text.match(/{\s*requires[\s\S]*}/);

        if(!requires || !requires.length) {
            console.log('\'%s\' don\'t have depends, ignore\r', path.relative(base, target));
            return;
        }

        //string to json
        requires = eval(requires[0]);

//        console.log(requires);
        var curDepends = analyzePath(base||__dirname, path.dirname(target) ,requires);

        // analyze depends of current file
        for (var idx in curDepends) {
            caches = caches.concat(analyzeDepends(curDepends[idx], base));
        }

        caches = caches.concat(curDepends);

        return caches;
    };

    /**
     *
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
                        console.log('\'%s\' ignore\r', require);
                    }
                }
            }
        }

        return c;
    };

    var comboFiles = function(files){
        for (var dix in files) {
            var file = files[idx];

        }
    };
    /**
     * 打包单个文件
     * @param target
     * @param base
     */
    var buildOnce = function(target, base) {
        var caches = analyzeDepends(target, base);

        caches = noDuplicate(caches);

//        comboFiles(caches);
        console.log(caches.length);
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

            var target = path.join(cfg.base||__dirname, cfg.target);
            //处理目录
            if(fs.statSync(target).isDirectory()) {
                var targets = fs.readdirSync(target);
                for (var idx in targets) {
                    buildOnce(targets[idx], cfg.base||__dirname);
                }
            } else {
                buildOnce(target, cfg.base||__dirname);
            }

        }
    }
}();

ModuleComplier.build({
    target:'/tc/cart/cart.js',
    base:''
});

exports = ModuleComplier;
