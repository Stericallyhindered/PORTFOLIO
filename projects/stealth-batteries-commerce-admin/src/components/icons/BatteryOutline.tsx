import { SVGProps } from 'react'

export const BatteryOutline = ({
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
      viewBox="0 0 301 227"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <g transform="matrix(8.33333,0,0,8.33333,-8098.51,-23198)">
        <path
          d="M972.454,2810.29L972.454,2788.29L1007.9,2788.29L1007.9,2787.66L1004.41,2787.66L1004.41,2783.76L997.484,2783.76L997.484,2787.66L982.776,2787.66L982.776,2783.76L975.851,2783.76L975.851,2787.66L971.821,2787.66L971.821,2810.92L1007.9,2810.92L1007.9,2810.29L972.454,2810.29Z"
          {...(!hasFillOrStroke && { fill: 'currentColor' })}
          fillRule="nonzero"
        />
      </g>
    </svg>
  )
}

export default BatteryOutline
