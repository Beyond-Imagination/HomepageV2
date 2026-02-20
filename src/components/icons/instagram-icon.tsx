import { ComponentPropsWithoutRef, memo } from 'react'

type InstagramIconProps = ComponentPropsWithoutRef<'svg'>

export const InstagramIcon = memo(function InstagramIcon({
  className,
  ...props
}: InstagramIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      {...props}
    >
      <path d="M7.75 2C4.58 2 2 4.58 2 7.75v8.5C2 19.42 4.58 22 7.75 22h8.5C19.42 22 22 19.42 22 16.25v-8.5C22 4.58 19.42 2 16.25 2zm0 1.8h8.5a3.95 3.95 0 0 1 3.95 3.95v8.5a3.95 3.95 0 0 1-3.95 3.95h-8.5a3.95 3.95 0 0 1-3.95-3.95v-8.5A3.95 3.95 0 0 1 7.75 3.8m9.1 1.4a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10m0 1.8A3.2 3.2 0 1 1 8.8 12 3.2 3.2 0 0 1 12 8.8" />
    </svg>
  )
})
