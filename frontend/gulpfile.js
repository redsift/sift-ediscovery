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

gulp.task('copy-html', function() {
  gulp.src(path.join('./src', '*.html'))
    .pipe(gulp.dest('./public'));
});

gulp.task('serve', function() {
  gulp.watch(['./src/scripts/**/*.js'], ['bundle-js']);
  gulp.watch(['./src/styles/**/*.css'], ['bundle-css']);
  gulp.watch(['./src/*.html'], ['copy-html']);
});

gulp.task('default', [ 'build', 'copy-html', 'serve' ]);
