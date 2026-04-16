document.addEventListener("DOMContentLoaded", () => {
    const floatingBtn = document.getElementById('floating-translate-btn');
    const translateModal = document.getElementById('translate-modal');
    const closeBtn = document.getElementById('close-translate-btn');
    const runTranslateBtn = document.getElementById('run-translate-btn');
    const translateInput = document.getElementById('translate-input');
    const translateResult = document.getElementById('translate-result');

    // Mở bảng dịch
    floatingBtn.addEventListener('click', () => {
        translateModal.classList.remove('hidden');
        translateInput.focus(); // Tự động đưa con trỏ vào ô nhập
    });

    // Đóng bảng dịch
    closeBtn.addEventListener('click', () => {
        translateModal.classList.add('hidden');
    });

    // Đóng khi click ra ngoài vùng xám
    translateModal.addEventListener('click', (e) => {
        if (e.target === translateModal) {
            translateModal.classList.add('hidden');
        }
    });

    // Hàm gọi API Dịch
    async function translateText() {
        const textToTranslate = translateInput.value.trim();

        if (!textToTranslate) {
            translateResult.innerHTML = "<p style='color: #e74c3c;'>Vui lòng nhập từ cần dịch!</p>";
            return;
        }

        translateResult.innerHTML = "<p><em>Đang dịch... ⏳</em></p>";
        runTranslateBtn.disabled = true;

        try {
            // Sử dụng MyMemory API (Miễn phí, không cần key)
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|vi`);
            const data = await response.json();

            if (data.responseData && data.responseData.translatedText) {
                translateResult.innerHTML = `<strong>Tiếng Việt:</strong> ${data.responseData.translatedText}`;
            } else {
                translateResult.innerHTML = "<p style='color: #e74c3c;'>Lỗi: Không thể dịch được.</p>";
            }
        } catch (error) {
            console.error("Lỗi API Dịch:", error);
            translateResult.innerHTML = "<p style='color: #e74c3c;'>Lỗi kết nối mạng!</p>";
        } finally {
            runTranslateBtn.disabled = false;
        }
    }

    // Bấm nút để dịch
    runTranslateBtn.addEventListener('click', translateText);

    // Bấm Enter trong ô nhập để dịch luôn
    translateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            translateText();
        }
    });
});