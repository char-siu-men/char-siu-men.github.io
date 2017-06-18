'use strict';

var through = require('through2');
var path = require('path');
var File = require('vinyl');
var frontMatter = require('front-matter');
var gutil = require('gulp-util');
var fs = require('fs');
var ejs = require('ejs');
var marked = require('marked');
var moment = require('moment-timezone');
var config = require('../conf');

module.exports.archives = function(archiveName) {
  var archiveData = {
    posts: [],
    tags: [],
  };
  var lastFile;

  if (!archiveName) {
    throw new Error('a5-blog: Missing archiveName option');
  }

  function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    if (file.isStream()) {
      this.emit('error', new Error('a5-blog: Streaming not supported'));
      cb();
      return;
    }

    var page = myFrontMatter(file);
    archiveData.posts.push(page);
    lastFile = file;
    cb();
  }

  function endStream(cb) {
    var archiveFile = lastFile.clone({contents: false});
    archiveFile.path = path.join(lastFile.base, archiveName);
    archiveFile.contents = new Buffer(JSON.stringify(archiveData));
    this.push(archiveFile);
    cb();
  }

  return through.obj(bufferContents, endStream);
}

module.exports.posts = function(archiveData) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('a5-blog.post', 'Streaming not supported'));
      return;
    }

    var page = myFrontMatter(file);
    var url = permalink(page);

    file.path = path.join(file.base, url+'index.html');

    cb(null, file);
  });
}

module.exports.generateTagPage = function(archiveData) {
  if (!archiveData) {
    throw new Error('a5-blog.generateTagPage: Missing archiveData option');
  }

  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('a5-blog.generateTagPage', 'Streaming not supported'));
      return;
    }

    var data = buildEjsRenderData(archiveData, file);
    var base = file.base.replace(/tagname\/$/, '');

    Object.keys(data.site.tagMap).forEach((tag) => {
      var stag = data.site.tagMap[tag];
      var tagPage = Object.assign(data.page);
      tagPage.title = stag.tag;
      tagPage.posts = stag.posts;
      var tagPageFile = file.clone();
      tagPageFile.frontMatter = tagPage;
      tagPageFile.path = path.join(base, stag.tag+'/index.html');
      this.push(tagPageFile);
    });

    cb();
  });
}

module.exports.ejs = function(archiveData) {
  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('a5-blog.ejs', 'Streaming not supported'));
      return;
    }

    var data = buildEjsRenderData(archiveData, file);
    try {
      var content = ejs.render(file.contents.toString(), data);
      if (data.page.layout) {
        var layoutPath = __dirname + '/../../' + data.page.layout;
        data.filename = layoutPath;
        data.content = content;
        var template = fs.readFileSync(layoutPath, 'utf-8');
        file.contents = new Buffer(ejs.render(template, data));
      } else {
        file.contents = new Buffer(content);
      }
      this.push(file);
    } catch (err) {
      this.emit('error', new gutil.PluginError('a5-blog.ejs', err));
    }

    cb();
  });
}

module.exports.pageIndex = function(indexName) {
  var sitemapData = {
    pages: [],
  };

  if (!indexName) {
    throw new Error('a5-blog sitemap: Missing indexName option');
  }

  function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    if (file.isStream()) {
      this.emit('error', new Error('a5-blog: Streaming not supported'));
      cb();
      return;
    }

    var page = myFrontMatter(file);
    page.url = '/' + file.relative.replace(/\.(html\.ejs|md)$/, '.html');
    page.url = page.url.replace(/index\.html$/, '');

    sitemapData.pages.push(page)
    cb();
  }

  function endStream(cb) {
    var dataPath = indexName;
    var dataFile = new File({
      path: dataPath,
      contents: new Buffer(JSON.stringify(sitemapData))
    });
    this.push(dataFile);
    cb();
  }

  return through.obj(bufferContents, endStream);
}

function myFrontMatter(file) {
  var page = JSON.parse(JSON.stringify(file.frontMatter || {}));
  if (typeof page.layout === 'undefined') {
    throw new gutil.PluginError('a5-blog', '`layout` required');
  }
  page.basename = path.basename(file.path);
  return page;
}

function buildEjsRenderData(archiveData, file) {
  var page = myFrontMatter(file);
  var data = {
    site: config,
    page: page,
    post: page,
    filename: file.path,
      asset_path: function(path) {
        return path;
      },
      formatDate: function(date, format, timezone) {
        var d = moment(new Date(date));
        if (!timezone) {
          timezone = config.timezone;
        }
        d = d.tz(timezone);
        return d.format(format);
      }
  };
  if (!data.site.title) {
    data.site.title = data.site.name;
  }
  if (archiveData) {
    data.site.tagMap = [];
    data.site.posts = [];
    var stagId = 0;
    archiveData.posts.forEach((post) => {
      post.url = permalink(post);
      data.site.posts.push(post);
      post.tags.forEach((tag) => {
        var stag;
        if (!data.site.tagMap[tag]) {
          stag = {
            index: stagId++,
            tag: tag,
            posts: []
          };
          data.site.tagMap[tag] = stag;
        } else {
          stag = data.site.tagMap[tag];
        }
        stag.posts.push(post);
      });
    });
    if (archiveData.pages) {
      data.site.pages = [];
      archiveData.pages.forEach((page) => {
        if (page.sitemap == false) {
          return;
        }
        data.site.pages.push(page);
      });
    }
  }
  return data;
}

function permalink(post) {
  var patterns = {
    pretty: '/:categories/:year/:month/:day/:title/',
  };
  var categories = post.categories.split(/\s+/);
  for (var i=0; i < categories.length; i++) {
    categories[i] = encodeURIComponent(categories[i]);
  }
  categories = categories.join('/');
  var d = moment(new Date(post.date));
  var title = post.basename
                .replace(/[0-9]+-[0-9]+-[0-9]+-/, '')
                .replace(/\.(html|md|ejs)$/, '');
  if (!patterns[config.permalink]) {
    throw Error('not support permalink: '+config.permalink);
  }
  var pattern = patterns[config.permalink];
  var url = pattern
              .replace(/:categories/, categories)
              .replace(/:year/, d.format('YYYY'))
              .replace(/:month/, d.format('MM'))
              .replace(/:day/, d.format('DD'))
              .replace(/:title/, title)
              ;
  return url;
}
