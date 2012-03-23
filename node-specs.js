var KISSY = require('KISSY');
var jasmine = require('jasmine-node');
require('./tc/core/core');

KISSY.config({
    packages: [
        {
            name: 'tc',
            path: __dirname.replace(/\\/g, '/'),
            charset: 'gbk'
        }
    ]
});

for (var key in jasmine) {
  global[key] = jasmine[key];
}

global.prepare = function(mods, fn) {
    beforeEach(function() {
        var ok = 0;
        KISSY.use(mods, function() {
            ok = 1;
            var that = this, args = [].slice.call(arguments);
            runs(function() {
                fn.apply(that, args);
            });
        });
        waitsFor(function() {
            return ok;
        }, mods + ' is not loaded.', 10000);
    });
};

var isVerbose = false;
var showColors = true;
process.argv.forEach(function(arg) {
  switch (arg) {
  case '--color': showColors = true; break;
  case '--noColor': showColors = false; break;
  case '--verbose': isVerbose = true; break;
  }
});

var getTestFile = function() {
    var c = process.argv[2];
    if (!c) return '/tc/mods/';

    if(c.indexOf('/') > -1) {
        return c;
    }

    if (c.indexOf('--folder') === -1) {
        return '/tc/mods/' + c;
    }
    else {
        return '/tc/' + c.split('=')[1];
    }
};

jasmine.executeSpecsInFolder(__dirname + getTestFile(), function(runner, log) {
    console.log('Running on: ' + __dirname + getTestFile());
    process.exit(runner.results().failedCount == 0 ? 0 : 1);
}, isVerbose, showColors, undefined, undefined, /^(?!.svn).*spec\.js$/, {});