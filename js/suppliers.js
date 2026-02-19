// Tipos de unidade disponíveis
const UNIT_TYPES = [
    { id: 'cx', label: 'Caixa', short: 'cx', icon: 'fa-box' },
    { id: 'fd', label: 'Fardo', short: 'fd', icon: 'fa-boxes' },
    { id: 'dp', label: 'Display', short: 'dp', icon: 'fa-th' },
    { id: 'un', label: 'Unidade', short: 'un', icon: 'fa-cube' }
];

function getProductUnit(productName, supplierName) {
    const units = JSON.parse(localStorage.getItem('productUnits') || '{}');
    return units[`${productName}-${supplierName}`] || 'cx';
}

function changeUnit(productName, supplierName, newUnit) {
    const units = JSON.parse(localStorage.getItem('productUnits') || '{}');
    units[`${productName}-${supplierName}`] = newUnit;
    localStorage.setItem('productUnits', JSON.stringify(units));

    const savedData = localStorage.getItem('canaverdeData');
    if (savedData) {
        const data = JSON.parse(savedData);
        createSupplierCards(data);
        updateStats(data);
    }

    const unitType = UNIT_TYPES.find(u => u.id === newUnit);
    showNotification(`✅ Unidade alterada para ${unitType ? unitType.label : newUnit}`, 'success');
}

function generateUnitOptions(productName, supplierName, currentUnit) {
    const escapedProduct = productName.replace(/'/g, "\\'");
    const escapedSupplier = supplierName.replace(/'/g, "\\'");
    return UNIT_TYPES.map(u => {
        const isActive = u.id === currentUnit;
        return `
            <button class="menu-option unit-option ${isActive ? 'unit-active' : ''}"
                    onclick="event.stopPropagation(); changeUnit('${escapedProduct}', '${escapedSupplier}', '${u.id}'); closeAllMenus();">
                <i class="fas ${u.icon}"></i> ${u.label} (${u.short})
                ${isActive ? '<i class="fas fa-check unit-check"></i>' : ''}
            </button>
        `;
    }).join('');
}

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
        
        // Atualizar seção de produtos removidos
        updateRemovedProductsSection();
        
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
    
    // Agrupar produtos por fornecedor - APENAS os com menores preços
    const supplierGroups = {};
    const lowestPricesMap = new Map(data.lowestPrices || []);
    
    console.log('Mapa de menores preços:', lowestPricesMap);
    
    // Filtrar apenas produtos com menores preços e garantir unicidade
    const lowestPriceProducts = [];
    const processedProducts = new Set();
    
    data.data.forEach(item => {
        const productKey = `${item.product}-${item.supplier}`;
        if (lowestPricesMap.has(productKey) && !processedProducts.has(item.product)) {
            lowestPriceProducts.push(item);
            processedProducts.add(item.product);
        }
    });
    
    console.log('Produtos com menores preços:', lowestPriceProducts);
    console.log('Total de produtos com menores preços:', lowestPriceProducts.length);
    
    lowestPriceProducts.forEach((item, index) => {
        console.log(`Processando produto ${index + 1}: ${item.product} - ${item.supplier}`);
        if (!supplierGroups[item.supplier]) {
            supplierGroups[item.supplier] = [];
        }
        supplierGroups[item.supplier].push(item);
    });
    
    console.log('Grupos de fornecedores (apenas menores preços):', supplierGroups);
    console.log('Total de grupos:', Object.keys(supplierGroups).length);
    
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
        console.log(`Produtos do fornecedor ${supplier}:`, products.map(p => p.product));
        
        const productsHtml = products.map((product, index) => {
            console.log(`Renderizando produto ${index + 1}/${products.length}: ${product.product}`);
            const quantity = product.quantity || 0;
            const totalPrice = product.price * quantity;
            const currentUnit = getProductUnit(product.product, product.supplier);
            const unitOptionsHtml = generateUnitOptions(product.product, product.supplier, currentUnit);
            
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
                        <div class="product-actions">
                            <div class="product-menu-container">
                                <button class="product-menu-btn" onclick="toggleProductMenu(event)" title="Opções">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="product-menu-dropdown">
                                    <button class="menu-option" onclick="showPriceComparison('${product.product}', '${product.supplier}'); closeAllMenus();">
                                        <i class="fas fa-balance-scale"></i> Comparar Preços
                                    </button>
                                    <div class="menu-divider"></div>
                                    <div class="menu-section-label"><i class="fas fa-ruler"></i> Unidade</div>
                                    ${unitOptionsHtml}
                                    <div class="menu-divider"></div>
                                    <button class="menu-option remove-option" onclick="removeProduct('${product.product}', '${product.supplier}'); closeAllMenus();">
                                        <i class="fas fa-trash-alt"></i> Remover
                                    </button>
                                </div>
                            </div>
                            <span class="drag-handle">⋮⋮</span>
                        </div>
                    </div>
                    <div class="product-details">
                        <div class="product-detail">
                            <span class="product-detail-label">Quantidade:</span>
                            <input type="number" 
                                   class="quantity-input-supplier" 
                                   value="${quantity > 0 ? quantity : ''}" 
                                   min="0" 
                                   step="1"
                                   placeholder="0"
                                   data-product="${product.product}"
                                   data-supplier="${product.supplier}"
                                   data-unit-price="${product.price}"
                                   onchange="updateSupplierQuantity(this)">
                            <span class="unit-badge" title="Altere nos 3 pontinhos">${currentUnit}</span>
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
                    </div>
                </div>
                <div class="products-list">
                    ${productsHtml}
                </div>
                <button class="copy-btn" onclick="copySupplierText('${supplier}')">
                    <i class="fas fa-copy"></i>
                    Copiar Lista para WhatsApp
                </button>
                <div class="supplier-finished" id="finished-${supplier.replace(/\s+/g, '-')}">
                    <input type="checkbox" id="checkbox-${supplier.replace(/\s+/g, '-')}" 
                           onchange="toggleSupplierFinished('${supplier}')">
                    <label for="checkbox-${supplier.replace(/\s+/g, '-')}">
                        Marcar como finalizado
                    </label>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = suppliersHtml;
    
    // Restaurar estado dos checkboxes
    restoreCheckboxStates();
    
    // Atualizar estatísticas após criar os cards
    updateSupplierStats();
}

// Função para atualizar quantidade
function updateSupplierQuantity(input) {
    const product = input.dataset.product;
    const supplier = input.dataset.supplier;
    const quantity = parseInt(input.value) || 0;
    
    console.log(`Atualizando quantidade: ${product} - ${supplier} - Qtd: ${quantity}`);
    
    // Atualizar estatísticas do fornecedor
    updateSupplierStats();
    
    // Salvar dados atualizados no localStorage
    saveUpdatedData();
}

// Função para atualizar estatísticas do fornecedor
function updateSupplierStats() {
    // Função simplificada - não precisa mais calcular valor total
    // As estatísticas são atualizadas automaticamente na criação dos cards
    console.log('Estatísticas dos fornecedores atualizadas');
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
let scrollInterval = null;
let isDragging = false;

// Função para scroll automático durante o drag
function startAutoScroll() {
    if (scrollInterval) return;
    
    scrollInterval = setInterval(() => {
        if (!isDragging) return;
        
        const mouseY = window.mouseY || 0;
        const windowHeight = window.innerHeight;
        const scrollThreshold = 100; // pixels da borda para iniciar scroll
        
        // Scroll para baixo se o mouse estiver próximo da borda inferior
        if (mouseY > windowHeight - scrollThreshold) {
            window.scrollBy(0, 10);
        }
        // Scroll para cima se o mouse estiver próximo da borda superior
        else if (mouseY < scrollThreshold) {
            window.scrollBy(0, -10);
        }
    }, 16); // ~60fps
}

function stopAutoScroll() {
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
}

// Funções de drag and drop
function handleDragStart(event) {
    // Encontrar o elemento product-item (container do produto)
    const productItem = event.target.closest('.product-item');
    if (!productItem) {
        console.error('Elemento product-item não encontrado');
        return;
    }
    
    draggedElement = productItem;
    draggedData = {
        product: productItem.dataset.product,
        supplier: productItem.dataset.supplier,
        unitPrice: parseFloat(productItem.dataset.unitPrice)
    };
    
    console.log('Iniciando drag:', draggedData);
    console.log('Elemento sendo arrastado:', productItem);
    
    productItem.style.opacity = '0.5';
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(draggedData));
    event.dataTransfer.setData('text/html', productItem.outerHTML);
    
    // Iniciar scroll automático
    isDragging = true;
    startAutoScroll();
}

function handleDragEnd(event) {
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }
    draggedElement = null;
    draggedData = null;
    
    // Parar scroll automático
    isDragging = false;
    stopAutoScroll();
    
    // Remover todas as classes de drop zone
    document.querySelectorAll('.supplier-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    console.log('Drag over fornecedor:', event.currentTarget.dataset.supplier);
}

function handleDragEnter(event) {
    event.preventDefault();
    const supplierCard = event.currentTarget;
    supplierCard.classList.add('drag-over');
    console.log('Drag enter fornecedor:', supplierCard.dataset.supplier);
}

function handleDragLeave(event) {
    const supplierCard = event.currentTarget;
    // Verificar se realmente saiu do card
    if (!supplierCard.contains(event.relatedTarget)) {
        supplierCard.classList.remove('drag-over');
        console.log('Drag leave fornecedor:', supplierCard.dataset.supplier);
    }
}

function handleDrop(event) {
    event.preventDefault();
    const supplierCard = event.currentTarget;
    const newSupplier = supplierCard.dataset.supplier;
    
    console.log('=== DROP EVENT TRIGGERED ===');
    console.log('Novo fornecedor:', newSupplier);
    console.log('Dados do produto arrastado (global):', draggedData);
    
    supplierCard.classList.remove('drag-over');
    
    if (!draggedData) {
        console.error('❌ Nenhum dado de drag encontrado!');
        return;
    }
    
    console.log(`Movendo ${draggedData.product} de ${draggedData.supplier} para ${newSupplier}`);
    console.log('Fornecedor atual:', draggedData.supplier);
    console.log('Novo fornecedor:', newSupplier);
    console.log('São diferentes?', draggedData.supplier !== newSupplier);
    
    // Verificar se não está tentando mover para o mesmo fornecedor
    if (draggedData.supplier === newSupplier) {
        console.log('❌ Tentativa de mover para o mesmo fornecedor, ignorando...');
        return;
    }
    
    console.log('✅ Fornecedores diferentes, prosseguindo...');
    
    // Encontrar o novo preço para este produto neste fornecedor
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        console.log('Dados carregados do localStorage:', data);
        
        // Encontrar o item com o novo preço - busca mais robusta
        console.log('Procurando produto:', draggedData.product);
        console.log('No fornecedor:', newSupplier);
        
        // Buscar por nome exato primeiro
        let newPriceItem = data.data.find(item => 
            item.product === draggedData.product && item.supplier === newSupplier
        );
        
        // Se não encontrar, buscar por similaridade (caso haja diferenças de espaços, etc.)
        if (!newPriceItem) {
            console.log('Busca exata falhou, tentando busca por similaridade...');
            newPriceItem = data.data.find(item => 
                item.product.trim() === draggedData.product.trim() && 
                item.supplier.trim() === newSupplier.trim()
            );
        }
        
        console.log('Item encontrado no novo fornecedor:', newPriceItem);
        
        if (!newPriceItem) {
            console.log(`⚠️ Produto ${draggedData.product} não encontrado no fornecedor ${newSupplier}`);
            console.log('Produtos disponíveis no fornecedor:', data.data.filter(item => item.supplier === newSupplier));
            
            // Tentar encontrar o produto em qualquer fornecedor para debug
            const productInAnySupplier = data.data.find(item => item.product === draggedData.product);
            console.log('Produto encontrado em outro fornecedor:', productInAnySupplier);
            
            // Se o produto não existe no fornecedor de destino, criar um novo item
            console.log('🔄 Criando novo item para o fornecedor de destino...');
            
            // Encontrar o preço mais próximo ou usar o preço atual
            const newPrice = draggedData.unitPrice; // Usar o preço atual como base
            
            // Criar novo item para o fornecedor de destino
            const newItem = {
                product: draggedData.product,
                supplier: newSupplier,
                price: newPrice,
                quantity: 0,
                totalPrice: 0
            };
            
            // Adicionar o novo item aos dados
            data.data.push(newItem);
            console.log('✅ Novo item criado:', newItem);
            
            // Usar o novo item como newPriceItem
            newPriceItem = newItem;
        }
        
        console.log('✅ Produto encontrado! Prosseguindo com a atualização...');
        
        // Atualizar os dados
        updateProductSupplier(data, draggedData.product, draggedData.supplier, newSupplier, newPriceItem.price);
        
        // Recriar a interface mantendo a ordem
        console.log('🔄 Recriando interface com dados atualizados...');
        createSupplierCards(data);
        updateStats(data);
        
        console.log(`✅ Produto movido com sucesso! Novo preço: R$ ${newPriceItem.price.toFixed(2)}`);
        console.log('Total de produtos após movimentação:', data.data.length);
        
    } catch (error) {
        console.error('❌ Erro ao processar drop:', error);
        console.error('Stack trace:', error.stack);
    }
}

function updateProductSupplier(data, productName, oldSupplier, newSupplier, newPrice) {
    console.log(`Atualizando produto: ${productName} de ${oldSupplier} para ${newSupplier}`);
    
    // Remover do fornecedor antigo
    const oldItem = data.data.find(item => 
        item.product === productName && item.supplier === oldSupplier
    );
    
    // Adicionar ao novo fornecedor
    const newItem = data.data.find(item => 
        item.product === productName && item.supplier === newSupplier
    );
    
    console.log('Item antigo encontrado:', oldItem);
    console.log('Item novo encontrado:', newItem);
    
    if (oldItem && newItem) {
        // Transferir quantidade se existir
        const quantity = oldItem.quantity || 0;
        newItem.quantity = quantity;
        
        // Limpar quantidade do item antigo
        oldItem.quantity = 0;
        
        console.log(`Quantidade transferida: ${quantity}`);
        
        // Atualizar menores preços
        const lowestPricesMap = new Map(data.lowestPrices);
        const oldKey = `${productName}-${oldSupplier}`;
        const newKey = `${productName}-${newSupplier}`;
        
        console.log('Chaves de menores preços:', { oldKey, newKey });
        console.log('Mapa antes da atualização:', lowestPricesMap);
        
        // Remover do fornecedor antigo
        lowestPricesMap.delete(oldKey);
        
        // Adicionar ao novo fornecedor
        lowestPricesMap.set(newKey, newPrice);
        
        console.log('Mapa após atualização:', lowestPricesMap);
        
        data.lowestPrices = Array.from(lowestPricesMap.entries());
        
        // Transferir unidade do produto para o novo fornecedor
        const units = JSON.parse(localStorage.getItem('productUnits') || '{}');
        const oldUnitKey = `${productName}-${oldSupplier}`;
        const newUnitKey = `${productName}-${newSupplier}`;
        if (units[oldUnitKey]) {
            units[newUnitKey] = units[oldUnitKey];
            delete units[oldUnitKey];
            localStorage.setItem('productUnits', JSON.stringify(units));
        }
        
        // Salvar dados atualizados
        localStorage.setItem('canaverdeData', JSON.stringify(data));
        
        console.log(`Produto ${productName} movido de ${oldSupplier} para ${newSupplier}`);
        console.log('Dados salvos no localStorage');
    }
}

// Função para copiar texto do fornecedor formatado para WhatsApp
function copySupplierText(supplierName) {
    console.log(`Copiando texto do fornecedor: ${supplierName}`);
    
    // Encontrar o card do fornecedor
    const supplierCard = document.querySelector(`[data-supplier="${supplierName}"]`);
    if (!supplierCard) {
        console.error('Card do fornecedor não encontrado');
        return;
    }
    
    // Coletar dados dos produtos
    const products = supplierCard.querySelectorAll('.product-item');
    const supplierStats = supplierCard.querySelectorAll('.supplier-stat');
    
    // Formatar texto para WhatsApp
    let whatsappText = `🛒 *${supplierName}*\n\n`;
    
    // Adicionar estatísticas do fornecedor
    if (supplierStats.length >= 1) {
        const totalProducts = supplierStats[0].querySelector('.supplier-stat-number').textContent;
        whatsappText += `📊 *Estatísticas:*\n`;
        whatsappText += `• Produtos: ${totalProducts}\n\n`;
    }
    
    // Adicionar lista de produtos
    whatsappText += `📋 *Lista de Produtos:*\n`;
    
    let hasProducts = false;
    products.forEach((product, index) => {
        const productName = product.querySelector('.product-name').textContent;
        const quantityInput = product.querySelector('.quantity-input-supplier');
        const unitPrice = product.querySelector('.product-detail-value').textContent;
        
        const quantity = quantityInput.value || '0';
        const unitBadge = product.querySelector('.unit-badge');
        const unit = unitBadge ? unitBadge.textContent.trim() : 'cx';
        
        // Limpar completamente o preço e reconstruir
        const cleanPrice = unitPrice.replace(/\s+/g, ' ').trim();
        
        whatsappText += `${index + 1}. *${productName}*\n`;
        whatsappText += `   • Quantidade: ${quantity} ${unit}\n`;
        whatsappText += `   • Preço Unit.: ${cleanPrice}\n\n\n`;
        
        hasProducts = true;
    });
    
    if (!hasProducts) {
        whatsappText += `Nenhum produto com quantidade definida.\n\n`;
    }
    
    // Adicionar mensagem final
    whatsappText += `\nBoa Tarde\n\nSegue pedido Canaverde`;
    
    // Copiar para área de transferência
    navigator.clipboard.writeText(whatsappText).then(() => {
        console.log('Texto copiado com sucesso!');
        
        // Feedback visual
        const button = supplierCard.querySelector('.copy-btn');
        const originalText = button.innerHTML;
        
        button.classList.add('copied');
        button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        
        // Restaurar botão após 2 segundos
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalText;
        }, 2000);
        
        // Mostrar notificação
        showNotification('✅ Lista copiada para área de transferência!', 'success');
        
    }).catch(err => {
        console.error('Erro ao copiar texto:', err);
        
        // Fallback: mostrar texto em modal
        showTextModal(whatsappText, supplierName);
    });
}

// Função para mostrar notificação
function showNotification(message, type = 'info') {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Adicionar estilos inline para a notificação
    const bgColor = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8';
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    // Atualizar ícone
    const iconElement = notification.querySelector('i');
    if (iconElement) {
        iconElement.className = `fas fa-${icon}`;
    }
    
    // Adicionar animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .notification-content i {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Função para mostrar texto em modal (fallback)
function showTextModal(text, supplierName) {
    // Remover modal anterior se existir
    const existingModal = document.querySelector('.text-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'text-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 Lista do Fornecedor: ${supplierName}</h3>
                <button class="modal-close" onclick="this.closest('.text-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <textarea readonly>${text}</textarea>
                <div class="modal-actions">
                    <button class="btn" onclick="copyTextFromModal(this)">
                        <i class="fas fa-copy"></i> Copiar Texto
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar estilos inline para o modal
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        max-width: 600px;
        width: 90%;
        max-height: 80%;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;
    
    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const modalBody = modal.querySelector('.modal-body');
    modalBody.style.cssText = `
        padding: 20px;
    `;
    
    const textarea = modal.querySelector('textarea');
    textarea.style.cssText = `
        width: 100%;
        height: 300px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        padding: 15px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        resize: vertical;
        margin-bottom: 15px;
    `;
    
    const modalActions = modal.querySelector('.modal-actions');
    modalActions.style.cssText = `
        text-align: center;
    `;
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Função para copiar texto do modal
function copyTextFromModal(button) {
    const modal = button.closest('.text-modal');
    const textarea = modal.querySelector('textarea');
    
    textarea.select();
    document.execCommand('copy');
    
    // Feedback visual
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    button.style.background = '#28a745';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);
    
    showNotification('✅ Texto copiado com sucesso!', 'success');
}

// Função para alternar estado do checkbox de fornecedor finalizado
function toggleSupplierFinished(supplierName) {
    const checkboxId = `checkbox-${supplierName.replace(/\s+/g, '-')}`;
    const checkbox = document.getElementById(checkboxId);
    const finishedDiv = document.getElementById(`finished-${supplierName.replace(/\s+/g, '-')}`);
    
    if (checkbox && finishedDiv) {
        const isChecked = checkbox.checked;
        
        // Atualizar visual
        if (isChecked) {
            finishedDiv.classList.add('checked');
        } else {
            finishedDiv.classList.remove('checked');
        }
        
        // Salvar estado no localStorage
        saveCheckboxState(supplierName, isChecked);
        
        // Mostrar notificação
        const message = isChecked ? '✅ Fornecedor marcado como finalizado!' : '📝 Fornecedor desmarcado';
        showNotification(message, 'success');
    }
}

// Função para salvar estado dos checkboxes
function saveCheckboxState(supplierName, isFinished) {
    const finishedSuppliers = JSON.parse(localStorage.getItem('finishedSuppliers') || '{}');
    finishedSuppliers[supplierName] = isFinished;
    localStorage.setItem('finishedSuppliers', JSON.stringify(finishedSuppliers));
    console.log(`Estado do fornecedor ${supplierName} salvo: ${isFinished}`);
}

// Função para restaurar estado dos checkboxes
function restoreCheckboxStates() {
    const finishedSuppliers = JSON.parse(localStorage.getItem('finishedSuppliers') || '{}');
    
    Object.keys(finishedSuppliers).forEach(supplierName => {
        const checkboxId = `checkbox-${supplierName.replace(/\s+/g, '-')}`;
        const checkbox = document.getElementById(checkboxId);
        const finishedDiv = document.getElementById(`finished-${supplierName.replace(/\s+/g, '-')}`);
        
        if (checkbox && finishedDiv && finishedSuppliers[supplierName]) {
            checkbox.checked = true;
            finishedDiv.classList.add('checked');
        }
    });
    
    console.log('Estados dos checkboxes restaurados:', finishedSuppliers);
}

// Função para remover produto
function removeProduct(productName, supplierName) {
    console.log(`Removendo produto: ${productName} do fornecedor: ${supplierName}`);
    
    // Confirmar remoção
    if (!confirm(`Deseja remover "${productName}" do fornecedor "${supplierName}"?`)) {
        return;
    }
    
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Encontrar o item a ser removido
        const itemToRemove = data.data.find(item => 
            item.product === productName && item.supplier === supplierName
        );
        
        if (!itemToRemove) {
            console.error('Produto não encontrado para remoção');
            return;
        }
        
        // Salvar produto removido
        const removedProducts = JSON.parse(localStorage.getItem('removedProducts') || '[]');
        removedProducts.push({
            product: productName,
            supplier: supplierName,
            price: itemToRemove.price,
            quantity: itemToRemove.quantity || 0,
            removedAt: new Date().toISOString()
        });
        localStorage.setItem('removedProducts', JSON.stringify(removedProducts));
        
        // Remover do mapa de menores preços
        const lowestPricesMap = new Map(data.lowestPrices || []);
        const keyToRemove = `${productName}-${supplierName}`;
        lowestPricesMap.delete(keyToRemove);
        data.lowestPrices = Array.from(lowestPricesMap.entries());
        
        // Salvar dados atualizados
        localStorage.setItem('canaverdeData', JSON.stringify(data));
        
        // Recriar interface
        createSupplierCards(data);
        updateStats(data);
        
        // Atualizar seção de produtos removidos
        updateRemovedProductsSection();
        
        // Mostrar notificação
        showNotification(`✅ Produto "${productName}" removido com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        showNotification('❌ Erro ao remover produto', 'error');
    }
}

// Função para atualizar seção de produtos removidos
function updateRemovedProductsSection() {
    const removedProducts = JSON.parse(localStorage.getItem('removedProducts') || '[]');
    const section = document.getElementById('removedProductsSection');
    const container = document.getElementById('removedProductsContainer');
    
    if (!section || !container) return;
    
    if (removedProducts.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    // Agrupar por fornecedor
    const groupedBySupplier = {};
    removedProducts.forEach(item => {
        if (!groupedBySupplier[item.supplier]) {
            groupedBySupplier[item.supplier] = [];
        }
        groupedBySupplier[item.supplier].push(item);
    });
    
    // Criar HTML
    let html = '';
    Object.keys(groupedBySupplier).forEach(supplier => {
        const products = groupedBySupplier[supplier];
        html += `
            <div class="removed-supplier-group">
                <div class="removed-supplier-header">
                    <i class="fas fa-store"></i>
                    <strong>${supplier}</strong>
                    <span class="removed-count">${products.length} produto(s)</span>
                </div>
                <div class="removed-products-list">
                    ${products.map(item => `
                        <div class="removed-product-item">
                            <div class="removed-product-info">
                                <span class="removed-product-name">${item.product}</span>
                                <span class="removed-product-price">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <button class="restore-product-btn" onclick="restoreProduct('${item.product}', '${item.supplier}')">
                                <i class="fas fa-undo"></i> Restaurar
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Função para restaurar produto
function restoreProduct(productName, supplierName) {
    console.log(`Restaurando produto: ${productName} para fornecedor: ${supplierName}`);
    
    const savedData = localStorage.getItem('canaverdeData');
    const removedProducts = JSON.parse(localStorage.getItem('removedProducts') || '[]');
    
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Encontrar o produto removido
        const removedIndex = removedProducts.findIndex(item => 
            item.product === productName && item.supplier === supplierName
        );
        
        if (removedIndex === -1) {
            console.error('Produto removido não encontrado');
            return;
        }
        
        const removedItem = removedProducts[removedIndex];
        
        // Verificar se o produto já existe nos dados
        const existingItem = data.data.find(item => 
            item.product === productName && item.supplier === supplierName
        );
        
        if (!existingItem) {
            // Adicionar de volta aos dados
            data.data.push({
                product: productName,
                supplier: supplierName,
                price: removedItem.price,
                quantity: removedItem.quantity || 0,
                totalPrice: 0
            });
        }
        
        // Adicionar de volta ao mapa de menores preços
        const lowestPricesMap = new Map(data.lowestPrices || []);
        const keyToRestore = `${productName}-${supplierName}`;
        lowestPricesMap.set(keyToRestore, removedItem.price);
        data.lowestPrices = Array.from(lowestPricesMap.entries());
        
        // Remover da lista de produtos removidos
        removedProducts.splice(removedIndex, 1);
        localStorage.setItem('removedProducts', JSON.stringify(removedProducts));
        
        // Salvar dados atualizados
        localStorage.setItem('canaverdeData', JSON.stringify(data));
        
        // Recriar interface
        createSupplierCards(data);
        updateStats(data);
        
        // Atualizar seção de produtos removidos
        updateRemovedProductsSection();
        
        // Mostrar notificação
        showNotification(`✅ Produto "${productName}" restaurado com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro ao restaurar produto:', error);
        showNotification('❌ Erro ao restaurar produto', 'error');
    }
}

// Função para alternar visibilidade dos produtos removidos
function toggleRemovedProducts() {
    const container = document.getElementById('removedProductsContainer');
    const toggleText = document.getElementById('toggleRemovedText');
    
    if (!container || !toggleText) return;
    
    const isVisible = container.style.display !== 'none';
    container.style.display = isVisible ? 'none' : 'block';
    toggleText.textContent = isVisible ? 'Mostrar' : 'Ocultar';
}

// Função para abrir/fechar o menu de opções do produto
function toggleProductMenu(event) {
    event.stopPropagation();
    event.preventDefault();
    
    const btn = event.currentTarget;
    const sourceDropdown = btn.nextElementSibling;
    const productItem = btn.closest('.product-item');
    
    // Verificar se este menu já está aberto
    const existingPortal = document.getElementById('menu-portal');
    const wasThisMenu = existingPortal && existingPortal._sourceBtn === btn;
    
    // Fechar tudo primeiro
    closeAllMenus();
    
    // Se era o mesmo botão, apenas fechar
    if (wasThisMenu) return;
    
    // Criar portal no body com o conteúdo do dropdown
    const portal = document.createElement('div');
    portal.id = 'menu-portal';
    portal.innerHTML = sourceDropdown.innerHTML;
    portal._sourceBtn = btn;
    document.body.appendChild(portal);
    
    if (productItem) productItem.classList.add('menu-open');
    
    // Posicionar após renderização
    requestAnimationFrame(() => {
        const btnRect = btn.getBoundingClientRect();
        const portalRect = portal.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        
        let top = btnRect.bottom + 4;
        let left = btnRect.right - portalRect.width;
        
        if (left < 8) left = 8;
        if (left + portalRect.width > vw - 8) left = vw - portalRect.width - 8;
        if (top + portalRect.height > vh - 8) top = btnRect.top - portalRect.height - 4;
        if (top < 8) top = 8;
        
        portal.style.top = `${top}px`;
        portal.style.left = `${left}px`;
    });
}

// Função para fechar todos os menus dropdown
function closeAllMenus() {
    const portal = document.getElementById('menu-portal');
    if (portal) portal.remove();
    document.querySelectorAll('.product-item.menu-open').forEach(item => {
        item.classList.remove('menu-open');
    });
}

// Função para mostrar comparação de preços entre fornecedores
function showPriceComparison(productName, currentSupplier) {
    console.log(`Comparando preços para: ${productName} (fornecedor atual: ${currentSupplier})`);
    
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) {
        showNotification('❌ Nenhum dado encontrado', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        
        // Encontrar todos os preços para este produto em todos os fornecedores
        const productPrices = data.data.filter(item => item.product === productName);
        
        if (productPrices.length === 0) {
            showNotification('❌ Nenhum preço encontrado para este produto', 'error');
            return;
        }
        
        // Ordenar por preço (menor primeiro)
        productPrices.sort((a, b) => a.price - b.price);
        
        const lowestPrice = productPrices[0].price;
        const highestPrice = productPrices[productPrices.length - 1].price;
        
        // Criar o overlay do modal
        const overlay = document.createElement('div');
        overlay.className = 'price-comparison-overlay';
        overlay.onclick = function(e) {
            if (e.target === overlay) {
                closePriceComparison();
            }
        };
        
        // Gerar itens da comparação
        let comparisonItems = productPrices.map((item, index) => {
            const isLowest = item.price === lowestPrice;
            const isCurrent = item.supplier === currentSupplier;
            const diff = item.price - lowestPrice;
            const diffPercent = lowestPrice > 0 ? ((diff / lowestPrice) * 100).toFixed(1) : 0;
            
            let badges = '';
            if (isLowest) {
                badges += '<span class="comparison-badge lowest-badge"><i class="fas fa-trophy"></i> Menor Preço</span>';
            }
            if (isCurrent) {
                badges += '<span class="comparison-badge current-badge"><i class="fas fa-map-marker-alt"></i> Atual</span>';
            }
            
            let diffText = '';
            if (!isLowest) {
                diffText = `<span class="comparison-diff">+${diffPercent}% (R$ ${diff.toFixed(2).replace('.', ',')} a mais)</span>`;
            }
            
            // Botão de selecionar (só aparece se não for o fornecedor atual)
            let selectBtn = '';
            if (isCurrent) {
                selectBtn = '<div class="comparison-select-current"><i class="fas fa-check-circle"></i> Selecionado</div>';
            } else {
                selectBtn = `<button class="comparison-select-btn" data-product="${productName}" data-old-supplier="${currentSupplier}" data-new-supplier="${item.supplier}" data-new-price="${item.price}"><i class="fas fa-exchange-alt"></i> Selecionar</button>`;
            }
            
            return `
                <div class="comparison-item ${isLowest ? 'is-lowest' : ''} ${isCurrent ? 'is-current' : ''}">
                    <div class="comparison-rank">${index + 1}º</div>
                    <div class="comparison-info">
                        <div class="comparison-supplier">
                            <i class="fas fa-store"></i>
                            ${item.supplier}
                        </div>
                        <div class="comparison-badges">${badges}</div>
                        ${diffText}
                    </div>
                    <div class="comparison-right">
                        <div class="comparison-price">
                            R$ ${item.price.toFixed(2).replace('.', ',')}
                        </div>
                        ${selectBtn}
                    </div>
                </div>
            `;
        }).join('');
        
        overlay.innerHTML = `
            <div class="price-comparison-modal">
                <div class="comparison-header">
                    <div class="comparison-title">
                        <i class="fas fa-balance-scale"></i>
                        <h3>Comparar Preços</h3>
                    </div>
                    <button class="comparison-close" onclick="closePriceComparison()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="comparison-product-name">
                    <i class="fas fa-box"></i>
                    ${productName}
                </div>
                <div class="comparison-list">
                    ${comparisonItems}
                </div>
                <div class="comparison-footer">
                    <span class="comparison-total-suppliers">
                        <i class="fas fa-store"></i> ${productPrices.length} fornecedor(es)
                    </span>
                    <span class="comparison-price-range">
                        R$ ${lowestPrice.toFixed(2).replace('.', ',')} - R$ ${highestPrice.toFixed(2).replace('.', ',')}
                    </span>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Adicionar event listeners nos botões de selecionar
        overlay.querySelectorAll('.comparison-select-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const prodName = this.dataset.product;
                const oldSupplier = this.dataset.oldSupplier;
                const newSupplier = this.dataset.newSupplier;
                const newPrice = parseFloat(this.dataset.newPrice);
                
                switchProductSupplier(prodName, oldSupplier, newSupplier, newPrice);
            });
        });
        
        // Animar entrada
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
        
    } catch (error) {
        console.error('Erro ao comparar preços:', error);
        showNotification('❌ Erro ao comparar preços', 'error');
    }
}

// Função para trocar o produto de fornecedor a partir da comparação
function switchProductSupplier(productName, oldSupplier, newSupplier, newPrice) {
    console.log(`Trocando ${productName} de ${oldSupplier} para ${newSupplier} (R$ ${newPrice})`);
    
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Atualizar usando a mesma lógica do drag and drop
        updateProductSupplier(data, productName, oldSupplier, newSupplier, newPrice);
        
        // Fechar o modal
        closePriceComparison();
        
        // Recriar a interface com dados atualizados
        createSupplierCards(data);
        updateStats(data);
        
        // Mostrar notificação de sucesso
        showNotification(`✅ "${productName}" movido para ${newSupplier} (R$ ${newPrice.toFixed(2).replace('.', ',')})`, 'success');
        
        console.log(`Produto ${productName} movido de ${oldSupplier} para ${newSupplier}`);
        
    } catch (error) {
        console.error('Erro ao trocar fornecedor:', error);
        showNotification('❌ Erro ao trocar fornecedor', 'error');
    }
}

// Função para fechar modal de comparação de preços
function closePriceComparison() {
    const overlay = document.querySelector('.price-comparison-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}

// Função para exportar planilha Excel com células selecionadas em amarelo
async function exportHighlightedExcel() {
    console.log('Exportando planilha com destaques...');
    
    const savedData = localStorage.getItem('canaverdeData');
    if (!savedData) {
        showNotification('❌ Nenhum dado encontrado para exportar', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(savedData);
        const lowestPricesMap = new Map(data.lowestPrices || []);
        const removedProducts = JSON.parse(localStorage.getItem('removedProducts') || '[]');
        const removedSet = new Set(removedProducts.map(r => `${r.product}-${r.supplier}`));
        
        // Obter lista de fornecedores na ordem original
        const suppliers = data.suppliers || [];
        
        // Obter lista de produtos únicos na ordem original dos dados
        const productsOrder = [];
        const productsSeen = new Set();
        data.data.forEach(item => {
            if (!productsSeen.has(item.product)) {
                productsSeen.add(item.product);
                productsOrder.push(item.product);
            }
        });
        
        // Criar mapa de preços: produto -> fornecedor -> preço
        const priceMap = {};
        data.data.forEach(item => {
            if (!priceMap[item.product]) {
                priceMap[item.product] = {};
            }
            priceMap[item.product][item.supplier] = item.price;
        });
        
        // Criar mapa de quantidades
        const quantityMap = {};
        data.data.forEach(item => {
            if (!quantityMap[item.product]) {
                quantityMap[item.product] = item.quantity || 0;
            }
        });
        
        // Descobrir quais produtos estão selecionados e para qual fornecedor
        const selectedProducts = new Set();
        for (let [key] of lowestPricesMap) {
            const productName = key.substring(0, key.lastIndexOf('-'));
            if (!removedSet.has(key)) {
                selectedProducts.add(productName);
            }
        }
        
        // Criar workbook com ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Cotação');
        
        // Configuração de página para impressão A4
        const totalCols = 2 + suppliers.length;
        const useLandscape = totalCols > 5;
        
        worksheet.pageSetup = {
            paperSize: 9,
            orientation: useLandscape ? 'landscape' : 'portrait',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            horizontalCentered: true,
            verticalCentered: false,
            margins: {
                left: 0.25,
                right: 0.25,
                top: 0.4,
                bottom: 0.4,
                header: 0.2,
                footer: 0.2
            }
        };
        
        // Repetir cabeçalho em todas as páginas ao imprimir
        worksheet.pageSetup.printTitlesRow = '1:1';
        
        // Definir cabeçalhos
        const headers = ['Produto', 'Quantidade', ...suppliers];
        const headerRow = worksheet.addRow(headers);
        
        // Tamanho de fonte adaptável ao número de fornecedores
        const headerFontSize = suppliers.length > 10 ? 7 : 8;
        const productFontSize = suppliers.length > 10 ? 7 : 8;
        const priceFontSize = suppliers.length > 10 ? 7 : 8;
        
        // Estilizar cabeçalho
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2E7D32' }
            };
            cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' },
                size: headerFontSize,
                name: 'Arial'
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF1B5E20' } },
                bottom: { style: 'thin', color: { argb: 'FF1B5E20' } },
                left: { style: 'thin', color: { argb: 'FF1B5E20' } },
                right: { style: 'thin', color: { argb: 'FF1B5E20' } }
            };
        });
        
        // Preencher dados por produto
        productsOrder.forEach(product => {
            const prices = priceMap[product] || {};
            const quantity = quantityMap[product] || 0;
            
            const rowData = [product, quantity > 0 ? quantity : ''];
            
            suppliers.forEach(supplier => {
                rowData.push(prices[supplier] || '');
            });
            
            const row = worksheet.addRow(rowData);
            
            // Estilizar cada célula
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                };
                
                if (colNumber === 1) {
                    cell.font = { bold: true, size: productFontSize, name: 'Arial' };
                    cell.alignment = { vertical: 'middle', wrapText: true };
                }
                
                if (colNumber === 2) {
                    cell.font = { size: priceFontSize, name: 'Arial' };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
                
                if (colNumber >= 3) {
                    const supplierIndex = colNumber - 3;
                    const supplier = suppliers[supplierIndex];
                    const key = `${product}-${supplier}`;
                    
                    cell.font = { size: priceFontSize, name: 'Arial' };
                    
                    if (cell.value && typeof cell.value === 'number') {
                        cell.numFmt = '#,##0.00';
                    }
                    
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    
                    if (lowestPricesMap.has(key) && !removedSet.has(key)) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFFF00' }
                        };
                        cell.font = { bold: true, size: priceFontSize, name: 'Arial' };
                    }
                }
            });
        });
        
        // Calcular larguras de coluna otimizadas para caber em A4
        const maxPageWidth = useLandscape ? 140 : 100;
        const qtyColWidth = 6;
        const supplierColWidth = Math.max(7, Math.min(12, Math.floor((maxPageWidth * 0.65) / suppliers.length)));
        const productColWidth = Math.max(18, maxPageWidth - qtyColWidth - (suppliers.length * supplierColWidth));
        
        worksheet.getColumn(1).width = productColWidth;
        worksheet.getColumn(2).width = qtyColWidth;
        for (let i = 3; i <= suppliers.length + 2; i++) {
            worksheet.getColumn(i).width = supplierColWidth;
        }
        
        // Altura das linhas compacta para impressão
        worksheet.eachRow((row) => {
            row.height = 15;
        });
        headerRow.height = 22;
        
        // Linhas zebradas para facilitar leitura na impressão
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber % 2 === 0) {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    if (!cell.fill || !cell.fill.fgColor || cell.fill.fgColor.argb !== 'FFFFFF00') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF5F5F5' }
                        };
                    }
                });
            }
        });
        
        // Gerar arquivo e fazer download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Cotacao_Canaverde.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Planilha exportada com sucesso!', 'success');
        console.log('Planilha exportada com destaques amarelos');
        
    } catch (error) {
        console.error('Erro ao exportar planilha:', error);
        showNotification('❌ Erro ao exportar planilha', 'error');
    }
}

// Função para resetar todos os dados ao estado original da planilha
function resetAllData() {
    const originalData = localStorage.getItem('canaverdeDataOriginal');
    
    if (!originalData) {
        showNotification('❌ Nenhum dado original encontrado. Carregue a planilha novamente.', 'error');
        return;
    }
    
    if (!confirm('Tem certeza que deseja resetar tudo?\n\nIsso vai:\n• Restaurar todos os produtos removidos\n• Desfazer todas as trocas de fornecedor\n• Voltar ao estado original da planilha')) {
        return;
    }
    
    try {
        // Restaurar dados originais
        localStorage.setItem('canaverdeData', originalData);
        
        // Limpar produtos removidos
        localStorage.removeItem('removedProducts');
        
        // Limpar checkboxes de finalizado
        localStorage.removeItem('finishedSuppliers');
        
        // Limpar unidades customizadas
        localStorage.removeItem('productUnits');
        
        // Recarregar a interface com os dados originais
        const data = JSON.parse(originalData);
        
        createSupplierCards(data);
        updateStats(data);
        updateRemovedProductsSection();
        
        showNotification('✅ Tudo foi resetado ao estado original da planilha!', 'success');
        
        console.log('Dados resetados ao estado original');
        
    } catch (error) {
        console.error('Erro ao resetar dados:', error);
        showNotification('❌ Erro ao resetar dados', 'error');
    }
}

// Fechar menus ao clicar fora
document.addEventListener('click', function(event) {
    if (!event.target.closest('.product-menu-container') && !event.target.closest('#menu-portal')) {
        closeAllMenus();
    }
});

// Fechar menus ao rolar a página (dropdown usa position: fixed)
let scrollCloseTimeout = null;
window.addEventListener('scroll', function() {
    clearTimeout(scrollCloseTimeout);
    scrollCloseTimeout = setTimeout(closeAllMenus, 50);
}, true);

// Fechar modal com Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePriceComparison();
        closeAllMenus();
    }
});

// Rastrear posição do mouse para scroll automático
document.addEventListener('mousemove', (event) => {
    window.mouseY = event.clientY;
});

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de fornecedores carregada');
    loadSuppliersData();
    updateRemovedProductsSection();
});
