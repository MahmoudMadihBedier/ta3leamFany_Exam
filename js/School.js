class School {
    constructor() {
        this.currentSchool = null;
    }

    validateCode(code) {
        return SCHOOL_CODES[code] || null;
    }

    setCurrentSchool(code) {
        const schoolName = this.validateCode(code);
        if (schoolName) {
            this.currentSchool = {
                code: code,
                name: schoolName
            };
            return true;
        }
        return false;
    }

    getCurrentSchool() {
        return this.currentSchool;
    }
}