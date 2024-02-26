const fs = require('fs')
const path = require('path')
const snowball = require('node-snowball')

class DB {
    constructor(root) {
        this.root = root
        this.stopwords = fs.readFileSync("./static-site-search/index.js/lang/en/stopwords.txt", "utf-8")
            .split("\n")
            .reduce((db, word) => { db[word]=1; return db; }, {})

        if (!fs.existsSync(this.root)) {
            fs.mkdirSync(this.root, { recursive: true })
        }
    }

    
    /**
     * 
     * @param {string} term The term to process.
     * @returns False if this is a stop word, empty or punctuation. 
     *   Otherwise, returns the stemmed version of this word.
     */
    processTerm(term) {
        term = term.toLowerCase()

        if (term in this.stopwords) {
            return false;
        }

        if (! term.match(/^[a-zA-Z0-9'"\-_]+$/)) {
            return false;
        }

        return snowball.stemword(term)
    }

    /**
     * 
     * @param {string} id The ID.
     * @param {Function} updateFn Takes the read object and returns an updated one.
     *   The returned object may be the same one passed in.
     * @param {Function} emptyFn Returns an initialize object.
     */
    upsertJson(id, updateFn, emptyFn) {
        let f = `${this.root}/${id}`

        if (!fs.existsSync(path.dirname(f))) {
            fs.mkdirSync(path.dirname(f), { recursive: true })
        }

        if (fs.existsSync(f)) {
            let obj = JSON.parse(fs.readFileSync(f, 'utf-8'))
            obj = updateFn(obj)
            fs.writeFileSync(f, JSON.stringify(obj))
        } else {
            fs.writeFileSync(f, JSON.stringify(emptyFn()))
        }
    }

    getJson(id) {
        const key = `${this.root}/${id}`
        if (fs.existsSync(key)) {
            return JSON.parse(fs.readFileSync(`${this.root}/${id}`, 'utf-8'))
        } else {
            return {}
        }
    }

    /**
     * @returns Global database information.
     */
    keyForGlobalInfo() {
        return `global.json`
    }

    /**
     * The key that stores the count of documents containing the term.
     * @param {string} term 
     * @returns 
     */
    keyForTermInDocumentCount(term) {
        return `terms/${term}_doc_count.json`
    }

    /**
     * Key that stores information about a document, such as its length.
     * @param {string} docId 
     */
    keyForDocumentInfo(docId) {
        return `doc/${docId}_info.json`
    }

    /**
     * Key that stores information about a term in a document.
     * @param {string} term The term.
     * @param {string} docId The document ID.
     */
    keyForTermInDocumentInfo(term, docId) {
        return `termdoc/${term}/${docId}_info.json`
    }

    addDocumentWithId(docId, doc, docinfo={}) {

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
            this.upsertJson(
                this.keyForTermInDocumentCount(term),
                obj => {
                    obj.count += 1
                    return obj
                },
                () => { return {count: 1} }
            )
 
            // Record doc length.
            this.upsertJson(
                this.keyForDocumentInfo(docId),
                obj => {
                    return {...docinfo, length: doc.length};
                },
                () => {
                    return {...docinfo, length: doc.length}
                }
            )

            // Record term count for this document.
            this.upsertJson(
                this.keyForTermInDocumentInfo(term, docId),
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
        }
    }

    /**
     * 
     * @param {array} doc An array of words that make up the document.
     * @returns A generated ID for the document.
     */
    addDocument(doc, docinfo = {}) {

        if (!doc || doc.length == 0) {
            return
        }

        this.upsertJson(
            this.keyForGlobalInfo(),
            global => {
                global.size += 1
                global.lastId = global.size

                this.addDocumentWithId(global.lastId, doc, docinfo)

                return global
            },
            () => {
                let global = { size: 0, lastId: 0 }

                this.addDocumentWithId(global.lastId, doc, docinfo)

                return global
            }
        )
    }

    /**
     * Given a term, list the documents that contain that term or the term is a prefix.
     * 
     * @param {string} term 
     */
    listDocumentsWithTerm(term) {
        term = this.processTerm(term)
        let dir = fs.opendirSync(`${this.root}/termdoc`)
        let docs = {}
        for (let dirent = dir.readSync(); dirent; dirent = dir.readSync()) {
            if (dirent.name.startsWith(term)) {
                let termdir = fs.opendirSync(`${this.root}/termdoc/${dirent.name}`)
                for (let doc = termdir.readSync(); doc; doc = termdir.readSync()) {
                    docs[doc.name.split("_")[0]] = 1
                }
                termdir.closeSync()
            }
        }
        dir.closeSync()
        return Object.keys(docs)
    }

    score(term, docId, docInfo=undefined, global=undefined) {
        if (!global) {
            global = this.getJson(this.keyForGlobalInfo())
        }

        if (docId instanceof Array) {
            return docId.map(d => this.score(term, d, docInfo, global))
        }

        term = this.processTerm(term)


        let docLen = (docInfo ? docInfo : this.getJson(this.keyForDocumentInfo(docId))).length
        let docTermCount = this.getJson(this.keyForTermInDocumentCount(term)).count
        let termCount = this.getJson(this.keyForTermInDocumentInfo(term, docId)).count || 0

        let tf = termCount / docLen
        let idf = Math.log10(global.size / docTermCount)

        return tf * idf
    }

    search(term) {
        let docs = this.listDocumentsWithTerm(term)
        let global = this.getJson(this.keyForGlobalInfo())

        return docs
            .map(docId => {
                let docInfo = this.getJson(this.keyForDocumentInfo(docId))
                docInfo.score = this.score(term, docId, docInfo, global)
                return docInfo
            })
            // Reverse sort, greatest score to least.
            .sort((a, b) => b.score - a.score)
        
    }
}

module.exports = {
    DB
}