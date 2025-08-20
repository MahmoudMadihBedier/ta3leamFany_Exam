// School configuration
const SCHOOL_CODES = {
    "12345": "مدرسة المنوفية الثانوية الصناعية",
    "67890": "مدرسة شبين الكوم الثانوية التجارية",
    "54321": "مدرسة بركة السبع الفنية المتقدمة",
    "13579": "مدرسة تلا الثانوية الزراعية",
    "24680": "مدرسة سرس الليان الفنية بنات"
};

// Subjects configuration
const SUBJECTS = {
    PROGRAMMING: "البرمجة",
    HARDWARE: "مكونات الحاسب",
    NETWORKS: "الشبكات",
    DATABASES: "قواعد البيانات",
    CYBERSECURITY: "الأمن السيبراني"
};

// Exam questions configuration
const EXAM_QUESTIONS = [
    // Programming (5 questions)
    {
        id: 1,
        type: "multiple_choice",
        subject: SUBJECTS.PROGRAMMING,
        question: "أي من اللغات التالية تعتبر لغة برمجة عالية المستوى؟",
        options: ["Assembly", "C++", "Machine Code", "Binary"],
        correctAnswer: 1
    },
    {
        id: 2,
        type: "true_false",
        subject: SUBJECTS.PROGRAMMING,
        question: "لغة Python تُستخدم في الذكاء الاصطناعي وتعلم الآلة.",
        correctAnswer: true
    },
    {
        id: 3,
        type: "choose_from_list",
        subject: SUBJECTS.PROGRAMMING,
        question: "اختر الكلمة المحجوزة في لغة Java:",
        options: ["main", "public", "class", "method"],
        correctAnswer: 2
    },
    {
        id: 4,
        type: "multiple_choice",
        subject: SUBJECTS.PROGRAMMING,
        question: "ما هو ناتج العملية: 7 % 3 ؟",
        options: ["1", "2", "3", "4"],
        correctAnswer: 1
    },
    {
        id: 5,
        type: "true_false",
        subject: SUBJECTS.PROGRAMMING,
        question: "الحلقة for تستخدم للتكرار على عدد محدد من المرات.",
        correctAnswer: true
    },

    // Hardware (5 questions)
    {
        id: 6,
        type: "multiple_choice",
        subject: SUBJECTS.HARDWARE,
        question: "أي من التالي يُعتبر وحدة معالجة مركزية (CPU)؟",
        options: ["Intel Core i7", "NVIDIA RTX 3080", "Samsung SSD", "Corsair RAM"],
        correctAnswer: 0
    },
    {
        id: 7,
        type: "true_false",
        subject: SUBJECTS.HARDWARE,
        question: "القرص الصلب (HDD) أسرع من القرص الصلب من نوع SSD.",
        correctAnswer: false
    },
    {
        id: 8,
        type: "choose_from_list",
        subject: SUBJECTS.HARDWARE,
        question: "اختر الجزء المسؤول عن عرض الصور والفيديو:",
        options: ["CPU", "GPU", "RAM", "PSU"],
        correctAnswer: 1
    },
    {
        id: 9,
        type: "multiple_choice",
        subject: SUBJECTS.HARDWARE,
        question: "أي من التالي وحدة ذاكرة مؤقتة (Cache Memory)؟",
        options: ["L1", "USB", "ROM", "BIOS"],
        correctAnswer: 0
    },
    {
        id: 10,
        type: "true_false",
        subject: SUBJECTS.HARDWARE,
        question: "ذاكرة RAM تُفقد محتوياتها عند إيقاف تشغيل الجهاز.",
        correctAnswer: true
    },

    // Networks (5 questions)
    {
        id: 11,
        type: "multiple_choice",
        subject: SUBJECTS.NETWORKS,
        question: "أي من هذه البروتوكولات يُستخدم لتصفح الإنترنت؟",
        options: ["HTTP", "FTP", "SMTP", "SSH"],
        correctAnswer: 0
    },
    {
        id: 12,
        type: "true_false",
        subject: SUBJECTS.NETWORKS,
        question: "الـ IP Address يُستخدم لتعريف الأجهزة على الشبكة.",
        correctAnswer: true
    },
    {
        id: 13,
        type: "choose_from_list",
        subject: SUBJECTS.NETWORKS,
        question: "اختر الطبقة المسؤولة عن التوجيه (Routing) في نموذج OSI:",
        options: ["Application", "Network", "Transport", "Session"],
        correctAnswer: 1
    },
    {
        id: 14,
        type: "multiple_choice",
        subject: SUBJECTS.NETWORKS,
        question: "ما هو عدد البتات في عنوان IPv4؟",
        options: ["16", "32", "64", "128"],
        correctAnswer: 1
    },
    {
        id: 15,
        type: "true_false",
        subject: SUBJECTS.NETWORKS,
        question: "البروتوكول DNS يُستخدم لتحويل أسماء النطاقات إلى عناوين IP.",
        correctAnswer: true
    },

    // Databases (5 questions)
    {
        id: 16,
        type: "multiple_choice",
        subject: SUBJECTS.DATABASES,
        question: "أي من التالي يُعتبر نظام إدارة قواعد بيانات؟",
        options: ["MySQL", "HTML", "CSS", "TCP"],
        correctAnswer: 0
    },
    {
        id: 17,
        type: "true_false",
        subject: SUBJECTS.DATABASES,
        question: "لغة SQL تُستخدم للتعامل مع قواعد البيانات.",
        correctAnswer: true
    },
    {
        id: 18,
        type: "choose_from_list",
        subject: SUBJECTS.DATABASES,
        question: "اختر نوع العلاقة بين جدول الطلاب وجدول الفصول:",
        options: ["One-to-One", "One-to-Many", "Many-to-Many", "None"],
        correctAnswer: 1
    },
    {
        id: 19,
        type: "multiple_choice",
        subject: SUBJECTS.DATABASES,
        question: "ما هي الكلمة المفتاحية المستخدمة لاختيار بيانات من جدول؟",
        options: ["GET", "SELECT", "FIND", "SHOW"],
        correctAnswer: 1
    },
    {
        id: 20,
        type: "true_false",
        subject: SUBJECTS.DATABASES,
        question: "قاعدة البيانات العلائقية (Relational) تعتمد على الجداول.",
        correctAnswer: true
    },

    // Cybersecurity (5 questions)
    {
        id: 21,
        type: "multiple_choice",
        subject: SUBJECTS.CYBERSECURITY,
        question: "أي من التالي يُعتبر نوعًا من الهجمات الإلكترونية؟",
        options: ["Phishing", "Browsing", "Streaming", "Hosting"],
        correctAnswer: 0
    },
    {
        id: 22,
        type: "true_false",
        subject: SUBJECTS.CYBERSECURITY,
        question: "كلمة المرور القوية يجب أن تحتوي على حروف وأرقام ورموز.",
        correctAnswer: true
    },
    {
        id: 23,
        type: "choose_from_list",
        subject: SUBJECTS.CYBERSECURITY,
        question: "اختر الجهاز الذي يُستخدم لحماية الشبكة من الهجمات:",
        options: ["Router", "Firewall", "Switch", "Hub"],
        correctAnswer: 1
    },
    {
        id: 24,
        type: "multiple_choice",
        subject: SUBJECTS.CYBERSECURITY,
        question: "أي من التالي يُعتبر بروتوكول تشفير؟",
        options: ["HTTPS", "HTTP", "FTP", "Telnet"],
        correctAnswer: 0
    },
    {
        id: 25,
        type: "true_false",
        subject: SUBJECTS.CYBERSECURITY,
        question: "الفيروس (Virus) يمكنه الانتشار بدون تدخل المستخدم.",
        correctAnswer: false
    }
];

// Exam configuration
const EXAM_CONFIG = {
    duration: 1800, // 30 minutes in seconds
    passingScore: 0.6, // 60% required to pass
    maxQuestions: 30, // Maximum questions to show (random selection)
    subjectsWeights: {
        [SUBJECTS.ARABIC]: 0.25,
        [SUBJECTS.MATH]: 0.25,
        [SUBJECTS.SCIENCE]: 0.2,
        [SUBJECTS.HISTORY]: 0.15,
        [SUBJECTS.GEOGRAPHY]: 0.1,
        [SUBJECTS.ENGLISH]: 0.05
    },
    maxLoginAttempts: 3,
    warningTime: 300 // 5 minutes in seconds (show warning when time is running out)
};

// Google Sheets configuration
const SHEETS_CONFIG = {
    scriptUrl: "https://script.google.com/macros/s/AKfycbxFdVx5lMouqvjLGePENcjR4mM2xZFC32J47CTx5_OXimGgY-9Xs7UJ_d_lVgM6elON/exec",
    sheetName: "ExamResults",
    columns: [
        "Timestamp",
        "School",
        "Student Name",
        "Class",
        "Score",
        "Percentage",
        "Status",
        "Answers"
    ],
    timeout: 10000 // 10 seconds timeout for API request
};
