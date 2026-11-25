/* Tiếng Anh: câu hỏi mẫu lớp 10 – 12, đoạn văn dùng chung và đề thi thử. Nạp sau data.js, data-extra.js, data-passages.js
 * (dùng lại mc / tf / sa / dd, questionBank, mockExams, passageBank).
 *
 * Đề bài viết bằng tiếng Anh như đề thi thật. Lời giải viết bằng tiếng Việt theo cấu trúc (trường `explain`):
 *   translation: dịch nghĩa câu / ngữ cảnh   (chuỗi hoặc mảng chuỗi)
 *   grammar:     giải thích ngữ pháp / từ vựng (chuỗi hoặc mảng chuỗi)
 *   vocab:       mảng "từ: nghĩa" – từ vựng mở rộng
 * "Đáp án đúng" được giao diện tự lấy từ câu hỏi. `explanation` (chuỗi phẳng) được tự sinh từ explain
 * để dùng cho Gia sư AI và xuất đề.
 * Cho phép <u>…</u>, <b>…</b>, <i>…</i> trong đề bài, phương án và lời giải (ví dụ gạch chân âm: b<u>oo</u>k). */

const stripTags = (s) => String(s).replace(/<\/?(u|b|i|em|strong|sup|sub)>/g, "");

function flattenExplain(ex) {
  const join = (v) => (Array.isArray(v) ? v.join(" ") : v);
  return stripTags(
    [
      ex.translation && `Dịch nghĩa: ${join(ex.translation)}`,
      ex.grammar && `Giải thích: ${join(ex.grammar)}`,
      ex.vocab && ex.vocab.length && `Từ vựng mở rộng: ${ex.vocab.join("; ")}`,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

// Gắn lời giải có cấu trúc (và các trường bổ sung như passageId) vào một câu hỏi vừa tạo.
function withExplain(q, explain, extra = {}) {
  q.explain = explain;
  q.explanation = flattenExplain(explain);
  return Object.assign(q, extra);
}
const E = withExplain;

/* ===================== Đoạn văn dùng chung ===================== */
passageBank.push(
  {
    passageId: "p_cloze_volunteer",
    kind: "cloze",
    subject: "English",
    grade: 12,
    title: "Teenagers and Volunteering",
    passageContent:
      "Many teenagers today spend hours on their phones, but a growing number are choosing to spend their free time {{1}} charity work. Helping others not only benefits the community but also {{2}} young people develop valuable skills such as teamwork and communication.\n\n" +
      "For example, students who join local clean-up campaigns learn how to work with people {{3}} different backgrounds. {{4}}, volunteering can make a real difference to a student's university application, as it shows responsibility and commitment.",
  },
  {
    passageId: "p_read_cycling",
    kind: "reading",
    subject: "English",
    grade: 12,
    title: "Cycling in the City",
    passageContent:
      "Many cities around the world are building more cycling lanes to reduce traffic jams and air pollution. Studies show that people who cycle to work are usually healthier and miss fewer days of work.\n\n" +
      "However, cyclists still face problems such as unsafe roads and a lack of parking spaces. In many cities, bicycle lanes are narrow or suddenly end, forcing riders to share the road with fast-moving cars. As a result, many people feel it is too dangerous to cycle, even for short trips.\n\n" +
      "To encourage more people to cycle, local governments should invest in safer, separated lanes and provide secure bike parking at stations and offices. Some cities have also introduced bike-sharing schemes, which allow residents to rent a bicycle for a small fee and return it to any station.",
  },
  {
    passageId: "p_read_online",
    kind: "reading",
    subject: "English",
    grade: 12,
    passageContent:
      "Online learning has grown quickly in recent years. Students can watch lessons at any time and review difficult parts as often as they need. Nevertheless, some learners find it hard to stay motivated without a teacher in the room, so many schools now combine online lessons with face-to-face classes.",
  }
);

questionBank.push(
  // ===== Lớp 10 – Thì của động từ =====
  E(mc("eng_10_01", 10, "English", "Thì của động từ",
    "By the time we arrived at the cinema, the film ________.",
    ["has already started", "had already started", "will already start", "is already starting"], "B", ""),
    {
      translation: "Khi chúng tôi đến rạp chiếu phim thì bộ phim đã bắt đầu rồi.",
      grammar: "“By the time + mệnh đề quá khứ đơn” diễn tả hành động đã xảy ra trước một mốc trong quá khứ nên dùng thì quá khứ hoàn thành: <b>had + V3/ed</b> → had already started.",
      vocab: ["by the time: vào lúc, khi", "already: đã, rồi (thường đứng giữa had và V3/ed)"],
    }),
  E(mc("eng_10_02", 10, "English", "Thì của động từ",
    "She ________ in Ho Chi Minh City since 2018.",
    ["lives", "lived", "has lived", "is living"], "C", ""),
    {
      translation: "Cô ấy đã sống ở Thành phố Hồ Chí Minh từ năm 2018 (và hiện vẫn sống ở đó).",
      grammar: "“since + mốc thời gian” là dấu hiệu của thì hiện tại hoàn thành: <b>has/have + V3/ed</b>. Dùng “for” với khoảng thời gian (for ten years), dùng “since” với mốc thời gian (since 2018).",
      vocab: ["since 2018: từ năm 2018", "for ten years: được mười năm"],
    }),
  E(tf("eng_10_03", 10, "English", "Thì của động từ",
    "Decide whether each of the following sentences is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["She has lived here since 2015.", true],
      ["He go to school by bike every day.", false],
      ["They were watching TV when the phone rang.", true],
      ["I am knowing the answer now.", false],
    ], ""),
    {
      grammar: [
        "Câu 2 sai vì chủ ngữ ngôi thứ ba số ít cần “goes” (he goes).",
        "Câu 4 sai vì “know” là động từ chỉ trạng thái, thường không dùng ở thì tiếp diễn (phải là “I know the answer now”).",
      ],
      vocab: ["stative verbs (động từ chỉ trạng thái): know, like, love, want, believe…"],
    }),
  E(sa("eng_10_04", 10, "English", "Thì của động từ",
    "Write the correct form of the verb in brackets: Yesterday, while I ________ (walk) home, it began to rain.",
    "was walking", "", ["was walking"]),
    {
      translation: "Hôm qua, khi tôi đang đi bộ về nhà thì trời bắt đầu mưa.",
      grammar: "Hành động đang diễn ra (walk) thì bị một hành động khác xen vào (began) nên dùng quá khứ tiếp diễn: <b>was/were + V-ing</b> → was walking.",
      vocab: ["while + quá khứ tiếp diễn: trong khi", "begin to rain: bắt đầu mưa"],
    }),

  // ===== Lớp 10 – Từ vựng theo chủ đề =====
  E(mc("eng_10_05", 10, "English", "Từ vựng theo chủ đề",
    "The ________ between parents and their teenage children often leads to arguments about fashion and music.",
    ["generation gap", "family reunion", "nuclear family", "sibling rivalry"], "A", ""),
    {
      translation: "<b>Khoảng cách thế hệ</b> giữa cha mẹ và con cái tuổi thiếu niên thường dẫn đến những cuộc tranh cãi về thời trang và âm nhạc.",
      grammar: "“Generation gap” là sự khác biệt về quan điểm và lối sống giữa các thế hệ. Các đáp án còn lại không hợp nghĩa: family reunion (buổi đoàn tụ gia đình), nuclear family (gia đình hạt nhân), sibling rivalry (sự ganh đua giữa anh chị em).",
      vocab: ["argument: cuộc tranh cãi", "teenage (adj): thuộc tuổi thiếu niên"],
    }),
  E(mc("eng_10_06", 10, "English", "Từ vựng theo chủ đề",
    "Choose the word CLOSEST in meaning to “delighted”: The teacher was delighted with her students’ performance.",
    ["disappointed", "worried", "pleased", "confused"], "C", ""),
    {
      translation: "Cô giáo rất hài lòng với kết quả học tập của học sinh.",
      grammar: "“Delighted” (rất vui, hài lòng) gần nghĩa nhất với “pleased”. “Disappointed” (thất vọng) trái nghĩa; “worried” (lo lắng) và “confused” (bối rối) không phù hợp.",
      vocab: ["delighted = very pleased", "performance: kết quả, màn thể hiện"],
    }),
  E(tf("eng_10_07", 10, "English", "Từ vựng theo chủ đề",
    "Decide whether each word is matched with the correct definition (Đúng) or not (Sai):",
    [
      ["Volunteer: a person who does work without being paid.", true],
      ["Recycle: to throw things away carelessly.", false],
      ["Hobby: an activity that you do for pleasure in your free time.", true],
      ["Pollution: the clean air and water in a place.", false],
    ], ""),
    {
      grammar: "“Recycle” là tái chế (xử lý vật liệu đã dùng để sử dụng lại), còn “pollution” là ô nhiễm (chất độc hại trong không khí, nước hoặc đất).",
      vocab: ["volunteer: tình nguyện viên", "recycle: tái chế", "hobby: sở thích", "pollution: sự ô nhiễm"],
    }),
  E(sa("eng_10_08", 10, "English", "Từ vựng theo chủ đề",
    "Write the correct form of the word in brackets: Recycling is one of the most ________ ways to protect the environment. (EFFECT)",
    "effective", ""),
    {
      translation: "Tái chế là một trong những cách hiệu quả nhất để bảo vệ môi trường.",
      grammar: "Sau “the most” và trước danh từ “ways” cần một tính từ: <b>effective</b> (hiệu quả).",
      vocab: ["effect (n): tác động", "effective (adj): hiệu quả", "effectively (adv): một cách hiệu quả"],
    }),
  E(dd("eng_10_09", 10, "English", "Từ vựng theo chủ đề",
    "Kéo mỗi định nghĩa vào từ tương ứng.",
    [
      ["volunteer", "a person who works without being paid"],
      ["pollution", "harmful substances in the air, water or soil"],
      ["hobby", "an activity you enjoy in your free time"],
      ["scholarship", "money given to a student to help pay for study"],
      ["festival", "a special day or period of celebration"],
    ],
    ["a place where books are kept", "a person who teaches at a school", "the study of past events", "a machine used for cooking", "a long journey by sea"], ""),
    {
      grammar: "Ghép từ với định nghĩa tiếng Anh: đọc kỹ nghĩa rồi loại các định nghĩa nhiễu (library, teacher, history, cooker, voyage).",
      vocab: ["volunteer: tình nguyện viên", "pollution: ô nhiễm", "hobby: sở thích", "scholarship: học bổng", "festival: lễ hội"],
    }),

  // ===== Lớp 10 – Ngữ âm / Trọng âm (câu lẻ) =====
  E(mc("eng_10_10", 10, "English", "Ngữ âm",
    "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation.",
    ["b<u>oo</u>k", "f<u>oo</u>d", "g<u>oo</u>d", "l<u>oo</u>k"], "B", ""),
    {
      translation: "Chọn từ có phần được gạch chân phát âm khác với ba từ còn lại.",
      grammar: "<b>food</b> /fuːd/ có âm dài /uː/; còn <b>book</b> /bʊk/, <b>good</b> /ɡʊd/, <b>look</b> /lʊk/ đều có âm ngắn /ʊ/.",
      vocab: ["/uː/: âm dài (food, moon, blue)", "/ʊ/: âm ngắn (book, good, look)"],
    }),
  E(mc("eng_10_11", 10, "English", "Ngữ âm",
    "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation.",
    ["want<u>ed</u>", "need<u>ed</u>", "stopp<u>ed</u>", "decid<u>ed</u>"], "C", ""),
    {
      translation: "Chọn từ có phần được gạch chân phát âm khác với ba từ còn lại.",
      grammar: "Đuôi <b>-ed</b> đọc là /ɪd/ sau các âm /t/ và /d/ (wanted, needed, decided). Sau âm vô thanh /p/, đuôi -ed đọc là /t/ → stopped /stɒpt/.",
      vocab: ["-ed đọc /ɪd/: sau /t/, /d/", "-ed đọc /t/: sau /p/, /k/, /f/, /s/, /ʃ/, /tʃ/", "-ed đọc /d/: sau các âm còn lại"],
    }),
  E(mc("eng_10_12", 10, "English", "Trọng âm",
    "Mark the letter A, B, C, or D to indicate the word that differs from the other three in the position of primary stress.",
    ["between", "teacher", "city", "doctor"], "A", ""),
    {
      translation: "Chọn từ có trọng âm chính rơi vào vị trí khác với ba từ còn lại.",
      grammar: "<b>between</b> /bɪˈtwiːn/ có trọng âm ở âm tiết thứ hai; teacher /ˈtiːtʃə/, city /ˈsɪti/, doctor /ˈdɒktə/ đều có trọng âm ở âm tiết thứ nhất. Danh từ hai âm tiết thường nhấn âm đầu, còn giới từ hai âm tiết thường nhấn âm sau.",
      vocab: ["between /bɪˈtwiːn/: ở giữa", "city /ˈsɪti/: thành phố"],
    }),

  // ===== Lớp 11 – Mệnh đề quan hệ =====
  E(mc("eng_11_01", 11, "English", "Mệnh đề quan hệ",
    "The woman ________ lives next door is a famous doctor.",
    ["whose", "who", "whom", "which"], "B", ""),
    {
      translation: "Người phụ nữ sống ở nhà bên cạnh là một bác sĩ nổi tiếng.",
      grammar: "Từ cần điền thay cho danh từ chỉ người (the woman) và làm chủ ngữ của “lives” nên dùng đại từ quan hệ <b>who</b>. “Whose” chỉ sở hữu, “whom” làm tân ngữ, “which” thay cho vật.",
      vocab: ["next door: nhà bên cạnh"],
    }),
  E(mc("eng_11_02", 11, "English", "Mệnh đề quan hệ",
    "This is the house ________ my grandparents were born.",
    ["which", "that", "where", "who"], "C", ""),
    {
      translation: "Đây là ngôi nhà nơi ông bà tôi đã sinh ra.",
      grammar: "Trước chỗ trống là danh từ chỉ nơi chốn (the house) và mệnh đề sau đã đủ chủ ngữ, động từ nên dùng trạng từ quan hệ <b>where</b> (= in which).",
      vocab: ["grandparents: ông bà"],
    }),
  E(tf("eng_11_03", 11, "English", "Mệnh đề quan hệ",
    "Decide whether each of the following sentences is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["The book which I bought yesterday is very interesting.", true],
      ["The man whose car was stolen called the police.", true],
      ["The girl who she sits next to me is my cousin.", false],
      ["I met a boy whom is a talented musician.", false],
    ], ""),
    {
      grammar: [
        "Câu 3 sai vì đại từ quan hệ “who” đã làm chủ ngữ nên không được lặp lại “she”.",
        "Câu 4 sai vì “whom” chỉ làm tân ngữ, trong khi ở đây cần chủ ngữ nên phải dùng “who”.",
      ],
      vocab: ["talented: có tài", "cousin: anh/chị/em họ"],
    }),
  E(sa("eng_11_04", 11, "English", "Mệnh đề quan hệ",
    "Fill in the blank with ONE word: That is the author ________ novels have been translated into many languages.",
    "whose", ""),
    {
      translation: "Đó là tác giả có các tiểu thuyết đã được dịch sang nhiều thứ tiếng.",
      grammar: "Chỗ trống chỉ sự sở hữu (novels của the author) nên dùng đại từ quan hệ sở hữu <b>whose</b> + danh từ.",
      vocab: ["novel: tiểu thuyết", "translate into: dịch sang"],
    }),
  E(dd("eng_11_05", 11, "English", "Mệnh đề quan hệ",
    "Kéo mỗi từ quan hệ vào câu thích hợp.",
    [
      ["The teacher ____ taught me English retired last year.", "who"],
      ["The man to ____ I spoke is a lawyer.", "whom"],
      ["She is the girl ____ father is a pilot.", "whose"],
      ["This is the town ____ I grew up.", "where"],
      ["I will never forget the day ____ we first met.", "when"],
    ],
    ["what", "whoever", "why", "whenever", "wherever"], ""),
    {
      grammar: "“Who” thay cho người làm chủ ngữ; “whom” đứng sau giới từ; “whose” chỉ sở hữu; “where” chỉ nơi chốn; “when” chỉ thời gian.",
      vocab: ["retire: nghỉ hưu", "lawyer: luật sư", "pilot: phi công"],
    }),

  // ===== Lớp 11 – Câu điều kiện =====
  E(mc("eng_11_06", 11, "English", "Câu điều kiện",
    "If it rains tomorrow, we ________ the picnic.",
    ["would cancel", "will cancel", "cancelled", "have cancelled"], "B", ""),
    {
      translation: "Nếu ngày mai trời mưa, chúng tôi sẽ hủy buổi dã ngoại.",
      grammar: "Điều kiện có thể xảy ra ở tương lai (loại 1): <b>If + hiện tại đơn, S + will + V (nguyên mẫu)</b>.",
      vocab: ["cancel: hủy bỏ", "picnic: buổi dã ngoại"],
    }),
  E(mc("eng_11_07", 11, "English", "Câu điều kiện",
    "If I ________ you, I would apologise to her immediately.",
    ["am", "will be", "were", "had been"], "C", ""),
    {
      translation: "Nếu tôi là bạn, tôi sẽ xin lỗi cô ấy ngay lập tức.",
      grammar: "Điều kiện không có thật ở hiện tại (loại 2): <b>If + quá khứ đơn (be → were cho mọi ngôi), S + would + V</b>.",
      vocab: ["apologise (to sb): xin lỗi ai", "immediately: ngay lập tức"],
    }),
  E(tf("eng_11_08", 11, "English", "Câu điều kiện",
    "Decide whether each of the following conditional sentences is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["If you heat ice, it melts.", true],
      ["If I will see him tomorrow, I will give him the message.", false],
      ["If he had left earlier, he would have caught the train.", true],
      ["If I were rich, I would travel around the world.", true],
    ], ""),
    {
      grammar: [
        "Câu 2 sai vì trong mệnh đề “if” của câu điều kiện loại 1 không dùng “will” (phải là “If I see him tomorrow”).",
        "Câu 1 là điều kiện loại 0 (sự thật hiển nhiên), câu 3 là loại 3, câu 4 là loại 2.",
      ],
      vocab: ["melt: tan chảy", "catch the train: bắt kịp tàu"],
    }),
  E(sa("eng_11_09", 11, "English", "Câu điều kiện",
    "Fill in the blank with ONE word: ________ you hurry up, you will miss the last bus.",
    "Unless", ""),
    {
      translation: "Nếu bạn không nhanh lên thì bạn sẽ lỡ chuyến xe buýt cuối cùng.",
      grammar: "<b>Unless + mệnh đề khẳng định</b> = If … not …: Unless you hurry up = If you don’t hurry up.",
      vocab: ["hurry up: nhanh lên", "miss the bus: lỡ xe buýt"],
    }),

  // ===== Lớp 11 – Ngữ âm / Trọng âm (câu lẻ) =====
  E(mc("eng_11_10", 11, "English", "Ngữ âm",
    "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation.",
    ["<u>th</u>ink", "<u>th</u>ank", "<u>th</u>ree", "<u>th</u>ough"], "D", ""),
    {
      translation: "Chọn từ có phần được gạch chân phát âm khác với ba từ còn lại.",
      grammar: "<b>though</b> /ðəʊ/ có âm /ð/ (hữu thanh); think /θɪŋk/, thank /θæŋk/, three /θriː/ đều có âm /θ/ (vô thanh).",
      vocab: ["/θ/: think, thank, three, month", "/ð/: this, that, though, mother"],
    }),
  E(mc("eng_11_11", 11, "English", "Trọng âm",
    "Mark the letter A, B, C, or D to indicate the word that differs from the other three in the position of primary stress.",
    ["celebrate", "important", "community", "environment"], "A", ""),
    {
      translation: "Chọn từ có trọng âm chính rơi vào vị trí khác với ba từ còn lại.",
      grammar: "<b>celebrate</b> /ˈselɪbreɪt/ nhấn âm thứ nhất; important /ɪmˈpɔːtnt/, community /kəˈmjuːnəti/, environment /ɪnˈvaɪrənmənt/ đều nhấn âm thứ hai.",
      vocab: ["celebrate: kỷ niệm, ăn mừng", "community: cộng đồng", "environment: môi trường"],
    }),

  // ===== Lớp 12 – Câu tường thuật =====
  E(mc("eng_12_01", 12, "English", "Câu tường thuật",
    "She said, “I am tired.” → She said that she ________ tired.",
    ["was", "is", "has been", "will be"], "A", ""),
    {
      translation: "Cô ấy nói rằng cô ấy mệt.",
      grammar: "Động từ tường thuật ở quá khứ (said) nên lùi thì: am/is → <b>was</b>; đồng thời đổi ngôi (I → she).",
      vocab: ["lùi thì: am/is → was, do/does → did, will → would"],
    }),
  E(mc("eng_12_02", 12, "English", "Câu tường thuật",
    "“Where do you live?” he asked me. → He asked me where ________.",
    ["you lived", "I live", "I lived", "did I live"], "C", ""),
    {
      translation: "Anh ấy hỏi tôi rằng tôi sống ở đâu.",
      grammar: "Câu hỏi có từ để hỏi khi tường thuật dùng trật tự câu khẳng định (không đảo trợ động từ), lùi thì (live → lived) và đổi ngôi (you → I): <b>He asked me where I lived.</b>",
      vocab: ["Wh-question → wh-word + S + V (lùi thì)"],
    }),
  E(tf("eng_12_03", 12, "English", "Câu tường thuật",
    "Decide whether each reported sentence is grammatically correct (Đúng) or incorrect (Sai):",
    [
      ["“I will call you tomorrow,” Tom said. → Tom said that he would call me the next day.", true],
      ["“Do you like pizza?” she asked me. → She asked me if I liked pizza.", true],
      ["“I am leaving now,” he said. → He said that he is leaving then.", false],
      ["“Where is the station?” he asked. → He asked where was the station.", false],
    ], ""),
    {
      grammar: [
        "Câu 3 sai vì phải lùi thì và đổi trạng từ: He said that he <b>was</b> leaving then.",
        "Câu 4 sai vì trong câu hỏi gián tiếp không đảo ngữ: He asked where the station <b>was</b>.",
      ],
      vocab: ["tomorrow → the next day", "now → then"],
    }),
  E(sa("eng_12_04", 12, "English", "Câu tường thuật",
    "Fill in the blank with ONE word: “I will help you tomorrow,” she said. → She said that she ________ help me the next day.",
    "would", ""),
    {
      translation: "Cô ấy nói rằng cô ấy sẽ giúp tôi vào ngày hôm sau.",
      grammar: "Khi tường thuật ở quá khứ, “will” lùi thành <b>would</b>; “tomorrow” đổi thành “the next day”.",
      vocab: ["tomorrow → the next/following day", "yesterday → the day before", "now → then"],
    }),

  // ===== Lớp 12 – Đọc hiểu và từ vựng =====
  E(mc("eng_12_05", 12, "English", "Đọc hiểu và từ vựng",
    "What is the passage mainly about?",
    ["The history of bicycles", "How to repair a bicycle", "Encouraging cycling in cities", "Why cars are cheaper than bikes"], "C", ""),
    {
      translation: "Đoạn văn chủ yếu nói về điều gì? → Việc khuyến khích mọi người đạp xe trong thành phố.",
      grammar: "Câu hỏi ý chính: đoạn 1 nêu lợi ích của việc đạp xe, đoạn 2 nêu các khó khăn, đoạn 3 đề xuất giải pháp để khuyến khích người dân đạp xe → ý bao quát toàn bài là “Encouraging cycling in cities”. Các đáp án còn lại (lịch sử xe đạp, cách sửa xe, giá xe hơi) không được nhắc đến.",
      vocab: ["encourage sb to do sth: khuyến khích ai làm gì", "traffic jam: tắc đường", "air pollution: ô nhiễm không khí"],
    },
    { passageId: "p_read_cycling" }),
  E(mc("eng_12_06", 12, "English", "Đọc hiểu và từ vựng",
    "Read the notice and choose the best answer. “ENGLISH CLUB – Every Friday, 4:30 p.m., Room 12. All students are welcome. Please bring your own notebook.” What are students asked to do?",
    ["Pay a membership fee", "Bring their own notebook", "Arrive before 4:00 p.m.", "Register online"], "B", ""),
    {
      translation: "CÂU LẠC BỘ TIẾNG ANH – Thứ Sáu hằng tuần, 4:30 chiều, phòng 12. Chào đón tất cả học sinh. Vui lòng tự mang theo vở.",
      grammar: "Thông tin cần tìm nằm ở câu cuối: “Please bring your own notebook.” → học sinh được yêu cầu tự mang vở. Các thông tin về phí, giờ đến sớm và đăng ký trực tuyến không xuất hiện trong thông báo.",
      vocab: ["own: của riêng mình", "welcome (adj): được chào đón", "membership fee: phí thành viên"],
    }),
  E(tf("eng_12_07", 12, "English", "Đọc hiểu và từ vựng",
    "Decide whether each statement is true (Đúng) or false (Sai):",
    [
      ["Students can watch online lessons at any time.", true],
      ["Students are unable to review difficult parts of the lessons.", false],
      ["Some learners find it difficult to stay motivated when studying online.", true],
      ["Schools have stopped holding face-to-face classes completely.", false],
    ], ""),
    {
      translation: "Việc học trực tuyến đã phát triển nhanh trong những năm gần đây. Học sinh có thể xem bài giảng bất cứ lúc nào và xem lại những phần khó bao nhiêu lần tùy ý. Tuy nhiên, một số người học thấy khó giữ động lực khi không có giáo viên trong phòng, nên nhiều trường hiện kết hợp bài học trực tuyến với các lớp học trực tiếp.",
      grammar: "Đối chiếu từng ý với đoạn văn: xem bài giảng bất cứ lúc nào (đúng), xem lại phần khó nhiều lần nên ý 2 sai, một số người khó giữ động lực (đúng), các trường kết hợp (combine) chứ không bỏ hẳn lớp học trực tiếp nên ý 4 sai.",
      vocab: ["nevertheless: tuy nhiên", "motivated: có động lực", "face-to-face: trực tiếp"],
    },
    { passageId: "p_read_online" }),
  E(sa("eng_12_08", 12, "English", "Đọc hiểu và từ vựng",
    "Write the correct form of the word in brackets: Many students find it hard to concentrate when they are ________. (DISTRACT)",
    "distracted", ""),
    {
      translation: "Nhiều học sinh thấy khó tập trung khi bị xao nhãng.",
      grammar: "Sau “are” cần một tính từ mang nghĩa bị động (bị phân tâm): <b>distracted</b>. “Distracting” mang nghĩa chủ động (gây xao nhãng).",
      vocab: ["distract (v) → distraction (n) → distracted / distracting (adj)", "concentrate on: tập trung vào"],
    }),
  E(dd("eng_12_09", 12, "English", "Đọc hiểu và từ vựng",
    "Kéo mỗi nghĩa vào cụm động từ tương ứng.",
    [
      ["give up", "stop trying; quit"],
      ["look after", "take care of"],
      ["turn down", "refuse or reject"],
      ["put off", "postpone"],
      ["carry out", "perform or complete (a task)"],
    ],
    ["meet by chance", "tidy up a room", "wait in a queue", "return to a place", "become tired"], ""),
    {
      grammar: "Cụm động từ (phrasal verb) có nghĩa khác với từng từ riêng lẻ, cần học thuộc theo cụm.",
      vocab: ["give up: từ bỏ", "look after: chăm sóc", "turn down: từ chối", "put off: trì hoãn", "carry out: thực hiện"],
    }),

  // ===== Lớp 12 – Ngữ âm / Trọng âm (câu lẻ) =====
  E(mc("eng_12_10", 12, "English", "Ngữ âm",
    "Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation.",
    ["<u>ch</u>ild", "<u>ch</u>ange", "<u>ch</u>ef", "<u>ch</u>air"], "C", ""),
    {
      translation: "Chọn từ có phần được gạch chân phát âm khác với ba từ còn lại.",
      grammar: "<b>chef</b> /ʃef/ có âm /ʃ/ (từ mượn tiếng Pháp); child /tʃaɪld/, change /tʃeɪndʒ/, chair /tʃeə/ đều có âm /tʃ/.",
      vocab: ["chef: đầu bếp", "chef, machine, champagne: “ch” đọc /ʃ/"],
    }),
  E(mc("eng_12_11", 12, "English", "Trọng âm",
    "Mark the letter A, B, C, or D to indicate the word that differs from the other three in the position of primary stress.",
    ["memory", "mathematics", "industry", "history"], "B", ""),
    {
      translation: "Chọn từ có trọng âm chính rơi vào vị trí khác với ba từ còn lại.",
      grammar: "<b>mathematics</b> /ˌmæθəˈmætɪks/ có trọng âm chính ở âm tiết thứ ba; memory /ˈmeməri/, industry /ˈɪndəstri/, history /ˈhɪstri/ đều nhấn âm tiết thứ nhất.",
      vocab: ["mathematics: môn Toán", "industry: ngành công nghiệp", "memory: trí nhớ"],
    }),

  // ===== Lớp 12 – Điền từ vào đoạn văn (Cloze test, dùng chung 1 đoạn văn) =====
  E(mc("eng_12_12", 12, "English", "Điền từ vào đoạn văn",
    "Choose the word or phrase that best fits blank {{n}}.",
    ["on", "to", "at", "from"], "A", ""),
    {
      translation: "Nhiều thiếu niên ngày nay dành hàng giờ cho điện thoại, nhưng ngày càng nhiều bạn chọn dành thời gian rảnh cho hoạt động từ thiện.",
      grammar: "Cấu trúc <b>spend + thời gian + on + danh từ</b> (dành thời gian cho …): spend their free time <b>on</b> charity work.",
      vocab: ["charity work: hoạt động từ thiện", "a growing number of: ngày càng nhiều"],
    },
    { passageId: "p_cloze_volunteer", blank: 1 }),
  E(mc("eng_12_13", 12, "English", "Điền từ vào đoạn văn",
    "Choose the word or phrase that best fits blank {{n}}.",
    ["help", "helps", "helped", "helping"], "B", ""),
    {
      translation: "Giúp đỡ người khác không chỉ mang lại lợi ích cho cộng đồng mà còn giúp các bạn trẻ phát triển những kỹ năng quý giá như làm việc nhóm và giao tiếp.",
      grammar: "Cấu trúc song song <b>not only … but also …</b>. Chủ ngữ “Helping others” (danh động từ) là số ít nên động từ chia số ít: benefits … <b>helps</b>. Cấu trúc <b>help sb (to) do sth</b>: helps young people develop.",
      vocab: ["benefit (v/n): mang lại lợi ích / lợi ích", "valuable: quý giá", "teamwork: làm việc nhóm"],
    },
    { passageId: "p_cloze_volunteer", blank: 2 }),
  E(mc("eng_12_14", 12, "English", "Điền từ vào đoạn văn",
    "Choose the word or phrase that best fits blank {{n}}.",
    ["in", "of", "from", "by"], "C", ""),
    {
      translation: "Ví dụ, những học sinh tham gia các chiến dịch dọn dẹp ở địa phương học được cách làm việc với những người có xuất thân khác nhau.",
      grammar: "<b>people from different backgrounds</b> = những người có xuất thân/hoàn cảnh khác nhau; giới từ “from” chỉ nguồn gốc, xuất thân.",
      vocab: ["background: xuất thân, hoàn cảnh", "clean-up campaign: chiến dịch dọn dẹp"],
    },
    { passageId: "p_cloze_volunteer", blank: 3 }),
  E(mc("eng_12_15", 12, "English", "Điền từ vào đoạn văn",
    "Choose the word or phrase that best fits blank {{n}}.",
    ["However", "Moreover", "Therefore", "Otherwise"], "B", ""),
    {
      translation: "Hơn nữa, hoạt động tình nguyện có thể tạo nên khác biệt thực sự cho hồ sơ xét tuyển đại học của học sinh, vì nó thể hiện tinh thần trách nhiệm và sự cam kết.",
      grammar: "Câu này bổ sung thêm một lợi ích nên dùng từ nối thêm ý <b>Moreover</b> (= Furthermore, In addition). However = tuy nhiên (đối lập), Therefore = vì vậy (kết quả), Otherwise = nếu không thì.",
      vocab: ["application: hồ sơ xin học", "commitment: sự cam kết", "make a difference: tạo ra sự khác biệt"],
    },
    { passageId: "p_cloze_volunteer", blank: 4 }),

  // ===== Lớp 12 – Đọc hiểu (4 câu dùng chung đoạn văn “Cycling in the City”; câu đầu là eng_12_05) =====
  E(mc("eng_12_16", 12, "English", "Đọc hiểu và từ vựng",
    "According to paragraph 2, why do many people feel it is dangerous to cycle?",
    ["Cyclists have to ride very fast.", "Bicycle lanes are often narrow or end suddenly.", "There are too few cars on the road.", "Bicycle parking is too expensive."], "B", ""),
    {
      translation: "Theo đoạn 2, vì sao nhiều người cảm thấy đạp xe là nguy hiểm? → Ở nhiều thành phố, làn đường dành cho xe đạp hẹp hoặc đột ngột kết thúc, buộc người đi xe phải đi chung đường với những chiếc ô tô chạy nhanh.",
      grammar: "Câu hỏi chi tiết: tìm thông tin ở đoạn 2, câu “bicycle lanes are narrow or suddenly end …”. Cấu trúc <b>force sb to do sth</b> (buộc ai phải làm gì) → “forcing riders to share the road”.",
      vocab: ["narrow: hẹp", "share the road with: đi chung đường với", "fast-moving: di chuyển nhanh"],
    },
    { passageId: "p_read_cycling" }),
  E(mc("eng_12_17", 12, "English", "Đọc hiểu và từ vựng",
    "The word “which” in paragraph 3 refers to ________.",
    ["bike-sharing schemes", "local governments", "secure bike parking", "residents"], "A", ""),
    {
      translation: "Từ “which” ở đoạn 3 thay cho từ nào? → Một số thành phố cũng đã đưa ra các chương trình chia sẻ xe đạp, cho phép người dân thuê xe với mức phí nhỏ và trả xe tại bất kỳ trạm nào.",
      grammar: "Câu hỏi quy chiếu: “which” là đại từ quan hệ không xác định (đứng sau dấu phẩy) thay cho cụm danh từ đứng ngay trước nó: <b>bike-sharing schemes</b>. Động từ “allow” ở dạng số nhiều khớp với “schemes”.",
      vocab: ["scheme: chương trình, kế hoạch", "rent: thuê", "fee: khoản phí"],
    },
    { passageId: "p_read_cycling" }),
  E(mc("eng_12_18", 12, "English", "Đọc hiểu và từ vựng",
    "Which of the following can be inferred from the passage?",
    ["Cycling is already safe in most cities.", "Bike-sharing is more expensive than owning a bicycle.", "Better lanes and parking could encourage more people to cycle.", "Cyclists miss more days of work than other people."], "C", ""),
    {
      translation: "Có thể suy ra điều gì từ đoạn văn? → Làn đường và chỗ đỗ xe tốt hơn có thể khuyến khích nhiều người đạp xe hơn.",
      grammar: "Câu hỏi suy luận: đoạn 3 đề xuất đầu tư làn đường an toàn và bãi đỗ xe an toàn “to encourage more people to cycle”, nên C là hợp lý. A sai (đoạn 2 nói đường chưa an toàn), B không được nhắc đến, D trái với đoạn 1 (người đạp xe nghỉ làm ít hơn).",
      vocab: ["infer: suy ra", "invest in: đầu tư vào", "secure: an toàn, chắc chắn"],
    },
    { passageId: "p_read_cycling" }),
);

// Mức độ nhận thức: easy = Nhận biết, medium = Thông hiểu, hard = Vận dụng.
const ENGLISH_DIFFICULTY_BY_ID = {
  eng_10_01: "medium", eng_10_02: "easy", eng_10_03: "medium", eng_10_04: "medium", eng_10_05: "easy",
  eng_10_06: "easy", eng_10_07: "medium", eng_10_08: "medium", eng_10_09: "easy",
  eng_10_10: "easy", eng_10_11: "medium", eng_10_12: "easy",
  eng_11_01: "easy", eng_11_02: "medium", eng_11_03: "medium", eng_11_04: "medium", eng_11_05: "medium",
  eng_11_06: "easy", eng_11_07: "medium", eng_11_08: "hard", eng_11_09: "medium",
  eng_11_10: "medium", eng_11_11: "medium",
  eng_12_01: "easy", eng_12_02: "medium", eng_12_03: "hard", eng_12_04: "medium", eng_12_05: "medium",
  eng_12_06: "easy", eng_12_07: "medium", eng_12_08: "hard", eng_12_09: "medium",
  eng_12_10: "medium", eng_12_11: "hard",
  eng_12_12: "easy", eng_12_13: "medium", eng_12_14: "easy", eng_12_15: "medium",
  eng_12_16: "medium", eng_12_17: "medium", eng_12_18: "hard",
};

questionBank
  .filter((q) => q.id.startsWith("eng_"))
  .forEach((q) => {
    q.difficulty = DIFFICULTY[ENGLISH_DIFFICULTY_BY_ID[q.id]] ? ENGLISH_DIFFICULTY_BY_ID[q.id] : "medium";
  });

mockExams.push(
  {
    // Đề thuần trắc nghiệm đúng cấu trúc đề thi thật: chỉ có Phần I (các phần khác tự ẩn).
    // Thứ tự soạn: ngữ âm → trọng âm → ngữ pháp/từ vựng → điền từ vào đoạn văn → đọc hiểu.
    examId: "exam_eng_mock_01",
    title: "Đề thi thử Tiếng Anh tổng hợp 10 – 12",
    defaultTimeMinutes: 30,
    kind: "mock",
    examCategory: "subject",
    subject: "English",
    questions: [
      "eng_10_10", "eng_11_10",
      "eng_10_12", "eng_11_11",
      "eng_10_01", "eng_10_02", "eng_10_06", "eng_11_01", "eng_11_06", "eng_11_07", "eng_12_01", "eng_12_02",
      "eng_12_12", "eng_12_13", "eng_12_14", "eng_12_15",
      "eng_12_05", "eng_12_16", "eng_12_17", "eng_12_18",
    ],
  },
  {
    // Đề ngắn tập trung hai dạng bài dùng đoạn văn dài: điền từ vào đoạn văn và đọc hiểu.
    examId: "exam_eng_reading_01",
    title: "Luyện Reading & Cloze Test (Tiếng Anh 12)",
    defaultTimeMinutes: 15,
    kind: "mock",
    examCategory: "subject",
    subject: "English",
    questions: [
      "eng_12_12", "eng_12_13", "eng_12_14", "eng_12_15",
      "eng_12_05", "eng_12_16", "eng_12_17", "eng_12_18",
    ],
  }
);
