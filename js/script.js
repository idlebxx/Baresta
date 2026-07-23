// تهيئة الموقع العام
class MrBarista {
    constructor() {
        this.init();
        this.loadData();
        this.setupEventListeners();
    }

    init() {
        // التحقق من وجود بيانات محلية
        if (!localStorage.getItem('mrbarista_data')) {
            this.initializeDatabase();
        }

        // تحميل الإعدادات
        this.loadSettings();
    }

    initializeDatabase() {
        const initialData = {
            admin: {
                email: 'admin@mrbarista.com',
                password: this.hashPassword('Admin123!'),
                otp: '',
                otp_expiry: ''
            },
            products: [
                {
                    id: 1,
                    name: 'كابتشينو',
                    description: 'قهوة إيطالية أصيلة بالحليب',
                    price: 5.0,
                    image: 'https://via.placeholder.com/300x200/C9A84C/FFFFFF?text=Cappuccino',
                    category: 'مشروبات ساخنة'
                },
                {
                    id: 2,
                    name: 'لاتيه',
                    description: 'قهوة ناعمة مع حليب مبخر',
                    price: 4.5,
                    image: 'https://via.placeholder.com/300x200/C9A84C/FFFFFF?text=Latte',
                    category: 'مشروبات ساخنة'
                },
                {
                    id: 3,
                    name: 'شوكولاتة ساخنة',
                    description: 'شوكولاتة بلجيكية فاخرة',
                    price: 3.5,
                    image: 'https://via.placeholder.com/300x200/C9A84C/FFFFFF?text=Hot+Chocolate',
                    category: 'مشروبات ساخنة'
                }
            ],
            games: [
                {
                    id: 1,
                    name: 'بلاي ستيشن 5',
                    description: 'أحدث إصدار مع ألعاب ممتازة',
                    price_per_hour: 3.0,
                    image: 'https://via.placeholder.com/300x200/C9A84C/FFFFFF?text=PS5'
                },
                {
                    id: 2,
                    name: 'ننتندو سويتش',
                    description: 'ألعاب عائلية ممتعة',
                    price_per_hour: 2.5,
                    image: 'https://via.placeholder.com/300x200/C9A84C/FFFFFF?text=Nintendo'
                }
            ],
            offers: [
                {
                    id: 1,
                    name: 'عرض الإفطار',
                    description: 'كابتشينو + كرواسون بـ 5 دينار',
                    image: 'https://via.placeholder.com/300x200/C9A84C/FFFFFF?text=Breakfast',
                    expiry_date: '2026-08-30T23:59:59',
                    active: true
                }
            ],
            banner: {
                text: 'خصم 20% على جميع المشروبات الساخنة',
                image: 'https://via.placeholder.com/1200x200/C9A84C/FFFFFF?text=Mr.Barista+Banner',
                active: true
            },
            site_settings: {
                site_name: 'Mr. Barista',
                logo: 'https://via.placeholder.com/150x50/C9A84C/FFFFFF?text=Mr.Barista',
                primary_color: '#C9A84C',
                secondary_color: '#2C1810'
            }
        };

        localStorage.setItem('mrbarista_data', JSON.stringify(initialData));
    }

    loadData() {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        if (data) {
            this.renderProducts(data.products);
            this.renderGames(data.games);
            this.renderOffers(data.offers);
            this.renderBanner(data.banner);
        }
    }

    renderProducts(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = products.map(product => `
            <div class="product-card glass-morphism">
                <img src="${product.image}" alt="${product.name}">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p>${product.description}</p>
                    <span class="product-price">${product.price} د.أ</span>
                    <span style="display:block;font-size:12px;color:#999;margin-top:5px;">${product.category}</span>
                </div>
            </div>
        `).join('');
    }

    renderGames(games) {
        const grid = document.getElementById('gamesGrid');
        if (!grid) return;

        grid.innerHTML = games.map(game => `
            <div class="game-card glass-morphism">
                <img src="${game.image}" alt="${game.name}">
                <div class="product-info">
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                    <span class="product-price">${game.price_per_hour} د.أ/ساعة</span>
                </div>
            </div>
        `).join('');
    }

    renderOffers(offers) {
        const grid = document.getElementById('offersGrid');
        if (!grid) return;

        const activeOffers = offers.filter(o => o.active);
        grid.innerHTML = activeOffers.map(offer => `
            <div class="offer-card glass-morphism">
                <img src="${offer.image}" alt="${offer.name}">
                <div class="product-info">
                    <h3>${offer.name}</h3>
                    <p>${offer.description}</p>
                    <div class="countdown" data-expiry="${offer.expiry_date}">
                        <span class="days">00</span>:
                        <span class="hours">00</span>:
                        <span class="minutes">00</span>:
                        <span class="seconds">00</span>
                    </div>
                </div>
            </div>
        `).join('');

        // تشغيل العد التنازلي
        document.querySelectorAll('.countdown[data-expiry]').forEach(el => {
            this.startCountdown(el);
        });
    }

    renderBanner(banner) {
        const bannerSection = document.getElementById('bannerContent');
        if (!bannerSection) return;

        if (banner.active) {
            bannerSection.innerHTML = `
                <h2>${banner.text}</h2>
                <div class="countdown" id="bannerCountdown">
                    <span id="days">00</span>:
                    <span id="hours">00</span>:
                    <span id="minutes">00</span>:
                    <span id="seconds">00</span>
                </div>
            `;
            document.getElementById('banner').style.display = 'block';
        } else {
            document.getElementById('banner').style.display = 'none';
        }
    }

    startCountdown(element) {
        const expiry = new Date(element.dataset.expiry);
        
        const update = () => {
            const now = new Date();
            const diff = expiry - now;

            if (diff <= 0) {
                element.innerHTML = 'انتهى العرض!';
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            element.querySelector('.days').textContent = String(days).padStart(2, '0');
            element.querySelector('.hours').textContent = String(hours).padStart(2, '0');
            element.querySelector('.minutes').textContent = String(minutes).padStart(2, '0');
            element.querySelector('.seconds').textContent = String(seconds).padStart(2, '0');
        };

        update();
        setInterval(update, 1000);
    }

    loadSettings() {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        if (data && data.site_settings) {
            const settings = data.site_settings;
            document.documentElement.style.setProperty('--primary', settings.primary_color);
            document.documentElement.style.setProperty('--secondary', settings.secondary_color);
        }
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    setupEventListeners() {
        // التنقل في الصفحة
        document.querySelector('.nav-toggle')?.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });

        // أزرار التصنيفات
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterProducts(btn.dataset.category);
            });
        });

        // نموذج الاتصال
        document.getElementById('contactForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const message = document.getElementById('contactMessage').value;
            
            // استخدام EmailJS لإرسال الرسالة
            if (typeof emailjs !== 'undefined') {
                emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, {
                    to_email: 'info@mrbarista.com',
                    from_name: name,
                    from_email: email,
                    message: message,
                    site_name: 'Mr. Barista'
                }).then(() => {
                    this.showToast('تم إرسال رسالتك بنجاح!', 'success');
                    e.target.reset();
                }).catch(() => {
                    this.showToast('حدث خطأ في إرسال الرسالة', 'error');
                });
            }
        });

        // موضوع الموقع
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        document.getElementById('themeToggle')?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    filterProducts(category) {
        const data = JSON.parse(localStorage.getItem('mrbarista_data'));
        if (!data) return;

        const products = category === 'all' 
            ? data.products 
            : data.products.filter(p => p.category === category);
        
        this.renderProducts(products);
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

// تصدير الدوال للاستخدام في ملفات أخرى
window.MrBarista = MrBarista;
window.showToast = (message, type) => {
    const app = new MrBarista();
    app.showToast(message, type);
};

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const app = new MrBarista();
    window.app = app;
});
