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

function exit(hard) {
  if (!hard) {
    databaseExport(function () {
      console.log("Goodbye!");
      process.exit(0);
    });
  }
  console.log("Goodbye!");
  process.exit(0);
}
function databaseExport(cb) {
  rl.question("Do you want to export the database? Chose a filename or hit Enter to exit", function (answer) {
    if (answer.length > 0) {
      database.export(answer);
      console.log("database exported");
    }
    cb();
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
  database.import(defaultImport);
} else if (!dbFile && !directories) {
  console.log(optimist.help());
  process.exit(1);
}


if (argv.list || !argv.rename) {
  database.on('newFilm', function (film) {
    console.log("+ ", film.title, "(", film.year, film.quality, ")");
  });
}

if (argv.rename) {
  database.on('newFilm', function (film) {
    rl.question('Rename file ' + film.name + " to " + film.getFilename() + "? (y/n)", function (answer) {
      if (answer == "y") {
        film.rename();
        console.log('Film renamed!');
      }
    });
  });
}

if (dbFile) {
  database.import(dbFile);
  console.log("Imported", database.getLength(), "films from file", dbFile);
}
if (directories) {
  database.scan(directories, function (database, films) {
    console.log("Scanned", directories, "added", database.getLength(), "to database");
    scrape(function () {
      exit();
    });
  });
} else {
  scrape(function () {
    exit();
  });
}