var gulp      = require('gulp');
var spawn     = require('child_process').spawn;
var webserver = require('gulp-webserver');
var notifier  = require('node-notifier');
var imagemin  = require('gulp-imagemin');
var pngquant  = require('imagemin-pngquant');
 
// setting
var SERVER_PORT = 4000;
var SERVER_ROOT = '_site/'

var paths = {
  imageDstDir : '_site/assets',
  imageSrc : [
    '_assets/images/**/*.+(jpg|jpeg|png|gif|svg)',
    '!_site/**/*'
  ],
  jekyllSrc : [
    '**/*.html',
    '**/*.md',
    '**/*.xml',
    '_assets/stylesheets/**/*.scss',
    '_assets/stylesheets/**/*.css',
    '_assets/javascripts/**/.js',
    '!_site/**/*'
  ]
};

var Logger = function() {
  var logger = function() {
  };

  var _log = function(message) {
    console.log(message);
  };

  var _notify = function(title, message) {
    notifier.notify({
      title: title,
      message: message
    });
  };

  logger.prototype = {
    log : _log,
    notify : _notify
  };
  return logger;
}();

// jekyll build task
gulp.task('jekyll', function () {
    var jekyll = spawn('jekyll', ['build', '--incremental']);
    var logger = new Logger();

    jekyll.stderr.on('data', function(data) {
        logger.log("" + data);
        logger.notify('Build Error', data);
    });

    jekyll.on('exit', function (code) {
        var message = code ? 'error' : 'success'
        logger.log('Finished Jekyll Build : ' + message);
    });
});

// static server task
gulp.task('serve', function() {
  gulp.src(SERVER_ROOT)
    .pipe(webserver({
      host: '0.0.0.0',
      livereload: true,
      open: true,
      port: SERVER_PORT
    }));
});

gulp.task('imagemin', function() {
  var srcGlob = paths.imageSrc;
  var dstGlob = paths.imageDstDir;
  var imageminOptions = [
    pngquant({
      quality: '60',
      speed: 1
    })
  ];
 
  gulp.src(srcGlob)
    .pipe(imagemin(imageminOptions))
    .pipe(gulp.dest(dstGlob));
});

// jekyll build, when a file is changed.
gulp.task('watch', ['jekyll', 'imagemin', 'serve'], function () {
    gulp.watch(paths.jekyllSrc, {interval: 1000}, ['jekyll']);
    gulp.watch(paths.imageSrc, {interval: 1000}, ['imagemin']);
})

gulp.task('default', ['jekyll', 'imagemin']);

