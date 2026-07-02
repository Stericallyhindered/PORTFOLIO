'use client'

export default function HeaderWithLines({
  title,
  color,
  children,
  strokeWidth = 5,
  subtitle,
}: {
  title?: string
  color: string
  children?: React.ReactNode
  strokeWidth?: number
  subtitle?: string
}) {
  return (
    <div className="w-screen relative mx-auto mb-12 pb-12 -ml-[50vw] left-1/2 right-1/2 z-0 flex flex-col items-center justify-center">
      <div className="flex items-center justify-center w-full">
        {/* Left Lines */}
        <div className="flex-1 h-[32px] xl:h-[42px] relative">
          <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
            <defs>
              <pattern
                id={`diagonalLines${title}`}
                width="13"
                height="13"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(15)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="13"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill={color}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#diagonalLines${title})`} />
          </svg>
        </div>

        {/* Center Content */}
        {children ? (
          children
        ) : (
          <div className="text-center px-12 shrink-0">
            <h2
              className={`text-primary text-6xl xl:text-8xl font-apotek-extended font-black italic`}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Right Lines */}
        <div className="flex-1 h-[32px] xl:h-[42px] relative ">
          <svg width="100%" height="100%" className="absolute inset-0" preserveAspectRatio="none">
            <defs>
              <pattern
                id={`diagonalLines${title}2`}
                width="13"
                height="13"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(15)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="13"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  fill={color}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#diagonalLines${title}2)`} />
          </svg>
        </div>
      </div>
      {subtitle && (
        <p className="text-primary text-3xl font-apotek-extended font-black italic capitalize">
          {subtitle}
        </p>
      )}
    </div>
  )
}
