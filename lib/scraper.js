var fs = require("fs")
  , async = require("async")
  , _ = require("underscore")

  , request = require("request")
  , jsdom = require('jsdom')

  , yearRegex = /((19|20)[0-9]{2})/;

var coversDir = "./app/img/covers/";

var knownFilms = {
  "indiana jones and the kingdom of the crystal skull": "http://www.imdb.com/title/tt0367882/"
};

/**
 * Request url, strip it, init jsdom and jQuery
 * @param {String} url to scrape
 * @param {Function} callback(errors, window, uri, redirected)
 * @param {Number} cancel internal counter to abort after a number of retries
 */
function $request(url, callback, cancel) {
  if (cancel > 5) {
    return callback("aborted scraping " + url);
  }
  console.log("fired request at", url);
  request(url, function (error, response, site) {
    var body, window;
    if (error) {
      if (error.errno == "ECONNRESET" || error.errno == "ECONNABORTED") {
        if (!cancel) {
          cancel = 0;
        }
        console.log("request at", url, "failed, retrying...");
        return $request(url, callback, cancel++);
      }
      return callback(error);
    }
    if (!site) {
      return callback("site body not defined: " + url);
    }
    body = site
      .replace(/<head>.*<\/head>/, '')
      .replace(/<iframe.*<\/iframe>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '');
    //console.log(url, body);
    jsdom.env(
      body,
      ["http://code.jquery.com/jquery.js"],
      function (errors, window) {
        if (errors) {
          return callback(errors);
        }
        callback(
          null,
          window,
          response.request.uri.href.split("?")[0],
          response.request.redirects.length > 0
        );
      }
    );
  });
}

/**
 * With already known imdb url, scrape it
 * @param {Film} file
 * @param {Function) callback(error, film)
 */
function getIMDbInformationFor(file, callback) {
  $request(file.imdbUrl, function (error, window) {
    if (error) {
      return callback(error, file);
    }
    scrapeIMDbTitleSite(file, window.$);
    window.close();
    return getCover(file, callback);
  });
}
/**
 * Retrieve information from the internet movie database
 * @param {Film} file
 * @param {Function} callback(error, film)
 */
function getIMDbInformation(file, callback) {
  if (knownFilms[file.title.toLowerCase()]) {
    file.imdbUrl = knownFilms[file.title.toLowerCase()];
    $request(knownFilms[file.title.toLowerCase()], function (error, window) {
      if (error) {
        return callback(error, file);
      }
      scrapeIMDbTitleSite(file, window.$);
      window.close();
      callback(null, file);
    });
    return;
  }
  $request("http://www.imdb.com/find?s=tt&q=" + file.title, function (error, window, uri, redirected) {
    var $, urls = [];
    if (error) {
      return callback(error, file);
    }
    $ = window.jQuery;
    if (redirected) { // search has been redirected = HIT we already found the corresponding imdbfilm
      file.imdbUrl = uri;
      file.imdbRedirected = true;
      scrapeIMDbTitleSite(file, $);
      window.close();
      return callback(null, file);
    } else {
      var titles = $('a[href^="/title/tt"]');

      //console.log("titles", titles.length, titles.map( function(i) {return $(this).text(); }));
      titles.filter(function (e) {
        var title = $(this), url;
        //console.log("t", title.text());
        if (titlesMatch(title.text(), file.title)) {
          var year = title.parent().text().match(yearRegex);
          if (file.year && year && year.indexOf(file.year) == -1) {
            //console.log("year didn't match", file.title, file.year, title.parent().text())
            return false; // continue chose more precisely
          }
          url = 'http://www.imdb.com' + title.attr("href").split('?')[0];
          urls.push(url)
          file.imdbUrl = url;
          return true;
        }
        return false;
      });
      window.close();
      if (urls.length > 1) {
        console.log("got", urls.length, "possible imdb entries for", file.title, "y" + file.year);
        //delete file.imdbUrl;
        if (urls.length > 5) {
          file.imdbUrls = urls.slice(0, 5);
        } else {
          file.imdbUrls = urls;
        }
        //return callback(null, file);
        file.imdbUrl = urls[0];
      }
      if (file.imdbUrl) {
        getIMDbInformationFor(file, callback);
      } else {
        callback("couldn't find any matching title", file);
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

function getCover(film, callback) {
  var href = film.cover;
  if (!href) {
    return callback("no cover url for", film.title);
  }
  if (film.coverLoaded || fs.existsSync(coversDir + film.title + ".jpg")) {
    console.log('cover already existend', film.title);
    return callback(null, film);
  }
  film.cover = href = href.split('?')[0];
  $request("http://www.imdb.com" + href, function (error, window) {
    if (error) {
      return callback(error, film);
    }
    console.log("getting cover", href, "for", film.title);
    var src = window.$("img#primary-img").attr("src");
    window.close();


    if (src) {
      request(src).pipe(fs.createWriteStream(coversDir + film.title + ".jpg"))
        .on('close', function (error) {
          film.coverLoaded = true;
          callback(error, film);
        });
    } else {
      callback("cover img not found: " + src, film);
    }
  });
}
function scrapeIMDbTitleSite(film, $) {
  var movieHead, year;
  console.log("scraping", film.title, film.imdbUrl);
  movieHead = $("h1.header").text()
  year = movieHead.match(yearRegex);
  if (year === null) {
    console.log("year", year, film.year, film.title)
    console.log("year not found", movieHead)
  } else if (film.year && film.year != year[1]) {
    console.log("year doesn't match", film)
    delete film.imdbUrl;
    return;
  } else if (film.year) {
    film.yearConfirmed = true;
  } else {
    film.year = year[1];
  }
  film.genres = $('span[itemprop="genre"]').map(function () {
    return $(this).text();
  }).toArray();
  film.imdbRating = $('.star-box-giga-star :first').text().trim();

  film.cover = $("#img_primary a").attr("href");
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

getIMDbInformation.for = getIMDbInformationFor;
module.exports = getIMDbInformation;