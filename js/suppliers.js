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
    
    // Agrupar produtos por fornecedor - APENAS os com menores preços
    const supplierGroups = {};
    const lowestPricesMap = new Map(data.lowestPrices || []);
    
    console.log('Mapa de menores preços:', lowestPricesMap);
    
    // Filtrar apenas produtos com menores preços
    const lowestPriceProducts = data.data.filter(item => 
        lowestPricesMap.has(`${item.product}-${item.supplier}`)
    );
    
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
                                   value="${quantity > 0 ? quantity : ''}" 
                                   min="0" 
                                   step="1"
                                   placeholder="0"
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
}

function handleDragEnd(event) {
    if (draggedElement) {
        draggedElement.style.opacity = '1';
    }
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
        
        // Limpar completamente o preço e reconstruir
        const cleanPrice = unitPrice.replace(/\s+/g, ' ').trim();
        
        whatsappText += `${index + 1}. *${productName}*\n`;
        whatsappText += `   • Quantidade: ${quantity} cx\n`;
        whatsappText += `   • Preço Unit.: ${cleanPrice}\n\n\n`;
        
        hasProducts = true;
    });
    
    if (!hasProducts) {
        whatsappText += `Nenhum produto com quantidade definida.\n\n`;
    }
    
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
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Adicionar estilos inline para a notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
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

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de fornecedores carregada');
    loadSuppliersData();
});
