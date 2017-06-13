'use strict';
var yaml = require('js-yaml');
var ini = require('ini');
var fs = require('fs');
var extend = require('util')._extend;
var configFile = __dirname + '/../app/_config.yml';

var conf = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
conf = extend(conf, {
});

module.exports = conf;
