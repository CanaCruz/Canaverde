class PriceAnalyzer {
    constructor() {
        this.data = [];
        this.suppliers = new Set();
        this.products = new Set();
        this.lowestPrices = new Map(); // Mudar para Map para consistência
        this.setupEventListeners();
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        } else {
            console.error('Elementos uploadArea ou fileInput não encontrados');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        console.log('handleFileSelect chamado');
        const file = e.target.files[0];
        console.log('Arquivo selecionado:', file);
        if (file) {
            console.log('Nome do arquivo:', file.name);
            console.log('Tipo do arquivo:', file.type);
            console.log('Tamanho do arquivo:', file.size);
            this.handleFile(file);
        } else {
            console.log('Nenhum arquivo selecionado');
        }
    }

    async handleFile(file) {
        console.log('handleFile iniciado para:', file.name);
        
        if (!this.isValidExcelFile(file)) {
            console.log('Arquivo inválido:', file.type);
            this.showError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
            return;
        }

        console.log('Arquivo válido, iniciando processamento...');
        this.showLoading();

        try {
            console.log('Lendo arquivo Excel...');
            const rawData = await this.readExcelFile(file);
            console.log('Dados brutos do Excel:', rawData);
            
            console.log('Processando dados...');
            this.processData(rawData);
            
            console.log('Mostrando análise...');
            this.showAnalysis();
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            this.showError(`Erro ao processar arquivo: ${error.message}`);
        }
    }

    isValidExcelFile(file) {
        console.log('Verificando arquivo:', file.name, 'Tipo:', file.type);
        
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/excel',
            'application/x-excel',
            'application/x-msexcel'
        ];
        
        const validExtensions = ['.xlsx', '.xls'];
        const fileName = file.name.toLowerCase();
        
        const isValidType = validTypes.includes(file.type);
        const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        console.log('Tipo válido:', isValidType, 'Extensão válida:', isValidExtension);
        
        return isValidType || isValidExtension;
    }

    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { 
                        type: 'array',
                        cellDates: true,
                        cellNF: false,
                        cellText: false
                    });
                    
                    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                        throw new Error('Nenhuma planilha encontrada no arquivo');
                    }
                    
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    if (!worksheet) {
                        throw new Error('Não foi possível acessar a planilha');
                    }
                    
                    // Converter para JSON com configurações mais robustas
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                        header: 1,
                        defval: '',
                        blankrows: false,
                        raw: false
                    });
                    
                    // Filtrar linhas vazias
                    const filteredData = jsonData.filter(row => 
                        row && row.length > 0 && row.some(cell => 
                            cell !== '' && cell !== null && cell !== undefined
                        )
                    );
                    
                    if (filteredData.length === 0) {
                        throw new Error('Nenhum dado encontrado na planilha');
                    }
                    
                    console.log('Dados filtrados:', filteredData);
                    resolve(filteredData);
                } catch (error) {
                    console.error('Erro detalhado:', error);
                    reject(new Error(`Erro ao processar arquivo Excel: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    processData(rawData) {
        console.log('=== INÍCIO DO PROCESSAMENTO ===');
        console.log('Dados brutos recebidos:', rawData);

        if (rawData.length < 2) {
            throw new Error('Arquivo deve ter pelo menos um cabeçalho e uma linha de dados');
        }

        const headers = rawData[0];
        const dataRows = rawData.slice(1);
        
        // Limpar cabeçalhos
        const cleanHeaders = headers.map(header => {
            const cleaned = String(header || '').trim();
            console.log(`Cabeçalho original: "${header}" -> Limpo: "${cleaned}"`);
            return cleaned;
        });

        console.log('Cabeçalhos limpos:', cleanHeaders);
        console.log('Linhas de dados:', dataRows.length);

        // Detectar coluna de produto (primeira coluna não vazia)
        const productCol = 0;
        console.log('Coluna de produto:', productCol);

        // Detectar coluna de quantidade
        const quantityCol = this.findQuantityColumn(cleanHeaders);
        console.log('Coluna de quantidade:', quantityCol);

        // Identificar fornecedores - CORRIGIDO
        const suppliers = [];
        cleanHeaders.forEach((header, index) => {
            // Pular coluna de produto e quantidade
            if (index === productCol || index === quantityCol) {
                return;
            }
            
            // Pular cabeçalhos vazios
            if (!header || header === '') {
                return;
            }
            
            // Lista expandida de palavras-chave do sistema
            const systemKeywords = [
                'produto', 'product', 'item', 'nome', 'descrição', 'descricao', 'desc',
                'quantidade', 'qtd', 'qtde', 'quantity', 'qty', 'unidade', 'unidades', 'qnt',
                'código', 'codigo', 'id', 'sku', 'referencia', 'ref',
                'preço', 'price', 'valor', 'custo', 'cost', 'total', 'subtotal',
                'status', 'situacao', 'ativo', 'inativo', 'disponivel',
                'categoria', 'category', 'tipo', 'marca', 'brand',
                'peso', 'weight', 'volume', 'medida', 'measure',
                'data', 'date', 'criado', 'created', 'atualizado', 'updated'
            ];
            
            const headerLower = header.toLowerCase();
            const isSystemColumn = systemKeywords.some(keyword => 
                headerLower.includes(keyword.toLowerCase())
            );
            
            if (!isSystemColumn) {
                suppliers.push(header);
                console.log(`Fornecedor detectado: "${header}" (coluna ${index})`);
            } else {
                console.log(`Coluna do sistema ignorada: "${header}" (coluna ${index})`);
            }
        });

        console.log('Fornecedores detectados:', suppliers);

        if (suppliers.length === 0) {
            throw new Error('Nenhum fornecedor encontrado nas colunas do arquivo.');
        }

        // Processar dados
        this.data = [];
        this.suppliers = new Set(suppliers);
        this.products = new Set();

        console.log('Processando linhas de dados...');
        dataRows.forEach((row, rowIndex) => {
            const product = String(row[productCol] || '').trim();
            
            if (product) {
                console.log(`\nProcessando produto: "${product}" (linha ${rowIndex + 2})`);
                
                suppliers.forEach((supplier) => {
                    // Encontrar índice da coluna do fornecedor
                    const priceColIndex = cleanHeaders.findIndex((header, index) => 
                        index !== productCol && 
                        index !== quantityCol && 
                        String(header).trim() === supplier
                    );
                    
                    console.log(`  Fornecedor: "${supplier}" -> Coluna: ${priceColIndex}`);
                    
                    if (priceColIndex !== -1 && priceColIndex < row.length) {
                        const priceStr = String(row[priceColIndex] || '').trim();
                        console.log(`  Valor bruto: "${priceStr}"`);
                        
                        if (priceStr) {
                            const price = this.parsePrice(priceStr);
                            console.log(`  Preço parseado: ${price}`);
                            
                            if (!isNaN(price) && price > 0) {
                                this.data.push({
                                    product,
                                    supplier,
                                    price,
                                    quantity: 0,
                                    totalPrice: 0,
                                    row: rowIndex + 2
                                });

                                this.products.add(product);
                                console.log(`  ✅ Adicionado: ${product} - ${supplier} - R$ ${price}`);
                            } else {
                                console.log(`  ❌ Preço inválido: ${priceStr} -> ${price}`);
                            }
                        } else {
                            console.log(`  ⚠️ Valor vazio para ${supplier}`);
                        }
                    } else {
                        console.log(`  ❌ Coluna não encontrada para ${supplier}`);
                    }
                });
            } else {
                console.log(`Linha ${rowIndex + 2} ignorada - produto vazio`);
            }
        });

        console.log(`\n=== RESULTADO FINAL ===`);
        console.log(`Total de itens processados: ${this.data.length}`);
        console.log(`Produtos únicos: ${this.products.size}`);
        console.log(`Fornecedores: ${this.suppliers.size}`);
        console.log('Dados finais:', this.data);

        if (this.data.length === 0) {
            throw new Error('Nenhum dado válido encontrado na planilha.');
        }

        this.findLowestPrices();
    }

    findQuantityColumn(headers) {
        const quantityKeywords = [
            'quantidade', 'qtd', 'qtde', 'quantity', 'qty', 
            'unidade', 'unidades', 'qnt', 'quant', 'q'
        ];
        
        const quantityCol = headers.findIndex(header => 
            quantityKeywords.some(keyword => 
                String(header).toLowerCase().includes(keyword.toLowerCase())
            )
        );

        console.log(`Coluna de quantidade detectada: ${quantityCol}`);
        return quantityCol !== -1 ? quantityCol : -1;
    }

    parsePrice(priceStr) {
        if (!priceStr || typeof priceStr !== 'string') {
            return NaN;
        }

        let cleaned = priceStr.trim();
        console.log(`Parseando preço: "${cleaned}"`);
        
        // Remover símbolos de moeda
        cleaned = cleaned.replace(/[R$\s]/g, '');
        
        // Se já é um número válido
        if (!isNaN(cleaned) && !isNaN(parseFloat(cleaned))) {
            const result = parseFloat(cleaned);
            console.log(`Resultado direto: ${result}`);
            return result;
        }
        
        // Remover caracteres não numéricos exceto vírgula e ponto
        cleaned = cleaned.replace(/[^\d,.-]/g, '');
        console.log(`Após limpeza: "${cleaned}"`);
        
        // Tratar diferentes formatos de vírgula e ponto
        if (cleaned.includes(',') && cleaned.includes('.')) {
            // Formato: 1.234,56 ou 1,234.56
            if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
                // 1.234,56 -> 1234.56
                cleaned = cleaned.replace(/\./g, '');
                cleaned = cleaned.replace(',', '.');
            } else {
                // 1,234.56 -> 1234.56
                cleaned = cleaned.replace(/,/g, '');
            }
        } else if (cleaned.includes(',')) {
            // Apenas vírgula
            const parts = cleaned.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
                // 12,50 -> 12.50
                cleaned = cleaned.replace(',', '.');
            } else {
                // 1,234 -> 1234
                cleaned = cleaned.replace(/,/g, '');
            }
        }
        
        const result = parseFloat(cleaned);
        console.log(`Resultado final: ${result}`);
        return isNaN(result) ? NaN : result;
    }

    findLowestPrices() {
        this.lowestPrices.clear();
        
        const productGroups = {};
        this.data.forEach(item => {
            if (!productGroups[item.product]) {
                productGroups[item.product] = [];
            }
            productGroups[item.product].push(item);
        });

        Object.keys(productGroups).forEach(product => {
            const items = productGroups[product];
            const minPrice = Math.min(...items.map(item => item.price));
            
            items.forEach(item => {
                if (item.price === minPrice) {
                    this.lowestPrices.set(`${item.product}-${item.supplier}`, true);
                }
            });
        });
    }

    showLoading() {
        const uploadArea = document.getElementById('uploadArea');
        const analysisSection = document.getElementById('analysisSection');
        
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="upload-text">Processando arquivo...</div>
            `;
        }
        
        if (analysisSection) {
            analysisSection.style.display = 'none';
        }
    }

    showError(message) {
        const uploadArea = document.getElementById('uploadArea');
        const analysisSection = document.getElementById('analysisSection');
        
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="upload-text" style="color: #e74c3c;">${message}</div>
                <button class="btn" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            `;
        }
        
        if (analysisSection) {
            analysisSection.style.display = 'none';
        }
    }

    showAnalysis() {
        const uploadArea = document.getElementById('uploadArea');
        const analysisSection = document.getElementById('analysisSection');
        
        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="upload-text" style="color: #27ae60;">Arquivo processado com sucesso!</div>
                <button class="btn" onclick="location.reload()">
                    <i class="fas fa-upload"></i> Carregar Outro Arquivo
                </button>
            `;
        }
        
        if (analysisSection) {
            analysisSection.style.display = 'block';
        }

        // Mostrar menu hambúrguer após carregar Excel
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.classList.add('visible');
        }
        
        // Atualizar estatísticas
        const totalProductsEl = document.getElementById('totalProducts');
        const totalSuppliersEl = document.getElementById('totalSuppliers');
        const lowestPricesEl = document.getElementById('lowestPrices');
        
        if (totalProductsEl) totalProductsEl.textContent = this.products.size;
        if (totalSuppliersEl) totalSuppliersEl.textContent = this.suppliers.size;
        if (lowestPricesEl) lowestPricesEl.textContent = this.lowestPrices.size;

        // Criar tabela
        this.createPriceTable();

        // Mostrar debug info
        this.showDebugInfo();

        // Scroll para a seção de análise
        analysisSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    createPriceTable() {
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');

        if (!tableHead || !tableBody) {
            console.error('Elementos da tabela não encontrados');
            return;
        }

        // Cabeçalho da tabela
        tableHead.innerHTML = `
            <tr>
                <th>Quantidade</th>
                <th>Produto</th>
                <th>Fornecedor</th>
                <th>Preço Unit.</th>
                <th>Preço Total</th>
                <th>Status</th>
            </tr>
        `;

        // Corpo da tabela
        tableBody.innerHTML = '';
        
        // Ordenar por produto e depois por preço
        const sortedData = [...this.data].sort((a, b) => {
            if (a.product !== b.product) {
                return a.product.localeCompare(b.product);
            }
            return a.price - b.price;
        });

        sortedData.forEach(item => {
            const isLowest = this.lowestPrices.has(`${item.product}-${item.supplier}`);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <input type="number" 
                           class="quantity-input" 
                           value="" 
                           placeholder="0"
                           min="0" 
                           step="1"
                           data-product="${item.product}"
                           data-supplier="${item.supplier}"
                           data-unit-price="${item.price}"
                           onchange="updatePrice(this)">
                </td>
                <td>${item.product}</td>
                <td>${item.supplier}</td>
                <td class="${isLowest ? 'lowest-price' : ''}">R$ ${item.price.toFixed(2).replace('.', ',')}</td>
                <td data-total-price="0" data-is-lowest="${isLowest}">R$ 0,00</td>
                <td>${isLowest ? '<span class="success">💰 Menor Preço</span>' : ''}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }

    // Lógica textual implementada conforme solicitado
    getSupplierProductsWithLowestPrices() {
        const resultado = {};
        
        // Para cada linha da planilha (cada produto)
        this.data.forEach(item => {
            const produto = item.product;
            
            // Encontrar o menor preço para este produto entre todos os fornecedores
            const productItems = this.data.filter(d => d.product === produto);
            const menorPreco = Math.min(...productItems.map(p => p.price));
            
            // Descobrir de qual fornecedor(s) veio esse menor preço
            const fornecedoresComMenorPreco = productItems
                .filter(p => p.price === menorPreco)
                .map(p => p.supplier);
            
            // Associar o produto a cada fornecedor com menor preço
            fornecedoresComMenorPreco.forEach(fornecedor => {
                if (!resultado[fornecedor]) {
                    resultado[fornecedor] = [];
                }
                
                // Verificar se já não existe (evitar duplicatas)
                const jaExiste = resultado[fornecedor].some(p => p.produto === produto);
                if (!jaExiste) {
                    resultado[fornecedor].push({
                        produto: produto,
                        preco: menorPreco
                    });
                }
            });
        });
        
        // Ordenar produtos por nome dentro de cada fornecedor
        Object.keys(resultado).forEach(fornecedor => {
            resultado[fornecedor].sort((a, b) => a.produto.localeCompare(b.produto));
        });
        
        console.log('Resultado da lógica textual:', resultado);
        return resultado;
    }

    showDebugInfo() {
        const debugInfo = document.getElementById('debugInfo');
        const debugContent = document.getElementById('debugContent');
        
        if (debugInfo && debugContent) {
            debugInfo.style.display = 'block';
            debugContent.innerHTML = `
                <div><strong>Produtos encontrados:</strong> ${this.products.size}</div>
                <div><strong>Fornecedores encontrados:</strong> ${this.suppliers.size}</div>
                <div><strong>Total de itens:</strong> ${this.data.length}</div>
                <div><strong>Menores preços:</strong> ${this.lowestPrices.size}</div>
                <div><strong>Fornecedores:</strong> ${Array.from(this.suppliers).join(', ')}</div>
                <div><strong>Produtos:</strong> ${Array.from(this.products).join(', ')}</div>
            `;
        }
    }
}

// Função global para atualizar preços quando quantidade muda
function updatePrice(input) {
    if (!input) {
        console.error('Input não fornecido para updatePrice');
        return;
    }

    const product = input.dataset.product;
    const supplier = input.dataset.supplier;
    const unitPrice = parseFloat(input.dataset.unitPrice);
    const quantity = parseInt(input.value) || 0;

    console.log(`Atualizando preço: ${product} - ${supplier} - Qtd: ${quantity} - Preço: ${unitPrice}`);

    // Encontrar a linha da tabela
    const row = input.closest('tr');
    if (!row) {
        console.error('Linha da tabela não encontrada');
        return;
    }

    // Atualizar preço total
    const totalPriceCell = row.querySelector('[data-total-price]');
    if (totalPriceCell) {
        const isLowest = totalPriceCell.dataset.isLowest === 'true';
        
        if (quantity === 0) {
            totalPriceCell.textContent = 'R$ 0,00';
            // Quando quantidade é 0, remover destaque do preço total
            totalPriceCell.classList.remove('lowest-price');
        } else {
            const totalPrice = unitPrice * quantity;
            totalPriceCell.textContent = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;
            // Quando há quantidade, aplicar destaque se for menor preço
            if (isLowest) {
                totalPriceCell.classList.add('lowest-price');
            } else {
                totalPriceCell.classList.remove('lowest-price');
            }
        }
        totalPriceCell.dataset.totalPrice = quantity * unitPrice;
    }

    // Atualizar lista de fornecedores
    updateSupplierListPrice(product, supplier, quantity, unitPrice);
}

function updateSupplierListPrice(product, supplier, quantity, unitPrice) {
    // Esta função pode ser expandida para atualizar a lista de fornecedores
    // quando quantidades mudarem
    console.log(`Atualizando lista de fornecedores: ${product} - ${supplier} - Qtd: ${quantity}`);
}

// Função para alternar o menu hambúrguer
function toggleMenu() {
    console.log('Menu hambúrguer clicado!');
    
    if (window.priceAnalyzer && window.priceAnalyzer.data.length > 0) {
        console.log('Dados encontrados, salvando...');
        
        // Atualizar quantidades e preços totais antes de salvar
        updateAllQuantitiesAndTotals();
        
        // Salvar dados no localStorage
        const dataToSave = {
            suppliers: Array.from(window.priceAnalyzer.suppliers),
            products: Array.from(window.priceAnalyzer.products),
            data: window.priceAnalyzer.data,
            lowestPrices: Array.from(window.priceAnalyzer.lowestPrices.entries()), // Já correto para Map
            timestamp: new Date().toISOString() // Adicionar timestamp para debug
        };
        
        localStorage.setItem('canaverdeData', JSON.stringify(dataToSave));
        
        console.log('Dados salvos no localStorage:', dataToSave);
        console.log('Navegando para suppliers.html...');
        
        // Mostrar feedback visual
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.style.opacity = '0.5';
            setTimeout(() => {
                menuToggle.style.opacity = '1';
            }, 200);
        }
        
        // Tentar navegar para página de fornecedores
        try {
            // Verificar se suppliers.html existe
            fetch('suppliers.html')
                .then(response => {
                    if (response.ok) {
                        window.location.href = 'suppliers.html';
                    } else {
                        throw new Error('Arquivo suppliers.html não encontrado');
                    }
                })
                .catch(error => {
                    console.error('Erro ao verificar suppliers.html:', error);
                    alert('Erro: Arquivo suppliers.html não encontrado.\n\nVerifique se o arquivo existe no mesmo diretório.');
                });
        } catch (error) {
            console.error('Erro na navegação:', error);
            alert('Erro: Não foi possível navegar para suppliers.html\n\nVerifique se o arquivo suppliers.html existe no mesmo diretório.');
        }
    } else {
        console.log('Nenhum dado encontrado');
        alert('Por favor, carregue uma planilha Excel primeiro para acessar o resumo de fornecedores.');
    }
}

// Função para atualizar todas as quantidades e preços totais antes de salvar
function updateAllQuantitiesAndTotals() {
    if (!window.priceAnalyzer) return;
    
    // Buscar todos os inputs de quantidade
    const quantityInputs = document.querySelectorAll('.quantity-input');
    
    quantityInputs.forEach(input => {
        const row = input.closest('tr');
        if (!row) return;
        
        const productCell = row.querySelector('td:nth-child(2)'); // Coluna do produto
        const supplierCell = row.querySelector('td:nth-child(3)'); // Coluna do fornecedor
        
        if (productCell && supplierCell) {
            const product = productCell.textContent.trim();
            const supplier = supplierCell.textContent.trim();
            const quantity = parseInt(input.value) || 0;
            
            // Atualizar dados no priceAnalyzer
            const dataItem = window.priceAnalyzer.data.find(item => 
                item.product === product && item.supplier === supplier
            );
            
            if (dataItem) {
                dataItem.quantity = quantity;
                dataItem.totalPrice = dataItem.price * quantity;
                console.log(`Atualizado: ${product} - ${supplier} - Qtd: ${quantity} - Total: R$ ${dataItem.totalPrice.toFixed(2)}`);
            }
        }
    });
}

// Função para restaurar dados quando voltar da página de fornecedores
function restoreDataFromSuppliers() {
    const savedData = localStorage.getItem('canaverdeData');
    
    if (savedData && window.priceAnalyzer) {
        try {
            const data = JSON.parse(savedData);
            console.log('Restaurando dados:', data);
            
            // Restaurar dados no priceAnalyzer
            window.priceAnalyzer.suppliers = new Set(data.suppliers);
            window.priceAnalyzer.products = new Set(data.products);
            window.priceAnalyzer.data = data.data;
            window.priceAnalyzer.lowestPrices = new Map(data.lowestPrices);
            
            console.log('Dados restaurados com sucesso');
            
            // Recriar a tabela com os dados atualizados
            window.priceAnalyzer.createPriceTable();
            
            // Mostrar o menu hambúrguer novamente
            const menuToggle = document.querySelector('.menu-toggle');
            if (menuToggle) {
                menuToggle.classList.add('visible');
            }
            
            // Atualizar estatísticas
            const totalProductsEl = document.getElementById('totalProducts');
            const totalSuppliersEl = document.getElementById('totalSuppliers');
            const lowestPricesEl = document.getElementById('lowestPrices');
            
            if (totalProductsEl) totalProductsEl.textContent = window.priceAnalyzer.products.size;
            if (totalSuppliersEl) totalSuppliersEl.textContent = window.priceAnalyzer.suppliers.size;
            if (lowestPricesEl) lowestPricesEl.textContent = window.priceAnalyzer.lowestPrices.size;
            
            console.log(`Estatísticas atualizadas: ${window.priceAnalyzer.products.size} produtos, ${window.priceAnalyzer.suppliers.size} fornecedores, ${window.priceAnalyzer.lowestPrices.size} menores preços`);
            
            // Mostrar a seção de análise
            const analysisSection = document.getElementById('analysisSection');
            if (analysisSection) {
                analysisSection.style.display = 'block';
            }
            
            // Ocultar a área de upload apenas se há dados válidos
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea && window.priceAnalyzer.data.length > 0) {
                uploadArea.style.display = 'none';
            }
            
            console.log('Interface restaurada com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao restaurar dados:', error);
            return false;
        }
    }
    return false;
}

// Função para ocultar menu quando página é recarregada
function hideMenuOnReload() {
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.classList.remove('visible');
    }
    
    // Garantir que a área de upload esteja visível quando não há dados
    const uploadArea = document.getElementById('uploadArea');
    const analysisSection = document.getElementById('analysisSection');
    
    if (uploadArea) {
        uploadArea.style.display = 'block';
    }
    
    if (analysisSection) {
        analysisSection.style.display = 'none';
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.priceAnalyzer = new PriceAnalyzer();
    
    // Tentar restaurar dados se voltou da página de fornecedores
    if (!restoreDataFromSuppliers()) {
        hideMenuOnReload(); // Garantir que menu está oculto inicialmente
    }
});