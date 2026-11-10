const path = require('path');
const { optimize } = require('svgo');

const defaultConfig = require('@wordpress/scripts/config/webpack.config', true);
const { fromProjectRoot } = require('@wordpress/scripts/utils/file', true);

const srcPath = fromProjectRoot('assets-src');
const distPath = fromProjectRoot('assets');

module.exports = {
    ...defaultConfig,
    entry: {
        'admin/basic': path.join(srcPath, 'admin/basic.ts'),
        'admin/flex-message': path.join(srcPath, 'admin/flex-message/main.ts'),
        'admin/meta-box': path.join(srcPath, 'admin/meta-box.ts')
    },
    output: {
        ...defaultConfig.output,
        path: distPath,
        filename: '[name].js'
    },
    module: {
        ...defaultConfig.module,
        rules: [
            ...defaultConfig.module.rules,
            {
                test: /\.svg$/,
                issuer: /\.(pc|sc|sa|c)ss$/,
                type: 'asset/inline',
                generator: {
                    dataUrl: content => {
                        const result = optimize(content.toString());
                        const encoded = Buffer.from(result.data).toString('base64');
                        return `data:image/svg+xml;base64,${encoded}`;
                    },
                },
                use: ['svgo-loader']
            }
        ],
    }
};
