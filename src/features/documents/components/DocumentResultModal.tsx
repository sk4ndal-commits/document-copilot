interface DocumentResultModalProps {
    title: string;
    content: string | null;
    onClose: () => void;
}

export function DocumentResultModal({
    title,
    content,
    onClose
}: DocumentResultModalProps) {
    if (!content) return null

    return (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[200]">
            <div className="bg-bg rounded-xl shadow-lg p-6 w-[440px] max-w-[calc(100vw-2rem)]">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        className="bg-transparent border-none text-lg text-gray-500 p-1 rounded-sm transition-colors duration-150 hover:text-gray-900 hover:bg-gray-100"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>
                <div className="my-4 max-h-[400px] overflow-y-auto p-3 bg-gray-50 rounded-md border border-border">
                    <pre className="whitespace-pre-wrap break-words font-inherit text-sm leading-relaxed text-gray-800 m-0">
                        {content}
                    </pre>
                </div>
                <div className="flex justify-end gap-3">
                    <button
                        className="px-5 py-2 bg-brand text-white border-none rounded-md text-sm font-medium transition-colors duration-150 hover:bg-brand-hover"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
