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
}