const baseConfig = require('./webpack.base.config.js');

module.exports = {
    ...baseConfig,
    entry: './core/inpage.js',
    output: {
        ...baseConfig.output,
        filename: 'inpage.js',
    },
};
