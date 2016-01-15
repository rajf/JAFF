'use strict';

var config = {
    siteURL     :   'http://jaff.dev:8001',
    srcDir      :   'app',
    distDir   :   'dist',
    twigExtension   : '.html.twig'
};

config.paths = {

    styles: {
        src: [
            config.srcDir + '/styles/**/*.scss'
        ],
        dest: config.distDir
    },
    scripts: {
        src: [
            config.srcDir + '/scripts/**/*.js'
        ],
        dest: config.distDir
    },
    templates: {
        src: [
            config.srcDir + '/templates/**/*.twig',
            '!**/partials/**'
        ]
    },
    data: {
        src: [
            config.srcDir + '/data'
        ]
    }
};

var gulp = require('gulp'),
    path = require('path'),
    fs = require('fs'),
    jsYaml = require('js-yaml');

// load plugins
var plugins = require('gulp-load-plugins')();

function fileExists(path){
    if(fs.existsSync(path)) {
        return true;
    }

    console.log('NOTICE: ' + path + ' not found.');
    return false;
}

gulp.task('styles', function () {
    return gulp.src('app/styles/main.scss')
        .pipe(plugins.sass({
            style: 'expanded',
            precision: 10
        }))
        .pipe(plugins.autoprefixer('last 1 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(plugins.size());
});

gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter(require('jshint-stylish')))
        .pipe(plugins.size());
});

gulp.task('twig', function () {
    return gulp.src(config.paths.templates.src)
        .pipe(plugins.data(function (file) {
                // Get yaml file path
                var yamlFile = config.paths.data.src + '/' + path.basename(file.path, config.twigExtension) + '.yaml';

                // Check file exists
                if(fileExists(yamlFile)) {
                    // convert yaml to json
                    var jsonData = jsYaml.safeLoad(fs.readFileSync(yamlFile, 'utf-8'));

                    // load any imports
                    for (var i in jsonData.imports) {
                        yamlFile = config.paths.data.src + '/' + jsonData.imports[i];
                        if (fileExists(yamlFile))
                            jsonData['imports'][i] = jsYaml.safeLoad(fs.readFileSync(yamlFile, 'utf-8'));
                    }
                    return jsonData;
                }
            })
            .on('error', function (e) {
                console.log(e);
            })
        )
        .pipe(plugins.twig({
            includes: [
                config.paths.templates.src
            ]
        }))
        .pipe(plugins.rename(function (path) {
            path.extname = "";
        }))
        .pipe(gulp.dest(config.distDir))
        .pipe(plugins.size());
});

gulp.task('html', ['twig', 'styles', 'scripts'], function () {
    var jsFilter = plugins.filter('**/*.js');
    var cssFilter = plugins.filter('**/*.css');

    return gulp.src('app/*.html')
        .pipe(plugins.useref.assets({searchPath: '{.tmp,app}'}))
        .pipe(jsFilter)
        .pipe(plugins.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe(plugins.csso())
        .pipe(cssFilter.restore())
        .pipe(plugins.useref.restore())
        .pipe(plugins.useref())
        .pipe(gulp.dest(config.distDir))
        .pipe(plugins.size());
});

gulp.task('images', function () {
    return gulp.src('app/images/**/*')
        .pipe(plugins.cache(plugins.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(config.distDir + '/images'))
        .pipe(plugins.size());
});

gulp.task('fonts', function () {
    return plugins.bowerFiles()
        .pipe(plugins.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe(plugins.flatten())
        .pipe(gulp.dest(config.distDir + '/fonts'))
        .pipe(plugins.size());
});

gulp.task('extras', function () {
    return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
        .pipe(gulp.dest(config.distDir));
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', config.distDir], { read: false }).pipe(plugins.clean());
});

gulp.task('build', ['html', 'images', 'fonts', 'extras']);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({ port: 35729 }))
        .use(connect.static('app'))
        .use(connect.static('.tmp'))
        .use(connect.directory('app'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});

gulp.task('serve', ['connect', 'styles'], function () {
    require('opn')('http://localhost:9000');
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;

    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components',
            exclude: ['bootstrap-sass-official']
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', ['connect', 'serve'], function () {
    var server = plugins.livereload();

    // watch for changes

    gulp.watch([
        'app/*.html',
        '.tmp/styles/**/*.css',
        'app/scripts/**/*.js',
        'app/images/**/*'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/images/**/*', ['images']);
    gulp.watch('bower.json', ['wiredep']);
});
