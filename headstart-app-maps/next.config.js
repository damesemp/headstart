module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/', destination: '/application-map', permanent: false }
    ];
  }
};
