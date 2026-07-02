import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
  initialValue?: string
}

export default function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) onSearch(value.trim())
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        className="w-full px-4 py-3 text-base border-[1.5px] border-border rounded-lg bg-bg text-gray-900 transition-all duration-150 placeholder:text-gray-400 hover:border-gray-400 focus:outline-none focus:border-brand focus:ring-3 focus:ring-brand/10"
      />
    </div>
  )
}
