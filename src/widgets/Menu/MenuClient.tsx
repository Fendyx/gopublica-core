'use client'
import { useBranch } from '@/entities/branch/BranchContext'
import { useEffect, useState } from 'react'
import { useTenant } from '@/entities/tenant/TenantContext'
import Menu from '@/widgets/Menu'
import type { MenuItem } from '@/entities/menu-item/types'

export default function MenuClient() {
  const { selectedBranch } = useBranch()
  const tenant = useTenant()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const tenantId = selectedBranch?.tenantId ?? tenant?.tenantId
  const menuStyle = tenant?.theme?.menuStyle ?? 'grid'

  useEffect(() => {
    if (!selectedBranch || !tenantId) return
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/menu?tenantId=${tenantId}&branchId=${selectedBranch._id}`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setItems(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [selectedBranch, tenantId])

  if (loading) return <div className="text-center py-10">Загрузка меню...</div>
  return <Menu items={items} menuStyle={menuStyle} />
}