
// exam2D must already exist in global scope.
// Each row: [code, text, optA, optB, optC, optD, correctIdx, explanation, passage]



  

 let totalQuestions = exam2D.length;
 let passage = exam2D[0][8];
 // passage is the same for all questions
let userAnswers1 = new Array(totalQuestions).fill(null);
let markedForReview1 = new Array(totalQuestions).fill(false);
let questionTimeSpent1 = new Array(totalQuestions).fill(0);
let questionStartTime1 = null;
let currentQuestionIndex1 = 0;
let showAnswerOnSelect1 = false;
let timerEnabled1 = true;
let totalSeconds1 = 45 * 60;
let totalTimerInterval1 = null;
let questionTimerInterval1 = null;
let examSubmitted1 = false;
let unique=[];
let tabIndex = 0
let tabTimer = null
let tabSeconds = 20 // per tab time (change as needed)
let tabList = [];
let submittedObjections = [];

// =============================== HELPER FUNCTIONS ===============================
function formatTime(sec) {
    let mins = Math.floor(sec / 60);
    let remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}

function formatSeconds(sec) {
    if (sec < 60) return `${sec}s`;
    let mins = Math.floor(sec / 60);
    let remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}

function updateTotalTimerDisplay() {
    const timerElem = document.getElementById('timerValue');
    if (timerElem) timerElem.innerText = formatTime(totalSeconds1);
    if (totalSeconds1 <= 0 && timerEnabled1 && !examSubmitted1) {
        clearInterval(totalTimerInterval1);
        examSubmitted1 = true;
        showResultsSummary();
    }
}

function startTabTimer() {
  if (!autoTabMode) return   

  if (tabTimer) clearInterval(tabTimer)

  let timeLeft = tabSeconds
  const timerBox = document.getElementById("timerBox")

  tabTimer = setInterval(() => {

    if (!autoTabMode) {
      clearInterval(tabTimer)
      return
    }

    timeLeft--

    if (timerBox) {
      timerBox.innerText = formatTime(timeLeft)

      if (timeLeft <= 10) {
        timerBox.classList.add("warning")
      } else {
        timerBox.classList.remove("warning")
      }
    }

    if (timeLeft <= 0) {
      moveToNextTab()
    }

  }, 1000)
}



function moveToNextTab() {
console.log("autoT5abMode")
  if (!autoTabMode) return
console.log("auto8TabMode")
  tabIndex++

  if (tabIndex >= tabList.length) {
    clearInterval(tabTimer)
    autoTabMode = true
    return
  }

  let next = tabList[tabIndex]

  let btn = document.querySelectorAll("#tabbox button")[tabIndex]

  showClass(next, btn)

  let index1 = exam2D.findIndex(r =>
    r[0].replace(/[^a-zA-Z0-9_]/g, "_") === next
  )

  if (index1 !== -1) {
    currentQuestionIndex1 = index1
    renderCurrentQuestion()
  }

  if (autoTabMode) startTabTimer()
}




function createTabs() {

  const nav = document.getElementById("tabbox")
  nav.innerHTML = ""

  let unique = [
    ...new Set(
      exam2D
        .map(row => row[0])
    )
  ]

  tabList = unique.map(name =>
    name.replace(/[^a-zA-Z0-9_]/g, "_")
  )




  unique.forEach((name, index) => {

    let safeName = name.replace(/[^a-zA-Z0-9_]/g, "_")

    let btn = document.createElement("button")
    btn.innerText = name
  console.log(autoTabMode)
    btn.onclick = () => {
  console.log("Tab time1")
      if (autoTabMode) return
console.log("Tab time2")
      showClass(safeName, btn)

      let index1 = exam2D.findIndex(r =>
        r[0].replace(/[^a-zA-Z0-9_]/g, "_") === safeName
      )

      if (index1 !== -1) {
        currentQuestionIndex1 = index1
        renderCurrentQuestion()
      }

      tabIndex = index
      startTabTimer()
    }

    nav.appendChild(btn)
  })
console.log("Tab time3")
  // default first tab
  if (unique.length > 0) {
console.log("T1ab time1")
    let first = tabList[0]

    let firstBtn = nav.children[0]

    showClass(first, firstBtn)
console.log("Tab 5time1")
    let index1 = exam2D.findIndex(r =>
      r[0].replace(/[^a-zA-Z0-9_]/g, "_") === first
    )

    if (index1 !== -1) {
      currentQuestionIndex1 = index1
      renderCurrentQuestion()
    }

    startTabTimer()
  }
}




// tab switch
function showClass(className, btn) {

  // 🔹 palette hide all
  document.querySelectorAll('.palette-btn').forEach(el => {
    el.style.display = 'none'
  })

  // 🔹 show only selected class
  document.querySelectorAll('.palette-btn.' + className).forEach(el => {
    el.style.display = 'inline-block'
  })

  // 🔹 active tab button
  document.querySelectorAll('#tabbox button').forEach(b => {
    b.classList.remove('active')
  })

  if (btn) btn.classList.add('active')

}





// default first tab

// call function
//createTabs(twoDArray)










async function share(x){
let el=document.getElementById(x)
if(!el)return alert("Element not found ❌")

let u=location.href
try{
let canvas=await html2canvas(el,{scale:2}),
blob=await new Promise(r=>canvas.toBlob(r,"image/png")),
file=new File([blob],"share.png",{type:"image/png"})
console.log("Canvas:",canvas)
console.log("Blob:",blob)
console.log("File:",file)
let a=document.createElement("a")
a.href=URL.createObjectURL(blob)
a.download="share.png"
if(navigator.canShare&&navigator.canShare({files:[file]}))
return await navigator.share({title:"My Content",text:"Check this 👇",url:u,files:[file]})
console.log("Fail 1")
a.click()
if(navigator.share)
return await navigator.share({title:"My Content",text:"Check this 👇",url:u})

}catch(e){console.log("Share error:",e)}

try{
await navigator.clipboard.writeText(u)
alert("Link copied ✅")
}catch{
alert("Copy failed ❌")
}
}

function startTotalTimer() {
    if (totalTimerInterval1) clearInterval(totalTimerInterval1);
    if (!timerEnabled1 || examSubmitted1) return;
    totalTimerInterval1 = setInterval(() => {
        if (totalSeconds1 > 0 && !examSubmitted1) {
            totalSeconds1--;
            updateTotalTimerDisplay();
        } else if (totalSeconds1 <= 0 && !examSubmitted1) {
            clearInterval(totalTimerInterval1);
            examSubmitted1 = true;
            showResultsSummary();
        }
    }, 1000);
}

function stopTotalTimer() {
    if (totalTimerInterval1) {
        clearInterval(totalTimerInterval1);
        totalTimerInterval1 = null;
    }
}

function stopQuestionTimerAndSave() {
    if (questionTimerInterval1) {
        clearInterval(questionTimerInterval1);
        questionTimerInterval1 = null;
    }
    if (questionStartTime1 && !examSubmitted1 && timerEnabled1) {
        const elapsed = Math.floor((Date.now() - questionStartTime1) / 1000);
        questionTimeSpent1[currentQuestionIndex1] += elapsed;
        questionStartTime1 = null;
    }
}

function startQuestionTimerForCurrent() {
    if (questionTimerInterval1) stopQuestionTimerAndSave();
    if (!timerEnabled1 || examSubmitted1) return;

    const currentSpent = questionTimeSpent1[currentQuestionIndex1];
    const startTime = Date.now();

    questionStartTime1 = startTime;
    questionTimerInterval1 = setInterval(() => {
        if (!examSubmitted1 && timerEnabled1 && questionStartTime1) {
            const elapsed = Math.floor((Date.now() - questionStartTime1) / 1000);
            const totalElapsed = currentSpent + elapsed;
            const qTimerElement = document.getElementById('currentQuestionTimer');
            if (qTimerElement) {
                qTimerElement.textContent = `⏱️ ${formatSeconds(totalElapsed)}`;
            }
        }
    }, 1000);
}

function pauseQuestionTimerOnVisibility() {
    if (document.hidden && !examSubmitted1 && timerEnabled1) {
        stopQuestionTimerAndSave();
    } else if (!document.hidden && !examSubmitted1 && timerEnabled1 && !questionTimerInterval1) {
        startQuestionTimerForCurrent();
    }
}

document.addEventListener('visibilitychange', pauseQuestionTimerOnVisibility);

function saveCurrentQuestionTime() {
    if (questionStartTime1 && timerEnabled1 && !examSubmitted1) {
        const elapsed = Math.floor((Date.now() - questionStartTime1) / 1000);
        questionTimeSpent1[currentQuestionIndex1] += elapsed;
        questionStartTime1 = Date.now();
    }
}

function getStatus(idx) {
    if (userAnswers1[idx] !== null) return "answered";
    if (markedForReview1[idx]) return "marked";
    return "not-visited";
}

// =============================== OBJECTION HANDLING ===============================
function safeStr(val) {
    if (val === null || val === undefined) return '';
    return typeof val === 'string' ? val : String(val);
}

function escapeHtml(str) {
    str = safeStr(str);
    return str.replace(/[&<>"]/g, m => (
        m === '&' ? '&amp;' :
        m === '<' ? '&lt;' :
        m === '>' ? '&gt;' :
        m === '"' ? '&quot;' : m
    ));
}

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

function openObjectionModal(qId, questionText, userAnswer, correctAnswer, existingObjectionText) {
    // Remove any existing modal first
    const existingModal = document.getElementById('objectionModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'objectionModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 500px;
        max-width: 90%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    modalContent.innerHTML = `
        <h3>Objection for Question ${qId}</h3>
        <p><strong>Question:</strong> ${escapeHtml(questionText)}</p>
        <p><strong>Your Answer:</strong> ${escapeHtml(userAnswer)}</p>
        <p><strong>Correct Answer:</strong> ${escapeHtml(correctAnswer)}</p>
        <label for="objectionText">Please explain your objection:</label><br>
        <textarea id="objectionText" rows="5" style="width:100%; margin: 8px 0;">${existingObjectionText ? escapeHtml(existingObjectionText) : ''}</textarea>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="cancelObjection">Cancel</button>
            <button id="submitObjection" style="background: #4CAF50; color: white;">Submit Objection</button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const cancelBtn = modalContent.querySelector('#cancelObjection');
    const submitBtn = modalContent.querySelector('#submitObjection');
    const textarea = modalContent.querySelector('#objectionText');

    cancelBtn.onclick = () => modal.remove();
    submitBtn.onclick = () => {
        const objectionText = textarea.value.trim();
        if (!objectionText) {
            alert('Please enter your objection.');
            return;
        }

        // Update or add objection
        const existingIndex = submittedObjections.findIndex(obj => obj.qId === qId);
        const objectionObj = {
            qId: qId,
            questionText: questionText,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            objectionText: objectionText
        };
        if (existingIndex !== -1) {
            submittedObjections[existingIndex] = objectionObj;
        } else {
            submittedObjections.push(objectionObj);
        }

        // Update the objection button status (optional)
        const objBtn = document.querySelector(`.objection-btn[data-qid="${qId}"]`);
        if (objBtn) {
            objBtn.textContent = '📝 Objected';
            objBtn.style.backgroundColor = '#ffc107';
        }

        modal.remove();
        alert('Objection saved. You can download all objections at the bottom of this page.');
    };
}

// =============================== WEB WORKER (modified to include objection button) ===============================
const workerCode = `
   function safeStr(val) {
    if (val === null || val === undefined) return '';
    return typeof val === 'string' ? val : String(val);
}

function escapeHtml(str) {
    str = safeStr(str);
    return str.replace(/[&<>"]/g, m => (
        m === '&' ? '&amp;' :
        m === '<' ? '&lt;' :
        m === '>' ? '&gt;' :
        m === '"' ? '&quot;' : m
    ));
}

    self.onmessage = function(e) {
        const { type, data } = e.data;
        if (type === 'generateDetailedHTML') {
            const { questions, userAnswers, questionTimeSpent, userAnswerTexts, correctAnswerTexts } = data;
            let html = '';
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                const selectedOption = userAnswers[i];
                const isCorrect = Number.isInteger(selectedOption) && selectedOption === q.correct;
                const isAnswered = selectedOption !== null;
                const timeSpent = questionTimeSpent[i];
                let statusClass = 'unanswered';
                let statusText = 'Not Answered';
                if (isAnswered) {
                    statusClass = isCorrect ? 'correct' : 'wrong';
                    statusText = isCorrect ? 'Correct ✓' : 'Wrong ✗';
                }

                const userAnswerText = userAnswerTexts[i] ?? 'Not answered';
                const correctAnswerText = correctAnswerTexts[i] ?? '';

                html += \`
                    <div class="question-detail-item \${statusClass}">
                        <div class="detail-header">
                            <span class="detail-qno">Question \${q.id}</span>
                            <span class="detail-time">⏱️ Time: \${formatSeconds(timeSpent)}</span>
                            <span class="status-badge status-\${statusClass === 'correct' ? 'correct' : (statusClass === 'wrong' ? 'wrong' : 'unanswered')}">\${statusText}</span>
                            <button class="objection-btn" data-qid="\${q.id}" data-question="\${escapeHtml(safeStr(q.text))}" data-user-answer="\${escapeHtml(userAnswerText)}" data-correct-answer="\${escapeHtml(correctAnswerText)}" style="margin-left: auto; padding: 4px 8px; font-size: 12px;">🗳️ Object</button>
                        </div>
                        <div class="detail-question">\${escapeHtml(q.text)}</div>
                        <div class="detail-options">
                            \${(q.options || []).map((opt, idx) => {
                                opt = safeStr(opt);
                                let extraClass = '';
                                let indicator = '';
                                if (idx === q.correct) {
                                    extraClass = 'correct-answer';
                                    indicator = ' ✓ (Correct Answer)';
                                }
                                if (selectedOption === idx) {
                                    extraClass += ' user-selected';
                                    indicator = ' ← Your Answer';
                                }
                                return \`<div class="detail-option \${extraClass}">\${escapeHtml(opt)}\${indicator}</div>\`;
                            }).join('')}
                        </div>
                        <div class="detail-status">
                           <strong>📖 Explanation:</strong> \${escapeHtml(q.explanation)}
                        </div>
                    </div>
                \`;
            }
            function formatSeconds(sec) {
                if (sec < 60) return sec + 's';
                let mins = Math.floor(sec / 60);
                let remainingSecs = sec % 60;
                return mins + 'm ' + remainingSecs + 's';
            }
            self.postMessage({ type: 'detailedHTML', html });
        } else if (type === 'generateResultsHTML') {
            const { questions, userAnswers, markedForReview, questionTimeSpent } = data;
            let correctCount = 0, wrongCount = 0;
            for (let i = 0; i < questions.length; i++) {
                if (userAnswers[i] !== null) {
                    if (userAnswers[i] === questions[i].correct) correctCount++;
                    else wrongCount++;
                }
            }
            let answeredCount = correctCount + wrongCount;
            let markedCount = markedForReview.filter(m => m).length;
            let notVisitedCount = questions.length - answeredCount;
            let totalTimeSpent = questionTimeSpent.reduce((a,b) => a+b, 0);
            const resultsHtml = \`
                <div class="detailed-modal" id="resultsModal">
                    <div class="detailed-card">
                        <h2>📊 Exam Results Summary</h2>
                        <div style="text-align: center; margin: 20px 0;">
                            <div style="font-size: 2.5rem; font-weight: 800; color: #e67e22;">\${correctCount}/\${questions.length}</div>
                            <div style="color: #666;">Overall Score</div>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong>✅ Correct Answers:</strong> <span>\${correctCount}</span>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong>❌ Wrong Answers:</strong> <span>\${wrongCount}</span>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong>📝 Answered:</strong> <span>\${answeredCount}</span>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong>🔖 Marked for Review:</strong> <span>\${markedCount}</span>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <strong>👁️ Not Visited:</strong> <span>\${notVisitedCount}</span>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0;">
                            <strong>📈 Accuracy:</strong> <span>\${answeredCount > 0 ? ((correctCount/answeredCount)*100).toFixed(1) : 0}%</span>
                        </div>
                        <div class="result-item" style="display: flex; justify-content: space-between; padding: 10px 0;">
                            <strong>⏱️ Total Time Spent:</strong> <span>\${formatSeconds(totalTimeSpent)}</span>
                        </div>
                        <div style="display: flex; gap: 12px; margin-top: 24px;">
                            <button class="btn btn-success" id="viewDetailedAnswersBtn" style="flex: 1;">📋 View Detailed Answers</button>
                            <button class="btn btn-primary" id="closeResultsOnlyBtn" style="flex: 1;">Close</button>
                        </div>
                    </div>
                </div>
            \`;
            function formatSeconds(sec) {
                if (sec < 60) return sec + 's';
                let mins = Math.floor(sec / 60);
                let remainingSecs = sec % 60;
                return mins + 'm ' + remainingSecs + 's';
            }
            self.postMessage({ type: 'resultsHTML', html: resultsHtml });
        }
    };
`;
const blob1 = new Blob([workerCode], { type: 'application/javascript' });
const worker1 = new Worker(URL.createObjectURL(blob1));

let detailedHTMLCallback = null;
let resultsHTMLCallback = null;

worker1.onmessage = function(e) {
    const { type, html } = e.data;
    if (type === 'detailedHTML' && detailedHTMLCallback) {
        detailedHTMLCallback(html);
        detailedHTMLCallback = null;
    } else if (type === 'resultsHTML' && resultsHTMLCallback) {
        resultsHTMLCallback(html);
        resultsHTMLCallback = null;
    }
};

// =============================== WORKER HELPERS ===============================
function getQuestionsObject() {
    return exam2D.map((row, idx) => ({
        id: idx + 1,
        text: row[1] ?? '',
        options: [
            row[2] ?? '',
            row[3] ?? '',
            row[4] ?? '',
            row[5] ?? ''
        ],
        correct: Number.isInteger(row[6]) ? row[6] : -1,
        explanation: row[7] ?? ''
    }));
}

function getUserAnswerTexts() {
    const questions = getQuestionsObject();
    return userAnswers1.map((ansIdx, idx) => {
        if (ansIdx === null) return null;
        return questions[idx].options[ansIdx];
    });
}

function getCorrectAnswerTexts() {
    const questions = getQuestionsObject();
    return questions.map(q => q.options[q.correct]);
}

function showDetailedAnswers() {
    const loadingHtml = `
        <div class="detailed-modal" id="detailedModal">
            <div class="detailed-card">
                <h2>📋 Detailed Answer Sheet</h2>
                <div style="text-align:center; padding: 40px;">Loading... ⏳</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHtml);

    worker1.postMessage({
        type: 'generateDetailedHTML',
        data: {
            questions: getQuestionsObject(),
            userAnswers: userAnswers1,
            questionTimeSpent: questionTimeSpent1,
            userAnswerTexts: getUserAnswerTexts(),
            correctAnswerTexts: getCorrectAnswerTexts()
        }
    });

    detailedHTMLCallback = (html) => {
        const modal = document.getElementById('detailedModal');
        if (modal) {
            modal.innerHTML = `
                <div class="detailed-card">
                    <h2>📋 Detailed Answer Sheet</h2>
                    <div id="detailedQuestionsContainer">${html}</div>
                    <div style="margin-top: 20px; text-align: center;">
                        <button id="saveObjectionsBtn" class="btn btn-warning" style="background: #ff9800; color: white;">💾 Save All Objections to File</button>
                    </div>
                    <button class="close-detailed" id="closeDetailedBtn" style="margin-top: 10px;">Close</button>
                </div>
            `;
            document.getElementById("closeDetailedBtn")?.addEventListener("click", () => {
                document.getElementById("detailedModal")?.remove();
            });
            document.getElementById("saveObjectionsBtn")?.addEventListener("click", () => {
                if (submittedObjections.length === 0) {
                    alert('No objections have been submitted yet.');
                    return;
                }
                saveObjectionsToFile(submittedObjections);
            });

            // Attach objection button listeners
            document.querySelectorAll('.objection-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const qId = parseInt(btn.dataset.qid);
                    const questionText = btn.dataset.question;
                    const userAnswer = btn.dataset.userAnswer;
                    const correctAnswer = btn.dataset.correctAnswer;
                    const existing = submittedObjections.find(obj => obj.qId === qId);
                    const existingText = existing ? existing.objectionText : '';
                    openObjectionModal(qId, questionText, userAnswer, correctAnswer, existingText);
                });
            });
        }
    };
}

function showResultsSummary() {
    stopQuestionTimerAndSave();

    const loadingHtml = `
        <div class="detailed-modal" id="resultsModal">
            <div class="detailed-card">
                <h2>📊 Exam Results Summary</h2>
                <div style="text-align:center; padding: 40px;">Loading... ⏳</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHtml);

    worker1.postMessage({
        type: 'generateResultsHTML',
        data: {
            questions: getQuestionsObject(),
            userAnswers: userAnswers1,
            markedForReview: markedForReview1,
            questionTimeSpent: questionTimeSpent1
        }
    });

    resultsHTMLCallback = (html) => {
        const modal = document.getElementById('resultsModal');
        if (modal) {
            modal.innerHTML = html;
            document.getElementById("viewDetailedAnswersBtn")?.addEventListener("click", () => {
                document.getElementById("resultsModal")?.remove();
                showDetailedAnswers();
            });
            document.getElementById("closeResultsOnlyBtn")?.addEventListener("click", () => {
                document.getElementById("resultsModal")?.remove();
            });
        }
    };
}

// =============================== UI RENDERING (unchanged) ===============================
function updatePaletteAndStats() {
    let answeredCount = 0, markedCount = 0;

    for (let i = 0; i < totalQuestions; i++) {
        if (userAnswers1[i] !== null) answeredCount++;
        if (markedForReview1[i]) markedCount++;
    }

    let notVisitedRaw = 0;
    for (let i = 0; i < totalQuestions; i++) {
        if (userAnswers1[i] === null && !markedForReview1[i]) notVisitedRaw++;
    }

    const legendHtml = `
        <div class="legend-status">
            <div class="legend-row"><span><span class="legend-color answered-badge"></span> Answered</span><span class="stats-numbers">${answeredCount}</span></div>
            <div class="legend-row"><span><span class="legend-color marked-badge"></span> Marked</span><span class="stats-numbers">${markedCount}</span></div>
            <div class="legend-row"><span><span class="legend-color notvisited-badge"></span> Not Visited</span><span class="stats-numbers">${notVisitedRaw}</span></div>
        </div>

        <div class="question-palette">
            <div style="font-weight:700; margin-bottom: 12px;">📋 Question Palette</div>
            <div class="palette-grid" id="paletteGrid"></div>

            <button class="btn btn-success" id="viewDetailedBtn" style="width:100%; margin-top:12px;">
                📋 View Detailed Answers
            </button>

            <button class="btn btn-danger" id="submitExamBtn1" style="width:100%; margin-top:8px;">
                📊 Submit Exam
            </button>

            <div class="info-footer" style="margin-top:12px; font-size:0.7rem;">
                💡 Click any question to navigate • Per-question time tracked
            </div>
        </div>
    `;

    document.getElementById("paletteArea").innerHTML = legendHtml;

    const grid = document.getElementById("paletteGrid");

    if (grid) {
        for (let i = 0; i < totalQuestions; i++) {
            const btn = document.createElement("button");

            let safeClass = exam2D[i][0].replace(/[^a-zA-Z0-9_]/g, "_");

            btn.textContent = `${i + 1}`;
            btn.className = `palette-btn ${getStatus(i)} ${safeClass}`;

            if (currentQuestionIndex1 === i) btn.classList.add("current");

            btn.addEventListener("click", () => {
                if (!examSubmitted1) {
                    saveCurrentQuestionTime();
                    stopQuestionTimerAndSave();
                    currentQuestionIndex1 = i;
                    renderCurrentQuestion();
                    updatePaletteAndStats();
                }
            });

            grid.appendChild(btn);
        }
    }
}


function renderCurrentQuestion() {
    if (examSubmitted1) return;
    stopQuestionTimerAndSave();
     const container = document.getElementById("questionArea");
    const row = exam2D[currentQuestionIndex1];
    const qText = row[1];
    const options = [row[2], row[3], row[4], row[5]];
    const correctIdx = row[6];
    const explanation = row[7];
   

    const selectedVal = userAnswers1[currentQuestionIndex1];
    const isMarked = markedForReview1[currentQuestionIndex1];
    const showFeedback = showAnswerOnSelect1 && selectedVal !== null;
    const isCorrect = showFeedback && selectedVal === correctIdx;
    const currentTimeSpent = questionTimeSpent1[currentQuestionIndex1];

    const html = `
        <div class="passage-box">
            <div class="passage-title">📜 Reading Comprehension Passage</div>
            <div class="passage-text">${passage}</div>
        </div>
        <div class="question-card">
            <div class="question-header">
                <div class="qno">Question ${currentQuestionIndex1+1} of ${totalQuestions}</div>
               <div translate="no" class="question-timer-display" id="currentQuestionTimer">
                    ⏱️ ${formatSeconds(currentTimeSpent)}
                </div>
            </div>
            <div class="question-text">${qText}</div>
            <div class="options" id="optionsContainer">
                ${options.map((opt, idx) => `
                    <div class="option" data-opt="${idx}">
                        <input type="radio" name="qOption" value="${idx}" id="opt_${idx}" ${selectedVal === idx ? 'checked' : ''}>
                        <label for="opt_${idx}">${opt}</label>
                    </div>
                `).join('')}
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary" id="saveNextBtn">💾 Save & Next</button>
                <button class="btn btn-outline" id="markReviewBtn">${isMarked ? '✓ Marked' : '📌 Mark for Review'}</button>
                <button class="btn btn-outline" id="clearResponseBtn">🗑 Clear</button>
            </div>
            ${showFeedback ? `
                <div class="answer-feedback ${isCorrect ? '' : 'wrong'}">
                    <strong>${isCorrect ? '✅ Correct!' : '❌ Incorrect'}</strong><br>
                    <strong>Correct Answer:</strong> ${options[correctIdx]}<br>
                    <strong>📖 Explanation:</strong> ${explanation}
                </div>
            ` : ''}
        </div>
    `;
  container.innerHTML = html;

renderMathInElement(container, {
  delimiters: [
    {left: "$$", right: "$$", display: true},
    {left: "\\(", right: "\\)", display: false}
  ]
});

 
    startQuestionTimerForCurrent();

    document.querySelectorAll('.option').forEach(optDiv => {
        const radio = optDiv.querySelector('input[type="radio"]');
        if (radio) {
            radio.addEventListener('change', (e) => {
                const selectedIdx = parseInt(e.target.value);
                userAnswers1[currentQuestionIndex1] = selectedIdx;
                updatePaletteAndStats();
                renderCurrentQuestion();
            });
        }
    });

    document.getElementById("saveNextBtn")?.addEventListener("click", () => {
        saveCurrentQuestionTime();
        if (currentQuestionIndex1 + 1 < totalQuestions) {
            currentQuestionIndex1++;
            renderCurrentQuestion();
            updatePaletteAndStats();
        } else {
            alert("Last question reached! Use palette to navigate.");
        }
    });

    document.getElementById("markReviewBtn")?.addEventListener("click", () => {
        saveCurrentQuestionTime();
        markedForReview1[currentQuestionIndex1] = !markedForReview1[currentQuestionIndex1];
        updatePaletteAndStats();
        if (currentQuestionIndex1 + 1 < totalQuestions) {
            currentQuestionIndex1++;
            renderCurrentQuestion();
            updatePaletteAndStats();
        } else {
            renderCurrentQuestion();
        }
    });

    document.getElementById("clearResponseBtn")?.addEventListener("click", () => {
        userAnswers1[currentQuestionIndex1] = null;
        updatePaletteAndStats();
        renderCurrentQuestion();
    });
}

// =============================== INITIALISATION ===============================
function initExam() {
  
    updatePaletteAndStats();
    startTotalTimer();
}



function loadCSS(href) {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

const obyoQF = `<div id="1by1Q" class="exam-container" style="display: none;">
    <div class="exam-header">
        <div class="title-row">
                <div class="main-title"> TCS Part A: Foundation Section - 1</div><span><button onclick='share("1by1Q")'>⤴️</button></span><div class="profile-icon" id="profileIcon"><span>👤</span></div>
               
          
          
            <div class="right-header"> <div id="google_translate_element2"></div>
                <div class="control-group" id="answerToggleGroup">
                    <label>
                        <input type="checkbox" id="showAnswerToggle1"> 💡 Show Answer on Select
                    </label>
                </div>
                <div class="control-group" id="timerToggleGroup">
                    <label>
                        <input type="checkbox" id="examTimerToggle" checked> ⏱️ Timer On/Off
                    </label>
                </div>
                <div class="timer-section" id="timerDisplay">
                    <span>⏱️ Total</span> <span id="timerValue" translate="no">45:00</span><span id="timerBox">
                </div>
                
            </div>
        </div>
       </span><span class="section-nav" id="tabbox"></span>
    </div>
    <div class="two-columns">
        <div class="question-area" id="questionArea"></div>
        <div class="palette-area" id="paletteArea"></div>
    </div>
</div>`;

function onebyone(showAnswer1, timerEnabled1, prelang) {
    document.getElementById("QF").innerHTML = obyoQF;
      renderCurrentQuestion();
     loadCSS("/CSS/style1.css");
   

  
    document.getElementById("showAnswerToggle1").checked = showAnswer1;
    document.getElementById("examTimerToggle").checked = timerEnabled1;
  
 
    
  

    initExam();


   if(tab==="true"){   createTabs();
      
    }
  if (!timerEnabled1) {
        stopTotalTimer();
        stopQuestionTimerAndSave();
    }

    if (prelang) {
        changeLang(prelang);
    }

        document.getElementById('1by1Q').style.display = 'flex';
    console.log('Rendering completed. Total questions: ' + totalQuestions);
}





















// Event listeners for toggles (must be attached after the DOM is ready)





































document.addEventListener("DOMContentLoaded", () => {
    const showToggle = document.getElementById("showAnswerToggle1");
    const timerToggle = document.getElementById("examTimerToggle");

    if (showToggle) {
        showToggle.addEventListener("change", (e) => {
            showAnswerOnSelect1 = e.target.checked;
            renderCurrentQuestion();
        });
    }

    if (timerToggle) {
        timerToggle.addEventListener("change", (e) => {
            timerEnabled1 = e.target.checked;
            if (timerEnabled1 && !examSubmitted1) {
                startTotalTimer();
                startQuestionTimerForCurrent();
            } else {
                stopTotalTimer();
                stopQuestionTimerAndSave();
            }
            renderCurrentQuestion();
        });
    }

    const profileIcon = document.getElementById("profileIcon");
    if (profileIcon) {
        profileIcon.addEventListener("click", () => {
            let answered = userAnswers1.filter(a => a !== null).length;
            let totalTime = questionTimeSpent1.reduce((a,b) => a+b, 0);
            alert(`👤 Candidate Profile\n✅ Answered: ${answered}/${totalQuestions}\n⏱️ Total Time: ${formatSeconds(totalTime)}\n⏱️ Remaining: ${formatTime(totalSeconds1)}`);
        });
    }
});

// Make onebyone globally available
window.onebyone = onebyone;