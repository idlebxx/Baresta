// منطق تسجيل الدخول والتحقق
class LoginManager {
    constructor() {
        this.otpTimer = null;
        this.otpExpiry = null;
        this.setupLoginForm();
        this.setupOtpForm();
    }

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            // التحقق من البيانات
            const data = JSON.parse(localStorage.getItem('mrbarista_data'));
            if (!data) {
                this.showMessage('البيانات غير متوفرة', 'error');
                return;
            }

            const admin = data.admin;
            const hashedPassword = this.hashPassword(password);

            if (email === admin.email && hashedPassword === admin.password) {
                // إرسال OTP
                const otp = this.generateOTP();
                admin.otp = otp;
                admin.otp_expiry = new Date(Date.now() + 5 * 60000).toISOString();
                localStorage.setItem('mrbarista_data', JSON.stringify(data));

                // إرسال OTP عبر EmailJS
                try {
                    await this.sendOTPEmail(email, otp);
                    this.showMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني', 'success');
                    
                    // الانتقال إلى صفحة التحقق
                    window.location.href = 'verify-otp.html?email=' + encodeURIComponent(email);
                } catch (error) {
                    this.showMessage('حدث خطأ في إرسال رمز التحقق', 'error');
                }
            } else {
                this.showMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
            }
        });

        // إظهار/إخفاء كلمة المرور
        document.querySelector('.toggle-password')?.addEventListener('click', function() {
            const input = document.getElementById('loginPassword');
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });

        // نسيت كلمة المرور
        document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
            e.preventDefault();
            const email = prompt('أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور:');
            if (email) {
                // يمكن إضافة منطق إعادة تعيين كلمة المرور هنا
                this.showMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'success');
            }
        });
    }

    setupOtpForm() {
        const form = document.getElementById('otpForm');
        if (!form) return;

        // بدء العد التنازلي
        this.startOTPTimer();

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const otp = document.getElementById('otpCode').value;
            
            const data = JSON.parse(localStorage.getItem('mrbarista_data'));
            if (!data) {
                this.showMessage('البيانات غير متوفرة', 'error');
                return;
            }

            const admin = data.admin;
            const now = new Date();
            const expiry = new Date(admin.otp_expiry);

            if (now > expiry) {
                this.showMessage('انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد', 'error');
                return;
            }

            if (otp === admin.otp) {
                this.showMessage('تم التحقق بنجاح! جاري التوجيه...', 'success');
                // مسح OTP
                admin.otp = '';
                admin.otp_expiry = '';
                localStorage.setItem('mrbarista_data', JSON.stringify(data));
                
                // حفظ جلسة المستخدم
                sessionStorage.setItem('loggedIn', 'true');
                sessionStorage.setItem('userEmail', admin.email);
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showMessage('رمز التحقق غير صحيح', 'error');
            }
        });

        // إعادة إرسال الرمز
        document.getElementById('resendOTP')?.addEventListener('click', async (e) => {
            e.preventDefault();
            const urlParams = new URLSearchParams(window.location.search);
            const email = urlParams.get('email');
            
            if (!email) {
                this.showMessage('البريد الإلكتروني غير متوفر', 'error');
                return;
            }

            const data = JSON.parse(localStorage.getItem('mrbarista_data'));
            if (!data) return;

            const otp = this.generateOTP();
            data.admin.otp = otp;
            data.admin.otp_expiry = new Date(Date.now() + 5 * 60000).toISOString();
            localStorage.setItem('mrbarista_data', JSON.stringify(data));

            try {
                await this.sendOTPEmail(email, otp);
                this.showMessage('تم إرسال رمز جديد', 'success');
                this.startOTPTimer();
            } catch (error) {
                this.showMessage('حدث خطأ في إرسال الرمز', 'error');
            }
        });

        // إدخال 6 أرقام فقط
        document.getElementById('otpCode')?.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
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

    async sendOTPEmail(email, otp) {
        if (typeof emailjs === 'undefined') {
            // إذا لم يكن EmailJS محملاً، استخدم محاكاة
            console.log(`[EmailJS] سيكون OTP ${otp} قد أرسل إلى ${email}`);
            return Promise.resolve();
        }

        return emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, {
            to_email: email,
            otp_code: otp,
            site_name: 'Mr. Barista'
        });
    }

    startOTPTimer() {
        const timerElement = document.getElementById('otpTimer');
        if (!timerElement) return;

        clearInterval(this.otpTimer);
        let timeLeft = 300; // 5 دقائق

        this.otpTimer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (timeLeft <= 0) {
                clearInterval(this.otpTimer);
                timerElement.textContent = 'انتهى الوقت';
                timerElement.style.color = '#f44336';
            }
            timeLeft--;
        }, 1000);
    }

    showMessage(text, type = 'info') {
        const msgElement = document.getElementById('loginMessage') || document.getElementById('otpMessage');
        if (!msgElement) return;

        msgElement.textContent = text;
        msgElement.className = `login-message ${type}`;
        msgElement.style.display = 'block';

        setTimeout(() => {
            msgElement.style.display = 'none';
        }, 5000);
    }
}

// تهيئة مدير تسجيل الدخول
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من حالة تسجيل الدخول
    if (sessionStorage.getItem('loggedIn') === 'true') {
        const currentPage = window.location.pathname;
        if (currentPage.includes('login.html') || currentPage.includes('verify-otp.html')) {
            window.location.href = 'dashboard.html';
        }
    }

    const loginManager = new LoginManager();
    window.loginManager = loginManager;
});
