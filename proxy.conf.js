const PROXY_CONFIG = [
  {
    context: ['/process-instance', '/task', '/process', '/api'],
    target: 'http://localhost:9091',
    secure: false,
    changeOrigin: true,
    onProxyRes: function (proxyRes) {
      delete proxyRes.headers['www-authenticate'];
    }
  }
];

module.exports = PROXY_CONFIG;
