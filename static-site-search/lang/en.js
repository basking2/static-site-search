const snowball = require('node-snowball')
const fs = require('fs')
const { stopwords } = require('./en/stopwords')

class Stemmer {

    constructor() {
    }

    stemWord(term) {
        return snowball.stemword(term)
    }
}

class Stopwords {
    constructor() {
        this.stopwords = stopwords.reduce((db, word) => { db[word]=1; return db; }, {})    
    }

    isStopword(term) {
        return term in this.stopwords
    }
}

module.exports = {
    Stemmer, Stopwords
}