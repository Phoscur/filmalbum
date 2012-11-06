'use strict';

var $ = require("jquery");
var TestView = require("./TestView");
var Backbone = require("backbone");
Backbone.setDomLibrary($);

$(function() {
    var v = new TestView({el:$("body")});
    v.render();
});