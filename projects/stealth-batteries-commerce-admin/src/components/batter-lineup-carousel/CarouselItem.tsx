'use client'

import { CarouselItemProps } from './types'
import { BatteryProduct } from './BatteryProduct'
import { AccessoryProduct } from './AccessoryProduct'

export function CarouselItem({
  item,
  index,
  activeIndex,
  isTransitioning,
  getItemStyle,
  totalItems,
}: CarouselItemProps) {
  const isActive = index === activeIndex
  const distanceFromActive = Math.min(
    Math.abs(index - activeIndex),
    Math.abs(index - activeIndex - totalItems),
    Math.abs(index - activeIndex + totalItems),
  )

  // Calculate z-index and blur based on distance
  const getDepthClasses = () => {
    if (isActive) return 'z-30 blur-none'
    if (distanceFromActive === 1) return 'z-20 blur-[0.3px]'
    if (distanceFromActive === 2) return 'z-10 blur-[0.6px]'
    return 'z-0 blur-[1px]'
  }

  // Calculate vertical offset to prevent hiding behind static graphic
  const getVerticalOffset = () => {
    if (isActive) return 0
    if (distanceFromActive <= 2) return 0
    // Move items up gradually based on distance
    return Math.min(distanceFromActive * 20, 80)
  }

  // Calculate rotation angle with wrap-around handling
  const getRotationAngle = () => {
    let angleDiff = (index - activeIndex + totalItems) % totalItems
    if (angleDiff > totalItems / 2) {
      angleDiff -= totalItems
    }
    return angleDiff * 3 // 3 degrees per item
  }

  // Calculate scale based on distance with larger nearby items
  const getScale = () => {
    if (isActive) return 1
    if (distanceFromActive === 1) return 0.65 // 65% size for adjacent items
    if (distanceFromActive === 2) return 0.55 // 55% size for items two steps away
    // For further items, create a smooth scale reduction from 70% down
    return Math.max(0.5, 0.7 - (distanceFromActive - 2) * 0.15)
  }

  const baseStyle = getItemStyle(index)
  const scale = getScale()
  const yOffset = getVerticalOffset()
  const rotationAngle = getRotationAngle()

  return (
    <div
      key={item.id}
      className={`carousel-item absolute transition-all duration-500 ease-in-out transform-gpu ${getDepthClasses()} ${
        isActive
          ? 'w-[360px] mb-64 md:mb-48 h-[360px] sm:w-[420px] sm:h-[420px] md:w-[580px] md:h-[580px] lg:w-[600px] lg:h-[600px] mt-20'
          : 'w-[180px] h-[180px] sm:w-[210px] sm:h-[210px] md:w-[290px] md:h-[290px] lg:w-[340px] lg:h-[340px]'
      }`}
      style={{
        ...baseStyle,
        transform: `${baseStyle.transform} scale(${scale}) translateY(-${yOffset}px)`,
        perspective: '1500px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transform: `
            rotateY(${rotationAngle}deg) 
            translateZ(${isActive ? '50px' : Math.max(0, 50 - distanceFromActive * 10)}px)
          `,
        }}
      >
        {'isBattery' in item && item.isBattery ? (
          <BatteryProduct item={item} isActive={isActive} />
        ) : (
          <AccessoryProduct item={item} isActive={isActive} />
        )}
      </div>
    </div>
  )
}
