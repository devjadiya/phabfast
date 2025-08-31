# PhabFast

PhabFast is a modern, AI-enhanced dashboard for browsing and filtering development tasks from Phabricator. Built with Next.js and leveraging Google's Gemini AI for language detection, it provides a streamlined interface for developers to discover tasks that match their skills and interests.

## Features

- **Live Task Fetching**: Connects directly to the Phabricator API to fetch real-time task data.
- **Advanced Filtering**: Filter tasks by date range, subscriber count, difficulty, and programming language.
- **AI-Powered Language Detection**: Automatically detects the primary programming language of each task using Genkit and Gemini.
- **Gerrit Integration**: Displays direct links to related code patches in Gerrit.
- **Pre-configured Queries**: Quick filters for "Good First Tasks" and "Bot Dev" tasks.
- **Export Functionality**: Export your filtered task list to CSV or Markdown.
- **Modern UI**: A sleek, responsive interface built with Tailwind CSS and Shadcn UI.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/)
- **AI**: [Genkit](https://firebase.google.com/docs/genkit) with Google's Gemini model
- **API Communication**: [Axios](https://axios-http.com/)

## Project Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)

### 2. Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-name>
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the root of your project and add the following variables.

```env
# Your Phabricator instance API URL
PHABRICATOR_API_URL=https://phabricator.wikimedia.org/api

# Your Phabricator Conduit API Token (generate from your Phabricator settings)
PHABRICATOR_API_TOKEN=api-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Google AI Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx

# (Optional) Your Gerrit instance URL for fetching patches
GERRIT_API_URL=https://gerrit.wikimedia.org/
```

### 5. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

## How It Works

- The frontend is built with React and Next.js, making requests from client components to Server Actions.
- Server Actions (`src/app/actions.ts`) handle all data fetching and business logic on the server.
- The `getTasks` action queries the Phabricator API (`maniphest.search`) to fetch tasks.
- For each task, the `detectTaskLanguage` Genkit flow is called to determine the programming language from its title and description.
- A link to a related Gerrit patch is also fetched if it exists.
- The filtered and enriched tasks are then sent back to the client to be displayed.
