const path = require('path', true);
const glob = require('glob', true);
const CopyWebpackPlugin = require('copy-webpack-plugin', true);
const { CleanWebpackPlugin } = require('clean-webpack-plugin', true);
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
        'admin/basic': path.join(srcPath, 'admin/basic.js'),
        'admin/flex-message': path.join(srcPath, 'admin/flex-message.ts'),
        'admin/meta-box': path.join(srcPath, 'admin/meta-box.js')
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
            }
        ],
    },
    plugins: [
        ...defaultConfig.plugins.filter((plugin) => plugin.constructor.name !== 'CleanWebpackPlugin'),
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                path.join(distPath)
            ],
            cleanStaleWebpackAssets: false,
        }),
        //new CopyWebpackPlugin({
        //    patterns: getCopyPatterns()
        //})
    ]
};
