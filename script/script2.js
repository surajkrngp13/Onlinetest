// ================================
// script2.js – Uses global exam2D array directly
// ================================

// -------------------- Worker Code (inline blob) --------------------
const workerBlob = new Blob([`
    let totalSeconds = 0;
    let totalTimerActive = false;
    let totalTimerInterval = null;

    let questionTimers = {}; // { index: { baseTime, startTime, active } }
    let timerIntervals = {};

    function broadcast() {
        self.postMessage({
            type: 'timerUpdate',
            totalSeconds: totalSeconds,
            questionTimes: Object.fromEntries(
                Object.entries(questionTimers).map(([idx, data]) => {
                    let elapsed = data.baseTime;
                    if (data.active && data.startTime) {
                        elapsed += Math.floor((Date.now() - data.startTime) / 1000);
                    }
                    return [idx, elapsed];
                })
            )
        });
    }

    function startTotalTimer() {
        if (totalTimerInterval) clearInterval(totalTimerInterval);
        if (!totalTimerActive) return;
        totalTimerInterval = setInterval(() => {
            if (totalSeconds > 0 && totalTimerActive) {
                totalSeconds--;
                broadcast();
                if (totalSeconds === 0) {
                    self.postMessage({ type: 'totalExpired' });
                }
            } else if (totalSeconds <= 0) {
                clearInterval(totalTimerInterval);
                totalTimerInterval = null;
            }
        }, 1000);
    }

    function stopTotalTimer() {
        if (totalTimerInterval) {
            clearInterval(totalTimerInterval);
            totalTimerInterval = null;
        }
    }

    function startQuestionTimer(idx, currentBase = 0) {
        if (questionTimers[idx] && questionTimers[idx].active) return;
        const now = Date.now();
        questionTimers[idx] = {
            baseTime: currentBase,
            startTime: now,
            active: true
        };
        if (timerIntervals[idx]) clearInterval(timerIntervals[idx]);
        timerIntervals[idx] = setInterval(() => {
            if (questionTimers[idx] && questionTimers[idx].active) {
                broadcast();
            } else {
                clearInterval(timerIntervals[idx]);
                delete timerIntervals[idx];
            }
        }, 200);
        broadcast();
    }

    function stopQuestionTimer(idx, preserve = true) {
        if (!questionTimers[idx]) return;
        if (preserve && questionTimers[idx].active) {
            const elapsed = questionTimers[idx].baseTime + Math.floor((Date.now() - questionTimers[idx].startTime) / 1000);
            questionTimers[idx].baseTime = elapsed;
        }
        questionTimers[idx].active = false;
        if (timerIntervals[idx]) {
            clearInterval(timerIntervals[idx]);
            delete timerIntervals[idx];
        }
        broadcast();
    }

    function resetQuestionTimer(idx) {
        if (questionTimers[idx]) {
            stopQuestionTimer(idx, false);
            delete questionTimers[idx];
        }
        startQuestionTimer(idx, 0);
    }

    self.onmessage = function(e) {
        const { type, data } = e.data;
        switch (type) {
            case 'init':
                totalSeconds = data.totalSeconds;
                totalTimerActive = data.timerEnabled;
                if (totalTimerActive) startTotalTimer();
                break;
            case 'toggleTotalTimer':
                totalTimerActive = data.enabled;
                if (totalTimerActive) startTotalTimer();
                else stopTotalTimer();
                break;
            case 'startQuestion':
                startQuestionTimer(data.idx, data.baseTime || 0);
                break;
            case 'stopQuestion':
                stopQuestionTimer(data.idx, data.preserve);
                break;
            case 'resetQuestion':
                resetQuestionTimer(data.idx);
                break;
            case 'answerQuestion':
                // Stop answered question's timer but preserve elapsed time
                if (questionTimers[data.idx]) {
                    stopQuestionTimer(data.idx, true);
                }
                break;
            case 'stopAll':
                Object.keys(questionTimers).forEach(idx => stopQuestionTimer(idx, true));
                stopTotalTimer();
                break;
            case 'resetVisibleQuestions':
                data.indices.forEach(idx => resetQuestionTimer(idx));
                break;
        }
    };
`], { type: 'application/javascript' });

const worker2 = new Worker(URL.createObjectURL(workerBlob));

// -------------------- Main Script --------------------
 let totalQuestions2 = exam2D.length;
let  userAnswers2 = new Array(totalQuestions2).fill(null);
let  markedForReview2 = new Array(totalQuestions2).fill(false);
let showAnswerOnSelect2 = false;
let timerEnabled2 = true;
let totalSeconds2 = 45 * 60;
let examSubmitted2 = false;
let visibilityObserver2 = null;
let visibleQuestionsSet = new Set();
let isScrolling = false;
let scrollTimeout = null;
let questionElapsedCache = {};
let tabIndex = 0
let tabs = []
let tabTime = 25
let timerInterval = null
let timeLeft = tabTime
const passageText = exam2D[0][8];                     // passage is the 9th element
totalQuestions2 = exam2D.length;                      // number of rows
let tabMeta = {}
let autoIndividualMarksAddition = false;
const allQF = `<div class="exam-container" id="AllQ" style="display: none;">
        <div class="exam-header"><label>
  <input type="checkbox" id="autoMarksToggle">
  🧮 Auto Individual Marks + Time
</label>
            <div class="title-row">
                <div class="main-title"> TCS Part A: Foundation Section - 1</div> <div class="profile-icon" id="profileIcon"><span>👤</span></div>
                    
                
                <div class="right-header">
                    <span><button onclick='prepare("AllQ")'>⚙️ Prepare</button><button onclick='share()'>⤴️</button></span><div id="google_translate_element"></div>
                
                    <div class="control-group">
                        <label><input type="checkbox" id="showAnswerToggle2"> 💡 Show Answer on Select</label>
                        <label><input type="checkbox" id="timerToggle" checked> ⏱️ Timer On/Off</label>
                    </div>
                    <div class="timer-section"><span>⏱️ Total</span><span id="timerValue" translate="no">45:00</span><div id="timerBox"></div></div>
                   
                </div>
            </div>
            <div class="tabbox button" id="tabbox">
            </div>
        </div>

        <div class="all-questions-container" id="allQuestionsContainer"></div>
        <div class="stats-bar">
            <div class="stats-info">
                <div class="stat-item"><span class="stat-dot answered"></span> Answered: <strong id="answeredCount">0</strong></div>
                <div class="stat-item"><span class="stat-dot marked"></span> Marked: <strong id="markedCount">0</strong></div>
                <div class="stat-item"><span class="stat-dot notvisited"></span> Not Visited: <strong id="notVisitedCount">${totalQuestions2}</strong></div>
            </div>
            <button class="submit-btn" id="submitExamBtn2">📊 Submit Exam & View Results</button>
        </div>
    </div>`;

function formatTime(sec) {
    let mins = Math.floor(sec / 60);
    let remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}
function formatSeconds(sec) {
    if (sec < 60) return `${sec}s`;
    let mins = Math.floor(sec / 60);
    let remainingSecs = sec % 60;
    return `${mins}m ${remainingSecs}s`;
}

function updateTotalTimerDisplay() {
    const elem = document.getElementById('timerValue');
    if (elem) elem.innerText = formatTime(totalSeconds2);
    if (totalSeconds2 <= 0 && timerEnabled2 && !examSubmitted2) {
        examSubmitted2 = true;
        showResults();
    }
}
let sf=null

async function prepare(x){
let el=document.getElementById(x)
let c=await html2canvas(el,{scale:2})
let b=await new Promise(r=>c.toBlob(r,"image/png"))
sf=new File([b],"share.png",{type:"image/png"})
alert("Ready ✅")
}

function share(){
let u=location.href

if(!sf)return alert("Prepare first ❌")

if(navigator.canShare&&navigator.canShare({files:[sf]}))
return navigator.share({title:"My Content",text:"Check this 👇",url:u,files:[sf]})

if(navigator.share)
return navigator.share({title:"My Content",text:"Check this 👇\n"+u})
}


function getReportPassword() {
  return sessionStorage.getItem("pp") || "123456";
}

function buildReportCardText() {
  const tabResults = getTabWiseResult();

  let correct = 0, wrong = 0;

  for (let i = 0; i < totalQuestions2; i++) {
    const row = exam2D[i];
    const correctIdx = row[7];

    if (userAnswers2[i] !== null) {
      if (userAnswers2[i] === correctIdx) correct++;
      else wrong++;
    }
  }

  const totalTime = Object.values(questionElapsedCache).reduce((a,b)=>a+b,0);

  let text = "";
  text += "===== EXAM REPORT CARD =====\n\n";
  text += `Total Questions: ${totalQuestions2}\n`;
  text += `Correct: ${correct}\n`;
  text += `Wrong: ${wrong}\n`;
  text += `Accuracy: ${((correct/(correct+wrong||1))*100).toFixed(2)}%\n`;
  text += `Total Time: ${formatSeconds(totalTime)}\n\n`;

  text += "===== TAB WISE SUMMARY =====\n";

  for (let [tab, t] of Object.entries(tabResults)) {
    text += `\n[${tab}]\n`;
    text += `Total: ${t.total}\n`;
    text += `Attempted: ${t.attempted}\n`;
    text += `Correct: ${t.correct}\n`;
    text += `Marks: ${t.marks}\n`;
    text += `Time: ${t.time}\n`;
  }

  return text;
}

async function encryptSecure(obj, password) {

  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(obj));

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data
  );

  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(encrypted)
  };
}
function toBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
async function saveReportCard() {
  await window.initDB();

  const pass = getReportPassword();
  const reportText = buildReportCardText();

  const encrypted = await encryptSecure(reportText, pass);

  const record = {
    examName: window.examName || "Exam",
    date: new Date().toISOString(),
    data: encrypted
  };

  let oldData = [];

  try {
    const raw = await window.getfilefromindexd("reportcard.txt");
    if (raw) oldData = JSON.parse(raw);
  } catch (e) {
    oldData = [];
  }

  oldData.push(record);

  await window.savefileinindexd(JSON.stringify(oldData), "reportcard.txt");

  console.log("✅ Base64 encrypted report saved:", "reportcard.txt");
}


function calculateTabMetaBeforeExam() {

  tabMeta = {}
  let totalExamTime = 0

  for (let i = 0; i < exam2D.length; i++) {
    const row = exam2D[i]

    const tab = row[0]
    const qMarks = Number(row[11]) || 0
    const qTime = Number(row[12]) || 0

    if (!tabMeta[tab]) {
      tabMeta[tab] = {
        totalTime: 0,
        totalMarks: 0
      }
    }

    tabMeta[tab].totalTime += qTime
    tabMeta[tab].totalMarks += qMarks

    totalExamTime += qTime
  }

  // UI SET
  document.getElementById("timerValue").innerText =
    formatTime(totalExamTime * 60)

  // default first tab time
  const firstTab = Object.keys(tabMeta)[0]
  if (firstTab) {
    document.getElementById("timerBox").innerText =
      `Tab Time: ${tabMeta[firstTab].totalTime} min | Marks: ${tabMeta[firstTab].totalMarks}`
  }
}


function startTabTimer() {

  if (timerInterval) {
    clearInterval(timerInterval)
  }

  tabIndex = 0
  timeLeft = tabTime

  showCurrentTab()

  timerInterval = setInterval(() => {

    timeLeft--

    let timerEl = document.getElementById("timerBox")
    if (timerEl) {
      timerEl.innerText = "Time Left: " + timeLeft + " sec"
    }

    if (timeLeft <= 0) {

      tabIndex++

      if (tabIndex >= tabs.length) {
        clearInterval(timerInterval)
        timerInterval = null

        if (timerEl) timerEl.innerText = "Completed"
        return
      }

      timeLeft = tabTime
      showCurrentTab()
    }

  }, 1000)
}


function createTabs() {

  const nav = document.getElementById("tabbox")
  nav.innerHTML = ""

  tabs = [
    ...new Set(
      exam2D
        .filter(row => Array.isArray(row) && row.length > 0)
        .map(row => row[0])
    )
  ]

  tabs.forEach((name) => {

    let safeName = name.replace(/\s+/g, "_")

    let btn = document.createElement("button")
    btn.innerText = name

    if (autoTabMode) {
      btn.disabled = true
    } else {
      btn.disabled = false
      btn.onclick = () => showClass(safeName, btn)
    }

    nav.appendChild(btn)
  })

  if (tabs.length === 0) return

  if (autoTabMode) {
    startTabTimer()
  } else {
    tabIndex = 0
    showCurrentTab()  
  }
}

function showClass(className, btn) {
     console.log("first 55name")

  document.querySelectorAll('.question-card').forEach(el => {
    el.style.display = 'none'
  })

  document.querySelectorAll('.' + className).forEach(el => {
    el.style.display = 'block'
  })

  document.querySelectorAll('#tabbox button').forEach(b => {
    b.classList.remove('active')
  })

  if (btn) btn.classList.add('active')
}


function showCurrentTab() {

  let className = tabs[tabIndex].replace(/\s+/g, "_")

  document.querySelectorAll('.question-card').forEach(el => {
    el.style.display = 'none'
  })

  document.querySelectorAll('.' + className).forEach(el => {
    el.style.display = 'block'
  })

  let tabName = tabs[tabIndex]

  let meta = tabMeta[tabName]

  if (meta) {
    document.getElementById("timerBox").innerText =
      `Tab Time: ${meta.totalTime} min | Marks: ${meta.totalMarks}`
  }

  let buttons = document.getElementById("tabbox").children
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active")
  }

  if (buttons[tabIndex]) {
    buttons[tabIndex].classList.add("active")
  }
}

function updateQuestionTimersDisplay() {
    for (let i = 0; i < totalQuestions2; i++) {
        const timerElem = document.getElementById(`qTimer_${i}`);
        if (timerElem && questionElapsedCache[i] !== undefined) {
            timerElem.textContent = `⏱️ ${formatSeconds(questionElapsedCache[i])}`;
            if (visibleQuestionsSet.has(i) && !isScrolling && userAnswers2[i] === null && timerEnabled2) {
                timerElem.classList.add('active-timer');
            } else {
                timerElem.classList.remove('active-timer');
            }
        }
    }
}

worker2.onmessage = function(e) {
    const msg = e.data;
    if (msg.type === 'timerUpdate') {
        totalSeconds2 = msg.totalSeconds;
        questionElapsedCache = msg.questionTimes;
        updateTotalTimerDisplay();
        updateQuestionTimersDisplay();
        if (totalSeconds2 <= 0 && !examSubmitted2) {
            examSubmitted2 = true;
            showResults();
        }
    } else if (msg.type === 'totalExpired') {
        if (!examSubmitted2) {
            examSubmitted2 = true;
            showResults();
        }
    }
};

function startTotalTimer() {
    if (!timerEnabled2 || examSubmitted2) return;
    worker2.postMessage({ type: 'init', data: { totalSeconds: totalSeconds2, timerEnabled: true } });
}

function stopTotalTimer() {
    worker2.postMessage({ type: 'toggleTotalTimer', data: { enabled: false } });
}

function startQuestionTimer(qIndex) {
    if (!timerEnabled2 || examSubmitted2 || userAnswers2[qIndex] !== null) return;
    const currentBase = questionElapsedCache[qIndex] || 0;
    worker2.postMessage({ type: 'startQuestion', data: { idx: qIndex, baseTime: currentBase } });
}

function stopQuestionTimer(qIndex, preserve = true) {
    worker2.postMessage({ type: 'stopQuestion', data: { idx: qIndex, preserve: preserve } });
}

function resetQuestionTimer(qIndex) {
    worker2.postMessage({ type: 'resetQuestion', data: { idx: qIndex } });
}

function resetTimersForOtherVisibleQuestions(answeredIndex) {
    if (!timerEnabled2) return;
    const toReset = [];
    for (let i = 0; i < totalQuestions2; i++) {
        if (i === answeredIndex) continue;
        if (userAnswers2[i] !== null) continue;
        if (visibleQuestionsSet.has(i)) {
            toReset.push(i);
        }
    }
    if (toReset.length) {
        worker2.postMessage({ type: 'resetVisibleQuestions', data: { indices: toReset } });
    }
}

function answerQuestion(qIndex, selectedIdx) {
    if (examSubmitted2) return;
    if (userAnswers2[qIndex] !== null) return;

    userAnswers2[qIndex] = selectedIdx;

    worker2.postMessage({ type: 'answerQuestion', data: { idx: qIndex } });
    resetTimersForOtherVisibleQuestions(qIndex);

    updateSingleQuestion(qIndex); // ✅ new function
    updateStats();
}
function updateSingleQuestion(i) {
  const card = document.getElementById(`question_${i}`);
  if (!card) return;

  card.classList.add("answered");

  const inputs = card.querySelectorAll("input");
  inputs.forEach(inp => inp.disabled = true);
}

function updateStats() {
    let answered = 0, marked = 0;
    for (let i = 0; i < totalQuestions2; i++) {
        if (userAnswers2[i] !== null) answered++;
        if (markedForReview2[i]) marked++;
    }
    document.getElementById('answeredCount').innerText = answered;
    document.getElementById('markedCount').innerText = marked;
    document.getElementById('notVisitedCount').innerText = totalQuestions2 - answered;
}

function setupVisibilityObserver2() {
    if (visibilityObserver2) visibilityObserver2.disconnect();

    const container = document.getElementById('allQuestionsContainer');
    visibilityObserver2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const idx = parseInt(entry.target.getAttribute('data-qindex'));
            if (isNaN(idx)) return;
            if (entry.isIntersecting) {
                visibleQuestionsSet.add(idx);
                if (userAnswers2[idx] === null && timerEnabled2 && !isScrolling) {
                    startQuestionTimer(idx);
                }
            } else {
                visibleQuestionsSet.delete(idx);
                if (userAnswers2[idx] === null) {
                    stopQuestionTimer(idx, true);
                }
            }
        });
    }, {
        threshold: 0.1,
        root: container
    });

    for (let i = 0; i < totalQuestions2; i++) {
        const card = document.getElementById(`question_${i}`);
        if (card) visibilityObserver2.observe(card);
    }
}

function handleScrollStart() {
    if (!isScrolling) {
        isScrolling = true;
        for (let i of visibleQuestionsSet) {
            if (userAnswers2[i] === null) stopQuestionTimer(i, true);
        }
    }
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
        for (let i of visibleQuestionsSet) {
            if (userAnswers2[i] === null && timerEnabled2) startQuestionTimer(i);
        }
    }, 200);
}

function renderAllQuestions() {
    const container = document.getElementById('allQuestionsContainer');
    container.innerHTML = '';

    let gIndex = 0;
    const chunkSize = 30;
    const total = exam2D.length;

    const passageHTML = `
        <div class="passage-section">
            <h3>📜 Reading Comprehension Passage</h3>
            <div class="passage-text">${passageText}</div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', passageHTML);

    function renderChunk() {
        let html = '';

        for (let c = 0; c < chunkSize && gIndex < total; c++, gIndex++) {
            const i = gIndex;
            const row = exam2D[i];

            const questionText = row[1];
            const options = [row[2], row[3], row[4], row[5], row[6]];
            const correctIndex = row[7];
            const explanation = row[8];
             const Qfeedback = row[9];
              const Qnotranslationset = row[10];
              const noTranslate = (Qnotranslationset === "N") ? 'translate="no"' : "";
               const Qmarks = row[11];
                const Qtime = row[12];
            let safeClass = row[0].replace(/\s+/g, "_")
            const selectedVal = userAnswers2[i];
            const isAnswered = (selectedVal !== null);
            const showFeedback = showAnswerOnSelect2 && isAnswered;
            const isCorrect = showFeedback && selectedVal === correctIndex;
            const timeSpent = questionElapsedCache[i] || 0;
            const answeredClass = isAnswered ? 'answered' : '';

            html += `
                <div class="question-card ${safeClass} ${answeredClass}" id="q${(i+1)}" ${noTranslate} data-qindex="${i}">
                    <div class="question-header">
                        <div class="qno">Question ${i + 1} of ${total}</div><div>${Qmarks}</div><div>${Qtime}</div>
                        <div class="question-timer-display" id="qTimer_${i}">⏱️ ${formatSeconds(timeSpent)}</div>
                    </div>

                    <div class="question-text">${questionText}</div>

                    <div class="options">
                        ${options.map((opt, idx) => {
                            const disabledAttr = isAnswered ? 'disabled' : '';
                            const checkedAttr = (selectedVal === idx) ? 'checked' : '';
                            const disabledClass = isAnswered ? 'disabled-option' : '';

                            return `
                                <div class="option ${disabledClass}">
                                    <input type="radio" name="q_${i}" value="${idx}" id="q${i}_opt${idx}" ${checkedAttr} ${disabledAttr}>
                                    <label for="q${i}_opt${idx}">${opt}</label>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    ${showFeedback ? `
                        <div class="answer-feedback ${isCorrect ? '' : 'wrong'}">
                            <strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong><br>
                            <strong>Correct Answer:</strong> ${options[correctIndex]}<br>
                            <strong>📖 Explanation:</strong> ${explanation || 'No explanation provided.'}<br>
                            <strong>📖 feedback:</strong> ${Qfeedback}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        container.insertAdjacentHTML('beforeend', html);

        if (gIndex < total) {
            requestAnimationFrame(renderChunk);
        } else {
            attachEvents();
            afterRender();
        }
    }

 let eventAttached = false;

function attachEvents() {
    if (eventAttached) return;

    const container = document.getElementById('allQuestionsContainer');

    container.addEventListener('change', (e) => {
        if (e.target.type === 'radio') {
            const name = e.target.name;
            const i = parseInt(name.split('_')[1]);

            if (userAnswers2[i] !== null) return;

            const val = parseInt(e.target.value);
            answerQuestion(i, val);
        }
    });

    eventAttached = true;
}

    function afterRender() {
        visibleQuestionsSet.clear();
        setupVisibilityObserver2();

        setTimeout(() => {
            for (let i = 0; i < total; i++) {
                if (userAnswers2[i] !== null) continue;
                if (visibleQuestionsSet.has(i) && timerEnabled2 && !isScrolling) {
                    startQuestionTimer(i);
                }
            }
        }, 0);

       renderMathInElement(container, {
  delimiters: [
    {left: "$$", right: "$$", display: true},
    {left: "\\(", right: "\\)", display: false}
  ]
});





    }

    renderChunk();
}

// -------------------- Objection Handling --------------------
function saveObjectionsToFile(objections) {
    let content = "OBJECTIONS SUBMITTED\n";
    content += "===================\n\n";
    objections.forEach(obj => {
        content += `Question ${obj.qId}: ${obj.questionText}\n`;
        content += `User Answer: ${obj.userAnswer}\n`;
        content += `Correct Answer: ${obj.correctAnswer}\n`;
        content += `Objection: ${obj.objectionText}\n`;
        content += `-------------------\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `objections_${new Date().toISOString().slice(0,19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


function getTabWiseResult() {

  const result = {}

  for (let i = 0; i < exam2D.length; i++) {

    const row = exam2D[i]
    const tab = row[0]
    const correctIdx = row[7]

    const qMarks = Number(row[11]) || 0
    const qTime = Number(row[12]) || 0

    if (!result[tab]) {
      result[tab] = {
        total: 0,
        attempted: 0,
        correct: 0,
        marks: 0,
        time: 0
      }
    }

    result[tab].total++
    result[tab].time += qTime

    const userAns = userAnswers2[i]

    if (userAns !== null) {
      result[tab].attempted++

      if (userAns === correctIdx) {
        result[tab].correct++

        if (autoIndividualMarksAddition) {
          result[tab].marks += qMarks
        }
      }
    }
  }

  return result
}


function showResults() {
    saveReportCard();
    worker2.postMessage({ type: 'stopAll' });
    let correct = 0, wrong = 0;
    const tabResults = getTabWiseResult()
    for (let i = 0; i < totalQuestions2; i++) {
        const row = exam2D[i];
        const correctIdx = row[7];
        if (userAnswers2[i] !== null) {
            if (userAnswers2[i] === correctIdx) correct++;
            else wrong++;
        }
    }
    const answered = correct + wrong;
    const marked = markedForReview2.filter(m => m).length;
    const totalTime = Object.values(questionElapsedCache).reduce((a,b) => a+b, 0);
    let details = '';
    for (let i = 0; i < totalQuestions2; i++) {
        const row = exam2D[i];
        const qText = row[1];
        const options = [row[2], row[3], row[4], row[5], row[6]];
       const correctIdx = row[7];
        const explanation = row[8];
        const ans = userAnswers2[i];
        const isCorr = ans !== null && ans === correctIdx;
        const timeSpent = questionElapsedCache[i] || 0;
        const userAnswerText = ans !== null ? options[ans] : 'Not Answered';
        const correctAnswerText = options[correctIdx];
        const explanationText = explanation ? explanation : 'No explanation provided.';
        details += `
            <div style="padding:12px; border-bottom:1px solid #e2e8f0; background:${ans===null?'#f9fafb':(isCorr?'#f0fdf4':'#fef2f2')}; margin-bottom:8px; border-radius:12px;">
                <strong>Q${i+1}:</strong> ${qText.substring(0,80)}${qText.length>80?'...':''}<br>
                📌 Your: ${userAnswerText}<br>
                ✓ Correct: ${correctAnswerText}<br>
                ⏱️ Time: ${formatSeconds(timeSpent)}<br>
                <div class="objection-section" id="objSection_${i}" style="margin-top:8px;">
                    <button class="objection-btn" data-qidx="${i}">✍️ Raise Objection</button>
                    <div id="objBox_${i}" style="display:none; margin-top:6px;">
                        <textarea id="objText_${i}" rows="3" cols="50" placeholder="Enter your objection..."></textarea><br>
                        <button class="submit-obj" data-qidx="${i}">Submit Objection</button>
                    </div>
                </div>
            </div>
        `;
    }
    const modal = document.createElement('div');
    modal.className = 'results-modal';
   modal.innerHTML = `
<div class="results-card">
    <h2>📊 Exam Results Summary</h2>

    <div class="result-score">
        Score: ${correct}/${totalQuestions2}
    </div>

    <div class="result-item"><strong>✅ Correct:</strong> ${correct}</div>
    <div class="result-item"><strong>❌ Wrong:</strong> ${wrong}</div>
    <div class="result-item"><strong>📝 Answered:</strong> ${answered}</div>
    <div class="result-item"><strong>🔖 Marked:</strong> ${marked}</div>
    <div class="result-item"><strong>👁️ Not Visited:</strong> ${totalQuestions2 - answered}</div>
    <div class="result-item"><strong>📈 Accuracy:</strong> ${answered ? ((correct / answered) * 100).toFixed(1) : 0}%</div>
    <div class="result-item"><strong>⏱️ Total Time:</strong> ${formatSeconds(totalTime)}</div>

    <hr style="margin:15px 0;">

<h3>📚 Tab Wise Result</h3>

${Object.entries(getTabWiseResult()).map(([tab, t]) => `
  <div style="padding:10px;margin:8px 0;background:#f1f5f9;border-radius:10px;">
    <strong>${tab}</strong><br>
    📌 Total: ${t.total}<br>
    ✍️ Attempted: ${t.attempted}<br>
    ❌ Unattempted: ${t.total - t.attempted}<br>
    ✅ Correct: ${t.correct}<br>
    🏆 Marks: ${t.marks}<br>
    ⏱️ Time: ${t.time} min<br>
    📊 Accuracy: ${t.attempted ? ((t.correct / t.attempted) * 100).toFixed(1) : 0}%
  </div>
`).join('')}

    <details style="margin-top:20px">
        <summary style="cursor:pointer;font-weight:600;color:#e67e22;">
            📋 Detailed Answers
        </summary>

        <div style="max-height:400px;overflow-y:auto;margin-top:12px;" id="detailedAnswers">
            ${details}
        </div>
    </details>

    <button class="close-results" id="closeResultsBtn">Close</button>
</div>
`
    document.body.appendChild(modal);

    // Attach objection button listeners
    const objectionBtns = document.querySelectorAll('.objection-btn');
    objectionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qidx = btn.getAttribute('data-qidx');
            const box = document.getElementById(`objBox_${qidx}`);
            if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
        });
    });

    const submitObjs = document.querySelectorAll('.submit-obj');
    submitObjs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const qidx = btn.getAttribute('data-qidx');
            const textarea = document.getElementById(`objText_${qidx}`);
            const objectionText = textarea.value.trim();
            if (!objectionText) {
                alert('Please enter your objection.');
                return;
            }
            if (!window.objectionsList) window.objectionsList = [];
            const row = exam2D[qidx];
            const options = [row[2], row[3], row[4], row[5]];
            const ans = userAnswers2[qidx];
            const userAnswerText = ans !== null ? options[ans] : 'Not Answered';
            const correctAnswerText = options[row[6]];
            window.objectionsList.push({
                qId: qidx+1,
                questionText: row[1],
                userAnswer: userAnswerText,
                correctAnswer: correctAnswerText,
                objectionText: objectionText
            });
            alert('Objection recorded. It will be saved when you download the file.');
            textarea.value = '';
            document.getElementById(`objBox_${qidx}`).style.display = 'none';
        });
    });

    const saveAllBtn = document.createElement('button');
    saveAllBtn.textContent = '📥 Save All Objections';
    saveAllBtn.style.margin = '10px 0';
    saveAllBtn.style.padding = '8px 16px';
    saveAllBtn.style.backgroundColor = '#4CAF50';
    saveAllBtn.style.color = 'white';
    saveAllBtn.style.border = 'none';
    saveAllBtn.style.borderRadius = '6px';
    saveAllBtn.style.cursor = 'pointer';
    saveAllBtn.addEventListener('click', () => {
        if (window.objectionsList && window.objectionsList.length) {
            saveObjectionsToFile(window.objectionsList);
        } else {
            alert('No objections submitted yet.');
        }
    });
    const detailsDiv = document.querySelector('#detailedAnswers');
    if (detailsDiv) detailsDiv.parentElement.insertBefore(saveAllBtn, detailsDiv);

    document.getElementById('closeResultsBtn').onclick = () => modal.remove();
}

function changeLang(lang) {
  let interval = setInterval(() => {
    let select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
      clearInterval(interval);
    }
  }, 500);
}

function loadCSS(href) {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function all(showAnswer2, timer2, prelang) {

    document.getElementById("QF").innerHTML = allQF
    loadCSS("/CSS/style2.css")

    showAnswerOnSelect2 = showAnswer2
    timerEnabled2 = timer2
    totalSeconds2 = 45 * 60
    examSubmitted2 = false
    visibleQuestionsSet.clear()
    questionElapsedCache = {}

    const showAnswerToggle = document.getElementById('showAnswerToggle2')
    const timerToggle = document.getElementById('timerToggle')

    if (showAnswerToggle) showAnswerToggle.checked = showAnswer2
    if (timerToggle) timerToggle.checked = timer2

    worker2.postMessage({
        type: 'init',
        data: { totalSeconds: totalSeconds2, timerEnabled: timer2 }
    })
    autoIndividualMarksAddition = false
    calculateTabMetaBeforeExam()
    renderAllQuestions()
    updateStats()

    const container = document.getElementById('allQuestionsContainer')
    if (container) {
        container.removeEventListener('scroll', handleScrollStart)
        container.addEventListener('scroll', handleScrollStart)
    }

    if (timerEnabled2) startTotalTimer()

    if (prelang) changeLang(prelang)

    if (tab === "true") {
        if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
        }
        createTabs()
    }
    const autoToggle = document.getElementById("autoMarksToggle")

if (autoToggle) {
  autoToggle.checked = autoIndividualMarksAddition

  autoToggle.onchange = () => {
    autoIndividualMarksAddition = autoToggle.checked
  }
}

    document.getElementById('AllQ').style.display = 'flex'

    console.log('Rendering completed:', totalQuestions2)
}








