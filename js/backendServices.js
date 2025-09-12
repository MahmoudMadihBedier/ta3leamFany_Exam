class BackendService {
    constructor() {
        this.baseUrl = SHEETS_CONFIG.scriptUrl;
        this.pendingSubmissionsKey = 'pendingExamSubmissions';
    }

    async submitExamData(data) {
        try {
            const uniqueUrl = `${this.baseUrl}?nocache=${Date.now()}`;
            const response = await fetch(uniqueUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            if (result.status === 'error') throw new Error(result.message);
            
            return result;
        } catch (error) {
            this.storeLocalSubmission(data);
            throw error;
        }
    }

    storeLocalSubmission(data) {
        try {
            const pending = this.getPendingSubmissions();
            pending.push(data);
            localStorage.setItem(this.pendingSubmissionsKey, JSON.stringify(pending));
        } catch (e) {
            console.error('Local storage error:', e);
        }
    }

    getPendingSubmissions() {
        return JSON.parse(localStorage.getItem(this.pendingSubmissionsKey) || []);
    }

    async retryPendingSubmissions() {
        const pending = this.getPendingSubmissions();
        if (pending.length === 0) return;

        const successful = [];
        const failed = [];

        for (const submission of pending) {
            try {
                await this.submitExamData(submission);
                successful.push(submission);
            } catch (error) {
                failed.push(submission);
            }
        }

        localStorage.setItem(this.pendingSubmissionsKey, JSON.stringify(failed));
        return { successful, failed };
    }

    // NEW: fetch results from server (GET action=getResults)
    async fetchResults() {
        if (!this.baseUrl) throw new Error('No script URL configured');
        const url = `${this.baseUrl}?action=getResults&nocache=${Date.now()}`;
        const resp = await fetch(url, { method: 'GET', mode: 'cors' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (!json || json.status !== 'success' || !Array.isArray(json.results)) {
            throw new Error('Invalid results response');
        }
        return json.results;
    }

    // NEW: attempt to resend pending exam submissions stored locally
    async syncPendingSubmissions() {
        const pending = this.getPendingSubmissions();
        if (!pending.length) return { successful: 0, failed: 0 };
        let successful = 0, failed = 0;
        for (const sub of pending.slice()) {
            try {
                const body = new URLSearchParams({ data: JSON.stringify(sub) }).toString();
                const resp = await fetch(this.baseUrl + `?nocache=${Date.now()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body,
                    mode: 'cors'
                });
                const text = await resp.text();
                const json = text ? JSON.parse(text) : null;
                if (json && json.status === 'success') {
                    successful++;
                    // remove this item from pending
                    const list = this.getPendingSubmissions();
                    const idx = list.findIndex(p => JSON.stringify(p) === JSON.stringify(sub));
                    if (idx !== -1) {
                        list.splice(idx, 1);
                        localStorage.setItem(this.pendingSubmissionsKey, JSON.stringify(list));
                    }
                } else {
                    failed++;
                }
            } catch (e) {
                failed++;
            }
        }
        return { successful, failed };
    }
}