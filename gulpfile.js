var gulp     = require('gulp');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
 
var paths = {
  srcDir : '_assets/images',
  dstDir : '_site/assets'
}
 
gulp.task('imagemin', function() {
  var srcGlob = paths.srcDir + '/**/*.+(jpg|jpeg|png|gif|svg)';
  var dstGlob = paths.dstDir;
  var imageminOptions = [
    pngquant({
      quality: '60-80',
      speed: 1
    })
  ];
 
  gulp.src(srcGlob)
    .pipe(imagemin(imageminOptions))
    .pipe(gulp.dest(dstGlob));
});

gulp.task('watch', ['imagemin'], function(){
  gulp.watch(paths.srcDir, ['imagemin']);
});

gulp.task('default', ['imagemin']);

