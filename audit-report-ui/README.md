# Audit Report UI

This project is a web application that allows users to upload an audit report file, view its contents in a table format, and download the data as a CSV file. The application also features a theme toggle to switch between black and white themes.

## Features

- **Drag and Drop Interface**: Users can easily upload their audit report files by dragging and dropping them into the designated area.
- **Table Display**: The contents of the uploaded audit report are displayed in a user-friendly table format.
- **Export to CSV**: Users can download the displayed data as a CSV file with a single click.
- **Theme Toggle**: Users can switch between black and white themes for better visibility and user experience.

## Project Structure

```
audit-report-ui
├── public
│   └── index.html          # Main HTML file
├── src
│   ├── components          # React components
│   │   ├── DragAndDrop.tsx # Component for drag and drop functionality
│   │   ├── TableDisplay.tsx # Component to display data in a table
│   │   ├── ExportButton.tsx # Component to export data as CSV
│   │   └── ThemeToggle.tsx  # Component to toggle themes
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Entry point for the React application
│   ├── styles              # CSS styles
│   │   └── theme.css       # Styles for themes
│   └── types               # TypeScript types
│       └── index.ts        # Type definitions
├── package.json            # npm configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd audit-report-ui
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Application**:
   ```bash
   npm start
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:3000` to view the application.

## Usage

- Drag and drop your audit report file into the designated area.
- View the contents in the table format.
- Click the "Export" button to download the data as a CSV file.
- Use the theme toggle to switch between black and white themes.

## Deployment

This project can be deployed to GitHub Pages. Follow the instructions in the GitHub documentation for deploying a React application to GitHub Pages.