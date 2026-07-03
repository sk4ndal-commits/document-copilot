import { Document } from '../../../services/api'
import { StatusBadge } from './StatusBadge'
import { formatBytes } from '../utils/formatBytes'

interface DocumentItemProps {
    doc: Document;
    isSelected: boolean;
    onToggleSelect: () => void;
    isCompareSelected: boolean;
    onToggleCompareSelect: () => void;
    onSummarize: () => void;
    summarizing: boolean;
    onDelete: () => void;
}

export function DocumentItem({
    doc,
    isSelected,
    onToggleSelect,
    isCompareSelected,
    onToggleCompareSelect,
    onSummarize,
    summarizing,
    onDelete
}: DocumentItemProps) {
    return (
        <div
            className={`flex justify-between items-center py-4 border-b border-gray-100 gap-4 transition-colors duration-150 ${
                isCompareSelected ? 'bg-gray-50' : ''
            } ${isSelected ? 'bg-brand-light/20' : ''}`}
        >
            <div className="flex items-center flex-1 min-w-0">
                <input
                    type="checkbox"
                    className="mx-3 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    checked={isSelected}
                    onChange={onToggleSelect}
                />
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{doc.name}</span>
                    <span className="text-[10px] text-gray-500">
                        {doc.knowledgeBase} · {doc.version} · {doc.updatedAt}
                        {doc.sizeBytes != null && ` · ${formatBytes(doc.sizeBytes)}`}
                        {doc.pageCount != null && ` · ${doc.pageCount} pages`}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={doc.status} />
                <div className="flex gap-2">
                    <button
                        title={isCompareSelected ? "Deselect for comparison" : "Select for comparison"}
                        onClick={onToggleCompareSelect}
                        className={`p-1.5 rounded transition-colors duration-150 ${
                            isCompareSelected
                                ? 'bg-gray-900 text-white'
                                : 'bg-transparent text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        ⚖️
                    </button>
                    <button
                        title="Summarize document"
                        onClick={onSummarize}
                        disabled={summarizing || doc.status !== 'ready'}
                        className="p-1.5 bg-transparent border-none text-gray-400 rounded transition-colors duration-150 hover:text-brand hover:bg-brand-light disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {summarizing ? '…' : '📝'}
                    </button>
                    <button
                        title="Delete document"
                        onClick={onDelete}
                        className="p-1.5 bg-transparent border-none text-gray-400 rounded transition-colors duration-150 hover:text-red-600 hover:bg-red-50"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    )
}
