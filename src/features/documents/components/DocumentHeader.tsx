interface DocumentHeaderProps {
    kbFilter: string | null;
    clearFilters: () => void;
    selectedForCompareCount: number;
    handleCompare: () => void;
    comparing: boolean;
    setShowUpload: (show: boolean) => void;
}

export function DocumentHeader({
    kbFilter,
    clearFilters,
    selectedForCompareCount,
    handleCompare,
    comparing,
    setShowUpload
}: DocumentHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-5">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Document Center</h2>
                {kbFilter && (
                    <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-500 mr-2 flex items-center">
                            <span className="mr-1">📁</span> Category: <strong>{kbFilter}</strong>
                        </span>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-brand hover:underline cursor-pointer flex items-center"
                        >
                            <span className="mr-1">✕</span> Clear filter
                        </button>
                    </div>
                )}
            </div>
            <div className="flex gap-3 items-center">
                {selectedForCompareCount === 2 && (
                    <button
                        className="bg-gray-900 text-white border-none rounded-md px-4 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
                        onClick={handleCompare}
                        disabled={comparing}
                    >
                        {comparing ? 'Comparing...' : 'Compare Selected'}
                    </button>
                )}
                <button
                    className="px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover"
                    onClick={() => setShowUpload(true)}
                >
                    + Upload Document
                </button>
            </div>
        </div>
    )
}
