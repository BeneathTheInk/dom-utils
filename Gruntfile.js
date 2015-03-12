module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: [ "dist/*.js" ],
		browserify: {
			dist: {
				src: "index.js",
				dest: "dist/dom-utils.js",
				options: {
					browserifyOptions: { standalone: "DOMUtils" }
				}
			},
			dev: {
				src: "index.js",
				dest: "dist/dom-utils.dev.js",
				options: {
					browserifyOptions: { debug: true, standalone: "DOMUtils" }
				}
			},
			test: {
				src: "test/*.js",
				dest: "dist/dom-utils.test.js",
				options: {
					browserifyOptions: { debug: true }
				}
			}
		},
		wrap2000: {
			dist: {
				src: 'dist/dom-utils.js',
				dest: 'dist/dom-utils.js',
				options: {
					header: "/*\n * DOM Utilities\n * (c) 2014-2015 Beneath the Ink, Inc.\n * MIT License\n * Version <%= pkg.version %>\n */\n"
				}
			},
			dev: {
				src: 'dist/dom-utils.dev.js',
				dest: 'dist/dom-utils.dev.js',
				options: {
					header: "/*\n * DOM Utilities (with Source Map)\n * (c) 2014-2015 Beneath the Ink, Inc.\n * MIT License\n * Version <%= pkg.version %>\n */\n"
				}
			},
			test: {
				src: 'dist/dom-utils.test.js',
				dest: 'dist/dom-utils.test.js',
				options: {
					header: "/*\n * DOM Utilities\n * (c) 2014-2015 Beneath the Ink, Inc.\n * MIT License\n * Version <%= pkg.version %>\n */\n"
				}
			}
		},
		uglify: {
			dist: {
				src: "dist/dom-utils.js",
				dest: "dist/dom-utils.min.js"
			}
		},
		watch: {
			test: {
				files: [ "src/**/*.js", "test/*.js" ],
				tasks: [ 'test' ],
				options: { spawn: false }
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-wrap2000');

	grunt.registerTask('build-dev', [ 'browserify:dev', 'wrap2000:dev' ]);
	grunt.registerTask('build-test', [ 'browserify:test', 'wrap2000:test' ]);
	grunt.registerTask('build-dist', [ 'browserify:dist', 'wrap2000:dist', 'uglify:dist' ]);

	grunt.registerTask('dev', [ 'clean', 'build-dev' ]);
	grunt.registerTask('test', [ 'clean', 'build-test' ]);
	grunt.registerTask('dist', [ 'clean', 'build-dist' ]);

	grunt.registerTask('default', [ 'clean', 'build-dist', 'build-dev' ]);

}