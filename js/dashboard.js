// لوحة التحكم
class DashboardManager {
    constructor() {
        this.checkAuth();
        this.init();
        this.loadData();
        this.setupEventListeners();
    }

    checkAuth() {
        if (sessionStorage.getItem('loggedIn') !== 'true') {
            window.location.href = 'login.html';
        }
    }

    init() {
        // عرض البريد الإلكتروني
        const email = sessionStorage.getItem('userEmail');
        if (email) {
            document.getElementById('adminEmail').textContent = email;
        }
    }

    loadData() {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        if (!data) return;

        this.updateStats(data);
        this.renderProducts(data.products);
        this.renderGames(data.games);
        this.renderOffers(data.offers);
        this.renderUsers(data);
        this.loadBannerData(data.banner);
        this.loadSettingsData(data.site_settings);
    }

    updateStats(data) {
        document.getElementById('totalProducts').textContent = data.products.length;
        document.getElementById('totalGames').textContent = data.games.length;
        document.getElementById('totalOffers').textContent = data.offers.filter(o => o.active).length;
        document.getElementById('totalVisitors').textContent = Math.floor(Math.random() * 1000) + 100;
    }

    renderProducts(products) {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        tbody.innerHTML = products.map(product => `
            <tr>
                <td><img src="${product.image}" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>${product.description}</td>
                <td>${product.price} د.أ</td>
                <td>${product.category}</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="dashboard.editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="dashboard.deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderGames(games) {
        const tbody = document.getElementById('gamesTableBody');
        if (!tbody) return;

        tbody.innerHTML = games.map(game => `
            <tr>
                <td><img src="${game.image}" alt="${game.name}"></td>
                <td>${game.name}</td>
                <td>${game.description}</td>
                <td>${game.price_per_hour} د.أ</td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="dashboard.editGame(${game.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="dashboard.deleteGame(${game.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderOffers(offers) {
        const tbody = document.getElementById('offersTableBody');
        if (!tbody) return;

        tbody.innerHTML = offers.map(offer => `
            <tr>
                <td><img src="${offer.image}" alt="${offer.name}"></td>
                <td>${offer.name}</td>
                <td>${offer.description}</td>
                <td>${new Date(offer.expiry_date).toLocaleDateString('ar')}</td>
                <td><span style="color: ${offer.active ? '#4CAF50' : '#f44336'}">${offer.active ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="dashboard.editOffer(${offer.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="dashboard.deleteOffer(${offer.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderUsers(data) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td>${data.admin.email}</td>
                <td><span style="color: var(--primary)">مشرف رئيسي</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="delete-btn" onclick="dashboard.deleteUser('${data.admin.email}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    loadBannerData(banner) {
        document.getElementById('bannerText').value = banner.text;
        document.getElementById('bannerImage').value = banner.image;
        document.getElementById('bannerActive').checked = banner.active;
    }

    loadSettingsData(settings) {
        document.getElementById('siteName').value = settings.site_name;
        document.getElementById('siteLogo').value = settings.logo;
        document.getElementById('primaryColor').value = settings.primary_color;
        document.getElementById('secondaryColor').value = settings.secondary_color;
    }

    setupEventListeners() {
        // التنقل بين الصفحات
        document.querySelectorAll('.sidebar-nav a[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                
                if (page === 'logout') {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                    return;
                }

                document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
                const targetPage = document.getElementById(`page-${page}`);
                if (targetPage) {
                    targetPage.classList.add('active');
                }
            });
        });

        // نموذج البانر
        document.getElementById('bannerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateBanner();
        });

        // نموذج الإعدادات
        document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSettings();
        });

        // بحث المنتجات
        document.getElementById('searchProducts')?.addEventListener('input', () => {
            this.filterProducts();
        });

        document.getElementById('filterCategory')?.addEventListener('change', () => {
            this.filterProducts();
        });

        // تبديل الموضوع
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            const icon = document.querySelector('#themeToggle i');
            icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        });
    }

    filterProducts() {
        const search = document.getElementById('searchProducts').value.toLowerCase();
        const category = document.getElementById('filterCategory').value;
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        
        let products = data.products;
        if (category !== 'all') {
            products = products.filter(p => p.category === category);
        }
        if (search) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(search) || 
                p.description.toLowerCase().includes(search)
            );
        }
        
        this.renderProducts(products);
    }

    updateBanner() {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        data.banner = {
            text: document.getElementById('bannerText').value,
            image: document.getElementById('bannerImage').value,
            active: document.getElementById('bannerActive').checked
        };
        localStorage.setItem('mrbarista_data', JSON.stringify(data));
        this.showToast('تم تحديث البانر بنجاح', 'success');
    }

    updateSettings() {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        data.site_settings = {
            site_name: document.getElementById('siteName').value,
            logo: document.getElementById('siteLogo').value,
            primary_color: document.getElementById('primaryColor').value,
            secondary_color: document.getElementById('secondaryColor').value
        };
        localStorage.setItem('mrbarista_data', JSON.stringify(data));
        
        // تحديث الألوان في CSS
        document.documentElement.style.setProperty('--primary', data.site_settings.primary_color);
        document.documentElement.style.setProperty('--secondary', data.site_settings.secondary_color);
        
        this.showToast('تم تحديث الإعدادات بنجاح', 'success');
    }

    editProduct(id) {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        const product = data.products.find(p => p.id === id);
        if (!product) return;

        this.showModal(`
            <h3>تعديل المنتج</h3>
            <form onsubmit="dashboard.saveProduct(event, ${id})">
                <div class="form-group">
                    <label>الاسم</label>
                    <input type="text" value="${product.name}" id="editProductName" required>
                </div>
                <div class="form-group">
                    <label>الوصف</label>
                    <input type="text" value="${product.description}" id="editProductDesc" required>
                </div>
                <div class="form-group">
                    <label>السعر</label>
                    <input type="number" step="0.5" value="${product.price}" id="editProductPrice" required>
                </div>
                <div class="form-group">
                    <label>رابط الصورة</label>
                    <input type="url" value="${product.image}" id="editProductImage" required>
                </div>
                <div class="form-group">
                    <label>التصنيف</label>
                    <select id="editProductCategory">
                        <option value="مشروبات ساخنة" ${product.category === 'مشروبات ساخنة' ? 'selected' : ''}>مشروبات ساخنة</option>
                        <option value="مشروبات باردة" ${product.category === 'مشروبات باردة' ? 'selected' : ''}>مشروبات باردة</option>
                        <option value="حلويات" ${product.category === 'حلويات' ? 'selected' : ''}>حلويات</option>
                        <option value="ساندويشات" ${product.category === 'ساندويشات' ? 'selected' : ''}>ساندويشات</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">حفظ التغييرات</button>
            </form>
        `);
    }

    saveProduct(event, id) {
        event.preventDefault();
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        const index = data.products.findIndex(p => p.id === id);
        
        data.products[index] = {
            id: id,
            name: document.getElementById('editProductName').value,
            description: document.getElementById('editProductDesc').value,
            price: parseFloat(document.getElementById('editProductPrice').value),
            image: document.getElementById('editProductImage').value,
            category: document.getElementById('editProductCategory').value
        };
        
        localStorage.setItem('mrbarista_data', JSON.stringify(data));
        this.closeModal();
        this.loadData();
        this.showToast('تم تحديث المنتج بنجاح', 'success');
    }

    deleteProduct(id) {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
        
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        data.products = data.products.filter(p => p.id !== id);
        localStorage.setItem('mrbarista_data', JSON.stringify(data));
        this.loadData();
        this.showToast('تم حذف المنتج بنجاح', 'success');
    }

    // دوال مماثلة للألعاب والعروض والمستخدمين
    editGame(id) { /* مشابه لـ editProduct */ }
    deleteGame(id) { /* مشابه لـ deleteProduct */ }
    editOffer(id) { /* مشابه لـ editProduct */ }
    deleteOffer(id) { /* مشابه لـ deleteProduct */ }
    deleteUser(email) { /* مشابه لـ deleteProduct */ }

    showAddProductModal() {
        this.showModal(`
            <h3>إضافة منتج جديد</h3>
            <form onsubmit="dashboard.addProduct(event)">
                <div class="form-group">
                    <label>الاسم</label>
                    <input type="text" id="addProductName" required>
                </div>
                <div class="form-group">
                    <label>الوصف</label>
                    <input type="text" id="addProductDesc" required>
                </div>
                <div class="form-group">
                    <label>السعر</label>
                    <input type="number" step="0.5" id="addProductPrice" required>
                </div>
                <div class="form-group">
                    <label>رابط الصورة</label>
                    <input type="url" id="addProductImage" required>
                </div>
                <div class="form-group">
                    <label>التصنيف</label>
                    <select id="addProductCategory">
                        <option value="مشروبات ساخنة">مشروبات ساخنة</option>
                        <option value="مشروبات باردة">مشروبات باردة</option>
                        <option value="حلويات">حلويات</option>
                        <option value="ساندويشات">ساندويشات</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">إضافة المنتج</button>
            </form>
        `);
    }

    addProduct(event) {
        event.preventDefault();
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        
        const newProduct = {
            id: Date.now(),
            name: document.getElementById('addProductName').value,
            description: document.getElementById('addProductDesc').value,
            price: parseFloat(document.getElementById('addProductPrice').value),
            image: document.getElementById('addProductImage').value,
            category: document.getElementById('addProductCategory').value
        };
        
        data.products.push(newProduct);
        localStorage.setItem('mrbarista_data', JSON.stringify(data));
        this.closeModal();
        this.loadData();
        this.showToast('تم إضافة المنتج بنجاح', 'success');
    }

    showAddGameModal() { /* مشابه لـ showAddProductModal */ }
    addGame(event) { /* مشابه لـ addProduct */ }
    showAddOfferModal() { /* مشابه لـ showAddProductModal */ }
    addOffer(event) { /* مشابه لـ addProduct */ }
    showAddUserModal() { /* مشابه لـ showAddProductModal */ }
    addUser(event) { /* مشابه لـ addProduct */ }

    showModal(html) {
        const modal = document.getElementById('modal');
        const body = document.getElementById('modalBody');
        body.innerHTML = html;
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        document.body.appendChild(container);
        return container;
    }
}

// تهيئة لوحة التحكم
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new DashboardManager();
    window.dashboard = dashboard;
    
    // إغلاق المودال عند الضغط خارجها
    document.getElementById('modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            dashboard.closeModal();
        }
    });
});
