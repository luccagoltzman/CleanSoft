# Diretivas de Máscara - CleanSoft

Este diretório contém as diretivas de máscara automática para os campos do sistema CleanSoft.

## Diretivas Disponíveis

### 1. CPF/CNPJ Mask (`appCpfCnpjMask`)

Aplica máscara automática em campos de CPF ou CNPJ.

**Uso:**
```html
<input type="text" formControlName="document" appCpfCnpjMask>
```

**Parâmetros:**
- `documentType`: 'CPF' | 'CNPJ' | 'auto' (padrão: 'auto')

**Exemplos de Máscara:**
- CPF: `000.000.000-00`
- CNPJ: `00.000.000/0000-00`

**Detecção Automática:**
- Se `documentType="auto"`, a diretiva detecta automaticamente se é CPF (≤11 dígitos) ou CNPJ (>11 dígitos)

### 2. Phone Mask (`appPhoneMask`)

Aplica máscara automática em campos de telefone.

**Uso:**
```html
<input type="text" formControlName="phone" appPhoneMask>
```

**Formato da Máscara:**
- `(11) 99999-9999` (celular)
- `(11) 9999-9999` (fixo)

### 3. Currency Mask (`appCurrencyMask`)

Aplica máscara automática em campos de valores monetários.

**Uso:**
```html
<input type="text" formControlName="price" appCurrencyMask>
```

**Parâmetros:**
- `decimalPlaces`: número de casas decimais (padrão: 2)
- `currencySymbol`: símbolo da moeda (padrão: 'R$ ')

**Formato da Máscara:**
- `R$ 1.234,56`

## Como Implementar

### 1. Importar as Diretivas

```typescript
import { CpfCnpjMaskDirective, PhoneMaskDirective, CurrencyMaskDirective } from '../../directives';
```

### 2. Adicionar aos Imports do Componente

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    CpfCnpjMaskDirective,
    PhoneMaskDirective,
    CurrencyMaskDirective
  ],
  // ...
})
```

### 3. Aplicar no HTML

```html
<!-- Campo CPF/CNPJ -->
<input type="text" formControlName="document" appCpfCnpjMask>

<!-- Campo Telefone -->
<input type="text" formControlName="phone" appPhoneMask>

<!-- Campo Preço -->
<input type="text" formControlName="price" appCurrencyMask>
```

## Funcionalidades

### Máscara em Tempo Real
- As máscaras são aplicadas automaticamente enquanto o usuário digita
- Caracteres não numéricos são removidos automaticamente
- Formatação é aplicada em tempo real

### Validação
- Os campos mantêm a validação do Angular Reactive Forms
- As máscaras não interferem na validação dos campos
- Os valores são formatados ao perder o foco (blur)

### Responsividade
- As diretivas funcionam com todos os tipos de input
- Compatível com formulários reativos e template-driven
- Suporte a componentes standalone do Angular

## Exemplos de Uso

### Formulário de Funcionário
```html
<div class="form-group">
  <label for="cpf">CPF *</label>
  <input type="text" id="cpf" formControlName="cpf" appCpfCnpjMask documentType="CPF">
</div>

<div class="form-group">
  <label for="phone">Telefone *</label>
  <input type="text" id="phone" formControlName="phone" appPhoneMask>
</div>

<div class="form-group">
  <label for="salary">Salário *</label>
  <input type="text" id="salary" formControlName="salary" appCurrencyMask>
</div>
```

### Formulário de Cliente
```html
<div class="form-group">
  <label for="document">Documento *</label>
  <input type="text" id="document" formControlName="document" 
         appCpfCnpjMask [documentType]="customerForm.get('documentType')?.value">
</div>
```

## Benefícios

1. **Experiência do Usuário**: Formatação automática torna a digitação mais intuitiva
2. **Consistência**: Todos os campos seguem o mesmo padrão de formatação
3. **Validação**: Mantém a validação existente dos formulários
4. **Manutenibilidade**: Código centralizado e reutilizável
5. **Performance**: Diretivas leves e eficientes

## Notas Técnicas

- As diretivas são standalone e podem ser importadas individualmente
- Funcionam com Angular 17+ e componentes standalone
- Não interferem na funcionalidade existente dos formulários
- Suportam todos os navegadores modernos
