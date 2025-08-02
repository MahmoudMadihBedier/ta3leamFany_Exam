class School {
    constructor() {
        this.currentSchool = null;
        this.attempts = 0;
    }

    validateCode(code) {
        // Check if code is empty
        if (!code || code.trim() === '') {
            throw new Error("الرجاء إدخال الرمز السري");
        }
        
        // Check if code is numeric
        if (!/^\d+$/.test(code)) {
            throw new Error("يجب أن يتكون الرمز السري من أرقام فقط");
        }
        
        // Check if code exists
        const schoolName = SCHOOL_CODES[code];
        if (!schoolName) {
            this.attempts++;
            const remainingAttempts = EXAM_CONFIG.maxLoginAttempts - this.attempts;
            
            if (remainingAttempts > 0) {
                throw new Error(`الرمز السري غير صحيح. لديك ${remainingAttempts} محاولات متبقية`);
            } else {
                throw new Error("لقد تجاوزت الحد الأقصى من المحاولات. الرجاء المحاولة لاحقاً");
            }
        }
        
        return schoolName;
    }

    setCurrentSchool(code) {
        try {
            const schoolName = this.validateCode(code);
            this.currentSchool = {
                code: code,
                name: schoolName
            };
            this.attempts = 0; // Reset attempts on successful login
            return true;
        } catch (error) {
            // Update attempts feedback
            if (error.message.includes("الرمز السري غير صحيح")) {
                $("#attemptsFeedback").text(error.message);
            } else {
                $("#attemptsFeedback").text("");
            }
            
            // Add invalid class to input
            $("#schoolCode").addClass("is-invalid");
            
            // Show error message
            const feedbackElement = $("#schoolCode").next(".invalid-feedback");
            feedbackElement.text(error.message);
            
            return false;
        }
    }

    getCurrentSchool() {
        return this.currentSchool;
    }

    getRemainingAttempts() {
        return EXAM_CONFIG.maxLoginAttempts - this.attempts;
    }
}