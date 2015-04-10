browserify = require('browserify')
source = require('vinyl-source-stream')

gulp = require('gulp')

gulp.task 'browserify', ->
  browserify({
    entries: ["./coffee/iframe.coffee"]
    extensions: ['.coffee']
  })
    .bundle()
    .pipe(source('iframe.js'))
    .pipe(gulp.dest('./build/js'))

  browserify({
    entries: ["./coffee/client.coffee"]
    extensions: ['.coffee']
  })
    .bundle(standalone: 'Coupe')
    .pipe(source('client.js'))
    .pipe(gulp.dest('./'))

gulp.task 'tests', ->
  browserify({
    entries: ['./test/tests.coffee']
    extensions: ['.coffee']
  })
    .bundle()
    .pipe(source('tests.js'))
    .pipe(gulp.dest('./build/js'))

gulp.task 'html', ->
  gulp.src('./html/index.html')
    .pipe(gulp.dest('./build'))

gulp.task 'watch', ->
  gulp.watch './coffee/*', ['browserify']
  gulp.watch './**/*.coffee', ['tests']
  gulp.watch './html/index.html', ['html']

gulp.task 'build', ['browserify', 'html', 'tests']
gulp.task 'default', ['build', 'watch']
