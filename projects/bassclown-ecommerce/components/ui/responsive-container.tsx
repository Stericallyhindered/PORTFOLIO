'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsive, useResponsiveValue, containerConfig } from '@/lib/responsive-utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  center?: boolean;
  fluid?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  center = true,
  fluid = false
}: ResponsiveContainerProps) {
  const { deviceType } = useResponsive();

  // Get responsive padding
  const containerPadding = useResponsiveValue({
    mobile: padding === 'none' ? '0' : padding === 'sm' ? '0.5rem' : padding === 'md' ? '1rem' : '1.5rem',
    tablet: padding === 'none' ? '0' : padding === 'sm' ? '0.75rem' : padding === 'md' ? '1.5rem' : '2rem',
    desktop: padding === 'none' ? '0' : padding === 'sm' ? '1rem' : padding === 'md' ? '2rem' : '3rem'
  }, '1rem');

  const containerClasses = cn(
    'w-full',
    {
      'mx-auto': center,
      [`max-w-${maxWidth}`]: !fluid && maxWidth !== 'none',
      'max-w-none': fluid || maxWidth === 'none'
    },
    className
  );

  const style = {
    padding: containerPadding
  };

  return (
    <div className={containerClasses} style={style}>
      {children}
    </div>
  );
}

// Responsive Grid Component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  minItemWidth?: string;
}

export function ResponsiveGrid({
  children,
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  minItemWidth
}: ResponsiveGridProps) {
  const { deviceType } = useResponsive();

  const gridColumns = useResponsiveValue({
    mobile: columns.mobile || 1,
    tablet: columns.tablet || 2,
    desktop: columns.desktop || 3
  }, 1);

  const gridGap = useResponsiveValue({
    mobile: gap === 'sm' ? '0.5rem' : gap === 'md' ? '1rem' : '1.5rem',
    tablet: gap === 'sm' ? '0.75rem' : gap === 'md' ? '1.25rem' : '2rem',
    desktop: gap === 'sm' ? '1rem' : gap === 'md' ? '1.5rem' : '2.5rem'
  }, '1rem');

  const gridClasses = cn(
    'grid',
    className
  );

  const style: React.CSSProperties = {
    gridTemplateColumns: minItemWidth 
      ? `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      : `repeat(${gridColumns}, 1fr)`,
    gap: gridGap
  };

  return (
    <div className={gridClasses} style={style}>
      {children}
    </div>
  );
}

// Responsive Stack Component
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    mobile?: 'row' | 'column';
    tablet?: 'row' | 'column';
    desktop?: 'row' | 'column';
  };
  spacing?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function ResponsiveStack({
  children,
  className,
  direction = { mobile: 'column', tablet: 'column', desktop: 'row' },
  spacing = 'md',
  align = 'start',
  justify = 'start'
}: ResponsiveStackProps) {
  const flexDirection = useResponsiveValue({
    mobile: direction.mobile || 'column',
    tablet: direction.tablet || 'column',
    desktop: direction.desktop || 'row'
  }, 'column');

  const gap = useResponsiveValue({
    mobile: spacing === 'sm' ? '0.5rem' : spacing === 'md' ? '1rem' : '1.5rem',
    tablet: spacing === 'sm' ? '0.75rem' : spacing === 'md' ? '1.25rem' : '2rem',
    desktop: spacing === 'sm' ? '1rem' : spacing === 'md' ? '1.5rem' : '2.5rem'
  }, '1rem');

  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  }[align];

  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly'
  }[justify];

  const stackClasses = cn(
    'flex',
    className
  );

  const style: React.CSSProperties = {
    flexDirection,
    gap,
    alignItems,
    justifyContent
  };

  return (
    <div className={stackClasses} style={style}>
      {children}
    </div>
  );
}

// Responsive Text Component
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'small';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export function ResponsiveText({
  children,
  className,
  variant = 'body',
  as: Component = 'p',
  color,
  weight = 'normal'
}: ResponsiveTextProps) {
  const { deviceType } = useResponsive();

  // Typography configurations
  const typography = {
    heading1: {
      mobile: { fontSize: '1.875rem', lineHeight: '2.25rem' },
      tablet: { fontSize: '2.25rem', lineHeight: '2.5rem' },
      desktop: { fontSize: '3rem', lineHeight: '1' }
    },
    heading2: {
      mobile: { fontSize: '1.5rem', lineHeight: '2rem' },
      tablet: { fontSize: '1.875rem', lineHeight: '2.25rem' },
      desktop: { fontSize: '2.25rem', lineHeight: '2.5rem' }
    },
    heading3: {
      mobile: { fontSize: '1.25rem', lineHeight: '1.75rem' },
      tablet: { fontSize: '1.5rem', lineHeight: '2rem' },
      desktop: { fontSize: '1.875rem', lineHeight: '2.25rem' }
    },
    body: {
      mobile: { fontSize: '0.875rem', lineHeight: '1.25rem' },
      tablet: { fontSize: '1rem', lineHeight: '1.5rem' },
      desktop: { fontSize: '1rem', lineHeight: '1.5rem' }
    },
    small: {
      mobile: { fontSize: '0.75rem', lineHeight: '1rem' },
      tablet: { fontSize: '0.875rem', lineHeight: '1.25rem' },
      desktop: { fontSize: '0.875rem', lineHeight: '1.25rem' }
    }
  };

  const typeStyle = useResponsiveValue(typography[variant], typography.body.desktop);

  const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }[weight];

  const textClasses = cn(className);

  const style: React.CSSProperties = {
    fontSize: typeStyle.fontSize,
    lineHeight: typeStyle.lineHeight,
    fontWeight,
    color
  };

  return (
    <Component className={textClasses} style={style}>
      {children}
    </Component>
  );
}

// Responsive Image Component
interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall' | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = { mobile: '100vw', tablet: '50vw', desktop: '33vw' },
  aspectRatio = 'video',
  objectFit = 'cover',
  priority = false,
  placeholder,
  blurDataURL
}: ResponsiveImageProps) {
  const { deviceType } = useResponsive();

  const imageSize = useResponsiveValue(sizes, '100vw');

  // Calculate aspect ratio
  const getAspectRatio = () => {
    if (typeof aspectRatio === 'number') return aspectRatio;
    
    const ratios = {
      square: 1,
      video: 16/9,
      wide: 21/9,
      tall: 3/4
    };
    
    return ratios[aspectRatio] || ratios.video;
  };

  const ratio = getAspectRatio();
  const paddingTop = `${(1 / ratio) * 100}%`;

  const containerClasses = cn(
    'relative overflow-hidden',
    className
  );

  const imageClasses = cn(
    'absolute inset-0 w-full h-full transition-opacity duration-300'
  );

  return (
    <div className={containerClasses} style={{ paddingTop }}>
      <img
        src={src}
        alt={alt}
        className={imageClasses}
        style={{ objectFit }}
        loading={priority ? 'eager' : 'lazy'}
        sizes={imageSize}
      />
    </div>
  );
}

// Responsive Button Component
interface ResponsiveButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button'
}: ResponsiveButtonProps) {
  const { deviceType } = useResponsive();

  const buttonHeight = useResponsiveValue({
    mobile: size === 'sm' ? '40px' : size === 'md' ? '48px' : '56px',
    tablet: size === 'sm' ? '36px' : size === 'md' ? '44px' : '52px',
    desktop: size === 'sm' ? '32px' : size === 'md' ? '40px' : '48px'
  }, '40px');

  const buttonPadding = useResponsiveValue({
    mobile: size === 'sm' ? '8px 16px' : size === 'md' ? '12px 24px' : '16px 32px',
    tablet: size === 'sm' ? '6px 12px' : size === 'md' ? '10px 20px' : '14px 28px',
    desktop: size === 'sm' ? '4px 8px' : size === 'md' ? '8px 16px' : '12px 24px'
  }, '8px 16px');

  const fontSize = useResponsiveValue({
    mobile: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px',
    tablet: size === 'sm' ? '13px' : size === 'md' ? '15px' : '17px',
    desktop: size === 'sm' ? '12px' : size === 'md' ? '14px' : '16px'
  }, '14px');

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500'
  };

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    {
      'w-full': fullWidth,
      'cursor-not-allowed': disabled || loading
    },
    className
  );

  const style: React.CSSProperties = {
    height: buttonHeight,
    padding: buttonPadding,
    fontSize
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      style={style}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      ) : null}
      {children}
    </button>
  );
} 