class Student {
    constructor() {
        this.info = {
            name: null,
            class: null,
            school: null,
            timestamp: null
        };
    }

    validateName(name) {
        if (!name || name.trim() === '') {
            throw new Error("الرجاء إدخال اسم الطالب");
        }
        
        // Check for at least 2 Arabic words (first name and last name)
        if (!/^[\u0600-\u06FF\s]{2,}(?:\s+[\u0600-\u06FF\s]{2,})+$/.test(name)) {
            throw new Error("الرجاء إدخال الاسم الكامل للطالب (اسم واسم عائلة على الأقل)");
        }
        
        return name.trim();
    }

    validateClass(className) {
        if (!className || className.trim() === '') {
            throw new Error("الرجاء إدخال الصف الدراسي");
        }
        
        // Check for common class formats like "الصف الأول" or "1ث"
        if (!/^[\u0600-\u06FF0-9\s\-]+$/.test(className)) {
            throw new Error("الرجاء إدخال صف دراسي صحيح");
        }
        
        return className.trim();
    }

    setInfo(name, className, school) {
        try {
            const validatedName = this.validateName(name);
            const validatedClass = this.validateClass(className);
            
            this.info = {
                name: validatedName,
                class: validatedClass,
                school: school,
                timestamp: new Date().toISOString()
            };
            
            // Clear any previous validation errors
            $("#studentName, #studentClass").removeClass("is-invalid");
            
            return true;
        } catch (error) {
            // Determine which field caused the error
            if (error.message.includes("اسم الطالب")) {
                $("#studentName").addClass("is-invalid").next(".invalid-feedback").text(error.message);
            } else if (error.message.includes("الصف الدراسي")) {
                $("#studentClass").addClass("is-invalid").next(".invalid-feedback").text(error.message);
            } else {
                alert(error.message);
            }
            
            return false;
        }
    }

    getInfo() {
        return this.info;
    }
}