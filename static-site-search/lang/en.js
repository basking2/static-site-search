const snowball = require('node-snowball')
const fs = require('fs')
class Stemmer {

    constructor() {
    }

    stemWord(term) {
        return snowball.stemword(term)
    }
}

class Stopwords {
    constructor() {
        this.stopwords = fs.readFileSync("./static-site-search/lang/en/stopwords.txt", "utf-8")
        .split("\n")
        .reduce((db, word) => { db[word]=1; return db; }, {})    
    }

    isStopword(term) {
        return term in this.stopwords
    }
}

module.exports = {
    Stemmer, Stopwords
}