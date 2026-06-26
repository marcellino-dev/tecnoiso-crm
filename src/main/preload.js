const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  uploadArquivo: (data) => ipcRenderer.invoke('arquivo:upload', data),
  abrirArquivo: (caminho) => ipcRenderer.invoke('arquivo:abrir', caminho),
  excluirArquivo: (caminho) => ipcRenderer.invoke('arquivo:excluir', caminho),
  dialogArquivo: () => ipcRenderer.invoke('dialog:arquivo'),
  dialogPasta: () => ipcRenderer.invoke('dialog:pasta'),
})
