// إعدادات EmailJS
const EMAILJS_CONFIG = {
    publicKey: 'e-C6zabtowF_WKwNv', // استبدل بمفتاحك العام
    serviceID: 'service_rvf813f', // استبدل بمعرف الخدمة
    templateID: 'template_u8udohr' // القالب المحدد
};

// تهيئة EmailJS
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        console.log('EmailJS initialized successfully');
    } else {
        console.warn('EmailJS library not loaded - using fallback mode');
    }
})();
