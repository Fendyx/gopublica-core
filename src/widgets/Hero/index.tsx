'use client'
import { useTenant } from '@/entities/tenant/TenantContext'
// Импортируем компонент скелетона (у тебя он должен быть в ui)
import { Skeleton } from '@/components/ui/skeleton' 

import HeroSplit from './HeroSplit'
import HeroCentered from './HeroCentered'
import HeroVideo from './HeroVideo'
import HeroSlider from './HeroSlider'
import HeroImageBackground from './HeroImageBackground'

export default function Hero() {
  const tenant = useTenant()
  
  // ФИКС: Если tenant еще не загрузился, показываем скелетон (пустой блок нужной высоты)
  // Это уберет "мигание", когда стиль переключается с дефолтного на реальный
  if (!tenant) {
    return (
      <div className="w-full h-[600px] bg-gray-100 flex items-center justify-center animate-pulse">
         {/* Можно просто <Skeleton className="h-[600px] w-full" /> */}
         <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const style = tenant?.theme?.heroStyle ?? 'split'

  switch (style) {
    case 'centered': return <HeroCentered />
    case 'split':    return <HeroSplit />
    case 'video':    return <HeroVideo />
    case 'slider':   return <HeroSlider />
    case 'image-bg': return <HeroImageBackground />
    default:         return <HeroSplit />
  }
}