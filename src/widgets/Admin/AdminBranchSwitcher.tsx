'use client'
import { useBranch } from '@/entities/branch/BranchContext'
import { ChevronDown, Store, Check, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function AdminBranchSwitcher() {
  const { branches, selectedBranch, setBranch, loading } = useBranch()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-text-tertiary">
        <Loader2 size={16} className="animate-spin" />
        <span>Загрузка...</span>
      </div>
    )
  }

  if (branches.length === 0) return null

  const currentName = selectedBranch?.name || branches[0]?.name || 'Нет филиала'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
          isOpen
            ? 'bg-surface-hover border-border text-text-primary'
            : 'bg-surface-page border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        }`}
      >
        <Store size={16} className="text-primary" />
        <span className="max-w-[150px] truncate">{currentName}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 text-text-tertiary ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[220px] bg-surface-card shadow-dropdown rounded-xl border border-border overflow-hidden z-50 py-1">
          {branches.map((branch) => (
            <button
              key={branch._id}
              onClick={() => {
                setBranch(branch);
                setIsOpen(false);
              }}
              className="flex flex-col w-full text-left px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors group"
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`font-medium ${
                    selectedBranch?._id === branch._id
                      ? 'text-primary'
                      : 'text-text-primary group-hover:text-primary transition-colors'
                  }`}
                >
                  {branch.name}
                </span>
                {selectedBranch?._id === branch._id && (
                  <Check size={14} className="text-primary shrink-0" />
                )}
              </div>
              {branch.city && (
                <span className="text-xs text-text-tertiary mt-0.5 truncate w-full group-hover:text-text-secondary transition-colors">
                  {branch.city}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}