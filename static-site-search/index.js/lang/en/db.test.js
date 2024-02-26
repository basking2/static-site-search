const fs = require('fs')

const {DB} = require('./db');

var dbdir = undefined

beforeAll(() => {
    dbdir = fs.mkdtempSync("static-site-search")
    let db = new DB(dbdir)

    db.addDocument("this is a very nice document", {"some meta": "my data"})

})

afterAll(() => {
    fs.rmSync(dbdir, { recursive: true})
})

test('db list dirs', () => {
    let db = new DB(dbdir)
    let result = db.listDocumentsWithTerm("hide")
    // console.info(result)
})


test('scoring', () => {
    let db = new DB(dbdir)
    let term = 'hide'
    let result = db.listDocumentsWithTerm(term)

    db.score(term, result)
        .map(score => console.info("Score "+score))
        ;
})

test('search', () => {
    let db = new DB(dbdir)
    let term = 'hide'
    db.search(term)
        .map(score => console.info("Score "+JSON.stringify(score)))
        ;
})


test('search for god', () => {
    let db = new DB(dbdir)
    let term = 'god'
    db.search(term)
        .map(score => console.info("Score "+JSON.stringify(score)))
        ;
})