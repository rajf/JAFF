'use strict';

(function(ns) {

    //var $ = window.jquery;
    var  events = {};

    ns.on = function (eventName, fn) {
        events[eventName] = events[eventName] || [];
        events[eventName].push(fn);
    };

    ns.off = function (eventName, fn) {
        if (events[eventName]) {
            for (var i = 0; i < events[eventName].length; i++) {
                if (events[eventName][i] === fn) {
                    events[eventName].splice(i, 1);
                    break;
                }
            }
        }
    };

    ns.emit = function (eventName, data) {
        if (events[eventName]) {
            events[eventName].forEach(function (fn) {
                fn(data);
            });
        }
    };

    ns.pageLoaded = function () {
        window.JAFF.settings.$window.on('load', function() {
            ns.emit('pageReady');
        });
    };

})(window.JAFF.events = window.JAFF.events || {});

(function() {
    if(undefined !== window.JAFF){
        window.JAFF.events.pageLoaded();
    }
}());