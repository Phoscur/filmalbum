"use strict";

var fs = require("fs")
  ,	readline = require("readline")
  ,	async = require("async")
  ,	_ = require("underscore")
  , FilmDatabase = require("./FilmDatabase")

var argv = require('optimist')
    .usage('Manages Film Database, allows to rename films.\nUsage: $0')
    .alias('f', 'file')
    .describe('f', 'import database file')
    .alias('d', 'diretories')
    .describe('d', 'diretories to scan for films')
    .argv
  ;
var dbFile = argv.file
  , directories = _.isArray(argv.diretories) ? argv.diretories : argv.diretories ? [argv.diretories] : null
  , database = new FilmDatabase();

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (!dbFile && !argv.directories) {
  argv.showHelp();
  process.exit(0);
}

if (dbFile) {
  database.import(dbFile);
  console.log("Imported", database.getLength(), "films from file", dbFile);
}
if (diretories) {
  database.scan(directories, function(database, films) {
    console.log("Scanned", directories, "added", database.getLength(), "to database");
  });
}
