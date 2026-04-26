import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    />
  );
}
