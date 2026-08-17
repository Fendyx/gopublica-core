'use client'
import { useBranch } from '@/entities/branch/BranchContext'
import { ArrowDownToLine, ArrowUpFromLine, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'

export default function BranchCrossLink() {
  const { selectedBranch, branches, setBranch } = useBranch()
  const router = useRouter()
  const { locale } = useParams()

  if (!selectedBranch) return null

  const childBranches = branches.filter(
    (b) => b.parentBranchId === selectedBranch._id && b.isActive
  )

  const parentBranch = selectedBranch.parentBranchId
    ? branches.find((b) => b._id === selectedBranch.parentBranchId && b.isActive)
    : null

  if (childBranches.length === 0 && !parentBranch) return null

  // Функция для смены филиала со скроллом наверх
  const handleBranchSwitch = (branch: any) => {
    setBranch(branch);
    // Navigate to the new branch's root page (safe default, no sub-path preservation)
    router.push(`/${locale}/${branch.slug}`);
    // Плавно скроллим в самое начало страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col gap-6">
        
        {childBranches.map((child) => (
          <motion.div
            key={child._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-surface-card border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-5 text-center sm:text-left">
              <div className="w-14 h-14 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ArrowDownToLine size={28} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">
                  Odkryj coś nowego
                </h3>
                <p className="text-sm sm:text-base text-text-secondary">
                  Zejdź na dół do <strong className="text-text-primary">{child.name}</strong>
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleBranchSwitch(child)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-white transition-transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <MapPin size={18} />
              Przejdź do {child.name}
            </button>
          </motion.div>
        ))}

        {parentBranch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-surface-card border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-5 text-center sm:text-left">
              <div className="w-14 h-14 shrink-0 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary">
                <ArrowUpFromLine size={28} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-1">
                  Główna kawiarnia
                </h3>
                <p className="text-sm sm:text-base text-text-secondary">
                  Wróć na górę do <strong className="text-text-primary">{parentBranch.name}</strong>
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleBranchSwitch(parentBranch)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium border border-border bg-surface-page hover:bg-surface-hover text-text-primary transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
            >
              <MapPin size={18} />
              Wróć do {parentBranch.name}
            </button>
          </motion.div>
        )}

      </div>
    </section>
  )
}