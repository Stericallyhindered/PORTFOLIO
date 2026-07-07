import { useState, useEffect } from 'react';

// Breakpoint definitions following Tailwind CSS conventions
export const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Device type detection
export const deviceTypes = {
  mobile: { min: 0, max: breakpoints.sm - 1 },
  tablet: { min: breakpoints.sm, max: breakpoints.lg - 1 },
  desktop: { min: breakpoints.lg, max: Infinity }
} as const;

export type DeviceType = keyof typeof deviceTypes;

/**
 * Hook to get current screen size and device type
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < breakpoints.sm;
  const isTablet = windowSize.width >= breakpoints.sm && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;
  
  const currentBreakpoint = getCurrentBreakpoint(windowSize.width);
  const deviceType = getCurrentDeviceType(windowSize.width);

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    deviceType,
    isBreakpointUp: (breakpoint: Breakpoint) => windowSize.width >= breakpoints[breakpoint],
    isBreakpointDown: (breakpoint: Breakpoint) => windowSize.width < breakpoints[breakpoint],
    isBreakpointBetween: (min: Breakpoint, max: Breakpoint) => 
      windowSize.width >= breakpoints[min] && windowSize.width < breakpoints[max]
  };
}

/**
 * Hook for responsive values based on breakpoints
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint | DeviceType, T>>, defaultValue: T): T {
  const { currentBreakpoint, deviceType } = useResponsive();

  // Check device type first
  if (values[deviceType] !== undefined) {
    return values[deviceType]!;
  }

  // Check current breakpoint
  if (values[currentBreakpoint] !== undefined) {
    return values[currentBreakpoint]!;
  }

  // Check smaller breakpoints in descending order
  const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return defaultValue;
}

/**
 * Get current breakpoint based on width
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

/**
 * Get current device type based on width
 */
export function getCurrentDeviceType(width: number): DeviceType {
  if (width < deviceTypes.mobile.max) return 'mobile';
  if (width < deviceTypes.tablet.max) return 'tablet';
  return 'desktop';
}

/**
 * Responsive grid configuration
 */
export const responsiveGridConfig = {
  mobile: {
    columns: 1,
    gap: '0.5rem',
    padding: '1rem'
  },
  tablet: {
    columns: 2,
    gap: '1rem',
    padding: '1.5rem'
  },
  desktop: {
    columns: 3,
    gap: '1.5rem',
    padding: '2rem'
  }
};

/**
 * Responsive typography scale
 */
export const responsiveTypography = {
  heading1: {
    mobile: { fontSize: '1.875rem', lineHeight: '2.25rem' }, // 30px
    tablet: { fontSize: '2.25rem', lineHeight: '2.5rem' },   // 36px
    desktop: { fontSize: '3rem', lineHeight: '1' }           // 48px
  },
  heading2: {
    mobile: { fontSize: '1.5rem', lineHeight: '2rem' },      // 24px
    tablet: { fontSize: '1.875rem', lineHeight: '2.25rem' }, // 30px
    desktop: { fontSize: '2.25rem', lineHeight: '2.5rem' }   // 36px
  },
  heading3: {
    mobile: { fontSize: '1.25rem', lineHeight: '1.75rem' },  // 20px
    tablet: { fontSize: '1.5rem', lineHeight: '2rem' },      // 24px
    desktop: { fontSize: '1.875rem', lineHeight: '2.25rem' } // 30px
  },
  body: {
    mobile: { fontSize: '0.875rem', lineHeight: '1.25rem' }, // 14px
    tablet: { fontSize: '1rem', lineHeight: '1.5rem' },      // 16px
    desktop: { fontSize: '1rem', lineHeight: '1.5rem' }      // 16px
  },
  small: {
    mobile: { fontSize: '0.75rem', lineHeight: '1rem' },     // 12px
    tablet: { fontSize: '0.875rem', lineHeight: '1.25rem' }, // 14px
    desktop: { fontSize: '0.875rem', lineHeight: '1.25rem' } // 14px
  }
};

/**
 * Responsive spacing scale
 */
export const responsiveSpacing = {
  xs: { mobile: '0.25rem', tablet: '0.5rem', desktop: '0.5rem' },
  sm: { mobile: '0.5rem', tablet: '0.75rem', desktop: '1rem' },
  md: { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' },
  lg: { mobile: '1.5rem', tablet: '2rem', desktop: '3rem' },
  xl: { mobile: '2rem', tablet: '3rem', desktop: '4rem' },
  '2xl': { mobile: '3rem', tablet: '4rem', desktop: '6rem' }
};

/**
 * Generate responsive CSS classes
 */
export function generateResponsiveClasses(
  property: string,
  values: Partial<Record<Breakpoint | DeviceType, string | number>>
): string {
  const classes: string[] = [];

  // Add base value (mobile-first)
  if (values.mobile || values.xs) {
    classes.push(`${property}-${values.mobile || values.xs}`);
  }

  // Add breakpoint-specific values
  Object.entries(values).forEach(([key, value]) => {
    if (key !== 'mobile' && key !== 'xs' && breakpoints[key as Breakpoint]) {
      classes.push(`${key}:${property}-${value}`);
    }
  });

  return classes.join(' ');
}

/**
 * Responsive container configurations
 */
export const containerConfig = {
  maxWidths: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  padding: {
    mobile: '1rem',
    tablet: '1.5rem',
    desktop: '2rem'
  }
};

/**
 * Touch-friendly sizing for mobile devices
 */
export const touchTargets = {
  minimum: '44px', // iOS/Android minimum
  comfortable: '48px',
  large: '56px'
};

/**
 * Responsive image configurations
 */
export const responsiveImageSizes = {
  avatar: {
    mobile: '32px',
    tablet: '40px',
    desktop: '48px'
  },
  thumbnail: {
    mobile: '80px',
    tablet: '120px',
    desktop: '160px'
  },
  card: {
    mobile: '100%',
    tablet: '300px',
    desktop: '400px'
  },
  hero: {
    mobile: '100vw',
    tablet: '100vw',
    desktop: '1200px'
  }
};

/**
 * Responsive navigation configurations
 */
export const navigationConfig = {
  mobile: {
    type: 'drawer',
    position: 'left',
    width: '280px',
    overlay: true
  },
  tablet: {
    type: 'sidebar',
    position: 'left',
    width: '240px',
    overlay: false
  },
  desktop: {
    type: 'horizontal',
    position: 'top',
    height: '64px',
    sticky: true
  }
};

/**
 * Media query helpers
 */
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.sm - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg}px)`,
  
  // Breakpoint-specific queries
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
  
  // Utility queries
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',
  highDpi: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  darkMode: '@media (prefers-color-scheme: dark)'
};

/**
 * Responsive form configurations
 */
export const responsiveFormConfig = {
  input: {
    height: {
      mobile: '48px',
      tablet: '44px',
      desktop: '40px'
    },
    fontSize: {
      mobile: '16px', // Prevents zoom on iOS
      tablet: '14px',
      desktop: '14px'
    }
  },
  button: {
    height: {
      mobile: touchTargets.comfortable,
      tablet: touchTargets.comfortable,
      desktop: '40px'
    },
    padding: {
      mobile: '12px 24px',
      tablet: '10px 20px',
      desktop: '8px 16px'
    }
  }
};

/**
 * Performance optimization for responsive images
 */
export function generateResponsiveImageSrcSet(
  baseUrl: string,
  sizes: number[]
): string {
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateImageSizes(
  breakpointSizes: Partial<Record<Breakpoint | DeviceType, string>>
): string {
  const sizeQueries: string[] = [];

  Object.entries(breakpointSizes).forEach(([breakpoint, size]) => {
    const bp = breakpoint as Breakpoint;
    if (breakpoints[bp]) {
      sizeQueries.push(`(min-width: ${breakpoints[bp]}px) ${size}`);
    }
  });

  // Add default size (mobile)
  const defaultSize = breakpointSizes.xs || (breakpointSizes as any).mobile || '100vw';
  sizeQueries.push(defaultSize);

  return sizeQueries.join(', ');
} 