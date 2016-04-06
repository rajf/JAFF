'use strict';

(function(ns) {

    var _self = ns;

    ns.init = function(){
        console.log('sidebar');
    };

    window.JAFF.events.on('pageReady', function () {
        _self.init();
    });

})(window.JAFF.sidebar = window.JAFF.sidebar || {});