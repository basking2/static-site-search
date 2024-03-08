
const http = require('http')
const keys = require('./keys')
const { StorageInterface } = require('.')

class HttpStorage extends StorageInterface {
    constructor(base) {
        super()
        this.base = base
    }

    upsertJson(id, updateFn, emptyFn) {
        throw new Error("upsertJson not implemented")
    }

    async getJson(id) {
        const key = `${this.base}/${id}`

        return new Promise((resolve, reject) => {
            let req = http.request(key, { }, res => {
                data = ''
                if (res.statusCode == 404) {
                    resolve({})
                } else {
                    res.on('data', chunk => data += chunk)
                    res.on('end', () => {
                        const json = JSON.parse(data)
                        resolve(json)
                    })
                    res.on('error', reject)
                }
            })
            req.end()
        })
    }

    async listDocumentsWithTerm(term) {
        return this.getJson(keys.forTermDocumentList(term))
    }
}

module.exports = { HttpStorage }