#!/usr/bin/env node
"use strict";

var defaultImport = 'filme.json';

var fs = require("fs")
  , readline = require("readline")
  , async = require("async")
  , _ = require("underscore")
  , getIMDbInformation = require('./scraper')
  , FilmDatabase = require("./FilmDatabase");

var optimist = require('optimist')
  , argv = optimist
    .usage('Manages Film Database, allows to rename films.\n'
      + 'Needs a JSON database file and or a list of directories to work\nUsage: $0')
    .alias('f', 'file')
    .describe('f', 'import json database file')
    .alias('d', 'directories')
    .describe('d', 'directories to scan for films\n(use -d parameter multiple times)')
    .alias('l', 'list')
    .boolean('l')
    .describe('l', 'list films')
    .alias('r', 'rename')
    .boolean('r')
    .describe('r', 'enables rename mode')
    .alias('s', 'scrape')
    .boolean('s')
    .describe('s', 'search corresponding imdb data')
    .argv
  ;
var dbFile = argv.file
  , directories = _.isArray(argv.directories) ? argv.directories : argv.directories ? [argv.directories] : null
  , database = new FilmDatabase();

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.on("close", function() {
  console.log("Goodbye!");
  process.exit(0);
});

/**
 * Ask for a filename to export the database
 * @param {Function} cb callback, will close readline and exit if omitted
 */
function databaseExport(cb) {
  rl.question("Do you want to export the database? Chose a filename: ", function (answer) {
    if (answer.length > 0) {
      try {
        database.exportFromFile(answer);
      } catch (e) {
        console.log("error", e);
        return databaseExport(cb); // retry
      }
      console.log("database exported");
    }
    if (!cb) {
      rl.close();
    } else {
      cb(answer);
    }
  });
}

function scrape(cb) {
  if (argv.scrape) {
    async.map(database.getAll(true).slice(0, 5), function (film, callback) {
      getIMDbInformation(film, function(error, film) {
        console.log("imdb info", error, film.title, film.imdbUrl);
        callback(null, film); // returning an error will stop the scraping
      });
    }, function (error, films) {
        console.log("scraping complete", films.length);
        cb();
    });
  } else {
    cb();
  }
}

if (fs.existsSync(defaultImport)) {
  database.importFromFile(defaultImport);
  console.log("Imported", database.size(), "films from default import:", defaultImport);
} else if (!dbFile && !directories) {
  console.log(optimist.help());
  process.exit(1);
}


database.on('newFilm', function (film) {
  console.log("+ ", film.title, "(", film.year, film.quality, ")");
});

if (argv.rename) {
  database.on('newFilm', function (film) {
    rl.question('Rename file ' + film.name + " to " + film.filename() + "? (y/n): ", function (answer) {
      if (answer == "y") {
        film.rename();
        console.log('Film renamed!');
      }
    });
  });
}

if (dbFile) {
  database.importFromFile(dbFile);
  console.log("Imported", database.size(), "films from file", dbFile);
}

function scan(directories, cb) {
  database.scan(directories, function (database, films) {
    console.log("Scanned", directories, "added", database.size(), "to database");
    cb();
  });
}

if (directories) {
  scan(directories, scrape(databaseExport))
} else {
  scrape(databaseExport);
}
