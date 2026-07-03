import { DocumentStatus } from '../../../services/api'

export function StatusBadge({ status }: { status: DocumentStatus }) {
    const badgeClasses = {
        ready: 'bg-green-100 text-green-700',
        processing: 'bg-yellow-100 text-yellow-700',
        failed: 'bg-red-100 text-red-700',
    }
    return (
        <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm whitespace-nowrap ${badgeClasses[status]}`}>
            {status === 'ready' && '✓ Ready'}
            {status === 'processing' && '⟳ Processing…'}
            {status === 'failed' && '✗ Failed'}
        </span>
    )
}
