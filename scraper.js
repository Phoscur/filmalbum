var fs = require("fs")
  , async = require("async")
  , _ = require("underscore")

  , request = require("request")
  , domino = require("domino")
  , Zepto = require("zepto-node")

  , yearRegex = /((19|20)[0-9]{2})/;

var coversDir = "./app/img/covers/";

var knownFilms = {
  "indiana jones and the kingdom of the crystal skull": "http://www.imdb.com/title/tt0367882/"
};

/**
 * Request url, strip it, init dom jQuery-esque Zepto
 * @param {String} url to scrape
 * @param {Function} callback{$, uri, redirected}
 */
function $request(url, callback) {
  request(url, function (error, response, body) {
    if (error) {
      console.log(error);
    }
    callback(
      Zepto(
        domino.createWindow(
          body.replace('</head>', '</head><body>').replace(/<script[\s\S]*?<\/script>/gi, '')
        )
      ),
      response.request.uri.href.split("?")[0],
      response.request.redirects.length > 0
    );
  });
}

/**
 * Retrieve information from the internet movie database
 * @param {Film} file
 * @param {Function} callback(film)
 */
function getIMDbInformation(file, callback) {
  if (knownFilms[file.title.toLowerCase()]) {
    file.imdbUrl = knownFilms[file.title.toLowerCase()];
    $request(knownFilms[file.title.toLowerCase()], function ($) {
      scrapeIMDbTitleSite(file, $);
      callback(file);
    });
    return;
  }
  $request("http://www.imdb.com/find?s=tt&q=" + file.title, function ($, uri, redirected) {
    if (redirected) { // search has been redirected = HIT we already found the corresponding imdbfilm
      file.imdbUrl = uri;
      scrapeIMDbTitleSite(file, $);
      callback(file);
    } else {
      var found = false;
      var titles = $("#main td a");
      $.each(titles, function (e) {
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
        request(file.imdbUrl, function (error, response, body) {
          if (error) {
            return callback(error, file);
          }
          scrapeIMDbTitleSite(file, body);
          callback(file);
        });
      } else {
        console.log("couldn't find any matching title for ".yellow, file.title)
        callback(file);
      }
    }
  });
}


function titlesMatch(imdbTitle, fileTitle) {
  var match = true;
  fileTitle.toLowerCase().split(" ").forEach(function (token) {
    return match = match && imdbTitle.toLowerCase().indexOf(token) > -1;
  });
  //console.log(match, imdbTitle, fileTitle);
  return match;
}

function scrapeIMDbTitleSite(film, $) {
  var movieHead;
  console.log("scraping", film.title, film.imdbUrl);
  movieHead = $("h1.header").text()
  year = movieHead.match(yearRegex);
  if (year === null) {
    console.log("year", year, film.year, film.title)
    console.log("year not found", movieHead)
  } else if (film.year && film.year != year[1]) {
    console.log("year doesn't match", film)
    return;
  } else if (film.year) {
    film.yearConfirmed = true;
  } else {
    film.year = year[1];
  }

  var href = $("#img_primary a").attr("href")
  $request("http://www.imdb.com" + href, function ($) {
    console.log("getting cover", href, "for", film.title);
    var src = $("img#primary-img").attr("src");

    if (src) {
      request(src).pipe(fs.createWriteStream(coversDir + film.title + ".jpg"));
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


module.exports = getIMDbInformation;