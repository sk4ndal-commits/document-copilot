import { Document } from '../../../services/api'
import { DocumentItem } from './DocumentItem'

interface DocumentListProps {
    filteredDocs: Document[];
    selectedDocs: string[];
    toggleSelect: (id: string) => void;
    handleSelectAll: () => void;
    selectedForCompare: string[];
    toggleCompareSelect: (id: string) => void;
    handleSummarize: (id: string) => void;
    summarizing: string | null;
    handleDelete: (id: string) => void;
}

export function DocumentList({
    filteredDocs,
    selectedDocs,
    toggleSelect,
    handleSelectAll,
    selectedForCompare,
    toggleCompareSelect,
    handleSummarize,
    summarizing,
    handleDelete
}: DocumentListProps) {
    return (
        <div className="flex flex-col">
            <div className="flex items-center mb-2 px-2">
                <input
                    type="checkbox"
                    className="mr-3 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    checked={filteredDocs.length > 0 && selectedDocs.length === filteredDocs.length}
                    onChange={handleSelectAll}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Document Name
                </span>
            </div>

            {filteredDocs.map(doc => (
                <DocumentItem
                    key={doc.id}
                    doc={doc}
                    isSelected={selectedDocs.includes(doc.id)}
                    onToggleSelect={() => toggleSelect(doc.id)}
                    isCompareSelected={selectedForCompare.includes(doc.id)}
                    onToggleCompareSelect={() => toggleCompareSelect(doc.id)}
                    onSummarize={() => handleSummarize(doc.id)}
                    summarizing={summarizing === doc.id}
                    onDelete={() => handleDelete(doc.id)}
                />
            ))}
        </div>
    )
}
