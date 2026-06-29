# 📚 BookNook

**Your personal literary companion—designed to track progress, visualize reading habits, and deepen your connection with the stories you love.**

BookNook is a full-stack web application built to solve the friction of tracking reading progress and discovering new insights. By combining an intuitive library management system with AI-powered literary analysis, BookNook transforms how you interact with your bookshelf.

## 🚀 Key Features

* **Smart Library Management**: Effortlessly add books via OpenLibrary API integration, categorize your reading status (Want to Read, Reading, Finished, DNF), and track progress with dynamic visual feedback.
* **AI-Powered Analysis Kit**: Generate deep-dive literary analysis and motifs to watch for while reading.
* **Socratic Seminar**: An AI-driven, persistent chat thread that allows you to discuss the ending, themes, and deeper meanings of a finished book.
* **Dynamic Smart Recaps**: Get a plot summary tailored to your exact current page—ensuring no spoilers while helping you jump back into a story you’ve put down for a while.
* **Reading Metrics**: A visual dashboard showcasing your reading year, including genre breakdowns, average ratings, and total pages consumed.
* **Cinematic Design**: A warm, immersive UI featuring smooth animations, "shelving" effects, and a cohesive, reader-focused aesthetic.

## 🛠️ Technical Stack

* **Frontend**: React, Tailwind CSS, GSAP (for animations), Lucide React (icons).
* **Backend**: Node.js, Express.js.
* **Database**: MongoDB (via Mongoose).
* **AI Engine**: Gemini 2.5 Flash API.
* **Authentication**: Clerk.
* **Deployment**: Vercel (Frontend), Google Cloud Run (Backend).

## 🏗️ Architecture Overview

BookNook employs a robust caching strategy to balance functionality with API cost-efficiency.

* **Persistence Layer**: All AI-generated content (recaps, analysis, and Socratic chat histories) is cached directly within your MongoDB book schema.
* **Conditional Generation**: The Smart Recap tool intelligently compares the `recapPage` with your `currentPage` to only trigger an API call when genuine progress has been made.
* **State Management**: Real-time synchronization ensures that your library shelf, reading progress, and metrics dashboard are always in harmony.

## ⚙️ How It Works

1. **Search & Add**: The application uses the OpenLibrary API to fetch metadata, allowing you to add books to your personal shelf instantly.
2. **Tracking**: As you update your progress, the app calculates completion percentages and status changes automatically.
3. **AI Integration**: By leveraging Gemini, the app acts as a tutor or reading companion, providing specific, context-aware analysis without ever needing to leave the page.

---

### Getting Started (Development)

1. **Clone the repository**: `git clone [your-repo-link]`
2. **Environment Variables**: Create a `.env` file with the following keys:
* `VITE_GEMINI_API_KEY`: Your Google AI Studio API Key.
* `MONGO_URI`: Your MongoDB connection string.
* `VITE_API_URL`: Your backend endpoint URL.


3. **Install dependencies**: `npm install`
4. **Start the server**: `npm run dev`

---

*Built by [Kenzy Ibrahim] for the love of stories.*