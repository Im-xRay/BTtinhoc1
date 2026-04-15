// ==========================================
// BIẾN TOÀN CỤC & DỮ LIỆU
// ==========================================
let vocabList = [];
let currentScore = 0;
// Lấy điểm kỷ lục từ bộ nhớ trình duyệt, nếu chưa có thì mặc định là 0
let highScore = localStorage.getItem('ielts_highscore') || 0;
let correctAnswerObj = null;

// ==========================================
// 1. XỬ LÝ CHUYỂN TAB (HỌC & THI)
// ==========================================
const tabLearnBtn = document.getElementById('tab-learn');
const tabQuizBtn = document.getElementById('tab-quiz');
const sectionLearn = document.getElementById('section-learn');
const sectionQuiz = document.getElementById('section-quiz');
const scoreDisplay = document.getElementById('score-display');

tabLearnBtn.addEventListener('click', () => {
    tabLearnBtn.classList.add('active');
    tabQuizBtn.classList.remove('active');
    sectionLearn.classList.remove('hidden');
    sectionQuiz.classList.add('hidden');
});

tabQuizBtn.addEventListener('click', () => {
    tabQuizBtn.classList.add('active');
    tabLearnBtn.classList.remove('active');
    sectionQuiz.classList.remove('hidden');
    sectionLearn.classList.add('hidden');

    if (!correctAnswerObj && vocabList.length > 0) {
        loadNewQuestion();
    }
    updateScoreBoard(); // Hiện điểm kỷ lục ngay khi vào tab
});

// ==========================================
// 2. TẢI DATA.JSON & HIỂN THỊ FLASHCARD
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            vocabList = data;
            renderFlashcards();
            loadNewQuestion();
        })
        .catch(error => console.error("Lỗi load data:", error));
});

function renderFlashcards() {
    const container = document.getElementById('flashcard-container');
    container.innerHTML = '';

    vocabList.forEach(wordObj => {
        const card = document.createElement('div');
        card.className = 'flashcard';
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <h2>${wordObj.word}</h2>
                    <span class="type">(${wordObj.type})</span>
                    <span>${wordObj.pronunciation}</span>
                </div>
                <div class="card-back">
                    <h3>${wordObj.meaning}</h3>
                    <p><strong>Ex:</strong> <i>"${wordObj.example}"</i></p>
                </div>
            </div>
        `;

        // CẬP NHẬT Ở ĐÂY: Thêm tính năng đọc từ khi click
        card.addEventListener('click', () => {
            card.classList.toggle('flipped'); // Lật thẻ
            speakWord(wordObj.word);          // Đọc tiếng Anh
        });

        container.appendChild(card);
    });
}

// ==========================================
// 3. TÍNH NĂNG ĐỌC PHÁT ÂM (TEXT-TO-SPEECH)
// ==========================================
function speakWord(text) {
    // Kiểm tra xem trình duyệt có hỗ trợ giọng nói không
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB'; // Giọng Anh chuẩn (British English)
        utterance.rate = 0.65;    // Tốc độ đọc chậm lại một chút cho dễ nghe
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 4. LOGIC LÀM BÀI QUIZ TRẮC NGHIỆM
// ==========================================
const questionWordEl = document.getElementById('question-word');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-question-btn');

function updateScoreBoard() {
    scoreDisplay.innerHTML = `Điểm: ${currentScore} &nbsp;|&nbsp; <span style="color:#7f8c8d; font-size: 0.9rem;">Kỷ lục: ${highScore}</span>`;
}

function loadNewQuestion() {
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';

    const randomIndex = Math.floor(Math.random() * vocabList.length);
    correctAnswerObj = vocabList[randomIndex];

    questionWordEl.textContent = correctAnswerObj.word;

    // TỰ ĐỘNG ĐỌC PHÁT ÂM KHI HIỆN CÂU HỎI
    speakWord(correctAnswerObj.word);

    let wrongOptions = vocabList.filter(item => item.word !== correctAnswerObj.word);
    wrongOptions = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 3);

    let options = [correctAnswerObj, ...wrongOptions].sort(() => 0.5 - Math.random());

    options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        // Hiển thị số 1,2,3,4 ở đầu để biết phím tắt
        btn.innerHTML = `<strong>${index + 1}.</strong> ${option.meaning}`;

        btn.addEventListener('click', () => checkAnswer(btn, option));
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedBtn, selectedOption) {
    const allBtns = optionsContainer.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true); // Khóa nút

    if (selectedOption.word === correctAnswerObj.word) {
        selectedBtn.classList.add('correct');
        currentScore += 10;

        // Cập nhật kỷ lục nếu điểm hiện tại cao hơn
        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem('ielts_highscore', highScore);
        }
    } else {
        selectedBtn.classList.add('wrong');
        currentScore = 0; // Trả lời sai thì reset điểm về 0 (như chơi game)

        allBtns.forEach(btn => {
            if (btn.textContent.includes(correctAnswerObj.meaning)) {
                btn.classList.add('correct');
            }
        });
    }

    updateScoreBoard();
    nextBtn.classList.remove('hidden');
}

nextBtn.addEventListener('click', loadNewQuestion);

// ==========================================
// 5. SỬ DỤNG BÀN PHÍM ĐỂ CHỌN ĐÁP ÁN (PHÍM 1, 2, 3, 4, ENTER)
// ==========================================
document.addEventListener('keydown', (e) => {
    // Chỉ kích hoạt phím tắt nếu đang mở Tab Quiz
    if (sectionQuiz.classList.contains('hidden')) return;

    const allBtns = optionsContainer.querySelectorAll('.option-btn');

    // Nếu bấm số 1, 2, 3, 4
    if (['1', '2', '3', '4'].includes(e.key)) {
        const btnIndex = parseInt(e.key) - 1;
        if (allBtns[btnIndex] && !allBtns[btnIndex].disabled) {
            allBtns[btnIndex].click(); // Giả lập hành động click chuột
        }
    }

    // Nếu bấm Enter để sang câu mới
    if (e.key === 'Enter' && !nextBtn.classList.contains('hidden')) {
        nextBtn.click();
    }
});