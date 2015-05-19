var browserify = require('browserify');
var del = require('del');
var gulp = require('gulp');
var gulpIf = require('gulp-if');
var gulpReplace = require('gulp-replace');
var gulpZip = require('gulp-zip');
var imagemin = require('gulp-imagemin');
var jsdoc = require("gulp-jsdoc");
var minifyCSS = require('gulp-minify-css');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');

gulp.task('default', ['app', 'assets']);

gulp.task('docs', function() {
    return gulp.src(["./src/app/**/*.js"])
        .pipe(jsdoc('./docs'));
});

gulp.task('dist', ['clean'], function() {
    runSequence(['appMinified', 'assets'], ['replaceApp', 'replaceManifest'], function() {
        return gulp.src('./build/**')
            .pipe(gulpZip('spidernotes.zip'))
            .pipe(gulp.dest('./dist/'));
    });
});

gulp.task('app', function() {
    return app(false);
});

gulp.task('appMinified', function() {
    return app(true);
});

gulp.task('assets', ['css', 'fonts', 'img', 'other']);

gulp.task('css', function() {
    return gulp.src('./src/assets/css/**/*.css')
        .pipe(minifyCSS())
        .pipe(gulp.dest('./build/assets/css/'));
});

gulp.task('fonts', function() {
    return gulp.src('./src/assets/fonts/**')
        .pipe(gulp.dest('./build/assets/fonts/'));
});

gulp.task('img', function() {
    return gulp.src('./src/assets/img/**')
        .pipe(imagemin())
        .pipe(gulp.dest('./build/assets/img'));
});

gulp.task('other', function() {
    return gulp.src('./src/*.{html,js,json}')
        .pipe(gulp.dest('./build/'));
});

gulp.task('clean', function(callback) {
    del(['./build/**'], callback);
});

gulp.task('replaceApp', function() {
    return gulp.src(['./build/app.js'])
        .pipe(gulpReplace('http://localhost:8080', 'https://spider-notes.appspot.com'))
        .pipe(gulp.dest('./build/'));
});

gulp.task('replaceManifest', function() {
    return gulp.src(['./build/manifest.json'])
        .pipe(gulpReplace('"http://localhost:8080/",', ''))
        .pipe(gulp.dest('./build/'));
});

function app(shouldMinify) {
    return browserify()
        .require('./src/app', { expose: 'app' })
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulpIf(shouldMinify, streamify(uglify())))
        .pipe(gulp.dest('./build/'));
}
