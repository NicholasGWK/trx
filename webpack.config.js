module.exports = {
  entry: './src/index.js',
  output: {
      path: __dirname + "/dist",
      filename: "index.js"
  },
    module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
}
