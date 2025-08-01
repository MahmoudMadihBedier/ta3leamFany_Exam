class Exam {
    constructor() {
        this.questions = this.selectRandomQuestions();
        this.answers = [];
        this.timeLeft = EXAM_CONFIG.duration;
        this.timerInterval = null;
        this.warningShown = false;
    }

    selectRandomQuestions() {
        // Make a copy of the original questions array
        const allQuestions = [...EXAM_QUESTIONS];
        const selectedQuestions = [];
        
        // Select questions based on subject weights
        for (const [subject, weight] of Object.entries(EXAM_CONFIG.subjectsWeights)) {
            const subjectQuestions = allQuestions.filter(q => q.subject === subject);
            const count = Math.round(EXAM_CONFIG.maxQuestions * weight);
            
            // Shuffle and select required number of questions
            const shuffled = this.shuffleArray(subjectQuestions);
            selectedQuestions.push(...shuffled.slice(0, count));
        }
        
        // Fill remaining slots with random questions if needed
        if (selectedQuestions.length < EXAM_CONFIG.maxQuestions) {
            const remainingQuestions = allQuestions.filter(q => 
                !selectedQuestions.some(sq => sq.id === q.id)
            );
            const needed = EXAM_CONFIG.maxQuestions - selectedQuestions.length;
            const shuffled = this.shuffleArray(remainingQuestions);
            selectedQuestions.push(...shuffled.slice(0, needed));
        }
        
        return this.shuffleArray(selectedQuestions);
    }

    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
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
            <div class="question-card mb-4 p-3 border rounded" data-question-id="${question.id}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="mb-0">السؤال ${index + 1}: ${question.question}</h5>
                    <span class="badge badge-info">${question.subject}</span>
                </div>
        `;
        
        if (question.type === "multiple_choice" || question.type === "choose_from_list") {
            question.options.forEach((option, i) => {
                html += `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="q${index}" id="q${index}_o${i}" value="${i}">
                        <label class="form-check-label" for="q${index}_o${i}">
                            ${option}
                        </label>
                    </div>
                `;
            });
        } else if (question.type === "true_false") {
            html += `
                <div class="form-check mb-2">
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
            
            // Show warning when time is running out
            if (this.timeLeft <= EXAM_CONFIG.warningTime && !this.warningShown) {
                this.showTimeWarning();
                this.warningShown = true;
            }
            
            if (this.timeLeft <= 0) {
                this.autoSubmitExam();
            }
        }, 1000);
    }

    showTimeWarning() {
        const minutes = Math.ceil(EXAM_CONFIG.warningTime / 60);
        alert(`تحذير: لديك ${minutes} دقائق متبقية فقط لإكمال الاختبار!`);
        $("#timer").addClass("text-danger");
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        $("#timer span").text(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }

    validateExamCompletion() {
        const unanswered = this.questions.length - $("input[type='radio']:checked").length;
        
        if (unanswered > 0) {
            $("#unansweredWarning").removeClass("d-none").text(
                `لديك ${unanswered} أسئلة بدون إجابة. هل أنت متأكد أنك تريد إنهاء الاختبار؟`
            );
            return confirm(`لديك ${unanswered} أسئلة بدون إجابة. هل أنت متأكد أنك تريد إنهاء الاختبار؟`);
        }
        
        return true;
    }

    collectAnswers() {
        this.answers = [];
        
        this.questions.forEach((question, index) => {
            const selectedOption = $(`input[name="q${index}"]:checked`).val();
            
            this.answers.push({
                questionId: question.id,
                question: question.question,
                answer: selectedOption !== undefined ? selectedOption : "لم يتم الإجابة",
                correctAnswer: question.correctAnswer,
                isCorrect: selectedOption == question.correctAnswer,
                subject: question.subject
            });
        });
        
        clearInterval(this.timerInterval);
    }

    calculateScore() {
        const correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
        const totalQuestions = this.answers.length;
        const percentage = (correctAnswers / totalQuestions) * 100;
        
        return {
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage,
            passed: percentage >= (EXAM_CONFIG.passingScore * 100),
            bySubject: this.calculateSubjectScores()
        };
    }

    calculateSubjectScores() {
        const subjectScores = {};
        
        // Initialize subject scores
        for (const subject of Object.values(SUBJECTS)) {
            subjectScores[subject] = {
                correct: 0,
                total: 0
            };
        }
        
        // Calculate scores per subject
        this.answers.forEach(answer => {
            subjectScores[answer.subject].total++;
            if (answer.isCorrect) {
                subjectScores[answer.subject].correct++;
            }
        });
        
        return subjectScores;
    }

    autoSubmitExam() {
        alert("انتهى وقت الاختبار. سيتم تسليم إجاباتك تلقائياً.");
        this.finish();
    }

    finish() {
        if (!this.validateExamCompletion()) {
            return null; // Don't finish if user cancels
        }
        
        this.collectAnswers();
        return this.calculateScore();
    }
}