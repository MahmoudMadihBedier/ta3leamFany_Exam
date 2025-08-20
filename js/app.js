class ExamSystem {
    constructor() {
        this.school = new School();
        this.student = new Student();
        this.exam = null;
        
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

    startExam() {
        this.exam = new Exam();
        this.switchSection("#studentInfoSection", "#examSection");
        this.exam.start();
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
    Percentage: score.percentage.toFixed(2),
    Status: score.passed ? "ناجح" : "راسب",
    Answers: this.exam.answers.map(a => 
      `${a.question}: ${a.answer} (${a.isCorrect ? 'صحيح' : 'خطأ'})`
    ).join(" | ")
  };

  try {
    // Create a unique URL to prevent caching
    const uniqueUrl = `${SHEETS_CONFIG.scriptUrl}?nocache=${Date.now()}`;
    
    const response = await fetch(uniqueUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      throw new Error(data.message || 'Error saving data');
    }

    console.log('Success:', data);
    this.showResults(submissionData, score);
    
  } catch (error) {
    console.error('Submission Error:', error);
    
    // Show user-friendly error message
    const errorMessage = `
      <div class="alert alert-danger mt-3">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        تعذر إرسال النتائج: ${error.message || 'حدث خطأ غير متوقع'}
        <br><small>سيتم حفظ النتائج محلياً وسيتم إرسالها عند اتصال الإنترنت</small>
      </div>
    `;
    
    // Store data locally for later submission
    this.storeLocalSubmission(submissionData);
    
    // Show results anyway with warning
    this.showResults(submissionData, score);
    $("#resultDetails").after(errorMessage);
  } finally {
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
}

// Initialize the application when DOM is ready
$(document).ready(() => {
    new ExamSystem();
});