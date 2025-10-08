# 🏪 Mercado Canaverde - Sistema de Análise de Preços

Sistema inteligente para análise e comparação de preços de fornecedores através de planilhas Excel.

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

1. Abra `index.html` no navegador
2. Carregue sua planilha Excel (.xlsx)
3. Visualize a análise completa com debug

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

- ✅ Importação de arquivos Excel (.xlsx, .xls)
- ✅ Detecção automática de fornecedores
- ✅ Identificação dos menores preços
- ✅ Destaque visual dos menores preços
- ✅ Cálculo de preços totais por quantidade
- ✅ Resumo por fornecedor
- ✅ Interface responsiva
- ✅ Debug completo (versão corrigida)

## 🔧 Arquivos Principais

### `index.html`
- Página principal do sistema
- Upload de planilhas
- Tabela de análise de preços
- Estatísticas gerais
- Debug completo

### `suppliers.html`
- Página de resumo detalhado por fornecedor
- Lista produtos com menores preços por fornecedor
- Navegação entre páginas

### `js/script.js`
- Lógica principal de processamento
- Leitura de arquivos Excel
- Análise de preços
- Criação de tabelas

### `js/suppliers.js`
- Lógica da página de fornecedores
- Renderização de cards de fornecedores
- Navegação entre páginas

## 🎯 Sistema Único

Sistema completo com todas as funcionalidades e debug integrado.

## 📝 Notas Técnicas

- Utiliza a biblioteca XLSX.js para leitura de Excel
- CSS responsivo para diferentes dispositivos
- JavaScript ES6+ com classes
- Armazenamento local para navegação entre páginas
- Logs detalhados para debug (versão corrigida)

## 🐛 Solução de Problemas

Se houver problemas na leitura do Excel:
1. Verifique o console do navegador (F12)
2. Confirme o formato da planilha
3. Verifique se todos os fornecedores estão sendo detectados

## 📞 Suporte

Para dúvidas ou problemas, verifique:
- Console do navegador para erros
- Formato da planilha
- Nomes das colunas (evite palavras-chave do sistema)