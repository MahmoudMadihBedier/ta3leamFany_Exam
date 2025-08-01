class Student {
    constructor() {
        this.info = {
            name: null,
            class: null,
            school: null,
            timestamp: null
        };
    }

    setInfo(name, className, school) {
        this.info = {
            name: name.trim(),
            class: className.trim(),
            school: school,
            timestamp: new Date().toISOString()
        };
    }

    getInfo() {
        return this.info;
    }
}