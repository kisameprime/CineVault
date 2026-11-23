const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
const dataFile = () => path.join(app.getPath("userData"), "watchlist.json");

function readTitles() {
  try {
    const raw = fs.readFileSync(dataFile(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTitles(titles) {
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(titles, null, 2), "utf8");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 950,
    minHeight: 650,
    backgroundColor: "#0c0f17",
    title: "CineVault",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));
}

app.whenReady().then(() => {
  ipcMain.handle("titles:list", () => readTitles());

  ipcMain.handle("titles:save", (_event, incoming) => {
    if (!incoming || typeof incoming.title !== "string" || !incoming.title.trim()) {
      throw new Error("A title is required.");
    }
    const titles = readTitles();
    const now = new Date().toISOString();
    const clean = {
      id: incoming.id || `title-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: incoming.title.trim().slice(0, 120),
      type: incoming.type === "Series" ? "Series" : "Movie",
      genre: String(incoming.genre || "Other").slice(0, 50),
      year: Number(incoming.year) || null,
      status: ["Plan to Watch", "Watching", "Completed", "On Hold", "Dropped"].includes(incoming.status)
        ? incoming.status : "Plan to Watch",
      rating: Math.min(10, Math.max(0, Number(incoming.rating) || 0)),
      poster: String(incoming.poster || "").trim().slice(0, 1000),
      notes: String(incoming.notes || "").trim().slice(0, 2000),
      favorite: Boolean(incoming.favorite),
      season: Math.max(0, Number(incoming.season) || 0),
      episode: Math.max(0, Number(incoming.episode) || 0),
      totalEpisodes: Math.max(0, Number(incoming.totalEpisodes) || 0),
      createdAt: incoming.createdAt || now,
      updatedAt: now
    };
    const index = titles.findIndex(item => item.id === clean.id);
    if (index >= 0) titles[index] = clean;
    else titles.unshift(clean);
    writeTitles(titles);
    return clean;
  });

  ipcMain.handle("titles:delete", (_event, id) => {
    writeTitles(readTitles().filter(item => item.id !== id));
    return true;
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});