'use client'
import { useTenant } from '@/entities/tenant/TenantContext'
import HeroSplit from './HeroSplit'
import HeroCentered from './HeroCentered'
import HeroVideo from './HeroVideo'
import HeroSlider from './HeroSlider'
import HeroImageBackground from './HeroImageBackground'

export default function Hero() {
  const tenant = useTenant()
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