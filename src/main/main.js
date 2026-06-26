const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged

const DATA_DIR = path.join(app.getPath('userData'), 'TecnoisoCRM')
const FILES_DIR = path.join(DATA_DIR, 'arquivos')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true })

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'Tecnoiso CRM',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── Upload de arquivos ────────────────────────────────────────────────────────
ipcMain.handle('arquivo:upload', async (_, { clienteId, nome, buffer, tipo }) => {
  const dir = path.join(FILES_DIR, String(clienteId))
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const ext = path.extname(nome)
  const nomeArq = `${Date.now()}${ext}`
  const caminho = path.join(dir, nomeArq)
  fs.writeFileSync(caminho, Buffer.from(buffer))
  const stat = fs.statSync(caminho)
  return { caminho, nomeArq, tamanho: stat.size }
})

ipcMain.handle('arquivo:abrir', (_, caminho) => {
  shell.openPath(caminho)
  return true
})

ipcMain.handle('arquivo:excluir', (_, caminho) => {
  if (fs.existsSync(caminho)) fs.unlinkSync(caminho)
  return true
})

ipcMain.handle('dialog:arquivo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecionar arquivo',
    filters: [
      { name: 'Todos', extensions: ['*'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'Planilhas', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'Imagens', extensions: ['jpg', 'jpeg', 'png'] },
    ],
    properties: ['openFile', 'multiSelections']
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('dialog:pasta', () => {
  shell.openPath(FILES_DIR)
  return true
})
