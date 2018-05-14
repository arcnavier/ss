const request = require('request');
const cheerio = require('cheerio');
const mustache = require('mustache');
const fs = require('fs');
const moment = require('moment-timezone');

const SS = require('./shadowsocks').Shadowsocks;
const SSR = require('./shadowsocks').ShadowsocksR;
const common = require('./common');
const b64 = common.b64;
const b64safe = common.b64safe;

const ssurl = 'https://fast.ishadowx.net'
const nodes = ['jpa', 'jpb', 'jpc', 'usa', 'usb', 'usc', 'sga', 'sgb', 'sgc']
const names = ['日本1', '日本2', '日本3', '美国1', '美国2', '美国3', '新加坡1', '新加坡2', '新加坡3']
const ssrnodes = ['ssra', 'ssrb', 'ssrc']



// Start
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

    var ss = new SS(method, pw, addr, port);
    ss.name = names[i];
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

    var ss = new SSR(addr, port, protocol, method, obfs, pw);
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
      'update': d.format('YYYY-MM-DD HH:mm:ss')
    });
    fs.writeFileSync('README.md', output);

    fs.writeFileSync('ssr.txt', b64safe(subscribe))
  });
});
