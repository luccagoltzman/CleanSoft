import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appCpfCnpjMask]',
  standalone: true
})
export class CpfCnpjMaskDirective {
  @Input() documentType: 'CPF' | 'CNPJ' | 'auto' = 'auto';

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    if (this.documentType === 'auto') {
      // Detecta automaticamente se é CPF ou CNPJ baseado no número de dígitos
      this.documentType = value.length <= 11 ? 'CPF' : 'CNPJ';
    }

    // Limita a quantidade de dígitos
    if (this.documentType === 'CPF') {
      value = value.substring(0, 11);
      value = this.applyCpfMask(value);
    } else {
      value = value.substring(0, 14);
      value = this.applyCnpjMask(value);
    }

    input.value = value;
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');
    
    if (this.documentType === 'auto') {
      this.documentType = value.length <= 11 ? 'CPF' : 'CNPJ';
    }

    if (this.documentType === 'CPF' && value.length === 11) {
      input.value = this.applyCpfMask(value);
    } else if (this.documentType === 'CNPJ' && value.length === 14) {
      input.value = this.applyCnpjMask(value);
    }
  }

  private applyCpfMask(value: string): string {
    if (value.length <= 3) {
      return value;
    } else if (value.length <= 6) {
      return value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    } else if (value.length <= 9) {
      return value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    }
  }

  private applyCnpjMask(value: string): string {
    if (value.length <= 2) {
      return value;
    } else if (value.length <= 5) {
      return value.replace(/(\d{2})(\d{1,3})/, '$1.$2');
    } else if (value.length <= 8) {
      return value.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (value.length <= 12) {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else {
      return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    }
  }
}
