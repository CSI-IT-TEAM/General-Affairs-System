const path = require('path');

module.exports = {
    style: {
        postcssOptions: {
            config: path.resolve(__dirname, 'postcss.config.js'),
        },
    },
}

