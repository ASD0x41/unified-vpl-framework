const webpack = require('webpack');

module.exports = {
  resolve: {
    alias: {
      'node:url': 'url',
      'node:buffer': 'buffer',
      'node:stream': 'stream-browserify',
      'node:util': 'util',
    },
    fallback: {
      url: require.resolve('url/'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
