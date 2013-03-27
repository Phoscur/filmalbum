"use strict";

var fs = require("fs")
  ,	_ = require("underscore");

function Film(file) {
  _.extend(this, file);
}

Film.prototype.getHash = function() {
  return this.title;
};

Film.prototype.getFilename = function getFilename() {
  if (!this.year && !this.quality) return this.title + "." + this.format;
  if (!this.year) return this.title + " " + this.quality + "." + this.format;
  if (this.year && !this.quality) return this.title + " (" + this.year + ")." + this.format;
  return this.title + " (" + this.year + ", " + this.quality + ")." + this.format;
};

Film.prototype.rename = function() {
  this.oldname = this.name;
  fs.renameSync(this.dir + '/' + this.name, this.dir + '/' + this.getFilename());
  this.name = this.getFilename();
  this.wellformated = true;
};


module.exports = Film;