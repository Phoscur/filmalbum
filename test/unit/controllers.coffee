describe 'FilmAlbum', ->
  should = chai.should()
  beforeEach module 'philms.controllers', 'fixtures'

  database = null
  film =
    id: 'Movie'
    title: 'Superb Movie'
  scope = null
  $httpBackend = null
  beforeEach inject ($injector) ->
    database = $injector.get 'database'
    testDatabase = $injector.get 'testDatabase'
    $httpBackend = $injector.get '$httpBackend'
    $httpBackend.when('GET', '/films').respond testDatabase
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    scope = $rootScope.$new();
    $httpBackend.expectGET('/film/' + film.id).respond(film)
    controller = $controller 'FilmCtrl',
      $scope: scope
      $routeparams:
        filmID: film.id
      database: database
    $httpBackend.flush()

  afterEach ->
    $httpBackend.verifyNoOutstandingExpectation()
    $httpBackend.verifyNoOutstandingRequest()

  describe 'database', ->
    it 'should have length 4', ->
      $httpBackend.expectGET('/films')
      films = database.getAll()
      $httpBackend.flush()
      films.should.have.length(4)

  describe 'FilmCtrl', ->
    it 'should set a film on the scope', ->
      scope.should.have.a.property('film').with.property('title').and.eql 'Superb Movie'
