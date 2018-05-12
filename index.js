const request = require('request');
const cheerio = require('cheerio');
const mustache = require('mustache');
const util = require('util');
const fs = require('fs');
const moment = require('moment-timezone');

const ssurl = 'https://fast.ishadowx.net'
const nodes = ['usa', 'usb', 'usc', 'jpa', 'jpb',
              'jpc', 'sga', 'sgb', 'sgc']
const ssrnodes = ['ssra', 'ssrb', 'ssrc']

function b64(s) {
  return Buffer.from(s).toString('base64');
}

function b64safe(s) {
  return b64(s).replace(/=+$/, '');
}

class Shadowsocks {
  constructor(method, password, hostname, port) {
    this.method = method;
    this.password = password;
    this.hostname = hostname;
    this.port = port;
  }

  encodess() {
    var url = this.method + ":" + this.password + '@' + this.hostname + ':' + this.port;
    return 'ss://' + b64(url);
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

class ShadowsocksR extends Shadowsocks {
  constructor(host,port,protocol,method,obfs,pass) {
    super(method, pass, host, port);
    this.obfs = obfs;
    this.protocol = protocol;
    this.params = {};
  }

  encodess() {
    var url = util.format('%s:%s:%s:%s:%s:%s/',
      this.hostname, this.port, this.protocol, this.method, this.obfs, b64safe(this.password));
    var params = [];
    Object.keys(this.params).forEach(function(element, key, _array) {
      params.push(util.format('%s=%s', element, b64safe(this.params[element])))
    }, this);
    if (params) {
      url += '?' + params.join('&');
    }
    return 'ssr://' + b64safe(url);
  }

  encodehtml() {
    var s = this.encodess();
    return util.format('<a href="%s">%s</a>', s, s);
  }

  encodecmd() {
    return JSON.stringify({
      'server': this.hostname,
      'server_port': this.port,
      'local_address': '127.0.0.1',
      'local_port': 1080,
      'password': this.password,
      'method': this.method,
      'protocol': this.protocol,
      'protocol_param': '',
      'obfs': this.obfs,
      'obfs_param': ''
    }, null, 2);
  }
}




request(ssurl, function(err, res, body) {
  const $ = cheerio.load(body);
  var d = moment().tz('Asia/Shanghai');
  var servers = [];
  var subscribe = '';

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

  for (var i = 0; i < ssrnodes.length; i++) {
    var n = ssrnodes[i];
    var pw = $('#pw' + n).html().trim();
    var addr = $('#ip' + n).html().trim();
    var port = $('#port' + n).html().trim();
    var method = 'aes-256-cfb';
    var protocol = 'auth_sha1_v4';
    var obfs = 'tls1.2_ticket_auth';

    var ss = new ShadowsocksR(addr, port, protocol, method, obfs, pw);
    ss.name = n;
    ss.params.remarks = n;
    ss.params.group = 'ishadowx.net'
    servers.push(ss);
    subscribe += ss.encodess() + '\n';
  }

  // Render template
  fs.readFile('README.mustache', function(err, data) {
    if (err) { throw err; }
    var output = mustache.render(data.toString(), {
      'data': servers,
      'update': d.format('YYYY-MM-DD hh:mm:ss')
    });
    fs.writeFileSync('README.md', output);

    fs.writeFileSync('ssr.txt', b64safe(subscribe))
  });
});
