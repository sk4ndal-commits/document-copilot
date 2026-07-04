import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Document,
    bulkUpdateDocuments,
    compareDocuments,
    deleteDocument,
    fetchDocuments,
    fetchIngestionStatus,
    summarizeDocument,
    uploadDocument,
    fetchCategories
} from '../../../services/api'

export function useDocuments() {
    const [categories, setCategories] = useState<any[]>([])
    const [docs, setDocs] = useState<Document[]>([])
    const [selectedDocs, setSelectedDocs] = useState<string[]>([])
    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState('')
    const kbFilter = searchParams.get('kb')
    const [showUpload, setShowUpload] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedKB, setSelectedKB] = useState('')
    const [uploading, setUploading] = useState(false)
    const [summarizing, setSummarizing] = useState<string | null>(null)
    const [summary, setSummary] = useState<string | null>(null)
    const [comparing, setComparing] = useState(false)
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([])
    const [comparison, setComparison] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pollingRef = useRef<number | null>(null)

    useEffect(() => {
        fetchDocuments().then(setDocs)
        fetchCategories().then(cats => {
            setCategories(cats)
        })
    }, [])

    useEffect(() => {
        const processing = docs.filter(d => d.status === 'processing')
        if (processing.length === 0) {
            if (pollingRef.current) window.clearInterval(pollingRef.current)
            return
        }
        pollingRef.current = window.setInterval(async () => {
            const updates = await Promise.all(processing.map(d => fetchIngestionStatus(d.id)))
            setDocs(prev => prev.map(d => {
                const updated = updates.find(u => u.id === d.id)
                return updated ?? d
            }))
        }, 3000)
        return () => {
            if (pollingRef.current) window.clearInterval(pollingRef.current)
        }
    }, [docs])

    const handleUpload = async () => {
        if (!selectedFile) return
        setUploading(true)
        setShowUpload(false)
        setSelectedFile(null)
        try {
            const { id } = await uploadDocument(selectedFile, selectedKB)
            const newDoc: Document = {
                id,
                name: selectedFile.name,
                version: 'v1',
                updatedAt: new Date().toISOString().slice(0, 10),
                status: 'processing',
                knowledgeBase: selectedKB,
                sizeBytes: selectedFile.size,
            }
            setDocs(prev => [newDoc, ...prev])
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return
        await deleteDocument(id)
        setDocs(prev => prev.filter(d => d.id !== id))
        setSelectedDocs(prev => prev.filter(d => d !== id))
    }

    const handleBulkMove = async (kb: string) => {
        if (selectedDocs.length === 0) return
        try {
            await bulkUpdateDocuments(selectedDocs, kb)
            setDocs(prev => prev.map(d =>
                selectedDocs.includes(d.id) ? { ...d, knowledgeBase: kb } : d
            ))
            setSelectedDocs([])
        } catch (err) {
            console.error(err)
            alert('Failed to move documents')
        }
    }

    const handleBulkDelete = async () => {
        if (confirm(`Delete ${selectedDocs.length} documents?`)) {
            try {
                await Promise.all(selectedDocs.map(id => deleteDocument(id)))
                setDocs(prev => prev.filter(d => !selectedDocs.includes(d.id)))
                setSelectedDocs([])
            } catch (err) {
                console.error(err)
                alert('Failed to delete some documents')
            }
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedDocs(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSelectAll = (filteredIds: string[]) => {
        if (selectedDocs.length === filteredIds.length) {
            setSelectedDocs([])
        } else {
            setSelectedDocs(filteredIds)
        }
    }

    const handleSummarize = async (id: string) => {
        setSummarizing(id)
        try {
            const res = await summarizeDocument(id)
            setSummary(res)
        } catch (err) {
            console.error(err)
            alert('Failed to summarize document')
        } finally {
            setSummarizing(null)
        }
    }

    const handleCompare = async () => {
        if (selectedForCompare.length !== 2) return
        setComparing(true)
        try {
            const res = await compareDocuments(selectedForCompare[0], selectedForCompare[1])
            setComparison(res)
        } catch (err) {
            console.error(err)
            alert('Failed to compare documents')
        } finally {
            setComparing(false)
        }
    }

    const toggleCompareSelect = (id: string) => {
        setSelectedForCompare(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-2)
        )
    }

    const clearFilters = () => setSearchParams({})

    return {
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
    }
}
