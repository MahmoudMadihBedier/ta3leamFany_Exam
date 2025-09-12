class AdminPanel {
    constructor() {
        this.storageKey = 'savedExamQuestions'; // legacy localStorage key (kept for compatibility)
        this.db = window.__QuestionsDB;
        this.init(); // init will handle async steps
    }

    async init() {
        await this.db.init();
        this.populateSubjectOptions();
        this.bindEvents();
        await this.loadAndRender();
        this.toggleOptionsVisibility();
    }

    populateSubjectOptions() {
        const select = $('#qSubject');
        select.empty();
        for (const key of Object.keys(SUBJECTS)) {
            const val = SUBJECTS[key];
            select.append(`<option value="${val}">${val}</option>`);
        }
    }

    bindEvents() {
        $('#qType').on('change', () => this.toggleOptionsVisibility());
        $('#addQuestionBtn').on('click', () => this.handleAddQuestion());
        $('#exportConfigBtn').on('click', () => this.exportConfigJS());
        $('#backToLoginFromAdmin').on('click', () => {
            $('.section-with-logo').addClass('d-none');
            $('#loginSection').removeClass('d-none');
        });

        // delegate edit/delete clicks
        $(document).on('click', '.delete-question', async (e) => {
            const id = Number($(e.currentTarget).data('id'));
            if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
            await this.db.delete(id);
            // remove from runtime EXAM_QUESTIONS
            const idx = EXAM_QUESTIONS.findIndex(q => q.id === id);
            if (idx !== -1) EXAM_QUESTIONS.splice(idx, 1);
            await this.loadAndRender();
        });

        $(document).on('click', '.edit-question', async (e) => {
            const id = Number($(e.currentTarget).data('id'));
            const all = await this.db.getAll();
            const q = all.find(x => x.id === id);
            if (!q) return alert('السؤال غير موجود في قاعدة البيانات');
            // simple prompt-based edit (text/options/correct)
            const newText = prompt('نص السؤال:', q.question);
            if (newText === null) return;
            q.question = newText.trim();
            if (q.type !== 'true_false') {
                const newOptions = prompt('الخيارات مفصولة بفاصلة:', (q.options || []).join(','));
                if (newOptions === null) return;
                q.options = newOptions.split(',').map(s => s.trim()).filter(Boolean);
                const newCorrect = prompt('فهرس الإجابة الصحيحة (0-based):', String(q.correctAnswer));
                if (newCorrect === null) return;
                q.correctAnswer = Number(newCorrect);
            } else {
                const newCorrect = prompt('الإجابة الصحيحة (true/false):', String(q.correctAnswer));
                if (newCorrect === null) return;
                q.correctAnswer = (/^true$/i.test(newCorrect));
            }
            await this.db.update(q);
            // update runtime copy
            const idx = EXAM_QUESTIONS.findIndex(x => x.id === q.id);
            if (idx !== -1) EXAM_QUESTIONS[idx] = q;
            else EXAM_QUESTIONS.push(q);
            await this.loadAndRender();
        });
    }

    toggleOptionsVisibility() {
        const type = $('#qType').val();
        if (type === 'true_false') {
            $('#optionsContainer').hide();
            $('#qOptions').val('');
            $('#qCorrect').attr('placeholder', 'true أو false');
        } else {
            $('#optionsContainer').show();
            $('#qCorrect').attr('placeholder', 'مثال: 0 (فهرس الإجابة الصحيحة)');
        }
    }

    async handleAddQuestion() {
        const type = $('#qType').val();
        const subject = $('#qSubject').val();
        const questionText = $('#qText').val().trim();
        const optionsRaw = $('#qOptions').val().trim();
        const correctRaw = $('#qCorrect').val().trim();

        if (!questionText) {
            alert('يرجى إدخال نص السؤال');
            return;
        }

        let options = undefined;
        let correctAnswer = undefined;

        if (type === 'true_false') {
            if (!/^(true|false)$/i.test(correctRaw)) {
                alert('للأسئلة صح/خطأ، الإجابة الصحيحة يجب أن تكون true أو false');
                return;
            }
            correctAnswer = (/^true$/i.test(correctRaw));
        } else {
            if (!optionsRaw) {
                alert('يرجى إدخال الخيارات مفصولة بفاصلة');
                return;
            }
            options = optionsRaw.split(',').map(s => s.trim()).filter(Boolean);
            if (!/^\d+$/.test(correctRaw)) {
                alert('الإجابة الصحيحة يجب أن تكون فهرس رقمي (مثال: 0)');
                return;
            }
            correctAnswer = Number(correctRaw);
            if (correctAnswer < 0 || correctAnswer >= options.length) {
                alert('فهرس الإجابة الصحيحة خارج نطاق الخيارات');
                return;
            }
        }

        // generate id (ensure no collision with existing IDs)
        const existingIds = EXAM_QUESTIONS.map(q => Number(q.id || 0));
        const maxId = existingIds.length ? Math.max(...existingIds) : 0;
        const newId = Math.max(Date.now(), maxId + 1);

        const newQuestion = {
            id: newId,
            type,
            subject,
            question: questionText,
            options: options,
            correctAnswer
        };

        // Try to persist to Google Sheets via Apps Script first
        try {
            const payload = { action: 'addQuestion', question: newQuestion };
            const body = new URLSearchParams({ data: JSON.stringify(payload) }).toString();
            const resp = await fetch(`${SHEETS_CONFIG.scriptUrl}?nocache=${Date.now()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body,
                mode: 'cors'
            });
            const txt = await resp.text();
            let json = null;
            try { json = txt ? JSON.parse(txt) : null; } catch (e) { json = null; }
            if (!json || json.status !== 'success') {
                throw new Error((json && json.message) ? json.message : 'فشل حفظ السؤال على الخادم');
            }
            // on success persist to IndexedDB and runtime EXAM_QUESTIONS
            await this.db.add(newQuestion);
            if (!EXAM_QUESTIONS.some(q => q.id === newQuestion.id)) EXAM_QUESTIONS.push(newQuestion);

            this.clearForm();
            await this.loadAndRender();
            alert('تم إضافة السؤال وحفظه في Google Sheets بنجاح');
        } catch (err) {
            // fallback: persist to IndexedDB only
            console.warn('Sync to server failed, saving locally:', err);
            await this.db.add(newQuestion);
            if (!EXAM_QUESTIONS.some(q => q.id === newQuestion.id)) EXAM_QUESTIONS.push(newQuestion);
            this.clearForm();
            await this.loadAndRender();
            alert('تم إضافة السؤال محلياً (تعذر الاتصال بالخادم). سيحاول النظام المزامنة لاحقاً.');
        }
    }

    async loadAndRender() {
        // load DB questions and merge into runtime (avoid duplicates)
        const dbQuestions = await this.db.getAll();
        dbQuestions.forEach(q => {
            if (!EXAM_QUESTIONS.some(existing => existing.id === q.id)) {
                EXAM_QUESTIONS.push(q);
            } else {
                // replace runtime question with DB version if IDs match
                const idx = EXAM_QUESTIONS.findIndex(x => x.id === q.id);
                if (idx !== -1) EXAM_QUESTIONS[idx] = q;
            }
        });

        return this.renderList();
    }

    async renderList() {
        const list = $('#adminQuestionsList');
        list.empty();

        // Show built-in questions first (readonly), then DB questions (editable)
        const dbQuestions = await this.db.getAll();
        const builtin = EXAM_QUESTIONS.filter(q => !dbQuestions.some(d => d.id === q.id))
            .slice().sort((a,b)=>a.id-b.id);
        const dbSorted = dbQuestions.slice().sort((a,b)=>a.id-b.id);

        if (builtin.length) {
            list.append('<div class="list-group-item active">أسئلة النظام (غير قابلة للحذف)</div>');
            builtin.forEach(q => {
                const label = `#${q.id} [${q.subject}] (${q.type}) - ${q.question}`;
                const item = $(`<div class="list-group-item flex-column align-items-start"></div>`);
                item.append(`<div class="d-flex w-100 justify-content-between"><h6 class="mb-1">${label}</h6><small>id:${q.id}</small></div>`);
                if (q.options) item.append(`<p class="mb-1 small">خيارات: ${q.options.join(' | ')}</p>`);
                item.append(`<small class="text-muted">الإجابة الصحيحة: ${q.correctAnswer}</small>`);
                list.append(item);
            });
        }

        if (dbSorted.length) {
            list.append('<div class="list-group-item active mt-2">أسئلة المشرف (قابلة للتحرير/الحذف)</div>');
            dbSorted.forEach(q => {
                const label = `#${q.id} [${q.subject}] (${q.type}) - ${q.question}`;
                const item = $(`<div class="list-group-item flex-column align-items-start d-flex justify-content-between"></div>`);
                const left = $(`<div></div>`);
                left.append(`<div class="d-flex w-100 justify-content-between"><h6 class="mb-1">${label}</h6><small>id:${q.id}</small></div>`);
                if (q.options) left.append(`<p class="mb-1 small">خيارات: ${q.options.join(' | ')}</p>`);
                left.append(`<small class="text-muted">الإجابة الصحيحة: ${q.correctAnswer}</small>`);
                const actions = $(`
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary edit-question" data-id="${q.id}">تعديل</button>
                        <button class="btn btn-outline-danger delete-question" data-id="${q.id}">حذف</button>
                    </div>
                `);
                item.append(left).append(actions);
                list.append(item);
            });
        } else {
            list.append('<div class="list-group-item text-muted">لا توجد أسئلة مدخلة من المشرف</div>');
        }
    }

    clearForm() {
        $('#qText').val('');
        $('#qOptions').val('');
        $('#qCorrect').val('');
    }

    exportConfigJS() {
        // build a minimal config export that replaces EXAM_QUESTIONS
        const data = `// Exported EXAM_QUESTIONS (replace the EXAM_QUESTIONS array in js/config.js)\n\nconst EXAM_QUESTIONS = ${JSON.stringify(EXAM_QUESTIONS, null, 2)};`;
        const blob = new Blob([data], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'EXAM_QUESTIONS_export.js';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}

// initialize admin panel when adminSection is shown
$(document).ready(() => {
    // ensure DB is initialized before creating AdminPanel
    window.__QuestionsDB.init().then(() => {
        window.__adminPanel = new AdminPanel();
    }).catch(err => {
        console.error('IndexedDB init error:', err);
        // fallback: still create AdminPanel (it will attempt to init)
        window.__adminPanel = new AdminPanel();
    });
});