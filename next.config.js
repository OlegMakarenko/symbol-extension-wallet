const webpack = require('webpack');

module.exports = {
	distDir: process.env.NODE_ENV === 'production' ? 'build' : null,
	output: 'export',
	reactStrictMode: true,
	eslint: {
		ignoreDuringBuilds: true
	},
	webpack: (config) => {
		// use a browser-optimized wasm for Ed25519 crypto operations
		const moduleRegExp = /symbol-crypto-wasm-node/;
		const newPath = '../../../symbol-crypto-wasm-web/symbol_crypto_wasm.js';
		config.plugins.push(new webpack.NormalModuleReplacementPlugin(moduleRegExp, newPath));

		// enable async loading of wasm files
		config.experiments = { asyncWebAssembly: true, topLevelAwait: true, layers: true };

		return config;
	},
	async rewrites() {
		return [
			{
				//source: '/:any*',
				source: '/:path*',
				destination: '/',
			},
		];
	},
};
