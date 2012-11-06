'use strict';

var Backbone = require("backbone");

console.log(JSON.stringify(Backbone));

var TestView = Backbone.View.extend({
  initialize: function() {
  },
  
  render: function() {
    this.$el.html("testview renders");
  }
});

module.exports = TestView;