import { RefObject } from 'react'

interface UploadModalProps {
    show: boolean;
    onClose: () => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    selectedKB: string;
    setSelectedKB: (kb: string) => void;
    categories: any[];
    handleUpload: () => void;
    uploading: boolean;
}

export function UploadModal({
    show,
    onClose,
    fileInputRef,
    selectedFile,
    setSelectedFile,
    selectedKB,
    setSelectedKB,
    categories,
    handleUpload,
    uploading
}: UploadModalProps) {
    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[200]">
            <div className="bg-bg rounded-xl shadow-lg p-6 w-[440px] max-w-[calc(100vw-2rem)]">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                    <button
                        className="bg-transparent border-none text-lg text-gray-500 p-1 rounded-sm transition-colors duration-150 hover:text-gray-900 hover:bg-gray-100"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <label className="block border-2 border-dashed border-border rounded-lg py-6 px-4 text-center cursor-pointer mb-4 transition-colors duration-150 hover:border-brand hover:bg-brand-light">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.xlsx,.pptx"
                        className="hidden"
                        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                    {selectedFile
                        ? <span className="text-sm text-gray-900 font-medium">📄 {selectedFile.name}</span>
                        : <span className="text-sm text-gray-500">Click to select a file (.pdf, .docx, .xlsx, .pptx)</span>
                    }
                </label>

                <div className="flex items-center gap-3 mb-5">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Legal Document Type</label>
                    <select
                        className="flex-1 p-2 border-[1.5px] border-border rounded-md text-sm bg-bg text-gray-900 focus:outline-none focus:border-brand"
                        value={selectedKB}
                        onChange={e => setSelectedKB(e.target.value)}
                    >
                        <option value="">All Legal Documents</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        className="px-4 py-2 bg-transparent border border-border rounded-md text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    )
}
