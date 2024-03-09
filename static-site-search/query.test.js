const fs = require('fs')
const {FsStorage} = require('./storage/fs')
const {DB} = require('./db');
const query = require('./query');

var dbdir = undefined
var doc1 = undefined
var doc2 = undefined
beforeAll(async () => {
    dbdir = fs.mkdtempSync("static-site-search")
    let storage = new FsStorage(dbdir)    
    let db = new DB(storage)
    let doc = "this is a very nice document".split(" ")
    let docmeta =  {"some meta": "my data", "file": 'a'}
    doc1 = await db.addDocument(doc, docmeta)
    doc2 = await db.addDocument(doc, docmeta)

    doc = "bonzo is not a doggo".split(" ")
    docmeta =  {"some meta": "my data", "file": 'b'}
    doc3 = await db.addDocument(doc, docmeta)

    // console.info("Created", doc1, doc2, doc3)
})

afterAll(() => {
    fs.rmSync(dbdir, { recursive: true})
})

test('simple query bonzo', async () => {
    let storage = new FsStorage(dbdir)    
    let db = new DB(storage)
    let result = await query.simpleQuery(db, "do you know bonzo")
    expect(result.length).toBe(1)
    expect(result[0].file).toBe('b')
})

test('simple query document', async () => {
    let storage = new FsStorage(dbdir)    
    let db = new DB(storage)
    let result = await query.simpleQuery(db, "find document")
    expect(result[0].file).toBe('a')
    expect(result.length).toBe(1)
})

test('simple query both', async () => {
    let storage = new FsStorage(dbdir)    
    let db = new DB(storage)
    let result = await query.simpleQuery(db, "bonzo nice")
    expect(result.length).toBe(2)
    expect(result[0].file).toBe('b')
    expect(result[1].file).toBe('a')
    expect(result[0].score).toBeGreaterThan(result[1].score)
})
