"use strict";

var fs = require("fs"),
    EventEmitter = require("events").EventEmitter,
    util = require("util"),
    async = require("async"),
    _ = require("underscore"),

    Film = require('./Film'),

    formatRegex = /^[a-zA-Z\.\- 0-9üöä]+ \([a-zA-Z\.\-\+, 0-9]+\)\.(mkv|m2ts|ts|mp4)$/,
    yearRegex = /((19|20)[0-9]{2})/, //\(?((19|20)[0-9][0-9])[^a-z0-9]?/
    blackListRegex = /^(Thumbs\.db|films\.js)$/,
    qualitiesRegex = /(720p|1080p|1080i|1920x800|1920x816|bdrip|dvdrip|xvid|divx)/i;

function FilmDatabase(films) {
  EventEmitter.call(this);
  this.films = films || {};
}

util.inherits(FilmDatabase, EventEmitter);

FilmDatabase.prototype.import = function(filename, overwrite) {
  var films = JSON.parse(fs.readFileSync(filename, "utf8"));
  _.forEach(films, function(film) {
    this.save(film, overwrite);
  }, this);
  return this;
};

FilmDatabase.prototype.export = function(filename) {
  fs.writeFileSync(filename, JSON.stringify(this.films));
};

/**
 * Asynchronously scans given directories for films and adds them to the database
 * @param {Array} directories
 * @param {Function} callbackWithDatabase async callback
 */
FilmDatabase.prototype.scan = function(directories, callbackWithDatabase) {
  var self = this;
  async.map(directories, function(dir, callback) {
    fs.readdir(dir, function(err, files) {
      if (err) {
        return callback(err);
      }
      callback(err, _.compact(files.map(function(fileName) {
        return fileName.match(blackListRegex)
          ? null
          : {name: fileName, dir: dir};
      })));
    });
  }, function (err, files) {
    if (!files) {
      console.log("Failed to read diretories", err);
      return callbackWithDatabase(self);
    }
    callbackWithDatabase(self, _.flatten(files).map(function(file) {
      self.analyse(file);
      self.save(file);
    }));
  });
  return this;
};

/**
 * Adds title, quality, year, wellformated, tags and format attributes to the file
 * @param file
 * @returns file with more attributes
 */
FilmDatabase.prototype.analyse = function(file) {
  var titleLength, tokens, title;
  if (file.name.match(formatRegex)) { // well formated can be recognised more easily
    file.title = file.name.split("(")[0].replace(qualitiesRegex, "").replace(yearRegex, "").trim();
    file.wellFormated = true;
  }
  // replace points between words with spaces
  tokens = file.name.replace(/([^\.])(\.|_)([^\.])/g, '$1 $3').split(" ");
  titleLength = tokens.length - 1; // title ends before first recognisable token
  tokens.forEach(function(token, i) {
    var known = false;
    token = token.replace(/\(|\[|\]|,|\)/g, "");
    if (token.match(qualitiesRegex)) {
      file.quality = token;
      known = true;
    } else if (token.match(yearRegex)) {
      file.year = token;
      known = true;
    }

    if (known && i < titleLength) {
      titleLength = i;
    }
  });
  title = tokens.splice(0, titleLength).join(" ").trim();
  if (!file.wellFormated) {
    file.title = title;
  }
  file.tags = tokens.splice(0, tokens.length-1).join(" ").replace(qualitiesRegex, "").replace(yearRegex, "").trim();
  file.format = tokens[0];
  if (!file.quality) {
    console.log("warning no quality found for", file.title); //, "using default", defaultQuality);
    //	file.quality = defaultQuality;
  }
  return file;
};


FilmDatabase.prototype.get = function(hash) {
  return this.films[hash];
};

/**
 * Saves file, creates film
 * Emits 'newFilm' events
 * @param {Object} file
 * @param {Boolean} [overwrite] optional force overwrite on hashcollision
 * @returns {Film}
 */
FilmDatabase.prototype.save = function(file, overwrite) {
  var film = new Film(file);
  if (!overwrite && this.get(film.getHash())) {
    throw new Error("hashcollision", film, this.get(film.getHash()));
  }
  this.films[film.getHash()] = film;
  this.emit('newFilm', film);
  return this;
};

FilmDatabase.prototype.getLength = function() {
  return Object.keys(this.films).length;
};


module.exports = FilmDatabase;