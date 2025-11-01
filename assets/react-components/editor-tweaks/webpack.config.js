const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'universal-editor-tweaks-react.js',
    path: path.resolve(__dirname, '../../components/editor-tweaks'),
    clean: false // Don't clean the directory since we have other files
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'universal-editor-tweaks-react.css'
    })
  ],
  externals: {
    // Use WordPress provided React
    'react': 'React',
    'react-dom': 'ReactDOM',
    // Use WordPress APIs
    '@wordpress/element': ['wp', 'element'],
    '@wordpress/components': ['wp', 'components'],
    '@wordpress/i18n': ['wp', 'i18n'],
    '@wordpress/data': ['wp', 'data'],
    '@wordpress/blocks': ['wp', 'blocks']
    // Note: framer-motion will be bundled since WP doesn't provide it
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};