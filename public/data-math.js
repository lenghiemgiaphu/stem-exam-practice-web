/* Toán học: câu hỏi mẫu lớp 10 – 12 và đề thi thử. Nạp sau data.js và data-extra.js
 * (dùng lại các hàm mc / tf / sa / dd và mảng questionBank, mockExams).
 *
 * Công thức viết bằng LaTeX trong $...$ (cùng dòng) hoặc $$...$$ (riêng một dòng) và được KaTeX
 * hiển thị (xem math.js). Dùng String.raw (viết tắt là L) để không phải nhân đôi dấu gạch chéo ngược:
 *   L`Tính $\int_0^1 x\,dx$`   thay cho   "Tính $\\int_0^1 x\\,dx$"
 * Đáp án câu Trả lời ngắn là số thường (không cần LaTeX): ví dụ "-4", "0.4" (nhập 0,4 hoặc 0.4 đều đúng). */

const L = String.raw;

questionBank.push(
  // ===== Lớp 10 – Mệnh đề và tập hợp =====
  mc("mat_10_01", 10, "Math", "Mệnh đề và tập hợp",
    L`Cho hai tập hợp $A = \{1; 2; 3; 4\}$ và $B = \{3; 4; 5\}$. Tập hợp $A \cap B$ là:`,
    [L`$\{3; 4\}$`, L`$\{1; 2; 3; 4; 5\}$`, L`$\{1; 2\}$`, L`$\{5\}$`], "A",
    L`$A \cap B$ gồm các phần tử thuộc cả $A$ và $B$, đó là $3$ và $4$ nên $A \cap B = \{3; 4\}$.`),
  mc("mat_10_02", 10, "Math", "Mệnh đề và tập hợp",
    L`Phủ định của mệnh đề $P$: “$\forall x \in \mathbb{R},\ x^2 \ge 0$” là:`,
    [L`$\forall x \in \mathbb{R},\ x^2 < 0$`, L`$\exists x \in \mathbb{R},\ x^2 \le 0$`, L`$\exists x \in \mathbb{R},\ x^2 < 0$`, L`$\forall x \in \mathbb{R},\ x^2 \le 0$`], "C",
    L`Phủ định của “$\forall$” là “$\exists$” và phủ định của “$\ge$” là “$<$”, nên phủ định của $P$ là “$\exists x \in \mathbb{R},\ x^2 < 0$”.`),
  tf("mat_10_03", 10, "Math", "Mệnh đề và tập hợp",
    L`Cho hai tập hợp $A = [-2; 3)$ và $B = (1; 5]$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$A \cap B = (1; 3)$.`, true],
      [L`$A \cup B = [-2; 5]$.`, true],
      [L`$A \setminus B = [-2; 1)$.`, false],
      [L`$\mathbb{R} \setminus A = (-\infty; -2) \cup [3; +\infty)$.`, true],
    ],
    L`$A \cap B = (1; 3)$; $A \cup B = [-2; 5]$; vì $1 \notin B$ nên $A \setminus B = [-2; 1]$ (có cả điểm $1$) chứ không phải $[-2; 1)$; phần bù của $A$ trong $\mathbb{R}$ là $(-\infty; -2) \cup [3; +\infty)$.`),
  sa("mat_10_04", 10, "Math", "Mệnh đề và tập hợp",
    L`Tập hợp $A = \{x \in \mathbb{N} \mid 1 \le x \le 5\}$ có bao nhiêu tập con?`,
    "32",
    L`$A = \{1; 2; 3; 4; 5\}$ có $5$ phần tử nên số tập con là $2^5 = 32$.`),

  // ===== Lớp 10 – Hàm số bậc hai =====
  mc("mat_10_05", 10, "Math", "Hàm số bậc hai",
    L`Parabol $y = x^2 - 4x + 3$ có đỉnh là điểm nào sau đây?`,
    [L`$I(-2; 15)$`, L`$I(2; -1)$`, L`$I(4; 3)$`, L`$I(1; 0)$`], "B",
    L`Hoành độ đỉnh $x = -\dfrac{b}{2a} = 2$; tung độ $y = 2^2 - 4 \cdot 2 + 3 = -1$. Vậy đỉnh $I(2; -1)$.`),
  mc("mat_10_06", 10, "Math", "Hàm số bậc hai",
    L`Hàm số $y = x^2 - 2x - 3$ đồng biến trên khoảng nào sau đây?`,
    [L`$(-\infty; 1)$`, L`$(-\infty; -1)$`, L`$(-1; +\infty)$`, L`$(1; +\infty)$`], "D",
    L`Hệ số $a = 1 > 0$ và hoành độ đỉnh $x = 1$ nên hàm số nghịch biến trên $(-\infty; 1)$ và đồng biến trên $(1; +\infty)$.`),
  tf("mat_10_07", 10, "Math", "Hàm số bậc hai",
    L`Cho hàm số $f(x) = -x^2 + 2x + 3$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`Đồ thị hàm số là parabol có bề lõm hướng xuống dưới.`, true],
      [L`Trục đối xứng của đồ thị là đường thẳng $x = 1$.`, true],
      [L`Giá trị lớn nhất của hàm số bằng $3$.`, false],
      [L`Đồ thị hàm số cắt trục hoành tại hai điểm phân biệt.`, true],
    ],
    L`$a = -1 < 0$ nên bề lõm hướng xuống; trục đối xứng $x = -\dfrac{b}{2a} = 1$; giá trị lớn nhất là $f(1) = 4$ (không phải $3$); $\Delta = 16 > 0$ nên cắt trục hoành tại $x = -1$ và $x = 3$.`),
  sa("mat_10_08", 10, "Math", "Hàm số bậc hai",
    L`Giá trị nhỏ nhất của hàm số $y = x^2 - 6x + 5$ bằng bao nhiêu?`,
    "-4",
    L`Hàm số đạt giá trị nhỏ nhất tại đỉnh $x = 3$, khi đó $y = 9 - 18 + 5 = -4$.`),
  dd("mat_10_09", 10, "Math", "Hàm số bậc hai",
    "Kéo mỗi đáp án vào ô tương ứng.",
    [
      [L`Trục đối xứng của parabol $y = x^2 - 4x + 1$`, L`$x = 2$`],
      [L`Tọa độ đỉnh của parabol $y = x^2 - 2x + 3$`, L`$I(1; 2)$`],
      [L`Giá trị nhỏ nhất của hàm số $y = x^2 + 4x + 5$`, L`$1$`],
      [L`Giao điểm của parabol $y = x^2 - 1$ với trục tung`, L`$(0; -1)$`],
      [L`Số giao điểm của parabol $y = x^2 + 1$ với trục hoành`, L`$0$`],
    ],
    [L`$x = -2$`, L`$I(1; 3)$`, L`$5$`, L`$(-1; 0)$`, L`$2$`],
    L`Trục đối xứng $x = -\dfrac{b}{2a} = 2$. Đỉnh của $y = x^2 - 2x + 3$ là $I(1; 2)$. Hàm $y = x^2 + 4x + 5$ đạt giá trị nhỏ nhất tại $x = -2$ và bằng $1$. Cho $x = 0$ vào $y = x^2 - 1$ được $(0; -1)$. Phương trình $x^2 + 1 = 0$ vô nghiệm nên không có giao điểm với trục hoành.`),

  // ===== Lớp 11 – Cấp số cộng và cấp số nhân =====
  mc("mat_11_01", 11, "Math", "Cấp số cộng và cấp số nhân",
    L`Cho cấp số cộng $(u_n)$ có $u_1 = 3$ và công sai $d = 4$. Số hạng $u_5$ bằng:`,
    [L`$19$`, L`$23$`, L`$16$`, L`$15$`], "A",
    L`$u_n = u_1 + (n - 1)d$ nên $u_5 = 3 + 4 \cdot 4 = 19$.`),
  mc("mat_11_02", 11, "Math", "Cấp số cộng và cấp số nhân",
    L`Cho cấp số nhân $(u_n)$ có $u_1 = 2$ và công bội $q = 3$. Tổng $4$ số hạng đầu tiên $S_4$ bằng:`,
    [L`$54$`, L`$80$`, L`$160$`, L`$26$`], "B",
    L`$S_4 = \dfrac{u_1(q^4 - 1)}{q - 1} = \dfrac{2(81 - 1)}{2} = 80$ (hay $2 + 6 + 18 + 54 = 80$).`),
  tf("mat_11_03", 11, "Math", "Cấp số cộng và cấp số nhân",
    L`Cho dãy số $(u_n)$ với $u_n = 2n + 1$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$u_1 = 3$.`, true],
      [L`$(u_n)$ là cấp số cộng với công sai $d = 2$.`, true],
      [L`Tổng $10$ số hạng đầu tiên của dãy bằng $110$.`, false],
      [L`$(u_n)$ là dãy số giảm.`, false],
    ],
    L`$u_1 = 3$ và $u_{n+1} - u_n = 2$ nên $(u_n)$ là cấp số cộng tăng với $d = 2$. Tổng $10$ số hạng đầu $S_{10} = \dfrac{10(3 + 21)}{2} = 120$ (không phải $110$).`),
  sa("mat_11_04", 11, "Math", "Cấp số cộng và cấp số nhân",
    L`Cho cấp số nhân $(u_n)$ có $u_1 = 1$ và $u_4 = 27$. Công bội $q$ ($q > 0$) bằng bao nhiêu?`,
    "3",
    L`$u_4 = u_1 \cdot q^3$ nên $q^3 = 27$, suy ra $q = 3$.`),

  // ===== Lớp 11 – Đạo hàm =====
  mc("mat_11_05", 11, "Math", "Đạo hàm",
    L`Đạo hàm của hàm số $y = x^3 - 2x^2 + 5$ là:`,
    [L`$3x^2 - 2x$`, L`$x^2 - 4x$`, L`$3x^2 - 4x$`, L`$3x^2 - 4x + 5$`], "C",
    L`Áp dụng $(x^n)' = n x^{n-1}$ và đạo hàm của hằng số bằng $0$: $y' = 3x^2 - 4x$.`),
  mc("mat_11_06", 11, "Math", "Đạo hàm",
    L`Hệ số góc của tiếp tuyến của đồ thị hàm số $y = x^2$ tại điểm có hoành độ $x = 3$ là:`,
    [L`$2$`, L`$3$`, L`$9$`, L`$6$`], "D",
    L`Hệ số góc tiếp tuyến bằng $y'(3)$. Vì $y' = 2x$ nên $y'(3) = 6$.`),
  tf("mat_11_07", 11, "Math", "Đạo hàm",
    L`Cho hàm số $f(x) = x^3 - 3x$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$f'(x) = 3x^2 - 3$.`, true],
      [L`$f'(2) = 9$.`, true],
      [L`Phương trình $f'(x) = 0$ có hai nghiệm $x = -1$ và $x = 1$.`, true],
      [L`Tiếp tuyến của đồ thị tại điểm có hoành độ $x = 0$ có hệ số góc dương.`, false],
    ],
    L`$f'(x) = 3x^2 - 3$; $f'(2) = 12 - 3 = 9$; $f'(x) = 0 \Leftrightarrow x = \pm 1$; $f'(0) = -3 < 0$ nên hệ số góc của tiếp tuyến tại $x = 0$ là số âm.`),
  sa("mat_11_08", 11, "Math", "Đạo hàm",
    L`Cho hàm số $f(x) = 2x^3 - 6x + 1$. Giá trị $f'(2)$ bằng bao nhiêu?`,
    "18",
    L`$f'(x) = 6x^2 - 6$ nên $f'(2) = 6 \cdot 4 - 6 = 18$.`),
  dd("mat_11_09", 11, "Math", "Đạo hàm",
    "Kéo mỗi đáp án vào đạo hàm tương ứng.",
    [
      [L`$(x^5)'$`, L`$5x^4$`],
      [L`$(\sin x)'$`, L`$\cos x$`],
      [L`$(\cos x)'$`, L`$-\sin x$`],
      [L`$(e^x)'$`, L`$e^x$`],
      [L`$(\ln x)'$ với $x > 0$`, L`$\dfrac{1}{x}$`],
    ],
    [L`$x^4$`, L`$\sin x$`, L`$-\cos x$`, L`$x e^{x-1}$`, L`$\ln x$`],
    L`$(x^n)' = n x^{n-1}$ nên $(x^5)' = 5x^4$; $(\sin x)' = \cos x$; $(\cos x)' = -\sin x$; $(e^x)' = e^x$; $(\ln x)' = \dfrac{1}{x}$ với $x > 0$.`),

  // ===== Lớp 11 – Quan hệ vuông góc trong không gian (hình học không gian) =====
  mc("mat_11_10", 11, "Math", "Quan hệ vuông góc trong không gian",
    L`Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA \perp (ABCD)$ và $SA = a\sqrt{2}$. Góc giữa đường thẳng $SC$ và mặt phẳng $(ABCD)$ bằng:`,
    [L`$30^\circ$`, L`$45^\circ$`, L`$60^\circ$`, L`$90^\circ$`], "B",
    L`Vì $SA \perp (ABCD)$ nên hình chiếu của $SC$ lên $(ABCD)$ là $AC$, do đó góc cần tìm là $\widehat{SCA}$. Ta có $AC = a\sqrt{2}$ và $SA = a\sqrt{2}$ nên $\tan\widehat{SCA} = \dfrac{SA}{AC} = 1$, suy ra góc bằng $45^\circ$.`),
  mc("mat_11_11", 11, "Math", "Quan hệ vuông góc trong không gian",
    L`Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai đường thẳng $AB'$ và $BC'$ bằng:`,
    [L`$30^\circ$`, L`$45^\circ$`, L`$60^\circ$`, L`$90^\circ$`], "C",
    L`Đặt cạnh hình lập phương bằng $1$. Vì $AB' \parallel DC'$ nên góc cần tìm bằng góc giữa $DC'$ và $BC'$. Tam giác $BDC'$ có $BD = DC' = BC' = \sqrt{2}$ nên là tam giác đều, suy ra góc bằng $60^\circ$.`),
  tf("mat_11_12", 11, "Math", "Quan hệ vuông góc trong không gian",
    L`Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông tâm $O$ và $SA \perp (ABCD)$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$BD \perp (SAC)$.`, true],
      [L`$CD \perp (SAD)$.`, true],
      [L`$AC \perp (SBD)$.`, false],
      [L`$(SAC) \perp (ABCD)$.`, true],
    ],
    L`$BD \perp AC$ và $BD \perp SA$ nên $BD \perp (SAC)$. $CD \perp AD$ và $CD \perp SA$ nên $CD \perp (SAD)$. Mặt phẳng $(SAC)$ chứa $SA \perp (ABCD)$ nên $(SAC) \perp (ABCD)$. Còn $AC$ không vuông góc với $SO$ nên $AC \not\perp (SBD)$.`),
  sa("mat_11_13", 11, "Math", "Quan hệ vuông góc trong không gian",
    L`Cho hình lập phương $ABCD.A'B'C'D'$ có cạnh bằng $\sqrt{3}$. Độ dài đường chéo $AC'$ bằng bao nhiêu?`,
    "3",
    L`Đường chéo của hình lập phương cạnh $a$ có độ dài $a\sqrt{3}$ nên $AC' = \sqrt{3} \cdot \sqrt{3} = 3$.`),

  // ===== Lớp 12 – Ứng dụng đạo hàm khảo sát hàm số =====
  mc("mat_12_01", 12, "Math", "Ứng dụng đạo hàm khảo sát hàm số",
    L`Hàm số $y = x^3 - 3x^2 + 2$ đồng biến trên khoảng nào sau đây?`,
    [L`$(0; 2)$`, L`$(-\infty; 0)$`, L`$(-1; 1)$`, L`$(1; 3)$`], "B",
    L`$y' = 3x^2 - 6x = 3x(x - 2)$. $y' > 0$ khi $x < 0$ hoặc $x > 2$ nên hàm số đồng biến trên $(-\infty; 0)$ và $(2; +\infty)$; nghịch biến trên $(0; 2)$.`),
  mc("mat_12_02", 12, "Math", "Ứng dụng đạo hàm khảo sát hàm số",
    L`Giá trị cực đại của hàm số $y = x^3 - 3x + 2$ bằng:`,
    [L`$0$`, L`$-1$`, L`$4$`, L`$2$`], "C",
    L`$y' = 3x^2 - 3 = 0 \Leftrightarrow x = \pm 1$. $y'$ đổi dấu từ dương sang âm tại $x = -1$ nên đó là điểm cực đại, giá trị cực đại $y(-1) = -1 + 3 + 2 = 4$.`),
  tf("mat_12_03", 12, "Math", "Ứng dụng đạo hàm khảo sát hàm số",
    L`Cho hàm số $y = \dfrac{2x - 1}{x + 1}$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`Tập xác định của hàm số là $\mathbb{R} \setminus \{-1\}$.`, true],
      [L`Đường tiệm cận đứng của đồ thị là $x = -1$.`, true],
      [L`Đường tiệm cận ngang của đồ thị là $y = 1$.`, false],
      [L`Hàm số đồng biến trên mỗi khoảng xác định của nó.`, true],
    ],
    L`Hàm số xác định khi $x \ne -1$; tiệm cận đứng $x = -1$; tiệm cận ngang $y = 2$ (không phải $y = 1$); $y' = \dfrac{3}{(x + 1)^2} > 0$ nên hàm số đồng biến trên từng khoảng xác định.`),
  sa("mat_12_04", 12, "Math", "Ứng dụng đạo hàm khảo sát hàm số",
    L`Giá trị lớn nhất của hàm số $f(x) = -x^2 + 4x + 1$ trên đoạn $[0; 3]$ bằng bao nhiêu?`,
    "5",
    L`$f'(x) = -2x + 4 = 0 \Leftrightarrow x = 2 \in [0; 3]$. So sánh $f(0) = 1$, $f(2) = 5$, $f(3) = 4$ nên giá trị lớn nhất là $5$.`),

  // ===== Lớp 12 – Nguyên hàm và tích phân =====
  mc("mat_12_05", 12, "Math", "Nguyên hàm và tích phân",
    L`Nguyên hàm của hàm số $f(x) = 2x + 1$ là:`,
    [L`$x^2 + x + C$`, L`$2x^2 + x + C$`, L`$x^2 + C$`, L`$2 + C$`], "A",
    L`$\displaystyle\int (2x + 1)\,dx = 2 \cdot \dfrac{x^2}{2} + x + C = x^2 + x + C$.`),
  mc("mat_12_06", 12, "Math", "Nguyên hàm và tích phân",
    L`Cho tích phân $$I = \int_0^1 \left(3x^2 + 2x\right)dx.$$ Giá trị của $I$ bằng:`,
    [L`$3$`, L`$1$`, L`$5$`, L`$2$`], "D",
    L`$$\int_0^1 (3x^2 + 2x)\,dx = \Big[x^3 + x^2\Big]_0^1 = (1 + 1) - 0 = 2.$$`),
  tf("mat_12_07", 12, "Math", "Nguyên hàm và tích phân",
    L`Cho $\displaystyle\int_0^2 f(x)\,dx = 3$ và $\displaystyle\int_0^2 g(x)\,dx = -1$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$\displaystyle\int_0^2 \left[f(x) + g(x)\right]dx = 2$.`, true],
      [L`$\displaystyle\int_0^2 2f(x)\,dx = 6$.`, true],
      [L`$\displaystyle\int_0^2 \left[f(x) - g(x)\right]dx = 2$.`, false],
      [L`$\displaystyle\int_2^0 f(x)\,dx = 3$.`, false],
    ],
    L`Tích phân có tính tuyến tính: tổng là $3 + (-1) = 2$; $\displaystyle\int_0^2 2f(x)\,dx = 2 \cdot 3 = 6$; hiệu là $3 - (-1) = 4$ (không phải $2$); đổi cận thì đổi dấu nên $\displaystyle\int_2^0 f(x)\,dx = -3$.`),
  sa("mat_12_08", 12, "Math", "Nguyên hàm và tích phân",
    L`Biết $F(x)$ là một nguyên hàm của $f(x) = 3x^2$ và $F(0) = 1$. Giá trị $F(2)$ bằng bao nhiêu?`,
    "9",
    L`$F(x) = x^3 + C$; $F(0) = 1$ nên $C = 1$. Do đó $F(2) = 8 + 1 = 9$.`),
  dd("mat_12_09", 12, "Math", "Nguyên hàm và tích phân",
    L`Kéo mỗi đáp án vào nguyên hàm tương ứng ($C$ là hằng số).`,
    [
      [L`$\displaystyle\int x\,dx$`, L`$\dfrac{x^2}{2} + C$`],
      [L`$\displaystyle\int e^x\,dx$`, L`$e^x + C$`],
      [L`$\displaystyle\int \cos x\,dx$`, L`$\sin x + C$`],
      [L`$\displaystyle\int \dfrac{1}{x}\,dx$ với $x > 0$`, L`$\ln x + C$`],
      [L`$\displaystyle\int 1\,dx$`, L`$x + C$`],
    ],
    [L`$x^2 + C$`, L`$-\sin x + C$`, L`$\cos x + C$`, L`$\dfrac{1}{x} + C$`, L`$\dfrac{e^x}{x} + C$`],
    L`$\displaystyle\int x\,dx = \dfrac{x^2}{2} + C$; $\displaystyle\int e^x\,dx = e^x + C$; $\displaystyle\int \cos x\,dx = \sin x + C$; $\displaystyle\int \dfrac{1}{x}\,dx = \ln x + C$ ($x > 0$); $\displaystyle\int 1\,dx = x + C$.`),

  // ===== Lớp 12 – Vectơ và hệ tọa độ trong không gian =====
  mc("mat_12_10", 12, "Math", "Vectơ và hệ tọa độ trong không gian",
    L`Trong không gian $Oxyz$, cho $\overrightarrow{a} = (1; -2; 3)$ và $\overrightarrow{b} = (2; 0; -1)$. Tọa độ của vectơ $\overrightarrow{a} + 2\overrightarrow{b}$ là:`,
    [L`$(3; -2; 2)$`, L`$(5; -2; 1)$`, L`$(5; -4; 1)$`, L`$(4; -2; 5)$`], "B",
    L`$2\overrightarrow{b} = (4; 0; -2)$ nên $\overrightarrow{a} + 2\overrightarrow{b} = (1 + 4;\ -2 + 0;\ 3 - 2) = (5; -2; 1)$.`),
  mc("mat_12_11", 12, "Math", "Vectơ và hệ tọa độ trong không gian",
    L`Trong không gian $Oxyz$, cho hai điểm $A(1; 2; 3)$ và $B(3; 0; 5)$. Tọa độ trung điểm $M$ của đoạn thẳng $AB$ là:`,
    [L`$(4; 2; 8)$`, L`$(1; -1; 1)$`, L`$(2; 1; 4)$`, L`$(2; -1; 4)$`], "C",
    L`$M\left(\dfrac{1 + 3}{2};\ \dfrac{2 + 0}{2};\ \dfrac{3 + 5}{2}\right) = (2; 1; 4)$.`),
  tf("mat_12_12", 12, "Math", "Vectơ và hệ tọa độ trong không gian",
    L`Trong không gian $Oxyz$, cho $\overrightarrow{u} = (1; 2; 2)$ và $\overrightarrow{v} = (2; -1; 0)$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$|\overrightarrow{u}| = 3$.`, true],
      [L`$\overrightarrow{u} \cdot \overrightarrow{v} = 0$.`, true],
      [L`$\overrightarrow{u} - \overrightarrow{v} = (3; 3; 2)$.`, false],
      [L`$|\overrightarrow{v}| = \sqrt{5}$.`, true],
    ],
    L`$|\overrightarrow{u}| = \sqrt{1 + 4 + 4} = 3$; $\overrightarrow{u} \cdot \overrightarrow{v} = 2 - 2 + 0 = 0$; $\overrightarrow{u} - \overrightarrow{v} = (-1; 3; 2)$ (không phải $(3; 3; 2)$); $|\overrightarrow{v}| = \sqrt{4 + 1 + 0} = \sqrt{5}$.`),
  sa("mat_12_13", 12, "Math", "Vectơ và hệ tọa độ trong không gian",
    L`Trong không gian $Oxyz$, mặt cầu $(S)\colon x^2 + y^2 + z^2 - 2x + 4y - 6z + 5 = 0$ có bán kính bằng bao nhiêu?`,
    "3",
    L`Viết lại $(x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 9$. Vậy mặt cầu có tâm $I(1; -2; 3)$ và bán kính $R = \sqrt{9} = 3$.`),

  // ===== Lớp 12 – Xác suất có điều kiện =====
  mc("mat_12_14", 12, "Math", "Xác suất có điều kiện",
    L`Cho hai biến cố $A$ và $B$ có $P(A) = 0{,}5$, $P(B) = 0{,}4$ và $P(A \cap B) = 0{,}2$. Xác suất có điều kiện $P(A \mid B)$ bằng:`,
    [L`$0{,}2$`, L`$0{,}4$`, L`$0{,}5$`, L`$0{,}8$`], "C",
    L`$$P(A \mid B) = \dfrac{P(A \cap B)}{P(B)} = \dfrac{0{,}2}{0{,}4} = 0{,}5.$$ Lưu ý $0{,}4$ là giá trị của $P(B \mid A) = \dfrac{0{,}2}{0{,}5}$.`),
  mc("mat_12_15", 12, "Math", "Xác suất có điều kiện",
    L`Một hộp có $5$ bi đỏ và $3$ bi xanh. Lấy ngẫu nhiên lần lượt $2$ bi, không hoàn lại. Xác suất để bi thứ hai màu xanh, biết bi thứ nhất màu đỏ, bằng:`,
    [L`$\dfrac{3}{8}$`, L`$\dfrac{3}{7}$`, L`$\dfrac{2}{7}$`, L`$\dfrac{5}{8}$`], "B",
    L`Sau khi lấy $1$ bi đỏ, hộp còn $4$ bi đỏ và $3$ bi xanh (tổng $7$ bi) nên xác suất lấy được bi xanh là $\dfrac{3}{7}$.`),
  tf("mat_12_16", 12, "Math", "Xác suất có điều kiện",
    L`Cho hai biến cố $A$, $B$ có $P(A) = 0{,}6$, $P(B) = 0{,}5$ và $P(A \cap B) = 0{,}3$. Đánh giá tính Đúng/Sai của các phát biểu sau:`,
    [
      [L`$P(A \mid B) = 0{,}6$.`, true],
      [L`$P(B \mid A) = 0{,}5$.`, true],
      [L`$P(A \cup B) = 0{,}9$.`, false],
      [L`$A$ và $B$ là hai biến cố độc lập.`, true],
    ],
    L`$P(A \mid B) = \dfrac{0{,}3}{0{,}5} = 0{,}6$; $P(B \mid A) = \dfrac{0{,}3}{0{,}6} = 0{,}5$; $P(A \cup B) = 0{,}6 + 0{,}5 - 0{,}3 = 0{,}8$ (không phải $0{,}9$); vì $P(A) \cdot P(B) = 0{,}3 = P(A \cap B)$ nên $A$ và $B$ độc lập.`),
  sa("mat_12_17", 12, "Math", "Xác suất có điều kiện",
    L`Một lớp có $40$ học sinh, trong đó $25$ em giỏi Toán, $20$ em giỏi Lý và $10$ em giỏi cả hai môn. Chọn ngẫu nhiên một học sinh. Biết em đó giỏi Toán, xác suất để em đó cũng giỏi Lý là bao nhiêu? (viết dưới dạng số thập phân)`,
    "0.4",
    L`Gọi $A$: “giỏi Toán”, $B$: “giỏi Lý”. Khi đó $P(B \mid A) = \dfrac{n(A \cap B)}{n(A)} = \dfrac{10}{25} = 0{,}4$.`),
);

// Mức độ nhận thức: easy = Nhận biết, medium = Thông hiểu, hard = Vận dụng.
const MATH_DIFFICULTY_BY_ID = {
  mat_10_01: "easy", mat_10_02: "medium", mat_10_03: "medium", mat_10_04: "easy", mat_10_05: "easy",
  mat_10_06: "medium", mat_10_07: "hard", mat_10_08: "medium", mat_10_09: "medium",
  mat_11_01: "easy", mat_11_02: "medium", mat_11_03: "medium", mat_11_04: "easy", mat_11_05: "easy",
  mat_11_06: "medium", mat_11_07: "hard", mat_11_08: "medium", mat_11_09: "medium",
  mat_11_10: "medium", mat_11_11: "medium", mat_11_12: "hard", mat_11_13: "easy",
  mat_12_01: "medium", mat_12_02: "medium", mat_12_03: "hard", mat_12_04: "hard", mat_12_05: "easy",
  mat_12_06: "medium", mat_12_07: "medium", mat_12_08: "medium", mat_12_09: "easy",
  mat_12_10: "easy", mat_12_11: "easy", mat_12_12: "medium", mat_12_13: "medium",
  mat_12_14: "medium", mat_12_15: "medium", mat_12_16: "hard", mat_12_17: "hard",
};

questionBank
  .filter((q) => q.id.startsWith("mat_"))
  .forEach((q) => {
    q.difficulty = DIFFICULTY[MATH_DIFFICULTY_BY_ID[q.id]] ? MATH_DIFFICULTY_BY_ID[q.id] : "medium";
  });

mockExams.push(
  {
    // Đề đủ 4 phần (trắc nghiệm, đúng/sai, trả lời ngắn, kéo thả); công thức hàm số, tích phân,
    // hình học không gian, tọa độ Oxyz, xác suất.
    examId: "exam_mat_mock_01",
    title: "Đề thi thử Toán học tổng hợp 10 – 12",
    defaultTimeMinutes: 90,
    kind: "mock",
    examCategory: "subject",
    subject: "Math",
    questions: [
      // Phần I – trắc nghiệm
      "mat_10_02", "mat_10_05", "mat_11_02", "mat_11_05", "mat_11_10", "mat_11_11",
      "mat_12_01", "mat_12_02", "mat_12_06", "mat_12_10", "mat_12_14", "mat_12_15",
      // Phần II – đúng/sai
      "mat_10_03", "mat_11_12", "mat_12_03", "mat_12_16",
      // Phần III – trả lời ngắn (có số âm và số thập phân)
      "mat_10_08", "mat_11_08", "mat_11_13", "mat_12_08", "mat_12_13", "mat_12_17",
      // Phần IV – kéo thả
      "mat_12_09",
    ],
  },
  {
    // Đề ngắn chỉ có Phần I và Phần II: giao diện tự ẩn các phần không có câu hỏi.
    examId: "exam_mat_quick_01",
    title: "Đề kiểm tra nhanh Toán 12 (Trắc nghiệm + Đúng/Sai)",
    defaultTimeMinutes: 20,
    kind: "mock",
    examCategory: "subject",
    subject: "Math",
    questions: [
      "mat_12_01", "mat_12_05", "mat_12_06", "mat_12_10", "mat_12_11", "mat_12_14", "mat_12_15",
      "mat_12_07", "mat_12_12",
    ],
  }
);
