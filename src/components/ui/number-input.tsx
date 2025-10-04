import React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  onEnter?: () => void;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, onEnter, allowEmpty = true, min, max, ...props }, ref) => {
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
        // Validar min/max si están definidos
        if (min !== undefined && numericValue < min) {
          return; // No actualizar si está por debajo del mínimo
        }
        if (max !== undefined && numericValue > max) {
          return; // No actualizar si está por encima del máximo
        }
        onChange(inputValue);
      } else if (inputValue === '') {
        // Permitir borrar completamente
        onChange('');
      }
      // Si no es un número válido, no actualizar el valor
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Manejar Enter
      if (e.key === 'Enter') {
        e.preventDefault();
        if (onEnter) {
          onEnter();
        }
        return;
      }
      
      // Permitir teclas de navegación y control
      if (
        ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
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
