# 🚗 CleanSoft - Sistema de Gestão para Lava-Jato

<div align="center">

![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

**Sistema completo de gestão empresarial para lavanderias automotivas e centros de estética automotiva**

</div>

---

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [✨ Funcionalidades](#-funcionalidades)
- [🏗️ Arquitetura](#️-arquitetura)
- [🚀 Tecnologias](#-tecnologias)
- [📱 Screenshots](#-screenshots)
- [⚡ Instalação](#-instalação)
- [🔧 Configuração](#-configuração)
- [📊 Estrutura do Projeto](#-estrutura-do-projeto)
- [🎨 Componentes](#-componentes)
- [📈 Roadmap](#-roadmap)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

---

## 🎯 Visão Geral

O **CleanSoft** é uma solução completa de gestão empresarial desenvolvida especificamente para **lava-jatos** e **centros de estética automotiva**. O sistema oferece controle total sobre todas as operações do negócio, desde o atendimento ao cliente até a gestão financeira completa.

### 🎯 **Objetivo Principal**
Transformar a gestão de lava-jatos em um processo simples, eficiente e lucrativo, proporcionando controle total sobre clientes, serviços, estoque e finanças.

---

## ✨ Funcionalidades

### 🔐 **Autenticação e Usuários**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 🔑 Login Seguro | Sistema de autenticação com criptografia | ✅ Implementado |
| 👥 Gestão de Usuários | Controle de acesso por perfis (Proprietário/Gerente) | ✅ Implementado |
| 🔒 Controle de Permissões | Sistema granular de permissões | ✅ Implementado |
| 🔄 Recuperação de Senha | Processo seguro de reset de senha | ✅ Implementado |

### 👥 **Gestão de Clientes e Veículos**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 👤 CRUD de Clientes | Cadastro completo com CPF/CNPJ, telefone, email | ✅ Implementado |
| 🚗 CRUD de Veículos | Vinculação de veículos aos clientes | ✅ Implementado |
| 🔍 Busca Avançada | Sistema de filtros e pesquisa inteligente | ✅ Implementado |
| 📝 Observações | Campo para anotações personalizadas | ✅ Implementado |

### 👷 **Gestão de Funcionários**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 👨‍💼 Cadastro Completo | Dados pessoais, cargo, salário, datas | ✅ Implementado |
| 📊 Relatórios | Estatísticas de funcionários ativos/inativos | ✅ Implementado |
| 🔄 Controle de Status | Ativo/Inativo com histórico | ✅ Implementado |

### 🛠️ **Gestão de Serviços**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 🎯 Categorias | Simples, Detalhado, Técnico | ✅ Implementado |
| 💰 Preços Base | Sistema flexível de precificação | ✅ Implementado |
| 🔗 Serviços Adicionais | Vinculação de serviços técnicos | ✅ Implementado |

### 📦 **Produtos e Estoque**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 🏷️ Controle de Produtos | SKU, categorias, preços de custo/venda | ✅ Implementado |
| 📊 Gestão de Estoque | Controle de entrada/saída automático | ✅ Implementado |
| ⚠️ Alertas | Notificações de estoque baixo | ✅ Implementado |
| 📈 Relatórios | Movimentações e status do estoque | ✅ Implementado |

### 💰 **Vendas e Financeiro**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 🛒 Sistema de Vendas | Registro completo com itens e descontos | ✅ Implementado |
| 💳 Múltiplas Formas de Pagamento | Dinheiro, cartões, PIX, parcelado | ✅ Implementado |
| 📄 Comprovantes | Geração de PDF para recibos/faturas | ✅ Implementado |
| 💸 Controle Financeiro | Contas a pagar/receber e fluxo de caixa | ✅ Implementado |

### 📊 **Relatórios e Analytics**
| Funcionalidade | Descrição | Status |
|----------------|-----------|---------|
| 📈 Dashboard | Visão geral do negócio em tempo real | ✅ Implementado |
| 📊 Relatórios Personalizáveis | Períodos, filtros e exportação | ✅ Implementado |
| 📤 Múltiplos Formatos | PDF, Excel, CSV | ✅ Implementado |
| 📱 Responsivo | Acesso via desktop, tablet e mobile | ✅ Implementado |

---

## 🏗️ Arquitetura

### 🎨 **Frontend (Angular 17)**
```
┌─────────────────────────────────────────────────────────────┐
│                    CleanSoft Frontend                       │
├─────────────────────────────────────────────────────────────┤
│  🎯 Components    │  📱 Pages        │  🔧 Services       │
│  ├─ Dashboard     │  ├─ Dashboard    │  ├─ Customer       │
│  ├─ Navigation    │  ├─ Customers    │  ├─ Vehicle        │
│  ├─ Forms         │  ├─ Vehicles     │  ├─ Employee       │
│  └─ Tables        │  ├─ Employees    │  ├─ Service        │
│                    │  ├─ Services     │  ├─ Product        │
│                    │  ├─ Products     │  ├─ Sale           │
│                    │  ├─ Sales        │  ├─ Financial      │
│                    │  ├─ Financial    │  └─ Report        │
│                    │  └─ Reports      │                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tecnologias

### 🎨 **Frontend**
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| ![Angular](https://img.shields.io/badge/Angular-17-DD0031?style=flat-square&logo=angular&logoColor=white) | 17.x | Framework principal |
| ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) | 5.x | Linguagem de programação |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | 3.x | Estilização |
| ![RxJS](https://img.shields.io/badge/RxJS-7.x-B7178C?style=flat-square&logo=reactivex&logoColor=white) | 7.x | Programação reativa |

### 🛠️ **Ferramentas de Desenvolvimento**
| Ferramenta | Propósito |
|------------|-----------|
| ![Node.js](https://img.shields.io/badge/Node.js-18.x-43853D?style=flat-square&logo=node.js&logoColor=white) | Runtime JavaScript |
| ![npm](https://img.shields.io/badge/npm-9.x-CB3837?style=flat-square&logo=npm&logoColor=white) | Gerenciador de pacotes |
| ![Angular CLI](https://img.shields.io/badge/Angular_CLI-17.x-DD0031?style=flat-square&logo=angular&logoColor=white) | CLI do Angular |

### 📱 **UI/UX**
| Componente | Descrição |
|------------|-----------|
| 🎨 **Design System** | Interface moderna e responsiva |
| 📱 **Mobile First** | Otimizado para dispositivos móveis |
| ♿ **Acessibilidade** | Conformidade com WCAG 2.1 |
| 🌙 **Tema Escuro** | Suporte a modo escuro (futuro) |

---

## 📱 Screenshots

### 🏠 **Dashboard Principal**
```
┌─────────────────────────────────────────────────────────────┐
│  🚗 CleanSoft - Dashboard                                  │
├─────────────────────────────────────────────────────────────┤
│  📊 Estatísticas Rápidas                                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐ │
│  │ 👥 Clientes │ 🛒 Vendas   │ 💰 Receita  │ 📈 Cresc.  │ │
│  │    150      │    45       │   R$ 8.5k   │   +12%     │ │
│  └─────────────┴─────────────┴─────────────┴─────────────┘ │
│                                                             │
│  📈 Gráficos de Performance                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    📊 Gráfico de Vendas                │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 👥 **Gestão de Clientes**
```
┌─────────────────────────────────────────────────────────────┐
│  👥 Gestão de Clientes                                     │
├─────────────────────────────────────────────────────────────┤
│  🔍 Busca: [________________] [+ Adicionar Cliente]        │
│                                                             │
│  📋 Lista de Clientes                                      │
│  ┌─────┬─────────────┬─────────────┬─────────────┬───────┐ │
│  │ ID  │ Nome        │ Telefone    │ Email       │ Ações │ │
│  ├─────┼─────────────┼─────────────┼─────────────┼───────┤ │
│  │ 001 │ João Silva  │ (11) 9999-9999│ joao@email.com│ ✏️ 🗑️ │ │
│  │ 002 │ Maria Santos│ (11) 8888-8888│ maria@email.com│ ✏️ 🗑️ │ │
│  └─────┴─────────────┴─────────────┴─────────────┴───────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Instalação

### 📋 **Pré-requisitos**
- ![Node.js](https://img.shields.io/badge/Node.js-18.x+-43853D?style=flat-square&logo=node.js&logoColor=white)
- ![npm](https://img.shields.io/badge/npm-9.x+-CB3837?style=flat-square&logo=npm&logoColor=white)
- ![Git](https://img.shields.io/badge/Git-2.x+-F05032?style=flat-square&logo=git&logoColor=white)

### 🚀 **Instalação Rápida**

```bash
# 1️⃣ Clone o repositório
git clone https://github.com/luccagoltzman/CleanSoft.git
cd cleansoft

# 2️⃣ Instale as dependências
npm install

# 3️⃣ Execute o servidor de desenvolvimento
npm start

# 4️⃣ Abra no navegador
# 🌐 http://localhost:4200
```

### 🔧 **Instalação Detalhada**

```bash
# 📁 Navegue para o diretório do projeto
cd cleansoft-estetica

# 📦 Instale as dependências
npm install

# 🚀 Inicie o servidor de desenvolvimento
ng serve

# 🔍 Verifique se está funcionando
# Acesse: http://localhost:4200
```

---

## 🔧 Configuração

### ⚙️ **Variáveis de Ambiente**
```bash
# 📁 Crie um arquivo .env na raiz do projeto
cp .env.example .env

# 🔧 Configure as variáveis necessárias
NODE_ENV=development
API_URL=http://localhost:8000
```

### 🎨 **Personalização de Tema**
```scss
// 📁 src/styles.css
:root {
  --primary-color: #1976d2;
  --secondary-color: #dc004e;
  --success-color: #4caf50;
  --warning-color: #ff9800;
  --danger-color: #f44336;
}
```

---

## 📊 Estrutura do Projeto

```
cleansoft-estetica/
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 components/          # 🧩 Componentes reutilizáveis
│   │   ├── 📁 pages/               # 📱 Páginas principais
│   │   │   ├── 📁 dashboard/       # 🏠 Dashboard
│   │   │   ├── 📁 customers/       # 👥 Clientes
│   │   │   ├── 📁 vehicles/        # 🚗 Veículos
│   │   │   ├── 📁 employees/       # 👷 Funcionários
│   │   │   ├── 📁 services/        # 🛠️ Serviços
│   │   │   ├── 📁 products/        # 📦 Produtos
│   │   │   ├── 📁 sales/           # 🛒 Vendas
│   │   │   ├── 📁 financial/       # 💰 Financeiro
│   │   │   └── 📁 reports/         # 📊 Relatórios
│   │   ├── 📁 services/            # 🔧 Serviços de dados
│   │   ├── 📁 models/              # 📋 Modelos de dados
│   │   ├── 📁 shared/              # 🔄 Componentes compartilhados
│   │   └── 📁 guards/               # 🛡️ Guardas de rota
│   ├── 📁 assets/                   # 🎨 Recursos estáticos
│   └── 📁 styles/                   # 🎨 Estilos globais
├── 📁 node_modules/                 # 📦 Dependências
├── 📁 .angular/                     # ⚙️ Configurações Angular
├── 📄 angular.json                  # ⚙️ Configuração Angular
├── 📄 package.json                  # 📦 Dependências npm
└── 📄 README.md                     # 📖 Este arquivo
```

---

## 🎨 Componentes

### 🧩 **Componentes Principais**

| Componente | Descrição | Status |
|------------|-----------|---------|
| 🧭 **Navigation** | Menu de navegação principal | ✅ |
| 📊 **Dashboard** | Painel de controle principal | ✅ |
| 👥 **CustomerCard** | Card de informações do cliente | ✅ |
| 🚗 **VehicleCard** | Card de informações do veículo | ✅ |
| 🛒 **SaleForm** | Formulário de vendas | ✅ |
| 📊 **DataTable** | Tabela de dados reutilizável | ✅ |
| 🔍 **SearchFilter** | Filtros de busca | ✅ |

### 📱 **Páginas Implementadas**

| Página | Funcionalidades | Status |
|--------|----------------|---------|
| 🏠 **Dashboard** | Estatísticas, gráficos, resumo | ✅ |
| 👥 **Clientes** | CRUD, busca, filtros | ✅ |
| 🚗 **Veículos** | CRUD, vinculação, histórico | ✅ |
| 👷 **Funcionários** | CRUD, relatórios, status | ✅ |
| 🛠️ **Serviços** | Categorias, preços, vinculação | ✅ |
| 📦 **Produtos** | Estoque, categorias, preços | ✅ |
| 🛒 **Vendas** | Registro, pagamentos, comprovantes | ✅ |
| 💰 **Financeiro** | Contas, fluxo de caixa, relatórios | ✅ |
| 📊 **Relatórios** | Analytics, exportação, filtros | ✅ |

---

## 📈 Roadmap

### 🚀 **Versão 1.0 (Atual)**
- ✅ Sistema de autenticação
- ✅ Gestão de clientes e veículos
- ✅ Gestão de funcionários
- ✅ Gestão de serviços
- ✅ Gestão de produtos e estoque
- ✅ Sistema de vendas
- ✅ Gestão financeira básica
- ✅ Relatórios básicos

### 🔮 **Versão 2.0 (Próxima)**
- 🔄 API RESTful completa
- 🔄 Sistema de notificações
- 🔄 Integração com WhatsApp

### 🌟 **Versão 3.0 (Futuro)**
- 🔮 Inteligência artificial
- 🔮 Machine learning para previsões
- 🔮 Integração com sistemas externos
- 🔮 Marketplace de serviços
- 🔮 Sistema de fidelidade
- 🔮 Analytics avançado

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

```
MIT License

Copyright (c) 2025 CleanSoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<!-- ## 📞 Suporte

### 🆘 **Precisa de Ajuda?**

- 📧 **Email**: suporte@cleansoft.com
- 💬 **Discord**: [CleanSoft Community](https://discord.gg/cleansoft)
- 📱 **WhatsApp**: +55 (11) 99999-9999
- 📖 **Documentação**: [docs.cleansoft.com](https://docs.cleansoft.com) -->

### 🌟 **Agradecimentos**

- 🎨 **Design System**: Inspirado no Material Design
- 🚀 **Performance**: Otimizações baseadas no Lighthouse
- 📱 **Responsividade**: Testado em múltiplos dispositivos
- 🔒 **Segurança**: Seguindo as melhores práticas OWASP

---

<div align="center">

**🚀 Desenvolvido pela equipe CleanSoft**

</div>
