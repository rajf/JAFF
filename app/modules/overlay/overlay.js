'use strict';

(function(ns) {

    var _self = ns;

    ns.init = function(){
        console.log('overlay');
    };

    window.JAFF.events.on('pageReady', function () {
        _self.init();
    });

})(window.JAFF.overlay = window.JAFF.overlay || {});