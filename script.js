// --- Database Engine (IndexedDB) ---
const DB_NAME = 'PharmacyDB';
const DB_VERSION = 2;

let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('suppliers')) db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('orders')) db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        };
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject('DB Error: ' + e.target.error);
    });
}

function performTransaction(storeName, mode, operation) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = operation(store);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

// --- Auth Module ---
const Auth = {
    login: async (username, password) => {
        // Hardcoded super-admin fallback
        if (username === 'admin' && password === 'admin') {
            const user = { name: 'Super Admin', role: 'Super Admin' };
            sessionStorage.setItem('pharma_user', JSON.stringify(user));
            return true;
        }

        // Check IndexedDB users
        try {
            const users = await performTransaction('users', 'readonly', s => s.getAll());
            const found = users.find(u => u.username === username && u.password === password);
            if (found) {
                const user = { name: found.username, role: found.role };
                sessionStorage.setItem('pharma_user', JSON.stringify(user));
                return true;
            }
        } catch (e) {
            console.error("Login DB Error:", e);
        }
        return false;
    },
    logout: () => {
        sessionStorage.removeItem('pharma_user');
        location.reload();
    },
    isLoggedIn: () => !!sessionStorage.getItem('pharma_user'),
    getUser: () => JSON.parse(sessionStorage.getItem('pharma_user') || '{}')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    await seedData();
    setupEventListeners();
    checkAuth();
});

async function seedData() {
    const products = await performTransaction('products', 'readonly', s => s.getAll());
    if (products.length > 0) return;

    const suppliers = [
        { name: 'Global Pharma', contact: 'sales@globalpharma.com' },
        { name: 'BioHealth Corp', contact: 'orders@biohealth.co' },
        { name: 'PureMed Supplies', contact: 'support@puremed.com' }
    ];
    for (const s of suppliers) await performTransaction('suppliers', 'readwrite', store => store.add(s));

    const sampleProducts = [
        { name: 'Panadol 500mg', category: 'Analgesics', unitPrice: 2.5, stockQty: 150, description: 'Quick relief from pain and fever.', supplier: 'Global Pharma', location: 'Rack A-1' },
        { name: 'Amoxicillin 250mg', category: 'Antibiotics', unitPrice: 5.0, stockQty: 80, description: 'Effective against bacterial infections.', supplier: 'BioHealth Corp', location: 'Shelf B-2' },
        { name: 'Dettol Antiseptic', category: 'Antiseptics', unitPrice: 3.5, stockQty: 45, description: 'Liquid antiseptic for wounds.', supplier: 'PureMed Supplies', location: 'OTC Area' },
        { name: 'Vitamin C 1000mg', category: 'Supplements', unitPrice: 12.0, stockQty: 200, description: 'Daily immune system support.', supplier: 'BioHealth Corp', location: 'Rack C-1' },
        { name: 'Ibuprofen 200mg', category: 'Analgesics', unitPrice: 4.0, stockQty: 120, description: 'Anti-inflammatory pain reliever.', supplier: 'Global Pharma', location: 'Rack A-2' },
        { name: 'Azithromycin 500mg', category: 'Antibiotics', unitPrice: 15.0, stockQty: 50, description: 'Broad-spectrum antibiotic.', supplier: 'BioHealth Corp', location: 'Shelf B-1' },
        { name: 'Hand Sanitizer 500ml', category: 'Antiseptics', unitPrice: 6.5, stockQty: 100, description: 'Kills 99.9% of germs instantly.', supplier: 'PureMed Supplies', location: 'OTC Area' },
        { name: 'Multivitamin Gold', category: 'Supplements', unitPrice: 25.0, stockQty: 30, description: 'Complete daily nutritional support.', supplier: 'Global Pharma', location: 'Rack C-2' },
        { name: 'Aspirin 81mg', category: 'Analgesics', unitPrice: 1.5, stockQty: 300, description: 'Low-dose heart health support.', supplier: 'PureMed Supplies', location: 'Rack A-3' },
        { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', unitPrice: 18.0, stockQty: 40, description: 'Used for severe infections.', supplier: 'BioHealth Corp', location: 'Shelf B-3' },
        { name: 'Betadine Solution', category: 'Antiseptics', unitPrice: 5.5, stockQty: 60, description: 'Povidone-iodine for wound care.', supplier: 'Global Pharma', location: 'Rack D-1' },
        { name: 'Fish Oil 1000mg', category: 'Supplements', unitPrice: 20.0, stockQty: 75, description: 'Supports heart and brain health.', supplier: 'PureMed Supplies', location: 'Rack C-3' },
        { name: 'Paracetamol Syrup', category: 'Analgesics', unitPrice: 4.5, stockQty: 90, description: 'Fever relief for children.', supplier: 'BioHealth Corp', location: 'Rack A-4' },
        { name: 'Cephalexin 500mg', category: 'Antibiotics', unitPrice: 10.0, stockQty: 55, description: 'Upper respiratory infection relief.', supplier: 'Global Pharma', location: 'Shelf B-4' },
        { name: 'Calcium + D3', category: 'Supplements', unitPrice: 14.0, stockQty: 110, description: 'Bone and teeth health support.', supplier: 'PureMed Supplies', location: 'Rack C-4' }
    ];
    for (const p of sampleProducts) await performTransaction('products', 'readwrite', store => store.add(p));
}

function setupEventListeners() {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        if (await Auth.login(u, p)) checkAuth();
        else alert('Invalid credentials!');
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => Auth.logout());

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            switchSection(item.dataset.section);
        });
    });

    // Add shortcuts
    document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal());
    document.getElementById('add-supplier-btn')?.addEventListener('click', () => openSupplierModal());
    document.getElementById('add-order-btn')?.addEventListener('click', () => openOrderModal());
    document.getElementById('add-admin-btn')?.addEventListener('click', () => openAdminModal());
    document.getElementById('view-all-tx-btn')?.addEventListener('click', () => openAllTransactionsModal());
    document.getElementById('view-all-orders-btn')?.addEventListener('click', () => openAllOrdersModal());

    // Transaction filters
    document.getElementById('tx-filter-name')?.addEventListener('input', () => renderAllTransactionsTable());
    document.getElementById('tx-filter-type')?.addEventListener('change', () => renderAllTransactionsTable());
    document.getElementById('tx-filter-from')?.addEventListener('change', () => renderAllTransactionsTable());
    document.getElementById('tx-filter-to')?.addEventListener('change', () => renderAllTransactionsTable());
    document.getElementById('download-tx-btn')?.addEventListener('click', () => downloadTransactionsPDF());

    // Order filters
    document.getElementById('order-filter-name')?.addEventListener('input', () => renderAllOrdersTable());
    document.getElementById('order-filter-status')?.addEventListener('change', () => renderAllOrdersTable());
    document.getElementById('order-filter-from')?.addEventListener('change', () => renderAllOrdersTable());
    document.getElementById('order-filter-to')?.addEventListener('change', () => renderAllOrdersTable());
    document.getElementById('modal-download-orders-btn')?.addEventListener('click', () => downloadOrdersPDF());

    // Analytics search
    document.getElementById('analytics-search')?.addEventListener('input', (e) => renderAdvancedAnalytics(e.target.value));

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
    });

    document.getElementById('edit-order-status-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-order-id').value);
        const newStatus = document.getElementById('edit-order-status-select').value;
        const fromGlobal = document.getElementById('edit-order-status-modal').getAttribute('data-global') === 'true';

        const order = await performTransaction('orders', 'readonly', s => s.get(id));
        if (order) {
            order.status = newStatus;
            await performTransaction('orders', 'readwrite', s => s.put(order));
        }

        document.getElementById('edit-order-status-modal').style.display = 'none';
        renderOrders();
        renderDashboard();
        if (fromGlobal) renderAllOrdersTable();
    });
}

function checkAuth() {
    const user = Auth.getUser();
    if (Auth.isLoggedIn()) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('login-section').classList.remove('active');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('display-user-name').textContent = user.name;
        renderDashboard();
    } else {
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('login-section').classList.add('active');
        document.getElementById('app-container').classList.add('hidden');
    }
}

// --- Section Handlers ---

async function renderDashboard() {
    const [p, o, s] = await Promise.all([
        performTransaction('products', 'readonly', s => s.getAll()),
        performTransaction('orders', 'readonly', s => s.getAll()),
        performTransaction('suppliers', 'readonly', s => s.getAll())
    ]);
    document.getElementById('count-total-products').textContent = p.length;
    document.getElementById('count-low-stock').textContent = p.filter(x => x.stockQty < 30).length;
    document.getElementById('count-suppliers').textContent = s.length;
    const today = new Date().toLocaleDateString();
    document.getElementById('count-today-orders').textContent = o.filter(x => new Date(x.date).toLocaleDateString() === today).length;

    initDashboardAnalytics(p, o, s);
}

function initDashboardAnalytics(products, orders, suppliers, suffix = '') {
    // 1. Products Chart (Category Distribution)
    const catMap = {}; products.forEach(x => catMap[x.category] = (catMap[x.category] || 0) + 1);
    createChart(`chartProducts${suffix}`, 'doughnut', { labels: Object.keys(catMap), datasets: [{ data: Object.values(catMap), backgroundColor: ['#00a884', '#3498db', '#e74c3c', '#f1c40f'] }] }, { cutout: '70%', plugins: { legend: { position: 'bottom' }, maintainAspectRatio: false } });

    // 2. Low Stock Chart (Items < 30)
    const lowStock = products.filter(x => x.stockQty < 30);
    createChart(`chartLowStock${suffix}`, 'bar', { labels: lowStock.map(x => x.name), datasets: [{ label: 'Stock', data: lowStock.map(x => x.stockQty), backgroundColor: '#ef4444' }] }, { indexAxis: 'y', plugins: { legend: { display: false }, maintainAspectRatio: false } });

    // 3. Orders Chart (Today vs History)
    const today = new Date().toLocaleDateString();
    const todayCount = orders.filter(x => new Date(x.date).toLocaleDateString() === today).length;
    createChart(`chartOrders${suffix}`, 'bar', { labels: ['Today', 'Daily Avg'], datasets: [{ data: [todayCount, Math.max(1, Math.round(orders.length / 7))], backgroundColor: ['#00a884', '#e5e7eb'] }] }, { plugins: { legend: { display: false }, maintainAspectRatio: false } });

    // 4. Suppliers Chart (Network distribution)
    const suppMap = {}; products.forEach(p => { if (p.supplier) suppMap[p.supplier] = (suppMap[p.supplier] || 0) + 1; });
    createChart(`chartSuppliers${suffix}`, 'polarArea', { labels: Object.keys(suppMap), datasets: [{ data: Object.values(suppMap), backgroundColor: ['#00a884', '#3498db', '#e74c3c', '#f1c40f'] }] }, { plugins: { legend: { position: 'bottom' }, maintainAspectRatio: false } });
}

async function renderAdvancedAnalytics(filter = '') {
    const products = await performTransaction('products', 'readonly', s => s.getAll());
    const query = filter.toLowerCase().trim();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));

    const defaultView = document.getElementById('analytics-default-view');
    const deepDiveView = document.getElementById('analytics-deep-dive');

    if (query && filtered.length === 1) {
        defaultView.style.display = 'none';
        deepDiveView.style.display = 'block';
        renderProductDeepDive(filtered[0]);
    } else {
        defaultView.style.display = 'block';
        deepDiveView.style.display = 'none';
        createChart('chartIndividualStock', 'bar', {
            labels: filtered.map(p => p.name),
            datasets: [{
                label: 'Stock Level',
                data: filtered.map(p => p.stockQty),
                backgroundColor: filtered.map(p => p.stockQty < 30 ? '#ef4444' : '#00a884'),
                borderRadius: 6
            }]
        }, {
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (item) => ` Stock: ${item.raw} units`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, title: { display: true, text: 'Quantity' } },
                y: { grid: { display: false } }
            }
        });
    }
}

async function renderProductDeepDive(product) {
    document.getElementById('deep-dive-title').textContent = `${product.name} - Stock Trend`;
    const txs = await performTransaction('transactions', 'readonly', s => s.getAll());
    const productTxs = txs.filter(t => t.productId === product.id).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Trend
    let current = 0;
    const trendLabels = [];
    const trendData = [];

    productTxs.forEach(t => {
        if (t.type === 'Purchase' || t.type === 'Initial') current += t.quantity;
        else if (t.type === 'Sale') current -= t.quantity;

        trendLabels.push(new Date(t.date).toLocaleDateString());
        trendData.push(current);
    });

    // 1. Line Chart
    createChart('chartStockTrend', 'line', {
        labels: trendLabels,
        datasets: [{
            label: 'Inventory Level',
            data: trendData,
            borderColor: '#00a884',
            backgroundColor: 'rgba(0, 168, 132, 0.1)',
            fill: true,
            tension: 0.3
        }]
    }, {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
    });

    // 2. Mix Chart
    const mix = { Sales: 0, Purchases: 0, Initial: 0 };
    productTxs.forEach(t => {
        if (mix[t.type] !== undefined) mix[t.type]++;
        else if (t.type === 'Sale') mix.Sales++;
        else if (t.type === 'Purchase') mix.Purchases++;
    });

    createChart('chartTransactionMix', 'doughnut', {
        labels: Object.keys(mix),
        datasets: [{
            data: Object.values(mix),
            backgroundColor: ['#ef4444', '#00a884', '#3498db']
        }]
    }, { cutout: '60%', plugins: { legend: { position: 'bottom' } } });

    // 3. Facts
    document.getElementById('deep-dive-facts').innerHTML = `
        <div class="analytic-card">
            <p style="color:var(--text-muted); font-size:0.9rem;">Unit Price</p>
            <h2 style="margin-top:5px;">$${parseFloat(product.unitPrice).toFixed(2)}</h2>
        </div>
        <div class="analytic-card">
            <p style="color:var(--text-muted); font-size:0.9rem;">Category</p>
            <h2 style="margin-top:5px;">${product.category}</h2>
        </div>
        <div class="analytic-card">
            <p style="color:var(--text-muted); font-size:0.9rem;">Supplier</p>
            <h2 style="margin-top:5px; font-size:1.2rem;">${product.supplier || 'N/A'}</h2>
        </div>
    `;
}

const chartInstances = {};
function createChart(canvasId, type, data, options) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();
    chartInstances[canvasId] = new Chart(ctx, { type, data, options: { ...options, responsive: true, maintainAspectRatio: false } });
}

async function renderProducts() {
    const products = await performTransaction('products', 'readonly', s => s.getAll());
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.name}</strong></td>
            <td style="color:var(--text-muted); font-size:0.85rem;">${p.description || 'No description provided.'}</td>
            <td>$${parseFloat(p.unitPrice).toFixed(2)}</td>
            <td>${p.stockQty}</td>
            <td><span style="background:#f1f5f9; padding:4px 8px; border-radius:4px; font-size:0.8rem;">${p.category}</span></td>
            <td style="color:var(--primary-color); font-weight:500;">${p.supplier || 'info@medilife.com'}</td>
            <td>
                <div class="action-icons">
                    <span class="action-icon-btn restock" onclick="openPurchaseModal(${p.id})">🛒</span>
                    <span class="action-icon-btn" onclick="openProductModal(${p.id})">📝</span>
                    <span class="action-icon-btn" style="color:#2563eb" onclick="openInfoModal(${p.id})">ⓘ</span>
                    <span class="action-icon-btn delete" onclick="deleteProduct(${p.id})">🗑️</span>
                </div>
            </td>
        `;
        if (p.stockQty < 30) tr.classList.add('low-stock-row');
        tbody.appendChild(tr);
    });
}

async function renderSuppliers() {
    const suppliers = await performTransaction('suppliers', 'readonly', s => s.getAll());
    const tbody = document.querySelector('#suppliers-table tbody');
    tbody.innerHTML = '';
    suppliers.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${index + 1}</td><td><strong>${s.name}</strong></td><td>${s.contact}</td>
            <td><div class="action-icons">
                <span class="action-icon-btn" onclick="openSupplierModal(${s.id})">📝</span>
                <span class="action-icon-btn delete" onclick="deleteSupplier(${s.id})">🗑️</span>
            </div></td>`;
        tbody.appendChild(tr);
    });
}

async function renderOrders() {
    const orders = await performTransaction('orders', 'readonly', s => s.getAll());
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';
    orders.forEach(o => {
        const tr = document.createElement('tr');
        const status = o.status || 'pending';
        tr.innerHTML = `<td>#ORD-${o.id}</td><td>${o.customerName || 'Unknown'}</td><td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
            <td>${new Date(o.date).toLocaleDateString()}</td>
            <td>
                <div class="action-icons">
                    <span class="action-icon-btn edit" onclick="openEditOrderStatusModal(${o.id})" title="Edit Status">📝</span>
                    <span class="action-icon-btn delete" onclick="deleteOrder(${o.id})">🗑️</span>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

async function renderAdmins() {
    const admins = await performTransaction('users', 'readonly', s => s.getAll());
    const tbody = document.querySelector('#admins-table tbody');
    tbody.innerHTML = '';
    admins.forEach((a, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${index + 1}</td><td>${a.username}</td><td>${a.role}</td>
            <td><div class="action-icons"><span class="action-icon-btn delete" onclick="deleteAdmin(${a.id})">🗑️</span></div></td>`;
        tbody.appendChild(tr);
    });
}

async function switchSection(id) {
    document.querySelectorAll('.content-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'dashboard') renderDashboard();
    if (id === 'products') renderProducts();
    if (id === 'suppliers') renderSuppliers();
    if (id === 'orders') renderOrders();
    if (id === 'admins') renderAdmins();
    if (id === 'analytics') {
        renderAdvancedAnalytics();
    }
}

// --- Modal Logic ---

window.openInfoModal = async (id) => {
    const p = await performTransaction('products', 'readonly', s => s.get(id));
    if (!p) return;
    document.getElementById('info-product-name').textContent = p.name;
    const txs = await performTransaction('transactions', 'readonly', s => s.getAll());
    const productTxs = txs.filter(t => t.productId === id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const tbody = document.querySelector('#info-transactions-table tbody');
    tbody.innerHTML = '';

    if (productTxs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1rem; color:var(--text-muted)">No transaction history yet.</td></tr>';
    } else {
        productTxs.forEach(t => {
            const tr = document.createElement('tr');
            const qtyClass = t.type === 'Purchase' || t.type === 'Initial' ? 'text-green' : 'text-red';
            const qtySign = t.type === 'Purchase' || t.type === 'Initial' ? '+' : '-';
            tr.innerHTML = `
                <td><strong>${t.type}</strong></td>
                <td class="${qtyClass}">${qtySign}${Math.abs(t.quantity)}</td>
                <td>${t.relatedTo || '-'}</td>
                <td>${new Date(t.date).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    document.getElementById('info-modal').style.display = 'flex';
};

window.openPurchaseModal = async (id) => {
    const p = await performTransaction('products', 'readonly', s => s.get(id));
    if (!p) return;
    document.getElementById('pur-id').value = p.id;
    document.getElementById('pur-product-name').textContent = p.name;
    document.getElementById('pur-qty').value = '';
    document.getElementById('purchase-modal').style.display = 'flex';
};

document.getElementById('purchase-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('pur-id').value);
    const qty = parseInt(document.getElementById('pur-qty').value);
    const p = await performTransaction('products', 'readonly', s => s.get(id));
    if (!p) return;

    p.stockQty += qty;
    await performTransaction('products', 'readwrite', s => s.put(p));

    const tx = { productId: id, type: 'Purchase', quantity: qty, relatedTo: 'Stock Restock', date: new Date().toISOString() };
    await performTransaction('transactions', 'readwrite', s => s.add(tx));

    document.getElementById('purchase-modal').style.display = 'none';
    renderProducts();
    renderDashboard();
});

window.openAllTransactionsModal = () => {
    document.getElementById('tx-filter-name').value = '';
    document.getElementById('tx-filter-type').value = '';
    document.getElementById('tx-filter-from').value = '';
    document.getElementById('tx-filter-to').value = '';
    renderAllTransactionsTable();
    document.getElementById('all-tx-modal').style.display = 'flex';
};

window.renderAllTransactionsTable = async () => {
    const [txs, products] = await Promise.all([
        performTransaction('transactions', 'readonly', s => s.getAll()),
        performTransaction('products', 'readonly', s => s.getAll())
    ]);

    const nameFilter = document.getElementById('tx-filter-name').value.toLowerCase();
    const typeFilter = document.getElementById('tx-filter-type').value;
    const fromDate = document.getElementById('tx-filter-from').value;
    const toDate = document.getElementById('tx-filter-to').value;

    const productMap = {};
    products.forEach(p => productMap[p.id] = p.name);

    const filtered = txs.filter(t => {
        const pName = (productMap[t.productId] || 'Unknown Product').toLowerCase();
        const matchesName = pName.includes(nameFilter);
        const matchesType = !typeFilter || t.type === typeFilter;

        let matchesDate = true;
        const txDate = new Date(t.date).setHours(0, 0, 0, 0);
        if (fromDate) matchesDate = matchesDate && txDate >= new Date(fromDate).setHours(0, 0, 0, 0);
        if (toDate) matchesDate = matchesDate && txDate <= new Date(toDate).setHours(0, 0, 0, 0);

        return matchesName && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.querySelector('#all-tx-table tbody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted)">No transactions found matching filters.</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        const qtyClass = t.type === 'Purchase' || t.type === 'Initial' ? 'text-green' : 'text-red';
        const qtySign = t.type === 'Purchase' || t.type === 'Initial' ? '+' : '-';
        tr.innerHTML = `
            <td><strong>${productMap[t.productId] || 'Unknown'}</strong></td>
            <td><span class="status-badge ${t.type.toLowerCase()}">${t.type}</span></td>
            <td class="${qtyClass}">${qtySign}${Math.abs(t.quantity)}</td>
            <td>${t.relatedTo || '-'}</td>
            <td>${new Date(t.date).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.downloadTransactionsPDF = async () => {
    try {
        const [txs, products] = await Promise.all([
            performTransaction('transactions', 'readonly', s => s.getAll()),
            performTransaction('products', 'readonly', s => s.getAll())
        ]);

        const nameFilter = document.getElementById('tx-filter-name').value.toLowerCase();
        const typeFilter = document.getElementById('tx-filter-type').value;
        const fromDate = document.getElementById('tx-filter-from').value;
        const toDate = document.getElementById('tx-filter-to').value;

        const productMap = {};
        products.forEach(p => productMap[p.id] = p.name);

        const filtered = txs.filter(t => {
            const pName = (productMap[t.productId] || 'Unknown Product').toLowerCase();
            const matchesName = pName.includes(nameFilter);
            const matchesType = !typeFilter || t.type === typeFilter;
            let matchesDate = true;
            const txDate = new Date(t.date).setHours(0, 0, 0, 0);
            if (fromDate) matchesDate = matchesDate && txDate >= new Date(fromDate).setHours(0, 0, 0, 0);
            if (toDate) matchesDate = matchesDate && txDate <= new Date(toDate).setHours(0, 0, 0, 0);
            return matchesName && matchesType && matchesDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Robust jsPDF access
        const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFLib) throw new Error("PDF library not loaded. Please check your internet connection.");

        const doc = new jsPDFLib();

        // Title & Branding
        doc.setFontSize(22);
        doc.setTextColor(0, 168, 132); // Pharmaco Green
        doc.text("Pharmaco ERP", 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(100);
        doc.text("Transaction History Report", 14, 30);

        // Metadata
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
        doc.text(`Filters: ${typeFilter || 'All Types'} | ${nameFilter || 'All Products'}`, 14, 45);
        if (fromDate || toDate) doc.text(`Range: ${fromDate || 'Any'} to ${toDate || 'Any'}`, 14, 50);

        const head = [["Date", "Product", "Type", "Qty Change", "Related To"]];
        const body = filtered.map(t => [
            new Date(t.date).toLocaleString(),
            productMap[t.productId] || 'Unknown',
            t.type,
            (t.type === 'Purchase' || t.type === 'Initial' ? '+' : '-') + Math.abs(t.quantity),
            t.relatedTo || '-'
        ]);

        if (typeof doc.autoTable !== 'function') throw new Error("Table plugin not loaded.");

        doc.autoTable({
            head: head,
            body: body,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 132] }, // Primary Green
            styles: { fontSize: 9 }
        });

        const fileName = `pharmacy_report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        alert("Failed to generate PDF: " + error.message);
    }
};

window.openAllOrdersModal = () => {
    document.getElementById('order-filter-name').value = '';
    document.getElementById('order-filter-status').value = '';
    document.getElementById('order-filter-from').value = '';
    document.getElementById('order-filter-to').value = '';
    renderAllOrdersTable();
    document.getElementById('all-orders-modal').style.display = 'flex';
};

window.renderAllOrdersTable = async () => {
    const [orders, products] = await Promise.all([
        performTransaction('orders', 'readonly', s => s.getAll()),
        performTransaction('products', 'readonly', s => s.getAll())
    ]);

    const productMap = {};
    products.forEach(p => productMap[p.id] = p.name);

    const nameFilter = (document.getElementById('order-filter-name')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('order-filter-status')?.value || '';
    const fromDate = document.getElementById('order-filter-from')?.value || '';
    const toDate = document.getElementById('order-filter-to')?.value || '';

    const filtered = orders.filter(o => {
        const matchesName = (o.customerName || '').toLowerCase().includes(nameFilter);
        const matchesStatus = !statusFilter || (o.status || '').toLowerCase() === statusFilter.toLowerCase();

        let matchesDate = true;
        const oDate = new Date(o.date).setHours(0, 0, 0, 0);
        if (fromDate) matchesDate = matchesDate && oDate >= new Date(fromDate).setHours(0, 0, 0, 0);
        if (toDate) matchesDate = matchesDate && oDate <= new Date(toDate).setHours(0, 0, 0, 0);

        return matchesName && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.querySelector('#all-orders-table-view tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted)">No orders found matching filters.</td></tr>';
            return;
        }

        filtered.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>ORD-${o.id}</strong></td>
                <td>${o.customerName}</td>
                <td>${productMap[o.productId] || 'Unknown'}</td>
                <td>${o.quantity}</td>
                <td><span class="status-badge ${o.status}">${o.status}</span></td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
                <td>
                    <div class="action-icons">
                        <span class="action-icon-btn edit" onclick="openEditOrderStatusModal(${o.id}, true)" title="Edit Status">📝</span>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
};

window.downloadOrdersPDF = async () => {
    try {
        const [orders, products] = await Promise.all([
            performTransaction('orders', 'readonly', s => s.getAll()),
            performTransaction('products', 'readonly', s => s.getAll())
        ]);

        const productMap = {};
        products.forEach(p => productMap[p.id] = p.name);

        const nameFilter = document.getElementById('order-filter-name').value.toLowerCase();
        const statusFilter = document.getElementById('order-filter-status').value;
        const fromDate = document.getElementById('order-filter-from').value;
        const toDate = document.getElementById('order-filter-to').value;

        const filtered = orders.filter(o => {
            const matchesName = (o.customerName || '').toLowerCase().includes(nameFilter);
            const matchesStatus = !statusFilter || (o.status || '').toLowerCase() === statusFilter.toLowerCase();
            let matchesDate = true;
            const oDate = new Date(o.date).setHours(0, 0, 0, 0);
            if (fromDate) matchesDate = matchesDate && oDate >= new Date(fromDate).setHours(0, 0, 0, 0);
            if (toDate) matchesDate = matchesDate && oDate <= new Date(toDate).setHours(0, 0, 0, 0);
            return matchesName && matchesStatus && matchesDate;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        const jsPDFLib = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFLib) throw new Error("PDF library not loaded.");

        const doc = new jsPDFLib();

        // Title & Branding
        doc.setFontSize(22);
        doc.setTextColor(0, 168, 132); // Pharmaco Green
        doc.text("Pharmaco ERP", 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(100);
        doc.text("Filtered Orders Report", 14, 30);

        // Metadata
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
        doc.text(`Total Orders: ${filtered.length}`, 14, 45);
        doc.text(`Filters: Status: ${statusFilter || 'All'} | Search: ${nameFilter || 'None'}`, 14, 50);

        const head = [["Order ID", "Customer", "Product", "Qty", "Status", "Date"]];
        const body = filtered.map(o => [
            `ORD-${o.id}`,
            o.customerName,
            productMap[o.productId] || 'Unknown',
            o.quantity,
            o.status.toUpperCase(),
            new Date(o.date).toLocaleDateString()
        ]);

        doc.autoTable({
            head: head,
            body: body,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [0, 168, 132] },
            styles: { fontSize: 8 }
        });

        const fileName = `pharmacy_orders_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("Orders PDF Export Error:", error);
        alert("Failed to generate Orders PDF: " + error.message);
    }
};

window.openEditOrderStatusModal = async (id, fromGlobal = false) => {
    const order = await performTransaction('orders', 'readonly', s => s.get(id));
    if (order) {
        document.getElementById('edit-order-id').value = id;
        document.getElementById('edit-order-status-select').value = (order.status || 'pending').toLowerCase();
        document.getElementById('edit-order-status-modal').setAttribute('data-global', fromGlobal);
        document.getElementById('edit-order-status-modal').style.display = 'flex';
    }
};

window.openProductModal = async (id = null) => {
    const f = document.getElementById('product-form');
    f.reset();
    document.getElementById('prod-id').value = '';
    const suppliers = await performTransaction('suppliers', 'readonly', s => s.getAll());
    const sel = document.getElementById('prod-supplier');
    sel.innerHTML = '<option value="">Select Supplier</option>' + suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    if (id) {
        const p = await performTransaction('products', 'readonly', s => s.get(id));
        if (p) {
            document.getElementById('prod-id').value = p.id;
            document.getElementById('prod-name').value = p.name;
            document.getElementById('prod-category').value = p.category;
            document.getElementById('prod-price').value = p.unitPrice;
            document.getElementById('prod-stock').value = p.stockQty;
            document.getElementById('prod-desc').value = p.description || '';
            document.getElementById('prod-supplier').value = p.supplier || '';
            document.getElementById('prod-location').value = p.location || '';
        }
    }
    document.getElementById('product-modal').style.display = 'flex';
};

document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const product = {
        name: document.getElementById('prod-name').value,
        category: document.getElementById('prod-category').value,
        unitPrice: parseFloat(document.getElementById('prod-price').value),
        stockQty: parseInt(document.getElementById('prod-stock').value),
        description: document.getElementById('prod-desc').value,
        supplier: document.getElementById('prod-supplier').value,
        location: document.getElementById('prod-location').value
    };
    if (id) product.id = parseInt(id);
    const savedId = await performTransaction('products', 'readwrite', s => s.put(product));

    // If it's a new product, record initial stock as a transaction
    if (!id) {
        const tx = { productId: savedId, type: 'Initial', quantity: product.stockQty, relatedTo: 'Initial Setup', date: new Date().toISOString() };
        await performTransaction('transactions', 'readwrite', s => s.add(tx));
    }

    document.getElementById('product-modal').style.display = 'none';
    renderProducts();
    renderDashboard();
});

window.openSupplierModal = async (id = null) => {
    document.getElementById('supplier-form').reset();
    document.getElementById('supp-id').value = '';
    if (id) {
        const s = await performTransaction('suppliers', 'readonly', s => s.get(id));
        if (s) {
            document.getElementById('supp-id').value = s.id;
            document.getElementById('supp-name').value = s.name;
            document.getElementById('supp-contact').value = s.contact;
        }
    }
    document.getElementById('supplier-modal').style.display = 'flex';
};

document.getElementById('supplier-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('supp-id').value;
    const supplier = { name: document.getElementById('supp-name').value, contact: document.getElementById('supp-contact').value };
    if (id) supplier.id = parseInt(id);
    await performTransaction('suppliers', 'readwrite', s => s.put(supplier));
    document.getElementById('supplier-modal').style.display = 'none';
    renderSuppliers();
});

window.openOrderModal = async () => {
    const products = await performTransaction('products', 'readonly', s => s.getAll());
    const sel = document.getElementById('order-product');
    sel.innerHTML = products.map(p => `<option value="${p.id}">${p.name} (${p.stockQty})</option>`).join('');
    document.getElementById('order-modal').style.display = 'flex';
};

document.getElementById('order-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prodId = parseInt(document.getElementById('order-product').value);
    const qty = parseInt(document.getElementById('order-qty').value);
    const prod = await performTransaction('products', 'readonly', s => s.get(prodId));
    if (prod.stockQty < qty) return alert('Insufficient stock!');

    const order = {
        productId: prodId, quantity: qty, customerName: document.getElementById('order-customer').value,
        status: document.getElementById('order-status').value, date: new Date().toISOString()
    };
    await performTransaction('orders', 'readwrite', s => s.add(order));
    prod.stockQty -= qty;
    await performTransaction('products', 'readwrite', s => s.put(prod));

    // Record the Sale transaction
    const tx = { productId: prodId, type: 'Sale', quantity: qty, relatedTo: `Order #${order.customerName}`, date: new Date().toISOString() };
    await performTransaction('transactions', 'readwrite', s => s.add(tx));

    document.getElementById('order-modal').style.display = 'none';
    renderOrders(); renderDashboard();
});

window.openAdminModal = () => {
    document.getElementById('admin-form').reset();
    document.getElementById('admin-modal').style.display = 'flex';
};

document.getElementById('admin-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const admin = { username: document.getElementById('admin-user').value, password: document.getElementById('admin-pass').value, role: document.getElementById('admin-role').value };
    await performTransaction('users', 'readwrite', s => s.add(admin));
    document.getElementById('admin-modal').style.display = 'none';
    renderAdmins();
});

window.deleteProduct = async (id) => { if (confirm('Delete?')) { await performTransaction('products', 'readwrite', s => s.delete(id)); renderProducts(); renderDashboard(); } };
window.deleteSupplier = async (id) => { if (confirm('Delete?')) { await performTransaction('suppliers', 'readwrite', s => s.delete(id)); renderSuppliers(); } };
window.deleteOrder = async (id) => { if (confirm('Delete?')) { await performTransaction('orders', 'readwrite', s => s.delete(id)); renderOrders(); renderDashboard(); } };
window.deleteAdmin = async (id) => { if (confirm('Delete?')) { await performTransaction('users', 'readwrite', s => s.delete(id)); renderAdmins(); } };

// --- End of Script ---
