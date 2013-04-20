"use strict";
module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    simplemocha: {
      options: {
        require: ['should'],
        reporter: 'spec',
        ui: 'bdd',
        //timeout: 3000,
        ignoreLeaks: true
      },
      server: {
        src: "test/server.js"
      }
    },
    testacular: {
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
      files: ["*.js", "apps/*/app/**/*.js", "apps/*/test/**/*.js"],
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
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-testacular');
  grunt.loadNpmTasks('grunt-simple-mocha');

  grunt.registerTask('test', ['jshint', 'testacular']);

  grunt.registerTask('default', ['jshint', ]);
};