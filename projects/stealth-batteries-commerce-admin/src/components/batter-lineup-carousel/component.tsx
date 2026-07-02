'use client'

import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react'
import Image from 'next/image'
import { CarouselItem } from './CarouselItem'
import { CarouselNavigation } from './CarouselNavigation'
import { CarouselProduct } from './types'
import batteriesData from './batteries.json'

const SLIDE_INTERVAL = 3000
const TRANSITION_DURATION = 500

export default function CircularCarousel() {
  const [items, setItems] = useState<CarouselProduct[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearAutoScrollTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoScroll = useCallback(() => {
    clearAutoScrollTimer()

    timerRef.current = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true)
        setActiveIndex((prev) => (prev + 1) % items.length)
        setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION)
      }
    }, SLIDE_INTERVAL)
  }, [items.length, isTransitioning, clearAutoScrollTimer])

  useEffect(() => {
    setItems(batteriesData.items as CarouselProduct[])
    setIsInitialized(true)

    return () => clearAutoScrollTimer()
  }, [clearAutoScrollTimer])

  useEffect(() => {
    if (isInitialized && items.length > 0) {
      startAutoScroll()
    }
    return () => clearAutoScrollTimer()
  }, [isInitialized, items.length, startAutoScroll, clearAutoScrollTimer])

  const handleSlide = useCallback(
    (direction: 'next' | 'prev') => {
      if (!isTransitioning) {
        setIsTransitioning(true)
        clearAutoScrollTimer()

        setActiveIndex((prevIndex) => {
          if (direction === 'next') {
            return (prevIndex + 1) % items.length
          }
          return (prevIndex - 1 + items.length) % items.length
        })

        setTimeout(() => {
          setIsTransitioning(false)
          startAutoScroll()
        }, TRANSITION_DURATION)
      }
    },
    [isTransitioning, items.length, clearAutoScrollTimer, startAutoScroll],
  )

  const getItemStyle = useCallback(
    (index: number): CSSProperties => {
      if (!isInitialized) return { opacity: 0 }

      const radiusX = 825
      const radiusY = 180
      const centerZ = -200

      // Calculate the shortest angular distance between current index and active index
      let angleDiff = (index - activeIndex + items.length) % items.length
      if (angleDiff > items.length / 2) {
        angleDiff -= items.length
      }
      const angle = angleDiff * (360 / items.length)
      const radian = (angle * Math.PI) / 180

      const x = Math.sin(radian) * radiusX
      const y = Math.cos(radian) * radiusY
      const z = Math.cos(radian) * centerZ

      const distanceFromActive = Math.min(
        Math.abs(index - activeIndex),
        Math.abs(index - activeIndex - items.length),
        Math.abs(index - activeIndex + items.length),
      )

      // Enhanced scale calculation for nearby items
      let scale
      if (index === activeIndex) {
        scale = 1
      } else if (distanceFromActive === 1) {
        scale = 0.85 // 85% size for adjacent items
      } else if (distanceFromActive === 2) {
        scale = 0.75 // 75% size for items two steps away
      } else {
        // Smooth reduction for further items
        scale = Math.max(0.5, 0.7 - (distanceFromActive - 2) * 0.15)
      }

      const maxDistance = items.length / 2
      const zIndex = Math.round(((Math.cos(radian) + 1) / 5 + (index === activeIndex ? 1 : 0)) * 5)

      return {
        transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`,
        opacity: 1 - (distanceFromActive / maxDistance) * 0.6,
        zIndex,
        pointerEvents: index === activeIndex ? 'auto' : ('none' as const),
        transition: `all ${TRANSITION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`,
      }
    },
    [activeIndex, items.length, isInitialized],
  )

  if (!isInitialized) return null

  return (
    <div className="relative w-full h-[500px] md:h-[1025px] 3xl:h-[1325px] bg-transparent -mt-12 lg:-mt-40 2xl:mb-40">
      <div className="carousel-container absolute w-full h-full" style={{ zIndex: 1 }}>
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="text-center self-start md:mt-32">
            <h2 className="text-6xl md:text-8xl xl:text-[125px] font-apotek-extended font-black text-center italic text-primary dark:text-white">
              THE LINE UP
            </h2>
            <p className="text-center text-xl md:text-2xl xl:text-[28px] font-noto font-bold capitalize italic text-foreground/80 dark:text-white">
              Expect the Best, Get the Best!
            </p>
          </div>

          {items.map((item, index) => (
            <CarouselItem
              key={item.id}
              item={item}
              index={index}
              activeIndex={activeIndex}
              isTransitioning={isTransitioning}
              totalItems={items.length}
              getItemStyle={getItemStyle}
            />
          ))}

          {/* Dot circles background */}
          <div
            className="absolute w-full aspect-square md:w-[700px] md:h-[700px] left-1/2 top-[76%] md:top-[68%] -translate-x-1/2 -translate-y-1/2 -mt-4"
            style={{ zIndex: 1 }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/assets/dot-circles.png"
                alt="dot-circles"
                width={600}
                height={600}
                className="relative w-full h-full object-contain"
                priority
              />
              <div className="absolute w-4/6 h-4/6 bg-black rounded-full"></div>
            </div>
          </div>

          <CarouselNavigation
            onPrevClick={() => handleSlide('prev')}
            onNextClick={() => handleSlide('next')}
            isTransitioning={isTransitioning}
          />
        </div>
      </div>
    </div>
  )
}
