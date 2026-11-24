/* Tiếng Anh: câu hỏi mẫu lớp 10 – 12 và đề thi thử. Nạp sau data.js và data-extra.js
 * (dùng lại các hàm mc / tf / sa / dd và mảng questionBank, mockExams).
 * Đề bài viết bằng tiếng Anh như đề thi thật, lời giải thích viết bằng tiếng Việt.
 * Đoạn đọc hiểu được đặt thẳng trong questionText (mỗi câu tự chứa đủ ngữ cảnh). */

questionBank.push(
  // ===== Lớp 10 – Thì của động từ =====
  mc("eng_10_01", 10, "English", "Thì của động từ",
    "By the time we arrived at the cinema, the film ________.",
    ["has already started", "had already started", "will already start", "is already starting"], "B",
    "“By the time + quá khứ đơn” diễn tả hành động đã xảy ra trước một mốc trong quá khứ nên dùng thì quá khứ hoàn thành: had already started."),
  mc("eng_10_02", 10, "English", "Thì của động từ",
    "She ________ in Ho Chi Minh City since 2018.",
    ["lives", "lived", "has lived", "is living"], "C",
    "“Since + mốc thời gian” là dấu hiệu của thì hiện tại hoàn thành: has lived."),
  tf("eng_10_03", 10, "English", "Thì của động từ",
    "Decide whether each of the following sentences is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["She has lived here since 2015.", true],
      ["He go to school by bike every day.", false],
      ["They were watching TV when the phone rang.", true],
      ["I am knowing the answer now.", false],
    ],
    "Câu 2 sai vì chủ ngữ ngôi thứ ba số ít cần “goes”. Câu 4 sai vì “know” là động từ chỉ trạng thái, thường không dùng ở thì tiếp diễn (phải là “I know the answer now”)."),
  sa("eng_10_04", 10, "English", "Thì của động từ",
    "Write the correct form of the verb in brackets: Yesterday, while I ________ (walk) home, it began to rain.",
    "was walking",
    "Hành động đang diễn ra (walk) thì bị hành động khác xen vào (began) nên dùng quá khứ tiếp diễn: was walking.",
    ["was walking"]),

  // ===== Lớp 10 – Từ vựng theo chủ đề =====
  mc("eng_10_05", 10, "English", "Từ vựng theo chủ đề",
    "The ________ between parents and their teenage children often leads to arguments about fashion and music.",
    ["generation gap", "family reunion", "nuclear family", "sibling rivalry"], "A",
    "“Generation gap” là khoảng cách thế hệ, tức sự khác biệt về quan điểm và lối sống giữa cha mẹ và con cái."),
  mc("eng_10_06", 10, "English", "Từ vựng theo chủ đề",
    "Choose the word CLOSEST in meaning to “delighted”: The teacher was delighted with her students’ performance.",
    ["disappointed", "worried", "pleased", "confused"], "C",
    "“Delighted” nghĩa là rất vui, hài lòng, gần nghĩa nhất với “pleased”."),
  tf("eng_10_07", 10, "English", "Từ vựng theo chủ đề",
    "Decide whether each word is matched with the correct definition (Đúng) or not (Sai):",
    [
      ["Volunteer: a person who does work without being paid.", true],
      ["Recycle: to throw things away carelessly.", false],
      ["Hobby: an activity that you do for pleasure in your free time.", true],
      ["Pollution: the clean air and water in a place.", false],
    ],
    "“Recycle” là tái chế (xử lý vật liệu đã dùng để sử dụng lại), còn “pollution” là ô nhiễm (chất độc hại trong không khí, nước hoặc đất)."),
  sa("eng_10_08", 10, "English", "Từ vựng theo chủ đề",
    "Write the correct form of the word in brackets: Recycling is one of the most ________ ways to protect the environment. (EFFECT)",
    "effective",
    "Sau “the most” và trước danh từ “ways” cần một tính từ: effective (hiệu quả)."),
  dd("eng_10_09", 10, "English", "Từ vựng theo chủ đề",
    "Kéo mỗi định nghĩa vào từ tương ứng.",
    [
      ["volunteer", "a person who works without being paid"],
      ["pollution", "harmful substances in the air, water or soil"],
      ["hobby", "an activity you enjoy in your free time"],
      ["scholarship", "money given to a student to help pay for study"],
      ["festival", "a special day or period of celebration"],
    ],
    ["a place where books are kept", "a person who teaches at a school", "the study of past events", "a machine used for cooking", "a long journey by sea"],
    "Volunteer: tình nguyện viên; pollution: ô nhiễm; hobby: sở thích; scholarship: học bổng; festival: lễ hội."),

  // ===== Lớp 11 – Mệnh đề quan hệ =====
  mc("eng_11_01", 11, "English", "Mệnh đề quan hệ",
    "The woman ________ lives next door is a famous doctor.",
    ["whose", "who", "whom", "which"], "B",
    "Từ cần điền thay thế cho người (the woman) và làm chủ ngữ của “lives” nên dùng đại từ quan hệ “who”."),
  mc("eng_11_02", 11, "English", "Mệnh đề quan hệ",
    "This is the house ________ my grandparents were born.",
    ["which", "that", "where", "who"], "C",
    "Trước chỗ trống là danh từ chỉ nơi chốn (the house) và mệnh đề sau đã đủ chủ ngữ, động từ nên dùng trạng từ quan hệ “where”."),
  tf("eng_11_03", 11, "English", "Mệnh đề quan hệ",
    "Decide whether each of the following sentences is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["The book which I bought yesterday is very interesting.", true],
      ["The man whose car was stolen called the police.", true],
      ["The girl who she sits next to me is my cousin.", false],
      ["I met a boy whom is a talented musician.", false],
    ],
    "Câu 3 sai vì đại từ quan hệ “who” đã làm chủ ngữ nên không được lặp lại “she”. Câu 4 sai vì “whom” chỉ làm tân ngữ, trong khi ở đây cần chủ ngữ nên phải dùng “who”."),
  sa("eng_11_04", 11, "English", "Mệnh đề quan hệ",
    "Fill in the blank with ONE word: That is the author ________ novels have been translated into many languages.",
    "whose",
    "Chỗ trống chỉ sự sở hữu (novels của the author) nên dùng đại từ quan hệ sở hữu “whose”."),
  dd("eng_11_05", 11, "English", "Mệnh đề quan hệ",
    "Kéo mỗi từ quan hệ vào câu thích hợp.",
    [
      ["The teacher ____ taught me English retired last year.", "who"],
      ["The man to ____ I spoke is a lawyer.", "whom"],
      ["She is the girl ____ father is a pilot.", "whose"],
      ["This is the town ____ I grew up.", "where"],
      ["I will never forget the day ____ we first met.", "when"],
    ],
    ["what", "whoever", "why", "whenever", "wherever"],
    "“Who” thay cho người làm chủ ngữ; “whom” đứng sau giới từ; “whose” chỉ sở hữu; “where” chỉ nơi chốn; “when” chỉ thời gian."),

  // ===== Lớp 11 – Câu điều kiện =====
  mc("eng_11_06", 11, "English", "Câu điều kiện",
    "If it rains tomorrow, we ________ the picnic.",
    ["would cancel", "will cancel", "cancelled", "have cancelled"], "B",
    "Điều kiện có thể xảy ra ở tương lai (loại 1): If + hiện tại đơn, S + will + động từ nguyên mẫu."),
  mc("eng_11_07", 11, "English", "Câu điều kiện",
    "If I ________ you, I would apologise to her immediately.",
    ["am", "will be", "were", "had been"], "C",
    "Điều kiện không có thật ở hiện tại (loại 2): If + quá khứ đơn (với “be” dùng “were” cho mọi ngôi), S + would + động từ nguyên mẫu."),
  tf("eng_11_08", 11, "English", "Câu điều kiện",
    "Decide whether each of the following conditional sentences is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["If you heat ice, it melts.", true],
      ["If I will see him tomorrow, I will give him the message.", false],
      ["If he had left earlier, he would have caught the train.", true],
      ["If I were rich, I would travel around the world.", true],
    ],
    "Câu 2 sai vì trong mệnh đề “if” của câu điều kiện loại 1 không dùng “will” (phải là “If I see him tomorrow”). Câu 1 là điều kiện loại 0 (sự thật hiển nhiên), câu 3 là loại 3, câu 4 là loại 2."),
  sa("eng_11_09", 11, "English", "Câu điều kiện",
    "Fill in the blank with ONE word: ________ you hurry up, you will miss the last bus.",
    "Unless",
    "“Unless + khẳng định” có nghĩa là “nếu không”: Unless you hurry up = If you don’t hurry up, nên câu có nghĩa “Nếu bạn không nhanh lên thì sẽ lỡ chuyến xe buýt cuối”."),

  // ===== Lớp 12 – Câu tường thuật =====
  mc("eng_12_01", 12, "English", "Câu tường thuật",
    "She said, “I am tired.” → She said that she ________ tired.",
    ["was", "is", "has been", "will be"], "A",
    "Động từ tường thuật ở quá khứ (said) nên lùi thì: am/is → was."),
  mc("eng_12_02", 12, "English", "Câu tường thuật",
    "“Where do you live?” he asked me. → He asked me where ________.",
    ["you lived", "I live", "I lived", "did I live"], "C",
    "Câu hỏi có từ để hỏi khi tường thuật dùng trật tự câu khẳng định, lùi thì (live → lived) và đổi ngôi (you → I): He asked me where I lived."),
  tf("eng_12_03", 12, "English", "Câu tường thuật",
    "Decide whether each reported sentence is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["“I will call you tomorrow,” Tom said. → Tom said that he would call me the next day.", true],
      ["“Do you like pizza?” she asked me. → She asked me if I liked pizza.", true],
      ["“I am leaving now,” he said. → He said that he is leaving then.", false],
      ["“Where is the station?” he asked. → He asked where was the station.", false],
    ],
    "Câu 3 sai vì phải lùi thì và đổi trạng từ: He said that he was leaving then. Câu 4 sai vì trong câu hỏi gián tiếp không đảo ngữ: He asked where the station was."),
  sa("eng_12_04", 12, "English", "Câu tường thuật",
    "Fill in the blank with ONE word: “I will help you tomorrow,” she said. → She said that she ________ help me the next day.",
    "would",
    "Khi tường thuật ở quá khứ, “will” lùi thành “would”."),

  // ===== Lớp 12 – Đọc hiểu và từ vựng =====
  mc("eng_12_05", 12, "English", "Đọc hiểu và từ vựng",
    "Read the passage and choose the best answer. “Many cities around the world are building more cycling lanes to reduce traffic jams and air pollution. Studies show that people who cycle to work are usually healthier and miss fewer days of work. However, cyclists still face problems such as unsafe roads and a lack of parking spaces. To encourage more people to cycle, local governments should invest in safer lanes and provide secure bike parking.” What is the passage mainly about?",
    ["The history of bicycles", "How to repair a bicycle", "Encouraging cycling in cities", "Why cars are cheaper than bikes"], "C",
    "Đoạn văn nêu lợi ích của việc đạp xe, các khó khăn hiện có và đề xuất khuyến khích người dân đạp xe, vì vậy ý chính là khuyến khích đạp xe trong thành phố."),
  mc("eng_12_06", 12, "English", "Đọc hiểu và từ vựng",
    "Read the notice and choose the best answer. “ENGLISH CLUB – Every Friday, 4:30 p.m., Room 12. All students are welcome. Please bring your own notebook.” What are students asked to do?",
    ["Pay a membership fee", "Bring their own notebook", "Arrive before 4:00 p.m.", "Register online"], "B",
    "Thông báo yêu cầu “Please bring your own notebook” nên học sinh được yêu cầu tự mang vở."),
  tf("eng_12_07", 12, "English", "Đọc hiểu và từ vựng",
    "Read the passage: “Online learning has grown quickly in recent years. Students can watch lessons at any time and review difficult parts as often as they need. Nevertheless, some learners find it hard to stay motivated without a teacher in the room, so many schools now combine online lessons with face-to-face classes.” Decide whether each statement is true (Đúng) or false (Sai):",
    [
      ["Students can watch online lessons at any time.", true],
      ["Students are unable to review difficult parts of the lessons.", false],
      ["Some learners find it difficult to stay motivated when studying online.", true],
      ["Schools have stopped holding face-to-face classes completely.", false],
    ],
    "Đoạn văn nói học sinh có thể xem bài học bất cứ lúc nào và xem lại phần khó nhiều lần; một số người khó giữ động lực nên nhiều trường kết hợp học trực tuyến với học trực tiếp, chứ không bỏ hẳn lớp học trực tiếp."),
  sa("eng_12_08", 12, "English", "Đọc hiểu và từ vựng",
    "Write the correct form of the word in brackets: Many students find it hard to concentrate when they are ________. (DISTRACT)",
    "distracted",
    "Sau “are” cần một tính từ mang nghĩa bị động (bị xao nhãng): distracted."),
  dd("eng_12_09", 12, "English", "Đọc hiểu và từ vựng",
    "Kéo mỗi nghĩa vào cụm động từ tương ứng.",
    [
      ["give up", "stop trying; quit"],
      ["look after", "take care of"],
      ["turn down", "refuse or reject"],
      ["put off", "postpone"],
      ["carry out", "perform or complete (a task)"],
    ],
    ["meet by chance", "tidy up a room", "wait in a queue", "return to a place", "become tired"],
    "Give up: từ bỏ; look after: chăm sóc; turn down: từ chối; put off: trì hoãn; carry out: thực hiện."),
);

// Mức độ nhận thức: easy = Nhận biết, medium = Thông hiểu, hard = Vận dụng.
const ENGLISH_DIFFICULTY_BY_ID = {
  eng_10_01: "medium", eng_10_02: "easy", eng_10_03: "medium", eng_10_04: "medium", eng_10_05: "easy",
  eng_10_06: "easy", eng_10_07: "medium", eng_10_08: "medium", eng_10_09: "easy",
  eng_11_01: "easy", eng_11_02: "medium", eng_11_03: "medium", eng_11_04: "medium", eng_11_05: "medium",
  eng_11_06: "easy", eng_11_07: "medium", eng_11_08: "hard", eng_11_09: "medium",
  eng_12_01: "easy", eng_12_02: "medium", eng_12_03: "hard", eng_12_04: "medium", eng_12_05: "medium",
  eng_12_06: "easy", eng_12_07: "medium", eng_12_08: "hard", eng_12_09: "medium",
};

questionBank
  .filter((q) => q.id.startsWith("eng_"))
  .forEach((q) => {
    q.difficulty = DIFFICULTY[ENGLISH_DIFFICULTY_BY_ID[q.id]] ? ENGLISH_DIFFICULTY_BY_ID[q.id] : "medium";
  });

mockExams.push({
  examId: "exam_eng_mock_01",
  title: "Đề thi thử Tiếng Anh tổng hợp 10 – 12",
  defaultTimeMinutes: 50,
  kind: "mock",
  examCategory: "subject",
  subject: "English",
  questions: [
    // Phần I – trắc nghiệm
    "eng_10_01", "eng_10_02", "eng_10_05", "eng_10_06",
    "eng_11_01", "eng_11_02", "eng_11_06", "eng_11_07",
    "eng_12_01", "eng_12_02", "eng_12_05", "eng_12_06",
    // Phần II – đúng/sai
    "eng_10_03", "eng_11_03", "eng_12_03", "eng_12_07",
    // Phần III – trả lời ngắn
    "eng_10_04", "eng_11_04", "eng_12_04", "eng_12_08",
    // Phần IV – kéo thả
    "eng_12_09",
  ],
});
