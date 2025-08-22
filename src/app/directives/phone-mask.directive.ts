import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appPhoneMask]',
  standalone: true
})
export class PhoneMaskDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    
    value = this.applyPhoneMask(value);
    input.value = value;
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length >= 10) {
      input.value = this.applyPhoneMask(value);
    }
  }

  private applyPhoneMask(value: string): string {
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Aplica máscara baseada no número de dígitos
    if (value.length === 0) {
      return '';
    } else if (value.length <= 2) {
      return `(${value}`;
    } else if (value.length <= 6) {
      return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length <= 10) {
      return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    } else {
      return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
    }
  }
}
