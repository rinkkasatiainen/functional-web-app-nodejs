const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');


const javascript = {
  test: /\.(js)$/,
  exclude: /node_modules/,
  use: [{
    loader: 'babel-loader',
    options: { presets: ['es2015'] }
  }],
};

const typescript = {
  test: /\.(ts)$/,
  exclude: /node_modules/,
  use: [{
    loader: 'ts-loader'
  }],
};

const postcss = {
  loader: 'postcss-loader',
  options: {
    plugins() { return [autoprefixer({ browsers: 'last 3 versions' })]; }
  }
};

const svg = {
  test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
  use: [{
    loader: 'file-loader',
    options: {
      name: '[name].[ext]',
      outputPath: '/fonts/',
      publicPath: '/static/vn/fonts/'
    }
  }]
}

const styles =  {
  test: /\.scss$/,
  use: ExtractTextPlugin.extract(
    {
      fallback: 'style-loader',
      use: ['css-loader', postcss, 'sass-loader']
    })
};

const config = {
  mode: 'development',
  entry: {
    app: './src/client/lnn.ts'
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist', 'client'),
    filename: '[name].bundle.js',
    publicPath: "/dist/client"
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [typescript, styles, svg]
  },
  plugins: [
    new ExtractTextPlugin({filename: 'style.css'})
  ]
};
// process.noDeprecation = true;
module.exports = config;
