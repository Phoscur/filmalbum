

var fs = require("fs")
,   async = require("async")
,   _ = require("underscore")
,   colors = require("colors")

,   request = require("request")
,   domino = require("domino")
,   Zepto = require("zepto-node")

,   directories = ['F:/Filme', 'S:/Filme']
,   dbFile = "F:/filme.json"
,   formatRegex = /^[a-zA-Z\.\- 0-9üöä]+ \([a-zA-Z\.\-\+, 0-9]+\)\.(mkv|m2ts|ts|mp4)$/
,   yearRegex = /((19|20)[0-9]{2})/ //\(?((19|20)[0-9][0-9])[^a-z0-9]?/
,   qualitiesRegex = /\(?(720p|1080p|1080i|1920x800|1920x816)\)?,?/
,   uselessRegex = '\\[.+\\]|\\{.+\\}|\s{,2}|dvdrip|xvid|hdtv|extratorrentrg|dxva-xander|-chd|-hdchina|cinefile|amiable|sinners|deity|gesp|thewretched|metis|riprg|bluray|subs|release|bdrip|imbt|toxic3|5\\.1|hustle|noir|dmt|kln|lw|dvix|x264-[a-z]+|x264|brrip|gopo|btarena|mp3|dvdscr|srt|unrated|arigold|h264|aac|defaced|dvdr|divxnl-team|divx|nlt|orc|fxg|stv|axxo|dutch|amiable';

var knownFilms = {
    "indiana jones and the kingdom of the crystal skull": "http://www.imdb.com/title/tt0367882/"
};

function getFiles(callback) {
    async.map(directories, function(dir, callback) {
        fs.readdir(dir, function(err, files) {
            if (err) {
                console.log(err);
            }
            callback(err, files.map(function(fileName) {
                return {name: fileName, dir: dir};
            }));
        });
    }, function (err, files) {
        //console.log(files)
        if (err) {
            console.log(err);
        }
        callback(_.flatten(files).map(function(file) {
            //console.log(file)
            if (file.name.match(formatRegex)) {
                //console.log("well formated", file.name);
                file.title = file.name.split("(")[0].replace(qualitiesRegex, "").trim();
                file.wellFormated = true;
            } else {
                var tokens = file.name.replace(new RegExp(uselessRegex, 'gi'), '').replace(/\.|\-|_| {2,}/g, ' ').split(" ");
                var titleLenght = tokens.length-1;
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
                    
                    if (known && i < titleLenght) {
                        titleLenght = i;
                    }
                });
                file.title = tokens.splice(0, titleLenght).join(" ").trim();
            }
            return file;
        }));
    });
}


function getIMDbInformation(file, callback) {
    if (knownFilms[file.title.toLowerCase()]) {
        file.imdbUrl = knownFilms[file.title.toLowerCase()];
        request(knownFilms[file.title.toLowerCase()], function(error, response, body) {
            scrapeIMDbTitleSite(file, body);
            callback(null, file);
        });
        return;
    }
    request("http://www.imdb.com/find?s=tt&q=" + file.title, function(error, response, body) {
        //console.log("response", response)
        if (error) {
            return callback(error, file);
        }
        if (response.request.redirects.length > 0) { // search has been redirected
            file.imdbUrl = response.request.uri.href.split("?")[0];
            scrapeIMDbTitleSite(file, body);
            callback(null, file);
        } else {
            // crude splice of site body
            var window = domino.createWindow(body)//.split('<body bgcolor="#ffffff" text="#000000" id="styleguide-v2" class="fixed">')[1].split("</body>")[0])
            ,   $ = Zepto(window);
            var found = false;
            var titles = $("#main td a");
            $.each(titles, function(e) {
                var title = $(this);
                //console.log("t", title.text());
                if (title.text().trim().toLowerCase() == file.title.trim().toLowerCase()) { // exact match
                    file.imdbUrl = 'http://www.imdb.com' + title.attr("href");
                    return false;
                }
                if (titlesMatch(title.text(), file.title)) {
                    var year = title.parent().text().match(yearRegex);
                    if (file.year && year && year.indexOf(file.year) == -1) {
                        console.log("year didn't match", file.title, file.year, title.parent().text())
                        return true; // continue chose more precisely
                    }
                    file.imdbUrl = 'http://www.imdb.com' + title.attr("href");
                    found = true;
                }
                return !found;
            });
            
            
            if (file.imdbUrl) {
                request(file.imdbUrl, function(error, response, body) {
                    if (error) {
                        return callback(error, file);
                    }
                    scrapeIMDbTitleSite(file, body);
                    callback(null, file);
                });
            } else {
                console.log("couldn't find any matching title for ".yellow, file.title)
                callback(null, file);
            }
        }
    });
}


function titlesMatch(imdbTitle, fileTitle) {
    var match = true;
    fileTitle.toLowerCase().split(" ").forEach(function(token) {
        return match = match && imdbTitle.toLowerCase().indexOf(token) > -1;
    });
    //console.log(match, imdbTitle, fileTitle);
    return match;
}

function scrapeIMDbTitleSite(film, site) {
    var window, $;
    console.log("scraping", film.title, film.imdbUrl);
    //return;
    try {
        window = domino.createWindow(site);
        $ = Zepto(window);
    } catch (e) {
        console.log("failed", e);
        return;
    }
    var movieHead = $("h1.header").text()
        year = movieHead.match(yearRegex);
    if (year === null) {
        console.log("year", year, film.year, film.title)
        console.log("year not found", movieHead)
    } else 
    if (film.year && film.year != year[1]) {
        console.log("year doesn't match", film)
        return;
    } else if (film.year) {
        film.yearConfirmed = true;
    } else {
        film.year = year[1];
    }
    
    var href = $("#img_primary a").attr("href")
    request("http://www.imdb.com" + href, function(error, response, body) {
        console.log("getting cover", href, "for", film.title);
        if (error) {
            console.log("e", error);
            return;
        }
        var window = domino.createWindow(body)
        ,   $ = Zepto(window)
        ,   src = $("img#primary-img").attr("src");
        
        
        if (src) {
            request(src).pipe(fs.createWriteStream("F:/Covers/" + film.title + ".jpg"));
        } else {
            console.log("cover img not found", film.title, src);
        }
        
    });
}

// request("http://www.imdb.com/title/tt0367710/", function(error, response, body) {  
    // var window = domino.createWindow(body)
    // ,   $ = Zepto(window);
    // scrapeIMDbInformation({title: "Black Hawk Dawn"}, body);
// });
// getIMDbInformation({title: "Indiana Jones And The Kingdom Of The Crystal Skull"}, function(error, file) {
    // console.log(error, file);
// });
// 
// return;
getFiles(function(files) {
    //console.log(files)
    fs.readFile(dbFile, function(err, json) {
        var films;
        if (err) {
            console.log("no database found".red);
            console.log("importing ", files.length, "films from file names")
            films = files
        } else {
            films = JSON.parse(json);
            console.log("imported", films.length, "films from database")
        }
        
        var filmsWithoutIMDbInformation = films.filter(function(film) {
            return !film.imdbUrl;
        });
        var l = filmsWithoutIMDbInformation.length;
        
        console.log(("films with imdb url " + (films.length - l) / films.length * 100 + "%").green);
        async.map(films,//filmsWithoutIMDbInformation,
        getIMDbInformation,
        function(error, filmsWithNewInformation) {
            if (error) {
                console.log(error);
            } else {
                console.log("newly checked films", filmsWithNewInformation.length);
                fs.writeFile(dbFile, JSON.stringify(films), function(err) {
                    console.log("db save", err || "succesful".green);
                });
            }
        });
    });
});
