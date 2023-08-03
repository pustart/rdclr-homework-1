import sync from 'browser-sync';
import del from 'del';
import gulp from 'gulp';
import fileInclude from 'gulp-file-include';
import gulpIf from 'gulp-if';
import plumber from 'gulp-plumber';

import removeHtml from 'gulp-remove-html';
import pug from 'gulp-pug';
import htmlMin from 'gulp-htmlmin';
import fonter from 'gulp-fonter';
import ttf2woff2 from 'gulp-ttf2woff2';

import dartSass from 'sass';
import gulpSass from 'gulp-sass';

import imagemin from 'gulp-imagemin';
import webp from 'gulp-webp';
import postCss from 'gulp-postcss';
import groupMedia from 'gulp-group-css-media-queries';
import autoprefixer from 'autoprefixer';
import minmax from 'postcss-media-minmax';

let isBuildFlag = false;
const sass = gulpSass(dartSass);
const projectFolder = 'prod';
const sourceFolder = 'src';
const paths = {
  build: {
    html: projectFolder + '/',
    css: projectFolder + '/styles/',
    img: projectFolder + '/public/',
    fonts: projectFolder + '/fonts/',
  },

  src: {
    html: sourceFolder + '/*.html',
    pug: sourceFolder + '/*.pug',
    css: sourceFolder + '/styles/*.{scss,css}',
    img: sourceFolder + '/public/**/*.{jpg,jpeg,png,gif,ico,webp,svg}',
    fonts: sourceFolder + '/fonts/*.{ttf,eot,otf,ttc,woff,woff2}',
  },

  watch: {
    html: sourceFolder + '/**/*.html',
    pug: sourceFolder + '/**/*.pug',
    css: sourceFolder + '/styles/**/*.{scss,css}',
    img: sourceFolder + '/public/**/*.{jpg,jpeg,png,gif,ico,webp,svg}',
  },

  clean: './' + projectFolder + '/**/*'
};

export const browserSync = () => {
  sync.init({
    ui: false,
    notify: false,
    open: false,
    browser: 'chrome',
    server: {
      baseDir: './' + projectFolder + '/'
    },
  });
};

export const html = () => {
  return gulp.src(paths.src.pug)
    .pipe(plumber())
    .pipe(pug({
      verbose: true,
    }))
    .pipe(gulp.dest(paths.build.html))
    .pipe(gulp.src(paths.src.html))
    .pipe(plumber())
    .pipe(fileInclude())
    .pipe(gulpIf(isBuildFlag, removeHtml()))
    .pipe(gulpIf(isBuildFlag, htmlMin({
      removeComments: true,
    })))
    .pipe(gulp.dest(paths.build.html))
    .pipe(sync.stream());
};

export const css = () => {
  return gulp.src(paths.src.css, { sourcemaps: !isBuildFlag })
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }))
    .pipe(postCss([
      autoprefixer,
      minmax,
    ]))
    .pipe(groupMedia())
    .pipe(gulp.dest(paths.build.css, { sourcemaps: !isBuildFlag }))
    .pipe(sync.stream());
};

export const images = () => {
  return gulp.src(paths.src.img)
    .pipe(plumber())
    .pipe(webp())
    .pipe(gulp.dest(paths.build.img))
    .pipe(gulp.src(paths.src.img))
    .pipe(gulpIf(isBuildFlag, imagemin({
      progressive: true,
      verbose: true,
      optimizationLevel: 3
    })))
    .pipe(gulp.dest(paths.build.img));
};

const fonts = () => {
  return gulp.src(paths.src.fonts)
    .pipe(plumber())
    .pipe(fonter({
      formats: ['ttf', 'woff']
    }))
    .pipe(gulp.dest(paths.build.fonts))
    .pipe(ttf2woff2())
    .pipe(gulp.dest(paths.build.fonts));
};

export const clean = () => {
  return del([paths.clean, `!./${projectFolder}/fonts/**`]);
};

export const cleanFonts = () => {
  return del(paths.build.fonts);
};

const setMode = (isBuild) => {
  return cb => {
    isBuildFlag = isBuild;
    cb();
  };
};

export const watchFiles = () => {
  gulp.watch([paths.watch.html], html);
  gulp.watch([paths.watch.pug], pug);
  gulp.watch([paths.watch.css], css);
  gulp.watch([paths.watch.img], images);
};

const watch = gulp.parallel(
  watchFiles,
  browserSync);

const dev = gulp.parallel(
  css,
  html,
  images);

export const build = gulp.series(
  clean,
  setMode(true),
  dev,
);

export default gulp.series(
  clean,
  dev,
  watch,
);

export const fnts = gulp.series(cleanFonts, fonts);
