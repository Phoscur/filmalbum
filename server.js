"use strict";
var fs = require("fs");
var express = require("express");
var FilmDatabase = require("./lib/FilmDatabase");

var app = express();
var database = new FilmDatabase();

database.importFromFile("filme.json");

console.log("Database composes", database.size(), "films");

app.use(express.logger());
app.use(express.directory('./app'));
app.use(express['static']('./app'));

app.get('/films', function (req, res) {
  res.send(database.getAll(true));
});
app.get('/film/:id', function (req, res) {
  res.send(database.get(req.params.id));
});

app.listen(8000);
console.log('Listening on port 8000...');
