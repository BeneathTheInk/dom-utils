module.exports = function(grunt) {
	
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: [ "dist/*.js" ],
		browserify: {
			main: {
				src: "lib/dom-utils.js",
				dest: "dist/dom-utils.js",
				options: {
					browserifyOptions: { debug: true, standalone: "DOMUtils" }
				}
			}
		},
		exorcise: {
			main: {
				src: "dist/dom-utils.js",
				dest: "dist/dom-utils.js.map"
			}
		},
		uglify: {
			dist: {
				src: "dist/dom-utils.js",
				dest: "dist/dom-utils.min.js"
			}
		},
		wrap2000: {
			main: {
				src: 'dist/dom-utils.js',
				dest: 'dist/dom-utils.js',
				options: {
					header: "/*\n * DOM Utilities\n * (c) 2014 Beneath the Ink, Inc.\n * MIT License\n * Version <%= pkg.version %>\n */\n"
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-wrap2000');
	grunt.loadNpmTasks('grunt-exorcise');

	grunt.registerTask('default', [ "clean", "browserify", "exorcise", "uglify", "wrap2000" ]);;

}