const util = require('util');

const common = require('./common');
const b64 = common.b64;
const b64safe = common.b64safe;


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
    return util.format('ss-local -m %s -k %s -s %s -p %s -l 1080',
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

exports.Shadowsocks = Shadowsocks;
exports.ShadowsocksR = ShadowsocksR;
