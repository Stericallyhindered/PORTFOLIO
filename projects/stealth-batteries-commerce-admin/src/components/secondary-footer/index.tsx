import { RoundLogo } from '../RoundLogo'
import { LightningBolt } from '@/components/icons/LightningBolt'

export const SecondaryFooter: React.FC = () => {
  return (
    <>
      <div className="lg:container grid gap-8 pt-16 px-4 lg:px-0">
        <div className="text-center border-t border-gray-800 pt-8">
          <h2 className="text-primary text-4xl font-bold mb-2 font-apotek-extended">
            <div className="flex md:flex-row flex-col md:flex-wrap items-center w-full justify-evenly">
              <span>Trusted</span>
              <span className="text-black mx-2 dark:text-white">
                <LightningBolt width={32} height={32} className="fill-black dark:fill-white" />
              </span>
              Dependable
              <span className="text-black mx-2 dark:text-white">
                <LightningBolt width={32} height={32} className="fill-black dark:fill-white" />
              </span>{' '}
              Everytime
            </div>
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto font-noto font-semibold">
            When it comes to powering your adventures on the water, reliability isn&apos;t just a
            feature, it&apos;s a necessity. Professional anglers trust Stealth Batteries for our
            unmatched performance, advanced Lithium Iron Phosphate technology, and rigorous quality
            standards that ensure dependable power every time you hit the water.
          </p>
        </div>
        <div className="flex justify-center">
          <RoundLogo />
        </div>
      </div>
      {/* Bottom Full Width Lines */}
      <div className="w-full h-[26px] relative overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="diagonalLines3"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(15)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="currentColor"
                className="text-black/90 dark:text-[#3C4C5B]"
                strokeWidth="6"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonalLines3)" />
        </svg>
      </div>
    </>
  )
}
