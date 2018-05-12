const request = require('request');
const cheerio = require('cheerio');
const mustache = require('mustache');
const util = require('util');
const fs = require('fs');
const moment = require('moment-timezone');

const ssurl = 'https://fast.ishadowx.net'
const nodes = ['usa', 'usb', 'usc', 'jpa', 'jpb',
              'jpc', 'sga', 'sgb', 'sgc']

class Shadowsocks {
  constructor(method, password, hostname, port) {
    this.method = method;
    this.password = password;
    this.hostname = hostname;
    this.port = port;
  }

  encodess() {
    var url = this.method + ":" + this.password + '@' + this.hostname + ':' + this.port;
    return 'ss://' + Buffer.from(url).toString('base64');
  }

  encodehtml() {
    var s = this.encodess();
    return util.format('<a href="%s">%s</a>', s, s);
  }

  encodecmd() {
    return util.format('ss-local -m %s -k %s -s %s -p %s',
      this.method, this.password, this.hostname, this.port);
  }

}




request(ssurl, function(err, res, body) {
  const $ = cheerio.load(body);
  var d = moment().tz('Asia/Shanghai');
  var servers = [];

  // Retrieve information
  for (var i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    var pw = $('#pw' + n).html().trim();
    var addr = $('#ip' + n).html().trim();
    var port = $('#port' + n).html().trim();
    var method = 'aes-256-cfb';

    var ss = new Shadowsocks(method, pw, addr, port);
    ss.name = n;
    servers.push(ss);
  }

  // Render template
  fs.readFile('README.mustache', function(err, data) {
    if (err) { throw err; }

    var output = mustache.render(data.toString(), {
      'data': servers,
      'update': d.format('YYYY-MM-DD hh:mm:ss')
    });
    console.log(output);
  });
});
