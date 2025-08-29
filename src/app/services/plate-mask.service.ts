import { Injectable } from '@angular/core';

export type PlateType = 'old' | 'mercosul' | 'auto';

export interface PlateValidation {
  isValid: boolean;
  type: 'old' | 'mercosul' | null;
  formatted: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlateMaskService {

  constructor() { }

  /**
   * Detecta automaticamente o tipo de placa baseado no input
   */
  detectPlateType(value: string): 'old' | 'mercosul' | null {
    if (!value) return null;
    
    // Remove tudo que não é letra ou número
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (clean.length < 4) return null;
    
    // Padrão antigo: 3 letras + 4 números (ABC1234)
    const oldPattern = /^[A-Z]{3}[0-9]{4}$/;
    
    // Padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números (ABC1D23)
    const mercosulPattern = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
    
    if (oldPattern.test(clean)) {
      return 'old';
    } else if (mercosulPattern.test(clean)) {
      return 'mercosul';
    }
    
    // Se tem 7 caracteres, tenta detectar pelo padrão parcial
    if (clean.length === 7) {
      const char4 = clean.charAt(3); // 4º caractere
      const char5 = clean.charAt(4); // 5º caractere
      
      // Se 4º é número e 5º é letra, provavelmente é Mercosul
      if (/[0-9]/.test(char4) && /[A-Z]/.test(char5)) {
        return 'mercosul';
      }
      // Se 4º é número e 5º também é número, provavelmente é padrão antigo
      else if (/[0-9]/.test(char4) && /[0-9]/.test(char5)) {
        return 'old';
      }
    }
    
    return null;
  }

  /**
   * Aplica máscara baseada no tipo de placa
   */
  applyMask(value: string, type: PlateType = 'auto'): string {
    if (!value) return '';
    
    // Remove tudo que não é letra ou número
    let clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Limita a 7 caracteres
    clean = clean.substring(0, 7);
    
    if (type === 'auto') {
      const detectedType = this.detectPlateType(clean);
      type = detectedType || 'old'; // Default para padrão antigo
    }
    
    if (type === 'mercosul') {
      return this.applyMercosulMask(clean);
    } else {
      return this.applyOldMask(clean);
    }
  }

  /**
   * Aplica máscara do padrão antigo: ABC-1234
   */
  private applyOldMask(clean: string): string {
    let result = '';
    
    for (let i = 0; i < clean.length && i < 7; i++) {
      if (i === 3) {
        result += '-';
      }
      result += clean[i];
    }
    
    return result;
  }

  /**
   * Aplica máscara do padrão Mercosul: ABC1D23
   */
  private applyMercosulMask(clean: string): string {
    // Padrão Mercosul não usa hífen, retorna como está
    return clean;
  }

  /**
   * Valida uma placa completa
   */
  validatePlate(value: string): PlateValidation {
    if (!value) {
      return {
        isValid: false,
        type: null,
        formatted: '',
        message: 'Placa é obrigatória'
      };
    }

    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const detectedType = this.detectPlateType(clean);
    
    if (!detectedType) {
      return {
        isValid: false,
        type: null,
        formatted: value,
        message: 'Formato de placa inválido'
      };
    }

    const formatted = this.applyMask(value, detectedType);
    
    return {
      isValid: true,
      type: detectedType,
      formatted: formatted,
      message: detectedType === 'old' ? 'Padrão antigo' : 'Padrão Mercosul'
    };
  }

  /**
   * Formata uma placa para exibição
   */
  formatPlate(value: string): string {
    const validation = this.validatePlate(value);
    return validation.formatted;
  }

  /**
   * Remove formatação da placa (apenas letras e números)
   */
  cleanPlate(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  /**
   * Verifica se uma placa está no padrão Mercosul
   */
  isMercosulPlate(value: string): boolean {
    const clean = this.cleanPlate(value);
    return this.detectPlateType(clean) === 'mercosul';
  }

  /**
   * Verifica se uma placa está no padrão antigo
   */
  isOldPlate(value: string): boolean {
    const clean = this.cleanPlate(value);
    return this.detectPlateType(clean) === 'old';
  }

  /**
   * Converte placa do padrão antigo para Mercosul (simulação)
   * Nota: Conversão real requer dados oficiais do Detran
   */
  convertOldToMercosul(oldPlate: string): string {
    const clean = this.cleanPlate(oldPlate);
    if (!this.isOldPlate(clean)) {
      return oldPlate;
    }

    // Esta é apenas uma simulação para demonstração
    // Na prática, a conversão requer consulta ao Detran
    const letters = clean.substring(0, 3);
    const numbers = clean.substring(3, 7);
    
    // Exemplo de conversão fictícia: ABC1234 -> ABC1A23
    const mercosulExample = letters + numbers[0] + 'A' + numbers.substring(2, 4);
    
    return mercosulExample;
  }

  /**
   * Obtém informações sobre o padrão da placa
   */
  getPlateInfo(value: string): { type: string; description: string; example: string } | null {
    const validation = this.validatePlate(value);
    
    if (!validation.type) return null;
    
    if (validation.type === 'old') {
      return {
        type: 'Padrão Antigo',
        description: 'Formato: 3 letras + hífen + 4 números',
        example: 'ABC-1234'
      };
    } else {
      return {
        type: 'Padrão Mercosul',
        description: 'Formato: 3 letras + 1 número + 1 letra + 2 números',
        example: 'ABC1D23'
      };
    }
  }
}
