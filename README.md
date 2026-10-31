🚀 AI-Powered EdTech Web

📌 Overview

AI-Powered EdTech Web is a robust web application designed to revolutionize test preparation for high school students in core STEM subjects: Physics, Chemistry, and Biology.

By merging an authentic, paper-based exam interface with cutting-edge AI tutoring, our website democratizes access to high-quality education, providing students with infinite practice opportunities, multi-format questions, and real-time analytical insights.

✨ Core Features

🧠 AI Socratic Tutor: Integrated with the Gemini API, an on-demand AI chatbot is available for every question to explain underlying theories, logic, and step-by-step solutions.

📜 Authentic Paper-Style UI: The exam mode features a continuous vertical-scroll interface—strictly mirroring physical test papers—paired with a custom floating countdown timer.

🗂️ Dynamic Question Bank: Hierarchically organized by Subject, Grade (10-12), and Topic with a built-in search engine.

🧩 Multi-Format Support: The rendering engine seamlessly handles four distinct formats:

Multiple Choice (A, B, C, D)

True/False Evaluation

Drag-and-Drop

Short Answer (Fill-in-the-blanks)

📊 Analytics & History: Automated grading (10-point scale), accuracy tracking, and a user dashboard to review past attempts.

🛠️ Tech Stack

Core Framework: Next.js, React, TypeScript

Frontend Basics: HTML5, Vanilla JavaScript (ES6+), CSS3

Styling: Tailwind CSS, PostCSS

Typography & Icons: Google Fonts (Plus Jakarta Sans), FontAwesome

Backend & Auth: Firebase (Has not inserted API key)

AI Integration: Google Gemini API (Has not inserted API key)

## 📁 Project Structure

```text
📦 AI-Powered-EdTech-Web
┣ 📁 app                    # Next.js App Router (Pages, Layouts, API Routes)
┃ ┣ 📁 api                  # Backend API endpoints
┃ ┃ ┗ 📁 generate-quiz 
┃ ┃   ┗ 📁 live
┃ ┣ 📄 globals.css 
┃ ┣ 📄 layout.tsx 
┃ ┗ 📄 page.tsx
┣ 📁 components             # React UI Components
┃ ┗ 📁 ui
┃   ┗ 📄 button.tsx
┣ 📁 lib                    # Utility functions and core engine logic
┃ ┣ 📁 live
┃ ┃ ┣ 📄 engine.ts
┃ ┃ ┣ 📄 errors.ts
┃ ┃ ┣ 📄 extract.ts
┃ ┃ ┣ 📄 safe-fetch.ts
┃ ┃ ┗ 📄 schema.ts
┃ ┗ 📄 utils.ts
┣ 📁 public                 # Static assets, Vanilla JS logic, and mock data
┃ ┣ 📄 index.html           # Static entry point (if applicable)
┃ ┣ 📄 style.css 
┃ ┣ 📄 app.js, ai.js, auth.js, config.js, data.js, etc.
┃ ┗ 🖼️ placeholder-logo.png, icon.svg, etc.
┣ 📄 components.json        # UI Component config
┣ 📄 next.config.mjs        # Next.js configuration
┣ 📄 package.json           # Dependencies and scripts
┣ 📄 pnpm-lock.yaml         # Package lock file
┣ 📄 postcss.config.mjs     # PostCSS configuration
┣ 📄 README.md              # Project documentation
┗ 📄 tsconfig.json          # TypeScript configuration


💻 Local Development

To run this project locally, ensure you have Node.js and pnpm installed.

1. Clone the repository:

git clone https://github.com/lenghiemgiaphu/AI-Powered-EdTech-Web-v7.git
cd AI-Powered-EdTech-Web-v7


2. Install dependencies:

pnpm install


3. Configure API Keys:
Update your configuration files (e.g., .env.local or public/config.js) to insert your Firebase and Gemini API keys to enable full functionality.

4. Start the development server:

pnpm dev


Open http://localhost:3000 with your browser to see the result.
