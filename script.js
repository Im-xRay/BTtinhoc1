let vocabList = [];
let currentScore = 0;
let streak = 0; // Đếm số câu đúng liên tiếp
let highScore = localStorage.getItem('ielts_highscore') || 0;
let correctAnswerObj = null;

// Gắn các Element
const tabLearnBtn = document.getElementById('tab-learn');
const tabQuizBtn = document.getElementById('tab-quiz');
const sectionLearn = document.getElementById('section-learn');
const sectionQuiz = document.getElementById('section-quiz');
const scoreDisplay = document.getElementById('score-display');
const streakDisplay = document.getElementById('streak-display');
const container = document.getElementById('flashcard-container');
const searchBar = document.getElementById('search-bar');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// ==========================================
// 1. DARK MODE (GIAO DIỆN TỐI)
// ==========================================
// Kiểm tra xem người dùng có lưu cài đặt Dark Mode không
if (localStorage.getItem('dark_mode') === 'true') {
    document.body.classList.add('dark-theme');
    darkModeToggle.textContent = '☀️';
}

darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('dark_mode', isDark);
});

// ==========================================
// 2. CHUYỂN TAB & LOAD DỮ LIỆU
// ==========================================
tabLearnBtn.addEventListener('click', () => switchTab(tabLearnBtn, tabQuizBtn, sectionLearn, sectionQuiz));
tabQuizBtn.addEventListener('click', () => {
    switchTab(tabQuizBtn, tabLearnBtn, sectionQuiz, sectionLearn);
    if (!correctAnswerObj && vocabList.length > 0) loadNewQuestion();
    updateScoreBoard();
});

function switchTab(activeBtn, inactiveBtn, activeSection, inactiveSection) {
    activeBtn.classList.add('active'); inactiveBtn.classList.remove('active');
    activeSection.classList.remove('hidden'); inactiveSection.classList.add('hidden');
}

document.addEventListener("DOMContentLoaded", () => {
    fetch('data.json')
        .then(res => res.json())
        .then(data => {
            vocabList = data;
            renderFlashcards(vocabList);
        });
});

// ==========================================
// 3. RENDER FLASHCARD & LINK CAMBRIDGE
// ==========================================
function renderFlashcards(dataToRender) {
    container.innerHTML = '';
    dataToRender.forEach(wordObj => {
        const card = document.createElement('div');
        card.className = 'flashcard';
        // Nút Cambridge tích hợp ngay mặt sau thẻ
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <h2>${wordObj.word}</h2>
                    <span class="type">(${wordObj.type})</span>
                    <span>${wordObj.pronunciation}</span>
                </div>
                <div class="card-back">
                    <h3>${wordObj.meaning}</h3>
                    <p><i>"${wordObj.example}"</i></p>
                    <a href="https://dictionary.cambridge.org/dictionary/english/${wordObj.word.toLowerCase()}" target="_blank" class="cambridge-btn">📖 Tra Cambridge</a>
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            // Không lật thẻ nếu bấm vào nút Cambridge
            if (e.target.classList.contains('cambridge-btn')) return;

            card.classList.toggle('flipped');
            if (card.classList.contains('flipped')) {
                speakWord(wordObj.word); // Chỉ đọc khi lật sang mặt sau
            }
        });
        container.appendChild(card);
    });
}

// ==========================================
// 4. TÌM KIẾM TỪ VỰNG
// ==========================================
searchBar.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    const filteredList = vocabList.filter(item =>
        item.word.toLowerCase().includes(keyword) ||
        item.meaning.toLowerCase().includes(keyword)
    );
    renderFlashcards(filteredList);
});

// ==========================================
// 5. PHÁT ÂM
// ==========================================
function speakWord(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-GB';
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 6. QUIZ & GAMIFICATION (PHÁO HOA)
// ==========================================
const questionWordEl = document.getElementById('question-word');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-question-btn');

function updateScoreBoard() {
    scoreDisplay.innerHTML = `Điểm: ${currentScore} &nbsp;|&nbsp; Kỷ lục: ${highScore}`;
}

function loadNewQuestion() {
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';

    correctAnswerObj = vocabList[Math.floor(Math.random() * vocabList.length)];
    questionWordEl.textContent = correctAnswerObj.word;
    speakWord(correctAnswerObj.word);

    let wrongOptions = vocabList.filter(item => item.word !== correctAnswerObj.word)
        .sort(() => 0.5 - Math.random()).slice(0, 3);
    let options = [correctAnswerObj, ...wrongOptions].sort(() => 0.5 - Math.random());

    options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<strong>${index + 1}.</strong> ${option.meaning}`;
        btn.addEventListener('click', () => checkAnswer(btn, option));
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selectedBtn, selectedOption) {
    const allBtns = optionsContainer.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);

    if (selectedOption.word === correctAnswerObj.word) {
        selectedBtn.classList.add('correct');
        streak++;
        // Nhân điểm nếu có Streak
        let pointsEarned = 10 + (streak > 2 ? 5 : 0);
        currentScore += pointsEarned;

        // Hiện thông báo cháy
        if (streak >= 3) {
            streakDisplay.textContent = `🔥 Đang cháy: ${streak} câu liên tiếp (+5 đ thưởng)`;
            streakDisplay.classList.remove('hidden');
        }

        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem('ielts_highscore', highScore);
            // BẮN PHÁO HOA KHI PHÁ KỶ LỤC
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    } else {
        selectedBtn.classList.add('wrong');
        currentScore = 0;
        streak = 0;
        streakDisplay.classList.add('hidden');
        allBtns.forEach(btn => {
            if (btn.textContent.includes(correctAnswerObj.meaning)) btn.classList.add('correct');
        });
    }

    updateScoreBoard();
    nextBtn.classList.remove('hidden');
}

nextBtn.addEventListener('click', loadNewQuestion);

// Bàn phím
document.addEventListener('keydown', (e) => {
    if (sectionQuiz.classList.contains('hidden')) return;
    const allBtns = optionsContainer.querySelectorAll('.option-btn');
    if (['1', '2', '3', '4'].includes(e.key)) {
        const btnIndex = parseInt(e.key) - 1;
        if (allBtns[btnIndex] && !allBtns[btnIndex].disabled) allBtns[btnIndex].click();
    }
    if (e.key === 'Enter' && !nextBtn.classList.contains('hidden')) nextBtn.click();
});