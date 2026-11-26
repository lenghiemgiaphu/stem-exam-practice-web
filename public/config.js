// Copy this template and fill in your own keys.
// WARNING: anything in a client-side file is visible to every visitor.
// Gemini is NOT configured here any more: set GEMINI_API_KEY / GEMINI_MODEL as server
// environment variables (see .env.example); the browser calls POST /api/ai-explain instead.
const config = {
  // Firebase Console -> Project settings -> General -> "Your apps" (Web app)
  // Also enable Authentication -> Sign-in method -> Google and Email/Password,
  // and add your domain under Authentication -> Settings -> Authorized domains.
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_FIREBASE_APP_ID",
  },
};
