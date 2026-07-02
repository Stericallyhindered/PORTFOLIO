import { SVGProps } from 'react'
import { clsx } from 'clsx'

export const LightningBolt = ({
  width = 24,
  height = 24,
  className,
  ...props
}: Omit<SVGProps<SVGSVGElement>, 'color'>) => {
  // If className contains fill- or stroke-, don't apply fill attribute
  const hasFillOrStroke = className?.match(/(fill-|stroke-)/)

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 75"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx('scale-y-[-1] scale-x-[-1]', className)}
      {...props}
    >
      <path
        d="M15,-71.706C14.905,-71.988 14.647,-72.163 14.325,-72.114C14.033,-72.067 13.817,-71.813 13.817,-71.515L13.817,-42.591L0.372,-42.591C0.177,-42.591 -0.007,-42.496 -0.121,-42.338C-0.234,-42.18 -0.266,-41.976 -0.202,-41.79L13.849,0.044C13.933,0.294 14.165,0.457 14.423,0.457C14.455,0.457 14.486,0.455 14.521,0.45C14.813,0.402 15.029,0.149 15.029,-0.147L15.15,-29.072L28.258,-29.072C28.453,-29.072 28.635,-29.166 28.751,-29.324C28.864,-29.482 28.896,-29.685 28.835,-29.871L15,-71.706Z"
        {...(!hasFillOrStroke && { fill: 'currentColor' })}
        fillRule="nonzero"
        transform="translate(0, 72)"
      />
    </svg>
  )
}

export default LightningBolt
