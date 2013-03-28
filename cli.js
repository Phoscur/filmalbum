#!/usr/bin/env node
"use strict";

var fs = require("fs")
  , readline = require("readline")
  , async = require("async")
  , _ = require("underscore")
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
    .argv
  ;
var dbFile = argv.file
  , directories = _.isArray(argv.directories) ? argv.directories : argv.directories ? [argv.directories] : null
  , database = new FilmDatabase();

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function exit() {
  console.log("Database currently has", database.getLength(), "films stored. Quitting CLI...");
  process.exit(0);
}

if (!dbFile && !directories) {
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
    rl.question("Do you want to export the database? Chose a filename or hit Enter to exit", function (answer) {
      if (answer.length > 0) {
        database.export(answer);
      }
      exit();
    });
  });
} else exit();


