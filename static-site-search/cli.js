const process = require('process')
const { FsStorage } = require('./storage/fs')
const { DB } = require('./db')
const fs = require('fs')

if (process.argv.length < 3) {
    console.info(`Usage: ${process.argv[1]} <db dir> <... files to add...>`)
}

const storage = new FsStorage(process.argv[2])
const db = new DB(storage)
const tokenize_regular_expression = /[\t\n \r,.:?!;"']+/

function addFile(file, meta={}) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, {encoding: "utf-8"}, (err, buffer) => {
            if (err) {
                reject(err)
            } else {
                let array = buffer.split(tokenize_regular_expression)
                db.addDocument(array, {file, ... meta}).then(resolve, reject)
            }
        })    
    })
}

let workPromise = Promise.resolve("OK")

process.argv.slice(3).forEach((arg, i) => {

    arg = arg.split("=", 2)
    if (arg[0] == "--add" && arg.length == 2) {
        let file = arg[1]
        console.info(`Importing ${file}.`)
        workPromise = workPromise.then(() => addFile(file, { }))
    } else if (arg[0] == "--search") {
        workPromise = db.search(arg[1]).then(docs => {
            for (const doc of docs) {
                console.info(doc)
            }
            return "Done."
        })

    } else {
        let file = arg[0]
        console.info(`Importing ${file}.`)
        workPromise = workPromise.then(() => addFile(file, { }))
    }
})

workPromise