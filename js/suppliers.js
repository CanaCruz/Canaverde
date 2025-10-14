// Função para voltar à página principal
function goBackToMain() {
    console.log('Voltando para página principal...');
    
    // Verificar se há dados salvos e mantê-los
    const savedData = localStorage.getItem('canaverdeData');
    if (savedData) {
        console.log('Dados encontrados, mantendo no localStorage:', savedData);
        // Os dados já estão salvos, apenas navegar
    } else {
        console.log('Nenhum dado encontrado no localStorage');
    }
    
    // Adicionar parâmetro para indicar que estamos voltando da página de fornecedores
    window.location.href = '../index.html?fromSuppliers=true';
}

// Função para carregar dados na página de fornecedores
function loadSuppliersData() {
    console.log('Iniciando carregamento de dados...');
    const savedData = localStorage.getItem('canaverdeData');
    
    if (!savedData) {
        console.log('Nenhum dado encontrado no localStorage');
        showNoDataMessage();
        return;
    }
    
    console.log('Dados encontrados no localStorage:', savedData);
    
    try {
        const data = JSON.parse(savedData);
        console.log('Dados parseados:', data);
        
        // Verificar se há dados válidos
        if (!data.data || data.data.length === 0) {
            console.log('Dados inválidos ou vazios');
            showNoDataMessage();
            return;
        }
        
        console.log(`Encontrados ${data.data.length} itens de dados`);
        console.log(`Fornecedores: ${data.suppliers ? data.suppliers.length : 0}`);
        console.log(`Produtos: ${data.products ? data.products.length : 0}`);
        console.log(`Menores preços: ${data.lowestPrices ? data.lowestPrices.length : 0}`);
        
        // Atualizar estatísticas
        updateStats(data);
        
        // Criar cards de fornecedores
        createSupplierCards(data);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNoDataMessage();
    }
}

// Função para mostrar mensagem quando não há dados
function showNoDataMessage() {
    const container = document.getElementById('suppliersContainer');
    if (container) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-box-open"></i>
                <h3>Nenhum dado encontrado</h3>
                <p>Carregue uma planilha Excel na página principal para visualizar os produtos por fornecedor.</p>
            </div>
        `;
    }
}

// Função para atualizar estatísticas
function updateStats(data) {
    const totalSuppliersEl = document.getElementById('totalSuppliersPage');
    const totalProductsEl = document.getElementById('totalProductsPage');
    const lowestPricesEl = document.getElementById('lowestPricesPage');
    
    // Contar apenas fornecedores que têm produtos com menores preços
    const lowestPricesMap = new Map(data.lowestPrices || []);
    const suppliersWithLowestPrices = new Set();
    
    data.data.forEach(item => {
        if (lowestPricesMap.has(`${item.product}-${item.supplier}`)) {
            suppliersWithLowestPrices.add(item.supplier);
        }
    });
    
    // Contar apenas produtos com menores preços
    const lowestPriceProductsCount = data.data.filter(item => 
        lowestPricesMap.has(`${item.product}-${item.supplier}`)
    ).length;
    
    if (totalSuppliersEl) totalSuppliersEl.textContent = suppliersWithLowestPrices.size;
    if (totalProductsEl) totalProductsEl.textContent = lowestPriceProductsCount;
    if (lowestPricesEl) lowestPricesEl.textContent = data.lowestPrices ? data.lowestPrices.length : 0;
}

// Função para criar cards de fornecedores
function createSupplierCards(data) {
    const container = document.getElementById('suppliersContainer');
    if (!container) return;
    
    console.log('Criando cards de fornecedores com dados:', data);
    
    // Agrupar produtos por fornecedor
    const supplierGroups = {};
    const lowestPricesMap = new Map(data.lowestPrices || []);
    
    console.log('Mapa de menores preços:', lowestPricesMap);
    
    // Filtrar apenas produtos com menores preços
    const lowestPriceProducts = data.data.filter(item => 
        lowestPricesMap.has(`${item.product}-${item.supplier}`)
    );
    
    console.log('Produtos com menores preços:', lowestPriceProducts);
    
    lowestPriceProducts.forEach(item => {
        if (!supplierGroups[item.supplier]) {
            supplierGroups[item.supplier] = [];
        }
        supplierGroups[item.supplier].push(item);
    });
    
    console.log('Grupos de fornecedores (apenas menores preços):', supplierGroups);
    
    // Se não há fornecedores, mostrar mensagem
    if (Object.keys(supplierGroups).length === 0) {
        showNoDataMessage();
        return;
    }
    
    // Manter ordem original dos fornecedores baseada na ordem dos dados originais
    const originalSupplierOrder = [...new Set(data.data.map(item => item.supplier))];
    const orderedSuppliers = originalSupplierOrder.filter(supplier => supplierGroups[supplier]);
    
    console.log('Ordem original dos fornecedores:', originalSupplierOrder);
    console.log('Fornecedores com produtos (ordenados):', orderedSuppliers);
    
    // Criar HTML para cada fornecedor na ordem original
    const suppliersHtml = orderedSuppliers.map(supplier => {
        const products = supplierGroups[supplier];
        
        console.log(`Fornecedor: ${supplier}, Produtos com menor preço: ${products.length}`);
        
        const productsHtml = products.map(product => {
            const quantity = product.quantity || 0;
            const totalPrice = product.price * quantity;
            
            console.log(`Produto: ${product.product}, Qtd: ${quantity}`);
            
            return `
                <div class="product-item lowest-price" 
                     draggable="true" 
                     data-product="${product.product}"
                     data-supplier="${product.supplier}"
                     data-unit-price="${product.price}"
                     ondragstart="handleDragStart(event)"
                     ondragend="handleDragEnd(event)">
                    <div class="product-header">
                        <span class="product-name">${product.product}</span>
                        <span class="drag-handle">⋮⋮</span>
                    </div>
                    <div class="product-details">
                        <div class="product-detail">
                            <span class="product-detail-label">Quantidade:</span>
                            <input type="number" 
                                   class="quantity-input-supplier" 
                                   value="${quantity}" 
                                   min="0" 
                                   step="1"
                                   data-product="${product.product}"
                                   data-supplier="${product.supplier}"
                                   data-unit-price="${product.price}"
                                   onchange="updateSupplierQuantity(this)">
                        </div>
                        <div class="product-detail">
                            <span class="product-detail-label">Preço Unit.:</span>
                            <span class="product-detail-value lowest">
                                R$ ${product.price.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="supplier-card" 
                 data-supplier="${supplier}"
                 ondragover="handleDragOver(event)"
                 ondrop="handleDrop(event)"
                 ondragenter="handleDragEnter(event)"
                 ondragleave="handleDragLeave(event)">
                <div class="supplier-header">
                    <div class="supplier-name">
                        <i class="fas fa-store"></i>
                        ${supplier}
                    </div>
                    <div class="supplier-stats">
                        <div class="supplier-stat">
                            <div class="supplier-stat-number">${products.length}</div>
                            <div class="supplier-stat-label">Menores Preços</div>
                        </div>
                        <div class="supplier-stat">
                            <div class="supplier-stat-number">R$ ${products.reduce((sum, p) => sum + (p.price * (p.quantity || 0)), 0).toFixed(2).replace('.', ',')}</div>
                            <div class="supplier-stat-label">Valor Total</div>
                        </div>
                    </div>
                </div>
                <div class="products-list">
                    ${productsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = suppliersHtml;
}

// Função para atualizar quantidade
function updateSupplierQuantity(input) {
    const product = input.dataset.product;
    const supplier = input.dataset.supplier;
    const quantity = parseInt(input.value) || 0;
    
    console.log(`Atualizando quantidade: ${product} - ${supplier} - Qtd: ${quantity}`);
    
    // Salvar dados atualizados no localStorage
    saveUpdatedData();
}

// Função para atualizar estatísticas do fornecedor
function updateSupplierStats() {
    const supplierCards = document.querySelectorAll('.supplier-card');
    
    supplierCards.forEach(card => {
        const products = card.querySelectorAll('.product-item');
        let totalValue = 0;
        
        products.forEach(product => {
            const quantityInput = product.querySelector('.quantity-input-supplier');
            const unitPrice = parseFloat(quantityInput.dataset.unitPrice) || 0;
            const quantity = parseInt(quantityInput.value) || 0;
            const totalPrice = unitPrice * quantity;
            totalValue += totalPrice;
        });
        
        // Atualizar valor total no cabeçalho do fornecedor
        const valueStat = card.querySelector('.supplier-stat:last-child .supplier-stat-number');
        if (valueStat) {
            valueStat.textContent = `R$ ${totalValue.toFixed(2).replace('.', ',')}`;
        }
    });
}

// Função para salvar dados atualizados
function saveUpdatedData() {
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Atualizar quantidades nos dados
        const quantityInputs = document.querySelectorAll('.quantity-input-supplier');
        quantityInputs.forEach(input => {
            const product = input.dataset.product;
            const supplier = input.dataset.supplier;
            const quantity = parseInt(input.value) || 0;
            
            const dataItem = data.data.find(item => 
                item.product === product && item.supplier === supplier
            );
            
            if (dataItem) {
                dataItem.quantity = quantity;
            }
        });
        
        // Salvar dados atualizados
        localStorage.setItem('canaverdeData', JSON.stringify(data));
        console.log('Dados atualizados salvos no localStorage');
        
    } catch (error) {
        console.error('Erro ao salvar dados atualizados:', error);
    }
}

// Variáveis globais para drag and drop
let draggedElement = null;
let draggedData = null;

// Funções de drag and drop
function handleDragStart(event) {
    draggedElement = event.target;
    draggedData = {
        product: event.target.dataset.product,
        supplier: event.target.dataset.supplier,
        unitPrice: parseFloat(event.target.dataset.unitPrice)
    };
    
    event.target.style.opacity = '0.5';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.outerHTML);
    
    console.log('Iniciando drag:', draggedData);
}

function handleDragEnd(event) {
    event.target.style.opacity = '1';
    draggedElement = null;
    draggedData = null;
    
    // Remover todas as classes de drop zone
    document.querySelectorAll('.supplier-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(event) {
    event.preventDefault();
    const supplierCard = event.currentTarget;
    supplierCard.classList.add('drag-over');
}

function handleDragLeave(event) {
    const supplierCard = event.currentTarget;
    // Só remove a classe se realmente saiu do card (não apenas de um filho)
    if (!supplierCard.contains(event.relatedTarget)) {
        supplierCard.classList.remove('drag-over');
    }
}

function handleDrop(event) {
    event.preventDefault();
    const supplierCard = event.currentTarget;
    const newSupplier = supplierCard.dataset.supplier;
    
    supplierCard.classList.remove('drag-over');
    
    if (!draggedData) return;
    
    console.log(`Movendo ${draggedData.product} de ${draggedData.supplier} para ${newSupplier}`);
    
    // Encontrar o novo preço para este produto neste fornecedor
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Encontrar o item com o novo preço
        const newPriceItem = data.data.find(item => 
            item.product === draggedData.product && item.supplier === newSupplier
        );
        
        if (!newPriceItem) {
            console.error('Preço não encontrado para o novo fornecedor');
            return;
        }
        
        // Atualizar os dados
        updateProductSupplier(data, draggedData.product, draggedData.supplier, newSupplier, newPriceItem.price);
        
        // Recriar a interface mantendo a ordem
        createSupplierCards(data);
        updateStats(data);
        
        console.log(`Produto movido com sucesso! Novo preço: R$ ${newPriceItem.price.toFixed(2)}`);
        
    } catch (error) {
        console.error('Erro ao processar drop:', error);
    }
}

function updateProductSupplier(data, productName, oldSupplier, newSupplier, newPrice) {
    // Remover do fornecedor antigo
    const oldItem = data.data.find(item => 
        item.product === productName && item.supplier === oldSupplier
    );
    
    // Adicionar ao novo fornecedor
    const newItem = data.data.find(item => 
        item.product === productName && item.supplier === newSupplier
    );
    
    if (oldItem && newItem) {
        // Transferir quantidade se existir
        const quantity = oldItem.quantity || 0;
        newItem.quantity = quantity;
        
        // Limpar quantidade do item antigo
        oldItem.quantity = 0;
        
        // Atualizar menores preços
        const lowestPricesMap = new Map(data.lowestPrices);
        const oldKey = `${productName}-${oldSupplier}`;
        const newKey = `${productName}-${newSupplier}`;
        
        // Remover do fornecedor antigo
        lowestPricesMap.delete(oldKey);
        
        // Adicionar ao novo fornecedor
        lowestPricesMap.set(newKey, newPrice);
        
        data.lowestPrices = Array.from(lowestPricesMap.entries());
        
        // Salvar dados atualizados
        localStorage.setItem('canaverdeData', JSON.stringify(data));
        
        console.log(`Produto ${productName} movido de ${oldSupplier} para ${newSupplier}`);
    }
}

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de fornecedores carregada');
    loadSuppliersData();
});
