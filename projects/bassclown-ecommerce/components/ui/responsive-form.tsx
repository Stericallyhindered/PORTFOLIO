'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useResponsive, useResponsiveValue, touchTargets } from '@/lib/responsive-utils';
import { Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';

// Form Container
interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
  layout?: 'stack' | 'grid';
  spacing?: 'sm' | 'md' | 'lg';
  onSubmit?: (e: React.FormEvent) => void;
}

export function ResponsiveForm({
  children,
  className,
  layout = 'stack',
  spacing = 'md',
  onSubmit
}: ResponsiveFormProps) {
  const { deviceType } = useResponsive();

  const formSpacing = useResponsiveValue({
    mobile: spacing === 'sm' ? '1rem' : spacing === 'md' ? '1.5rem' : '2rem',
    tablet: spacing === 'sm' ? '1.25rem' : spacing === 'md' ? '1.75rem' : '2.25rem',
    desktop: spacing === 'sm' ? '1.5rem' : spacing === 'md' ? '2rem' : '2.5rem'
  }, '1.5rem');

  const formClasses = cn(
    'w-full',
    layout === 'stack' ? 'flex flex-col' : 'grid',
    layout === 'grid' && {
      'grid-cols-1': deviceType === 'mobile',
      'grid-cols-2': deviceType === 'tablet',
      'grid-cols-3': deviceType === 'desktop'
    },
    className
  );

  const style = {
    gap: formSpacing
  };

  return (
    <form className={formClasses} style={style} onSubmit={onSubmit}>
      {children}
    </form>
  );
}

// Form Field Container
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  fullWidth?: boolean;
}

export function FormField({
  children,
  className,
  label,
  error,
  hint,
  required = false,
  fullWidth = true
}: FormFieldProps) {
  const { deviceType } = useResponsive();

  const fieldSpacing = useResponsiveValue({
    mobile: '0.5rem',
    tablet: '0.625rem',
    desktop: '0.75rem'
  }, '0.5rem');

  const fieldClasses = cn(
    'flex flex-col',
    {
      'w-full': fullWidth,
      'w-auto': !fullWidth
    },
    className
  );

  const style = {
    gap: fieldSpacing
  };

  return (
    <div className={fieldClasses} style={style}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <div className="flex items-center text-xs text-red-600">
          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Responsive Input
interface ResponsiveInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  error?: boolean;
  success?: boolean;
}

export const ResponsiveInput = forwardRef<HTMLInputElement, ResponsiveInputProps>(
  ({ className, size = 'md', variant = 'default', error, success, ...props }, ref) => {
    const { deviceType } = useResponsive();

    const inputHeight = useResponsiveValue({
      mobile: size === 'sm' ? '44px' : size === 'md' ? '48px' : '56px',
      tablet: size === 'sm' ? '40px' : size === 'md' ? '44px' : '52px',
      desktop: size === 'sm' ? '36px' : size === 'md' ? '40px' : '48px'
    }, '40px');

    const inputPadding = useResponsiveValue({
      mobile: size === 'sm' ? '8px 12px' : size === 'md' ? '12px 16px' : '16px 20px',
      tablet: size === 'sm' ? '6px 10px' : size === 'md' ? '10px 14px' : '14px 18px',
      desktop: size === 'sm' ? '4px 8px' : size === 'md' ? '8px 12px' : '12px 16px'
    }, '8px 12px');

    const fontSize = useResponsiveValue({
      mobile: '16px', // Prevents zoom on iOS
      tablet: '14px',
      desktop: '14px'
    }, '14px');

    const baseClasses = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
      filled: 'border-transparent bg-gray-100 focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
      outline: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-500'
    };

    const stateClasses = {
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
    };

    const inputClasses = cn(
      baseClasses,
      variantClasses[variant],
      {
        [stateClasses.error]: error,
        [stateClasses.success]: success
      },
      className
    );

    const style = {
      height: inputHeight,
      padding: inputPadding,
      fontSize
    };

    return (
      <input
        ref={ref}
        className={inputClasses}
        style={style}
        {...props}
      />
    );
  }
);

ResponsiveInput.displayName = 'ResponsiveInput';

// Responsive Textarea
interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  error?: boolean;
  success?: boolean;
  autoResize?: boolean;
}

export const ResponsiveTextarea = forwardRef<HTMLTextAreaElement, ResponsiveTextareaProps>(
  ({ className, size = 'md', variant = 'default', error, success, autoResize = false, ...props }, ref) => {
    const { deviceType } = useResponsive();

    const textareaPadding = useResponsiveValue({
      mobile: size === 'sm' ? '8px 12px' : size === 'md' ? '12px 16px' : '16px 20px',
      tablet: size === 'sm' ? '6px 10px' : size === 'md' ? '10px 14px' : '14px 18px',
      desktop: size === 'sm' ? '4px 8px' : size === 'md' ? '8px 12px' : '12px 16px'
    }, '8px 12px');

    const fontSize = useResponsiveValue({
      mobile: '16px', // Prevents zoom on iOS
      tablet: '14px',
      desktop: '14px'
    }, '14px');

    const minHeight = useResponsiveValue({
      mobile: size === 'sm' ? '80px' : size === 'md' ? '100px' : '120px',
      tablet: size === 'sm' ? '70px' : size === 'md' ? '90px' : '110px',
      desktop: size === 'sm' ? '60px' : size === 'md' ? '80px' : '100px'
    }, '80px');

    const baseClasses = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed resize-y';

    const variantClasses = {
      default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
      filled: 'border-transparent bg-gray-100 focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
      outline: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-500'
    };

    const stateClasses = {
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
    };

    const textareaClasses = cn(
      baseClasses,
      variantClasses[variant],
      {
        [stateClasses.error]: error,
        [stateClasses.success]: success,
        'resize-none': autoResize
      },
      className
    );

    const style = {
      padding: textareaPadding,
      fontSize,
      minHeight
    };

    return (
      <textarea
        ref={ref}
        className={textareaClasses}
        style={style}
        {...props}
      />
    );
  }
);

ResponsiveTextarea.displayName = 'ResponsiveTextarea';

// Responsive Select
interface ResponsiveSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  error?: boolean;
  success?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const ResponsiveSelect = forwardRef<HTMLSelectElement, ResponsiveSelectProps>(
  ({ className, size = 'md', variant = 'default', error, success, options, placeholder, ...props }, ref) => {
    const { deviceType } = useResponsive();

    const selectHeight = useResponsiveValue({
      mobile: size === 'sm' ? '44px' : size === 'md' ? '48px' : '56px',
      tablet: size === 'sm' ? '40px' : size === 'md' ? '44px' : '52px',
      desktop: size === 'sm' ? '36px' : size === 'md' ? '40px' : '48px'
    }, '40px');

    const selectPadding = useResponsiveValue({
      mobile: size === 'sm' ? '8px 32px 8px 12px' : size === 'md' ? '12px 36px 12px 16px' : '16px 40px 16px 20px',
      tablet: size === 'sm' ? '6px 28px 6px 10px' : size === 'md' ? '10px 32px 10px 14px' : '14px 36px 14px 18px',
      desktop: size === 'sm' ? '4px 24px 4px 8px' : size === 'md' ? '8px 28px 8px 12px' : '12px 32px 12px 16px'
    }, '8px 28px 8px 12px');

    const fontSize = useResponsiveValue({
      mobile: '16px', // Prevents zoom on iOS
      tablet: '14px',
      desktop: '14px'
    }, '14px');

    const baseClasses = 'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white';

    const variantClasses = {
      default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
      filled: 'border-transparent bg-gray-100 focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
      outline: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-500'
    };

    const stateClasses = {
      error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-500'
    };

    const selectClasses = cn(
      baseClasses,
      variantClasses[variant],
      {
        [stateClasses.error]: error,
        [stateClasses.success]: success
      },
      className
    );

    const style = {
      height: selectHeight,
      padding: selectPadding,
      fontSize,
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 8px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px'
    };

    return (
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          style={style}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

ResponsiveSelect.displayName = 'ResponsiveSelect';

// Password Input with Toggle
interface PasswordInputProps extends Omit<ResponsiveInputProps, 'type'> {
  showToggle?: boolean;
}

export function PasswordInput({
  showToggle = true,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  if (!showToggle) {
    return <ResponsiveInput type="password" className={className} {...props} />;
  }

  return (
    <div className="relative">
      <ResponsiveInput
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-12', className)}
        {...props}
      />
      <button
        type="button"
        onClick={togglePassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
        style={{ minHeight: touchTargets.minimum, minWidth: touchTargets.minimum }}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

// Checkbox with responsive sizing
interface ResponsiveCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

export const ResponsiveCheckbox = forwardRef<HTMLInputElement, ResponsiveCheckboxProps>(
  ({ className, size = 'md', label, description, ...props }, ref) => {
    const { deviceType } = useResponsive();

    const checkboxSize = useResponsiveValue({
      mobile: size === 'sm' ? '16px' : size === 'md' ? '20px' : '24px',
      tablet: size === 'sm' ? '14px' : size === 'md' ? '18px' : '22px',
      desktop: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'
    }, '16px');

    const checkboxClasses = cn(
      'rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0',
      className
    );

    const style = {
      width: checkboxSize,
      height: checkboxSize
    };

    if (!label) {
      return (
        <input
          ref={ref}
          type="checkbox"
          className={checkboxClasses}
          style={style}
          {...props}
        />
      );
    }

    return (
      <div className="flex items-start">
        <input
          ref={ref}
          type="checkbox"
          className={checkboxClasses}
          style={style}
          {...props}
        />
        <div className="ml-3">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

ResponsiveCheckbox.displayName = 'ResponsiveCheckbox';

// Radio button with responsive sizing
interface ResponsiveRadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

export const ResponsiveRadio = forwardRef<HTMLInputElement, ResponsiveRadioProps>(
  ({ className, size = 'md', label, description, ...props }, ref) => {
    const { deviceType } = useResponsive();

    const radioSize = useResponsiveValue({
      mobile: size === 'sm' ? '16px' : size === 'md' ? '20px' : '24px',
      tablet: size === 'sm' ? '14px' : size === 'md' ? '18px' : '22px',
      desktop: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'
    }, '16px');

    const radioClasses = cn(
      'border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0',
      className
    );

    const style = {
      width: radioSize,
      height: radioSize
    };

    if (!label) {
      return (
        <input
          ref={ref}
          type="radio"
          className={radioClasses}
          style={style}
          {...props}
        />
      );
    }

    return (
      <div className="flex items-start">
        <input
          ref={ref}
          type="radio"
          className={radioClasses}
          style={style}
          {...props}
        />
        <div className="ml-3">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

ResponsiveRadio.displayName = 'ResponsiveRadio';

// Form Button
interface FormButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export function FormButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick
}: FormButtonProps) {
  const { deviceType } = useResponsive();

  const buttonHeight = useResponsiveValue({
    mobile: size === 'sm' ? '44px' : size === 'md' ? '48px' : '56px',
    tablet: size === 'sm' ? '40px' : size === 'md' ? '44px' : '52px',
    desktop: size === 'sm' ? '36px' : size === 'md' ? '40px' : '48px'
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
    ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
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

  const style = {
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
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      )}
      {children}
    </button>
  );
}

// Form Actions Container
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
  stack?: boolean;
}

export function FormActions({
  children,
  className,
  align = 'right',
  stack = false
}: FormActionsProps) {
  const { isMobile } = useResponsive();

  const shouldStack = stack || isMobile;

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  const actionsClasses = cn(
    'flex',
    shouldStack ? 'flex-col space-y-2' : `flex-row space-x-3 ${alignClasses[align]}`,
    className
  );

  return (
    <div className={actionsClasses}>
      {children}
    </div>
  );
} 