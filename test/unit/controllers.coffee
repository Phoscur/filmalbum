describe 'FilmAlbum', ->
  should = chai.should()
  beforeEach module 'philms.services', 'fixtures'

  database = null
  $httpBackend = null
  beforeEach inject ($injector) ->
    database = $injector.get 'database'
    testDatabase = $injector.get 'testDatabase'
    $httpBackend = $injector.get '$httpBackend'
    $httpBackend.when('GET', '/films').respond testDatabase

  afterEach ->
    $httpBackend.verifyNoOutstandingExpectation()
    $httpBackend.verifyNoOutstandingRequest()

  describe 'database', ->
    it 'should have length 4', ->
      $httpBackend.expectGET('/films')
      films = database.getAll()
      $httpBackend.flush()
      films.should.have.length(4)

