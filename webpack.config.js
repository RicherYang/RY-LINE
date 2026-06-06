const path = require('path');
const glob = require('glob');
const CopyWebpackPlugin = require('copy-webpack-plugin', true);
const svgToMiniDataURI = require('mini-svg-data-uri', true);

const defaultConfig = require('@wordpress/scripts/config/webpack.config', true);
const { fromProjectRoot } = require('@wordpress/scripts/utils/file', true);

const srcPath = fromProjectRoot('assets-src');
const distPath = fromProjectRoot('assets');

function getCopyPatterns() {
    let patterns = [];

    glob.sync(
        path.join(srcPath, 'icons', '*')
    ).forEach((file) => {
        patterns.push({
            from: file,
            to: path.relative(srcPath, file)
        });
    });

    return patterns;
}

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
                        content = content.toString();
                        return svgToMiniDataURI(content);
                    },
                },
                use: ['svgo-loader']
            }
        ],
    },
    plugins: [
        ...defaultConfig.plugins,
        //new CopyWebpackPlugin({
        //    patterns: getCopyPatterns()
        //})
    ]
};
