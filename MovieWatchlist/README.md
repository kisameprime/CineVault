# CineVault — Movie & Series Watchlist Manager

A personal Windows desktop watchlist application built with HTML, CSS, JavaScript and Electron.

## Features
- Dashboard with library statistics
- Add, edit and delete movies and series
- Statuses: Plan to Watch, Watching, Completed, On Hold and Dropped
- Search, genre filtering and sorting
- Favorites and personal ratings
- Series season and episode progress
- Local JSON storage on your computer
- Dark responsive interface

## Requirements
- Node.js LTS (includes npm)
- Windows, macOS or Linux for development

## Run the application
1. Extract the project ZIP.
2. Open the `MovieWatchlist` folder in VS Code.
3. Open the VS Code terminal (Terminal → New Terminal).
4. Run:

   ```bash
   npm install
   npm start
   ```

The first launch downloads Electron as a development dependency. Your watchlist is stored in Electron's application data folder and remains available when you reopen the app.

## Build a Windows installer
Run:

```bash
npm run dist
```

The installer will be created in the `release` folder. Build on Windows to produce a Windows installer.

## Notes
- Poster image URLs are optional. The app displays a styled placeholder when no poster is supplied.
- The app does not require an account or a network connection for normal library management.
- Movie metadata lookup and automatic poster search are not included in this first version.
