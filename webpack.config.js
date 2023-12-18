const path = require('path');

module.exports = (env, argv) => {
  const mode = argv.mode ?? 'production'
  const config = {
    entry: './p5.csg.ts',
    output: {
      filename: 'p5.csg.js',
      path: path.resolve(__dirname, 'build'),
      libraryTarget: 'umd',
      library: 'P5CSG',
    },
    context: path.resolve(__dirname, 'src'),
    mode,
    module: {
      rules: [{
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    },
  };

  if (mode === 'development') {
    config.devtool = 'inline-source-map'
  }
  return config;
};
