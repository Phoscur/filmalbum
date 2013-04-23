describe 'scraper', ->
  shouldExist = false
  rewire = require 'rewire'
  should = require('chai').should()
  getIMDbInformation = rewire '../lib/scraper'
  stream = require 'stream'
  getIMDbInformation.__set__
    fs:
      existsSync: ->
        shouldExist
      createWriteStream: (filename) ->
        new stream.Writable

  beforeEach ->
    shouldExist = true
  #currently not testing cover load yet

  describe 'gets information from a known url', ->
    it 'should create properties', (done) ->
      getIMDbInformation.for
        imdbUrl: "http://www.imdb.com/title/tt1478964/"
        name: "Attack.The.Block.2011.720p.mkv"
        dir: "F:/Filme"
        year: "2011"
        quality: "720p"
        title: "Attack The Block"
        tags: ["2011", "720p"]
        format: "mkv"
        yearConfirmed: true,
        cover: "/media/rm2458042112/tt1478964?ref_=tt_ov_i",
        (error, film) ->
          should.not.exist error
          film.should.be.ok
          film.should.have.property('genres').with.lengthOf 3
          film.should.have.a.property('imdbRating').that.is.a('string').and.eql '6.6'
          done()

