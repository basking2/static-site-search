
const { DB } = require("./db")

/**
 * 
 * @param {DB} db 
 * @param {String} query 
 */
function simpleQuery(db, query) {
    terms = query.split(/[\r\n\t "',]+/)
    return terms.map(term => {
        return db.search(term).then(docs => {
            const h = {}
            for (const d of docs) {
                h[d.file] = d
            }
            return h
        })
    }).reduce((prev, curr) => {
        return Promise.all([prev, curr]).then(docLists => {
            const [docs1, docs2] = docLists

            for (const key of Object.keys(docs2)) {
                if (key in docs1) {
                    docs1[key].score = docs1[key].score + docs2[key].score
                } else {
                    docs1[key] = docs2[key]
                }
            }

            return docs1
        })
    }).then(docs => {
        return Object.values(docs).sort((a, b) => {
            if (a.score > b.score) {
                return -1
            }

            if (a.score < b.score) {
                return 1;
            }

            // Put non-comparable values to the end of the list.
            if (a.score != a.score) {
                return 1;
            }

            // Put non-comparable values to the end of the list.
            if (b.score != b.score) {
                return -1
            }

            return 0
        })
    })
}

module.exports = {
    simpleQuery
}