const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("watchlistAPI", {
  list: () => ipcRenderer.invoke("titles:list"),
  save: (title) => ipcRenderer.invoke("titles:save", title),
  remove: (id) => ipcRenderer.invoke("titles:delete", id)
});