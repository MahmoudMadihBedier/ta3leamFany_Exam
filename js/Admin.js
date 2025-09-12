class AdminPanel {
    constructor() {
        this.storageKey = 'savedExamQuestions';
        this.db = window.__QuestionsDB;
        this.backend = new BackendService();
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
        $('#syncQuestionsBtn').on('click', () => this.syncLocalQuestionsToServer());
        $('#refreshResultsBtn').on('click', () => this.loadAndRenderResults());
        $('#exportResultsBtn').on('click', () => this.exportResultsCSV());
        $('#resultsSearch').on('input', () => this.filterResults());
        $('#syncLocalSubmissionsBtn').on('click', async () => {
            const res = await this.backend.syncPendingSubmissions();
            alert(`تمت المزامنة: ناجحة ${res.successful}، فاشلة ${res.failed}`);
            // refresh results after syncing
            this.loadAndRenderResults();
        });
        $('#adminLogoutBtn').on('click', () => {
            if (confirm('تسجيل خروج المشرف؟')) {
                sessionStorage.removeItem('isAdmin');
                // go back to login
                $('.section-with-logo').addClass('d-none');
                $('#loginSection').removeClass('d-none');
            }
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

    // NEW: load results from server and render
    async loadAndRenderResults() {
        try {
            const results = await this.backend.fetchResults();
            // normalize and cache in memory
            this._resultsCache = results.map(r => ({
                timestamp: r.Timestamp || r.Timestamp || '',
                school: (r.School || r.school || '').toString(),
                student: (r["Student Name"] || r.student || '').toString(),
                class: (r.Class || r.class || '').toString(),
                score: r.Score || '',
                percentage: Number(r.Percentage || 0),
                status: r.Status || ''
            }));
            this.renderResultsTable(this._resultsCache);
            this.renderAnalytics(this._resultsCache);
            // switch to results tab
            $('#tab-results').tab('show');
        } catch (err) {
            console.error('Failed to load results:', err);
            alert('تعذر جلب النتائج من الخادم. حاول لاحقاً.');
        }
    }

    // New: compute and render simple analytics cards
    renderAnalytics(results) {
        const container = $('#adminAnalytics');
        container.empty();
        if (!results || !results.length) {
            container.append('<div class="text-muted">لا توجد بيانات إحصائية لعرضها</div>');
            return;
        }
        // overall stats
        const total = results.length;
        const avgPercent = (results.reduce((s, r) => s + (Number(r.percentage) || 0), 0) / total) || 0;
        const passed = results.filter(r => String(r.status).includes('ناج')).length;
        const failed = total - passed;

        const perSchool = {};
        results.forEach(r => {
            const key = r.school || 'غير معروف';
            const p = Number(r.percentage) || 0;
            if (!perSchool[key]) perSchool[key] = { count: 0, sum: 0, passed: 0 };
            perSchool[key].count++;
            perSchool[key].sum += p;
            if (String(r.status).includes('ناج')) perSchool[key].passed++;
        });

        // main cards
        const cards = [
            { title: 'إجمالي المحاولات', value: total },
            { title: 'المعدل العام (%)', value: avgPercent.toFixed(1) },
            { title: 'ناجحون', value: passed },
            { title: 'راسبون', value: failed }
        ];

        cards.forEach(c => {
            const card = $(`
              <div class="p-3 mr-2 mb-2 bg-white border rounded" style="min-width:160px">
                <div class="text-muted small">${c.title}</div>
                <div class="font-weight-bold h4">${c.value}</div>
              </div>
            `);
            container.append(card);
        });

        // per-school mini table
        const schoolDiv = $('<div class="w-100 mt-2"><h6>إحصائيات حسب المدرسة</h6></div>');
        const table = $('<table class="table table-sm"><thead><tr><th>المدرسة</th><th>محاولات</th><th>متوسط %</th><th>نسبة النجاح</th></tr></thead><tbody></tbody></table>');
        Object.keys(perSchool).sort().forEach(school => {
            const info = perSchool[school];
            const avg = (info.sum / info.count) || 0;
            const successRate = ((info.passed / info.count) * 100) || 0;
            table.find('tbody').append(`<tr><td>${school}</td><td>${info.count}</td><td>${avg.toFixed(1)}%</td><td>${successRate.toFixed(0)}%</td></tr>`);
        });
        schoolDiv.append(table);
        container.append(schoolDiv);
    }

    filterResults() {
        const q = $('#resultsSearch').val().trim().toLowerCase();
        if (!this._resultsCache) return;
        const filtered = this._resultsCache.filter(r =>
            (r.student || '').toLowerCase().includes(q) ||
            (r.school || '').toLowerCase().includes(q) ||
            (r.class || '').toLowerCase().includes(q)
        );
        this.renderResultsTable(filtered);
    }

    exportResultsCSV() {
        if (!this._resultsCache || !this._resultsCache.length) {
            alert('لا توجد نتائج للتصدير');
            return;
        }
        const rows = [
            ['Timestamp','School','Student Name','Class','Score','Percentage','Status'],
            ...this._resultsCache.map(r => [r.timestamp, r.school, r.student, r.class, r.score, r.percentage, r.status])
        ];
        const csv = rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exam_results_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // NEW: sync local DB questions (created by admin) to server
    async syncLocalQuestionsToServer() {
        const dbQs = await this.db.getAll();
        if (!dbQs.length) {
            alert('لا توجد أسئلة محلية للمزامنة');
            return;
        }
        let success = 0, failed = 0;
        for (const q of dbQs) {
            try {
                const payload = { action: 'addQuestion', question: q };
                const body = new URLSearchParams({ data: JSON.stringify(payload) }).toString();
                const resp = await fetch(`${SHEETS_CONFIG.scriptUrl}?nocache=${Date.now()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body,
                    mode: 'cors'
                });
                const txt = await resp.text();
                const json = txt ? JSON.parse(txt) : null;
                if (json && json.status === 'success') {
                    success++;
                } else {
                    failed++;
                }
            } catch (e) {
                failed++;
            }
        }
        alert(`مزامنة الأسئلة تمت: ناجحة ${success}، فاشلة ${failed}`);
        // reload server questions into runtime
        await this.loadAndRender();
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