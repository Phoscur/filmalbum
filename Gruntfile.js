"use strict";
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    simplemocha: {
      options: {
        reporter: 'spec',
        ui: 'bdd',
        timeout: 5000,
        ignoreLeaks: false
      },
      scraper: {
        src: "test/scraperTest.coffee"
      },
      server: {
        src: "test/server.js"
      }
    },
    karma: {
      unit: {
        options: {
          configFile: 'config/karma.conf.js',
          keepalive: true
        }
      },
      e2e: {
        options: {
          configFile: 'config/karma-e2e.conf.js',
          keepalive: true
        }
      }
    },
    jshint: {
      files: ["*.js", "app/js/**/*.js"],
      options: {
        /*jslint node: true, indent: 2, nomen: true, es5: true, vars: true */
        indent: 2,
        es5: true,
        //nomen: true, jshint: "why would you need it"
        //vars: true, removed in jshint

        globalstrict: true,

        laxcomma: true,
        laxbreak: true,
        loopfunc: true,
        sub: true,

        node: true,
        browser: true,

        curly: true,
        eqeqeq: true,
        forin: false,
        undef: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        nonew: true,
        trailing: true,

        //boss: true,
        //eqnull: true,

        globals: {
          jQuery: true,
          mocha: true,
          chai: true,
          angular: true,
          browser: true,

          // mocha
          after: true,
          afterEach: true,
          before: true,
          beforeEach: true,
          binding: true,
          describe: true,
          element: true,
          expect: true,
          input: true,
          it: true,
          pause: true,
          repeater: true,
          select: true,
          sleep: true,
          using: true
        }
      }
    },
    watch: {
      files: ['**/*.js'],
      tasks: ['jshint', 'simplemocha'],
      options: {
        interval: 1000
      }
    },
    regarde: {
      livereload: {
        files: ['app/**/*.*'],
        tasks: ['livereload']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.registerTask('test', ['jshint', 'karma']);
  grunt.registerTask('live', ['livereload-start', 'regarde']);

  grunt.registerTask('default', ['jshint', 'simplemocha:scraper']);
};