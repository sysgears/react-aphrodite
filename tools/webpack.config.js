var nodeExternals = require('webpack-node-externals');
var path = require('path');

var reactExternal = {
  root: 'React',
  commonjs2: 'react',
  commonjs: 'react',
  amd: 'react'
};

let config = {
  entry: [
    './src/index'
  ],
  externals: {
    'react': reactExternal
  },
  output: {
    path: path.join(__dirname, '../dist')
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
    }]
  },
  resolveLoader: {
    alias: {
      wrap: path.join(__dirname, './wrap-loader.js')
    }
  }
};

if (process.argv.length >= 2 && process.argv[1].indexOf('mocha-webpack') >= 0) {
  config.target = 'node';
  config.externals = [nodeExternals()];
}

module.exports = config;
