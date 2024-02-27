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
    async upsertJson(id, updateFn, emptyFn) {
        let f = `${this.root}/${id}`

        fs.mkdirSync(path.dirname(f), { recursive: true })

        let obj = undefined

        return new Promise((resolve, reject) => {
            fs.stat(f, (err, _) => {
                var p
                if (err) {
                    p = Promise.resolve().then(() => emptyFn())
                } else {
                    obj = JSON.parse(fs.readFileSync(f, {encoding: 'utf-8'}))
                    p = Promise.resolve().then(() => updateFn(obj))
                }


                return p.then(obj => {
                    fs.writeFile(f, JSON.stringify(obj), {}, err => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(obj)
                        }
                    })
                })
            })
        })
    }

    async getJson(id) {
        const key = `${this.root}/${id}`

        return new Promise((resolve, reject) => {
            fs.readFile(`${this.root}/${id}`, {'encoding': 'utf-8'}, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    const json = JSON.parse(data)
                    resolve(json)
                }
            })
    
        })
    }

    /**
     * Given a term, list the documents that contain that term or the term is a prefix.
     * 
     * These will be scored to build the final document list.
     * 
     * @param {string} term The search term, already processed (lower cased, stemmed, etc).
     */
    async listDocumentsWithTerm(term) {
        let dir = await fs.opendirSync(`${this.root}/termdoc`)
        let docs = {}
        for (let dirent = await dir.read(); dirent; dirent = await dir.read()) {
            if (dirent.name.startsWith(term)) {
                let termdir = fs.opendirSync(`${this.root}/termdoc/${dirent.name}`)
                for (let doc = termdir.readSync(); doc; doc = termdir.readSync()) {
                    docs[doc.name.split("_")[0]] = 1
                }
                await termdir.close()
            }
        }
        await dir.close()
        return Object.keys(docs)
    }
    
}

module.exports =  { FsStorage }