# 🏪 Mercado Canaverde - Sistema de Análise de Preços

Sistema inteligente para análise e comparação de preços de fornecedores através de planilhas Excel. Interface moderna com funcionalidades avançadas de seleção de preços, drag and drop, e navegação intuitiva.

## 📁 Estrutura do Projeto

```
Canaverde/
├── index.html              # Página principal (versão corrigida)
├── suppliers.html          # Página de resumo por fornecedor
├── styles.css              # Estilos CSS
├── js/                     # Pasta de arquivos JavaScript
│   ├── script.js           # Script principal
│   └── suppliers.js         # Script da página de fornecedores
└── README.md               # Este arquivo
```

## 🚀 Como Usar

1. **Abra `index.html`** no navegador
2. **Carregue sua planilha Excel** (.xlsx ou .xls)
3. **Visualize a análise** com separação visual entre produtos
4. **Clique nos preços** para selecionar fornecedores alternativos
5. **Use o menu hamburger** (3 barras) para acessar a página de fornecedores
6. **Arraste produtos** entre fornecedores na página de fornecedores
7. **Edite quantidades** diretamente na página de fornecedores

## 📊 Formato da Planilha

A planilha deve ter o seguinte formato:

| Produto | Quantidade | Fornecedor A | Fornecedor B | Vila Nova | ... |
|---------|------------|--------------|--------------|-----------|-----|
| Arroz   | 0          | 4.50         | 4.80         | 4.20      | ... |
| Feijão  | 0          | 3.20         | 3.50         | 3.10      | ... |

### Colunas:
- **Primeira coluna**: Nome do produto
- **Segunda coluna**: Quantidade (opcional, pode ser vazia)
- **Demais colunas**: Nomes dos fornecedores com seus preços

## ✨ Funcionalidades

### 🎯 Análise de Preços
- ✅ **Importação de arquivos Excel** (.xlsx, .xls)
- ✅ **Detecção automática de fornecedores**
- ✅ **Identificação dos menores preços**
- ✅ **Destaque visual dos menores preços** (fundo amarelo)
- ✅ **Preços clicáveis** para seleção alternativa
- ✅ **Mensagens de status** diferenciadas:
  - 💰 "Menor Preço" (verde) - Menor preço real
  - ✅ "Preço Selecionado" (azul) - Preço escolhido pelo usuário

### 🎨 Interface Moderna
- ✅ **Separação visual entre produtos** (50px de espaçamento)
- ✅ **Interface de upload limpa** e profissional
- ✅ **Menu hamburger** (3 barras) para navegação
- ✅ **Design responsivo** para todos os dispositivos
- ✅ **Botões com gradiente** e efeitos hover

### 📊 Página de Fornecedores
- ✅ **Resumo detalhado por fornecedor**
- ✅ **Drag and drop** de produtos entre fornecedores
- ✅ **Quantidades editáveis** por fornecedor
- ✅ **Cálculo automático de totais**
- ✅ **Atualização dinâmica** de preços e valores
- ✅ **Navegação fluida** entre páginas

### 🔧 Funcionalidades Técnicas
- ✅ **Armazenamento local** para persistência de dados
- ✅ **Navegação sem perda de dados** entre páginas
- ✅ **Interface sem ícones desnecessários** (limpa)
- ✅ **CSS externo** funcionando corretamente

## 🔧 Arquivos Principais

### `index.html`
- **Página principal** do sistema
- **Upload de planilhas** com interface limpa
- **Tabela de análise** com separação visual entre produtos
- **Preços clicáveis** para seleção alternativa
- **Estatísticas gerais** (produtos, fornecedores, menores preços)
- **Menu hamburger** para navegação
- **Mensagens de status** diferenciadas

### `suppliers.html`
- **Página de fornecedores** com resumo detalhado
- **Cards de fornecedores** com produtos e preços
- **Quantidades editáveis** por fornecedor
- **Drag and drop** de produtos entre fornecedores
- **Cálculo automático** de totais
- **Navegação fluida** de volta para análise

### `js/script.js`
- **Lógica principal** de processamento
- **Leitura de arquivos Excel** (.xlsx, .xls)
- **Análise de preços** e detecção de fornecedores
- **Criação de tabelas** com separação visual
- **Sistema de seleção** de preços alternativos
- **Armazenamento local** para persistência
- **Navegação entre páginas** sem perda de dados

### `js/suppliers.js`
- **Lógica da página de fornecedores**
- **Renderização de cards** com produtos
- **Sistema de drag and drop** entre fornecedores
- **Edição de quantidades** e cálculo de totais
- **Atualização dinâmica** de preços
- **Navegação de volta** para análise principal

## 🎯 Sistema Avançado

Sistema completo com interface moderna, funcionalidades avançadas de seleção de preços, drag and drop, e navegação intuitiva entre páginas.

## 📝 Notas Técnicas

### 🛠️ Tecnologias Utilizadas
- **XLSX.js** - Leitura de arquivos Excel (.xlsx, .xls)
- **CSS3** - Design responsivo e moderno com gradientes
- **JavaScript ES6+** - Classes e funcionalidades avançadas
- **HTML5** - Estrutura semântica e acessível
- **LocalStorage** - Persistência de dados entre páginas

### 🎨 Características da Interface
- **Separação visual** entre produtos (50px de espaçamento)
- **Preços clicáveis** com feedback visual
- **Menu hamburger** para navegação intuitiva
- **Drag and drop** na página de fornecedores
- **Interface limpa** sem ícones desnecessários
- **Botões com gradiente** e efeitos hover profissionais

### 🔄 Funcionalidades Avançadas
- **Seleção alternativa de preços** - Clique para escolher fornecedor diferente
- **Mensagens de status diferenciadas** - Menor preço vs Preço selecionado
- **Quantidades editáveis** por fornecedor
- **Cálculo automático** de totais
- **Navegação sem perda de dados** entre páginas

## 🐛 Solução de Problemas

### Problemas Comuns e Soluções:

**📁 Problema na leitura do Excel:**
1. Verifique o console do navegador (F12)
2. Confirme o formato da planilha
3. Verifique se todos os fornecedores estão sendo detectados

**🎨 Interface não carrega corretamente:**
1. Verifique se o arquivo `styles.css` está no mesmo diretório
2. Confirme que não há conflitos de CSS
3. Teste em modo incógnito para evitar cache

**🔄 Navegação entre páginas:**
1. Certifique-se de que `suppliers.html` existe
2. Verifique se os dados estão sendo salvos no localStorage
3. Use o botão "Voltar para Análise" na página de fornecedores

**💰 Preços não clicáveis:**
1. Verifique se o JavaScript está carregado
2. Confirme que não há erros no console
3. Teste com diferentes navegadores

## 📞 Suporte

Para dúvidas ou problemas, verifique:
- **Console do navegador** para erros (F12)
- **Formato da planilha** conforme especificado
- **Nomes das colunas** (evite palavras-chave do sistema)
- **Compatibilidade do navegador** (Chrome, Firefox, Edge recomendados)

## 🚀 Versão Atual

**Versão:** 2.0 - Interface Moderna  
**Última atualização:** Dezembro 2024  
**Funcionalidades:** Análise completa com seleção de preços, drag and drop, e navegação intuitiva