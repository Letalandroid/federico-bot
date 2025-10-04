import React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  allowEmpty?: boolean;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, allowEmpty = true, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Si está vacío y se permite, permitir el valor vacío
      if (inputValue === '' && allowEmpty) {
        onChange('');
        return;
      }
      
      // Verificar si es un número válido
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue) && isFinite(numericValue)) {
        onChange(inputValue);
      } else if (inputValue === '') {
        // Permitir borrar completamente
        onChange('');
      }
      // Si no es un número válido, no actualizar el valor
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir teclas de navegación y control
      if (
        ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
        (e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase()))
      ) {
        return;
      }
      
      // Permitir números, punto decimal y signo menos
      if (!/[\d.-]/.test(e.key)) {
        e.preventDefault();
      }
      
      // Evitar múltiples puntos decimales
      if (e.key === '.' && (value as string).includes('.')) {
        e.preventDefault();
      }
      
      // Evitar múltiples signos menos
      if (e.key === '-' && (value as string).includes('-')) {
        e.preventDefault();
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(className)}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
