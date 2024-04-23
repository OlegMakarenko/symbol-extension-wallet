const webpack = require('webpack');
const path = require('path');
const jsConfig = require('./jsconfig.json');

const mapPathsToAlias = (paths) => {
    const alias = {};
    Object.keys(paths).forEach((key) =>
        alias[key.replace('/*', '')] = path.resolve(__dirname, paths[key][0].replace('*', ''))
    );

    return alias;
}

module.exports = {
    mode: 'production',
    optimization: {
        minimize: false,
    },
    plugins: [
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    resolve: {
        alias: mapPathsToAlias(jsConfig.compilerOptions.paths),
        fallback: {
            buffer: require.resolve('buffer/'),
        },
    },
    output: {
        path: path.resolve(__dirname, 'build'),
    },
};
