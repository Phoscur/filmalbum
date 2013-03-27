"use strict";
var fs = require("fs");
var express = require('express');
var getFilms = //require('./readfilms');
    function(cb) {
        fs.readFile()
    };
getFilms(function(err, films) {
//console.log(Object.keys(films));
if (err) {
	console.log(err);
	process.exit(1);
}
var app = express();

app.get('/films', function(req, res) {
	res.send(films);
});
app.get('/films/:id', function(req, res) {
	res.send(films[req.params.id]);
});
 
app.listen(3000);
console.log('Listening on port 3000...');

});