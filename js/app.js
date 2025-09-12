class ExamSystem {
    constructor() {
        this.school = new School();
        this.student = new Student();
        this.exam = null;

        // ensure QuestionsDB is initialized and then load DB questions into runtime
        if (window.__QuestionsDB) {
            window.__QuestionsDB.init()
                .then(() => this.loadSavedQuestions())
                .catch(e => {
                    console.warn('QuestionsDB init failed, falling back to localStorage:', e);
                    this.loadSavedQuestions(); // legacy fallback reads localStorage
                });
        } else {
            // legacy: load from localStorage
            this.loadSavedQuestions();
        }

        this.initEvents();
        this.initFormValidation();
    }

    initEvents() {
        // Login form submission
        $("#loginForm").submit((e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Student info form submission
        $("#studentForm").submit((e) => {
            e.preventDefault();
            this.handleStudentInfo();
        });

        // Exam form submission
        $("#examForm").submit((e) => {
            e.preventDefault();
            this.handleExamSubmission();
        });

        // Restart exam button
        $("#restartExam").click(() => {
            location.reload();
        });

        // Update progress bar when an answer is selected
        $(document).on("change", "input[type='radio']", () => {
            this.updateProgressBar();
        });
    }

    initFormValidation() {
        // Add Bootstrap validation to forms
        $("form").on("submit", function(e) {
            if (this.checkValidity() === false) {
                e.preventDefault();
                e.stopPropagation();
            }
            $(this).addClass("was-validated");
        });
        
        // Clear validation on input
        $("input").on("input", function() {
            $(this).removeClass("is-invalid");
        });
    }

    handleLogin() {
        const code = $("#schoolCode").val().trim();
        
        // Admin shortcut: go to admin panel
        if (code === ADMIN_CODE) {
            this.switchSection("#loginSection", "#adminSection");
            return;
        }
        
        if (this.school.setCurrentSchool(code)) {
            $("#schoolNameDisplay").val(this.school.getCurrentSchool().name);
            this.switchSection("#loginSection", "#studentInfoSection");
        }
    }

    handleStudentInfo() {
        const name = $("#studentName").val();
        const className = $("#studentClass").val();
        const school = this.school.getCurrentSchool().name;
        
        if (this.student.setInfo(name, className, school)) {
            this.startExam();
        }
    }

    async startExam() {
        // attempt to fetch latest admin questions from server and merge
        await this.fetchQuestionsFromServer();

        this.exam = new Exam();
        this.switchSection("#studentInfoSection", "#examSection");
        this.exam.start();
    }

    // Fetch questions from Apps Script (server) and merge into EXAM_QUESTIONS
    async fetchQuestionsFromServer() {
        if (!SHEETS_CONFIG || !SHEETS_CONFIG.scriptUrl) return;
        try {
            const url = `${SHEETS_CONFIG.scriptUrl}?action=getQuestions&nocache=${Date.now()}`;
            const resp = await fetch(url, { method: 'GET', mode: 'cors' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            if (json && json.status === 'success' && Array.isArray(json.questions)) {
                const serverQs = json.questions.map(q => {
                    return {
                        id: Number(q.id) || Date.now(),
                        type: q.type || 'multiple_choice',
                        subject: q.subject || Object.values(SUBJECTS)[0],
                        question: q.question || '',
                        options: q.options || null,
                        correctAnswer: (typeof q.correctAnswer === 'string' && q.correctAnswer.match(/^(true|false)$/i)) ? (/^true$/i.test(q.correctAnswer)) : (isNaN(Number(q.correctAnswer)) ? q.correctAnswer : Number(q.correctAnswer))
                    };
                });
                // Merge: replace or add
                serverQs.forEach(sq => {
                    const idx = EXAM_QUESTIONS.findIndex(x => x.id === sq.id);
                    if (idx !== -1) {
                        EXAM_QUESTIONS[idx] = sq;
                    } else {
                        EXAM_QUESTIONS.push(sq);
                    }
                    // also persist to IndexedDB for offline access
                    if (window.__QuestionsDB && window.__QuestionsDB.db) {
                        window.__QuestionsDB.add(sq).catch(()=>{/* ignore duplicates/errors */});
                    }
                });
                console.info('Merged', serverQs.length, 'questions from server');
            }
        } catch (err) {
            console.warn('Failed to fetch questions from server, using local DB:', err);
            // fallback: QuestionsDB load is already handled at ctor -> nothing to do
        }
    }

    handleExamSubmission() {
        const score = this.exam.finish();
        if (score) {
            this.submitExamData(score);
        }
    }

async submitExamData(score) {
  const submitBtn = $("#examForm button[type='submit']");
  submitBtn.prop("disabled", true).html(
    `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> جاري الإرسال...`
  );

  const studentInfo = this.student.getInfo();
  const submissionData = {
    Timestamp: new Date().toISOString(),
    School: studentInfo.school,
    "Student Name": studentInfo.name,
    Class: studentInfo.class,
    Score: `${score.score}/${score.total}`,
    Percentage: Number(score.percentage).toFixed(2),
    Status: score.passed ? "ناجح" : "راسب",
    Answers: this.exam.answers.map(a =>
      `${a.question}: ${a.answer} (${a.isCorrect ? 'صحيح' : 'خطأ'})`
    ).join(" | ")
  };

  console.debug("Prepared submissionData:", submissionData);

  // Prepare timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SHEETS_CONFIG.timeout || 10000);

  try {
    const uniqueUrl = `${SHEETS_CONFIG.scriptUrl}?nocache=${Date.now()}`;

    // Many GAS endpoints expect URL-encoded form params (e.parameter.data).
    const body = new URLSearchParams({ data: JSON.stringify(submissionData) }).toString();

    const response = await fetch(uniqueUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json'
      },
      body,
      signal: controller.signal,
      mode: 'cors'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.warn("Response is not valid JSON:", text);
      data = null;
    }

    if (!data) {
      throw new Error('Empty or invalid response from server');
    }

    if (data.status === 'error') {
      throw new Error(data.message || 'Error saving data');
    }

    console.log('Submission success:', data);
    this.showResults(submissionData, score);

  } catch (error) {
    console.error('Submission Error:', error);

    const errorMessage = `
      <div class="alert alert-danger mt-3">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        تعذر إرسال النتائج: ${error.message || 'حدث خطأ غير متوقع'}
        <br><small>سيتم حفظ النتائج محلياً وسيتم إرسالها عند اتصال الإنترنت</small>
      </div>
    `;

    this.storeLocalSubmission(submissionData);
    this.showResults(submissionData, score);
    $("#resultDetails").after(errorMessage);

  } finally {
    clearTimeout(timeoutId);
    submitBtn.prop("disabled", false).html(
      `إنهاء الاختبار <i class="fas fa-check-circle mr-2"></i>`
    );
  }
}
storeLocalSubmission(data) {
  try {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingExamSubmissions') || '[]');
    pendingSubmissions.push(data);
    localStorage.setItem('pendingExamSubmissions', JSON.stringify(pendingSubmissions));
  } catch (e) {
    console.error('Error storing submission locally:', e);
  }
}

    showResults(data, score) {
        // Update result details
        $("#resultStudentName").text(data["Student Name"]);
        $("#resultSchool").text(data.School);
        $("#resultClass").text(data.Class);
        $("#resultScore").text(data.Score);
        $("#resultPercentage").text(data.Percentage + "%");
        $("#resultStatus").text(data.Status);
        
        // Add pass/fail class
        const statusElement = $("#resultStatus");
        if (score.passed) {
            statusElement.addClass("text-success").removeClass("text-danger");
        } else {
            statusElement.addClass("text-danger").removeClass("text-success");
        }
        
        this.switchSection("#examSection", "#resultsSection");
    }

    switchSection(hideSelector, showSelector) {
        $(hideSelector).addClass("d-none");
        $(showSelector).removeClass("d-none");
        
        // Scroll to top of new section
        $("html, body").animate({
            scrollTop: $(showSelector).offset().top
        }, 500);
    }

    updateProgressBar() {
        const answered = $("input[type='radio']:checked").length;
        const total = this.exam.questions.length;
        const percentage = (answered / total) * 100;
        $("#progressBar").css("width", percentage + "%");
        
        // Hide warning if all questions are answered
        if (answered === total) {
            $("#unansweredWarning").addClass("d-none");
        }
        
        // Change color based on progress
        if (percentage < 30) {
            $("#progressBar").removeClass("bg-success bg-warning").addClass("bg-danger");
        } else if (percentage < 70) {
            $("#progressBar").removeClass("bg-success bg-danger").addClass("bg-warning");
        } else {
            $("#progressBar").removeClass("bg-warning bg-danger").addClass("bg-success");
        }
    }

    // Load saved questions from IndexedDB (added via admin panel) and merge into runtime questions
    async loadSavedQuestions() {
        try {
            if (window.__QuestionsDB && window.__QuestionsDB.db) {
                const saved = await window.__QuestionsDB.getAll();
                if (Array.isArray(saved) && saved.length > 0) {
                    saved.forEach(q => {
                        if (!EXAM_QUESTIONS.some(existing => existing.id === q.id)) {
                            EXAM_QUESTIONS.push(q);
                        } else {
                            // replace runtime item with DB version
                            const idx = EXAM_QUESTIONS.findIndex(x => x.id === q.id);
                            if (idx !== -1) EXAM_QUESTIONS[idx] = q;
                        }
                    });
                    console.info('Loaded saved exam questions from DB:', saved.length);
                }
                return;
            }
        } catch (e) {
            console.warn('Failed to load questions from DB:', e);
        }

        // legacy localStorage fallback
        try {
            const saved = JSON.parse(localStorage.getItem('savedExamQuestions') || 'null');
            if (Array.isArray(saved) && saved.length > 0) {
                saved.forEach(q => {
                    if (!EXAM_QUESTIONS.some(existing => existing.id === q.id)) {
                        EXAM_QUESTIONS.push(q);
                    }
                });
                console.info('Loaded saved exam questions from localStorage:', saved.length);
            }
        } catch (e) {
            console.warn('Failed to load saved questions from localStorage:', e);
        }
    }
}

// Initialize the application when DOM is ready
$(document).ready(() => {
    new ExamSystem();
});