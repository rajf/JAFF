'use strict';

(function(ns) {

    var _self = ns;

    ns.init = function(){
        console.log('module 2 init');
    };

    window.JAFF.events.on('pageReady', function () {
        _self.init();
    });

})(window.JAFF.overlay = window.JAFF.overlay || {});