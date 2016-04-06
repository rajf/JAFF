'use strict';
var JAFF = JAFF ? JAFF : {};

(function(ns) {
    var $ = window.jQuery;

    ns.settings = {
        debug: true,
        $window: $(window),
        $html: $('html'),
        $body: $('body'),
        $htmlbody: $('html,body')
    };
})(window.JAFF = window.JAFF || {});