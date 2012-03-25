/**
 * @fileoverview 通过combo的形式进行打包
 * @author czy88840616 <czy88840616@gmail.com>
 *
 */
var SmartCombo = function() {
    return {
        build:function(cfg){
            cfg.split = cfg.split || '??';
            cfg.suffix = cfg.suffix || '.combine.css'
        }
    }
}();

module.exports = SmartCombo;