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
    
    // Navegar de volta para a página principal
    window.location.href = 'index.html';
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
    
    // Criar HTML para cada fornecedor
    const suppliersHtml = Object.keys(supplierGroups).map(supplier => {
        const products = supplierGroups[supplier];
        
        console.log(`Fornecedor: ${supplier}, Produtos com menor preço: ${products.length}`);
        
        const productsHtml = products.map(product => {
            const quantity = product.quantity || 0;
            const totalPrice = product.price * quantity;
            
            console.log(`Produto: ${product.product}, Qtd: ${quantity}`);
            
            return `
                <div class="product-item lowest-price">
                    <div class="product-header">
                        <span class="product-name">${product.product}</span>
                    </div>
                    <div class="product-details">
                        <div class="product-detail">
                            <span class="product-detail-label">Quantidade:</span>
                            <span class="product-detail-value">${quantity}</span>
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
            <div class="supplier-card">
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

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de fornecedores carregada');
    loadSuppliersData();
});
