const fs = require('fs')
const path = require('path')
const keys = require('./keys')
const { StorageInterface } = require('.')

class FsStorage extends StorageInterface {
    constructor(root) {
        super()
        this.root = root
        this.enable_debug = false
        if (!fs.existsSync(this.root)) {
            fs.mkdirSync(this.root, { recursive: true })
        }
    }

    debug(msg) {
        const prefix = "FsStorage Debug"
        if (!this.enable_debug) {
            return
        }

        if (msg instanceof Function) {
            msg = msg()
        }

        console.debug(`${prefix} - ${msg}`)
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

        this.debug(() => `Making path ${path.dirname(f)}.`)

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

        this.debug(() => `Reading key ${key}.`)

        return new Promise((resolve, reject) => {
            fs.readFile(`${this.root}/${id}`, {'encoding': 'utf-8'}, (err, data) => {
                if (err) {
                    if (err.code == 'ENOENT') {
                        resolve(undefined)
                    } else {
                        reject(err)
                    }
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
    async listDocumentsWithTerm_Cheating(term) {
        let dir = await fs.opendirSync(`${this.root}/termdoc`)
        this.debug(() => `Listing dir ${dir}.`)

        let docs = {}
        for (let dirent = await dir.read(); dirent; dirent = await dir.read()) {
            if (dirent.name.startsWith(term)) {
                this.debug(() => `Listing docs in dir ${this.root}/termdoc/${dirent.name}.`)
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

    async listDocumentsWithTerm(term) {
        return new Promise((resolve, reject) => {
            let file = keys.forTermDocumentList(term)
            fs.readFile(`${this.root}/${file}`, {encoding: "utf-8"}, (err, data) => {
                if (err) {
                    if (err.code == 'ENOENT') {
                        resolve([])
                    } else {
                        reject(err)
                    }
                } else {
                    resolve(JSON.parse(data))
                }
            })    
        })
    }

}

module.exports =  { FsStorage }