import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appCurrencyMask]',
  standalone: true
})
export class CurrencyMaskDirective {
  @Input() currencySymbol: string = 'R$ ';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // só números

    if (!value) {
      input.value = '';
      return;
    }

    // Converte para centavos
    const numberValue = parseInt(value, 10);

    // Divide em reais e centavos
    let formatted = (numberValue / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    input.value = this.currencySymbol + formatted;
  }

  @HostListener('blur')
  onBlur() {
    const input = this.el.nativeElement;
    if (input.value && !input.value.startsWith(this.currencySymbol)) {
      input.value = this.currencySymbol + input.value;
    }
  }

  @HostListener('focus')
  onFocus() {
    const input = this.el.nativeElement;
    // Remove símbolo da moeda ao focar
    input.value = input.value.replace(this.currencySymbol, '').trim();
  }
}
