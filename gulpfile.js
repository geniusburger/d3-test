var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require("browser-sync").create();
var reload = browserSync.reload;

gulp.task('css', function() {
	return gulp.src('main.less')
		.pipe(less())
		.pipe(gulp.dest('./'))
		.pipe(reload({stream: true}));
});

gulp.task('reload', function() {
    return gulp.src('').pipe(reload({stream: true}));
});

gulp.task('serve', ['css'], function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
    gulp.watch(['main.less'], ['css']);
    gulp.watch(['index.html', 'main.js'], ['reload']);
});

gulp.task('default', ['serve']);