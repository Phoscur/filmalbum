"use strict";

var fs = require("fs")
  ,	readline = require("readline")
  ,	async = require("async")
  ,	_ = require("underscore")

// config
  ,	directories = ['Q:/Films']
  ,	dbFile = "Q:/films.json"
  ,	renameFiles = true, askToRename = false && renameFiles
  ,	forceRename = false // against well formated
  ,	tabulaRasa = false


  , formatRegex = /^[a-zA-Z\.\- 0-9üöä]+ \([a-zA-Z\.\-\+, 0-9]+\)\.(mkv|m2ts|ts|mp4)$/
  , yearRegex = /((19|20)[0-9]{2})/ //\(?((19|20)[0-9][0-9])[^a-z0-9]?/
  ,	blackListRegex = /^(Thumbs\.db|films\.js)$/
  , qualitiesRegex = /(720p|1080p|1080i|1920x800|1920x816|bdrip|dvdrip|xvid|divx)/i
//,	defaultQuality = "1080p"

// global
,	films// hashmap: (title|getFilename) -> film
;

// e.g. The Big Lebowski (1998, 1080p, deutsch, englisch).mkv
// Watchmen – Die Wächter (2009, 1080p, 1920x800, deutsch+sub, englisch, Bluray.x264).mkv
// english+sub, german+sub
function filename(file) {
    if (!file.year && !file.quality) return file.title + "." + file.format;
	if (!file.year) return file.title + " " + file.quality + "." + file.format;
	if (file.year && !file.quality) return file.title + " (" + file.year + ")." + file.format;
	return file.title + " (" + file.year + ", " + file.quality + ")." + file.format;
}

function getFiles(directories, callback) {
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
        //console.log(files)
        if (err) {
            return callback(err);
        }
        callback(err, _.flatten(files).map(function(file) {
            //console.log(file)
            if (!forceRename && file.name.match(formatRegex)) {
                //console.log("well formated", file.name);
                file.title = file.name.split("(")[0].replace(qualitiesRegex, "").trim();
                file.wellFormated = true;
            } else {
                // replace points between words with spaces
                var tokens = file.name.replace(/([^\.])(\.|_)([^\.])/g, '$1 $3').split(" ");
                var titleLength = tokens.length-1; // title ends before first recognisable token
                tokens.forEach(function(token, i) {
                    
                    token = token.replace(/\(|\[|\]|,|\)/g, "");
                    var known = false;
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
                file.title = tokens.splice(0, titleLength).join(" ").trim();
                file.tags = tokens.splice(0, tokens.length-1);
                file.format = tokens[0];
                if (!file.title) { // title is key to the filmhashmap and cannot be empty
					console.log("warning empty title for", file.name, "using filename instead");
					file.title = file.name;
                }
                if (!file.quality) {
					console.log("warning no quality found for", file.title); //, "using default", defaultQuality);
				//	file.quality = defaultQuality;
                }
            }
            return file;
        }));
    });
}


module.exports = function getFilms(callbackWithFilms) {
getFiles(directories, function(err, files) {
	if (err) {
		return callbackWithFilms(err);
	}
	console.log("Found", files.length, "files");
	fs.readFile(dbFile, function(err, json) {
		if (err || tabulaRasa) {
			console.log("No database found or tabula rasa forced");
			films = {};
		} else {
			films = JSON.parse(json);
			if (files.length == Object.keys(films).length) {
				console.log("Database contains all films"); // unreachable?; Thumbs.db
				return callbackWithFilms(null, films);
			}
			console.log("Imported", Object.keys(films).length, "films from file database");
		}
		var rl = askToRename && readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		var stop = false;
		function addFilm (file, callback) {
			if (films[file.title]) {
				console.log("- Film already in database:", file.title);
				callback(null);
				//rl.pause();
			} else {
				console.log("+ New film file:", file.name);
				if (file.wellFormated) {
					console.log("File is already well formated, adding to database", file);
					films[file.title] = file;
					callback(file);
					return;
				}
				if (renameFiles && file.name != filename(file)) {
					if (askToRename) {
						rl.question("Add film to database and rename file to " + filename(file) + "?", function(answer) {
							switch (answer.toLowerCase()) {
								case "y":
								case "j":
								case "yes":
									file.oldName = file.name;
									fs.rename(file.dir + '/' + file.name, file.dir + '/' + filename(file), function(err) {
										if (err) {
											callback(err);
											return;
										}
										console.log("Renamed", file.oldName, "to", filename(file));
										file.name = filename(file);

										films[file.title] = file;
										console.log("added film to database");
										callback(file);
									});
									break;
								case "s":
								case "stop":
									stop = true;
									console.log("Stop to add films");
									callback(null);
									break;
								//case "n":
								//case "no":
								default:
									console.log("skipped", file.name, "not renaming to", filename(file));
									callback(null);
							}
						});
					} else {
						file.oldName = file.name;
						fs.rename(file.dir + '/' + file.name, file.dir + '/' + filename(file), function() {
							if (err) {
								callback(err);
								return;
							}
							console.log("Renamed", file.oldName, "to", filename(file));
							file.name = filename(file);

							films[file.title] = file;
							console.log("added film to database");
							callback(file);
						});
					}
				} else {
					console.log("added to database");
					films[file.title] = file;
					callback(file);
				}
						
			}
		}
		function save(cb) {
			fs.writeFile(dbFile, JSON.stringify(films), "utf8", function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Succesfully saved database");
				}
				cb && cb(err, films);
			});
		}
		(function loop() {
			if (stop || files.length === 0) {
				save(callbackWithFilms);
			} else {
				addFilm(files.shift(), loop);
			}
		}());
	});
});
};

