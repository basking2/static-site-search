const { Stopwords, Stemmer } = require('./lang/en')
const { FsStorage } = require('./storage/fs')
const keys = require('./storage/keys')

class DB {
    constructor(root) {
        this.storage = new FsStorage(root)
        this.stopwords = new Stopwords()
        this.stemmer = new Stemmer()
    }

    isStopword(term) {
        return this.stopwords.isStopword(term)
    }

    stemWord(term) {
        return this.stemmer.stemWord(term)
    }

    /**
     * 
     * @param {string} term The term to process.
     * @returns False if this is a stop word, empty or punctuation. 
     *   Otherwise, returns the stemmed version of this word.
     */
    processTerm(term) {
        term = term.toLowerCase()

        if (this.isStopword(term)) {
            return false;
        }

        if (! term.match(/^[a-zA-Z0-9'"\-_]+$/)) {
            return false;
        }

        return this.stemWord(term)
    }

    async score(term, docId, docInfo=undefined, global=undefined) {
        if (!global) {
            global = await this.storage.getJson(keys.forGlobalInfo())
        }

        if (docId instanceof Array) {
            return Promise.resolve(docId.map(d => this.score(term, d, docInfo, global)))
        }

        term = this.processTerm(term)

        let docLen = (docInfo ? docInfo : await this.storage.getJson(keys.forDocumentInfo(docId))).length
        let docTermCount = await this.storage.getJson(keys.forTermInDocumentCount(term)).count
        let termCount = await this.storage.getJson(keys.forTermInDocumentInfo(term, docId)).count || 0

        let tf = termCount / docLen
        let idf = Math.log10(global.size / docTermCount)

        return Promise.resolve(tf * idf)
    }

    async search(term) {
        term = this.processTerm(term)
        let docs = await this.storage.listDocumentsWithTerm(term)
        let global = await this.storage.getJson(keys.forGlobalInfo())

        let m = []
        for (let docId of docs) {
            let docInfo = await this.storage.getJson(keys.forDocumentInfo(docId))
            docInfo.score = await this.score(term, docId, docInfo, global)
            m.push(docInfo)
        }

        return m.sort((a, b) => b.score - a.score)
    }
    
    /**
     * 
     * @param {string} docId Document id.
     * @param {array} doc Array of strings that make up a document.
     * @param {object} docinfo User metadata to include.
     * @returns 
     */
    async addDocumentWithId(docId, doc, docinfo={}) {

        // Count the valid terms in this document.
        let seenTerms = {}
        for (let word of doc) {
            let term = this.processTerm(word)
            if (term) {
                if (term in seenTerms) {
                    seenTerms[term] += 1
                } else {
                    seenTerms[term] = 1
                }
            }
        }

        // For each term.
        for (let term in seenTerms) {
            // Record documents that have terms in them.
            await this.storage.upsertJson(
                keys.forTermInDocumentCount(term),
                obj => {
                    obj.count += 1
                    return obj
                },
                () => { return {count: 1} }
            )
 
            // Record doc length.
            await this.storage.upsertJson(
                keys.forDocumentInfo(docId),
                obj => {
                    return {...docinfo, length: doc.length};
                },
                () => {
                    return {...docinfo, length: doc.length}
                }
            )

            // Record term count for this document.
            await this.storage.upsertJson(
                keys.forTermInDocumentInfo(term, docId),
                obj => {
                    obj.count = seenTerms[term]
                    return obj
                },
                () => {
                    return {
                        count: seenTerms[term]
                    }
                }
            )

            // Add this document to the list of documents for this term.
            await this.storage.upsertJson(
                keys.forTermDocumentList(term),
                lst => {
                    lst.push(docId)
                    return lst
                },
                () => {
                    return [ docId ]
                }
            )
        }
    }

    /**
     * 
     * @param {array} doc An array of words that make up the document.
     * @returns A generated ID for the document.
     */
    async addDocument(doc, docinfo = {}) {

        if (!doc || doc.length == 0) {
            return
        }

        let globalInfo = await this.storage.upsertJson(
            keys.forGlobalInfo(),
            global => {
                global.size += 1
                global.lastId = global.size

                return this.addDocumentWithId(global.lastId, doc, docinfo).then(() => global)
            },
            () => {
                let global = { size: 0, lastId: 0 }

                return this.addDocumentWithId(global.lastId, doc, docinfo).then(() => global)
            }
        )

        return "" + globalInfo.lastId
    }    
}

module.exports = {
    DB
}