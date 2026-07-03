interface BulkActionBarProps {
    selectedDocsCount: number;
    categories: any[];
    handleBulkMove: (kb: string) => void;
    handleBulkDelete: () => void;
}

export function BulkActionBar({
    selectedDocsCount,
    categories,
    handleBulkMove,
    handleBulkDelete
}: BulkActionBarProps) {
    if (selectedDocsCount === 0) return null

    return (
        <div
            className="bg-brand-light border border-brand/20 rounded-lg p-3 mb-5 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-brand">
                {selectedDocsCount} documents selected
            </span>
            <div className="flex gap-3">
                <select
                    className="p-1.5 border border-brand/30 rounded-md text-xs bg-white text-gray-900 focus:outline-none"
                    onChange={(e) => handleBulkMove(e.target.value)}
                    value=""
                >
                    <option value="" disabled>Move to category...</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>
                <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-md text-xs font-medium hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
        </div>
    )
}
