import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cpfMask' })
export class CpfMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}

@Pipe({ name: 'cnpjMask' })
export class CnpjMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}

@Pipe({ name: 'phoneMask' })
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    value = value.replace(/\D/g, ''); // remove tudo que não for número

    if (value.length === 11) {
      // celular com 9 dígitos
      return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 10) {
      // celular com 8 dígitos
      return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (value.length === 9) {
      // só número sem DDD
      return value.replace(/(\d{5})(\d{4})/, '$1-$2');
    } else if (value.length === 8) {
      return value.replace(/(\d{4})(\d{4})/, '$1-$2');
    }

    return value; 
  }
}