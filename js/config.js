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
    ARABIC: "اللغة العربية",
    MATH: "الرياضيات",
    SCIENCE: "العلوم",
    HISTORY: "التاريخ",
    GEOGRAPHY: "الجغرافيا",
    ENGLISH: "اللغة الإنجليزية"
};

// Exam questions configuration
const EXAM_QUESTIONS = [
    // Arabic Language Questions (5 questions)
    {
        type: "multiple_choice",
        subject: SUBJECTS.ARABIC,
        question: "ما نوع الجملة التالية: 'السماء صافية اليوم'؟",
        options: ["جملة اسمية", "جملة فعلية", "جملة شرطية", "جملة استفهامية"],
        correctAnswer: 0
    },
    {
        type: "true_false",
        subject: SUBJECTS.ARABIC,
        question: "الفعل 'يذهب' هو فعل مضارع مرفوع.",
        correctAnswer: true
    },
    {
        type: "choose_from_list",
        subject: SUBJECTS.ARABIC,
        question: "اختر الكلمة التي تحوي همزة قطع:",
        options: ["استمع", "ابن", "امرأة", "اثنان"],
        correctAnswer: 3
    },
    {
        type: "multiple_choice",
        subject: SUBJECTS.ARABIC,
        question: "ما ضد كلمة 'الضيقة'؟",
        options: ["الواسعة", "الصغيرة", "الكبيرة", "الطويلة"],
        correctAnswer: 0
    },
    {
        type: "true_false",
        subject: SUBJECTS.ARABIC,
        question: "الشاعر المتنبي ينتمي إلى العصر الأموي.",
        correctAnswer: false
    },

    // Mathematics Questions (5 questions)
    {
        type: "multiple_choice",
        subject: SUBJECTS.MATH,
        question: "ما هو ناتج جمع 3/4 + 1/2؟",
        options: ["4/6", "5/4", "1 1/4", "7/8"],
        correctAnswer: 2
    },
    {
        type: "true_false",
        subject: SUBJECTS.MATH,
        question: "المعادلة x² - 5x + 6 = 0 لها جذرين حقيقيين.",
        correctAnswer: true
    },
    {
        type: "choose_from_list",
        subject: SUBJECTS.MATH,
        question: "اختر الشكل الذي ليس متعدد السطوح:",
        options: ["المكعب", "الهرم", "الكرة", "المنشور"],
        correctAnswer: 2
    },
    {
        type: "multiple_choice",
        subject: SUBJECTS.MATH,
        question: "ما هو محيط دائرة نصف قطرها 7 سم؟ (ط ≈ 22/7)",
        options: ["22 سم", "44 سم", "88 سم", "154 سم"],
        correctAnswer: 1
    },
    {
        type: "true_false",
        subject: SUBJECTS.MATH,
        question: "اللوغاريتم الطبيعي للعدد 1 يساوي 0.",
        correctAnswer: true
    },

    // Science Questions (5 questions)
    {
        type: "multiple_choice",
        subject: SUBJECTS.SCIENCE,
        question: "أي من هذه العناصر هو غاز نبيل؟",
        options: ["الأكسجين", "الهيدروجين", "النيون", "النيتروجين"],
        correctAnswer: 2
    },
    {
        type: "true_false",
        subject: SUBJECTS.SCIENCE,
        question: "الخلايا النباتية تحتوي على جدار خلوي بينما الخلايا الحيوانية لا تحتوي عليه.",
        correctAnswer: true
    },
    {
        type: "choose_from_list",
        subject: SUBJECTS.SCIENCE,
        question: "اختر الكوكب الذي يعرف باسم 'الكوكب الأحمر':",
        options: ["المريخ", "الزهرة", "المشتري", "زحل"],
        correctAnswer: 0
    },
    {
        type: "multiple_choice",
        subject: SUBJECTS.SCIENCE,
        question: "ما هي وحدة قياس شدة التيار الكهربائي؟",
        options: ["الفولت", "الأوم", "الأمبير", "الواط"],
        correctAnswer: 2
    },
    {
        type: "true_false",
        subject: SUBJECTS.SCIENCE,
        question: "عملية البناء الضوئي تحدث فقط في أوراق النباتات.",
        correctAnswer: false
    },

    // History Questions (5 questions)
    {
        type: "multiple_choice",
        subject: SUBJECTS.HISTORY,
        question: "في أي عام وقعت معركة حطين؟",
        options: ["1187 م", "1258 م", "1099 م", "1517 م"],
        correctAnswer: 0
    },
    {
        type: "true_false",
        subject: SUBJECTS.HISTORY,
        question: "صلاح الدين الأيوبي هو مؤسس الدولة الأيوبية.",
        correctAnswer: true
    },
    {
        type: "choose_from_list",
        subject: SUBJECTS.HISTORY,
        question: "اختر الخليفة الذي أنشأ مدينة بغداد:",
        options: ["عمر بن الخطاب", "عثمان بن عفان", "هارون الرشيد", "أبو جعفر المنصور"],
        correctAnswer: 3
    },
    {
        type: "multiple_choice",
        subject: SUBJECTS.HISTORY,
        question: "ما هي المعاهدة التي أنهت الحرب العالمية الأولى؟",
        options: ["معاهدة فرساي", "معاهدة سايكس بيكو", "معاهدة وستفاليا", "معاهدة برست ليتوفسك"],
        correctAnswer: 0
    },
    {
        type: "true_false",
        subject: SUBJECTS.HISTORY,
        question: "الثورة الصناعية بدأت في فرنسا.",
        correctAnswer: false
    },

    // Geography Questions (5 questions)
    {
        type: "multiple_choice",
        subject: SUBJECTS.GEOGRAPHY,
        question: "أي من هذه الدول لا تطل على البحر الأحمر؟",
        options: ["السعودية", "الأردن", "السودان", "قطر"],
        correctAnswer: 3
    },
    {
        type: "true_false",
        subject: SUBJECTS.GEOGRAPHY,
        question: "نهر النيل هو أطول نهر في العالم.",
        correctAnswer: true
    },
    {
        type: "choose_from_list",
        subject: SUBJECTS.GEOGRAPHY,
        question: "اختر أعلى جبل في العالم:",
        options: ["كليمنجارو", "إفرست", "كينابالو", "أكونكاجوا"],
        correctAnswer: 1
    },
    {
        type: "multiple_choice",
        subject: SUBJECTS.GEOGRAPHY,
        question: "ما هي عاصمة كندا؟",
        options: ["تورونتو", "فانكوفر", "أوتاوا", "مونتريال"],
        correctAnswer: 2
    },
    {
        type: "true_false",
        subject: SUBJECTS.GEOGRAPHY,
        question: "خط الاستواء يمر عبر دولة السعودية.",
        correctAnswer: false
    },

    // English Language Questions (5 questions)
    {
        type: "multiple_choice",
        subject: SUBJECTS.ENGLISH,
        question: "Choose the correct sentence:",
        options: ["She go to school", "She goes to school", "She going to school", "She is go to school"],
        correctAnswer: 1
    },
    {
        type: "true_false",
        subject: SUBJECTS.ENGLISH,
        question: "The past tense of 'run' is 'ran'.",
        correctAnswer: true
    },
    {
        type: "choose_from_list",
        subject: SUBJECTS.ENGLISH,
        question: "Select the correct spelling:",
        options: ["Recieve", "Receive", "Recieve", "Receve"],
        correctAnswer: 1
    },
    {
        type: "multiple_choice",
        subject: SUBJECTS.ENGLISH,
        question: "What is the opposite of 'ancient'?",
        options: ["Old", "Modern", "Historic", "Classic"],
        correctAnswer: 1
    },
    {
        type: "true_false",
        subject: SUBJECTS.ENGLISH,
        question: "'Their', 'there', and 'they're' are pronounced the same but have different meanings.",
        correctAnswer: true
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
    }
};

// Google Sheets configuration
const SHEETS_CONFIG = {
    scriptUrl: "https://script.google.com/macros/s/AKfycbxrD_lq8gvG7mhRW8PP8ywAxFf6NKpV_b0CFVvfk9Nlf5owflkZ7Hg74s25kmcBroWT/exec",
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
    ]
};

// Export configurations if using modules
// export { SCHOOL_CODES, EXAM_QUESTIONS, EXAM_CONFIG, SHEETS_CONFIG, SUBJECTS };