const { newStemmer } = require('./snowball.babel')

test('q1', () => {
    const s = newStemmer("english")
    const t1 = s.stem("documents")

    expect(t1).toBe("document")
})
