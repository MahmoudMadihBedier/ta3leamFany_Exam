class Exam {
    constructor() {
        this.questions = EXAM_QUESTIONS;
        this.answers = [];
        this.timeLeft = EXAM_CONFIG.duration;
        this.timerInterval = null;
    }

    start() {
        this.renderQuestions();
        this.startTimer();
    }

    renderQuestions() {
        const questionsContainer = $("#questionsContainer");
        questionsContainer.empty();
        
        this.questions.forEach((question, index) => {
            questionsContainer.append(this.createQuestionHtml(question, index));
        });
    }

    createQuestionHtml(question, index) {
        let html = `
            <div class="question-card">
                <h5>السؤال ${index + 1}: ${question.question}</h5>
        `;
        
        if (question.type === "multiple_choice" || question.type === "choose_from_list") {
            question.options.forEach((option, i) => {
                html += `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="q${index}" id="q${index}_o${i}" value="${i}">
                        <label class="form-check-label" for="q${index}_o${i}">
                            ${option}
                        </label>
                    </div>
                `;
            });
        } else if (question.type === "true_false") {
            html += `
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" id="q${index}_true" value="true">
                    <label class="form-check-label" for="q${index}_true">
                        صحيح
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" id="q${index}_false" value="false">
                    <label class="form-check-label" for="q${index}_false">
                        خطأ
                    </label>
                </div>
            `;
        }
        
        html += `</div>`;
        return html;
    }

    startTimer() {
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        $("#timer").text(`الوقت المتبقي: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }

    collectAnswers() {
        this.answers = [];
        
        this.questions.forEach((question, index) => {
            const selectedOption = $(`input[name="q${index}"]:checked`).val();
            this.answers.push({
                question: question.question,
                answer: selectedOption !== undefined ? selectedOption : "لم يتم الإجابة",
                correctAnswer: question.correctAnswer,
                isCorrect: selectedOption == question.correctAnswer
            });
        });
        
        clearInterval(this.timerInterval);
    }

    calculateScore() {
        const correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
        return {
            score: correctAnswers,
            total: this.answers.length,
            percentage: (correctAnswers / this.answers.length) * 100,
            passed: (correctAnswers / this.answers.length) >= EXAM_CONFIG.passingScore
        };
    }

    finish() {
        this.collectAnswers();
        return this.calculateScore();
    }
}