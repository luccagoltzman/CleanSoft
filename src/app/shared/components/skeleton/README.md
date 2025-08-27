# Sistema de Skeleton Loading

Este sistema substitui o spinner global por um loading mais elegante e moderno usando skeletons que simulam o conteúdo real.

## Componentes Disponíveis

### 1. SkeletonComponent
Componente base para criar elementos skeleton individuais.

```typescript
import { SkeletonComponent } from '../../shared/components';

// No template:
<app-skeleton [config]="{ type: 'text', width: '100%', height: '16px' }"></app-skeleton>
```

**Tipos disponíveis:**
- `text` - Para texto simples
- `title` - Para títulos
- `avatar` - Para avatares/imagens circulares
- `button` - Para botões
- `card` - Para cards
- `table-row` - Para linhas de tabela
- `table-cell` - Para células de tabela
- `stat-card` - Para cards de estatísticas

### 2. StatsSkeletonComponent
Componente específico para estatísticas em grid.

```typescript
import { StatsSkeletonComponent } from '../../shared/components';

// No template:
<app-stats-skeleton [statsCount]="4"></app-stats-skeleton>
```

### 3. TableSkeletonComponent
Componente específico para tabelas.

```typescript
import { TableSkeletonComponent } from '../../shared/components';

// No template:
<app-table-skeleton 
  [headers]="['Nome', 'Email', 'Telefone']"
  [rows]="5"
  [cells]="3">
</app-table-skeleton>
```

## Como Implementar

### 1. Adicionar Loading State
```typescript
export class MeuComponente {
  isLoading = false;
  
  loadData() {
    this.isLoading = true;
    this.api.getData().subscribe({
      next: (data) => {
        this.data = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }
}
```

### 2. Usar no Template
```html
<!-- Conteúdo real -->
<div class="content" *ngIf="!isLoading">
  <!-- Seu conteúdo aqui -->
</div>

<!-- Skeleton -->
<app-stats-skeleton *ngIf="isLoading" [statsCount]="3"></app-stats-skeleton>
```

## Vantagens do Skeleton Loading

1. **Mais elegante** - Não interrompe o fluxo visual
2. **Melhor UX** - Usuário vê a estrutura do conteúdo
3. **Percepção de velocidade** - Parece mais rápido que um spinner
4. **Responsivo** - Se adapta ao layout real
5. **Consistente** - Mantém o design durante o carregamento

## Exemplos de Uso

### Dashboard
```html
<!-- Estatísticas -->
<div class="stats" *ngIf="!isLoading">
  <!-- Cards de estatísticas -->
</div>
<app-stats-skeleton *ngIf="isLoading" [statsCount]="6"></app-stats-skeleton>
```

### Lista de Itens
```html
<!-- Tabela real -->
<table *ngIf="!isLoading">
  <!-- Dados da tabela -->
</table>

<!-- Skeleton da tabela -->
<app-table-skeleton 
  *ngIf="isLoading"
  [headers]="['Nome', 'Email', 'Ações']"
  [rows]="8"
  [cells]="3">
</app-table-skeleton>
```

### Formulário
```html
<!-- Formulário real -->
<form *ngIf="!isLoading">
  <!-- Campos do formulário -->
</form>

<!-- Skeleton do formulário -->
<div *ngIf="isLoading">
  <app-skeleton [config]="{ type: 'title', width: '60%', height: '24px' }"></app-skeleton>
  <app-skeleton [config]="{ type: 'text', width: '100%', height: '40px' }"></app-skeleton>
  <app-skeleton [config]="{ type: 'button', width: '120px', height: '40px' }"></app-skeleton>
</div>
```

## Personalização

Você pode personalizar os skeletons usando CSS customizado:

```css
/* Personalizar animação */
.skeleton-item {
  animation-duration: 2s; /* Mais lento */
}

/* Personalizar cores */
.skeleton-item {
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
}
```

## Migração do Spinner

Para migrar de um spinner para skeleton:

1. **Remover** `SpinnerComponent` dos imports
2. **Adicionar** `isLoading = false` no componente
3. **Substituir** `<app-spinner>` por `<app-skeleton>`
4. **Gerenciar** o estado de loading manualmente

## Boas Práticas

1. **Sempre** definir `isLoading = false` no `ngOnInit`
2. **Usar** `*ngIf="!isLoading"` para o conteúdo real
3. **Usar** `*ngIf="isLoading"` para o skeleton
4. **Definir** `isLoading = true` antes de cada requisição
5. **Definir** `isLoading = false` no `next` e `error` do subscribe
