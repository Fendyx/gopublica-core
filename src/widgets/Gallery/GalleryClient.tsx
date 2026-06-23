'use client'
import { useBranch } from '@/entities/branch/BranchContext'
import { useEffect, useState } from 'react'
import { useTenant } from '@/entities/tenant/TenantContext'
import Gallery from '@/widgets/Gallery/Gallery'
import type { GalleryItem } from '@/entities/gallery/types'

export default function GalleryClient() {
  const { selectedBranch } = useBranch()
  const tenant = useTenant()
  const [images, setImages] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)

  const tenantId = selectedBranch?.tenantId ?? tenant?.tenantId
  const galleryStyle = tenant?.theme?.galleryStyle ?? 'bento' // <-- исправлено

  useEffect(() => {
    if (!selectedBranch || !tenantId) return
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/saas/gallery?tenantId=${tenantId}&branchId=${selectedBranch._id}`
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setImages(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [selectedBranch, tenantId])

  if (loading) return <div className="text-center py-10">Загрузка галереи...</div>
  return <Gallery images={images} galleryStyle={galleryStyle as 'bento' | 'masonry'} />
}