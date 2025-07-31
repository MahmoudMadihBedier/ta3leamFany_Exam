class ExamSystem {
    constructor() {
        this.school = new School();
        this.student = new Student();
        this.exam = new Exam();
        
        this.initEvents();
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

    handleLogin() {
        const code = $("#schoolCode").val().trim();
        
        if (this.school.setCurrentSchool(code)) {
            $("#schoolNameDisplay").val(this.school.getCurrentSchool().name);
            $("#loginSection").addClass("hidden");
            $("#studentInfoSection").removeClass("hidden");
        } else {
            alert("الرمز السري غير صحيح. الرجاء المحاولة مرة أخرى.");
        }
    }

    handleStudentInfo() {
        const name = $("#studentName").val();
        const className = $("#studentClass").val();
        const school = this.school.getCurrentSchool().name;
        
        this.student.setInfo(name, className, school);
        this.startExam();
    }

    startExam() {
        $("#studentInfoSection").addClass("hidden");
        $("#examSection").removeClass("hidden");
        this.exam.start();
    }

    handleExamSubmission() {
        const score = this.exam.finish();
        this.submitExamData(score);
    }

    submitExamData(score) {
        // Prepare data for submission
        const studentInfo = this.student.getInfo();
        const submissionData = {
            studentName: studentInfo.name,
            studentClass: studentInfo.class,
            schoolName: studentInfo.school,
            timestamp: studentInfo.timestamp,
            answers: this.exam.answers.map(answer => answer.answer).join(" | "),
            score: `${score.score}/${score.total}`,
            percentage: score.percentage.toFixed(2),
            passed: score.passed ? "ناجح" : "راسب"
        };

        // In a real app, you would send this to Google Sheets here
        console.log("Data ready for submission:", submissionData);
        this.showResults(submissionData);
    }

    showResults(data) {
        $("#examSection").addClass("hidden");
        $("#resultsSection").removeClass("hidden");
        $("#resultStudentName").text(data.studentName);
    }

    updateProgressBar() {
        const answered = $("input[type='radio']:checked").length;
        const total = this.exam.questions.length;
        const percentage = (answered / total) * 100;
        $("#progressBar").css("width", percentage + "%");
        
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