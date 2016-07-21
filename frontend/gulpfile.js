'use strict';

var gulp = require('gulp');
var path = require('path');
var RSBundler = require('@redsift/redsift-bundler');

var bundleConfig = require('./bundle.config.js');

gulp.task('bundle-js', RSBundler.loadTask(gulp, 'bundle-js', bundleConfig));
gulp.task('bundle-css', RSBundler.loadTask(gulp, 'bundle-css', bundleConfig));

gulp.task('build', ['bundle-js', 'bundle-css'], function(cb) {
  console.log('\n* Bundling complete:\n');
  RSBundler.printBundleSummary(bundleConfig);
});

gulp.task('serve', function() {
  gulp.watch(['./src/scripts/**/*.js'], ['bundle-js']);
  gulp.watch(['./src/styles/**/*.css', './src/styles/**/*.styl'], ['bundle-css']);
});

gulp.task('default', [ 'build', 'serve' ]);
