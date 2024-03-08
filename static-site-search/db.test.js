const fs = require('fs')
const {FsStorage} = require('./storage/fs')
const {DB} = require('./db');

var dbdir = undefined
var doc1 = undefined
var doc2 = undefined
beforeAll(async () => {
    dbdir = fs.mkdtempSync("static-site-search")
    let storage = new FsStorage(dbdir)    
    let db = new DB(storage)
    let doc = "this is a very nice document".split(" ")
    let docmeta =  {"some meta": "my data"}
    doc1 = await db.addDocument(doc, docmeta)
    doc2 = await db.addDocument(doc, docmeta)
})

afterAll(() => {
    fs.rmSync(dbdir, { recursive: true})
})

test('search', async () => {
    let storage = new FsStorage(dbdir)    
    let db = new DB(storage)
    let result = await db.search("document")
    expect(result[0]["some meta"]).toBe("my data")
})
