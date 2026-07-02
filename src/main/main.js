const { app, BrowserWindow, ipcMain, dialog, shell, session } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')

const isDev = !app.isPackaged

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = false

const DATA_DIR = path.join(app.getPath('userData'), 'TecnoisoCRM')
const FILES_DIR = path.join(DATA_DIR, 'arquivos')
const CACHE_DIR = path.join(DATA_DIR, 'cache')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true })
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

// Limpa arquivos de cache com mais de 7 dias, para não crescer indefinidamente
function limparCacheAntigo() {
  const seteDias = 7 * 24 * 60 * 60 * 1000
  try {
    for (const nome of fs.readdirSync(CACHE_DIR)) {
      const caminho = path.join(CACHE_DIR, nome)
      const stat = fs.statSync(caminho)
      if (Date.now() - stat.mtimeMs > seteDias) fs.unlinkSync(caminho)
    }
  } catch (e) {
    console.error('Erro ao limpar cache de arquivos:', e)
  }
}

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

  // ── Rede de segurança ──────────────────────────────────────────────────
  // Se algo (ex.: window.open no renderer) tentar abrir uma nova janela para
  // uma URL de arquivo, não deixa o Electron criar essa janela: baixa o
  // arquivo e abre no programa padrão do Windows.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    abrirUrlNoPadrao(url)
    return { action: 'deny' }
  })

  // Se o Chromium decidir baixar um arquivo por conta própria (comportamento
  // padrão dele para tipos que não sabe renderizar, como .xlsx), intercepta
  // antes do diálogo "Salvar como" aparecer e abre no programa padrão.
  mainWindow.webContents.session.on('will-download', (event, item) => {
    event.preventDefault()
    abrirUrlNoPadrao(item.getURL())
  })
}

app.whenReady().then(() => {
  createWindow()
  limparCacheAntigo()
  if (!isDev) {
    autoUpdater.checkForUpdates().catch(() => {})
  }
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

// ── Auto-update ───────────────────────────────────────────────────────────────
function enviarParaRenderer(canal, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(canal, payload)
}

autoUpdater.on('update-available', (info) => {
  enviarParaRenderer('update:disponivel', { versao: info.version })
})

autoUpdater.on('download-progress', (progress) => {
  enviarParaRenderer('update:progresso', { percent: Math.round(progress.percent) })
})

autoUpdater.on('update-downloaded', (info) => {
  enviarParaRenderer('update:baixado', { versao: info.version })
})

autoUpdater.on('error', (err) => {
  console.error('Erro no auto-update:', err)
})

ipcMain.handle('update:instalar', () => {
  autoUpdater.quitAndInstall()
  return true
})

ipcMain.handle('update:verificar', async () => {
  if (isDev) return { ok: false, motivo: 'dev' }
  try {
    await autoUpdater.checkForUpdates()
    return { ok: true }
  } catch (e) {
    return { ok: false, motivo: e.message }
  }
})

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

// Abre um arquivo (local ou remoto/URL) diretamente no programa padrão do
// Windows (Excel, Word, Adobe Reader, etc.), sem exibir visualizador próprio
// e sem exigir que o usuário clique em "baixar". Se for uma URL, o arquivo é
// baixado silenciosamente para um cache local antes de ser aberto.
// (CACHE_DIR e limparCacheAntigo já foram definidos no topo do arquivo)
async function abrirUrlNoPadrao(url, nome) {
  try {
    if (!url) return { ok: false, motivo: 'sem-url' }

    // Já é um caminho local existente no disco: abre direto, sem baixar nada
    if (fs.existsSync(url)) {
      const erro = await shell.openPath(url)
      return erro ? { ok: false, motivo: erro } : { ok: true }
    }

    const nomeBase = nome || decodeURIComponent(url.split('/').pop() || 'arquivo')
    const nomeSeguro = nomeBase.replace(/[\\/:*?"<>|]/g, '_')
    const destino = path.join(CACHE_DIR, `${Date.now()}_${nomeSeguro}`)

    const resposta = await fetch(url)
    if (!resposta.ok) return { ok: false, motivo: `Falha ao baixar (HTTP ${resposta.status})` }
    const buffer = Buffer.from(await resposta.arrayBuffer())
    fs.writeFileSync(destino, buffer)

    const erro = await shell.openPath(destino)
    return erro ? { ok: false, motivo: erro } : { ok: true }
  } catch (e) {
    console.error('Erro ao abrir arquivo no programa padrão:', e)
    return { ok: false, motivo: e.message }
  }
}

ipcMain.handle('arquivo:abrir-url', async (_, { url, nome }) => abrirUrlNoPadrao(url, nome))

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