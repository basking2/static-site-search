const fs = require('fs')
const path = require('path')

class FsStorage {
    constructor(root) {
        this.root = root
        if (!fs.existsSync(this.root)) {
            fs.mkdirSync(this.root, { recursive: true })
        }
    }

    /**
     * 
     * @param {string} id The ID.
     * @param {Function} updateFn Takes the read object and returns an updated one.
     *   The returned object may be the same one passed in.
     *   This will be returned by this function.
     * @param {Function} emptyFn Returns an initialize object.
     *   This will be returned by this function.
     * @returns {object} The object written as JSON.
     */
    upsertJson(id, updateFn, emptyFn) {
        let f = `${this.root}/${id}`

        if (!fs.existsSync(path.dirname(f))) {
            fs.mkdirSync(path.dirname(f), { recursive: true })
        }

        let obj = undefined

        if (fs.existsSync(f)) {
            obj = JSON.parse(fs.readFileSync(f, 'utf-8'))
            obj = updateFn(obj)
            fs.writeFileSync(f, JSON.stringify(obj))
        } else {
            obj = emptyFn()
            fs.writeFileSync(f, JSON.stringify(obj))
        }

        return obj
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
     * Given a term, list the documents that contain that term or the term is a prefix.
     * 
     * These will be scored to build the final document list.
     * 
     * @param {string} term The search term, already processed (lower cased, stemmed, etc).
     */
    listDocumentsWithTerm(term) {
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
    
}

module.exports =  { FsStorage }