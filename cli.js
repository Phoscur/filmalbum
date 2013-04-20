#!/usr/bin/env node
"use strict";

var defaultImport = 'filme.json';
var parallelLimit = 13;

var fs = require("fs")
  , readline = require("readline")
  , async = require("async")
  , _ = require("underscore")
  , getIMDbInformation = require('./scraper')
  , FilmDatabase = require("./FilmDatabase");
require("colors");

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
rl.on("close", function () {
  console.log("\nGoodbye!");
  process.exit(0);
});

function main() {
  if (argv.l) {
    database.on('add', function (film) {
      console.log("+ ", film.title, "(", film.year, film.quality, ")");
    });
  }
  if (fs.existsSync(defaultImport)) {
    database.importFromFile(defaultImport);
    console.log("Imported", database.size(), "films from default import:", defaultImport);
  } else if (!dbFile && !directories) {
    console.log(optimist.help());
    process.exit(1);
  }
  databaseImport(dbFile);

  if (argv.rename) {
    database.on('add', function (film) {
      rl.question('Rename file ' + film.name + " to " + film.filename() + "? (y/n): ", function (answer) {
        if (answer == "y") {
          film.rename();
          console.log('Film renamed!');
        }
      });
    });
  }

  scan(directories, function () {
    scrape(databaseExport);
  });
}


function databaseImport(dbFile) {
  if (dbFile) {
    database.importFromFile(dbFile);
    console.log("Imported", database.size(), "films from file", dbFile);
  }
}
/**
 * Ask for a filename to export the database
 * @param {Function} cb callback, will close readline and exit if omitted
 */
function databaseExport(cb) {
  rl.question("Do you want to export the database?\n Chose a filename or continue with Enter: ", function (answer) {
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
    async.parallelLimit(
      database.getAll(true).map(function (film) {
        return function (callback) {
          getIMDbInformation(film, function (error, film) {
            console.log("imdb info", error ? error : "retrieved", film.title, film.imdbUrl);
            callback(null, film);
          });
        };
      }),
      parallelLimit,
      function (error, films) {
        console.log(
          "scraping complete",
          films.filter(function (f) {
            return !!f.imdbUrl;
          }).length,
          "of",
          films.length,
          "with imdb url");
        cb();
      });
  } else {
    cb();
  }
}

function scan(directories, cb) {
  if (directories) {
    console.log("Reading directories", directories);
    database.scan(directories, function (database, films) {
      console.log("Finished Scan:", directories, "added", database.size(), "to database");
      cb();
    });
  } else {
    cb();
  }
}

main();