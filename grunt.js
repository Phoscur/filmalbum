'use strict';

module.exports = function(grunt) {
    
    grunt.loadNpmTasks('grunt-webpack');

    // Project configuration.
    grunt.initConfig({
        pkg : '<json:package.json>',
        test : {
            files : ['test/**/*.js']
        },
        lint : {
            files : ['grunt.js', 'app/**/*.js', 'cfg/**/*.js', 'test/**/*.js']
        },
        watch : {
            files : '<config:lint.files>',
            tasks : 'lint webpack'
        },
        less: {
            dev: {
                src: "./less/style.less",
                dest: "./static/style.generated.css"
            }
        },
        webpack: {
            dev: {
                src: "./app/browser.js",
                dest: "./static/game.generated.js"
            }
            
        },
        jshint : {
            options : {
                globalstrict : true,
    
                laxcomma : true,
                laxbreak : true,
                loopfunc: true,
                sub : true,
    
                node : true,
                browser : true,
    
                curly : true,
                eqeqeq : true,
                forin : false,
                undef : true,
                immed : true,
                latedef : true,
                newcap : true,
                noarg : true,
                nonew : true,
                trailing : true
                
                //boss: true,
                //eqnull: true,
            },
            globals : {
                jQuery: false
            }
        }
    });
    
    // Default task.
    grunt.registerTask('default', 'webpack lint watch');

};
