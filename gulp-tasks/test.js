const gulp = require('gulp');

gulp.task('test', gulp.series(
    'build',
    'test-node',
    'test-integration',
    'lint',
));
