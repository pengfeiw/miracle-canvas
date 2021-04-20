const path = require("path");

module.exports = {
    entry: path.resolve(__dirname, "src/index.ts"),
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "./lib"),
        libraryTarget: "var",
        library: {
            name: "GlobalMiracle",
            type: "umd"
        },
    },
    module: {
        rules: [
            {
                use: "ts-loader",
                test: /\.tsx?$/,
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};
