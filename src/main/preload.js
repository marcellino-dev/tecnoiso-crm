const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  uploadArquivo: (data) => ipcRenderer.invoke('arquivo:upload', data),
  abrirArquivo: (caminho) => ipcRenderer.invoke('arquivo:abrir', caminho),
  excluirArquivo: (caminho) => ipcRenderer.invoke('arquivo:excluir', caminho),
  dialogArquivo: () => ipcRenderer.invoke('dialog:arquivo'),
  dialogPasta: () => ipcRenderer.invoke('dialog:pasta'),

  // Auto-update
  verificarUpdate: () => ipcRenderer.invoke('update:verificar'),
  instalarUpdate: () => ipcRenderer.invoke('update:instalar'),
  onUpdateDisponivel: (cb) => ipcRenderer.on('update:disponivel', (_, data) => cb(data)),
  onUpdateProgresso: (cb) => ipcRenderer.on('update:progresso', (_, data) => cb(data)),
  onUpdateBaixado: (cb) => ipcRenderer.on('update:baixado', (_, data) => cb(data)),
})