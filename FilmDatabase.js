"use strict";

var fs = require("fs")
  , EventEmitter = require("events").EventEmitter
  , util = require("util")
  , async = require("async")
  , _ = require("underscore")

  , Film = require('./Film')

  , formatRegex = /^[a-zA-Z\.\- 0-9üöä]+ \([a-zA-Z\.\-\+, 0-9]+\)\.(mkv|m2ts|ts|mp4)$/
  , yearRegex = /((19|20)[0-9]{2})/ //\(?((19|20)[0-9][0-9])[^a-z0-9]?/
  , blackListRegex = /^(Thumbs\.db|films\.js)$/
  , qualitiesRegex = /(720p|1080p|1080i|1920x800|1920x816|bdrip|dvdrip|xvid|divx)/i;

function FilmDatabase(films) {
  EventEmitter.call(this);
  this.films = films || {};
}

util.inherits(FilmDatabase, EventEmitter);

FilmDatabase.prototype.importFromFile = function (filename, overwrite) {
  var films = JSON.parse(fs.readFileSync(filename, "utf8"));
  _.forEach(films, function (film) {
    this.save(film, overwrite);
  }, this);
  return this;
};

FilmDatabase.prototype.exportFromFile = function (filename) {
  fs.writeFileSync(filename, JSON.stringify(this.films), "utf8");
  return this;
};

/**
 * Asynchronously scans given directories for films and adds them to the database
 * @param {Array} directories
 * @param {Function} callbackWithDatabase async callback
 */
FilmDatabase.prototype.scan = function (directories, callbackWithDatabase) {
  var self = this, allFiles = [];
  async.map(directories, function readDir(dir, callback) {
    fs.readdir(dir, function (err, files) {
      if (err) {
        return callback(err);
      }
      async.map(files, function (fileName, callback) {
        fs.stat(dir + '/' + fileName, function (err, stats) {
          if (err) {
            callback(err);
          }
          if (stats.isDirectory()) {
            readDir(dir + '/' + fileName, callback);
          } else {
            if (!fileName.match(blackListRegex)) {
              allFiles.push({name: fileName, dir: dir});
            }
            callback(null);
          }
        });
      }, function () {
        callback(null, allFiles);
      });
    });
  }, function (err, files) {
    var films;
    if (!files) {
      console.log("Failed to read directories", err);
      return callbackWithDatabase(self);
    }
    films = _.flatten(files).map(function (file) {
      return self.save(self.analyse(file));
    });
    self.emit('scanned', films);
    callbackWithDatabase(self, films);
  });
  return this;
};

/**
 * Adds title, quality, year, wellformated, tags and format attributes to the file
 * @param file
 * @returns file with more attributes
 */
FilmDatabase.prototype.analyse = function (file) {
  var titleLength, tokens, title;
  if (file.name.match(formatRegex)) { // well formated can be recognised more easily
    file.title = file.name.split("(")[0].replace(qualitiesRegex, "").replace(yearRegex, "").trim();
    file.wellFormated = true;
  }
  // replace points between words with spaces
  tokens = file.name.replace(/([^\.])(\.|_)([^\.])/g, '$1 $3').split(" ");
  titleLength = tokens.length - 1; // title ends before first recognisable token
  tokens.forEach(function (token, i) {
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
  file.tags = tokens.splice(0, tokens.length - 1).join(" ").replace(qualitiesRegex, "").replace(yearRegex, "").trim();
  file.format = tokens[0];
  if (!file.title) {
    console.log('warning title not recognised', file);
    file.title = file.name;
  }
  return file;
};


FilmDatabase.prototype.get = function (hash) {
  return this.films[hash];
}

/**
 * Return all entries
 * @param {Boolean} asArray
 * @returns {Array|Object} entries
 */
FilmDatabase.prototype.getAll = function (asArray) {
  return asArray ? _.toArray(this.films) : this.films;
};


/**
 * Saves file, creates film
 * Emits 'newFilm' events
 * @param {Object} file
 * @param {Boolean} [overwrite] optional force overwrite on hashcollision
 * @returns {Film}
 */
FilmDatabase.prototype.save = function (file, overwrite) {
  var film = new Film(file);
  if (!overwrite && this.get(film.hash())) {
    throw new Error("hashcollision[" + film.hash() + "]: " + film.name + " and " + this.get(film.hash()).name);
  }
  this.films[film.hash()] = film;
  this.emit('newFilm', film);
  return film;
};

FilmDatabase.prototype.size = function () {
  return Object.keys(this.films).length;
};


module.exports = FilmDatabase;