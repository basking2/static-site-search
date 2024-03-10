const path = require('path')

module.exports = [
    {
        name: "db",
        // context: path.resolve(__dirname),
        entry: [
            './static-site-search/db.js',
            // './static-site-search/storage/http.js',
            './static-site-search/storage/index.js',
            // './static-site-search/query.js',
        ],
        mode: 'production',
        target: ['web'],
        output: {
            filename: 'static-site-search.js',
            // library: "StaticSiteSearch",
            path: __dirname + '/dist',
        },    
    }
]