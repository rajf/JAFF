'use strict';

var gulp = require('gulp'),
    twig = require('twig'),
    marked = require('marked'),
    path = require('path'),
    fs = require('fs'),
    jsYaml = require('js-yaml'),
    plugins = require('gulp-load-plugins')({
        camelize: true,
        pattern: ['gulp-*', 'main-*'],
        DEBUG: false,
    });


/*
*   Config
*/
var config = {
    srcDir                  : 'app',
    tempDir                 : '.tmp',
    distDir                 : 'dist',
    twig   : {
        extension           :'.html.twig',
        cache               : false
    },
    serverPort              : 9000,
    concatModules           : true
};

config.globalYaml = config.srcDir + '/data/global.yaml';

config.paths = {

    styles: {
        src: [
            config.srcDir + '/styles/**/*.scss'
        ],
        dest: '/styles'
    },
    scripts: {
        src: [
            config.srcDir + '/scripts/**/*.js',
            config.srcDir + '/modules/**/*.js'
        ],
        dest: '/scripts'
    },
    images: {
        src: [
            config.srcDir + '/images/**/*'
        ],
        dest: '/images'
    },
    pages: {
        src: [
            config.srcDir + '/pages/**/*.yaml'
        ]
    },
    templates: {
        src: [
            config.srcDir + '/templates'
        ]
    },
    modules: {
        src: [
            config.srcDir + '/modules'
        ]
    },
    vendor: {
        src: [
            'bower.json', '.bowerrc'
        ],
        dest: '/vendor'
    }
};

/*
 *   Functions
 */
function fileExists(path){
    if(fs.existsSync(path)) {
        return true;
    }

    console.log('NOTICE: ' + path + ' not found.');
    return false;
}

/*
 *   Tasks
 */
gulp.task('clean', function () {
    var del = require('del');
    return del([
        config.tempDir,
        config.distDir
    ], {force:true});
});

gulp.task('legacyStyles', ['styles'], function () {
    gulp.src(config.tempDir + config.paths.styles.dest + '**/*.css')
        .pipe(plugins.noMediaQueries())
        .pipe(plugins.concat('ie.css'))
        .pipe(gulp.dest(config.tempDir + config.paths.styles.dest))
        .pipe(plugins.size())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('styles', function () {
    var processors = [
        require('autoprefixer')({
            browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4']
        }),
        //require('postcss-pxtorem')({
        //    root_value: 16,
        //    unit_precision: 5,
        //    prop_white_list: [],
        //    selector_black_list: ['border-radius', 'letter-spacing'],
        //    replace: false,
        //    media_query: true
        //}),
        //require('postcss-font-magician')({
        //    hosted: '../fonts'
        //}),
        //require('postcss-normalize'),
        require('postcss-color-rgba-fallback'),
        require('postcss-pseudoelements'),
        require('postcss-opacity'),
        require('css-mqpacker')
    ];

    return gulp.src('app/styles/main.scss')
        .pipe(plugins.sassGlobImport())
        .pipe(plugins.sass({
                style: 'expanded',
                precision: 10
            })
            .on('error', plugins.sass.logError))
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.postcss(processors))
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(config.tempDir + config.paths.styles.dest))
        .pipe(plugins.size());
});

gulp.task('scripts', function () {
    var modulesFilter = plugins.filter(['*', '!modules']);

    return gulp.src(config.paths.scripts.src)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter(require('jshint-stylish')))
        .pipe(plugins.if(!config.concatModules,modulesFilter))
        .pipe(plugins.concat('main.js'))
        .pipe(plugins.if(!config.concatModules,modulesFilter.restore()))
        .pipe(gulp.dest(config.tempDir + config.paths.scripts.dest))
        .pipe(plugins.size())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('modernizr', function() {
    gulp.src(config.paths.scripts.src)
        .pipe(plugins.modernizr({
            "options": [
                "setClasses",
                //"addTest",
                //"html5printshiv",
                //"testProp",
                //"fnBind"
            ],
            "tests": [
                //"setClasses",
                "flexbox",
                "csstransforms",
                //"flexboxlegacy"
                //"addTest",
                //"html5printshiv",
                //"testProp",
                //"fnBind"
            ]
        }))
        .pipe(plugins.uglify())
        .pipe(plugins.rename({suffix: '.min'}))
        .pipe(gulp.dest(config.distDir + config.paths.vendor.dest))
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('pages', function () {

    var wiredep = require('wiredep').stream;

    return gulp.src(config.paths.pages.src)
        .pipe(plugins.fn(function(file) {
            var jsonData = jsYaml.safeLoad(fs.readFileSync(file.path, 'utf-8')),
                twigOpts = {
                    path: config.paths.templates.src + '/' +jsonData.template,
                    async: false,
                    base: config.paths.templates.src,
                    namespaces: { 'modules': config.paths.modules.src }
                },
                template;

            // parse global yaml
            if (fileExists(config.globalYaml) && path.extname(config.globalYaml) == '.yaml')
                jsonData['global'] = jsYaml.safeLoad(fs.readFileSync(config.globalYaml, 'utf-8'));

            //console.log(jsonData);

            // load any imports
            // TODO: Refactor to handle nested imports
            for (var i in jsonData.imports) {
                var importFilePath = config.srcDir + '/' + jsonData.imports[i];
                // parse yaml
                if (fileExists(importFilePath) && path.extname(importFilePath) == '.yaml')
                    jsonData['imports'][i] = jsYaml.safeLoad(fs.readFileSync(importFilePath, 'utf-8'));

                // parse markdown
                if (fileExists(importFilePath) && path.extname(importFilePath) == '.md')
                    jsonData['imports'][i] = marked(fs.readFileSync(importFilePath, 'utf-8'));
            }

            twig.cache(config.twig.cache);
            template = twig.twig(twigOpts);

            file.contents = new Buffer(template.render(jsonData));
        }))
        .pipe(plugins.rename(function (path) {
            path.extname = ".html";
        }))
        .pipe(wiredep({
            directory: './bower_components',
            bowerJson: require('./bower.json'),
            ignorePath: /^\/|(\.\.\/){1,2}/
        }))
        .pipe(gulp.dest(config.tempDir))
        .pipe(plugins.size())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('images', function () {
    return gulp.src(config.paths.images.src)
        .pipe(plugins.cache(plugins.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(config.distDir + config.paths.images.dest))
        .pipe(plugins.size())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('bower', function() {

    var jsFilter = plugins.filter('**/*.js'),
        cssFilter = plugins.filter('**/*.css'),
        fontsFilter = plugins.filter('**/*.{eot,svg,ttf,woff}');

    return gulp.src(plugins.mainBowerFiles())
        .pipe(jsFilter)
        .pipe(plugins.concat('vendor.js'))
        .pipe(gulp.dest(config.tempDir + config.paths.vendor.dest))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe(plugins.concat('vendor.css'))
        .pipe(gulp.dest(config.tempDir + config.paths.vendor.dest))
        .pipe(cssFilter.restore())
        .pipe(fontsFilter)
        .pipe(plugins.flatten())
        .pipe(gulp.dest(config.distDir + '/fonts'))
        .pipe(fontsFilter.restore())
        .pipe(plugins.size())
        .on('error', function (error) {
            console.error('' + error);
        });
});

gulp.task('extras', function () {
    return gulp.src(['app/*.*', 'app/*.html'], { dot: true })
        .pipe(gulp.dest(config.distDir))
        .on('error', function (error) {
            console.error('' + error);
        });
});

//// inject bower components
//gulp.task('wiredep', function () {
//    var wiredep = require('wiredep').stream;
//
//    gulp.src('app/styles/*.scss')
//        .pipe(wiredep({
//            directory: 'bower_components'
//        }))
//        .pipe(gulp.dest('app/styles'));
//
//    gulp.src('app/**/*.' + config.twig.extension)
//        .pipe(wiredep({
//            directory: 'bower_components',
//            bowerJson: require('./bower.json')
//        }))
//        .pipe(gulp.dest('app'));
//});

gulp.task('serve', ['build'], function () {
    var browserSync = require('browser-sync').create();

    browserSync.init({
        port: config.serverPort,
        open: 'local',
        server: {
            baseDir: [
                config.tempDir,
                config.distDir,
                './'
            ]
        }
    });

    gulp.watch(config.srcDir + '/**/*' + config.twig.extension, ['pages']);
    gulp.watch(config.srcDir + '/**/*.yaml', ['pages']);
    gulp.watch(config.srcDir + '/**/*.md', ['pages']);
    gulp.watch(config.paths.styles.src, ['styles']);
    gulp.watch(config.paths.scripts.src, ['scripts']);
    gulp.watch(config.paths.images.src, ['images']);
    gulp.watch('./bower.json', ['pages']);

    gulp.watch([
            config.tempDir + '/**/*',
            config.distDir + '/**/*'
        ])
        .on("change", browserSync.reload)
        .on('error', function (error) {
            console.error('' + error);
        });

});

gulp.task('build', ['styles', 'scripts', 'modernizr', 'images', 'extras', 'pages', 'bower']);

gulp.task('minify', ['build'], function () {
    var jsFilter = plugins.filter('**/*.js'),
        cssFilter = plugins.filter('**/*.css'),
        htmlFilter = plugins.filter('**/*.html');

    var processors = [
        require('cssnano')
    ];

    return gulp.src(config.tempDir + '/**/*')
        .pipe(jsFilter)
        .pipe(plugins.uglify())
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.postcss(processors))
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(cssFilter.restore())
        .pipe(htmlFilter)
        .pipe(plugins.useref())
        .pipe(htmlFilter.restore())
        .pipe(gulp.dest(config.distDir))
        .pipe(plugins.size());
});

gulp.task('dist', ['clean'], function () {
    gulp.start('minify');
});

gulp.task('deploy', function() {
    return gulp.src(config.distDir + '/**/*')
        .pipe(plugins.ghPages());
});

gulp.task('default', ['clean'], function () {
    gulp.start('serve');
});