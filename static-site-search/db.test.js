const fs = require('fs')

const {DB} = require('./db');

var dbdir = undefined
var doc1 = undefined
beforeAll(() => {
    dbdir = fs.mkdtempSync("static-site-search")
    let db = new DB(dbdir)
    let doc = "this is a very nice document".split(" ")
    let docmeta =  {"some meta": "my data"}
    doc1 = db.addDocument(doc, docmeta)
})

afterAll(() => {
    fs.rmSync(dbdir, { recursive: true})
})

test('search', () => {
    let db = new DB(dbdir)
    let result = db.search("document")
    expect(result[0]["some meta"]).toBe("my data")
})
