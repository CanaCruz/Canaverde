const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

class PriceAnalyzer {
    constructor() {
        this.data = [];
        this.suppliers = new Set();
        this.products = new Set();
        this.lowestPrices = new Map();
        this.sortMode = 'name';
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
        hideUploadError();

        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showError(validation.title, validation.message);
            return;
        }

        this.clearData(false);
        this.showLoading();

        try {
            const rawData = await this.readExcelFile(file);
            this.processData(rawData);
            this.showAnalysis();
        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            const msg = this.getProcessErrorMessage(error.message);
            this.showError(msg.title, msg.message);
        }
    }

    validateFile(file) {
        if (!file) {
            return { valid: false, title: 'Nenhum arquivo selecionado', message: 'Selecione um arquivo .xlsx ou .xls para continuar.' };
        }
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.xlsx', '.xls'];
        const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
        if (!hasValidExt) {
            return {
                valid: false,
                title: 'Formato não suportado',
                message: 'Use apenas arquivos Excel (.xlsx ou .xls). Outros formatos não são aceitos.'
            };
        }
        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                title: 'Arquivo muito grande',
                message: `O arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite máximo é 10 MB.`
            };
        }
        return { valid: true };
    }

    getProcessErrorMessage(rawMessage) {
        const msg = rawMessage || '';
        if (msg.includes('cabeçalho') || msg.includes('Nenhum fornecedor')) {
            return {
                title: 'Planilha com estrutura inválida',
                message: 'A planilha precisa ter: coluna "Produto" na 1ª coluna, opcionalmente "Quantidade" na 2ª, e colunas de fornecedores com preços nas demais colunas.'
            };
        }
        if (msg.includes('Nenhum dado válido')) {
            return {
                title: 'Nenhum preço encontrado',
                message: 'Verifique se os produtos têm nomes preenchidos e se os preços dos fornecedores estão em formato numérico (ex: 4,50 ou 4.50).'
            };
        }
        return {
            title: 'Erro ao processar planilha',
            message: msg
        };
    }

    clearData(restoreUpload = true) {
        console.log('Limpando dados anteriores...');
        
        this.data = [];
        this.suppliers.clear();
        this.products.clear();
        this.lowestPrices.clear();
        this.sortMode = 'name';
        
        // Limpar localStorage
        localStorage.removeItem('canaverdeData');
        localStorage.removeItem('canaverdeDataOriginal');
        localStorage.removeItem('removedProducts');
        localStorage.removeItem('finishedSuppliers');
        localStorage.removeItem('productUnits');
        // Mantém productUnitPrefs e productQuantityHistory (memória entre planilhas)
        
        // Ocultar menu hambúrguer
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.classList.remove('visible');
        }
        
        // Ocultar seção de análise
        const analysisSection = document.getElementById('analysisSection');
        if (analysisSection) {
            analysisSection.style.display = 'none';
        }
        
        const successBanner = document.getElementById('successBanner');
        if (successBanner) successBanner.style.display = 'none';

        const savingsEl = document.getElementById('potentialSavings');
        const savingsPct = document.getElementById('potentialSavingsPercent');
        if (savingsEl) savingsEl.textContent = 'R$ 0,00';
        if (savingsPct) savingsPct.textContent = '0% vs média';

        if (restoreUpload) {
            restoreUploadArea();
            document.querySelectorAll('.sort-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.sort === 'name');
            });
            const supplierFilter = document.getElementById('supplierFilter');
            if (supplierFilter) supplierFilter.value = '';
        }
        
        // Limpar tabela
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');
        if (tableHead) tableHead.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';
        
        // Resetar estatísticas
        const totalProductsEl = document.getElementById('totalProducts');
        const totalSuppliersEl = document.getElementById('totalSuppliers');
        const lowestPricesEl = document.getElementById('lowestPrices');
        
        if (totalProductsEl) totalProductsEl.textContent = '0';
        if (totalSuppliersEl) totalSuppliersEl.textContent = '0';
        if (lowestPricesEl) lowestPricesEl.textContent = '0';
        
        // Reconfigurar event listeners após limpar
        setTimeout(() => {
            setupGlobalEventListeners();
        }, 100);
        
        console.log('Dados limpos com sucesso - interface resetada');
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
            
            // CORRIGIDO: Pegar apenas o PRIMEIRO fornecedor com menor preço para evitar empates
            // Ordenar por nome do fornecedor para garantir consistência
            const itemsWithMinPrice = items.filter(item => item.price === minPrice);
            const sortedItems = itemsWithMinPrice.sort((a, b) => a.supplier.localeCompare(b.supplier));
            const selectedItem = sortedItems[0];
            
            if (selectedItem) {
                this.lowestPrices.set(`${selectedItem.product}-${selectedItem.supplier}`, true);
            }
        });
    }

    showLoading() {
        const uploadArea = document.getElementById('uploadArea');
        const analysisSection = document.getElementById('analysisSection');
        hideUploadError();

        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="loading-state" role="status" aria-live="polite" aria-label="Processando arquivo">
                    <div class="css-spinner" aria-hidden="true"></div>
                    <div class="upload-text">Processando arquivo...</div>
                    <p class="upload-hint">Aguarde enquanto analisamos os preços</p>
                </div>
            `;
        }

        if (analysisSection) analysisSection.style.display = 'none';
    }

    showError(title, message) {
        restoreUploadArea();
        const errorBox = document.getElementById('uploadError');
        const analysisSection = document.getElementById('analysisSection');

        if (errorBox) {
            errorBox.innerHTML = `
                <div class="error-box">
                    <div class="error-box-icon"><i class="fas fa-exclamation-circle" aria-hidden="true"></i></div>
                    <div class="error-box-content">
                        <strong>${title}</strong>
                        <p>${message}</p>
                        <p class="error-box-hint">Use coluna "Produto" na 1ª coluna e colunas de fornecedores com preços nas demais.</p>
                    </div>
                </div>
            `;
            errorBox.style.display = 'block';
        }

        if (analysisSection) analysisSection.style.display = 'none';
    }

    showAnalysis() {
        const uploadArea = document.getElementById('uploadArea');
        const analysisSection = document.getElementById('analysisSection');
        const successBanner = document.getElementById('successBanner');
        const successText = document.getElementById('successBannerText');

        if (uploadArea) {
            uploadArea.innerHTML = `
                <div class="upload-success-mini" role="status">
                    <i class="fas fa-check-circle" aria-hidden="true"></i>
                    <span>Arquivo carregado: <strong>${this.products.size}</strong> produtos, <strong>${this.suppliers.size}</strong> fornecedores</span>
                </div>
                <button type="button" class="btn btn-secondary" onclick="reloadForNewFile()">
                    <i class="fas fa-upload" aria-hidden="true"></i> Carregar outro arquivo
                </button>
            `;
        }

        if (analysisSection) analysisSection.style.display = 'block';

        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) menuToggle.classList.add('visible');

        document.getElementById('totalProducts').textContent = this.products.size;
        document.getElementById('totalSuppliers').textContent = this.suppliers.size;
        document.getElementById('lowestPrices').textContent = this.lowestPrices.size;

        this.updateSavingsDisplay();
        populateSupplierFilter();
        this.createPriceTable();
        this.logDebugInfo();

        if (successBanner && successText) {
            successText.textContent = `Análise concluída! ${this.products.size} produtos comparados entre ${this.suppliers.size} fornecedores.`;
            successBanner.style.display = 'flex';
        }

        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.value = '';
            document.getElementById('searchClear').style.display = 'none';
            document.getElementById('searchResultsInfo').style.display = 'none';
        }
        const supplierFilter = document.getElementById('supplierFilter');
        if (supplierFilter) supplierFilter.value = '';

        analysisSection.scrollIntoView({ behavior: 'smooth' });
    }

    calculatePotentialSavings() {
        let totalSavings = 0;
        let totalAverage = 0;

        this.products.forEach(product => {
            const items = this.data.filter(d => d.product === product);
            if (items.length === 0) return;
            const prices = items.map(i => i.price);
            const minPrice = Math.min(...prices);
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            totalSavings += Math.max(0, avgPrice - minPrice);
            totalAverage += avgPrice;
        });

        const percent = totalAverage > 0 ? (totalSavings / totalAverage) * 100 : 0;
        return { totalSavings, percent };
    }

    updateSavingsDisplay() {
        const { totalSavings, percent } = this.calculatePotentialSavings();
        const savingsEl = document.getElementById('potentialSavings');
        const pctEl = document.getElementById('potentialSavingsPercent');
        if (savingsEl) {
            savingsEl.textContent = `R$ ${totalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (pctEl) pctEl.textContent = `${percent.toFixed(1)}% vs média`;
    }

    getProductSummary() {
        const summaries = [];
        this.products.forEach(product => {
            const items = this.data.filter(d => d.product === product);
            const prices = items.map(i => i.price);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const winner = items.find(i => i.price === minPrice);
            const diffPercent = maxPrice > 0 ? ((maxPrice - minPrice) / maxPrice) * 100 : 0;
            summaries.push({
                product,
                winner: winner ? winner.supplier : '',
                minPrice,
                maxPrice,
                diffPercent,
                items
            });
        });
        return summaries;
    }

    getFilteredSortedData() {
        let data = [...this.data];
        const searchTerm = (document.getElementById('productSearch')?.value || '').toLowerCase().trim();
        const supplierFilter = document.getElementById('supplierFilter')?.value || '';

        if (searchTerm) {
            data = data.filter(item =>
                item.product.toLowerCase().includes(searchTerm) ||
                item.supplier.toLowerCase().includes(searchTerm)
            );
        }
        if (supplierFilter) {
            data = data.filter(item => item.supplier === supplierFilter);
        }

        if (this.sortMode === 'price-asc') {
            data.sort((a, b) => a.price - b.price || a.product.localeCompare(b.product));
        } else if (this.sortMode === 'price-desc') {
            data.sort((a, b) => b.price - a.price || a.product.localeCompare(b.product));
        } else {
            data.sort((a, b) => {
                if (a.product !== b.product) return a.product.localeCompare(b.product);
                return a.price - b.price;
            });
        }
        return data;
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
                <th>Produto</th>
                <th>Fornecedor</th>
                <th>Preço Unit.</th>
                <th>Status</th>
            </tr>
        `;

        // Corpo da tabela
        tableBody.innerHTML = '';
        
        const sortedData = this.getFilteredSortedData();

        let lastProduct = '';
        sortedData.forEach((item, index) => {
            const isLowest = this.lowestPrices.has(`${item.product}-${item.supplier}`);
            
            // Adicionar linha separadora se mudou o produto
            if (lastProduct !== '' && lastProduct !== item.product) {
                const separatorRow = document.createElement('tr');
                separatorRow.className = 'product-separator';
                separatorRow.innerHTML = '<td colspan="4" class="separator-cell"></td>';
                tableBody.appendChild(separatorRow);
            }
            
            const row = document.createElement('tr');
            
            // Verificar se é o menor preço real para este produto
            const productItems = this.data.filter(d => d.product === item.product);
            const realLowestPrice = Math.min(...productItems.map(p => p.price));
            const isRealLowest = item.price === realLowestPrice;
            
            // Determinar a mensagem de status
            let statusMessage = '';
            if (isLowest) {
                if (isRealLowest) {
                    statusMessage = '<span class="success">💰 Menor Preço</span>';
                } else {
                    statusMessage = '<span class="selected">✅ Preço Selecionado</span>';
                }
            }
            
            row.className = 'product-row';
            row.setAttribute('data-product-name', item.product.toLowerCase());
            row.setAttribute('data-supplier-name', item.supplier.toLowerCase());
            
            row.innerHTML = `
                <td class="product-name-cell">${item.product}</td>
                <td class="supplier-name-cell">${item.supplier}</td>
                <td class="${isLowest ? 'lowest-price' : ''} clickable-price" 
                    data-product="${item.product}"
                    data-supplier="${item.supplier}"
                    data-price="${item.price}"
                    style="cursor: pointer !important; position: relative !important;">
                    R$ ${item.price.toFixed(2).replace('.', ',')}
                </td>
                <td>${statusMessage}</td>
            `;
            
            // Adicionar event listener para o clique no preço
            const priceCell = row.querySelector('.clickable-price');
            if (priceCell) {
                console.log('Adicionando event listener para:', item.product, item.supplier, item.price);
                priceCell.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('CLIQUE DETECTADO!');
                    
                    const product = this.dataset.product;
                    const supplier = this.dataset.supplier;
                    const price = parseFloat(this.dataset.price);
                    
                    console.log('Dados do clique:', product, supplier, price);
                    
                    // Atualizar o menor preço para este produto
                    updateSelectedPrice(product, supplier, price);
                });
            } else {
                console.error('Célula de preço não encontrada para:', item.product);
            }
            
            tableBody.appendChild(row);
            
            // Atualizar o último produto processado
            lastProduct = item.product;
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

    logDebugInfo() {
        console.log('=== Debug Info ===');
        console.log('Produtos:', this.products.size);
        console.log('Fornecedores:', this.suppliers.size);
        console.log('Total de itens:', this.data.length);
        console.log('Menores preços:', this.lowestPrices.size);
        console.log('Fornecedores:', Array.from(this.suppliers).join(', '));
        const { totalSavings, percent } = this.calculatePotentialSavings();
        console.log('Economia potencial:', totalSavings.toFixed(2), `(${percent.toFixed(1)}%)`);
    }
}

// Função para atualizar o preço selecionado
function updateSelectedPrice(productName, selectedSupplier, selectedPrice) {
    console.log(`Atualizando preço selecionado: ${productName} - ${selectedSupplier} - R$ ${selectedPrice.toFixed(2)}`);
    
    // Atualizar o mapa de menores preços
    const oldKey = `${productName}-${window.priceAnalyzer.lowestPrices.get(`${productName}-${selectedSupplier}`) ? selectedSupplier : ''}`;
    
    // Remover todas as entradas antigas para este produto
    for (let [key, value] of window.priceAnalyzer.lowestPrices.entries()) {
        if (key.startsWith(`${productName}-`)) {
            window.priceAnalyzer.lowestPrices.delete(key);
        }
    }
    
    // Adicionar o novo menor preço selecionado
    const newKey = `${productName}-${selectedSupplier}`;
    window.priceAnalyzer.lowestPrices.set(newKey, selectedPrice);
    
    window.priceAnalyzer.updateSavingsDisplay();
    applyTableFilters();
    
    console.log(`Preço atualizado: ${productName} agora tem menor preço em ${selectedSupplier}`);
}

function getUploadAreaHTML() {
    return `
        <div class="upload-icon" aria-hidden="true">
            <i class="fas fa-cloud-upload-alt"></i>
        </div>
        <div class="upload-text">
            Arraste e solte seu arquivo Excel aqui ou clique para selecionar
        </div>
        <p class="upload-hint">Formatos aceitos: .xlsx e .xls (máx. 10 MB)</p>
        <input type="file" id="fileInput" class="file-input" accept=".xlsx,.xls" aria-hidden="true" />
        <button type="button" class="btn" onclick="openFileDialog()">
            <i class="fas fa-file-excel" aria-hidden="true"></i> Selecionar Arquivo Excel
        </button>
    `;
}

function restoreUploadArea() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;
    uploadArea.style.display = 'block';
    uploadArea.innerHTML = getUploadAreaHTML();
    uploadArea.setAttribute('role', 'button');
    uploadArea.setAttribute('tabindex', '0');
    uploadArea.setAttribute('aria-label', 'Área de upload. Arraste um arquivo Excel ou pressione Enter para selecionar');
    setupGlobalEventListeners();
    setupUploadKeyboard();
}

function hideUploadError() {
    const errorBox = document.getElementById('uploadError');
    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.innerHTML = '';
    }
}

function setupUploadKeyboard() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea || uploadArea.dataset.keyboardBound === 'true') return;

    uploadArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
        }
    });
    uploadArea.dataset.keyboardBound = 'true';
}

function reloadForNewFile() {
    if (window.priceAnalyzer) {
        window.priceAnalyzer.clearData(true);
    }
    hideUploadError();
    hideMenuOnReload();
}

function populateSupplierFilter() {
    const select = document.getElementById('supplierFilter');
    if (!select || !window.priceAnalyzer) return;

    const current = select.value;
    select.innerHTML = '<option value="">Todos os fornecedores</option>';
    Array.from(window.priceAnalyzer.suppliers).sort().forEach(supplier => {
        const opt = document.createElement('option');
        opt.value = supplier;
        opt.textContent = supplier;
        select.appendChild(opt);
    });
    if (current && Array.from(window.priceAnalyzer.suppliers).includes(current)) {
        select.value = current;
    }
}

function setSortMode(mode) {
    if (!window.priceAnalyzer) return;
    window.priceAnalyzer.sortMode = mode;
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === mode);
    });
    applyTableFilters();
}

function applyTableFilters() {
    if (!window.priceAnalyzer) return;
    window.priceAnalyzer.createPriceTable();

    const searchInput = document.getElementById('productSearch');
    const searchClear = document.getElementById('searchClear');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsText = document.getElementById('searchResultsText');

    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const supplierFilter = document.getElementById('supplierFilter')?.value || '';
    const totalCount = window.priceAnalyzer.data.length;

    if (searchClear) searchClear.style.display = searchTerm ? 'flex' : 'none';

    const filtered = window.priceAnalyzer.getFilteredSortedData();
    if (searchResultsInfo && searchResultsText) {
        if (searchTerm || supplierFilter) {
            searchResultsText.textContent = `${filtered.length} resultado(s) de ${totalCount} total`;
            searchResultsInfo.style.display = 'block';
        } else {
            searchResultsInfo.style.display = 'none';
        }
    }
}

function exportAnalysisResults() {
    if (!window.priceAnalyzer || window.priceAnalyzer.data.length === 0) {
        showInlineMessage('Nenhum dado para exportar. Carregue uma planilha primeiro.');
        return;
    }

    const summaries = window.priceAnalyzer.getProductSummary()
        .sort((a, b) => a.product.localeCompare(b.product));

    const rows = [
        ['Produto', 'Fornecedor Vencedor', 'Menor Preço']
    ];

    summaries.forEach(s => {
        rows.push([
            s.product,
            s.winner,
            s.minPrice
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, 'Resultados_Canaverde.xlsx');
}

function showInlineMessage(text) {
    const analysisSection = document.getElementById('analysisSection');
    const analysisVisible = analysisSection && analysisSection.style.display !== 'none';

    if (analysisVisible) {
        const banner = document.getElementById('successBanner');
        const bannerText = document.getElementById('successBannerText');
        if (banner && bannerText) {
            bannerText.textContent = text;
            banner.style.display = 'flex';
            banner.classList.add('warning');
            setTimeout(() => banner.classList.remove('warning'), 4000);
        }
        return;
    }

    const errorBox = document.getElementById('uploadError');
    if (errorBox) {
        errorBox.innerHTML = `
            <div class="error-box warning-box">
                <div class="error-box-icon"><i class="fas fa-info-circle" aria-hidden="true"></i></div>
                <div class="error-box-content">
                    <p>${text}</p>
                </div>
            </div>
        `;
        errorBox.style.display = 'block';
    }
}

// Função global para abrir o diálogo de arquivo
function openFileDialog() {
    // Criar um input de arquivo temporário e abrir o explorador
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.xls';
    fileInput.style.display = 'none';
    
    // Adicionar ao documento
    document.body.appendChild(fileInput);
    
    // Quando o arquivo for selecionado
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && window.priceAnalyzer) {
            console.log('Arquivo selecionado:', file.name);
            window.priceAnalyzer.handleFile(file);
        }
        // Remover o input temporário
        document.body.removeChild(fileInput);
    });
    
    // Abrir o explorador de arquivos
    fileInput.click();
}

function setupGlobalEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea || uploadArea.dataset.globalBound === 'true') return;

    uploadArea.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && window.priceAnalyzer) {
            window.priceAnalyzer.handleFile(files[0]);
        }
    });

    uploadArea.addEventListener('change', (e) => {
        if (e.target.id === 'fileInput' && window.priceAnalyzer) {
            window.priceAnalyzer.handleFileSelect(e);
        }
    });

    uploadArea.dataset.globalBound = 'true';
}

// Função para alternar o menu hambúrguer
function toggleMenu() {
    console.log('Menu hambúrguer clicado!');
    
    if (window.priceAnalyzer && window.priceAnalyzer.data.length > 0) {
        console.log('Dados encontrados, salvando...');
        
        // Salvar dados diretamente
        
        // Salvar dados no localStorage
        const dataToSave = {
            suppliers: Array.from(window.priceAnalyzer.suppliers),
            products: Array.from(window.priceAnalyzer.products),
            data: window.priceAnalyzer.data,
            lowestPrices: Array.from(window.priceAnalyzer.lowestPrices.entries()), // Já correto para Map
            timestamp: new Date().toISOString() // Adicionar timestamp para debug
        };
        
        localStorage.setItem('canaverdeData', JSON.stringify(dataToSave));
        
        // Salvar cópia original (para permitir reset na página de fornecedores)
        if (!localStorage.getItem('canaverdeDataOriginal')) {
            localStorage.setItem('canaverdeDataOriginal', JSON.stringify(dataToSave));
            console.log('Cópia original dos dados salva');
        }
        
        console.log('Dados salvos no localStorage:', dataToSave);
        console.log('Navegando para pages/suppliers.html...');
        
        // Mostrar feedback visual
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.style.opacity = '0.5';
            setTimeout(() => {
                menuToggle.style.opacity = '1';
            }, 200);
        }
        
        // Navegar diretamente para página de fornecedores
        try {
            console.log('Navegando para pages/suppliers.html...');
    window.location.href = 'pages/suppliers.html';
        } catch (error) {
            console.error('Erro na navegação:', error);
            alert('Erro: Não foi possível navegar para pages/suppliers.html\n\nVerifique se o arquivo pages/suppliers.html existe no mesmo diretório.');
        }
                        } else {
        console.log('Nenhum dado encontrado');
        showInlineMessage('Carregue uma planilha Excel primeiro para acessar o resumo de fornecedores.');
    }
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
            
            window.priceAnalyzer.createPriceTable();
            populateSupplierFilter();
            window.priceAnalyzer.updateSavingsDisplay();
            window.priceAnalyzer.logDebugInfo();

            const successBanner = document.getElementById('successBanner');
            if (successBanner) successBanner.style.display = 'flex';
            
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
            
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea && window.priceAnalyzer.data.length > 0) {
                uploadArea.innerHTML = `
                    <div class="upload-success-mini" role="status">
                        <i class="fas fa-check-circle" aria-hidden="true"></i>
                        <span>Arquivo carregado: <strong>${window.priceAnalyzer.products.size}</strong> produtos, <strong>${window.priceAnalyzer.suppliers.size}</strong> fornecedores</span>
                    </div>
                    <button type="button" class="btn btn-secondary" onclick="reloadForNewFile()">
                        <i class="fas fa-upload" aria-hidden="true"></i> Carregar outro arquivo
                    </button>
                `;
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

// Função para limpar completamente o localStorage
function clearAllData() {
    console.log('Limpando todos os dados do localStorage...');
    localStorage.removeItem('canaverdeData');
    console.log('localStorage limpo');
}

function searchProducts() {
    applyTableFilters();
}

function clearSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.value = '';
        applyTableFilters();
        searchInput.focus();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando...');
    
    // Configurar event listener para busca
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') clearSearch();
        });
    }

    setupUploadKeyboard();
    
    // Verificar se estamos voltando da página de fornecedores
    const urlParams = new URLSearchParams(window.location.search);
    const fromSuppliers = urlParams.get('fromSuppliers');
    
    if (fromSuppliers === 'true') {
        console.log('Voltando da página de fornecedores, restaurando dados...');
        // Não limpar dados, restaurar diretamente
    window.priceAnalyzer = new PriceAnalyzer();
        setupGlobalEventListeners();
        restoreDataFromSuppliers();
        
        // Limpar o parâmetro da URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        // Limpar dados antigos imediatamente apenas se não estamos voltando
        clearAllData();
        
        window.priceAnalyzer = new PriceAnalyzer();
        
        // Configurar event listeners globais
        setupGlobalEventListeners();
        
        // Não restaurar dados automaticamente - deixar usuário carregar novo arquivo
        console.log('Aguardando usuário carregar novo arquivo Excel...');
        
        // Garantir que interface esteja no estado inicial
        hideMenuOnReload();
    }
});