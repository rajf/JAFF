'use strict';

(function(ns) {

    var _self = ns;

    ns.init = function(){
        console.log('module 1 init');
    };

    window.JAFF.events.on('pageReady', function () {
        _self.init();
    });

})(window.JAFF.sidebar = window.JAFF.sidebar || {});