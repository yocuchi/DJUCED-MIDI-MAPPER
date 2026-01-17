const path = require('path');
const fs = require('fs');

// Plugin simple para copiar archivos
class CopyFilesPlugin {
  constructor(patterns) {
    this.patterns = patterns;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyFilesPlugin', () => {
      this.patterns.forEach(pattern => {
        const from = path.resolve(__dirname, pattern.from);
        const to = path.resolve(__dirname, pattern.to);
        
        if (fs.existsSync(from)) {
          const dir = path.dirname(to);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.copyFileSync(from, to);
        } else if (!pattern.noErrorOnMissing) {
          console.warn(`File not found: ${from}`);
        }
      });
    });
  }
}

module.exports = {
  entry: './src/renderer/app.ts',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist/renderer'),
  },
  plugins: [
    new CopyFilesPlugin([
      { from: 'src/renderer/index.html', to: 'dist/renderer/index.html' },
      { from: 'src/renderer/styles.css', to: 'dist/renderer/styles.css', noErrorOnMissing: true },
    ]),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
  mode: 'development',
  devtool: 'source-map',
};
