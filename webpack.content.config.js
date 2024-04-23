const baseConfig = require('./webpack.base.config.js');

module.exports = {
    ...baseConfig,
    entry: './core/content.js',
    output: {
        ...baseConfig.output,
        filename: 'content.js',
    },
};
