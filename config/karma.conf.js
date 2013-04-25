basePath = '../';

files = [
  //JASMINE,
  //JASMINE_ADAPTER,
  MOCHA,
  MOCHA_ADAPTER,
  'app/lib/jquery.js',
  'app/lib/underscore.js',
  'app/lib/bootstrap.js',
  'app/lib/angular/angular.js',
  'app/lib/angular/angular-resource.js',
  //'test/lib/angular/angular-mocks.js',
  'lib/angular-1.1.2/angular-mocks.js',
  'node_modules/chai/chai.js',
  'app/partials/*.html',
  'app/js/**/*.js',
  'test/testDatabase.js',
  'test/unit/**/*.coffee'
];

preprocessors = {
  '**/*.coffee': 'coffee',
  '**/*.html': 'html2js'
};

autoWatch = true;

browsers = ['Chrome'];

