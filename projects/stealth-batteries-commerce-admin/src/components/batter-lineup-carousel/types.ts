export interface BaseProduct {
  id: number
  name: string
  title?: string
  link: string
  image: string
}

export interface Battery extends BaseProduct {
  voltage: string
  capacity: string
  isBattery: true
}

export interface Accessory extends BaseProduct {
  voltage?: string
  capacity?: string
  isBattery: false
  isCharger?: boolean
}

export type CarouselProduct = Battery | Accessory

export interface CarouselItemProps {
  item: CarouselProduct
  index: number
  activeIndex: number
  isTransitioning: boolean
  totalItems: number
  getItemStyle: (index: number) => React.CSSProperties
}

export interface CarouselNavigationProps {
  onPrevClick: () => void
  onNextClick: () => void
  isTransitioning: boolean
}

export interface ProductDisplayProps {
  item: CarouselProduct
  isActive: boolean
}
