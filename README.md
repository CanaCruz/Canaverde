# Mercado Canaverde — Sistema de Análise de Preços

Ferramenta web para comparar preços de fornecedores a partir de planilhas Excel. Desenvolvida para o **Mercado Canaverde**, com interface moderna, página de cotação por fornecedor e exportação para impressão/WhatsApp.

**Demo:** [canacruz.github.io/Canaverde](https://canacruz.github.io/Canaverde/)

---

## Início rápido

### Online (GitHub Pages)
Acesse o link acima, carregue sua planilha `.xlsx` ou `.xls` e use normalmente.

### Local
```bash
git clone https://github.com/CanaCruz/Canaverde.git
cd Canaverde
npx http-server -p 8081 -c-1 -o
```

Abra `http://127.0.0.1:8081` no navegador.

---

## Formato da planilha

| Produto | Quantidade | Fornecedor A | Fornecedor B | Fornecedor C |
|---------|------------|--------------|--------------|--------------|
| Arroz 5kg | | 22,50 | 23,90 | 21,80 |
| Feijão 1kg | | 8,40 | 7,95 | 8,20 |

- **1ª coluna:** nome do produto (obrigatório)
- **Quantidade:** coluna opcional (ignorada na importação; quantidades são definidas na página de fornecedores)
- **Demais colunas:** um fornecedor por coluna, com preços numéricos

**Limites:** apenas `.xlsx` e `.xls`, máximo **10 MB**.

---

## Fluxo de uso

1. **Página principal** — importe a planilha e veja a comparação de preços
2. Clique em um preço para selecionar outro fornecedor como vencedor
3. Use **Fornecedores** (menu superior) para montar o pedido
4. Na página de fornecedores: informe quantidades, ajuste unidades e exporte a cotação

---

## Funcionalidades

### Página principal (`index.html`)
- Upload com drag-and-drop e validação de arquivo
- Spinner de carregamento e mensagens de erro/sucesso no HTML
- Métricas: produtos, fornecedores, menores preços e **economia potencial**
- Busca em tempo real, filtro por fornecedor e ordenação (nome / menor / maior preço)
- Exportação de resultados em `.xlsx` (SheetJS)
- Tabela responsiva com scroll horizontal em telas pequenas
- Acessibilidade: `role`, `aria-label`, suporte a teclado na área de upload

### Página de fornecedores (`pages/suppliers.html`)
- Cards por fornecedor com produtos de menor preço selecionados
- **Quantidade** editável com memória da última compra (fundo amarelo = valor lembrado)
- **Unidade automática** por nome do produto (cx, fd, dp, un, dz, ct) — badge azul = detectado; alterações manuais são memorizadas
- Total = `quantidade × preço unitário`; total por fornecedor e total geral do pedido
- Comparar preços e trocar produto de fornecedor pelo menu "⋮" de cada produto
- Remover/restaurar produtos
- Copiar lista para WhatsApp (com saudação por horário)
- Exportar planilha Excel com destaques amarelos, formatação A4 e numeração de páginas na impressão
- Resetar ao estado original da planilha
- **Histórico de cotações na nuvem** (botão "📜 Histórico") — cada cotação com quantidades preenchidas é arquivada automaticamente no Firestore antes de ser descartada por um novo upload, acessível de qualquer computador com internet

---

## Estrutura do projeto

```
Canaverde/
├── index.html              # Página principal
├── pages/
│   └── suppliers.html      # Página de fornecedores
├── js/
│   ├── script.js           # Análise, upload, filtros, exportação
│   ├── suppliers.js        # Fornecedores, totais, WhatsApp, Excel, histórico
│   └── firebase-config.js  # Config do Firebase (histórico de cotações na nuvem)
├── css/
│   └── styles.css
├── assets/
│   └── logo.png
└── README.md
```

---

## Tecnologias

| Uso | Biblioteca |
|-----|------------|
| Leitura Excel (principal) | [SheetJS / XLSX.js](https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/) |
| Exportação cotação | [ExcelJS](https://github.com/exceljs/exceljs) |
| Ícones | Font Awesome 6 |
| Fonte | Inter (Google Fonts) |
| Persistência de sessão | `localStorage` |
| Histórico de cotações | [Firebase / Firestore](https://firebase.google.com/) (projeto `mercado-canaverde`) |

---

## Versão atual — 2.4

**Julho 2026**

### Destaques da v2.4
- **Histórico de cotações na nuvem** (Firestore) — acessível de qualquer computador, últimas 20 cotações
- Remove drag and drop entre fornecedores (fluxo "Comparar Preços" já cobria o mesmo caso, sem risco de preço "fantasma")
- Remove "itens por embalagem" — total agora é sempre `quantidade × preço unitário`
- Mensagem de WhatsApp e card do produto mais enxutos (sem linhas de total redundantes)
- Correções de robustez: leitura de `localStorage` protegida contra dado corrompido, `escapeHtml` em mais pontos, limpeza completa de sessão ao trocar de planilha

### Histórico resumido
| Versão | Principais entregas |
|--------|---------------------|
| 2.4 | Histórico de cotações na nuvem, remoção de drag-and-drop e itens por embalagem, correções de robustez |
| 2.3 | Polimento visual (ícones, badges, detalhes em verde) e limpeza de CSS |
| 2.2 | Embalagens, visual, correções |
| 2.1 | Filtros, economia potencial, exportação de resultados, numeração Excel |
| 2.0 | Unidades, totais, exportação A4, busca, remoção de produtos |
| 1.x | Drag and drop, WhatsApp, estrutura de pastas, versão inicial |

---

## Convenção de commits

Este repositório usa mensagens padronizadas:

```
feat:     nova funcionalidade
fix:      correção de bug
docs:     documentação
refactor: reorganização sem mudar comportamento
revert:   desfaz commit anterior
```

Exemplos: `feat: exportação Excel otimizada para A4`, `fix: preserva scroll ao trocar unidade`

---

## Solução de problemas

| Problema | O que verificar |
|----------|-----------------|
| Planilha não carrega | Formato `.xlsx`/`.xls`, tamanho ≤ 10 MB, coluna Produto preenchida |
| Fornecedor não aparece | Nome da coluna não pode ser palavra reservada (ex.: "Total", "Preço") |
| Página em branco local | Servir via `http-server`; não abrir `index.html` direto do disco |
| Dados sumiram | Novo upload limpa a sessão; histórico de quantidade/unidade permanece no navegador e a cotação anterior (se tinha quantidades) fica salva no histórico da nuvem ("📜 Histórico") |
| Histórico não carrega | Verifique conexão com a internet; as regras do Firestore precisam estar publicadas na coleção `cotacoes` |

Console do navegador (`F12`) para erros detalhados. Logs de debug: flag `DEBUG` em `suppliers.js`.

---

## Licença e autor

Projeto interno do **Mercado Canaverde**.  
Repositório: [github.com/CanaCruz/Canaverde](https://github.com/CanaCruz/Canaverde)
