const snowball_babel = require('./snowball.babel')
const { stopwords } = require('./en/stopwords')

class Stemmer {

    constructor() {
        this.stemmer = snowball_babel.newStemmer("english")
    }

    stemWord(term) {
        return this.stemmer.stem(term)
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