// === DOM ELEMENTS ===
const startBtn = document.getElementById("start-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const questionText = document.getElementById("question-text");
const answerButtons = document.getElementById("answer-buttons");
const startScreen = document.querySelector(".start-screen");
const quizScreen = document.querySelector(".quiz-screen");
const endScreen = document.querySelector(".end-screen");
const scoreEl = document.getElementById("score");
const reviewEl = document.getElementById("review");
const imageElement = document.getElementById("drink-image");
const timeDisplay = document.getElementById("time-left");
const timerFill = document.getElementById("timer-fill");

// === STATE VARIABLES ===
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let incorrectAnswers = [];
let timer, timeLeft;
let quizStartTime, quizEndTime;

// === SOUND EFFECTS ===
const correctSound = new Audio("assets/correct.mp3");
const wrongSound = new Audio("assets/wrong.mp3");
const timeoutSound = new Audio("assets/timeout.mp3");

// === EVENT LISTENERS ===
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", showNextQuestion);
restartBtn.addEventListener("click", startQuiz);

// Keyboard shortcuts (1–4)
document.addEventListener("keydown", (e) => {
  const key = e.key;
  if (["1", "2", "3", "4"].includes(key)) {
    const index = parseInt(key) - 1;
    const buttons = answerButtons.querySelectorAll("button");
    if (buttons[index] && !buttons[index].disabled) {
      buttons[index].click();
    }
  }
});

// === MAIN FUNCTIONS ===
async function startQuiz() {
  score = 0;
  currentQuestionIndex = 0;
  incorrectAnswers = [];
  questions = await generateQuestions(6);
  quizStartTime = Date.now();

  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  showQuestion();
}

async function generateQuestions(num) {
  const questions = [];

  for (let i = 0; i < num; i++) {
    const res = await fetch(
      "https://www.thecocktaildb.com/api/json/v1/1/random.php"
    );
    const data = await res.json();
    const drink = data.drinks[0];

    const correct = drink.strIngredient1;
    const options = [correct];

    while (options.length < 4) {
      const rand = await fetch(
        "https://www.thecocktaildb.com/api/json/v1/1/random.php"
      );
      const randDrink = (await rand.json()).drinks[0];
      const ingredient = randDrink.strIngredient1;
      if (ingredient && !options.includes(ingredient)) {
        options.push(ingredient);
      }
    }

    questions.push({
      question: `Which of the following is an ingredient in ${drink.strDrink}?`,
      correct: correct,
      options: shuffle(options),
      image: drink.strDrinkThumb,
      name: drink.strDrink,
    });
  }

  return questions;
}

function showQuestion() {
  resetState();
  const q = questions[currentQuestionIndex];

  questionText.textContent = q.question;
  imageElement.src = q.image;
  imageElement.alt = q.name;
  imageElement.classList.remove("hidden");

  q.options.forEach((option) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.addEventListener("click", () => selectAnswer(option, q.correct));
    answerButtons.appendChild(button);
  });

  startTimer();
}

function selectAnswer(selected, correct) {
  clearInterval(timer);
  const buttons = answerButtons.querySelectorAll("button");

  buttons.forEach((button) => {
    if (button.textContent === correct) {
      button.classList.add("correct");
    } else if (button.textContent === selected) {
      button.classList.add("wrong");
    }
    button.disabled = true;
  });

  if (selected === correct) {
    score++;
    correctSound.play();
  } else {
    wrongSound.play();
    incorrectAnswers.push({
      question: questions[currentQuestionIndex].question,
      correct,
    });
  }

  nextBtn.classList.remove("hidden");
}

function showNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showEndScreen();
  }
}

function showEndScreen() {
  quizScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");

  quizEndTime = Date.now();
  const totalSeconds = Math.floor((quizEndTime - quizStartTime) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const totalQuestions = questions.length;
  const correct = score;
  const incorrect = totalQuestions - correct;
  const percentage = ((correct / totalQuestions) * 100).toFixed(1);

  // Scoreboard
  scoreEl.innerHTML = `
    <h2>🎯 Scoreboard</h2>
    <p>✅ Correct: <strong>${correct}</strong></p>
    <p>❌ Incorrect: <strong>${incorrect}</strong></p>
    <p>📊 Score: <strong>${percentage}%</strong></p>
    <p>🕒 Time Taken: <strong>${minutes}m ${seconds}s</strong></p>
  `;

  // Review of incorrect answers
  reviewEl.innerHTML =
    `<h3>❌ Review Incorrect Answers</h3>` +
    incorrectAnswers
      .map(
        (item) =>
          `<p><strong>${item.question}</strong><br>✅ Correct Answer: ${item.correct}</p>`
      )
      .join("");

  // 🎉 Confetti celebration
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
  });
}

function resetState() {
  clearInterval(timer);
  answerButtons.innerHTML = "";
  questionText.textContent = "";
  imageElement.classList.add("hidden");
  nextBtn.classList.add("hidden");
  timeDisplay.textContent = "10";
  timerFill.style.width = "100%";
}

// === TIMER ===
function startTimer() {
  timeLeft = 10;
  timeDisplay.textContent = timeLeft;
  timerFill.style.width = "100%";

  timer = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    timerFill.style.width = `${(timeLeft / 10) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeUp();
    }
  }, 1000);
}

function handleTimeUp() {
  timeoutSound.play();
  const q = questions[currentQuestionIndex];
  incorrectAnswers.push({ question: q.question, correct: q.correct });

  const buttons = answerButtons.querySelectorAll("button");
  buttons.forEach((button) => {
    if (button.textContent === q.correct) {
      button.classList.add("correct");
    }
    button.disabled = true;
  });

  nextBtn.classList.remove("hidden");
}

// === UTILITIES ===
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}
