import { useDocuments } from '../features/documents/hooks/useDocuments'
import { DocumentHeader } from '../features/documents/components/DocumentHeader'
import { BulkActionBar } from '../features/documents/components/BulkActionBar'
import { UploadModal } from '../features/documents/components/UploadModal'
import { DocumentResultModal } from '../features/documents/components/DocumentResultModal'
import { DocumentList } from '../features/documents/components/DocumentList'

export default function DocumentsPage() {
    const {
        categories,
        docs,
        selectedDocs,
        search,
        setSearch,
        kbFilter,
        showUpload,
        setShowUpload,
        selectedFile,
        setSelectedFile,
        selectedKB,
        setSelectedKB,
        uploading,
        summarizing,
        summary,
        setSummary,
        comparing,
        selectedForCompare,
        comparison,
        setComparison,
        fileInputRef,
        handleUpload,
        handleDelete,
        handleBulkMove,
        handleBulkDelete,
        toggleSelect,
        handleSelectAll,
        handleSummarize,
        handleCompare,
        toggleCompareSelect,
        clearFilters
    } = useDocuments()

    const filtered = docs.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.knowledgeBase.toLowerCase().includes(search.toLowerCase())
        const matchesKB = !kbFilter || d.knowledgeBase === kbFilter
        return matchesSearch && matchesKB
    })

    return (
        <div className="max-w-[800px] mx-auto">
            <DocumentHeader
                kbFilter={kbFilter}
                clearFilters={clearFilters}
                selectedForCompareCount={selectedForCompare.length}
                handleCompare={handleCompare}
                comparing={comparing}
                setShowUpload={setShowUpload}
            />

            <input
                placeholder="Search documents or knowledge base…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-4 py-3 text-sm border-[1.5px] border-border rounded-lg bg-bg text-gray-900 mb-5 transition-all duration-150 focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/10"
            />

            <BulkActionBar
                selectedDocsCount={selectedDocs.length}
                categories={categories}
                handleBulkMove={handleBulkMove}
                handleBulkDelete={handleBulkDelete}
            />

            <DocumentList
                filteredDocs={filtered}
                selectedDocs={selectedDocs}
                toggleSelect={toggleSelect}
                handleSelectAll={() => handleSelectAll(filtered.map(d => d.id))}
                selectedForCompare={selectedForCompare}
                toggleCompareSelect={toggleCompareSelect}
                handleSummarize={handleSummarize}
                summarizing={summarizing}
                handleDelete={handleDelete}
            />

            <UploadModal
                show={showUpload}
                onClose={() => {
                    setShowUpload(false)
                    setSelectedFile(null)
                }}
                fileInputRef={fileInputRef}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                selectedKB={selectedKB}
                setSelectedKB={setSelectedKB}
                categories={categories}
                handleUpload={handleUpload}
                uploading={uploading}
            />

            <DocumentResultModal
                title="Document Summary"
                content={summary}
                onClose={() => setSummary(null)}
            />

            <DocumentResultModal
                title="Document Comparison"
                content={comparison}
                onClose={() => setComparison(null)}
            />
        </div>
    )
}
