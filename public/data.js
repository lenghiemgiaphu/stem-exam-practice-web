/* =====================================================================
 * Subject config – 5 môn THPT. Thứ tự khai báo = thứ tự hiển thị trên giao diện
 * (thẻ môn học, bộ lọc Ngân hàng câu hỏi, Đề thi, Thống kê...).
 * Key (Math, Physics, ...) là giá trị lưu trong question.subject / exam.subject.
 * ===================================================================== */
const SUBJECTS = {
  Math: {
    label: "Toán học",
    icon: "fa-square-root-variable",
    badge: "bg-indigo-100 text-indigo-700",
    soft: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    solid: "bg-indigo-600 text-white",
    text: "text-indigo-600",
    bar: "bg-indigo-500",
  },
  Physics: {
    label: "Vật lí",
    icon: "fa-atom",
    badge: "bg-sky-100 text-sky-700",
    soft: "bg-sky-50 text-sky-700 ring-sky-200",
    solid: "bg-sky-600 text-white",
    text: "text-sky-600",
    bar: "bg-sky-500",
  },
  Chemistry: {
    label: "Hóa học",
    icon: "fa-flask",
    badge: "bg-amber-100 text-amber-800",
    soft: "bg-amber-50 text-amber-800 ring-amber-200",
    solid: "bg-amber-500 text-white",
    text: "text-amber-600",
    bar: "bg-amber-500",
  },
  Biology: {
    label: "Sinh học",
    icon: "fa-dna",
    badge: "bg-emerald-100 text-emerald-700",
    soft: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    solid: "bg-emerald-600 text-white",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
  },
  English: {
    label: "Tiếng Anh",
    icon: "fa-language",
    badge: "bg-rose-100 text-rose-700",
    soft: "bg-rose-50 text-rose-700 ring-rose-200",
    solid: "bg-rose-500 text-white",
    text: "text-rose-600",
    bar: "bg-rose-500",
  },
};

// Môn mở mặc định khi vào #/bank mà chưa chọn môn.
const DEFAULT_SUBJECT = "Math";

/* =====================================================================
 * Exam schema (extensible)
 *
 * Exam = {
 *   examId, title, defaultTimeMinutes,
 *   kind: "mock" | "real",
 *   examCategory: "subject" | "standardized",   // mặc định "subject"
 *   subject: <key của SUBJECTS> | "Mixed",       // "Mixed" dành cho đề tổng hợp nhiều phân môn
 *   standardizedType?: "DGNL" | "TSA" | "HSA",   // chỉ dùng khi examCategory === "standardized"
 *   questions: [questionId, ...]                 // id trong questionBank
 * }
 *
 * Mỗi câu hỏi trong questionBank luôn có `subject` và `topic` RIÊNG (kể cả khi nằm
 * trong đề "Mixed"), nên bảng "Phân tích theo chuyên đề" gộp theo từng câu chứ không
 * theo đề. `grade` là tùy chọn với câu hỏi của đề chuẩn hóa (không gắn lớp).
 *
 * Giao diện hiện tại CHỈ hiển thị các nhóm có `visible: true` bên dưới.
 * Khi mở mảng ĐGNL/TSA/HSA: đổi `standardized.visible` thành true và thêm bộ lọc.
 * ===================================================================== */
const DEFAULT_EXAM_CATEGORY = "subject";

const EXAM_CATEGORIES = {
  subject: { label: "Đề thi theo môn THPT", visible: true },
  standardized: { label: "Đề thi chuẩn hóa (ĐGNL, TSA, HSA)", visible: false },
};

// Danh mục dự phòng cho nhóm "standardized" (chưa hiển thị trên giao diện).
const STANDARDIZED_EXAM_TYPES = {
  DGNL: { label: "ĐGNL", fullName: "Đánh giá năng lực (ĐHQG TP.HCM)" },
  TSA: { label: "TSA", fullName: "Đánh giá tư duy (ĐH Bách khoa Hà Nội)" },
  HSA: { label: "HSA", fullName: "Đánh giá năng lực (ĐHQG Hà Nội)" },
};

const examCategoryOf = (exam) => exam.examCategory || DEFAULT_EXAM_CATEGORY;
const isExamVisible = (exam) => !!EXAM_CATEGORIES[examCategoryOf(exam)]?.visible;

const GRADES = [10, 11, 12];

const QUESTION_TYPES = {
  multiple_choice: { label: "Trắc nghiệm", order: 1, icon: "fa-list-ul", hint: "Chọn 1 trong 4 phương án" },
  true_false: { label: "Đúng/Sai", order: 2, icon: "fa-scale-balanced", hint: "Đánh giá Đúng/Sai từng ý a), b), c), d)" },
  short_answer: { label: "Trả lời ngắn", order: 3, icon: "fa-keyboard", hint: "Nhập đáp án cuối cùng" },
  drag_drop: { label: "Kéo thả", order: 4, icon: "fa-up-down-left-right", hint: "Kéo đáp án (có cả đáp án nhiễu) vào ô tương ứng" },
};

const DIFFICULTY = {
  easy: { label: "Dễ", sub: "Nhận biết", order: 1, badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  medium: { label: "Trung bình", sub: "Thông hiểu", order: 2, badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  hard: { label: "Khó", sub: "Vận dụng", order: 3, badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

const mc = (id, grade, subject, topic, questionText, opts, correctAnswer, explanation) => ({
  id, grade, subject, topic, type: "multiple_choice", questionText,
  options: { A: opts[0], B: opts[1], C: opts[2], D: opts[3] },
  correctAnswer, explanation,
});

const tf = (id, grade, subject, topic, questionText, statements, explanation) => ({
  id, grade, subject, topic, type: "true_false", questionText,
  statements: statements.map(([text, isTrue]) => ({ text, isTrue })),
  explanation,
});

const sa = (id, grade, subject, topic, questionText, correctAnswer, explanation, acceptedAnswers = []) => ({
  id, grade, subject, topic, type: "short_answer", questionText,
  correctAnswer, acceptedAnswers, explanation,
});

const questionBank = [
  // ===== Grade 10 - Physics =====
  mc("phy_10_01", 10, "Physics", "Động học chất điểm",
    "Một ô tô đang chuyển động với vận tốc 10 m/s thì tăng tốc. Đây là chuyển động gì?",
    ["Thẳng đều", "Thẳng nhanh dần đều", "Thẳng chậm dần đều", "Tròn đều"], "B",
    "Vận tốc tăng dần theo thời gian là chuyển động nhanh dần."),
  sa("phy_10_02", 10, "Physics", "Động học chất điểm",
    "Một vật rơi tự do từ độ cao 80 m, lấy g = 10 m/s². Thời gian rơi của vật là bao nhiêu giây?",
    "4",
    "Từ h = ½·g·t² suy ra t = √(2h/g) = √(2·80/10) = 4 s."),
  tf("phy_10_03", 10, "Physics", "Động học chất điểm",
    "Xét chuyển động thẳng đều của một chất điểm. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Vận tốc của vật không đổi theo thời gian.", true],
      ["Đồ thị tọa độ – thời gian (x–t) là một đường thẳng.", true],
      ["Quãng đường đi được tỉ lệ nghịch với thời gian chuyển động.", false],
      ["Gia tốc của vật khác không.", false],
    ],
    "Chuyển động thẳng đều có vận tốc không đổi, x = x₀ + vt nên đồ thị x–t là đường thẳng; quãng đường s = vt tỉ lệ thuận với t; gia tốc bằng 0."),
  mc("phy_10_04", 10, "Physics", "Các định luật Newton",
    "Một vật có khối lượng 2 kg chịu tác dụng của lực không đổi 6 N. Gia tốc của vật là:",
    ["3 m/s²", "12 m/s²", "0,33 m/s²", "4 m/s²"], "A",
    "Theo định luật II Newton: a = F/m = 6/2 = 3 m/s²."),
  mc("phy_10_05", 10, "Physics", "Các định luật Newton",
    "Theo định luật III Newton, lực và phản lực có đặc điểm nào sau đây?",
    ["Cùng phương, cùng chiều, cùng độ lớn", "Cùng phương, ngược chiều, cùng độ lớn, đặt vào hai vật khác nhau",
      "Cùng phương, ngược chiều, cùng độ lớn, đặt vào cùng một vật", "Khác phương, cùng độ lớn"], "B",
    "Lực và phản lực luôn cùng phương, ngược chiều, cùng độ lớn nhưng đặt vào hai vật khác nhau nên không cân bằng nhau."),

  // ===== Grade 10 - Chemistry =====
  mc("che_10_01", 10, "Chemistry", "Cấu tạo nguyên tử",
    "Nguyên tử có cấu hình electron 1s²2s²2p⁶3s¹ thuộc nhóm nào trong bảng tuần hoàn?",
    ["Nhóm IA", "Nhóm IIA", "Nhóm IIIA", "Nhóm VIIA"], "A",
    "Nguyên tử có 1 electron ở lớp ngoài cùng (3s¹) nên thuộc nhóm IA (kim loại kiềm, Na)."),
  sa("che_10_02", 10, "Chemistry", "Cấu tạo nguyên tử",
    "Nguyên tử Al (Z = 13) có bao nhiêu electron ở lớp ngoài cùng?",
    "3",
    "Cấu hình electron của Al: 1s²2s²2p⁶3s²3p¹ nên lớp ngoài cùng có 2 + 1 = 3 electron."),
  mc("che_10_03", 10, "Chemistry", "Liên kết hóa học",
    "Liên kết trong phân tử NaCl là liên kết nào sau đây?",
    ["Liên kết ion", "Liên kết cộng hóa trị không cực", "Liên kết cộng hóa trị phân cực", "Liên kết kim loại"], "A",
    "Na (kim loại điển hình) nhường electron cho Cl (phi kim điển hình) tạo ion Na⁺ và Cl⁻; hai ion hút nhau bằng lực hút tĩnh điện."),
  tf("che_10_04", 10, "Chemistry", "Liên kết hóa học",
    "Xét phân tử nước (H₂O). Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Liên kết O–H là liên kết cộng hóa trị phân cực.", true],
      ["Phân tử H₂O có dạng đường thẳng.", false],
      ["Giữa các phân tử nước có thể hình thành liên kết hydrogen.", true],
      ["Nước là hợp chất ion.", false],
    ],
    "H₂O có dạng gấp khúc (góc ≈ 104,5°), liên kết O–H phân cực, các phân tử tạo liên kết hydrogen với nhau; nước là hợp chất cộng hóa trị."),

  // ===== Grade 10 - Biology =====
  mc("bio_10_01", 10, "Biology", "Thành phần hóa học của tế bào",
    "Đơn phân cấu tạo nên phân tử protein là:",
    ["Nucleotide", "Amino acid", "Glucose", "Acid béo"], "B",
    "Protein là đại phân tử được cấu tạo từ nhiều amino acid liên kết với nhau bằng liên kết peptide."),
  sa("bio_10_02", 10, "Biology", "Thành phần hóa học của tế bào",
    "Loại đường đôi có trong sữa động vật được gọi là gì?",
    "lactose",
    "Lactose (đường sữa) là disaccharide gồm một phân tử glucose và một phân tử galactose.",
    ["lactôzơ", "lactozo", "đường sữa"]),
  mc("bio_10_03", 10, "Biology", "Cấu trúc tế bào",
    "Bào quan nào là nơi tổng hợp phần lớn ATP cho tế bào nhân thực?",
    ["Ribosome", "Ti thể", "Lysosome", "Bộ máy Golgi"], "B",
    "Ti thể là trung tâm hô hấp tế bào, nơi diễn ra chuỗi chuyền electron và tổng hợp phần lớn ATP."),
  tf("bio_10_04", 10, "Biology", "Cấu trúc tế bào",
    "Xét tế bào nhân sơ. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Chưa có nhân hoàn chỉnh, vật chất di truyền nằm ở vùng nhân.", true],
      ["Có hệ thống màng nội bào phức tạp.", false],
      ["Có ribosome để tổng hợp protein.", true],
      ["Vật chất di truyền là DNA dạng vòng.", true],
    ],
    "Tế bào nhân sơ không có màng nhân và các bào quan có màng bao bọc; chúng có ribosome và DNA dạng vòng."),

  // ===== Grade 11 - Physics =====
  mc("phy_11_01", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với phương trình x = 4cos(2πt) (x tính bằng cm, t tính bằng s). Chu kì dao động của vật là:",
    ["0,5 s", "1 s", "2 s", "4 s"], "B",
    "Tần số góc ω = 2π rad/s nên chu kì T = 2π/ω = 1 s."),
  sa("phy_11_02", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ 5 cm. Quãng đường vật đi được trong đúng một chu kì là bao nhiêu cm?",
    "20",
    "Trong một chu kì vật đi được quãng đường bằng 4 lần biên độ: s = 4A = 20 cm."),
  mc("phy_11_03", 11, "Physics", "Điện trường",
    "Đơn vị của cường độ điện trường trong hệ SI là:",
    ["V/m", "V·m", "C/V", "N·C"], "A",
    "Cường độ điện trường E = U/d nên có đơn vị V/m (cũng bằng N/C)."),
  tf("phy_11_04", 11, "Physics", "Điện trường",
    "Xét một điện tích điểm đặt trong điện trường đều. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Nếu q > 0, lực điện tác dụng lên q cùng chiều với vectơ cường độ điện trường.", true],
      ["Nếu q < 0, lực điện tác dụng lên q cùng chiều với vectơ cường độ điện trường.", false],
      ["Công của lực điện khi điện tích dịch chuyển không phụ thuộc hình dạng đường đi.", true],
      ["Cường độ điện trường tại các điểm khác nhau trong điện trường đều có độ lớn khác nhau.", false],
    ],
    "F = qE: q > 0 thì F cùng chiều E, q < 0 thì ngược chiều. Lực điện là lực thế nên công không phụ thuộc đường đi. Điện trường đều có E không đổi."),
   mc("phy_11_05", 11, "Physics", "Dao động điều hòa",
    "Chuyển động nào sau đây không được coi là dao động cơ?",
    ["Dây đàn ghi ta rung động.", "Chiếc đu đung đưa.", "Pit tông chuyển động lên xuống trong xi lanh.", "Một hòn đá được thả rơi."], "D",
    "Dao động cơ là chuyển động qua lại quanh một vị trí cân bằng. Hòn đá rơi chỉ đi theo một chiều xuống dưới, không lặp lại nên không phải dao động."),

  mc("phy_11_06", 11, "Physics", "Dao động điều hòa",
    "Khoảng thời gian để vật thực hiện được một dao động toàn phần gọi là",
    ["tần số.", "chu kì.", "biên độ.", "tần số góc."], "B",
    "Chu kì T là khoảng thời gian vật thực hiện một dao động toàn phần."),

  mc("phy_11_07", 11, "Physics", "Dao động điều hòa",
    "Đại lượng cho biết số dao động mà vật thực hiện được trong 1 s gọi là",
    ["pha dao động.", "tần số.", "biên độ.", "li độ."], "B",
    "Tần số f = 1/T là số dao động toàn phần vật thực hiện được trong 1 giây (đơn vị Hz)."),

  mc("phy_11_08", 11, "Physics", "Dao động điều hòa",
    "Độ lệch cực đại so với vị trí cân bằng gọi là",
    ["Biên độ.", "Tần số.", "Li độ.", "Pha ban đầu."], "A",
    "Độ lệch cực đại so với vị trí cân bằng là biên độ A; còn li độ x là độ lệch của vật tại từng thời điểm."),

  mc("phy_11_09", 11, "Physics", "Dao động điều hòa",
    "Tần số góc có đơn vị là",
    ["Hz.", "cm.", "rad.", "rad/s."], "D",
    "ω = 2π/T = 2πf nên tần số góc có đơn vị rad/s."),

  mc("phy_11_10", 11, "Physics", "Dao động điều hòa",
    "Dao động điều hòa là",
    ["chuyển động mà trạng thái chuyển động của vật được lặp lại như cũ sau những khoảng thời gian bằng nhau.", "chuyển động của một vật dưới tác dụng của một lực không đổi.", "hình chiếu của chuyển động tròn đều lên một đường thẳng nằm trong mặt phẳng quỹ đạo.", "chuyển động có phương trình mô tả bởi hình sin hoặc cosin theo thời gian."], "D",
    "Dao động điều hòa là dao động có li độ biến thiên theo hàm cosin (hoặc sin) của thời gian. A là định nghĩa dao động tuần hoàn; B sai vì lực kéo về biến thiên theo li độ; C chỉ là cách mô tả dao động điều hòa như hình chiếu của chuyển động tròn đều, không phải định nghĩa."),

  mc("phy_11_11", 11, "Physics", "Dao động điều hòa",
    "Dao động là chuyển động có",
    ["giới hạn trong không gian, lặp đi lặp lại nhiều lần quanh một vị trí cân bằng (VTCB).", "trạng thái chuyển động được lặp lại như cũ sau những khoảng thời gian bằng nhau.", "lặp đi lặp lại nhiều lần có giới hạn trong không gian.", "qua lại hai bên VTCB và không giới hạn không gian."], "A",
    "Dao động là chuyển động có giới hạn trong không gian, lặp đi lặp lại nhiều lần quanh một vị trí cân bằng. Phương án B là định nghĩa dao động tuần hoàn."),

  mc("phy_11_12", 11, "Physics", "Dao động điều hòa",
    "Pha của dao động được dùng để xác định",
    ["biên độ dao động.", "trạng thái dao động.", "tần số dao động.", "chu kì dao động."], "B",
    "Pha (ωt + φ) cho biết trạng thái dao động (li độ và chiều chuyển động) của vật ở thời điểm t."),

  mc("phy_11_13", 11, "Physics", "Dao động điều hòa",
    "Phát biểu nào sau đây sai khi nói về dao động điều hòa?",
    ["Dao động điều hòa là dao động có tính tuần hoàn.", "Biên độ của dao động là giá trị cực đại của li độ.", "Vận tốc biến thiên cùng tần số với li độ.", "Dao động điều hòa có quỹ đạo là đường hình sin."], "D",
    "Quỹ đạo của dao động điều hòa là một đoạn thẳng; chính đồ thị li độ theo thời gian mới có dạng hình sin."),

  mc("phy_11_14", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa với chu kì T = 1 s. Tần số góc ω của dao động là",
    ["π rad/s.", "2π rad/s.", "1 rad/s.", "2 rad/s."], "B",
    "ω = 2π/T = 2π/1 = 2π rad/s."),

  mc("phy_11_15", 11, "Physics", "Dao động điều hòa",
    "Khi nói về dao động điều hòa của một vật, phát biểu nào sau đây đúng?",
    ["Khi vật ở vị trí biên, gia tốc của vật bằng không.", "Vectơ gia tốc của vật luôn hướng về vị trí cân bằng.", "Vectơ vận tốc của vật luôn hướng về vị trí cân bằng.", "Khi đi qua vị trí cân bằng, vận tốc của vật bằng không."], "B",
    "Gia tốc a = −ω²x nên luôn hướng về vị trí cân bằng. Ở biên gia tốc có độ lớn cực đại (vận tốc bằng 0); ở vị trí cân bằng vận tốc cực đại (gia tốc bằng 0); vectơ vận tốc đổi chiều khi vật tới biên."),

  mc("phy_11_16", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa có phương trình x = Acos(ωt + φ). Gọi v là vận tốc của vật khi vật ở li độ x. Biên độ dao động của vật là",
    ["√(x² + v²/ω²).", "√(x² + v²/ω⁴).", "√(x + v²/ω²).", "√(x² + v⁴/ω²)."], "A",
    "Từ x = Acos(ωt + φ) và v = −ωAsin(ωt + φ) suy ra (x/A)² + (v/(ωA))² = 1, tức A² = x² + v²/ω², nên A = √(x² + v²/ω²)."),

  mc("phy_11_17", 11, "Physics", "Dao động điều hòa",
    "Vật dao động điều hòa khi đi từ vị trí biên dương về vị trí cân bằng thì",
    ["li độ của vật giảm dần nên gia tốc của vật có giá trị dương.", "li độ của vật có giá trị dương nên vật chuyển động nhanh dần.", "vật đang chuyển động nhanh dần vì vận tốc của vật có giá trị dương.", "vật đang chuyển động theo chiều âm và vận tốc của vật có giá trị âm."], "D",
    "Đi từ biên dương về vị trí cân bằng là chuyển động theo chiều âm nên v < 0 (C sai). Li độ x > 0 nên a = −ω²x < 0 (A sai). B nêu lí do sai: vật nhanh dần vì a và v cùng dấu (cùng âm), không phải vì li độ dương."),

  mc("phy_11_18", 11, "Physics", "Dao động điều hòa",
    "Một vật nhỏ dao động điều hòa với li độ x = 10cos(πt + π/6) (x tính bằng cm, t tính bằng s). Lấy π² = 10. Gia tốc của vật có độ lớn cực đại là",
    ["100π cm/s².", "100 cm/s².", "10π cm/s².", "10 cm/s²."], "B",
    "a_max = ω²A = π²·10 = 10·10 = 100 cm/s²."),

  mc("phy_11_19", 11, "Physics", "Dao động điều hòa",
    "Một vật nhỏ dao động điều hòa dọc theo trục Ox (vị trí cân bằng ở O) với biên độ 5 cm và tần số 10 Hz. Khi vật có li độ 3 cm thì tốc độ của vật bằng",
    ["251,32 cm/s.", "287,9 cm/s.", "314,2 cm/s.", "50,0 cm/s."], "A",
    "ω = 2πf = 20π rad/s. Tốc độ |v| = ω√(A² − x²) = 20π·√(25 − 9) = 20π·4 = 80π ≈ 251,32 cm/s."),

  mc("phy_11_20", 11, "Physics", "Dao động điều hòa",
    "Một vật nhỏ đang dao động điều hòa trên trục Ox với vận tốc v = 20πcos(2πt + 2π/3) (cm/s) (t tính bằng s). Tại thời điểm ban đầu (t = 0), vật ở li độ",
    ["−5 cm.", "−5√3 cm.", "5 cm.", "5√3 cm."], "D",
    "Vận tốc sớm pha π/2 so với li độ nên pha ban đầu của li độ là φ = 2π/3 − π/2 = π/6. Biên độ A = vmax/ω = 20π/(2π) = 10 cm. Tại t = 0: x = 10cos(π/6) = 5√3 cm."),

  mc("phy_11_21", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa trên trục Ox, gốc tọa độ O tại vị trí cân bằng. Biết phương trình vận tốc của chất điểm là v = 20πcos(2πt + π/6) (cm/s). Phương trình dao động của chất điểm có dạng",
    ["x = 10cos(2πt − π/3) (cm).", "x = 10cos(2πt + 2π/3) (cm).", "x = 20cos(2πt + 5π/6) (cm).", "x = 20cos(2πt + π/3) (cm)."], "A",
    "Biên độ A = vmax/ω = 20π/(2π) = 10 cm. Vận tốc sớm pha π/2 so với li độ nên φ = π/6 − π/2 = −π/3. Vậy x = 10cos(2πt − π/3) cm."),

  mc("phy_11_22", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ 10 cm. Quãng đường vật đi được trong khoảng thời gian 1 chu kì bằng",
    ["10 cm.", "40 cm.", "20 cm.", "30 cm."], "B",
    "Trong một chu kì vật đi được quãng đường s = 4A = 40 cm."),

  mc("phy_11_23", 11, "Physics", "Dao động điều hòa",
    "Một vật (được coi là chất điểm) dao động điều hòa trên một quỹ đạo thẳng có chiều dài 16 cm. Biết trong 10 s vật thực hiện được 5 dao động. Tốc độ trung bình của vật trong 1 chu kì bằng",
    ["4 cm/s.", "32 cm/s.", "16 cm/s.", "8 cm/s."], "C",
    "Chiều dài quỹ đạo 16 cm nên A = 8 cm; chu kì T = 10/5 = 2 s. Tốc độ trung bình trong một chu kì: v = 4A/T = 32/2 = 16 cm/s."),

  mc("phy_11_24", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa trong 10 dao động toàn phần đi được quãng đường 120 cm. Quỹ đạo của dao động có chiều dài là",
    ["6 cm.", "12 cm.", "3 cm.", "9 cm."], "A",
    "Quãng đường trong một chu kì là 120/10 = 12 cm = 4A nên A = 3 cm. Chiều dài quỹ đạo L = 2A = 6 cm."),

  mc("phy_11_25", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa có đồ thị li độ x theo thời gian t với các đặc điểm: li độ cực đại là 20 cm; tại t = 0 vật có li độ x = 10 cm và đang tăng; hai lần liên tiếp li độ đạt cực đại 20 cm cách nhau 4 s. Phương trình dao động của vật là",
    ["x = 20cos(πt/2 + π/3) (cm).", "x = 20cos(πt − π/3) (cm).", "x = 20cos(πt + π/3) (cm).", "x = 20cos(πt/2 − π/3) (cm)."], "D",
    "A = 20 cm; T = 4 s nên ω = 2π/T = π/2 rad/s. Tại t = 0: x = 10 = 20cosφ nên cosφ = 1/2; li độ đang tăng (v > 0) nên φ = −π/3. Vậy x = 20cos(πt/2 − π/3) cm."),

  mc("phy_11_26", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa có đồ thị vận tốc theo thời gian với các đặc điểm: tại t = 0 vận tốc bằng +10π cm/s và đang giảm; vận tốc đạt giá trị nhỏ nhất −20π cm/s lần đầu tiên tại t = 0,1 s; tại t = 0,2 s vận tốc lại bằng +10π cm/s. Phương trình dao động của vật là",
    ["x = 3cos(20πt/3 + π/6) (cm).", "x = (3/2)cos(40πt/3 − π/6) (cm).", "x = (3/2)cos(40πt/3 + π/6) (cm).", "x = 3cos(20πt/3 − π/6) (cm)."], "D",
    "Tốc độ cực đại vmax = 20π cm/s; v(0) = 10π = vmax/2 và đang giảm nên pha ban đầu của vận tốc là π/3. Vận tốc đạt cực tiểu (pha bằng π) tại t = 0,1 s: 0,1ω + π/3 = π ⇒ ω = 20π/3 rad/s. Biên độ A = vmax/ω = 3 cm; pha ban đầu của li độ φ = π/3 − π/2 = −π/6. Vậy x = 3cos(20πt/3 − π/6) cm."),

  mc("phy_11_27", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Cơ năng của một vật dao động điều hòa",
    ["tăng gấp đôi khi biên độ dao động của vật tăng gấp đôi.", "biến thiên tuần hoàn theo thời gian với chu kì bằng chu kì dao động của vật.", "biến thiên tuần hoàn theo thời gian với chu kì bằng một nửa chu kì dao động của vật.", "bằng động năng của vật khi vật tới vị trí cân bằng."], "D",
    "Cơ năng W = ½mω²A² không đổi theo thời gian và tỉ lệ với A² (biên độ gấp đôi thì cơ năng tăng 4 lần). Tại vị trí cân bằng thế năng bằng 0 nên cơ năng bằng động năng cực đại."),

  mc("phy_11_28", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật dao động điều hòa theo một trục cố định (mốc thế năng ở vị trí cân bằng) thì",
    ["động năng của vật cực đại khi gia tốc của vật có độ lớn cực đại.", "thế năng của vật cực đại khi vật ở vị trí biên.", "khi ở vị trí cân bằng, thế năng của vật bằng cơ năng.", "khi vật đi từ vị trí cân bằng ra biên, vận tốc và gia tốc của vật luôn cùng dấu."], "B",
    "Thế năng Wt = ½kx² cực đại khi |x| = A, tức ở vị trí biên. Động năng cực đại ở vị trí cân bằng (lúc gia tốc bằng 0); ở vị trí cân bằng thế năng bằng 0; khi vật đi từ vị trí cân bằng ra biên thì v và a luôn ngược dấu."),

  mc("phy_11_29", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Cơ năng của hệ con lắc lò xo dao động điều hòa sẽ",
    ["tăng 9/4 lần khi tần số dao động f tăng 2 lần và biên độ A giảm 3 lần.", "giảm 9/4 lần khi tần số góc ω tăng lên 3 lần và biên độ A giảm 2 lần.", "tăng 4 lần khi khối lượng m của vật nặng và biên độ A tăng gấp đôi.", "tăng 16 lần khi tần số dao động f và biên độ A tăng gấp đôi."], "D",
    "Xem m, f (hoặc ω), A là các đại lượng độc lập: W = ½mω²A² = 2π²mf²A² tỉ lệ với m·f²·A². Khi f và A cùng tăng gấp đôi, W tăng 2²·2² = 16 lần. A: (2²)(1/3)² = 4/9 lần (giảm). B: (3²)(1/2)² = 9/4 lần (tăng chứ không giảm). C: 2·2² = 8 lần."),

  mc("phy_11_30", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một chất điểm khối lượng m dao động điều hòa trên trục Ox theo phương trình x = Acos(ωt + φ). Động năng của chất điểm có biểu thức là",
    ["½mω²A²cos²(ωt + φ).", "½mω²A²sin²(ωt + φ).", "½mω²A·cos²(ωt + φ).", "½mω²A²sin(ωt + φ)."], "B",
    "v = −ωAsin(ωt + φ) nên Wđ = ½mv² = ½mω²A²sin²(ωt + φ)."),

  mc("phy_11_31", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Con lắc lò xo gồm vật nhỏ khối lượng 100 g gắn với một lò xo nhẹ. Con lắc dao động điều hòa theo phương ngang với phương trình x = 10cos(10πt) (cm). Mốc thế năng ở vị trí cân bằng. Lấy π² = 10. Cơ năng của con lắc bằng",
    ["0,10 J.", "0,05 J.", "1,00 J.", "0,50 J."], "D",
    "m = 0,1 kg; ω = 10π rad/s; A = 0,1 m. W = ½mω²A² = ½·0,1·(10π)²·0,1² = ½·0,1·1000·0,01 = 0,5 J."),

  mc("phy_11_32", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật nhỏ có khối lượng 100 g dao động điều hòa với tần số góc 20 rad/s và biên độ 3 cm. Chọn mốc thế năng tại vị trí cân bằng. Cơ năng của vật là",
    ["0,6 J.", "18 mJ.", "180 J.", "36 mJ."], "B",
    "W = ½mω²A² = ½·0,1·20²·(0,03)² = 0,018 J = 18 mJ."),

  mc("phy_11_33", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật có khối lượng 50 g, dao động điều hòa với biên độ 4 cm và tần số góc 3 rad/s. Động năng cực đại của vật là",
    ["3,6·10⁻⁴ J.", "7,2 J.", "3,6 J.", "7,2·10⁻⁴ J."], "A",
    "Động năng cực đại bằng cơ năng: Wđmax = ½mω²A² = ½·0,05·3²·(0,04)² = 3,6·10⁻⁴ J."),

  mc("phy_11_34", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật có m = 500 g dao động điều hòa với phương trình dao động x = 2cos(10t + π/3) (cm). Lấy π² ≈ 10. Tại thời điểm t = 0 thì động năng của vật bằng",
    ["15,0 mJ.", "7,5 mJ.", "2,5 mJ.", "75,0 J."], "B",
    "A = 2 cm, ω = 10 rad/s nên W = ½·0,5·10²·(0,02)² = 0,01 J = 10 mJ. Tại t = 0: x = 2cos(π/3) = 1 cm = A/2 nên Wt = W/4 = 2,5 mJ. Động năng Wđ = W − Wt = 7,5 mJ."),

  mc("phy_11_35", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật dao động điều hòa với biên độ 10 cm. Chọn mốc thế năng ở vị trí cân bằng. Tại vị trí vật có li độ 5 cm, tỉ số giữa thế năng và động năng của vật là",
    ["1/2.", "1/3.", "1/4.", "1/1."], "B",
    "Wt/Wđ = x²/(A² − x²) = 25/(100 − 25) = 1/3."),

  mc("phy_11_36", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật nhỏ khối lượng 100 g dao động điều hòa với chu kì 0,2 s và cơ năng là 0,18 J (mốc thế năng tại vị trí cân bằng). Lấy π² = 10. Tại li độ 3√2 cm, tỉ số động năng và thế năng là",
    ["1.", "4.", "3.", "2."], "A",
    "ω = 2π/T = 10π rad/s. Thế năng tại x = 3√2 cm: Wt = ½mω²x² = ½·0,1·(10π)²·(0,03√2)² = ½·0,1·1000·0,0018 = 0,09 J. Động năng Wđ = 0,18 − 0,09 = 0,09 J. Vậy Wđ/Wt = 1."),

  mc("phy_11_37", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật khối lượng 400 g thực hiện dao động điều hòa. Đồ thị động năng Wđ theo thời gian t có các đặc điểm: Wđ = 0 tại t = 0, đạt cực đại 80 mJ tại t = 0,2 s và lại bằng 0 tại t = 0,4 s. Lấy π² = 10. Biên độ dao động của vật là",
    ["4√2 cm.", "8 cm.", "4 cm.", "2 cm."], "B",
    "Động năng biến thiên tuần hoàn với chu kì T' = 0,4 s (từ 0 về 0) nên T = 2T' = 0,8 s và ω = 2π/T = 2,5π rad/s. Cơ năng W = Wđmax = 80 mJ = ½mω²A² ⇒ A² = 2·0,08/(0,4·(2,5π)²) = 0,16/25 = 0,0064 m² ⇒ A = 0,08 m = 8 cm."),

  mc("phy_11_38", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Động năng và thế năng của một vật dao động điều hòa phụ thuộc vào li độ theo đồ thị như hình vẽ, trong đó động năng của vật tại li độ x = −3 cm bằng thế năng của vật tại li độ x = 4 cm. Biên độ dao động của vật là",
    ["6 cm.", "7 cm.", "5 cm.", "6,5 cm."], "C",
    "Wđ = ½k(A² − x²) và Wt = ½kx². Điều kiện Wđ(−3) = Wt(4) cho A² − 9 = 16 ⇒ A = 5 cm."),

  mc("phy_11_39", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Phát biểu nào sau đây là sai khi nói về dao động tắt dần?",
    ["Tần số của dao động càng lớn thì dao động tắt dần càng chậm.", "Cơ năng của dao động giảm dần.", "Biên độ của dao động giảm dần.", "Lực cản càng lớn thì sự tắt dần càng nhanh."], "A",
    "Dao động tắt dần nhanh hay chậm phụ thuộc vào lực cản của môi trường (lực cản càng lớn thì tắt dần càng nhanh), không phải vào việc tần số lớn hay nhỏ."),

  mc("phy_11_40", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Nhận xét nào sau đây là không đúng?",
    ["Dao động tắt dần càng nhanh nếu lực cản của môi trường càng lớn.", "Dao động duy trì có chu kì bằng chu kì dao động riêng của con lắc.", "Dao động cưỡng bức có tần số bằng tần số của lực cưỡng bức.", "Biên độ của dao động cưỡng bức không phụ thuộc vào tần số lực cưỡng bức."], "D",
    "Biên độ dao động cưỡng bức phụ thuộc vào biên độ ngoại lực, lực cản và độ chênh lệch giữa tần số ngoại lực với tần số riêng (đạt cực đại khi cộng hưởng)."),

  mc("phy_11_41", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Phát biểu nào sau đây là đúng?",
    ["Dao động duy trì là dao động tắt dần mà người ta đã làm mất lực cản của môi trường đối với vật dao động.", "Dao động duy trì là dao động tắt dần mà người ta đã tác dụng ngoại lực biến đổi điều hòa theo thời gian vào vật dao động.", "Dao động duy trì là dao động tắt dần mà người ta đã tác dụng ngoại lực vào vật dao động cùng chiều với chiều chuyển động trong một phần của từng chu kì.", "Dao động duy trì là dao động tắt dần mà người ta đã kích thích lại dao động sau khi dao động bị tắt hẳn."], "C",
    "Dao động duy trì được tạo ra bằng cách bù năng lượng cho vật: tác dụng ngoại lực cùng chiều chuyển động trong một phần của mỗi chu kì, nhờ đó biên độ không đổi và tần số vẫn là tần số riêng. Lực cản vẫn còn (A sai); ngoại lực không phải biến đổi điều hòa bất kì (B sai); D không phải cách duy trì dao động."),

  mc("phy_11_42", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Chọn câu trả lời sai?",
    ["Dao động tắt dần là dao động có biên độ giảm dần theo thời gian.", "Dao động cưỡng bức là dao động dưới tác dụng của một ngoại lực biến thiên tuần hoàn.", "Khi cộng hưởng dao động thì tần số dao động của hệ bằng tần số riêng của hệ dao động.", "Tần số của dao động cưỡng bức luôn bằng tần số riêng của hệ dao động."], "D",
    "Tần số của dao động cưỡng bức luôn bằng tần số của ngoại lực cưỡng bức; chỉ khi cộng hưởng nó mới bằng tần số riêng của hệ."),

  mc("phy_11_43", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Biên độ dao động cưỡng bức không thay đổi khi thay đổi",
    ["tần số ngoại lực tuần hoàn.", "biên độ ngoại lực tuần hoàn.", "pha ban đầu ngoại lực tuần hoàn.", "lực cản môi trường."], "C",
    "Biên độ dao động cưỡng bức phụ thuộc vào biên độ và tần số của ngoại lực cùng lực cản của môi trường, nhưng không phụ thuộc vào pha ban đầu của ngoại lực."),

  mc("phy_11_44", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Phát biểu nào dưới đây về dao động cưỡng bức là sai?",
    ["Nếu ngoại lực cưỡng bức là tuần hoàn thì trong thời kì đầu dao động của con lắc là tổng hợp dao động riêng của nó với dao động của ngoại lực tuần hoàn.", "Sau một thời gian dao động còn lại chỉ là dao động của ngoại lực tuần hoàn.", "Tần số của dao động cưỡng bức bằng tần số của ngoại lực tuần hoàn.", "Để trở thành dao động cưỡng bức, ta cần tác dụng lên con lắc dao động một ngoại lực không đổi."], "D",
    "Muốn có dao động cưỡng bức phải tác dụng lên hệ một ngoại lực biến thiên tuần hoàn, chứ không phải ngoại lực không đổi."),

  tf("phy_11_45", 11, "Physics", "Dao động điều hòa",
    "Một vật nhỏ dao động điều hòa có đồ thị li độ – thời gian với các đặc điểm: li độ cực đại là 10 cm; tại t = 0 vật ở biên âm (x = −10 cm); đồ thị cắt trục thời gian lần đầu tiên (đi lên theo chiều dương) tại t = 1/4 s. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Biên độ dao động của vật là 10 cm.", true],
      ["Tần số góc của dao động là 4π rad/s.", false],
      ["Phương trình dao động của vật là x = 10cos(4πt + π) (cm).", false],
      ["Chu kì dao động của vật là 1 s.", true],
    ],
    "Từ biên âm đến vị trí cân bằng mất T/4 = 1/4 s nên T = 1 s, ω = 2π rad/s (không phải 4π). Tại t = 0 vật ở biên âm nên φ = π. Phương trình đúng là x = 10cos(2πt + π) cm."),

  tf("phy_11_46", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Con lắc lò xo gồm vật nặng m = 100 g và lò xo nhẹ có độ cứng k = 100 N/m. Tác dụng một ngoại lực cưỡng bức biến thiên điều hòa biên độ F₀ và tần số f₁ = 4,5 Hz thì biên độ dao động là A₁. Nếu giữ nguyên biên độ F₀ mà tăng tần số ngoại lực đến f₂ = 5,5 Hz thì biên độ dao động ổn định là A₂. Lấy π² = 10. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Biên độ dao động cưỡng bức tăng rồi giảm.", true],
      ["Tần số dao động riêng f₀ = 5 Hz.", true],
      ["Do tần số f₂ > f₁ nên biên độ A₂ > A₁.", false],
      ["Biên độ dao động cưỡng bức không đổi khi thay đổi tần số của ngoại lực cưỡng bức.", false],
    ],
    "Tần số riêng f₀ = (1/2π)·√(k/m) = (1/2π)·√(100/0,1) = 5 Hz. Khi tần số ngoại lực tăng từ 4,5 Hz lên 5,5 Hz thì đi qua f₀ = 5 Hz (cộng hưởng) nên biên độ tăng rồi giảm. Hai tần số này lệch f₀ như nhau (0,5 Hz) nên không thể kết luận A₂ > A₁ chỉ vì f₂ > f₁. Biên độ dao động cưỡng bức phụ thuộc vào tần số ngoại lực nên ý d sai."),

  tf("phy_11_47", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Cho một vật có khối lượng 500 g dao động điều hòa thực hiện 20 dao động trong 10 giây. Khi vật qua vị trí cân bằng tốc độ của vật là 16π cm/s. Chọn gốc thời gian là lúc vật ở vị trí có li độ 2 cm và đang chuyển động về vị trí cân bằng. Bỏ qua lực cản, lực ma sát tác dụng lên vật. Lấy π² = 10. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi vật qua vị trí cân bằng vận tốc của vật đạt cực đại.", false],
      ["Cơ năng của vật không đổi trong quá trình dao động và bằng 6,4 mJ.", false],
      ["Trong một chu kì cứ sau một khoảng thời gian là 0,125 s thì động năng của vật lại bằng thế năng.", true],
      ["Khi t = 0, động năng của vật bằng 0,048 J.", true],
    ],
    "T = 10/20 = 0,5 s ⇒ ω = 4π rad/s; vmax = 16π cm/s ⇒ A = 4 cm. Cơ năng W = ½mω²A² = ½·0,5·(4π)²·(0,04)² = 0,064 J = 64 mJ (không phải 6,4 mJ). Động năng bằng thế năng cứ sau T/4 = 0,125 s. Tại t = 0: x = 2 cm nên Wt = ½mω²x² = 0,016 J và Wđ = 0,064 − 0,016 = 0,048 J. Ý a sai vì vật đang đi theo chiều âm: khi qua vị trí cân bằng tốc độ cực đại nhưng vận tốc (có dấu) bằng −16π cm/s, là giá trị cực tiểu chứ không phải cực đại."),

  tf("phy_11_48", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật có khối lượng 250 g dao động điều hòa có đồ thị động năng – thời gian với các đặc điểm: tại t = 0 động năng bằng 0,125 J và đang giảm; động năng bằng 0 lần đầu tiên tại t = π/60 s; động năng đạt cực đại 0,5 J; động năng bằng 0 lần kế tiếp tại t = 7π/60 s. Lấy π² = 10. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cơ năng của vật là 0,625 J.", false],
      ["Tần số góc của dao động là 10 rad/s.", true],
      ["Biên độ dao động của vật là 20 cm.", true],
      ["Tại thời điểm vật có động năng bằng 3 lần thế năng thì gia tốc có độ lớn là 10 m/s².", true],
    ],
    "Động năng cực đại bằng cơ năng nên W = 0,5 J (không phải 0,625 J). Hai lần liên tiếp động năng bằng 0 cách nhau T/2 = 7π/60 − π/60 = π/10 s ⇒ T = π/5 s ⇒ ω = 2π/T = 10 rad/s. W = ½mω²A² ⇒ A² = 2·0,5/(0,25·100) = 0,04 ⇒ A = 0,2 m = 20 cm. Khi Wđ = 3Wt thì Wt = W/4 ⇒ |x| = A/2 = 10 cm ⇒ |a| = ω²|x| = 100·0,1 = 10 m/s²."),

  tf("phy_11_49", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa có đồ thị li độ – thời gian với các đặc điểm: li độ cực đại là 4 cm; tại t = 0 chất điểm ở vị trí cân bằng và đang đi theo chiều dương; đồ thị cắt trục thời gian lần kế tiếp (đi xuống) tại t = 1/2 s. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Biên độ dao động của chất điểm là −4 cm.", false],
      ["Chu kì dao động của chất điểm là 1 s.", true],
      ["Pha ban đầu của dao động là 0 rad.", false],
      ["Tốc độ cực đại của chất điểm là 8π cm/s.", true],
    ],
    "Biên độ luôn dương nên A = 4 cm (không thể là −4 cm). Từ lúc qua vị trí cân bằng theo chiều dương đến lần qua vị trí cân bằng kế tiếp mất T/2 = 1/2 s nên T = 1 s và ω = 2π rad/s. Tại t = 0 vật qua vị trí cân bằng theo chiều dương nên φ = −π/2 (khác 0). Tốc độ cực đại vmax = ωA = 2π·4 = 8π cm/s."),

  tf("phy_11_50", 11, "Physics", "Dao động điều hòa",
    "Cho một vật dao động điều hòa với phương trình x = 9cos(2πt − π/6) (cm), t tính bằng giây. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Quãng đường vật đi được trong một chu kì là 36 cm.", true],
      ["Phương trình vận tốc của vật là v = 18π·cos(2π + π/3) (cm/s).", false],
      ["Gia tốc của vật tại thời điểm t = 2 s là −18√3π cm/s².", false],
      ["Pha của li độ dao động là −π/6.", false],
    ],
    "Quãng đường trong một chu kì là 4A = 36 cm. Phương trình vận tốc đúng là v = x' = −18π·sin(2πt − π/6) = 18π·cos(2πt + π/3) (cm/s); biểu thức ở ý b thiếu biến t nên không phải phương trình vận tốc. Gia tốc a = −ω²x: tại t = 2 s, x = 9cos(−π/6) = 9√3/2 cm nên a = −(2π)²·9√3/2 = −18√3π² cm/s² (không phải −18√3π). Pha của li độ là (2πt − π/6); −π/6 chỉ là pha ban đầu."),

  tf("phy_11_51", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Hai vật dao động điều hòa cùng phương, cùng tần số. Đồ thị biểu diễn động năng (hoặc thế năng) của vật (1) và vật (2) theo li độ có các đặc điểm: đồ thị (1) đạt giá trị cực đại W₀ tại x = 0 và bằng 0 tại x = ±4 ô lưới; đồ thị (2) bằng 0 tại x = 0 và đạt giá trị W₀ (bằng cực đại của đồ thị (1)) tại x = ±6 ô lưới. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cơ năng của hai vật bằng nhau.", true],
      ["Đồ thị của vật (1) mô tả sự thay đổi của thế năng theo li độ.", false],
      ["Tỉ số biên độ của hai vật là 2.", false],
      ["Khối lượng vật (1) gấp 2,5 lần khối lượng của vật (2).", false],
    ],
    "Cực đại của hai đồ thị đều bằng W₀ nên cơ năng hai vật bằng nhau. Đồ thị (1) cực đại tại x = 0 và bằng 0 tại biên nên là động năng (đồ thị (2) mới là thế năng). Biên độ A₁ = 4 ô, A₂ = 6 ô nên A₂/A₁ = 1,5 (và A₁/A₂ = 2/3), không phải 2. Cùng ω và cùng cơ năng nên m₁A₁² = m₂A₂² ⇒ m₁/m₂ = (A₂/A₁)² = 2,25, không phải 2,5."),

  tf("phy_11_52", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Động năng dao động của một con lắc lò xo được mô tả theo thế năng dao động của nó bằng đồ thị là một đoạn thẳng nối một điểm trên trục tung (Wt = 0, Wđ bằng cơ năng) với điểm Wt = 4 mJ trên trục hoành (Wđ = 0). Cho biết khối lượng của vật là 100 g, vật dao động trên quỹ đạo là một đoạn thẳng dài 8 cm. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cơ năng của vật là 4 mJ.", true],
      ["Biên độ dao động của vật là 8 cm.", false],
      ["Tần số góc của dao động là 5√2 rad/s.", true],
      ["Tại vị trí vật có động năng bằng 3 lần thế năng thì li độ của vật là |x| = 2 cm.", true],
    ],
    "Đồ thị cắt trục hoành tại Wt = 4 mJ (lúc Wđ = 0) nên cơ năng W = 4 mJ. Quỹ đạo dài 8 cm nên A = 4 cm (không phải 8 cm). Từ W = ½mω²A²: ω² = 2W/(mA²) = 2·0,004/(0,1·0,0016) = 50 ⇒ ω = 5√2 rad/s. Khi Wđ = 3Wt thì Wt = W/4 ⇒ |x| = A/2 = 2 cm."),

  sa("phy_11_53", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa với phương trình x = 5cos(4πt + π/2) cm. Li độ của chất điểm tại thời điểm t = 2,5 s là bao nhiêu cm?",
    "0",
    "Tại t = 2,5 s: pha = 4π·2,5 + π/2 = 10π + π/2 nên x = 5cos(π/2) = 0 cm.",
    ["0 cm"]),

  sa("phy_11_54", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa khi có li độ x₁ = 2 cm thì có tốc độ v₁ = 4π√3 cm/s và khi vật có li độ x₂ = 2√2 cm thì có tốc độ v₂ = 4π√2 cm/s. Biên độ dao động của vật là bao nhiêu cm?",
    "4",
    "Từ A² = x² + v²/ω² ta có x₁² + v₁²/ω² = x₂² + v₂²/ω² ⇒ 4 + 48π²/ω² = 8 + 32π²/ω² ⇒ ω² = 4π² (ω = 2π rad/s). Khi đó A² = 4 + 48π²/(4π²) = 16 ⇒ A = 4 cm.",
    ["4 cm"]),

  sa("phy_11_55", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ 5 cm, biết gia tốc cực đại của vật có giá trị 20π² cm/s². Chu kì của vật bằng bao nhiêu giây?",
    "1",
    "a_max = ω²A ⇒ ω² = 20π²/5 = 4π² ⇒ ω = 2π rad/s ⇒ T = 2π/ω = 1 s.",
    ["1 s"]),

  sa("phy_11_56", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa có phương trình li độ x = 8cos(7πt + π/6) cm. Khoảng thời gian tối thiểu để vật đi từ li độ 4 cm đến vị trí có li độ −4√3 cm là bao nhiêu giây? (Kết quả lấy sau dấu phẩy hai chữ số).",
    "0,07",
    "Dùng đường tròn lượng giác: li độ x = 4 = A/2 ứng với góc π/3; li độ −4√3 = −A√3/2 ứng với góc 5π/6 (vật đi theo chiều âm qua vị trí cân bằng). Góc quét Δφ = 5π/6 − π/3 = π/2 nên Δt = Δφ/ω = (π/2)/(7π) = 1/14 ≈ 0,07 s.",
    ["0,07 s"]),

  sa("phy_11_57", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một con lắc lò xo gồm vật nhỏ có lò xo có độ cứng 20 N/m dao động điều hòa với chu kì 2 s với li độ x = Acos(ωt + φ) (A > 0). Khi pha của dao động là π/2 thì vận tốc của vật là −20√3 cm/s. Lấy π² = 10. Khi vật đi qua vị trí có li độ 3π (cm) thì động năng của con lắc là bao nhiêu Jun?",
    "0,03",
    "ω = 2π/T = π rad/s. Khi pha là π/2: v = −ωA·sin(π/2) = −πA = −20√3 ⇒ A = 20√3/π cm. Cơ năng W = ½kA² = ½·20·(0,2√3/π)² = 0,12 J (π² = 10). Thế năng tại x = 3π cm = 0,03π m: Wt = ½·20·(0,03π)² = 0,09 J. Động năng Wđ = W − Wt = 0,03 J.",
    ["0,03 J"]),

  sa("phy_11_58", 11, "Physics", "Dao động điều hòa",
    "Vật dao động điều hòa theo phương trình x = 4cos(8πt − π/6) (cm). Khoảng thời gian ngắn nhất vật đi từ x₁ = −2√3 cm theo chiều dương đến vị trí có li độ x₂ = 2√3 cm theo chiều dương là bao nhiêu giây? Kết quả lấy sau dấu phẩy 2 chữ số.",
    "0,08",
    "Trên đường tròn lượng giác, vật đi theo chiều dương từ x = −A√3/2 (góc −5π/6) đến x = +A√3/2 (góc −π/6): góc quét Δφ = 2π/3. Vậy Δt = Δφ/ω = (2π/3)/(8π) = 1/12 ≈ 0,08 s.",
    ["0,08 s"]),

  sa("phy_11_59", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Động năng và thế năng của một vật dao động điều hòa phụ thuộc vào li độ theo đồ thị như hình vẽ, trong đó động năng của vật tại li độ x = −3 cm bằng thế năng của vật tại li độ x = +4 cm. Biên độ dao động của vật bằng bao nhiêu cm?",
    "5",
    "Wđ(−3) = ½k(A² − 9) và Wt(4) = ½k·16. Hai giá trị này bằng nhau nên A² − 9 = 16 ⇒ A = 5 cm.",
    ["5 cm"]),

  sa("phy_11_60", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa trên đoạn thẳng dài 10 cm. Trong thời gian 6,28 s vật đi được quãng đường 200 cm. Lấy π = 3,14. Tốc độ cực đại của vật đạt được bằng bao nhiêu cm/s?",
    "50",
    "A = 10/2 = 5 cm. Mỗi chu kì vật đi được 4A = 20 cm nên 200 cm ứng với 10 chu kì: T = 6,28/10 = 0,628 s ⇒ ω = 2π/T = 2·3,14/0,628 = 10 rad/s. Tốc độ cực đại vmax = ωA = 10·5 = 50 cm/s.",
    ["50 cm/s"]),

  sa("phy_11_61", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Đồ thị biểu diễn sự phụ thuộc của động năng của một con lắc lò xo vào thời gian (t tính bằng ms) có các đặc điểm: tại t = 0 động năng bằng một nửa giá trị cực đại và đang tăng; động năng đạt cực đại rồi giảm và bằng 0 lần đầu tiên tại t = 10 ms. Tần số dao động của con lắc bằng bao nhiêu Hz?",
    "37,5",
    "Động năng biến thiên tuần hoàn với chu kì T' = T/2. Từ lúc Wđ bằng một nửa cực đại (đang tăng) đến lúc Wđ = 0 lần đầu là 3/4 chu kì của động năng: (3/4)T' = 10 ms ⇒ T' = 40/3 ms ⇒ T = 2T' = 80/3 ms. Tần số f = 1/T = 37,5 Hz.",
    ["37,5 Hz"]),

  sa("phy_11_62", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Đồ thị biểu diễn sự biến thiên động năng của một vật dao động điều hòa có các đặc điểm: tại t = 0 động năng bằng 20 mJ và đang tăng; động năng đạt cực đại 40 mJ lần đầu tiên tại t = 1/16 s. Tìm thời điểm (tính theo s) để động năng bằng thế năng của vật lần thứ 3 kể từ thời điểm ban đầu (tính cả t = 0 là lần thứ nhất).",
    "0,25",
    "Từ lúc Wđ = 20 mJ (bằng một nửa cực đại, đang tăng) đến lúc cực đại mất 1/4 chu kì của động năng nên T' = 4·(1/16) = 0,25 s. Động năng bằng thế năng khi Wđ = 20 mJ, các lần cách nhau T'/2: t = 0 (lần 1), t = 0,125 s (lần 2) và t = 0,25 s (lần 3).",
    ["0,25 s"]),

  mc("phy_11_63", 11, "Physics", "Dao động điều hòa",
    "Dao động điều hòa là",
    ["dao động được mô tả bằng định luật hàm sin hay hàm cos theo thời gian.", "chuyển động tuần hoàn trong không gian, lặp đi lặp lại xung quanh một vị trí cố định.", "dao động có năng lượng không đổi theo thời gian.", "dao động được lặp đi lặp lại như cũ sau những khoảng thời gian xác định."], "A",
    "Dao động điều hòa là dao động mà li độ biến thiên theo định luật dạng cos (hoặc sin) của thời gian. B và D mô tả dao động tuần hoàn nói chung; năng lượng không đổi chưa đủ để kết luận dao động là điều hòa."),

  mc("phy_11_64", 11, "Physics", "Dao động điều hòa",
    "Biên độ dao động của một vật dao động điều hòa là",
    ["quãng đường vật đi trong 1 chu kì dao động.", "quãng đường vật đi được trong nửa chu kì dao động.", "độ dời lớn nhất của vật trong quá trình dao động.", "độ dài quỹ đạo chuyển động của vật."], "C",
    "Biên độ A là độ dời (li độ) lớn nhất của vật so với vị trí cân bằng. Quãng đường trong 1 chu kì là 4A, trong nửa chu kì là 2A, độ dài quỹ đạo là 2A."),

  mc("phy_11_65", 11, "Physics", "Dao động điều hòa",
    "Khi một chất điểm dao động điều hòa thì li độ của chất điểm là",
    ["một hàm sin của thời gian.", "một hàm tan của thời gian.", "một hàm bậc nhất của thời gian.", "một hàm bậc hai của thời gian."], "A",
    "Li độ x = Acos(ωt + φ) = Asin(ωt + φ + π/2) là một hàm sin (hoặc cosin) của thời gian."),

  mc("phy_11_66", 11, "Physics", "Dao động điều hòa",
    "Phát biểu nào sau đây đúng?",
    ["Dao động tuần hoàn là dao động điều hòa.", "Dao động cơ điều hòa là dao động có li độ biến thiên theo thời gian được biểu thị bằng quy luật dạng sin (hay cosin).", "Đồ thị biểu diễn li độ của dao động cơ tuần hoàn biến thiên theo thời gian luôn là một đường hình sin.", "Biên độ của dao động cơ điều hòa thì không thay đổi theo thời gian, còn biên độ của dao động cơ tuần hoàn thì thay đổi theo thời gian."], "B",
    "Dao động điều hòa chỉ là một trường hợp riêng của dao động tuần hoàn (A sai); không phải dao động tuần hoàn nào cũng có đồ thị hình sin (C sai); biên độ của dao động tuần hoàn cũng không đổi theo thời gian (D sai)."),

  mc("phy_11_67", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa với phương trình x = Acos(ωt + φ), trong đó A, ω là các hằng số dương. Pha của dao động ở thời điểm t là",
    ["ωt + φ.", "ω.", "φ.", "ωt."], "A",
    "Đại lượng (ωt + φ) là pha của dao động tại thời điểm t; φ là pha ban đầu (pha tại t = 0)."),

  mc("phy_11_68", 11, "Physics", "Dao động điều hòa",
    "Trong phương trình dao động điều hòa x = Acos(ωt + φ) đại lượng (ωt + φ) được gọi là",
    ["biên độ dao động.", "tần số của dao động.", "pha của dao động.", "chu kì của dao động."], "C",
    "(ωt + φ) là pha của dao động tại thời điểm t, xác định trạng thái dao động của vật."),

  mc("phy_11_69", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với phương trình x = Acos(ωt + φ), trong đó ω là",
    ["biên độ của dao động.", "chu kì của dao động.", "tần số góc của dao động.", "tần số của dao động."], "C",
    "ω là tần số góc của dao động (đơn vị rad/s), liên hệ với chu kì và tần số: ω = 2π/T = 2πf."),

  mc("phy_11_70", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa trên trục Ox quanh vị trí cân bằng O. Gọi A, ω và φ lần lượt là biên độ, tần số góc và pha ban đầu của dao động. Biểu thức li độ của vật theo thời gian t là",
    ["x = Acos(ωt + φ).", "x = ωAcos(tφ + A).", "x = tcos(ωA + φ).", "x = φcos(ωA + t)."], "A",
    "Phương trình dao động điều hòa có dạng x = Acos(ωt + φ)."),

  mc("phy_11_71", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động có phương trình x = 10cos(15t + π) (x tính bằng cm, t tính bằng giây). Chất điểm này dao động với tần số góc là",
    ["20 rad/s.", "10 rad/s.", "5 rad/s.", "15 rad/s."], "D",
    "So sánh với x = Acos(ωt + φ) ta được ω = 15 rad/s."),

  mc("phy_11_72", 11, "Physics", "Dao động điều hòa",
    "Một vật nhỏ dao động với phương trình x = 5cos(ωt + 0,5π) cm. Pha ban đầu của dao động là",
    ["π.", "0,5π.", "0,25π.", "1,5π."], "B",
    "Pha ban đầu là φ = 0,5π, tức giá trị của pha tại t = 0."),

  mc("phy_11_73", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động có phương trình x = 6cosωt (cm). Dao động của chất điểm có biên độ là",
    ["2 cm.", "6 cm.", "3 cm.", "12 cm."], "B",
    "So sánh với x = Acos(ωt + φ) ta được A = 6 cm."),

  mc("phy_11_74", 11, "Physics", "Dao động điều hòa",
    "Trong dao động điều hòa thì nhóm đại lượng nào sau đây không thay đổi theo thời gian?",
    ["Li độ và thời gian.", "Biên độ và tần số góc.", "Li độ và pha ban đầu.", "Tần số và pha dao động."], "B",
    "Biên độ A và tần số góc ω (cùng pha ban đầu φ) là các hằng số; còn li độ x và pha (ωt + φ) thay đổi theo thời gian."),

  mc("phy_11_75", 11, "Physics", "Dao động điều hòa",
    "Nếu bỏ qua lực cản, chuyển động nào sau đây là dao động tự do?",
    ["Một con muỗi đang đập cánh.", "Tòa nhà rung chuyển trong trận động đất.", "Mặt trống rung động sau khi gõ.", "Bông hoa rung rinh trong gió nhẹ."], "C",
    "Dao động tự do là dao động chỉ chịu tác dụng của nội lực của hệ sau khi được kích thích ban đầu (mặt trống sau khi gõ). Các trường hợp còn lại có ngoại lực tác dụng liên tục (cánh muỗi, động đất, gió) nên không phải dao động tự do."),

  mc("phy_11_76", 11, "Physics", "Dao động điều hòa",
    "Phương trình x = Acos(ωt − π/3) cm biểu diễn dao động điều hòa của một chất điểm. Gốc thời gian đã được chọn khi",
    ["li độ x = A/2 và chất điểm đang chuyển động hướng về vị trí cân bằng.", "li độ x = A/2 và chất điểm đang chuyển động hướng ra xa vị trí cân bằng.", "li độ x = −A/2 và chất điểm đang chuyển động hướng về vị trí cân bằng.", "li độ x = −A/2 và chất điểm đang chuyển động hướng ra xa vị trí cân bằng."], "B",
    "Tại t = 0: x = Acos(−π/3) = A/2. Vận tốc v = −ωA·sin(−π/3) = ωA√3/2 > 0 nên vật đang đi theo chiều dương, ra xa vị trí cân bằng (về phía biên +A)."),

  mc("phy_11_77", 11, "Physics", "Dao động điều hòa",
    "Phương trình dao động của một vật dao động điều hòa có dạng x = Acos(ωt + π/2) cm. Gốc thời gian đó được chọn là lúc chất điểm",
    ["đi qua vị trí cân bằng theo chiều âm.", "có li độ x = +A.", "có li độ x = −A.", "đi qua vị trí cân bằng theo chiều dương."], "A",
    "Tại t = 0: x = Acos(π/2) = 0 (vật ở vị trí cân bằng) và v = −ωA·sin(π/2) = −ωA < 0, nên vật đi qua vị trí cân bằng theo chiều âm."),

  mc("phy_11_78", 11, "Physics", "Dao động điều hòa",
    "Pít-tông của một động cơ đốt trong dao động trên một đoạn thẳng dài 16 cm và làm cho trục khuỷu của động cơ quay đều. Biên độ dao động của một điểm trên mặt pít-tông bằng",
    ["16 cm.", "8 cm.", "4 cm.", "32 cm."], "B",
    "Chiều dài quỹ đạo L = 2A = 16 cm nên A = 8 cm."),

  mc("phy_11_79", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa có quỹ đạo là một đoạn thẳng dài 30 cm. Biên độ dao động của chất điểm là",
    ["30 cm.", "15 cm.", "−15 cm.", "7,5 cm."], "B",
    "L = 2A = 30 cm nên A = 15 cm (biên độ luôn dương)."),

  mc("phy_11_80", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với phương trình x = −5cos(4πt) (cm). Biên độ và pha ban đầu của dao động lần lượt là",
    ["5 cm, 0 rad.", "5 cm, 4π rad.", "−5 cm, 4π rad.", "5 cm, π rad."], "D",
    "x = −5cos(4πt) = 5cos(4πt + π) cm (vì −cosα = cos(α + π)). Vậy A = 5 cm và φ = π rad."),

  mc("phy_11_81", 11, "Physics", "Dao động điều hòa",
    "Một vật nhỏ dao động điều hòa theo phương trình x = Acos10t (t tính bằng s). Tại t = 2 s, pha của dao động là",
    ["5 rad.", "10 rad.", "40 rad.", "20 rad."], "D",
    "Pha của dao động là 10t = 10·2 = 20 rad."),

  mc("phy_11_82", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa với phương trình li độ x = 2cos(2πt + π/2) (cm) (x tính bằng cm, t tính bằng s). Tại thời điểm t = 1/4 s chất điểm có li độ bằng",
    ["2 cm.", "−√3 cm.", "√3 cm.", "−2 cm."], "D",
    "Tại t = 1/4 s: pha = 2π·(1/4) + π/2 = π nên x = 2cosπ = −2 cm."),

  mc("phy_11_83", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa dọc theo trục Ox với phương trình x = Acosωt. Nếu chọn gốc tọa độ O tại vị trí cân bằng của vật thì gốc thời gian t = 0 là lúc vật",
    ["ở vị trí li độ cực đại thuộc phần dương của trục Ox.", "qua vị trí cân bằng O ngược chiều dương của trục Ox.", "ở vị trí li độ cực đại thuộc phần âm của trục Ox.", "qua vị trí cân bằng O theo chiều dương của trục Ox."], "A",
    "Tại t = 0: x = Acos0 = A, tức vật đang ở biên dương."),

  mc("phy_11_84", 11, "Physics", "Dao động điều hòa",
    "Chọn phát biểu sai: Dao động điều hòa",
    ["cũng có tính chất tuần hoàn: chuyển động mà trạng thái chuyển động của vật được lặp lại như cũ sau những khoảng thời gian bằng nhau.", "là chuyển động của một vật dưới tác dụng của một lực không đổi.", "là hình chiếu của chuyển động tròn đều lên một đường thẳng nằm trong mặt phẳng quỹ đạo.", "là chuyển động có phương trình mô tả bởi hình sin hoặc cosin theo thời gian."], "B",
    "Trong dao động điều hòa, lực kéo về F = −kx biến thiên theo li độ chứ không phải là lực không đổi."),

  mc("phy_11_85", 11, "Physics", "Dao động điều hòa",
    "Hình chiếu của một chuyển động tròn đều lên một đường kính",
    ["là một dao động điều hòa.", "được xem là một dao động điều hòa.", "là một dao động tuần hoàn.", "không được xem là một dao động điều hòa."], "A",
    "Hình chiếu của chất điểm chuyển động tròn đều lên một đường kính của quỹ đạo có li độ biến thiên theo hàm cosin (hoặc sin) của thời gian nên là một dao động điều hòa."),

  mc("phy_11_86", 11, "Physics", "Dao động điều hòa",
    "Vật dao động điều hòa theo trục Ox. Phát biểu nào sau đây đúng?",
    ["Quỹ đạo chuyển động của vật là một đoạn thẳng.", "Lực kéo về tác dụng vào vật không đổi.", "Quỹ đạo chuyển động của vật là một đường hình cos.", "Li độ của vật tỉ lệ với thời gian dao động."], "A",
    "Vật chuyển động trên trục Ox nên quỹ đạo là một đoạn thẳng. Lực kéo về F = −kx thay đổi theo li độ; đồ thị li độ theo thời gian mới có dạng hình cosin; li độ là hàm cosin của t chứ không tỉ lệ với t."),

  mc("phy_11_87", 11, "Physics", "Dao động điều hòa",
    "Trong dao động điều hòa, đại lượng nào sau đây không có giá trị âm?",
    ["Pha dao động.", "Pha ban đầu.", "Li độ.", "Biên độ."], "D",
    "Biên độ A là giá trị cực đại của li độ nên luôn dương; còn pha, pha ban đầu và li độ đều có thể mang giá trị âm."),

  mc("phy_11_88", 11, "Physics", "Dao động điều hòa",
    "Đồ thị li độ theo thời gian của dao động điều hòa là một",
    ["đoạn thẳng.", "đường thẳng.", "đường hình sin.", "đường tròn."], "C",
    "Vì x = Acos(ωt + φ) nên đồ thị li độ theo thời gian là một đường hình sin."),

  mc("phy_11_89", 11, "Physics", "Dao động điều hòa",
    "Phát biểu nào sau đây là sai?",
    ["Dao động tuần hoàn là dao động mà trạng thái chuyển động được lặp đi lặp lại như cũ sau những khoảng thời gian bằng nhau.", "Dao động là sự chuyển động có giới hạn trong không gian, lặp đi lặp lại nhiều lần quanh một vị trí cân bằng.", "Pha ban đầu φ là đại lượng xác định vị trí của vật ở thời điểm t = 0.", "Dao động điều hòa được coi như hình chiếu của chuyển động tròn đều xuống một đường thẳng nằm trong mặt phẳng quỹ đạo."], "C",
    "Pha ban đầu φ xác định trạng thái dao động của vật ở thời điểm t = 0 (cả li độ lẫn chiều chuyển động), không chỉ riêng vị trí, nên phát biểu C chưa đúng."),

  mc("phy_11_90", 11, "Physics", "Dao động điều hòa",
    "Dao động điều hòa có thể được coi như hình chiếu của một chuyển động tròn đều xuống một",
    ["đường thẳng bất kì.", "đường thẳng vuông góc với mặt phẳng quỹ đạo.", "đường thẳng xiên góc với mặt phẳng quỹ đạo.", "đường thẳng nằm trong mặt phẳng quỹ đạo."], "D",
    "Hình chiếu của chuyển động tròn đều lên một đường thẳng nằm trong mặt phẳng quỹ đạo (ví dụ một đường kính) là một dao động điều hòa."),

  mc("phy_11_91", 11, "Physics", "Dao động điều hòa",
    "Chuyển động nào sau đây không phải là dao động cơ học?",
    ["Chuyển động đung đưa của con lắc của đồng hồ.", "Chuyển động đung đưa của lá cây.", "Chuyển động nhấp nhô của phao trên mặt nước.", "Chuyển động của ôtô trên đường."], "D",
    "Ôtô chạy trên đường không lặp đi lặp lại quanh một vị trí cân bằng nên không phải là dao động cơ học."),

  mc("phy_11_92", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa theo phương trình x = Acos(ωt + φ) với A, ω, φ là hằng số thì pha của dao động",
    ["không đổi theo thời gian.", "biến thiên điều hòa theo thời gian.", "là hàm bậc nhất với thời gian.", "là hàm bậc hai của thời gian."], "C",
    "Pha (ωt + φ) là hàm bậc nhất của thời gian t (với ω, φ là các hằng số)."),

  mc("phy_11_93", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động theo phương trình x = 10cos2πt (cm) có pha tại thời điểm t là",
    ["2π.", "2πt.", "0.", "π."], "B",
    "Pha của dao động tại thời điểm t là 2πt (pha ban đầu φ = 0)."),

  mc("phy_11_94", 11, "Physics", "Dao động điều hòa",
    "Cường độ dòng điện i = 2cos100πt (A) có pha tại thời điểm t là",
    ["50πt.", "100πt.", "0.", "70πt."], "B",
    "Pha tại thời điểm t là đối số của hàm cosin: 100πt."),

  mc("phy_11_95", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa trên trục Ox. Đồ thị vận tốc v theo thời gian t có đặc điểm: bắt đầu từ gốc tọa độ (v = 0 tại t = 0), tăng đến cực đại, giảm qua 0 rồi xuống cực tiểu tại t = 0,75 s, sau đó tăng trở lại về 0 sau đúng một chu kì. Tần số của dao động là",
    ["1,0 Hz.", "2,0 Hz.", "1,5 Hz.", "0,5 Hz."], "A",
    "Từ lúc bắt đầu (v = 0 và đang tăng) đến lúc v đạt cực tiểu là 3/4 chu kì: (3/4)T = 0,75 s ⇒ T = 1 s ⇒ f = 1/T = 1,0 Hz."),

  mc("phy_11_96", 11, "Physics", "Dao động điều hòa",
    "Đồ thị dao động điều hòa của một vật có các đặc điểm: li độ cực đại là 4 cm; tại t = 0 li độ x = 2 cm và đang giảm; li độ đạt giá trị cực tiểu −4 cm lần đầu tiên tại t = 0,4 s. Phương trình dao động của vật là",
    ["x = 4cos(5πt/3 + π/3) (cm).", "x = 4cos(5πt/3 − π/3) (cm).", "x = 4cos(5πt/6 + π/3) (cm).", "x = 4cos(5πt/6 − π/3) (cm)."], "A",
    "A = 4 cm. Tại t = 0: x = 2 = 4cosφ nên cosφ = 1/2; li độ đang giảm nên φ = π/3. Li độ đạt cực tiểu (pha bằng π) lần đầu tại t = 0,4 s: 0,4ω + π/3 = π ⇒ ω = (2π/3)/0,4 = 5π/3 rad/s. Vậy x = 4cos(5πt/3 + π/3) cm."),

  mc("phy_11_97", 11, "Physics", "Dao động điều hòa",
    "Đồ thị biểu diễn sự phụ thuộc của li độ x vào thời gian của một vật dao động điều hòa. Điểm P trên trục thời gian ứng với thời điểm vật ở biên âm (li độ cực tiểu) lần đầu tiên, điểm R ứng với thời điểm vật ở biên dương (li độ cực đại) liền sau đó. Đoạn PR trên trục thời gian t biểu thị",
    ["một phần hai chu kì.", "hai lần tần số.", "một phần hai tần số.", "hai lần chu kì."], "A",
    "Khoảng thời gian để vật đi từ biên âm sang biên dương liền sau là nửa chu kì, nên đoạn PR biểu thị T/2."),

  mc("phy_11_98", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa trên trục Ox. Đồ thị li độ x theo thời gian t có đặc điểm: tại t = 0 vật ở vị trí cân bằng và đang đi theo chiều âm (đồ thị đi xuống); đồ thị cắt trục thời gian lần kế tiếp (đi lên) tại t = 0,2 s. Pha ban đầu của dao động là",
    ["0,5π rad.", "−0,5π rad.", "0,25π rad.", "π rad."], "A",
    "Tại t = 0: x = Acosφ = 0 ⇒ φ = ±π/2; vật đi theo chiều âm nên v = −ωA·sinφ < 0 ⇒ sinφ > 0 ⇒ φ = +π/2 = 0,5π rad."),

  mc("phy_11_99", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa có đồ thị gia tốc a theo thời gian t với các đặc điểm: lúc đầu a > 0, tăng đến cực đại rồi giảm; a = 0 tại t₁ (a đổi dấu từ dương sang âm); a đạt giá trị cực tiểu tại t₂; a = 0 tại t₃ (a đổi dấu từ âm sang dương); tại t₄ gia tốc dương và đang giảm. Tại thời điểm",
    ["t₁ chất điểm bắt đầu chuyển động chậm dần.", "t₂ vận tốc chất điểm cực đại.", "t₃ chất điểm bắt đầu chuyển động nhanh dần.", "t₄ chất điểm có thế năng tăng."], "A",
    "Vì a = −ω²x nên a đổi dấu từ dương sang âm tại t₁ nghĩa là vật qua vị trí cân bằng theo chiều dương: trước đó a và v cùng dấu (nhanh dần), sau đó a và v trái dấu nên vật bắt đầu chuyển động chậm dần. Tại t₂ gia tốc cực tiểu nên vật ở biên dương và v = 0. Tại t₃ vật qua vị trí cân bằng theo chiều âm, sau đó a > 0 và v < 0 nên bắt đầu chậm dần. Tại t₄ a > 0 và |a| đang giảm nên |x| đang giảm, vật đang về vị trí cân bằng, thế năng giảm."),

  mc("phy_11_100", 11, "Physics", "Dao động điều hòa",
    "Hình vẽ là đồ thị biểu diễn độ dời của dao động x theo thời gian t của một vật dao động điều hòa, có các đặc điểm: li độ cực đại là 4 cm; tại t = 0 vật ở li độ −2 cm và đang đi xuống về phía biên âm; đồ thị cắt trục thời gian đi lên lần đầu tại t = 1/12 s và cắt trục thời gian đi xuống lần kế tiếp tại t = 2,2/12 s. Phương trình dao động của vật là",
    ["x = 4cos(10πt + 2π/3) (cm).", "x = 4cos(20πt + 2π/3) (cm).", "x = 4cos(10πt + 5π/6) (cm).", "x = 4cos(20πt − π/3) (cm)."], "A",
    "A = 4 cm. Hai lần liên tiếp qua vị trí cân bằng (đi lên rồi đi xuống) cách nhau T/2 = 2,2/12 − 1/12 = 0,1 s ⇒ T = 0,2 s ⇒ ω = 10π rad/s. Tại t = 0: x = −2 = 4cosφ ⇒ cosφ = −1/2 và vật đang đi xuống nên φ = 2π/3. Vậy x = 4cos(10πt + 2π/3) cm."),

    mc("phy_11_101", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa theo phương trình x = 6cos(4πt − π/3) (cm). Biên độ và pha ban đầu của dao động lần lượt là",
    ["6 cm và 4π rad.", "6 cm và −π/3 rad.", "−6 cm và π/3 rad.", "12 cm và −π/3 rad."], "B",
    "So sánh với x = Acos(ωt + φ): A = 6 cm và φ = −π/3 rad."),

  mc("phy_11_102", 11, "Physics", "Dao động điều hòa",
    "Mối liên hệ đúng giữa tần số góc ω, chu kì T và tần số f của một dao động điều hòa là",
    ["ω = 2πT = 2π/f.", "ω = T/(2π) = 2πf.", "ω = 2π/T = 2πf.", "ω = 1/T = 2πf."], "C",
    "Tần số góc ω = 2π/T = 2πf, trong đó T là chu kì và f = 1/T là tần số."),

  mc("phy_11_103", 11, "Physics", "Dao động điều hòa",
    "Hai dao động điều hòa cùng tần số có phương trình x₁ = A₁cos(ωt + π/6) và x₂ = A₂cos(ωt − π/3). Độ lệch pha giữa hai dao động này là",
    ["π/6 rad.", "π/3 rad.", "π/2 rad.", "2π/3 rad."], "C",
    "Độ lệch pha Δφ = φ₁ − φ₂ = π/6 − (−π/3) = π/2 rad."),

  mc("phy_11_104", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ A và tần số góc ω. Khi vật đi qua vị trí cân bằng, tốc độ của vật đạt giá trị cực đại bằng",
    ["ωA.", "ω²A.", "0,5ωA.", "2ωA."], "A",
    "Tại vị trí cân bằng tốc độ của vật cực đại: vmax = ωA."),

  mc("phy_11_105", 11, "Physics", "Dao động điều hòa",
    "Gia tốc của một chất điểm dao động điều hòa luôn",
    ["cùng pha với li độ và hướng ra xa vị trí cân bằng.", "ngược pha với li độ và luôn hướng về vị trí cân bằng.", "sớm pha π/2 so với li độ và có độ lớn không đổi.", "trễ pha π/2 so với vận tốc và có giá trị cực đại tại vị trí cân bằng."], "B",
    "Gia tốc a = −ω²x nên ngược pha với li độ và luôn hướng về vị trí cân bằng."),

  mc("phy_11_106", 11, "Physics", "Dao động điều hòa",
    "Trong dao động điều hòa, đại lượng nào sau đây sớm pha π/2 so với li độ x?",
    ["Gia tốc a.", "Lực kéo về F.", "Vận tốc v.", "Động năng Wđ."], "C",
    "Vận tốc v = −ωAsin(ωt + φ) = ωAcos(ωt + φ + π/2) nên sớm pha π/2 so với li độ; gia tốc và lực kéo về ngược pha với li độ."),

  mc("phy_11_107", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ A = 8 cm và tần số góc ω = 5 rad/s. Khi vật ở vị trí có li độ x = 4√3 cm thì tốc độ của vật bằng",
    ["20 cm/s.", "20√3 cm/s.", "40 cm/s.", "10 cm/s."], "A",
    "|v| = ω√(A² − x²) = 5·√(64 − 48) = 5·4 = 20 cm/s."),

  mc("phy_11_108", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa dọc theo trục Ox. Khi qua vị trí cân bằng tốc độ của vật là 20 cm/s, khi ở vị trí biên độ lớn gia tốc của vật là 80 cm/s². Biên độ dao động của chất điểm là",
    ["4 cm.", "5 cm.", "10 cm.", "2,5 cm."], "B",
    "vmax = ωA = 20 cm/s và amax = ω²A = 80 cm/s². Suy ra ω = amax/vmax = 4 rad/s và A = vmax/ω = 5 cm."),

  mc("phy_11_109", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật dao động điều hòa với tần số f = 2,5 Hz. Động năng và thế năng của vật biến thiên tuần hoàn với tần số bằng",
    ["1,25 Hz.", "2,5 Hz.", "5,0 Hz.", "10,0 Hz."], "C",
    "Động năng và thế năng biến thiên tuần hoàn với tần số gấp đôi tần số dao động: f' = 2f = 5,0 Hz."),

  mc("phy_11_110", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Khi biên độ của một vật dao động điều hòa tăng lên gấp đôi (giữ nguyên khối lượng và tần số) thì cơ năng của vật sẽ",
    ["tăng lên 2 lần.", "tăng lên 4 lần.", "giảm đi 2 lần.", "không thay đổi."], "B",
    "Cơ năng W = ½mω²A² tỉ lệ với A²: biên độ tăng gấp đôi thì cơ năng tăng 4 lần."),

  mc("phy_11_111", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Trong dao động điều hòa với biên độ A, vị trí mà tại đó động năng của vật bằng 3 lần thế năng có li độ là",
    ["x = ±A/2.", "x = ±A√2/2.", "x = ±A√3/2.", "x = ±A/4."], "A",
    "Wđ = 3Wt nên Wt = W/4, tức ½kx² = ¼·½kA² ⇒ x = ±A/2."),

  mc("phy_11_112", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Tại vị trí có li độ x = A√3/2, tỉ số giữa thế năng và động năng của vật dao động điều hòa bằng",
    ["1/3.", "1/2.", "3.", "4."], "C",
    "Wt/Wđ = x²/(A² − x²) = (3/4)/(1/4) = 3."),

  mc("phy_11_113", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ A = 5 cm và chu kì T = 0,4 s. Quãng đường vật đi được trong khoảng thời gian 0,6 s là",
    ["15 cm.", "20 cm.", "30 cm.", "40 cm."], "C",
    "0,6 s = 1,5T nên quãng đường s = 1,5·4A = 6A = 30 cm."),

  mc("phy_11_114", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ 4 cm, tần số góc 10 rad/s. Chọn gốc thời gian t = 0 là lúc vật đi qua vị trí cân bằng theo chiều âm của trục tọa độ. Phương trình dao động của vật là",
    ["x = 4cos(10t − π/2) (cm).", "x = 4cos(10t + π/2) (cm).", "x = 4cos(10t) (cm).", "x = 4cos(10t + π) (cm)."], "B",
    "Tại t = 0 vật qua vị trí cân bằng theo chiều âm: x = 0 và v < 0 nên φ = +π/2. Vậy x = 4cos(10t + π/2) cm."),

  mc("phy_11_115", 11, "Physics", "Dao động điều hòa",
    "Trên đồ thị li độ – thời gian (x – t) của một vật dao động điều hòa, khoảng thời gian giữa hai đỉnh cực đại liên tiếp là 0,5 s và khoảng cách thẳng đứng từ đỉnh cực đại đến đáy cực tiểu là 16 cm. Biên độ và tần số dao động là",
    ["16 cm và 2 Hz.", "8 cm và 0,5 Hz.", "8 cm và 2 Hz.", "16 cm và 0,5 Hz."], "C",
    "Hai đỉnh cực đại liên tiếp cách nhau một chu kì: T = 0,5 s ⇒ f = 2 Hz. Khoảng cách từ đỉnh đến đáy bằng 2A = 16 cm ⇒ A = 8 cm."),

  mc("phy_11_116", 11, "Physics", "Dao động điều hòa",
    "Đồ thị vận tốc – thời gian (v – t) của một vật dao động điều hòa cắt trục tung tại giá trị v₀ = −vmax. Pha ban đầu của li độ x là",
    ["0 rad.", "π/2 rad.", "−π/2 rad.", "π rad."], "B",
    "v = −ωAsin(ωt + φ). Tại t = 0, v = −vmax nên sinφ = 1 ⇒ φ = π/2 rad."),

  mc("phy_11_117", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Nguyên nhân làm cho dao động của một con lắc trong không khí bị tắt dần là do",
    ["trọng lực tác dụng lên vật nặng.", "lực đàn hồi của dây treo.", "lực cản của môi trường làm tiêu hao cơ năng.", "khối lượng của vật nặng quá lớn."], "C",
    "Lực cản của môi trường (ma sát, sức cản không khí) làm tiêu hao cơ năng nên biên độ giảm dần."),

  mc("phy_11_118", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Thiết bị nào sau đây ứng dụng trực tiếp dao động tắt dần có lợi trong đời sống?",
    ["Con lắc đồng hồ quả lắc.", "Hệ thống giảm xóc của ô tô, xe máy.", "Hộp đàn của đàn guitar thùng.", "Cái võng đưa tự động dùng điện."], "B",
    "Hệ thống giảm xóc ứng dụng dao động tắt dần có lợi: làm dao động của thân xe tắt nhanh sau khi gặp ổ gà. Đồng hồ quả lắc và võng tự động là dao động duy trì."),

  mc("phy_11_119", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Một hệ dao động có tần số riêng f₀ = 4 Hz chịu tác dụng của ngoại lực cưỡng bức tuần hoàn F = F₀cos(10πt) (N). Khi dao động ổn định, tần số dao động của hệ là",
    ["4 Hz.", "5 Hz.", "9 Hz.", "10 Hz."], "B",
    "Khi dao động ổn định, tần số của hệ bằng tần số của ngoại lực: f = 10π/(2π) = 5 Hz."),

  mc("phy_11_120", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Hiện tượng cộng hưởng cơ xảy ra khi",
    ["lực cản của môi trường bằng không.", "biên độ ngoại lực cưỡng bức đạt giá trị lớn nhất.", "tần số của ngoại lực cưỡng bức bằng tần số dao động riêng của hệ.", "chu kì ngoại lực lớn gấp đôi chu kì dao động riêng của hệ."], "C",
    "Cộng hưởng cơ xảy ra khi tần số của ngoại lực cưỡng bức bằng tần số dao động riêng của hệ; khi đó biên độ dao động cưỡng bức đạt cực đại."),

  tf("phy_11_121", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa dọc theo trục Ox với phương trình x = 10cos(2πt + π/6) (cm), trong đó t tính bằng giây. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Chu kì dao động của chất điểm là 1 s.", true],
      ["Tại thời điểm ban đầu t = 0, chất điểm có li độ x₀ = 5 cm.", false],
      ["Tốc độ cực đại của chất điểm là 20π cm/s.", true],
      ["Gia tốc của chất điểm tại vị trí biên dương có giá trị bằng 40π² cm/s².", false],
    ],
    "T = 2π/ω = 1 s (a đúng). Tại t = 0: x₀ = 10cos(π/6) ≈ 8,66 cm (b sai). vmax = ωA = 20π cm/s (c đúng). Tại biên dương gia tốc a = −ω²A = −40π² cm/s² (âm), không phải +40π² (d sai)."),

  tf("phy_11_122", 11, "Physics", "Dao động điều hòa",
    "Khảo sát dao động điều hòa của một vật có khối lượng m = 100 g. Bảng số liệu thực nghiệm ghi nhận được li độ x và tốc độ v tại hai thời điểm khác nhau như sau: tại t₁ có x₁ = 3 cm, v₁ = 40 cm/s; tại t₂ có x₂ = 4 cm, v₂ = 30 cm/s. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Tần số góc của dao động là ω = 10 rad/s.", true],
      ["Biên độ dao động của vật bằng 7 cm.", false],
      ["Độ lớn gia tốc cực đại của vật là 5 m/s².", true],
      ["Cơ năng dao động của vật bằng 0,125 J.", false],
    ],
    "Từ A² = x² + v²/ω²: 9 + 1600/ω² = 16 + 900/ω² ⇒ ω² = 100, ω = 10 rad/s (a đúng) và A² = 9 + 16 = 25 ⇒ A = 5 cm (b sai). amax = ω²A = 500 cm/s² = 5 m/s² (c đúng). W = ½mω²A² = ½·0,1·100·0,05² = 0,0125 J, không phải 0,125 J (d sai)."),

  tf("phy_11_123", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Xét sự chuyển hóa năng lượng của một con lắc lò xo dao động điều hòa không ma sát trên mặt phẳng nằm ngang. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi vật đi từ vị trí biên về vị trí cân bằng, động năng tăng dần và thế năng giảm dần.", true],
      ["Tại vị trí cân bằng, thế năng của con lắc đạt giá trị cực đại.", false],
      ["Tổng động năng và thế năng của con lắc tại mọi thời điểm luôn bằng hằng số.", true],
      ["Trong một chu kì dao động, có 2 lần động năng bằng thế năng.", false],
    ],
    "Từ biên về vị trí cân bằng động năng tăng, thế năng giảm (a đúng). Tại vị trí cân bằng thế năng bằng 0 (b sai). Cơ năng được bảo toàn (c đúng). Trong một chu kì có 4 lần động năng bằng thế năng (d sai)."),

  tf("phy_11_124", 11, "Physics", "Dao động điều hòa",
    "Khi phân tích mối quan hệ về pha giữa các đại lượng trong dao động điều hòa của một vật: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Vận tốc biến thiên điều hòa cùng tần số với li độ.", true],
      ["Gia tốc trễ pha π/2 so với vận tốc.", false],
      ["Lực kéo về luôn cùng pha với gia tốc và ngược pha với li độ.", true],
      ["Khi vật chuyển động theo chiều dương từ biên âm về vị trí cân bằng thì v > 0 và a > 0.", true],
    ],
    "Vận tốc biến thiên cùng tần số với li độ (a đúng). Gia tốc sớm pha π/2 so với vận tốc, không phải trễ pha (b sai). F = ma = −kx nên lực kéo về cùng pha với gia tốc và ngược pha với li độ (c đúng). Từ biên âm về vị trí cân bằng: x < 0 nên a = −ω²x > 0, vật đi theo chiều dương nên v > 0 (d đúng)."),

  tf("phy_11_125", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Một nhóm học sinh làm thí nghiệm cho cùng một con lắc lò xo dao động lần lượt trong ba môi trường: không khí, nước tinh khiết và dầu nhớt với cùng biên độ ban đầu. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Dao động của con lắc trong cả ba môi trường đều là dao động tắt dần.", true],
      ["Con lắc trong môi trường dầu nhớt tắt dần chậm nhất.", false],
      ["Độ giảm cơ năng sau mỗi chu kì phụ thuộc vào độ lớn lực cản môi trường.", true],
      ["Để duy trì dao động của con lắc trong không khí với biên độ không đổi, ta cần cung cấp năng lượng đúng bằng phần năng lượng tiêu hao sau mỗi chu kì.", true],
    ],
    "Cả ba môi trường đều có lực cản nên dao động đều tắt dần (a đúng). Dầu nhớt có lực cản lớn nhất nên con lắc tắt dần nhanh nhất (b sai). Độ giảm cơ năng mỗi chu kì phụ thuộc lực cản (c đúng). Duy trì dao động bằng cách bù đúng phần năng lượng mất đi sau mỗi chu kì (d đúng)."),

  tf("phy_11_126", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Khi khảo sát đường cong cộng hưởng biểu diễn sự phụ thuộc của biên độ dao động cưỡng bức A vào tần số ngoại lực f: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Đỉnh của đường cong cộng hưởng ứng với giá trị tần số f = f₀.", true],
      ["Khi lực cản môi trường càng nhỏ thì đỉnh cộng hưởng càng nhọn và cao.", true],
      ["Khi f < f₀, nếu tăng dần tần số ngoại lực thì biên độ dao động cưỡng bức giảm dần.", false],
      ["Biên độ dao động cưỡng bức không phụ thuộc vào biên độ của ngoại lực tuần hoàn.", false],
    ],
    "Biên độ cưỡng bức cực đại tại f = f₀ (a đúng); lực cản càng nhỏ đỉnh càng nhọn và cao (b đúng). Khi f < f₀, tăng f thì biên độ tăng dần đến đỉnh (c sai). Biên độ cưỡng bức tỉ lệ với biên độ ngoại lực (d sai)."),

  tf("phy_11_127", 11, "Physics", "Dao động điều hòa",
    "Hai chất điểm (1) và (2) dao động điều hòa dọc theo trục Ox với cùng chu kì T = 2 s. Chất điểm (1) có biên độ 6 cm và qua vị trí cân bằng theo chiều dương tại t = 0. Chất điểm (2) có biên độ 8 cm và ở biên dương tại t = 0. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Pha ban đầu của chất điểm (1) là −π/2 rad.", true],
      ["Chất điểm (2) sớm pha π/2 so với chất điểm (1).", true],
      ["Tại thời điểm t = 0,5 s, cả hai chất điểm đều ở vị trí cân bằng.", false],
      ["Tốc độ cực đại của chất điểm (2) lớn hơn chất điểm (1) một lượng 2π cm/s.", true],
    ],
    "Chất điểm (1) qua vị trí cân bằng theo chiều dương nên φ₁ = −π/2 (a đúng); chất điểm (2) ở biên dương nên φ₂ = 0, sớm pha hơn (1) là π/2 (b đúng). Với ω = π rad/s, tại t = 0,5 s: x₁ = 6cos0 = 6 cm (ở biên) và x₂ = 8cos(π/2) = 0 (ở vị trí cân bằng) nên c sai. vmax₂ − vmax₁ = ω(8 − 6) = 2π cm/s (d đúng)."),

  tf("phy_11_128", 11, "Physics", "Dao động điều hòa",
    "Một con lắc đơn gồm vật nhỏ treo vào sợi dây mảnh không dãn dài l = 1 m dao động điều hòa với biên độ góc nhỏ tại nơi có gia tốc rơi tự do g = π² m/s². Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Chu kì dao động nhỏ của con lắc đơn là T = 2 s.", true],
      ["Nếu tăng khối lượng vật nặng lên gấp đôi thì chu kì dao động tăng √2 lần.", false],
      ["Nếu đưa con lắc lên độ cao có gia tốc rơi tự do giảm thì chu kì dao động tăng.", true],
      ["Có thể dùng con lắc đơn để đo gia tốc rơi tự do tại địa phương thông qua phép đo chiều dài dây và chu kì dao động.", true],
    ],
    "T = 2π√(l/g) = 2π√(1/π²) = 2 s (a đúng). Chu kì không phụ thuộc khối lượng vật nặng (b sai). g giảm thì T tăng (c đúng). Có thể đo g = 4π²l/T² (d đúng)."),

  tf("phy_11_129", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một con lắc lò xo gồm lò xo nhẹ có độ cứng k = 40 N/m và vật nhỏ khối lượng m = 100 g dao động điều hòa theo phương ngang với biên độ A = 5 cm. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Tần số góc của con lắc là ω = 20 rad/s.", true],
      ["Cơ năng của con lắc bằng 0,05 J.", true],
      ["Lực kéo về cực đại tác dụng lên vật có độ lớn 200 N.", false],
      ["Khi vật có li độ x = −2,5 cm thì thế năng bằng 0,0125 J.", true],
    ],
    "ω = √(k/m) = √(40/0,1) = 20 rad/s (a đúng). W = ½kA² = ½·40·0,05² = 0,05 J (b đúng). Lực kéo về cực đại Fmax = kA = 40·0,05 = 2 N (c sai). Tại x = −2,5 cm: Wt = ½·40·0,025² = 0,0125 J (d đúng)."),

  tf("phy_11_130", 11, "Physics", "Dao động điều hòa",
    "Chuyển động lên xuống của pít-tông trong xi-lanh của một động cơ đốt trong khi trục khuỷu quay đều với tốc độ 1200 vòng/phút được xem gần đúng là dao động điều hòa với biên độ 4 cm. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Tần số dao động của pít-tông là 20 Hz.", true],
      ["Hành trình toàn phần từ điểm chết trên đến điểm chết dưới của pít-tông là 4 cm.", false],
      ["Tốc độ cực đại của pít-tông bằng 1,6π m/s.", true],
      ["Pít-tông dừng lại tức thời tại hai điểm chết trên và dưới.", true],
    ],
    "1200 vòng/phút = 20 vòng/s nên f = 20 Hz (a đúng). Hành trình từ điểm chết trên xuống điểm chết dưới bằng 2A = 8 cm (b sai). vmax = ωA = 2π·20·0,04 = 1,6π m/s (c đúng). Tại hai điểm chết vận tốc tức thời bằng 0 (d đúng)."),

  tf("phy_11_131", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Đồ thị biểu diễn sự phụ thuộc của thế năng đàn hồi Wt theo li độ x của một con lắc lò xo dao động điều hòa là một đường parabol có đỉnh tại gốc tọa độ và hai điểm đầu mút có tọa độ (−4 cm; 32 mJ) và (4 cm; 32 mJ). Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cơ năng của con lắc lò xo bằng 32 mJ.", true],
      ["Biên độ dao động của con lắc là 8 cm.", false],
      ["Độ cứng của lò xo bằng 40 N/m.", true],
      ["Khi vật ở vị trí x = 2 cm thì động năng của vật bằng 24 mJ.", true],
    ],
    "Thế năng cực đại bằng cơ năng tại biên: W = 32 mJ (a đúng), biên độ A = 4 cm (b sai). Từ W = ½kA²: k = 2·0,032/0,04² = 40 N/m (c đúng). Tại x = 2 cm: Wt = ½·40·0,02² = 8 mJ nên Wđ = 32 − 8 = 24 mJ (d đúng)."),

  tf("phy_11_132", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Trong kỹ thuật xây dựng cầu đường và nhà cao tầng hiện đại, vấn đề dao động cơ học được đặc biệt quan tâm: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Đoàn quân đi đều bước qua cầu có thể gây ra hiện tượng cộng hưởng làm sập cầu.", true],
      ["Để chống rung lắc cho nhà cao tầng khi có động đất hoặc gió bão, người ta lắp đặt con lắc giảm chấn khối lượng lớn ở tầng thượng.", true],
      ["Khi thiết kế khung máy và cầu thép, kỹ sư cố gắng điều chỉnh sao cho tần số riêng của công trình trùng với tần số rung của động cơ hoặc gió.", false],
      ["Bộ giảm chấn thủy lực trong công trình hoạt động dựa trên cơ chế tiêu tán năng lượng của dao động tắt dần.", true],
    ],
    "Đoàn quân đều bước có thể gây cộng hưởng làm sập cầu (a đúng); con lắc giảm chấn chống rung lắc cho nhà cao tầng (b đúng). Kỹ sư phải tránh để tần số riêng của công trình trùng với tần số rung của động cơ hoặc gió, nên c sai. Bộ giảm chấn hoạt động dựa trên sự tiêu tán năng lượng của dao động tắt dần (d đúng)."),

  sa("phy_11_133", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa thực hiện được 30 dao động toàn phần trong thời gian 15 s. Tính chu kì dao động của vật theo đơn vị giây (s).",
    "0,5",
    "T = t/N = 15/30 = 0,5 s.",
    ["0,5 s"]),

  sa("phy_11_134", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa với phương trình x = 5cos(4πt + π/3) (cm). Lấy π = 3,14. Tính tốc độ cực đại của chất điểm theo đơn vị cm/s (làm tròn đến một chữ số thập phân).",
    "62,8",
    "vmax = ωA = 4π·5 = 20π ≈ 62,8 cm/s (với π = 3,14).",
    ["62,8 cm/s"]),

  sa("phy_11_135", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ A = 5 cm và tần số f = 2 Hz. Lấy π² = 10. Tính độ lớn gia tốc cực đại của vật theo đơn vị m/s².",
    "8",
    "ω = 2πf = 4π rad/s; amax = ω²A = 16π²·0,05 = 160·0,05 = 8 m/s².",
    ["8 m/s²", "8 m/s2"]),

  sa("phy_11_136", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật dao động điều hòa với biên độ A = 12 cm. Tính độ lớn li độ (theo đơn vị cm) của vật tại vị trí mà động năng bằng 3 lần thế năng.",
    "6",
    "Wđ = 3Wt nên Wt = W/4 ⇒ |x| = A/2 = 6 cm.",
    ["6 cm"]),

  sa("phy_11_137", 11, "Physics", "Năng lượng trong dao động điều hòa",
    "Một vật nhỏ có khối lượng m = 200 g dao động điều hòa với tần số góc ω = 10 rad/s và biên độ A = 4 cm. Tính cơ năng của vật theo đơn vị mJ.",
    "16",
    "W = ½mω²A² = ½·0,2·10²·0,04² = 0,016 J = 16 mJ.",
    ["16 mJ"]),

  sa("phy_11_138", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa với biên độ A = 10 cm và tần số góc ω = 5 rad/s. Tính tốc độ của vật (theo đơn vị cm/s) khi vật đi qua vị trí có li độ x = 6 cm.",
    "40",
    "|v| = ω√(A² − x²) = 5·√(100 − 36) = 5·8 = 40 cm/s.",
    ["40 cm/s"]),

  sa("phy_11_139", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với chu kì T = 1,2 s. Tính khoảng thời gian ngắn nhất (theo đơn vị giây) để vật đi từ vị trí cân bằng đến vị trí có li độ bằng một nửa biên độ.",
    "0,1",
    "Đi từ vị trí cân bằng (x = 0) đến x = A/2 ứng với góc quét π/6, tức thời gian T/12 = 1,2/12 = 0,1 s.",
    ["0,1 s"]),

  sa("phy_11_140", 11, "Physics", "Dao động điều hòa",
    "Một chất điểm dao động điều hòa dọc theo trục Ox. Khi qua vị trí có li độ x₁ = 6 cm thì tốc độ là 80 cm/s; khi qua vị trí có li độ x₂ = 8 cm thì tốc độ là 60 cm/s. Tính biên độ dao động của chất điểm theo đơn vị cm.",
    "10",
    "A² = x² + v²/ω²: 36 + 6400/ω² = 64 + 3600/ω² ⇒ ω² = 100 ⇒ A² = 36 + 64 = 100 ⇒ A = 10 cm.",
    ["10 cm"]),

  sa("phy_11_141", 11, "Physics", "Dao động tắt dần và dao động cưỡng bức",
    "Một người xách một xô nước đi bộ trên đường phẳng, mỗi bước chân dài 60 cm. Chu kì dao động riêng của nước trong xô là 1,5 s. Tính tốc độ đi bộ của người đó (theo đơn vị m/s) để nước trong xô bị sóng sánh mạnh nhất.",
    "0,4",
    "Nước sóng sánh mạnh nhất khi cộng hưởng: chu kì bước chân bằng chu kì riêng 1,5 s. Tốc độ v = 0,6 m / 1,5 s = 0,4 m/s.",
    ["0,4 m/s"]),

  sa("phy_11_142", 11, "Physics", "Dao động điều hòa",
    "Một vật dao động điều hòa với biên độ A = 4 cm. Tính tổng quãng đường (theo đơn vị cm) mà vật đi được trong khoảng thời gian 2,25 chu kì kể từ lúc vật ở vị trí biên dương.",
    "36",
    "2,25 chu kì = 2T + T/4. Quãng đường trong 2T là 8A = 32 cm; trong T/4 kể từ biên dương là A = 4 cm. Tổng s = 36 cm.",
    ["36 cm"]),

  mc("phy_11_151", 11, "Physics", "Sóng cơ và sóng âm",
    "Sóng cơ học không thể truyền được trong môi trường nào sau đây?",
    ["Nước biển.", "Thanh thép.", "Không khí.", "Chân không."], "D",
    "Sóng cơ cần môi trường vật chất (rắn, lỏng, khí) để truyền, không truyền được trong chân không."),

  mc("phy_11_152", 11, "Physics", "Sóng cơ và sóng âm",
    "Sóng ngang là sóng cơ có phương dao động của các phần tử môi trường",
    ["trùng với phương truyền sóng.", "vuông góc với phương truyền sóng.", "luôn theo phương thẳng đứng.", "luôn theo phương nằm ngang."], "B",
    "Sóng ngang có phương dao động của các phần tử vuông góc với phương truyền sóng."),

  mc("phy_11_153", 11, "Physics", "Sóng cơ và sóng âm",
    "Bước sóng λ là khoảng cách giữa hai điểm gần nhau nhất trên cùng một phương truyền sóng dao động",
    ["cùng pha.", "ngược pha.", "vuông pha.", "lệch pha π/4."], "A",
    "Bước sóng là khoảng cách giữa hai điểm gần nhau nhất trên phương truyền sóng dao động cùng pha; cũng là quãng đường sóng truyền được trong một chu kì."),

  mc("phy_11_154", 11, "Physics", "Sóng cơ và sóng âm",
    "Hai điểm M và N nằm trên cùng một phương truyền sóng cách nhau một khoảng d. Với bước sóng λ, độ lệch pha dao động giữa hai điểm đó là",
    ["Δφ = πd/λ.", "Δφ = 2πd/λ.", "Δφ = 2πλ/d.", "Δφ = d/(2πλ)."], "B",
    "Độ lệch pha giữa hai điểm cách nhau d trên phương truyền sóng là Δφ = 2πd/λ."),

  mc("phy_11_155", 11, "Physics", "Sóng điện từ",
    "Phát biểu nào sau đây sai khi nói về sóng điện từ?",
    ["Sóng điện từ là sóng ngang.", "Sóng điện từ truyền được trong chân không.", "Sóng điện từ mang theo năng lượng.", "Tốc độ truyền sóng điện từ trong nước lớn hơn trong chân không."], "D",
    "Sóng điện từ là sóng ngang, truyền được trong chân không và mang năng lượng. Tốc độ trong môi trường vật chất (như nước) nhỏ hơn tốc độ trong chân không nên phát biểu D sai."),

  mc("phy_11_156", 11, "Physics", "Sóng điện từ",
    "Trong thang sóng điện từ, các bức xạ được sắp xếp theo thứ tự bước sóng giảm dần là",
    ["Tia X, tia tử ngoại, ánh sáng nhìn thấy, tia hồng ngoại.", "Sóng vô tuyến, tia hồng ngoại, ánh sáng nhìn thấy, tia tử ngoại, tia X.", "Tia hồng ngoại, sóng vô tuyến, tia tử ngoại, tia gamma.", "Ánh sáng nhìn thấy, tia hồng ngoại, tia tử ngoại, sóng vô tuyến."], "B",
    "Thứ tự bước sóng giảm dần: sóng vô tuyến → tia hồng ngoại → ánh sáng nhìn thấy → tia tử ngoại → tia X → tia gamma."),

  mc("phy_11_157", 11, "Physics", "Sóng điện từ",
    "Bộ điều khiển từ xa (remote) của tivi hay máy điều hòa hoạt động dựa trên bức xạ nào sau đây?",
    ["Tia hồng ngoại.", "Tia tử ngoại.", "Tia X.", "Tia gamma."], "A",
    "Bộ điều khiển từ xa phát và thu tia hồng ngoại."),

  mc("phy_11_158", 11, "Physics", "Sóng điện từ",
    "Bức xạ điện từ có khả năng đâm xuyên mạnh, được sử dụng trong y học để chụp phim chẩn đoán gãy xương và kiểm tra hành lí tại sân bay là",
    ["tia hồng ngoại.", "tia tử ngoại.", "tia X (tia Rơnghen).", "sóng vô tuyến cực ngắn."], "C",
    "Tia X (tia Rơnghen) có khả năng đâm xuyên mạnh, dùng chụp X-quang chẩn đoán xương và kiểm tra hành lí."),

  mc("phy_11_159", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Để hai sóng cơ gặp nhau giao thoa được với nhau thì hai nguồn sóng phải là hai nguồn kết hợp, tức là hai nguồn dao động cùng phương, cùng",
    ["biên độ và ngược pha.", "tần số và có độ lệch pha không đổi theo thời gian.", "tốc độ truyền sóng và biên độ cực đại.", "pha ban đầu và khác tần số."], "B",
    "Hai nguồn kết hợp có cùng phương dao động, cùng tần số và độ lệch pha không đổi theo thời gian."),

  mc("phy_11_160", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong hiện tượng giao thoa sóng cơ với hai nguồn kết hợp cùng pha có bước sóng λ, những điểm dao động với biên độ cực đại có hiệu đường đi d₂ − d₁ thỏa mãn (với k ∈ Z)",
    ["d₂ − d₁ = kλ.", "d₂ − d₁ = (k + ½)λ.", "d₂ − d₁ = kλ/2.", "d₂ − d₁ = (2k + 1)λ/4."], "A",
    "Với hai nguồn cùng pha, điểm cực đại có hiệu đường đi d₂ − d₁ = kλ (k ∈ Z)."),

  mc("phy_11_161", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong giao thoa sóng nước với hai nguồn kết hợp cùng pha, những điểm đứng yên (biên độ cực tiểu) có hiệu khoảng cách tới hai nguồn bằng",
    ["một số nguyên lần bước sóng.", "một số bán nguyên lần bước sóng.", "một số chẵn lần bước sóng.", "một số nguyên lần nửa bước sóng."], "B",
    "Với hai nguồn cùng pha, điểm cực tiểu có d₂ − d₁ = (k + ½)λ, tức một số bán nguyên lần bước sóng."),

  mc("phy_11_162", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong thí nghiệm Young về giao thoa ánh sáng đơn sắc có bước sóng λ, khoảng cách giữa hai khe là a, khoảng cách từ mặt phẳng hai khe đến màn quan sát là D. Công thức tính khoảng vân i là",
    ["i = λa/D.", "i = λD/a.", "i = aD/λ.", "i = λ/(aD)."], "B",
    "Khoảng vân giao thoa i = λD/a."),

  mc("phy_11_163", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong thí nghiệm Young về giao thoa ánh sáng với khoảng vân i, vị trí vân tối thứ 3 kể từ vân sáng trung tâm cách vân trung tâm một đoạn bằng",
    ["3i.", "2,5i.", "3,5i.", "2i."], "B",
    "Vân tối thứ n kể từ vân trung tâm có vị trí x = (n − ½)i. Vân tối thứ 3: x = 2,5i."),

  mc("phy_11_164", 11, "Physics", "Sóng dừng",
    "Khi một sóng cơ truyền trên sợi dây đến gặp đầu dây cố định thì tại điểm phản xạ, sóng phản xạ luôn",
    ["cùng pha với sóng tới.", "ngược pha với sóng tới.", "vuông pha với sóng tới.", "có tần số gấp đôi sóng tới."], "B",
    "Tại đầu dây cố định, sóng phản xạ ngược pha với sóng tới (mất nửa bước sóng)."),

  mc("phy_11_165", 11, "Physics", "Sóng dừng",
    "Trên một sợi dây có sóng dừng ổn định, khoảng cách giữa hai nút sóng liên tiếp bằng",
    ["một bước sóng λ.", "nửa bước sóng λ/2.", "một phần tư bước sóng λ/4.", "hai bước sóng 2λ."], "B",
    "Khoảng cách giữa hai nút (hoặc hai bụng) liên tiếp của sóng dừng bằng λ/2."),

  mc("phy_11_166", 11, "Physics", "Sóng dừng",
    "Điều kiện để có sóng dừng trên một sợi dây đàn hồi chiều dài l có hai đầu cố định (với k = 1, 2, 3...) là",
    ["l = k(λ/2).", "l = (2k + 1)(λ/4).", "l = kλ.", "l = (k + ½)λ."], "A",
    "Dây hai đầu cố định có sóng dừng khi chiều dài bằng số nguyên lần nửa bước sóng: l = kλ/2."),

  mc("phy_11_167", 11, "Physics", "Sóng dừng",
    "Một sợi dây dài l có một đầu cố định và một đầu tự do. Khi trên dây có sóng dừng với bước sóng λ thì chiều dài dây thỏa mãn (với k = 0, 1, 2...)",
    ["l = k(λ/2).", "l = (2k + 1)(λ/4).", "l = kλ.", "l = (2k + 1)(λ/2)."], "B",
    "Dây một đầu cố định, một đầu tự do có sóng dừng khi l = (2k + 1)λ/4 (đầu cố định là nút, đầu tự do là bụng)."),

  mc("phy_11_168", 11, "Physics", "Sóng cơ và sóng âm",
    "Sóng âm có tần số nào sau đây là sóng siêu âm mà tai người không nghe thấy được?",
    ["10 Hz.", "440 Hz.", "15 000 Hz.", "40 000 Hz."], "D",
    "Siêu âm có tần số lớn hơn 20 000 Hz; chỉ có 40 000 Hz thỏa mãn."),

  mc("phy_11_169", 11, "Physics", "Sóng cơ và sóng âm",
    "Đặc trưng sinh lí nào của âm giúp tai người phân biệt được tiếng đàn piano và tiếng đàn violon khi hai nhạc cụ này phát ra cùng một nốt nhạc ở cùng một độ to?",
    ["Độ cao.", "Độ to.", "Âm sắc.", "Cường độ âm."], "C",
    "Âm sắc giúp phân biệt âm của các nhạc cụ khác nhau khi chúng phát cùng độ cao và độ to."),

  mc("phy_11_170", 11, "Physics", "Sóng cơ và sóng âm",
    "Một sóng cơ có tần số 50 Hz truyền trên mặt nước với tốc độ 2 m/s. Bước sóng của sóng này là",
    ["100 m.", "25 m.", "4 cm.", "2,5 cm."], "C",
    "λ = v/f = 2/50 = 0,04 m = 4 cm."),

  tf("phy_11_171", 11, "Physics", "Sóng cơ và sóng âm",
    "Một sóng hình sin lan truyền dọc theo trục Ox với phương trình u = 4cos(10πt − 2πx) (cm), trong đó x tính bằng mét và t tính bằng giây. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Biên độ của sóng là 4 cm.", true],
      ["Tần số của sóng bằng 10 Hz.", false],
      ["Bước sóng của sóng này bằng 1 m.", true],
      ["Tốc độ truyền sóng dọc theo trục Ox là 5 m/s.", true],
    ],
    "So sánh với u = Acos(ωt − 2πx/λ): A = 4 cm (a đúng); ω = 10π nên f = 5 Hz, không phải 10 Hz (b sai); 2π/λ = 2π nên λ = 1 m (c đúng); v = λf = 1·5 = 5 m/s (d đúng)."),

  tf("phy_11_172", 11, "Physics", "Sóng điện từ",
    "So sánh đặc điểm của sóng cơ học và sóng điện từ: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cả sóng cơ và sóng điện từ đều mang năng lượng và có thể phản xạ, khúc xạ, giao thoa.", true],
      ["Sóng âm trong không khí là sóng dọc, còn sóng điện từ là sóng ngang.", true],
      ["Sóng cơ truyền trong chất rắn nhanh hơn trong chất khí, còn sóng điện từ truyền trong chân không nhanh nhất.", true],
      ["Khi truyền từ không khí vào nước, tần số của cả sóng cơ và sóng điện từ đều thay đổi.", false],
    ],
    "Cả hai loại sóng đều mang năng lượng và có phản xạ, khúc xạ, giao thoa (a đúng). Sóng âm trong không khí là sóng dọc, sóng điện từ là sóng ngang (b đúng). Sóng cơ truyền nhanh hơn trong chất rắn so với chất khí; sóng điện từ nhanh nhất trong chân không (c đúng). Khi truyền qua mặt phân cách tần số không đổi, chỉ tốc độ và bước sóng thay đổi (d sai)."),

  tf("phy_11_173", 11, "Physics", "Sóng điện từ",
    "Xét các bức xạ trong thang sóng điện từ và ứng dụng trong thực tiễn: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Tia tử ngoại có bước sóng nhỏ hơn ánh sáng tím và được dùng để khử trùng nước uống, dụng cụ y tế.", true],
      ["Mọi vật có nhiệt độ lớn hơn 0 K đều phát ra tia hồng ngoại.", true],
      ["Sóng Wi-Fi và mạng di động 5G sử dụng bức xạ thuộc vùng tia X.", false],
      ["Tầng ozon trong khí quyển hấp thụ phần lớn tia tử ngoại từ Mặt Trời bảo vệ sinh vật trên Trái Đất.", true],
    ],
    "Tia tử ngoại có bước sóng nhỏ hơn ánh sáng tím và dùng để khử trùng (a đúng). Mọi vật có nhiệt độ lớn hơn 0 K đều phát tia hồng ngoại (b đúng). Wi-Fi và 5G dùng sóng vô tuyến (vi ba), không phải tia X (c sai). Tầng ozon hấp thụ phần lớn tia tử ngoại của Mặt Trời (d đúng)."),

  tf("phy_11_174", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong thí nghiệm giao thoa sóng trên mặt nước, hai nguồn kết hợp S₁ và S₂ dao động cùng pha theo phương thẳng đứng với bước sóng λ = 2 cm. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Đường trung trực của đoạn thẳng S₁S₂ là một đường cực đại giao thoa.", true],
      ["Điểm M cách S₁ một đoạn 10 cm và cách S₂ một đoạn 15 cm nằm trên một vân cực tiểu giao thoa.", true],
      ["Trên đoạn thẳng S₁S₂, khoảng cách giữa hai cực đại giao thoa liên tiếp bằng 2 cm.", false],
      ["Hiện tượng giao thoa là hiện tượng đặc trưng của chuyển động sóng.", true],
    ],
    "Điểm trên trung trực có d₁ = d₂ nên là cực đại (a đúng). Với M: d₂ − d₁ = 5 cm = 2,5λ = (2 + ½)λ nên là cực tiểu (b đúng). Trên S₁S₂ hai cực đại liên tiếp cách nhau λ/2 = 1 cm (c sai). Giao thoa là hiện tượng đặc trưng của sóng (d đúng)."),

  tf("phy_11_175", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Thực hiện thí nghiệm Young về giao thoa ánh sáng đơn sắc có bước sóng λ = 0,6 μm. Khoảng cách giữa hai khe hẹp là a = 1 mm và khoảng cách từ hai khe đến màn là D = 2 m. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khoảng vân giao thoa đo được trên màn là i = 1,2 mm.", true],
      ["Vân sáng bậc 4 cách vân sáng trung tâm một khoảng 4,8 mm.", true],
      ["Tại vị trí cách vân trung tâm 3,0 mm có một vân sáng bậc 3.", false],
      ["Nếu tịnh tiến màn ra xa mặt phẳng hai khe thì khoảng vân trên màn sẽ tăng lên.", true],
    ],
    "i = λD/a = 0,6·2/1 = 1,2 mm (a đúng). Vân sáng bậc 4: x = 4i = 4,8 mm (b đúng). Tại x = 3,0 mm: x/i = 2,5 nên là vân tối, không phải vân sáng bậc 3 (c sai). Tịnh tiến màn ra xa thì D tăng nên i tăng (d đúng)."),

  tf("phy_11_176", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Khi chiếu chùm ánh sáng trắng (gồm vô số ánh sáng đơn sắc có bước sóng từ 0,38 μm đến 0,76 μm) vào hai khe trong thí nghiệm Young: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Tại vị trí vân trung tâm có một vạch sáng trắng.", true],
      ["Hai bên vân trung tâm là các dải màu biến thiên liên tục như cầu vồng.", true],
      ["Trong mỗi quang phổ bậc nhất, ánh sáng đỏ nằm gần vân trung tâm hơn ánh sáng tím.", false],
      ["Khoảng vân của ánh sáng đỏ lớn gấp đôi khoảng vân của ánh sáng tím.", true],
    ],
    "Tại vân trung tâm mọi màu cùng sáng nên là vạch trắng (a đúng); hai bên là các dải màu liên tục (b đúng). Ánh sáng đỏ có bước sóng lớn hơn nên vân đỏ nằm xa vân trung tâm hơn vân tím (c sai). Vì i tỉ lệ với λ nên i_đỏ/i_tím = 0,76/0,38 = 2 (d đúng)."),

  tf("phy_11_177", 11, "Physics", "Sóng dừng",
    "Trên một sợi dây đàn hồi dài l = 1,2 m có hai đầu cố định đang có sóng dừng ổn định với tần số f = 25 Hz. Quan sát thấy trên dây có 3 bó sóng. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Bước sóng của sóng truyền trên dây là λ = 0,8 m.", true],
      ["Tổng số nút sóng trên dây (kể cả hai đầu dây) là 3 nút.", false],
      ["Tốc độ truyền sóng trên sợi dây bằng 20 m/s.", true],
      ["Tất cả các điểm thuộc cùng một bó sóng luôn dao động cùng pha với nhau.", true],
    ],
    "Dây hai đầu cố định có 3 bó: l = 3·λ/2 ⇒ λ = 2l/3 = 0,8 m (a đúng). Với 3 bó có 4 nút (kể cả hai đầu dây), không phải 3 nút (b sai). v = λf = 0,8·25 = 20 m/s (c đúng). Các điểm cùng một bó dao động cùng pha (d đúng)."),

  tf("phy_11_178", 11, "Physics", "Sóng dừng",
    "Một nhóm học sinh thực hiện thí nghiệm đo tốc độ truyền âm trong không khí bằng ống cộng hưởng hình trụ thẳng đứng chứa nước (một đầu kín là mặt nước, một đầu hở phía trên) và âm thoa có tần số f = 680 Hz. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi nghe thấy âm thanh phát ra to nhất, trong cột khí phía trên mặt nước đã xảy ra sóng dừng với đầu hở là một bụng sóng và mặt nước là một nút sóng.", true],
      ["Khoảng cách giữa hai vị trí liên tiếp của mặt nước nghe được âm to nhất bằng một bước sóng λ.", false],
      ["Nếu hai vị trí liên tiếp nghe âm to nhất cách nhau 25 cm thì tốc độ truyền âm đo được là 340 m/s.", true],
      ["Tốc độ truyền âm trong không khí phụ thuộc vào nhiệt độ của không khí trong phòng thí nghiệm.", true],
    ],
    "Mặt nước là nút sóng, miệng ống hở là bụng sóng (a đúng). Hai vị trí liên tiếp cho âm to nhất cách nhau λ/2, không phải λ (b sai). Nếu λ/2 = 25 cm thì λ = 0,5 m ⇒ v = λf = 0,5·680 = 340 m/s (c đúng). Tốc độ âm phụ thuộc nhiệt độ của không khí (d đúng)."),

  tf("phy_11_179", 11, "Physics", "Sóng cơ và sóng âm",
    "Trong bài thực hành đo tần số của sóng âm bằng dao động kí điện tử, micro thu âm chuyển tín hiệu âm thành tín hiệu điện hiển thị dạng hình sin trên màn hình. Núm chỉnh thời gian (TIME/DIV) đặt ở mức 0,5 ms/ô và một chu kì sóng trên màn hình chiếm đúng 4 ô nằm ngang. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Chu kì của tín hiệu âm là T = 2 ms = 0,002 s.", true],
      ["Tần số của sóng âm đo được là 500 Hz.", true],
      ["Âm này thuộc vùng hạ âm nên tai người không nghe được.", false],
      ["Nếu tăng biên độ nguồn âm thì chiều cao đỉnh sóng trên màn hình dao động kí tăng lên.", true],
    ],
    "T = 4 ô × 0,5 ms = 2 ms (a đúng); f = 1/T = 500 Hz (b đúng). 500 Hz nằm trong khoảng tai người nghe được (16 Hz – 20 000 Hz) nên không phải hạ âm (c sai). Biên độ nguồn âm tăng thì chiều cao đỉnh sóng trên màn hình tăng (d đúng)."),

  tf("phy_11_180", 11, "Physics", "Sóng cơ và sóng âm",
    "Xét một sóng ngang hình sin đang truyền trên sợi dây dài từ trái sang phải tại một thời điểm xác định: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khoảng cách theo phương ngang giữa một đỉnh sóng và một đáy sóng liền kề là λ/2.", true],
      ["Các phần tử trên sợi dây di chuyển tịnh tiến từ trái sang phải cùng với sóng.", false],
      ["Phần tử dây tại đỉnh sóng có tốc độ dao động tức thời bằng không.", true],
      ["Phần tử dây ở sườn trước (phía bên phải đỉnh sóng) đang chuyển động đi lên.", true],
    ],
    "Khoảng cách ngang giữa một đỉnh và một đáy liền kề là λ/2 (a đúng). Các phần tử chỉ dao động quanh vị trí cân bằng, không tịnh tiến theo sóng (b sai). Tại đỉnh sóng phần tử ở biên nên tốc độ tức thời bằng 0 (c đúng). Sóng truyền sang phải nên phần tử ở phía bên phải đỉnh sắp lên tới đỉnh, tức đang đi lên (d đúng)."),

  tf("phy_11_181", 11, "Physics", "Sóng cơ và sóng âm",
    "Xét tính chất và ứng dụng của sóng âm trong tự nhiên và kỹ thuật: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Loài dơi và cá heo sử dụng sóng siêu âm để định vị con mồi và chướng ngại vật.", true],
      ["Máy siêu âm chẩn đoán y khoa dùng sóng siêu âm phản xạ để tái tạo hình ảnh mô mềm bên trong cơ thể.", true],
      ["Âm càng cao khi cường độ âm càng lớn.", false],
      ["Tường phòng thu âm thường được bọc xốp gai hoặc vật liệu xốp để tăng khả năng hấp thụ âm, giảm tiếng vang.", true],
    ],
    "Dơi và cá heo định vị bằng siêu âm (a đúng); máy siêu âm y khoa dùng sóng siêu âm phản xạ để tạo ảnh (b đúng). Độ cao của âm gắn với tần số, không phải cường độ âm (c sai). Vật liệu xốp hấp thụ âm, giảm tiếng vang (d đúng)."),

  tf("phy_11_182", 11, "Physics", "Sóng dừng",
    "Một ống sáo một đầu kín, một đầu hở có chiều dài cột khí l = 42,5 cm. Tốc độ truyền âm trong không khí là 340 m/s. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi thổi sáo phát ra âm cơ bản (tần số nhỏ nhất), chiều dài cột khí bằng λ/4.", true],
      ["Bước sóng của âm cơ bản do ống sáo phát ra là 1,7 m.", true],
      ["Tần số âm cơ bản của ống sáo này là 400 Hz.", false],
      ["Ngoài âm cơ bản f₀, ống sáo một đầu kín chỉ phát ra các họa âm bậc lẻ (3f₀, 5f₀...).", true],
    ],
    "Âm cơ bản của ống một đầu kín, một đầu hở có l = λ/4 (a đúng) nên λ = 4l = 1,7 m (b đúng). Tần số f₀ = v/λ = 340/1,7 = 200 Hz, không phải 400 Hz (c sai). Ống một đầu kín chỉ có các họa âm bậc lẻ 3f₀, 5f₀, ... (d đúng)."),

  sa("phy_11_183", 11, "Physics", "Sóng cơ và sóng âm",
    "Một sóng cơ truyền với tốc độ 1,5 m/s và có chu kì 0,2 s. Tính bước sóng của sóng này theo đơn vị cm.",
    "30",
    "λ = vT = 1,5·0,2 = 0,3 m = 30 cm.",
    ["30 cm"]),

  sa("phy_11_184", 11, "Physics", "Sóng điện từ",
    "Một đài phát thanh FM phát sóng điện từ có tần số 100 MHz. Lấy tốc độ ánh sáng trong chân không c = 3·10⁸ m/s. Tính bước sóng của sóng này theo đơn vị mét (m).",
    "3",
    "λ = c/f = 3·10⁸/10⁸ = 3 m.",
    ["3 m"]),

  sa("phy_11_185", 11, "Physics", "Sóng cơ và sóng âm",
    "Hai điểm M và N trên cùng phương truyền sóng cách nhau 15 cm, bước sóng là 60 cm. Lấy π = 3,14. Tính độ lệch pha giữa M và N theo đơn vị rad (làm tròn đến hai chữ số thập phân).",
    "1,57",
    "Δφ = 2πd/λ = 2π·15/60 = π/2 ≈ 1,57 rad.",
    ["1,57 rad"]),

  sa("phy_11_186", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong thí nghiệm giao thoa sóng trên mặt nước, hai nguồn kết hợp cùng pha S₁ và S₂ đặt cách nhau 10 cm dao động với bước sóng λ = 2,2 cm. Tính tổng số điểm dao động với biên độ cực đại trên đoạn thẳng S₁S₂.",
    "9",
    "Số cực đại trên S₁S₂ thỏa |k| < S₁S₂/λ = 10/2,2 ≈ 4,55 nên k = −4, −3, ..., 4: có 9 điểm cực đại.",
    ["9 điểm"]),

  sa("phy_11_187", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong thí nghiệm Young về giao thoa ánh sáng, khoảng cách giữa hai khe a = 0,8 mm, khoảng cách từ hai khe đến màn D = 1,6 m, bước sóng ánh sáng đơn sắc λ = 0,5 μm. Tính khoảng vân giao thoa i trên màn theo đơn vị mm.",
    "1",
    "i = λD/a = 0,5·10⁻⁶·1,6/(0,8·10⁻³) = 10⁻³ m = 1 mm.",
    ["1 mm"]),

  sa("phy_11_188", 11, "Physics", "Giao thoa sóng và ánh sáng",
    "Trong thí nghiệm Young về giao thoa ánh sáng có khoảng vân i = 1,5 mm. Tính khoảng cách (theo đơn vị mm) từ vân sáng bậc 3 đến vân tối thứ 2 ở cùng một phía so với vân sáng trung tâm.",
    "2,25",
    "Vân sáng bậc 3 cách vân trung tâm 3i = 4,5 mm; vân tối thứ 2 cách 1,5i = 2,25 mm. Khoảng cách giữa chúng (cùng phía) là 4,5 − 2,25 = 2,25 mm.",
    ["2,25 mm"]),

  sa("phy_11_189", 11, "Physics", "Sóng dừng",
    "Trên một sợi dây đàn hồi dài 90 cm có hai đầu cố định đang có sóng dừng ổn định với 3 bụng sóng. Tính bước sóng của sóng trên dây theo đơn vị cm.",
    "60",
    "Dây hai đầu cố định có 3 bụng (3 bó): l = 3·λ/2 ⇒ λ = 2l/3 = 60 cm.",
    ["60 cm"]),

  sa("phy_11_190", 11, "Physics", "Sóng dừng",
    "Một sợi dây dài 70 cm có một đầu cố định và một đầu tự do đang có sóng dừng với tần số f = 50 Hz. Quan sát thấy trên dây có 4 nút sóng (tính cả đầu cố định). Tính tốc độ truyền sóng trên dây theo đơn vị m/s.",
    "20",
    "Một đầu cố định, một đầu tự do: l = (2k + 1)λ/4, số nút là k + 1 = 4 nên k = 3 và l = 7λ/4 ⇒ λ = 4l/7 = 40 cm. Tốc độ v = λf = 0,4·50 = 20 m/s.",
    ["20 m/s"]),

  sa("phy_11_191", 11, "Physics", "Sóng dừng",
    "Trong thí nghiệm đo tốc độ truyền âm bằng ống cộng hưởng với âm thoa có tần số 680 Hz, khoảng cách giữa hai vị trí liên tiếp của mặt nước nghe được âm thanh to nhất là 25 cm. Tính tốc độ truyền âm trong không khí theo đơn vị m/s.",
    "340",
    "Khoảng cách giữa hai vị trí liên tiếp cho âm to nhất bằng λ/2 = 25 cm ⇒ λ = 50 cm. Tốc độ v = λf = 0,5·680 = 340 m/s.",
    ["340 m/s"]),

  sa("phy_11_192", 11, "Physics", "Sóng cơ và sóng âm",
    "Một người quan sát trên mặt hồ thấy có 11 ngọn sóng nhô lên liên tiếp đi qua trước mặt mình trong thời gian 5 s. Tính tần số của sóng nước theo đơn vị Hz.",
    "2",
    "11 ngọn sóng liên tiếp ứng với 10 chu kì: 10T = 5 s ⇒ T = 0,5 s ⇒ f = 2 Hz.",
    ["2 Hz"]),

  mc("phy_11_201", 11, "Physics", "Điện trường",
    "Hai điện tích điểm đặt gần nhau trong chân không sẽ hút nhau khi chúng",
    ["đều mang điện tích dương.", "đều mang điện tích âm.", "mang điện tích trái dấu nhau.", "có độ lớn điện tích bằng nhau."], "C",
    "Hai điện tích điểm trái dấu thì hút nhau, cùng dấu thì đẩy nhau."),

  mc("phy_11_202", 11, "Physics", "Điện trường",
    "Nếu tăng đồng thời độ lớn của hai điện tích điểm lên gấp đôi và tăng khoảng cách giữa chúng lên gấp đôi thì lực tương tác tĩnh điện giữa chúng sẽ",
    ["tăng lên 2 lần.", "giảm đi 2 lần.", "tăng lên 4 lần.", "không thay đổi."], "D",
    "F = k|q₁q₂|/r². Khi q₁, q₂ cùng tăng gấp đôi, tử số tăng 4 lần; khi r tăng gấp đôi, mẫu số tăng 4 lần nên F không đổi."),

  mc("phy_11_203", 11, "Physics", "Điện trường",
    "Hai điện tích điểm đặt trong chân không tương tác với nhau bằng lực F. Nếu giữ nguyên khoảng cách và nhúng toàn bộ hệ vào trong dầu hỏa có hằng số điện môi ε = 2,1 thì lực tương tác giữa chúng sẽ",
    ["tăng lên 2,1 lần.", "giảm đi 2,1 lần.", "tăng lên 4,41 lần.", "không đổi."], "B",
    "Trong môi trường điện môi lực tương tác giảm ε lần: F' = F/ε = F/2,1."),

  mc("phy_11_204", 11, "Physics", "Điện trường",
    "Đơn vị đo cường độ điện trường trong hệ SI là",
    ["Coulomb (C).", "Farad (F).", "Vôn trên mét (V/m).", "Vôn nhân mét (V·m)."], "C",
    "Cường độ điện trường E = F/q có đơn vị Vôn trên mét (V/m)."),

  mc("phy_11_205", 11, "Physics", "Điện trường",
    "Vectơ cường độ điện trường gây bởi một điện tích điểm Q < 0 tại điểm M cách nó một khoảng r có chiều",
    ["hướng ra xa điện tích Q.", "hướng lại gần điện tích Q.", "vuông góc với đường thẳng nối Q và M.", "phụ thuộc vào dấu của điện tích thử đặt tại M."], "B",
    "Vectơ cường độ điện trường của điện tích điểm âm hướng về phía điện tích đó, tức hướng lại gần Q."),

  mc("phy_11_206", 11, "Physics", "Điện trường",
    "Công thức tính độ lớn cường độ điện trường gây bởi điện tích điểm Q tại điểm cách nó một khoảng r trong chân không là",
    ["E = k|Q|/r.", "E = k|Q|/r².", "E = kQ²/r².", "E = k|Q|r²."], "B",
    "Độ lớn cường độ điện trường của điện tích điểm: E = k|Q|/r²."),

  mc("phy_11_207", 11, "Physics", "Điện trường",
    "Hai điện tích điểm có cùng độ lớn q > 0 đặt tại hai đỉnh A và B của tam giác đều ABC. Góc hợp bởi hai vectơ cường độ điện trường thành phần tại đỉnh C bằng",
    ["30°.", "60°.", "90°.", "120°."], "B",
    "Tại C, vectơ cường độ điện trường của điện tích tại A hướng dọc theo A→C, của điện tích tại B hướng dọc theo B→C. Góc giữa hai vectơ này bằng góc ACB của tam giác đều, tức 60°."),

  mc("phy_11_208", 11, "Physics", "Điện trường",
    "Hình ảnh đường sức điện của một điện trường đều là các đường",
    ["cong xuất phát từ điện tích dương.", "tròn đồng tâm.", "thẳng song song và cách đều nhau.", "thẳng cắt nhau tại một điểm."], "C",
    "Đường sức của điện trường đều là các đường thẳng song song và cách đều nhau."),

  mc("phy_11_209", 11, "Physics", "Điện trường",
    "Đặt một electron (điện tích q = −e < 0) vào trong một điện trường đều có vectơ cường độ điện trường hướng từ trái sang phải. Lực điện trường tác dụng lên electron có hướng",
    ["từ trái sang phải.", "từ phải sang trái.", "thẳng đứng hướng lên trên.", "thẳng đứng hướng xuống dưới."], "B",
    "Electron mang điện âm nên lực điện ngược chiều với vectơ cường độ điện trường, tức hướng từ phải sang trái."),

  mc("phy_11_210", 11, "Physics", "Điện trường",
    "Công của lực điện trường làm di chuyển một điện tích điểm q từ điểm M đến điểm N trong điện trường tĩnh",
    ["tỉ lệ thuận với chiều dài quãng đường đi được.", "không phụ thuộc vào hình dạng đường đi mà chỉ phụ thuộc vị trí điểm đầu M và điểm cuối N.", "luôn mang giá trị dương.", "luôn bằng không nếu đường đi là một đường cong."], "B",
    "Công của lực điện trong điện trường tĩnh không phụ thuộc hình dạng đường đi, chỉ phụ thuộc vào điểm đầu và điểm cuối."),

  mc("phy_11_211", 11, "Physics", "Điện trường",
    "Thế năng W_M của một điện tích điểm q đặt tại điểm M trong điện trường có điện thế V_M được xác định bởi công thức",
    ["W_M = qV_M.", "W_M = V_M/q.", "W_M = q/V_M.", "W_M = ½qV_M."], "A",
    "Thế năng của điện tích q tại điểm M là W_M = qV_M."),

  mc("phy_11_212", 11, "Physics", "Điện trường",
    "Hiệu điện thế giữa hai điểm M và N là U_MN = 20 V. Công của lực điện làm di chuyển điện tích q = −2 μC từ M đến N bằng",
    ["40 μJ.", "−40 μJ.", "10 μJ.", "−10 μJ."], "B",
    "A = qU_MN = (−2 μC)·20 V = −40 μJ."),

  mc("phy_11_213", 11, "Physics", "Điện trường",
    "Trong điện trường đều có cường độ E, hai điểm M và N nằm trên cùng một đường sức điện và cách nhau đoạn d (chiều đường sức từ M đến N). Hiệu điện thế U_MN bằng",
    ["Ed.", "−Ed.", "E/d.", "d/E."], "A",
    "M và N nằm trên cùng một đường sức, chiều từ M đến N nên điện thế giảm dọc theo chiều đường sức: U_MN = V_M − V_N = Ed."),

  mc("phy_11_214", 11, "Physics", "Điện trường",
    "Một electron bay vào vùng điện trường đều giữa hai bản kim loại phẳng nằm ngang tích điện trái dấu (bản trên dương, bản dưới âm) theo phương ngang. Quỹ đạo của electron bên trong vùng điện trường có dạng",
    ["đường thẳng nằm ngang.", "nhánh parabol cong hướng lên phía bản dương.", "nhánh parabol cong hướng xuống phía bản âm.", "cung tròn đều."], "B",
    "Electron mang điện âm bị hút về bản dương (phía trên); nó chuyển động đều theo phương ngang và nhanh dần theo phương thẳng đứng nên quỹ đạo là một nhánh parabol cong lên phía bản dương."),

  mc("phy_11_215", 11, "Physics", "Tụ điện",
    "Điện dung của một tụ điện phẳng không phụ thuộc vào đại lượng nào sau đây?",
    ["Diện tích đối diện của hai bản tụ.", "Khoảng cách giữa hai bản tụ.", "Bản chất lớp điện môi giữa hai bản tụ.", "Hiệu điện thế đặt vào hai bản tụ."], "D",
    "Điện dung C = εS/(4πkd) chỉ phụ thuộc diện tích bản, khoảng cách giữa hai bản và điện môi, không phụ thuộc hiệu điện thế đặt vào."),

  mc("phy_11_216", 11, "Physics", "Tụ điện",
    "Trên vỏ một tụ điện có ghi thông số: 220 μF − 50 V. Con số 50 V cho biết",
    ["hiệu điện thế tối thiểu để tụ bắt đầu hoạt động.", "hiệu điện thế giới hạn tối đa mà tụ chịu được mà không bị đánh thủng.", "suất điện động của tụ điện.", "độ giảm thế bên trong tụ điện."], "B",
    "Số 50 V là hiệu điện thế tối đa mà tụ chịu được; vượt quá giá trị này lớp điện môi bị đánh thủng."),

  mc("phy_11_217", 11, "Physics", "Tụ điện",
    "Hai tụ điện có điện dung C₁ và C₂ mắc nối tiếp với nhau. Điện dung tương đương C_b của bộ tụ thỏa mãn",
    ["C_b = C₁ + C₂.", "1/C_b = 1/C₁ + 1/C₂.", "C_b = |C₁ − C₂|.", "C_b = √(C₁C₂)."], "B",
    "Tụ mắc nối tiếp: 1/C_b = 1/C₁ + 1/C₂."),

  mc("phy_11_218", 11, "Physics", "Tụ điện",
    "Khi ghép hai tụ điện C₁ = 3 μF và C₂ = 5 μF song song với nhau thì điện dung tương đương của bộ tụ là",
    ["1,875 μF.", "2 μF.", "8 μF.", "15 μF."], "C",
    "Tụ mắc song song: C_b = C₁ + C₂ = 3 + 5 = 8 μF."),

  mc("phy_11_219", 11, "Physics", "Tụ điện",
    "Năng lượng điện trường dự trữ bên trong một tụ điện có điện dung C được tích điện tích Q đến hiệu điện thế U là",
    ["W = QU.", "W = ½CU².", "W = CU².", "W = ½C²U."], "B",
    "Năng lượng của tụ điện W = ½CU² = ½QU = Q²/(2C)."),

  mc("phy_11_220", 11, "Physics", "Tụ điện",
    "Bộ phận nào trong máy ảnh kỹ thuật số sử dụng tụ điện để tích trữ năng lượng và phóng điện cực nhanh tạo ra chùm sáng mạnh trong khoảnh khắc ngắn?",
    ["Ống kính hội tụ.", "Màn hình cảm ứng.", "Đèn Flash (đèn nháy).", "Khe cắm thẻ nhớ."], "C",
    "Đèn flash của máy ảnh dùng tụ điện tích năng lượng rồi phóng điện cực nhanh để tạo chùm sáng mạnh."),

  tf("phy_11_221", 11, "Physics", "Điện trường",
    "Hai điện tích điểm q₁ = 4 μC và q₂ = −9 μC đặt cố định tại hai điểm A và B cách nhau 30 cm trong chân không. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Lực tương tác giữa hai điện tích là lực hút tĩnh điện.", true],
      ["Độ lớn lực tương tác giữa hai điện tích bằng 3,6 N.", true],
      ["Nếu đưa hai điện tích lại gần nhau còn 15 cm thì lực tương tác tăng lên 2 lần.", false],
      ["Khi đặt hệ hai điện tích này vào trong nước nguyên chất (ε = 81) với cùng khoảng cách 30 cm thì lực tương tác giảm đi 81 lần.", true],
    ],
    "Hai điện tích trái dấu nên hút nhau (a đúng). F = k|q₁q₂|/r² = 9·10⁹·(4·10⁻⁶)(9·10⁻⁶)/0,3² = 3,6 N (b đúng). Khoảng cách giảm một nửa thì lực tăng 4 lần, không phải 2 lần (c sai). Trong nước (ε = 81) lực giảm 81 lần (d đúng)."),

  tf("phy_11_222", 11, "Physics", "Điện trường",
    "Hai điện tích điểm q₁ = 2·10⁻⁸ C và q₂ = −8·10⁻⁸ C đặt tại hai điểm A và B cách nhau 10 cm trong chân không. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điểm M có cường độ điện trường tổng hợp bằng không nằm trên đường thẳng AB nhưng ở ngoài đoạn thẳng AB.", true],
      ["Điểm M nằm về phía gần điện tích q₂ hơn.", false],
      ["Khoảng cách từ điểm M đến điện tích q₁ là 10 cm.", true],
      ["Tại trung điểm O của đoạn thẳng AB, cường độ điện trường tổng hợp hướng từ A sang B.", true],
    ],
    "Hai điện tích trái dấu nên điểm có E = 0 nằm ngoài đoạn AB, về phía điện tích có độ lớn nhỏ hơn (q₁), không phải phía q₂ (a đúng, b sai). Đặt AM = x: k|q₁|/x² = k|q₂|/(x + 10)² ⇒ (x + 10)/x = 2 ⇒ x = 10 cm (c đúng). Tại trung điểm O: vectơ cường độ điện trường của q₁ (dương) hướng ra xa A tức về phía B, của q₂ (âm) hướng về B nên tổng hợp hướng từ A sang B (d đúng)."),

  tf("phy_11_223", 11, "Physics", "Điện trường",
    "Khi khảo sát đặc điểm của đường sức điện trường tĩnh: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Qua mỗi điểm trong điện trường chỉ vẽ được một đường sức điện duy nhất.", true],
      ["Nơi nào có cường độ điện trường lớn hơn thì các đường sức điện ở đó vẽ thưa hơn.", false],
      ["Đường sức điện của điện trường tĩnh là các đường không khép kín, xuất phát từ điện tích dương và kết thúc ở điện tích âm (hoặc ra vô cực).", true],
      ["Các đường sức điện có thể cắt nhau tại những điểm có điện trường triệt tiêu.", false],
    ],
    "Qua mỗi điểm chỉ vẽ được một đường sức (a đúng). Nơi điện trường mạnh hơn thì đường sức dày hơn, không phải thưa hơn (b sai). Đường sức tĩnh điện không khép kín: xuất phát từ điện tích dương, kết thúc ở điện tích âm hoặc ra vô cực (c đúng). Các đường sức điện không cắt nhau (d sai)."),

  tf("phy_11_224", 11, "Physics", "Điện trường",
    "Một tam giác vuông ABC vuông tại A có AB = 6 cm, AC = 8 cm đặt trong điện trường đều có cường độ E = 5000 V/m, vectơ cường độ điện trường song song với cạnh AC và hướng từ A đến C. Di chuyển một điện tích q = 2·10⁻⁶ C theo đường gấp khúc khép kín A → B → C → A. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Công của lực điện khi điện tích di chuyển trên đoạn AB bằng 0.", true],
      ["Công của lực điện khi điện tích di chuyển từ B đến C bằng 0,8 mJ.", true],
      ["Công của lực điện khi điện tích di chuyển từ C về A bằng 0,8 mJ.", false],
      ["Tổng công của lực điện trên toàn bộ đường đi khép kín A → B → C → A bằng không.", true],
    ],
    "AB vuông góc với đường sức nên công trên AB bằng 0 (a đúng). Từ B đến C hình chiếu lên phương đường sức là 8 cm theo chiều điện trường: A = qEd = 2·10⁻⁶·5000·0,08 = 0,8 mJ (b đúng). Từ C về A điện tích đi ngược chiều điện trường nên A = −0,8 mJ, không phải +0,8 mJ (c sai). Công trên đường khép kín bằng 0 (d đúng)."),

  tf("phy_11_225", 11, "Physics", "Điện trường",
    "Hai bản kim loại phẳng song song đặt cách nhau d = 2 cm được nối với hiệu điện thế U = 100 V (bản A nối cực dương, bản B nối cực âm; chọn mốc điện thế tại bản âm V_B = 0). Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện thế tại bản dương A là V_A = 100 V.", true],
      ["Cường độ điện trường đều giữa hai bản kim loại là 5000 V/m, hướng từ bản B sang bản A.", false],
      ["Điểm M nằm chính giữa hai bản có điện thế bằng 50 V.", true],
      ["Nếu đặt một proton (q > 0) tại điểm M rồi thả nhẹ thì proton sẽ chuyển động về phía bản B.", true],
    ],
    "V_A = U + V_B = 100 V (a đúng). E = U/d = 100/0,02 = 5000 V/m nhưng hướng từ bản dương A sang bản âm B, không phải từ B sang A (b sai). M ở chính giữa nên V_M = 50 V (c đúng). Proton chịu lực cùng chiều điện trường nên chuyển động về phía bản B (d đúng)."),

  tf("phy_11_226", 11, "Physics", "Điện trường",
    "Trong máy in phun mực tĩnh điện, các giọt mực nhỏ được tích điện âm khi đi qua bộ phận phun, sau đó bay theo phương ngang vào vùng điện trường đều giữa hai bản lái tia thẳng đứng để điều chỉnh vị trí rơi trên trang giấy. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi bay qua vùng điện trường đều giữa hai bản lái tia, giọt mực bị hút lệch về phía bản mang điện tích dương.", true],
      ["Độ lệch của giọt mực trên trang giấy tỉ lệ thuận với điện tích của giọt mực và cường độ điện trường giữa hai bản lái tia.", true],
      ["Thời gian giọt mực bay qua hai bản lái tia phụ thuộc vào hiệu điện thế giữa hai bản lái tia.", false],
      ["Giọt mực không mang điện sẽ bay thẳng qua hai bản lái tia mà không bị lệch.", true],
    ],
    "Giọt mực tích điện âm bị hút về bản dương (a đúng). Độ lệch y = ½·(qE/m)·t² với t = L/v₀ không đổi nên y tỉ lệ với q và E (b đúng). Thời gian bay qua t = L/v₀ phụ thuộc chiều dài bản và vận tốc ban đầu, không phụ thuộc hiệu điện thế (c sai). Giọt mực không mang điện không chịu lực điện nên bay thẳng (d đúng)."),

  tf("phy_11_227", 11, "Physics", "Tụ điện",
    "Một tụ điện phẳng không khí được nối với hai cực của một nguồn điện có hiệu điện thế U không đổi. Giữ nguyên kết nối với nguồn điện rồi kéo hai bản tụ ra xa nhau một chút. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Hiệu điện thế giữa hai bản tụ điện vẫn giữ nguyên bằng U.", true],
      ["Điện dung C của tụ điện giảm đi.", true],
      ["Điện tích Q của tụ điện tăng lên.", false],
      ["Cường độ điện trường E giữa hai bản tụ giảm đi.", true],
    ],
    "Tụ vẫn nối với nguồn nên hiệu điện thế luôn bằng U (a đúng). Kéo hai bản ra xa thì d tăng, C giảm (b đúng); Q = CU nên Q giảm, không tăng (c sai). E = U/d giảm (d đúng)."),

  tf("phy_11_228", 11, "Physics", "Tụ điện",
    "Tích điện cho một tụ điện phẳng không khí đến hiệu điện thế U₀ rồi ngắt tụ khỏi nguồn điện. Sau đó, người ta lấp đầy khoảng không gian giữa hai bản tụ bằng một tấm thủy tinh có hằng số điện môi ε = 5. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện tích Q trên hai bản tụ điện được bảo toàn không đổi.", true],
      ["Điện dung của tụ điện tăng lên 5 lần.", true],
      ["Hiệu điện thế giữa hai bản tụ tăng lên 5 lần.", false],
      ["Năng lượng điện trường của tụ điện giảm đi 5 lần.", true],
    ],
    "Ngắt nguồn nên điện tích Q không đổi (a đúng). C tăng ε = 5 lần (b đúng). U = Q/C nên giảm 5 lần, không phải tăng (c sai). W = Q²/(2C) nên giảm 5 lần (d đúng)."),

  tf("phy_11_229", 11, "Physics", "Tụ điện",
    "Cho hai tụ điện có điện dung C₁ = 6 μF và C₂ = 3 μF mắc nối tiếp với nhau, sau đó nối hai đầu bộ tụ vào nguồn điện có hiệu điện thế U = 12 V. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện dung tương đương của bộ tụ là 2 μF.", true],
      ["Điện tích trên mỗi tụ điện bằng 24 μC.", true],
      ["Hiệu điện thế giữa hai bản tụ C₁ bằng 8 V và giữa hai bản tụ C₂ bằng 4 V.", false],
      ["Tổng năng lượng của bộ tụ bằng 144 μJ.", true],
    ],
    "C_b = C₁C₂/(C₁ + C₂) = 2 μF (a đúng). Q = C_bU = 2·12 = 24 μC cho cả hai tụ (b đúng). U₁ = Q/C₁ = 4 V và U₂ = Q/C₂ = 8 V, không phải 8 V và 4 V (c sai). W = ½C_bU² = ½·2·10⁻⁶·144 = 144 μJ (d đúng)."),

  tf("phy_11_230", 11, "Physics", "Tụ điện",
    "Máy khử rung tim ngoài tự động (AED) dùng để cấp cứu ngừng tim hoạt động bằng cách nạp điện cho một tụ điện có điện dung C = 32 μF đến hiệu điện thế U = 5000 V rồi phóng xung điện qua lồng ngực bệnh nhân. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện tích tích được trên tụ điện trước khi phóng điện là 0,16 C.", true],
      ["Năng lượng điện trường dự trữ trong tụ điện bằng 400 J.", true],
      ["Nếu tụ phóng hết năng lượng trong thời gian 4 ms thì công suất phóng điện trung bình đạt 100 kW.", true],
      ["Tụ điện trong máy AED cung cấp dòng điện một chiều ổn định liên tục trong suốt hàng giờ.", false],
    ],
    "Q = CU = 32·10⁻⁶·5000 = 0,16 C (a đúng). W = ½CU² = ½·32·10⁻⁶·5000² = 400 J (b đúng). P = W/t = 400/0,004 = 100 kW (c đúng). Tụ chỉ phóng điện trong thời gian rất ngắn, không cấp dòng điện ổn định hàng giờ (d sai)."),

  tf("phy_11_231", 11, "Physics", "Tụ điện",
    "Đồ thị biểu diễn sự phụ thuộc của điện tích Q vào hiệu điện thế U của hai tụ điện (1) và (2) là hai đường thẳng xuất phát từ gốc tọa độ. Tại cùng mức hiệu điện thế U = 10 V, tụ (1) có điện tích Q₁ = 40 μC, còn tụ (2) có điện tích Q₂ = 100 μC. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện dung của tụ (1) là 4 μF và của tụ (2) là 10 μF.", true],
      ["Độ dốc của đường đặc trưng (Q − U) chính là giá trị điện dung C của tụ điện.", true],
      ["Trên cùng hệ trục tọa độ (trục tung Q, trục hoành U), đường biểu diễn của tụ (1) dốc hơn tụ (2).", false],
      ["Ở cùng hiệu điện thế 10 V, năng lượng tụ (2) gấp 2,5 lần năng lượng tụ (1).", true],
    ],
    "C₁ = Q₁/U = 4 μF và C₂ = Q₂/U = 10 μF (a đúng). Độ dốc của đường Q − U chính là điện dung (b đúng). Tụ (2) có điện dung lớn hơn nên đường của tụ (2) dốc hơn, không phải tụ (1) (c sai). W = ½CU² tỉ lệ với C nên W₂/W₁ = 10/4 = 2,5 (d đúng)."),

  tf("phy_11_232", 11, "Physics", "Điện trường",
    "Xét hiện tượng phóng điện trong khí quyển (sét) và nguyên lí chống sét bảo vệ công trình: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Trước khi xảy ra sét, đám mây dông và mặt đất tạo thành một tụ điện khổng lồ với không khí là lớp điện môi.", true],
      ["Khi cường độ điện trường giữa đám mây và mặt đất vượt quá giới hạn chịu đựng của không khí thì không khí bị ion hóa và xảy ra tia lửa điện (sét).", true],
      ["Cột thu lôi có đầu nhọn làm bằng vật liệu cách điện để ngăn dòng điện chạy xuống đất.", false],
      ["Khi trời có dông sét, đứng trú mưa dưới gốc cây cao đơn độc ngoài đồng trống rất nguy hiểm do hiệu ứng mũi nhọn tập trung điện trường mạnh.", true],
    ],
    "Mây dông và mặt đất tạo thành một tụ điện khổng lồ có không khí làm điện môi (a đúng). Khi điện trường vượt ngưỡng chịu đựng, không khí bị ion hóa và xảy ra sét (b đúng). Cột thu lôi phải làm bằng vật liệu dẫn điện để dẫn điện tích xuống đất (c sai). Cây cao đơn độc có hiệu ứng mũi nhọn nên đứng dưới rất nguy hiểm khi có dông sét (d đúng)."),

  sa("phy_11_233", 11, "Physics", "Điện trường",
    "Hai điện tích điểm q₁ = 2·10⁻⁶ C và q₂ = −3·10⁻⁶ C đặt cách nhau 30 cm trong chân không. Lấy k = 9·10⁹ N·m²/C². Tính độ lớn lực tương tác tĩnh điện giữa hai điện tích theo đơn vị Niutơn (N).",
    "0,6",
    "F = k|q₁q₂|/r² = 9·10⁹·6·10⁻¹²/0,3² = 0,6 N.",
    ["0,6 N"]),

  sa("phy_11_234", 11, "Physics", "Điện trường",
    "Một điện tích điểm Q = 4·10⁻⁹ C đặt trong chân không. Tính độ lớn cường độ điện trường (theo đơn vị V/m) tại điểm M cách điện tích Q một khoảng 20 cm.",
    "900",
    "E = k|Q|/r² = 9·10⁹·4·10⁻⁹/0,2² = 900 V/m.",
    ["900 V/m"]),

  sa("phy_11_235", 11, "Physics", "Điện trường",
    "Hai điện tích điểm q₁ = 2·10⁻⁸ C và q₂ = 8·10⁻⁸ C đặt cố định tại hai điểm A và B cách nhau 12 cm trong không khí. Tính khoảng cách (theo đơn vị cm) từ điểm A đến điểm M có cường độ điện trường tổng hợp bằng không.",
    "4",
    "Hai điện tích cùng dấu nên điểm có E = 0 nằm trong đoạn AB: kq₁/x² = kq₂/(12 − x)² ⇒ (12 − x)/x = √(q₂/q₁) = 2 ⇒ x = 4 cm.",
    ["4 cm"]),

  sa("phy_11_236", 11, "Physics", "Điện trường",
    "Một điện tích q = 5·10⁻⁶ C di chuyển dọc theo chiều một đường sức của điện trường đều có cường độ E = 2000 V/m một đoạn đường dài 15 cm. Tính công của lực điện trường theo đơn vị mJ.",
    "1,5",
    "A = qEd = 5·10⁻⁶·2000·0,15 = 1,5·10⁻³ J = 1,5 mJ.",
    ["1,5 mJ"]),

  sa("phy_11_237", 11, "Physics", "Điện trường",
    "Hiệu điện thế giữa hai bản của một tụ điện phẳng là 240 V, khoảng cách giữa hai bản tụ là 1,2 cm. Tính cường độ điện trường đều giữa hai bản tụ theo đơn vị kV/m.",
    "20",
    "E = U/d = 240/0,012 = 20 000 V/m = 20 kV/m.",
    ["20 kV/m"]),

  sa("phy_11_238", 11, "Physics", "Điện trường",
    "Một hạt bụi nhỏ có khối lượng m = 10⁻⁸ kg mang điện tích q = 2·10⁻¹¹ C nằm cân bằng lơ lửng trong một điện trường đều có đường sức hướng thẳng đứng từ dưới lên trên. Lấy g = 10 m/s². Tính cường độ điện trường E theo đơn vị V/m.",
    "5000",
    "Cân bằng: qE = mg ⇒ E = mg/q = 10⁻⁸·10/(2·10⁻¹¹) = 5000 V/m.",
    ["5000 V/m"]),

  sa("phy_11_239", 11, "Physics", "Tụ điện",
    "Một tụ điện có điện dung C = 20 μF được tích điện dưới hiệu điện thế U = 50 V. Tính điện tích của tụ điện theo đơn vị mC.",
    "1",
    "Q = CU = 20·10⁻⁶·50 = 10⁻³ C = 1 mC.",
    ["1 mC"]),

  sa("phy_11_240", 11, "Physics", "Tụ điện",
    "Tính năng lượng điện trường (theo đơn vị mJ) dự trữ trong một tụ điện có điện dung C = 50 μF khi hiệu điện thế giữa hai bản tụ là 40 V.",
    "40",
    "W = ½CU² = ½·50·10⁻⁶·40² = 0,04 J = 40 mJ.",
    ["40 mJ"]),

  sa("phy_11_241", 11, "Physics", "Tụ điện",
    "Hai tụ điện có điện dung C₁ = 6 μF và C₂ = 3 μF được mắc nối tiếp với nhau. Tính điện dung tương đương của bộ tụ theo đơn vị μF.",
    "2",
    "C_b = C₁C₂/(C₁ + C₂) = 6·3/9 = 2 μF.",
    ["2 μF"]),

  sa("phy_11_242", 11, "Physics", "Tụ điện",
    "Hai tụ điện có điện dung C₁ = 4 μF và C₂ = 8 μF mắc song song vào hai cực của nguồn điện có hiệu điện thế U = 12 V. Tính tổng điện tích của bộ tụ điện theo đơn vị μC.",
    "144",
    "C_b = 4 + 8 = 12 μF; Q = C_bU = 12·12 = 144 μC.",
    ["144 μC"]),

  mc("phy_11_251", 11, "Physics", "Dòng điện và điện trở",
    "Cường độ dòng điện không đổi được xác định bằng thương số giữa điện lượng Δq dịch chuyển qua tiết diện thẳng của vật dẫn và khoảng thời gian Δt. Công thức đúng là",
    ["I = Δq/Δt.", "I = Δq·Δt.", "I = Δt/Δq.", "I = Δq²/Δt."], "A",
    "Cường độ dòng điện không đổi I = Δq/Δt."),

  mc("phy_11_252", 11, "Physics", "Dòng điện và điện trở",
    "Trong dây dẫn kim loại tiết diện thẳng S có mật độ electron tự do n, tốc độ dịch chuyển có hướng của các electron là v và độ lớn điện tích nguyên tố là e. Cường độ dòng điện chạy qua dây dẫn là",
    ["I = nve/S.", "I = Snve.", "I = S/(nve).", "I = S²nve."], "B",
    "Điện lượng qua tiết diện trong thời gian Δt là Δq = nSveΔt nên I = Snve."),

  mc("phy_11_253", 11, "Physics", "Dòng điện và điện trở",
    "Điện trở của một dây dẫn kim loại hình trụ đồng chất có chiều dài l, tiết diện thẳng S và điện trở suất ρ được tính theo công thức",
    ["R = ρS/l.", "R = ρl/S.", "R = l/(ρS).", "R = ρlS."], "B",
    "Điện trở của dây dẫn đồng chất: R = ρl/S."),

  mc("phy_11_254", 11, "Physics", "Dòng điện và điện trở",
    "Theo định luật Ohm cho đoạn mạch chỉ có điện trở thuần R, cường độ dòng điện chạy qua đoạn mạch",
    ["tỉ lệ nghịch với hiệu điện thế hai đầu đoạn mạch.", "tỉ lệ thuận với hiệu điện thế hai đầu đoạn mạch và tỉ lệ nghịch với điện trở.", "tỉ lệ thuận với bình phương hiệu điện thế hai đầu đoạn mạch.", "không phụ thuộc vào giá trị điện trở của đoạn mạch."], "B",
    "Định luật Ohm: I = U/R, tức tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở."),

  mc("phy_11_255", 11, "Physics", "Dòng điện và điện trở",
    "Đường đặc trưng Vôn – Ampe (I – U) của một vật dẫn kim loại ở nhiệt độ không đổi có dạng là",
    ["một đường thẳng đi qua gốc tọa độ.", "một đường parabol hướng bề lõm lên trên.", "một đường cong hypebol.", "một đường thẳng song song với trục hoành."], "A",
    "Với R không đổi, I = U/R nên đường (I − U) là đường thẳng đi qua gốc tọa độ."),

  mc("phy_11_256", 11, "Physics", "Dòng điện và điện trở",
    "Khi nhiệt độ của dây tóc bóng đèn sợi đốt tăng lên thì điện trở của dây tóc bóng đèn sẽ",
    ["giảm đi nhanh chóng.", "không thay đổi.", "tăng lên.", "giảm về bằng không."], "C",
    "Điện trở suất của kim loại tăng theo nhiệt độ nên điện trở của dây tóc tăng khi nóng lên."),

  mc("phy_11_257", 11, "Physics", "Dòng điện và điện trở",
    "Linh kiện bán dẫn nào có điện trở giảm mạnh khi có ánh sáng thích hợp chiếu vào, thường được dùng trong mạch tự động bật tắt đèn đường khi trời tối?",
    ["Nhiệt điện trở PTC.", "Quang điện trở (LDR).", "Biến trở con chạy.", "Cầu chì bảo vệ."], "B",
    "Quang điện trở (LDR) có điện trở giảm mạnh khi được chiếu sáng, dùng trong mạch tự động bật tắt đèn."),

  mc("phy_11_258", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Suất điện động ℰ của một nguồn điện được định nghĩa là đại lượng đo bằng thương số giữa",
    ["công của lực lạ dịch chuyển điện tích dương q bên trong nguồn và độ lớn điện tích q đó.", "công của lực điện mạch ngoài và cường độ dòng điện.", "hiệu điện thế hai cực nguồn và điện trở trong của nguồn.", "điện tích của nguồn và thời gian phóng điện."], "A",
    "Suất điện động ℰ = A/q: công của lực lạ khi dịch chuyển điện tích dương q bên trong nguồn, chia cho độ lớn điện tích q."),

  mc("phy_11_259", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Một nguồn điện có suất điện động ℰ và điện trở trong r cung cấp dòng điện cường độ I cho mạch ngoài. Độ giảm thế ở mạch trong bằng",
    ["ℰ − Ir.", "Ir.", "I²r.", "ℰ/r."], "B",
    "Độ giảm thế trên điện trở trong của nguồn là Ir."),

  mc("phy_11_260", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Đối với một mạch điện kín gồm nguồn điện (ℰ, r) mắc với mạch ngoài có điện trở tương đương R_N, biểu thức định luật Ohm cho toàn mạch là",
    ["I = ℰ/R_N.", "I = ℰ/(R_N − r).", "I = ℰ/(R_N + r).", "I = (R_N + r)/ℰ."], "C",
    "Định luật Ohm cho toàn mạch: I = ℰ/(R_N + r)."),

  mc("phy_11_261", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Hiệu điện thế giữa hai cực của một nguồn điện (ℰ, r) khi mạch ngoài đang hở (không có dòng điện chạy qua nguồn) bằng",
    ["0.", "ℰ.", "ℰ/2.", "Ir."], "B",
    "Mạch hở nên I = 0, do đó U = ℰ − Ir = ℰ."),

  mc("phy_11_262", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Hiện tượng đoản mạch (ngắn mạch) xảy ra khi",
    ["mạch ngoài bị đứt dây dẫn làm dòng điện bằng không.", "hai cực của nguồn điện được nối trực tiếp với nhau bằng dây dẫn có điện trở không đáng kể.", "mắc thêm nhiều điện trở nối tiếp vào mạch ngoài.", "hiệu điện thế mạch ngoài bằng suất điện động của nguồn."], "B",
    "Đoản mạch xảy ra khi hai cực của nguồn điện được nối trực tiếp với nhau bằng dây dẫn có điện trở không đáng kể."),

  mc("phy_11_263", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Hiệu suất H của một nguồn điện có điện trở trong r khi cung cấp điện cho mạch ngoài có điện trở tương đương R_N được tính bằng công thức",
    ["H = r/(R_N + r).", "H = R_N/(R_N + r).", "H = R_N/r.", "H = (R_N + r)/R_N."], "B",
    "Hiệu suất H = U_N/ℰ = R_N/(R_N + r)."),

  mc("phy_11_264", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Ghép nối tiếp n nguồn điện giống nhau, mỗi nguồn có suất điện động ℰ và điện trở trong r, ta thu được bộ nguồn có",
    ["ℰ_b = ℰ và r_b = r/n.", "ℰ_b = nℰ và r_b = r/n.", "ℰ_b = nℰ và r_b = nr.", "ℰ_b = ℰ/n và r_b = nr."], "C",
    "Ghép nối tiếp n nguồn giống nhau: ℰ_b = nℰ và r_b = nr."),

  mc("phy_11_265", 11, "Physics", "Năng lượng và công suất điện",
    "Trên hóa đơn tiền điện sinh hoạt, đơn vị 1 kWh (1 số điện) tương ứng với lượng điện năng bằng",
    ["1000 J.", "3600 J.", "360 000 J.", "3 600 000 J."], "D",
    "1 kWh = 1000 W · 3600 s = 3,6·10⁶ J = 3 600 000 J."),

  mc("phy_11_266", 11, "Physics", "Năng lượng và công suất điện",
    "Công suất điện tiêu thụ của một đoạn mạch có hiệu điện thế U và cường độ dòng điện chạy qua là I được tính theo công thức",
    ["P = UI.", "P = U/I.", "P = U²I.", "P = UI²."], "A",
    "Công suất điện tiêu thụ của đoạn mạch: P = UI."),

  mc("phy_11_267", 11, "Physics", "Năng lượng và công suất điện",
    "Nhiệt lượng Q tỏa ra trên một vật dẫn có điện trở R khi có dòng điện không đổi cường độ I chạy qua trong thời gian t là",
    ["Q = IRt.", "Q = I²Rt.", "Q = I²R/t.", "Q = IR²t."], "B",
    "Định luật Joule – Lenz: Q = I²Rt."),

  mc("phy_11_268", 11, "Physics", "Năng lượng và công suất điện",
    "Công suất của một nguồn điện có suất điện động ℰ khi phát ra dòng điện cường độ I là",
    ["P_nguồn = ℰI.", "P_nguồn = ℰ/I.", "P_nguồn = ℰ²I.", "P_nguồn = I²r."], "A",
    "Công suất của nguồn điện: P_nguồn = ℰI."),

  mc("phy_11_269", 11, "Physics", "Năng lượng và công suất điện",
    "Một bàn là điện có ghi 220 V − 1100 W. Khi bàn là hoạt động bình thường ở hiệu điện thế 220 V thì điện trở của bàn là bằng",
    ["5 Ω.", "22 Ω.", "44 Ω.", "220 Ω."], "C",
    "R = U²/P = 220²/1100 = 44 Ω."),

  mc("phy_11_270", 11, "Physics", "Năng lượng và công suất điện",
    "Mắc một biến trở R vào hai cực của một nguồn điện có suất điện động ℰ và điện trở trong r. Công suất tiêu thụ trên biến trở đạt giá trị cực đại khi điều chỉnh",
    ["R = 0.", "R = r/2.", "R = r.", "R = 2r."], "C",
    "Công suất trên biến trở P = ℰ²R/(R + r)² đạt cực đại khi R = r."),

  tf("phy_11_271", 11, "Physics", "Dòng điện và điện trở",
    "Một dòng điện không đổi chạy qua một dây dẫn kim loại trong khoảng thời gian t = 10 s thì làm dịch chuyển một điện lượng q = 16 C qua tiết diện thẳng của dây dẫn. Biết độ lớn điện tích nguyên tố e = 1,6·10⁻¹⁹ C. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cường độ dòng điện chạy qua dây dẫn là I = 1,6 A.", true],
      ["Số electron tự do chạy qua tiết diện thẳng của dây dẫn trong 10 s là 10²⁰ hạt.", true],
      ["Các electron tự do trong dây dẫn dịch chuyển cùng chiều với chiều quy ước của dòng điện.", false],
      ["Tốc độ dịch chuyển có hướng (vận tốc trôi) của các electron tự do trong dây dẫn kim loại rất nhỏ (cỡ vài milimét mỗi giây).", true],
    ],
    "I = q/t = 16/10 = 1,6 A (a đúng). Số electron N = q/e = 16/(1,6·10⁻¹⁹) = 10²⁰ hạt (b đúng). Electron mang điện âm nên chuyển động ngược chiều dòng điện quy ước (c sai). Tốc độ dịch chuyển có hướng của electron rất nhỏ (cỡ mm/s) (d đúng)."),

  tf("phy_11_272", 11, "Physics", "Dòng điện và điện trở",
    "Khi khảo sát đường đặc trưng Vôn – Ampe (I − U) của một điện trở mẫu làm bằng hợp kim constantan và một bóng đèn dây tóc vonfram: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Đường đặc trưng (I − U) của điện trở mẫu là đường thẳng đi qua gốc tọa độ vì điện trở suất của hợp kim hầu như không đổi theo nhiệt độ.", true],
      ["Đường đặc trưng (I − U) của bóng đèn sợi đốt bị uốn cong về phía trục hiệu điện thế U khi U tăng cao.", true],
      ["Khi bóng đèn sáng bình thường, điện trở của dây tóc bóng đèn nhỏ hơn so với lúc đèn chưa sáng (nguội).", false],
      ["Trên đồ thị (I − U), độ dốc của đường thẳng đặc trưng của điện trở mẫu càng lớn thì điện trở R của nó càng nhỏ.", true],
    ],
    "Constantan có điện trở suất gần như không đổi theo nhiệt độ nên đường (I − U) là đường thẳng qua gốc (a đúng). Dây tóc nóng lên, điện trở tăng nên đường đặc trưng bị uốn cong về phía trục U (b đúng). Khi sáng bình thường điện trở dây tóc lớn hơn lúc nguội (c sai). Độ dốc của đường (I − U) bằng 1/R nên dốc càng lớn thì R càng nhỏ (d đúng)."),

  tf("phy_11_273", 11, "Physics", "Dòng điện và điện trở",
    "Một nhiệt điện trở loại NTC (hệ số nhiệt điện trở âm) được mắc nối tiếp với một điện trở bảo vệ vào nguồn điện không đổi để làm mạch cảnh báo cháy. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi nhiệt độ môi trường tăng cao (xảy ra hỏa hoạn), điện trở của nhiệt điện trở NTC giảm mạnh.", true],
      ["Khi điện trở của nhiệt điện trở NTC giảm thì cường độ dòng điện chạy trong mạch tăng lên.", true],
      ["Mạch cảnh báo cháy hoạt động dựa trên sự không đổi của điện trở theo nhiệt độ.", false],
      ["Nhiệt điện trở được ứng dụng phổ biến trong nhiệt kế điện tử và cảm biến nhiệt của nồi cơm điện, máy lạnh.", true],
    ],
    "NTC có điện trở giảm mạnh khi nhiệt độ tăng (a đúng) nên dòng điện trong mạch tăng (b đúng). Mạch báo cháy hoạt động dựa trên sự thay đổi của điện trở theo nhiệt độ, không phải sự không đổi (c sai). Nhiệt điện trở dùng trong nhiệt kế điện tử và cảm biến nhiệt (d đúng)."),

  tf("phy_11_274", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Cho mạch điện kín gồm một nguồn điện có suất điện động ℰ = 12 V, điện trở trong r = 1 Ω mắc với mạch ngoài là một điện trở R = 5 Ω. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Cường độ dòng điện chạy trong mạch kín là I = 2 A.", true],
      ["Hiệu điện thế mạch ngoài giữa hai cực của nguồn điện bằng 12 V.", false],
      ["Công suất của nguồn điện cung cấp cho toàn mạch là 24 W.", true],
      ["Hiệu suất của nguồn điện trong mạch này bằng 83,3%.", true],
    ],
    "I = ℰ/(R + r) = 12/6 = 2 A (a đúng). U_N = IR = 10 V, không phải 12 V (b sai). P_nguồn = ℰI = 24 W (c đúng). H = R/(R + r) = 5/6 ≈ 83,3% (d đúng)."),

  tf("phy_11_275", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Xét sự cố đoản mạch (chập điện) trong mạng điện gia đình và các thiết bị bảo vệ an toàn điện: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi hai dây dẫn nóng và nguội bị tróc vỏ cách điện chạm trực tiếp vào nhau thì xảy ra hiện tượng đoản mạch.", true],
      ["Lúc xảy ra đoản mạch, dòng điện trong mạch tăng đột ngột làm tỏa nhiệt lượng rất lớn theo định luật Joule – Lenz, dễ gây hỏa hoạn.", true],
      ["Cầu chì hoặc aptomat (CB) phải được mắc song song với các thiết bị điện để bảo vệ mạch.", false],
      ["Khi dòng điện vượt quá giới hạn định mức, aptomat tự động ngắt mạch để bảo vệ đường dây và thiết bị.", true],
    ],
    "Hai dây nóng và nguội chạm nhau trực tiếp gây đoản mạch (a đúng). Dòng điện tăng đột ngột làm tỏa nhiệt Q = I²Rt rất lớn, dễ gây cháy (b đúng). Cầu chì hoặc aptomat phải mắc nối tiếp với mạch cần bảo vệ, không phải song song (c sai). Khi quá dòng, aptomat tự động ngắt mạch (d đúng)."),

  tf("phy_11_276", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Một nhóm học sinh tiến hành thí nghiệm đo suất điện động ℰ và điện trở trong r của một viên pin điện hóa bằng cách mắc pin nối tiếp với biến trở R, ampe kế A và mắc vôn kế V song song với hai cực của pin. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Khi ngắt khóa K (mạch hở), số chỉ của vôn kế xấp xỉ bằng suất điện động ℰ của pin.", true],
      ["Khi đóng khóa K và giảm dần giá trị biến trở R thì số chỉ ampe kế tăng lên còn số chỉ vôn kế giảm xuống.", true],
      ["Mục đích của biến trở R trong mạch là để tạo ra hiện tượng đoản mạch cho pin.", false],
      ["Từ các cặp giá trị (I; U) đo được, học sinh vẽ đồ thị U theo I để xác định giá trị ℰ và r chính xác hơn.", true],
    ],
    "Khi mạch hở, vôn kế chỉ xấp xỉ ℰ (a đúng). Giảm R thì I tăng, U = ℰ − Ir giảm (b đúng). Biến trở dùng để thay đổi dòng điện, thu được nhiều cặp (I; U), không phải để gây đoản mạch (c sai). Vẽ đồ thị U theo I giúp xác định ℰ và r chính xác hơn (d đúng)."),

  tf("phy_11_277", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Đồ thị thực nghiệm biểu diễn sự phụ thuộc của hiệu điện thế hai cực nguồn điện U theo cường độ dòng điện I là một đoạn thẳng đi qua hai điểm (I = 0 A; U = 9,0 V) và (I = 2,0 A; U = 6,0 V). Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Suất điện động của nguồn điện là ℰ = 9,0 V.", true],
      ["Điện trở trong của nguồn điện bằng 1,5 Ω.", true],
      ["Dòng điện đoản mạch cực đại của nguồn điện này bằng 4,5 A.", false],
      ["Khi cường độ dòng điện trong mạch là I = 1,0 A thì hiệu điện thế mạch ngoài bằng 7,5 V.", true],
    ],
    "Đồ thị U = ℰ − Ir: tại I = 0, U = ℰ = 9,0 V (a đúng). r = (9,0 − 6,0)/2,0 = 1,5 Ω (b đúng). Dòng đoản mạch I = ℰ/r = 9,0/1,5 = 6 A, không phải 4,5 A (c sai). Khi I = 1,0 A: U = 9,0 − 1,5·1,0 = 7,5 V (d đúng)."),

  tf("phy_11_278", 11, "Physics", "Năng lượng và công suất điện",
    "Một hộ gia đình sử dụng đồng thời các thiết bị điện đúng công suất định mức mỗi ngày như sau: một tủ lạnh công suất 150 W chạy 16 giờ/ngày; một nồi cơm điện công suất 800 W chạy 1,5 giờ/ngày; một máy lạnh công suất 1200 W chạy 4 giờ/ngày. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện năng tiêu thụ của tủ lạnh trong một ngày là 2,4 kWh.", true],
      ["Tổng lượng điện năng tiêu thụ của cả ba thiết bị trong một ngày là 8,4 kWh.", true],
      ["Trong một tháng (30 ngày), tổng số điện tiêu thụ của ba thiết bị trên là 252 kWh.", true],
      ["Công tơ điện lắp trước cửa nhà dùng để đo công suất điện tức thời của gia đình.", false],
    ],
    "Tủ lạnh: 0,15 kW·16 h = 2,4 kWh (a đúng). Nồi cơm: 0,8·1,5 = 1,2 kWh; máy lạnh: 1,2·4 = 4,8 kWh; tổng 2,4 + 1,2 + 4,8 = 8,4 kWh/ngày (b đúng). Trong 30 ngày: 8,4·30 = 252 kWh (c đúng). Công tơ điện đo điện năng tiêu thụ (kWh), không phải công suất tức thời (d sai)."),

  tf("phy_11_279", 11, "Physics", "Năng lượng và công suất điện",
    "Mắc một biến trở R vào hai cực của một nguồn điện có suất điện động ℰ = 6 V và điện trở trong r = 2 Ω. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Công suất tiêu thụ trên biến trở đạt cực đại khi điều chỉnh R = 2 Ω.", true],
      ["Giá trị công suất cực đại trên biến trở bằng 4,5 W.", true],
      ["Khi công suất mạch ngoài đạt cực đại thì hiệu suất của nguồn điện đạt 100%.", false],
      ["Khi R = 1 Ω và khi R = 4 Ω thì công suất tiêu thụ trên biến trở có giá trị bằng nhau.", true],
    ],
    "Công suất trên biến trở cực đại khi R = r = 2 Ω (a đúng), Pmax = ℰ²/(4r) = 36/8 = 4,5 W (b đúng). Khi đó hiệu suất H = R/(R + r) = 50%, không phải 100% (c sai). Với R = 1 Ω: I = 2 A, P = 4 W; với R = 4 Ω: I = 1 A, P = 4 W; hai giá trị bằng nhau vì R₁R₂ = r² (d đúng)."),

  tf("phy_11_280", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Ghép nối tiếp 4 viên pin giống nhau, mỗi viên pin có suất điện động 1,5 V và điện trở trong 0,25 Ω thành một bộ nguồn rồi nối với một bóng đèn có ghi 6 V − 3 W. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Bộ nguồn có suất điện động ℰ_b = 6 V và điện trở trong r_b = 1 Ω.", true],
      ["Điện trở của bóng đèn khi sáng bình thường là 12 Ω.", true],
      ["Khi nối vào bộ nguồn trên, bóng đèn sáng mạnh hơn mức bình thường.", false],
      ["Nếu đổi sang ghép 4 viên pin đó song song thì suất điện động của bộ nguồn chỉ còn 1,5 V.", true],
    ],
    "ℰ_b = 4·1,5 = 6 V; r_b = 4·0,25 = 1 Ω (a đúng). R_đèn = U²/P = 36/3 = 12 Ω (b đúng). I = 6/(12 + 1) ≈ 0,46 A, nhỏ hơn dòng định mức 0,5 A nên đèn sáng yếu hơn bình thường (c sai). Ghép song song 4 pin giống nhau thì ℰ_b = 1,5 V (d đúng)."),

  tf("phy_11_281", 11, "Physics", "Năng lượng và công suất điện",
    "Cho hai bóng đèn sợi đốt Đ₁ (220 V − 60 W) và Đ₂ (220 V − 100 W). Coi điện trở của mỗi bóng đèn không đổi. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Điện trở của bóng đèn Đ₁ lớn hơn điện trở của bóng đèn Đ₂.", true],
      ["Khi mắc song song hai bóng đèn vào mạng điện 220 V thì cả hai đèn đều sáng bình thường và đèn Đ₂ sáng hơn.", true],
      ["Khi mắc nối tiếp hai bóng đèn vào mạng điện 220 V thì đèn Đ₂ sáng hơn đèn Đ₁.", false],
      ["Khi mắc nối tiếp hai bóng đèn vào mạng điện 220 V thì tổng công suất tiêu thụ của cả hai đèn bằng 160 W.", false],
    ],
    "R = U²/P nên R₁ = 806,7 Ω lớn hơn R₂ = 484 Ω (a đúng). Mắc song song vào 220 V cả hai sáng bình thường, đèn 100 W sáng hơn (b đúng). Khi mắc nối tiếp, P = I²R nên đèn có R lớn hơn (Đ₁) sáng hơn Đ₂ (c sai). Mắc nối tiếp: P = U²/(R₁ + R₂) = 48400/1290,7 ≈ 37,5 W, không phải 160 W (d sai)."),

  tf("phy_11_282", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Xét sự chuyển hóa năng lượng bên trong các loại nguồn điện thực tế: Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Trong pin điện hóa và ắc quy, hóa năng được chuyển hóa trực tiếp thành điện năng.", true],
      ["Trong tấm pin mặt trời (pin quang điện), quang năng được biến đổi trực tiếp thành điện năng.", true],
      ["Lực lạ bên trong nguồn điện có bản chất là lực tĩnh điện Coulomb.", false],
      ["Khi sạc điện cho pin điện thoại, điện năng từ bộ sạc chuyển hóa ngược lại thành hóa năng tích trữ trong pin.", true],
    ],
    "Pin, ắc quy biến hóa năng thành điện năng (a đúng); pin quang điện biến quang năng thành điện năng (b đúng). Lực lạ trong nguồn không phải lực tĩnh điện Coulomb (c sai). Khi sạc, điện năng chuyển thành hóa năng tích trữ trong pin (d đúng)."),

  sa("phy_11_283", 11, "Physics", "Dòng điện và điện trở",
    "Trong khoảng thời gian 20 s, có một điện lượng q = 30 C dịch chuyển qua tiết diện thẳng của một dây dẫn. Tính cường độ dòng điện không đổi chạy qua dây dẫn theo đơn vị Ampe (A).",
    "1,5",
    "I = q/t = 30/20 = 1,5 A.",
    ["1,5 A"]),

  sa("phy_11_284", 11, "Physics", "Dòng điện và điện trở",
    "Đặt một hiệu điện thế không đổi U = 12 V vào hai đầu một đoạn dây dẫn thì cường độ dòng điện chạy qua dây dẫn là I = 0,4 A. Tính điện trở của đoạn dây dẫn theo đơn vị Ohm (Ω).",
    "30",
    "R = U/I = 12/0,4 = 30 Ω.",
    ["30 Ω", "30 ohm"]),

  sa("phy_11_285", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Một nguồn điện có suất điện động ℰ = 9 V, điện trở trong r = 1 Ω được mắc với điện trở mạch ngoài R = 8 Ω thành mạch kín. Tính cường độ dòng điện chạy trong mạch theo đơn vị Ampe (A).",
    "1",
    "I = ℰ/(R + r) = 9/(8 + 1) = 1 A.",
    ["1 A"]),

  sa("phy_11_286", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Trong mạch điện kín gồm nguồn điện có suất điện động ℰ = 9 V, điện trở trong r = 1 Ω mắc với điện trở ngoài R = 8 Ω, tính hiệu điện thế mạch ngoài theo đơn vị Vôn (V).",
    "8",
    "I = ℰ/(R + r) = 1 A nên U_N = IR = 1·8 = 8 V.",
    ["8 V"]),

  sa("phy_11_287", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Tính hiệu suất của một nguồn điện (theo đơn vị phần trăm %) có điện trở trong r = 2 Ω khi cung cấp điện cho mạch ngoài có điện trở tương đương R_N = 6 Ω.",
    "75",
    "H = R_N/(R_N + r) = 6/8 = 0,75 = 75%.",
    ["75%"]),

  sa("phy_11_288", 11, "Physics", "Năng lượng và công suất điện",
    "Một bếp điện hoạt động bình thường ở hiệu điện thế 220 V với cường độ dòng điện chạy qua là 5 A. Tính công suất điện tiêu thụ của bếp theo đơn vị kilowatt (kW).",
    "1,1",
    "P = UI = 220·5 = 1100 W = 1,1 kW.",
    ["1,1 kW"]),

  sa("phy_11_289", 11, "Physics", "Năng lượng và công suất điện",
    "Tính nhiệt lượng tỏa ra (theo đơn vị kJ) trên một điện trở R = 20 Ω khi có dòng điện không đổi cường độ I = 2 A chạy qua trong thời gian 5 phút.",
    "24",
    "Q = I²Rt = 2²·20·300 = 24 000 J = 24 kJ.",
    ["24 kJ"]),

  sa("phy_11_290", 11, "Physics", "Năng lượng và công suất điện",
    "Một máy điều hòa nhiệt độ có công suất tiêu thụ 1,2 kW hoạt động trung bình 5 giờ mỗi ngày. Tính lượng điện năng tiêu thụ của máy điều hòa này trong 30 ngày theo đơn vị kWh.",
    "180",
    "A = P·t = 1,2 kW · 5 h · 30 ngày = 180 kWh.",
    ["180 kWh"]),

  sa("phy_11_291", 11, "Physics", "Năng lượng và công suất điện",
    "Cho một nguồn điện có suất điện động ℰ = 12 V và điện trở trong r = 2 Ω mắc với một biến trở R thành mạch kín. Điều chỉnh biến trở R để công suất tiêu thụ trên biến trở đạt giá trị cực đại. Tính giá trị công suất cực đại đó theo đơn vị Watt (W).",
    "18",
    "Công suất trên biến trở cực đại khi R = r = 2 Ω: Pmax = ℰ²/(4r) = 144/8 = 18 W.",
    ["18 W"]),

  sa("phy_11_292", 11, "Physics", "Nguồn điện và định luật Ohm toàn mạch",
    "Từ đồ thị thực nghiệm biểu diễn sự phụ thuộc của hiệu điện thế hai cực nguồn điện U theo cường độ dòng điện I, người ta thấy đường thẳng cắt trục tung tại giá trị U = 6,0 V và cắt trục hoành tại giá trị I = 3,0 A. Tính điện trở trong r của nguồn điện theo đơn vị Ohm (Ω).",
    "2",
    "Đường thẳng U = ℰ − Ir cắt trục tung tại ℰ = 6,0 V và cắt trục hoành tại I = ℰ/r = 3,0 A ⇒ r = 6,0/3,0 = 2 Ω.",
    ["2 Ω", "2 ohm"]),

  // ===== Grade 11 - Chemistry =====
  tf("che_11_01", 11, "Chemistry", "Sự điện li",
    "Đánh giá tính Đúng/Sai: Dung dịch NaCl dẫn điện được là do có sự di chuyển của các electron tự do.",
    [["Phát biểu trên là đúng hay sai?", false]],
    "Sai. Dung dịch NaCl dẫn điện do các ion Na+ và Cl- di chuyển, không phải electron tự do."),
  mc("che_11_02", 11, "Chemistry", "Sự điện li",
    "Chất nào sau đây là chất điện li mạnh?",
    ["CH₃COOH", "HCl", "H₂O", "C₂H₅OH"], "B",
    "HCl là acid mạnh, phân li hoàn toàn trong nước. CH₃COOH và H₂O điện li yếu, C₂H₅OH không điện li."),
  sa("che_11_03", 11, "Chemistry", "Sự điện li",
    "Tính pH của dung dịch HCl 0,001M ở 25°C.",
    "3",
    "HCl phân li hoàn toàn nên [H⁺] = 10⁻³ M, do đó pH = −log(10⁻³) = 3."),
  mc("che_11_04", 11, "Chemistry", "Nitrogen – Sulfur",
    "Khí nào sau đây là một trong những nguyên nhân chính gây ra hiện tượng mưa acid?",
    ["CO₂", "SO₂", "O₂", "N₂"], "B",
    "SO₂ (cùng với các oxide của nitrogen) tan trong nước mưa tạo H₂SO₃/H₂SO₄ làm nước mưa có tính acid."),
  tf("che_11_05", 11, "Chemistry", "Nitrogen – Sulfur",
    "Xét khí ammonia (NH₃). Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["NH₃ tan nhiều trong nước.", true],
      ["NH₃ làm quỳ tím ẩm hóa đỏ.", false],
      ["NH₃ có tính khử.", true],
      ["NH₃ được dùng để sản xuất phân đạm.", true],
    ],
    "NH₃ tan rất nhiều trong nước tạo dung dịch có tính base nên làm quỳ tím ẩm hóa xanh; N trong NH₃ có số oxi hóa −3 nên có tính khử."),

  // ===== Grade 11 - Biology =====
  mc("bio_11_01", 11, "Biology", "Quang hợp ở thực vật",
    "Pha sáng của quang hợp diễn ra ở vị trí nào trong lục lạp?",
    ["Chất nền (stroma)", "Màng thylakoid", "Màng ngoài lục lạp", "Tế bào chất"], "B",
    "Các sắc tố và chuỗi chuyền electron của pha sáng nằm trên màng thylakoid."),
  sa("bio_11_02", 11, "Biology", "Quang hợp ở thực vật",
    "Sản phẩm khí được giải phóng trong pha sáng của quang hợp là khí gì?",
    "O2",
    "Quang phân li nước trong pha sáng giải phóng O₂.",
    ["oxi", "oxygen", "khí oxi", "O₂"]),
  mc("bio_11_03", 11, "Biology", "Cảm ứng ở động vật",
    "Đơn vị cấu tạo và chức năng của hệ thần kinh là:",
    ["Neuron", "Synapse", "Tủy sống", "Não bộ"], "A",
    "Neuron (tế bào thần kinh) là đơn vị cấu tạo và chức năng cơ bản của hệ thần kinh."),
  tf("bio_11_04", 11, "Biology", "Cảm ứng ở động vật",
    "Xét điện thế nghỉ của neuron. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Mặt trong màng tế bào tích điện âm so với mặt ngoài.", true],
      ["Điện thế nghỉ hình thành chủ yếu do sự phân bố ion và tính thấm chọn lọc của màng.", true],
      ["Giá trị điện thế nghỉ khoảng +70 mV.", false],
      ["Bơm Na⁺–K⁺ góp phần duy trì điện thế nghỉ.", true],
    ],
    "Điện thế nghỉ khoảng −70 mV (trong âm, ngoài dương), duy trì nhờ tính thấm chọn lọc của màng và bơm Na⁺–K⁺."),

  // ===== Grade 12 - Physics =====
  mc("phy_12_01", 12, "Physics", "Khí lí tưởng",
    "Trong quá trình đẳng nhiệt của một lượng khí lí tưởng xác định, đại lượng nào sau đây không đổi?",
    ["p/V", "p·V", "V/T", "p/T"], "B",
    "Định luật Boyle: ở nhiệt độ không đổi, p·V = hằng số."),
  sa("phy_12_02", 12, "Physics", "Khí lí tưởng",
    "Một lượng khí lí tưởng có nhiệt độ 27°C. Nhiệt độ này tương ứng bao nhiêu kelvin?",
    "300",
    "T(K) = t(°C) + 273 = 27 + 273 = 300 K."),
  mc("phy_12_03", 12, "Physics", "Vật lí hạt nhân",
    "Hạt nhân carbon-14 (¹⁴₆C) có bao nhiêu neutron?",
    ["6", "8", "14", "20"], "B",
    "Số neutron N = A − Z = 14 − 6 = 8."),
  tf("phy_12_04", 12, "Physics", "Vật lí hạt nhân",
    "Xét hiện tượng phóng xạ. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Phóng xạ là quá trình hạt nhân không bền tự phân rã và phát ra tia phóng xạ.", true],
      ["Phóng xạ chịu ảnh hưởng mạnh của nhiệt độ và áp suất bên ngoài.", false],
      ["Số hạt nhân phóng xạ còn lại giảm theo quy luật hàm số mũ theo thời gian.", true],
      ["Chu kì bán rã là thời gian để số hạt nhân phóng xạ giảm đi một nửa.", true],
    ],
    "Phóng xạ là quá trình ngẫu nhiên, không phụ thuộc điều kiện bên ngoài; N = N₀·2^(−t/T)."),

  // ===== Grade 12 - Chemistry =====
  mc("che_12_01", 12, "Chemistry", "Ester – Lipid",
    "Phản ứng thủy phân ester trong môi trường kiềm (ví dụ dung dịch NaOH) được gọi là phản ứng:",
    ["Ester hóa", "Xà phòng hóa", "Trùng hợp", "Hydrate hóa"], "B",
    "Thủy phân ester trong môi trường kiềm là phản ứng một chiều tạo muối carboxylate và alcohol, gọi là xà phòng hóa."),
  sa("che_12_02", 12, "Chemistry", "Ester – Lipid",
    "Số nguyên tử carbon trong phân tử ethyl acetate (CH₃COOC₂H₅) là bao nhiêu?",
    "4",
    "CH₃COOC₂H₅ có 2 nguyên tử C ở gốc acid và 2 nguyên tử C ở gốc alcohol, tổng cộng 4."),
  mc("che_12_03", 12, "Chemistry", "Đại cương về kim loại",
    "Kim loại nào sau đây dẫn điện tốt nhất ở nhiệt độ thường?",
    ["Cu", "Ag", "Au", "Al"], "B",
    "Thứ tự dẫn điện giảm dần: Ag > Cu > Au > Al > Fe."),
  tf("che_12_04", 12, "Chemistry", "Đại cương về kim loại",
    "Xét sự ăn mòn kim loại. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Ăn mòn điện hóa cần có hai điện cực khác bản chất tiếp xúc nhau trong dung dịch chất điện li.", true],
      ["Ăn mòn hóa học có phát sinh dòng điện.", false],
      ["Mạ kẽm lên bề mặt sắt là một biện pháp bảo vệ sắt khỏi ăn mòn.", true],
      ["Trong ăn mòn điện hóa, kim loại có tính khử mạnh hơn đóng vai trò cực dương (cathode).", false],
    ],
    "Ăn mòn hóa học không phát sinh dòng điện. Kim loại mạnh hơn bị oxi hóa nên đóng vai trò cực âm (anode)."),

  // ===== Grade 12 - Biology =====
  sa("bio_12_01", 12, "Biology", "Di truyền học",
    "Loại axit nucleic nào mang bộ ba đối mã (anticodon) trong quá trình dịch mã?",
    "tRNA",
    "tRNA (ARN vận chuyển) mang anticodon khớp với codon trên mRNA.",
    ["tARN", "ARNt", "ARN vận chuyển"]),
  mc("bio_12_02", 12, "Biology", "Di truyền học",
    "Quá trình tổng hợp mRNA dựa trên mạch khuôn của DNA được gọi là:",
    ["Nhân đôi DNA", "Phiên mã", "Dịch mã", "Đột biến"], "B",
    "Phiên mã là quá trình truyền thông tin di truyền từ DNA sang RNA."),
  sa("bio_12_03", 12, "Biology", "Di truyền học",
    "Một đoạn mRNA có 120 nucleotide. Tối đa có bao nhiêu codon (bộ ba)?",
    "40",
    "Mỗi codon gồm 3 nucleotide nên số codon tối đa là 120 : 3 = 40."),
  mc("bio_12_04", 12, "Biology", "Tiến hóa",
    "Nhân tố tiến hóa nào làm phát sinh các alen mới cho quần thể?",
    ["Chọn lọc tự nhiên", "Đột biến", "Giao phối không ngẫu nhiên", "Phiêu bạt di truyền"], "B",
    "Đột biến tạo ra alen mới, là nguồn nguyên liệu sơ cấp cho tiến hóa."),
  tf("bio_12_05", 12, "Biology", "Tiến hóa",
    "Xét chọn lọc tự nhiên. Đánh giá tính Đúng/Sai của các phát biểu sau:",
    [
      ["Chọn lọc tự nhiên tác động trực tiếp lên kiểu hình.", true],
      ["Chọn lọc tự nhiên làm thay đổi tần số alen theo một hướng xác định.", true],
      ["Chọn lọc tự nhiên tạo ra các alen mới.", false],
      ["Chọn lọc tự nhiên là nhân tố tiến hóa có hướng.", true],
    ],
    "Chọn lọc tự nhiên chỉ sàng lọc các kiểu hình, thay đổi tần số alen có hướng; alen mới do đột biến tạo ra."),
];

const mockExams = [
  {
    // Giữ nguyên examId để không mất liên kết lịch sử làm bài cũ.
    // Trước đây đề này trộn câu Hóa (che_11_01) và Sinh (bio_12_01); nay chỉ còn câu Vật lí lớp 10–12.
    examId: "exam_demo_01",
    title: "Đề thi thử THPT Quốc gia - Môn Lý (Rút gọn)",
    defaultTimeMinutes: 50,
    kind: "mock",
    examCategory: "subject",
    subject: "Physics",
    questions: [
      "phy_10_01", "phy_10_04", "phy_11_01", "phy_12_03",
      "phy_10_03", "phy_12_04",
      "phy_10_02", "phy_12_02",
    ],
  },
  {
    examId: "exam_phy_mock_01",
    title: "Đề thi thử Vật lí tổng hợp 10 – 12",
    defaultTimeMinutes: 45,
    kind: "mock",
    examCategory: "subject",
    subject: "Physics",
    questions: [
      "phy_10_01", "phy_10_04", "phy_10_05", "phy_11_01", "phy_11_03", "phy_12_01", "phy_12_03",
      "phy_10_03", "phy_11_04", "phy_12_04",
      "phy_10_02", "phy_11_02", "phy_12_02",
    ],
  },
  {
    examId: "exam_che_real_01",
    title: "Đề minh họa Hóa học – Cấu trúc THPT Quốc gia",
    defaultTimeMinutes: 50,
    kind: "real",
    examCategory: "subject",
    subject: "Chemistry",
    questions: [
      "che_10_01", "che_10_03", "che_11_02", "che_11_04", "che_12_01", "che_12_03",
      "che_10_04", "che_11_05", "che_12_04",
      "che_10_02", "che_11_03", "che_12_02",
    ],
  },
  {
    examId: "exam_bio_real_01",
    title: "Đề minh họa Sinh học – Cấu trúc THPT Quốc gia",
    defaultTimeMinutes: 90,
    kind: "real",
    examCategory: "subject",
    subject: "Biology",
    questions: [
      "bio_10_01", "bio_10_03", "bio_11_01", "bio_11_03", "bio_12_02", "bio_12_04",
      "bio_10_04", "bio_11_04", "bio_12_05",
      "bio_10_02", "bio_11_02", "bio_12_03", "bio_12_01",
    ],
  },
];
