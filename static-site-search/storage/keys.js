
/**
 * @returns Global database information.
 */
function forGlobalInfo() {
    return `global.json`
}

/**
 * The key that stores the count of documents containing the term.
 * @param {string} term 
 * @returns 
 */
function forTermInDocumentCount(term) {
    return `terms/${term}_doc_count.json`
}

/**
 * Key that stores information about a document, such as its length.
 * @param {string} docId 
 */
function forDocumentInfo(docId) {
    return `doc/${docId}_info.json`
}

/**
 * Key that stores information about a term in a document.
 * @param {string} term The term.
 * @param {string} docId The document ID.
 */
function forTermInDocumentInfo(term, docId) {
    return `termdoc/${term}/${docId}_info.json`
}

/**
 * Return a list of all documents that contain the given term.
 * @param {string} term The processed search term. Lower cased, stemmed, etc.
 * @returns A list of document IDs that contain that term. These documents must be scored.
 */
function forTermDocumentList(term) {
    return `termdocs/${term}_document_list.json`
}

module.exports = {
    forTermInDocumentCount,
    forGlobalInfo,
    forTermDocumentList,
    forDocumentInfo,
    forTermInDocumentInfo,
    forTermDocumentList
}