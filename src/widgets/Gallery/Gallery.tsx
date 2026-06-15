// src/widgets/Gallery/Gallery.tsx
import type { GalleryItem } from '@/entities/gallery/types'
import GalleryBento from './GalleryBento'
import GalleryMasonry from './GalleryMasonry'

interface Props {
  images: GalleryItem[]
  galleryStyle?: 'bento' | 'masonry'
  title?: string
  subtitle?: string
}

export default function Gallery({ images, galleryStyle = 'bento', title = '', subtitle = '' }: Props) {
  if (!images.length) return null

  if (galleryStyle === 'masonry') {
    return <GalleryMasonry images={images} title={title} subtitle={subtitle} />
  }
  return <GalleryBento images={images} title={title} subtitle={subtitle} />
}