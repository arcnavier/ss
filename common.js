exports.b64 = function (s) {
  return Buffer.from(s).toString('base64');
}

exports.b64safe = function (s) {
  return exports.b64(s).replace(/=+$/, '');
}
