const util = require('util');
const qs = require('querystring');

const common = require('./common');
const b64 = common.b64;
const b64safe = common.b64safe;


class Shadowsocks {
  constructor(method, password, hostname, port, params = {}) {
    this.method = method;
    this.password = password;
    this.hostname = hostname;
    this.port = port;
    this.params = params; // Unused in Shadowsocks

    this.type = 'ss';
  }

  // Encode the url (original base64 url scheme) without base64
  encodeurl() {
    return util.format('%s:%s@%s:%s',
            this.method, this.password, this.hostname, this.port);
  }

  // Base64 the url
  encodess() {
    return 'ss://' + b64(this.encodeurl());
  }

  // shadowsocks-libev format
  encodecmd() {
    return util.format('ss-local -m %s -k %s -s %s -p %s -l 1080',
      this.method, this.password, this.hostname, this.port);
  }

  encodehtml() {
    var s = this.encodess();
    return util.format('<a href="%s">%s</a>', s, s);
  }

}

class ShadowsocksR extends Shadowsocks {
  constructor(host,port,protocol,method,obfs,pass,params={}) {
    super(method, pass, host, port, params);
    this.obfs = obfs;
    this.protocol = protocol;

    this.type = 'ssr';
  }

  encodeurl() {
    return util.format('%s:%s:%s:%s:%s:%s/',
      this.hostname, this.port, this.protocol,
      this.method, this.obfs, b64safe(this.password));
  }

  encodess() {
    var params = {};
    for (var key in this.params) {
      params[key] = b64safe(this.params[key]);
    }

    var url = this.encodeurl();
    if (params) {
      url += '?' + qs.stringify(params);
    }
    return 'ssr://' + b64safe(url);
  }

  encodecmd() {
    return util.format('python local.py -m %s -k %s -s %s -p %s -o %s -O %s -l 1080',
      this.method, this.password, this.hostname, this.port, this.obfs, this.protocol);
  }

  encodeconf() {
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

// SSR Subscribe
class Subscribe {
  constructor(servers = []) {
    this.servers = servers;
  }

  get() {
    var urls = '';
    this.servers.forEach(function (element, index, _e) {
      urls += element.encodess() + '\n';
    });
    return b64safe(urls);
  }

  push(server) {
    this.servers.push(server);
  }
}

exports.Shadowsocks = Shadowsocks;
exports.ShadowsocksR = ShadowsocksR;
exports.Subscribe = Subscribe;
