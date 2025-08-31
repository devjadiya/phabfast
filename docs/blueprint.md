# **App Name**: PhabFast

## Core Features:

- Automated Task Fetching: Automatically fetches open tasks from the Phabricator API based on tags like 'good first task,' 'bots,' and difficulty levels.
- Intelligent Filtering: Filters tasks by language, difficulty (easy, medium, hard), subscriber count, and creation date using tags, keywords, and subscriber data.
- Language Detection: Detects the primary language of a task (e.g., PHP, Python, JavaScript, Lua) using regular expressions or NLP on the task description to facilitate language-based filtering. Includes a tool for extracting structured data (such as Language used) from the text of unstructured task description data
- Task Prioritization: Highlights simple and impactful tasks based on criteria such as low subscriber count, short description, and tags like 'enhancement' or 'high priority.'
- One-Click Access: Provides direct links to Phabricator tasks and related Gerrit patches within the dashboard.
- Task Feed Display: Presents tasks in a clear, card-based format, including the title, task ID, creation date, tags, subscriber count, and detected language.
- Export Functionality: Allows users to export the filtered task list as a CSV or Markdown file.

## Style Guidelines:

- Primary color: A vibrant blue (#29ABE2) to convey a sense of efficiency and focus, reflecting the app's purpose of quickly finding development tasks.
- Background color: Light gray (#F0F2F5) to provide a clean, uncluttered backdrop that reduces eye strain and keeps the focus on the task list.
- Accent color: A bright orange (#FF9933) to draw attention to key interactive elements such as buttons and links, making them easily identifiable.
- Font: 'Inter' (sans-serif) for both headings and body text, ensuring a modern, clean, and highly readable interface. Its neutral design suits the technical context of the application.
- Use Lucide icons to maintain a clean and consistent visual language, with intuitive icons representing filters, actions, and task categories.
- A one-page dashboard layout with a top navigation bar, a filter panel on the side or top row, and a main task feed to provide a seamless and efficient user experience.
- Subtle animations, such as a smooth transition when applying filters or refreshing the task list, to enhance the user experience without being distracting.