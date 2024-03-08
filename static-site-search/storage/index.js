class StorageInterface {
    constructor() {
    }

    upsertJson(id, updateFn, emptyFn) {
        throw new Error("upsertJson not implemented")
    }

    async getJson(id) {
        throw new Error("getJson not implemented")
    }

    async listDocumentsWithTerm(term) {
        throw new Error("listDocumentsWithTerm not implemented")
    }
}

module.exports = { StorageInterface }