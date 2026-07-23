/* ==========================================================================
   Mr. Barista — script.js (معدل للاتصال بـ JsonBin)
   ========================================================================== */

const CATEGORY_LABELS = {
    hot: "مشروبات ساخنة",
    cold: "مشروبات باردة",
    sweets: "حلويات",
    sandwiches: "ساندويشات"
};

// ===== إعدادات JsonBin =====
const JSONBIN_BIN_ID = "6a619e77f5f4af5e29b40608";
const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`;

let CONFIG = null;
let DB = null;

/* -------------------- تحميل البيانات -------------------- */
async function loadData() {
    try {
        // قراءة البيانات من JsonBin
        const dbResponse = await fetch(JSONBIN_URL);
        const result = await dbResponse.json();
        DB = result.record || result;
        
        // قراءة الإعدادات من الموقع
        try {
            const cfgResponse = await fetch("config.json");
            CONFIG = await cfgResponse.json();
        } catch {
            CONFIG = fallbackConfig();
        }
    } catch (err) {
        console.warn("تعذّر تحميل البيانات من JsonBin، استخدام بيانات افتراضية", err);
        CONFIG = fallbackConfig();
        DB = fallbackDB();
    }
    
    applyConfig();
    renderProducts("all");
    renderGames();
    renderOffers();
    startBannerCountdown();
    wireWhatsapp();
}

/* -------------------- تطبيق الإعدادات -------------------- */
function applyConfig() {
    document.getElementById("siteName").textContent = CONFIG.site_name || "Mr. Barista";
    document.getElementById("bannerText").innerHTML = `✨ <strong>عرض خاص:</strong> ${CONFIG.banner?.text || ""}`;
    document.title = `${CONFIG.site_name || "Mr. Barista"} | كافيه وصالة ألعاب`;
    
    if (CONFIG.address) {
        document.getElementById("addressText").textContent = CONFIG.address;
        document.getElementById("footerAddress").textContent = CONFIG.address;
    }
    if (CONFIG.whatsapp_number) {
        document.getElementById("phoneText").textContent = "+" + CONFIG.whatsapp_number;
    }
}

/* -------------------- عرض المنتجات -------------------- */
function renderProducts(category) {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = "";
    const items = (DB.products || []).filter(p => category === "all" || p.category === category);
    
    if (items.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-soft)">لا توجد منتجات في هذا التصنيف حالياً.</p>`;
        return;
    }
    
    items.forEach(p => {
        grid.appendChild(buildCard({
            image: p.image,
            title: p.name,
            desc: p.description,
            price: p.price,
            onAdd: () => showToast(`تمت إضافة "${p.name}" إلى السلة ☕`)
        }));
    });
}

document.getElementById("menuTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".menu-tab");
    if (!btn) return;
    document.querySelectorAll(".menu-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.cat);
});

/* -------------------- عرض الألعاب -------------------- */
function renderGames() {
    const grid = document.getElementById("gamesGrid");
    const select = document.getElementById("bookingGameSelect");
    grid.innerHTML = "";
    select.innerHTML = `<option value="" disabled selected>اختر اللعبة</option>`;
    
    (DB.games || []).forEach(g => {
        const card = buildCard({
            image: g.image,
            title: g.name,
            desc: g.description,
            price: g.price_per_hour,
            priceSuffix: " / ساعة",
            meta: `<div class="game-meta"><span>👥 ${g.players}</span></div>`,
            onAdd: () => {
                select.value = g.name;
                document.getElementById("bookingForm").scrollIntoView({ behavior: "smooth", block: "center" });
            },
            addLabel: "＋"
        });
        card.classList.add("game-card");
        grid.appendChild(card);
        
        const opt = document.createElement("option");
        opt.value = g.name;
        opt.textContent = `${g.name} (${g.price_per_hour}$ / ساعة)`;
        select.appendChild(opt);
    });
}

/* -------------------- عرض العروض -------------------- */
function renderOffers() {
    const grid = document.getElementById("offersGrid");
    grid.innerHTML = "";
    
    (DB.offers || []).forEach(o => {
        const card = document.createElement("div");
        card.className = "offer-card";
        card.innerHTML = `
            <img src="${o.image}" alt="${o.name}" loading="lazy">
            <div class="offer-body">
                <h3>${o.name}</h3>
                <p>${o.description}</p>
                <div class="offer-countdown" data-end="${o.end_date}">
                    <span data-u="d"><b>يوم</b>00</span>
                    <span data-u="h"><b>ساعة</b>00</span>
                    <span data-u="m"><b>دقيقة</b>00</span>
                    <span data-u="s"><b>ثانية</b>00</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
    
    startOfferCountdowns();
}

/* -------------------- بطاقة عامة -------------------- */
function buildCard({ image, title, desc, price, priceSuffix = "$", meta = "", onAdd, addLabel = "＋" }) {
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
        <div class="card-face">
            <div class="card-media"><img src="${image}" alt="${title}" loading="lazy"></div>
            <div class="card-body">
                ${meta}
                <h3>${title}</h3>
                <p>${desc}</p>
                <div class="card-foot">
                    <span class="price">${price}${priceSuffix}</span>
                    <button class="add-btn" type="button" aria-label="إضافة ${title}">${addLabel}</button>
                </div>
            </div>
        </div>`;
    wrap.querySelector(".add-btn").addEventListener("click", onAdd);
    return wrap;
}

/* -------------------- العد التنازلي -------------------- */
function startBannerCountdown() {
    const end = new Date(CONFIG.banner?.end_date || Date.now());
    const el = document.getElementById("bannerCountdown");
    tickCountdown(end, el.querySelectorAll("span"));
    setInterval(() => tickCountdown(end, el.querySelectorAll("span")), 1000);
}

function startOfferCountdowns() {
    const boxes = document.querySelectorAll(".offer-countdown");
    function update() {
        boxes.forEach(box => {
            const end = new Date(box.dataset.end);
            tickCountdown(end, box.querySelectorAll("span"));
        });
    }
    update();
    setInterval(update, 1000);
}

function tickCountdown(endDate, spans) {
    const now = new Date();
    let diff = Math.max(0, endDate - now);
    
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const vals = { d, h, m, s };
    
    spans.forEach(span => {
        const unit = span.dataset.unit || span.dataset.u;
        const label = span.querySelector("b");
        span.textContent = String(vals[unit]).padStart(2, "0");
        if (label) span.prepend(label);
    });
}

/* -------------------- نموذج الحجز -------------------- */
document.getElementById("bookingForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const data = new FormData(this);
    const name = data.get("name");
    const phone = data.get("phone");
    const game = data.get("game");
    const dt = data.get("datetime");
    const notes = data.get("notes");
    
    const msg = `مرحباً، أرغب بحجز موعد في صالة Barista Game 🎮%0Aالاسم: ${name}%0Aالهاتف: ${phone}%0Aاللعبة: ${game}%0Aالموعد: ${dt}%0Aملاحظات: ${notes || "-"}`;
    const wa = `https://wa.me/${CONFIG.whatsapp_number || ""}?text=${msg}`;
    
    document.getElementById("bookingMsg").textContent = "جاري تحويلك إلى واتساب لتأكيد الحجز...";
    window.open(wa, "_blank");
    this.reset();
});

/* -------------------- روابط واتساب -------------------- */
function wireWhatsapp() {
    const num = CONFIG.whatsapp_number || "";
    const link = `https://wa.me/${num}?text=${encodeURIComponent("مرحباً Mr. Barista، أود الاستفسار عن...")}`;
    document.getElementById("whatsappBtn").href = link;
    document.getElementById("footerWhatsapp").href = link;
}

/* -------------------- إشعارات -------------------- */
let toastTimer;

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/* -------------------- الوضع الليلي -------------------- */
function initTheme() {
    const stored = localStorage.getItem("mb-theme");
    const hour = new Date().getHours();
    const auto = (hour >= 19 || hour < 7) ? "dark" : "light";
    const theme = stored || auto;
    setTheme(theme);
    
    document.getElementById("themeToggle").addEventListener("click", () => {
        const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
        const next = current === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("mb-theme", next);
    });
}

function setTheme(theme) {
    if (theme === "dark") {
        document.documentElement.dataset.theme = "dark";
        document.getElementById("themeToggle").textContent = "☀️";
    } else {
        delete document.documentElement.dataset.theme;
        document.getElementById("themeToggle").textContent = "🌙";
    }
}

/* -------------------- قائمة الموبايل -------------------- */
function initMobileNav() {
    const burger = document.getElementById("burgerBtn");
    const links = document.getElementById("navLinks");
    burger.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach(a => a.addEventListener("click", () => links.classList.remove("open")));
}

/* -------------------- حبيبات القهوة -------------------- */
function initBeanField() {
    const field = document.getElementById("beanField");
    const count = window.innerWidth < 700 ? 10 : 20;
    for (let i = 0; i < count; i++) {
        const bean = document.createElement("span");
        bean.className = "bean";
        bean.style.left = Math.random() * 100 + "%";
        bean.style.animationDuration = (14 + Math.random() * 14) + "s";
        bean.style.animationDelay = (Math.random() * 14) + "s";
        bean.style.opacity = (0.4 + Math.random() * 0.5).toFixed(2);
        const scale = 0.6 + Math.random() * 0.8;
        bean.style.transform = `scale(${scale}) rotate(45deg)`;
        field.appendChild(bean);
    }
}

/* -------------------- ظهور العناصر -------------------- */
function initReveal() {
    const items = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");
                io.unobserve(entry.target);
            }
        });
    }, { threshold: .15 });
    items.forEach(i => io.observe(i));
}

/* -------------------- بيانات احتياطية -------------------- */
function fallbackConfig() {
    return {
        site_name: "Mr. Barista",
        banner: { text: "خصم 20% على جميع المشروبات الساخنة", end_date: new Date(Date.now() + 5 * 86400000).toISOString() },
        address: "سوريا - إدلب - أريحا، طريق الجسر، مفرق جامع سالم",
        whatsapp_number: "963900000000"
    };
}

function fallbackDB() {
    return {
        products: [{ id: 1, name: "قهوة تركية", description: "قهوة تركية أصيلة", price: 1.5, image: "https://images.unsplash.com/photo-1580933073521-dc49ac0d4e6a?q=80&w=800", category: "hot" }],
        games: [{ id: 1, name: "بلايستيشن 5", description: "أحدث الإصدارات", players: "1-4", price_per_hour: 3, image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800" }],
        offers: [{ id: 1, name: "خصم الافتتاح", description: "خصم 20% لفترة محدودة", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200", end_date: new Date(Date.now() + 5 * 86400000).toISOString() }]
    };
}

/* -------------------- التشغيل -------------------- */
document.getElementById("year").textContent = new Date().getFullYear();
initTheme();
initMobileNav();
initBeanField();
initReveal();
loadData();
