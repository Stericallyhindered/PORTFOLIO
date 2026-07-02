'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CarouselNavigationProps } from './types'

export function CarouselNavigation({
  onPrevClick,
  onNextClick,
  isTransitioning,
}: CarouselNavigationProps) {
  return (
    <>
      <Button
        className="absolute top-[68%] md:top-[65%] left-[14%] sm:left-[10%] md:left-[21%] transform hover:bg-transparent"
        style={{ zIndex: 99 }}
        onClick={onPrevClick}
        variant="ghost"
        size="icon"
        aria-label="Previous product"
        disabled={isTransitioning}
      >
        <ChevronLeft className="h-28 w-28 md:h-28 md:w-28 fill-primary stroke-primary hover:fill-primary/90 hover:stroke-primary/90" />
      </Button>
      <Button
        className="absolute top-[68%] md:top-[65%] right-[14%] sm:right-[10%] md:right-[21%] transform hover:bg-transparent"
        style={{ zIndex: 99 }}
        onClick={onNextClick}
        variant="ghost"
        size="icon"
        aria-label="Next product"
        disabled={isTransitioning}
      >
        <ChevronRight className="h-28 w-28 md:h-28 md:w-28 fill-primary stroke-primary hover:fill-primary/90 hover:stroke-primary/90" />
      </Button>
    </>
  )
}
