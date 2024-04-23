const baseConfig = require('./webpack.base.config.js');

module.exports = {
    ...baseConfig,
    entry: './core/background.js',
    output: {
        ...baseConfig.output,
        filename: 'background.js',
    },
};
