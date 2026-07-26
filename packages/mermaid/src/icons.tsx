import React from 'react'

export const ZoomInIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" {...props}>
    <path
      d="M12 9H6M9 6V12M9 2C14.6 2 16 3.4 16 9C16 14.6 14.6 16 9 16C3.4 16 2 14.6 2 9C2 3.4 3.4 2 9 2Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export const ZoomOutIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" {...props}>
    <path
      d="M6.66667 9H11.3333M9 2C14.6 2 16 3.4 16 9C16 14.6 14.6 16 9 16C3.4 16 2 14.6 2 9C2 3.4 3.4 2 9 2Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export const ResetIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" {...props}>
    <path
      d="M2.04663 9.77802C2.23746 11.484 3.04863 13.0603 4.32586 14.2072C5.60309 15.3541 7.25729 15.9915 8.97386 15.9983C10.6904 16.0051 12.3496 15.3808 13.6359 14.244C14.9222 13.1073 15.7458 11.5375 15.9502 9.8331C16.1545 8.12871 15.7253 6.40867 14.7442 5.0001C13.7631 3.59152 12.2985 2.59267 10.6289 2.1935C8.95942 1.79433 7.20141 2.02269 5.68927 2.83515C4.17713 3.64762 3.01634 4.9875 2.42765 6.59999"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M2 2.78046V6.66843H5.88796M8.22074 9.00044C8.22074 9.20667 8.30266 9.40445 8.44849 9.55028C8.59432 9.69611 8.7921 9.77803 8.99833 9.77803C9.20456 9.77803 9.40234 9.69611 9.54817 9.55028C9.694 9.40445 9.77592 9.20667 9.77592 9.00044C9.77592 8.79421 9.694 8.59642 9.54817 8.4506C9.40234 8.30477 9.20456 8.22284 8.99833 8.22284C8.7921 8.22284 8.59432 8.30477 8.44849 8.4506C8.30266 8.59642 8.22074 8.79421 8.22074 9.00044Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)

export const ExpandIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 14 14"
    fill="none"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="m1 13 4 -4"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="M13 1 9 5"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="m1 1 4 4"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="M13 13 9 9"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="M13 5.00004c0.5 -1.50004 0.5 -2.50004 0 -4 -1.5 -0.500045 -2.5 -0.500059 -4 0"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="M1.00003 9c-0.500033 1.5 -0.500042 2.5 -0.00001 4 1.49998 0.5 2.49998 0.5 4 0"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="M1.00001 5.00004C0.5 3.5 0.5 2.5 1 1.00004c1.5 -0.500045 2.5 -0.500059 4 0"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.4}
      d="M13 9c0.5 1.5 0.5 2.5 0 4 -1.5 0.5 -2.5 0.5 -4.00002 0"
    />
  </svg>
)
