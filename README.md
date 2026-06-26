# Tecnoiso CRM

Sistema desktop de gestão de clientes com sincronização em tempo real.

## Tecnologias
- **Electron** — app instalável no Windows
- **React** — interface
- **Supabase** — banco de dados PostgreSQL na nuvem (gratuito) com sincronização realtime

---

## ⚠️ Configuração obrigatória antes de usar

### 1. Criar conta no Supabase (gratuito)
1. Acesse https://supabase.com e crie uma conta
2. Crie um novo projeto → dê o nome `tecnoiso-crm`
3. Anote a senha do banco (você vai precisar)

### 2. Criar as tabelas e inserir os clientes
1. No painel do Supabase, vá em **SQL Editor**
2. Cole todo o conteúdo do arquivo `src/renderer/seed.sql`
3. Clique em **Run** — isso cria as tabelas E já insere todos os clientes da planilha

### 3. Criar o bucket de arquivos
1. Vá em **Storage** → **New bucket**
2. Nome: `arquivos`
3. Marque **Public bucket**

### 4. Configurar a conexão no código
1. Vá em **Settings → API** no painel do Supabase
2. Copie a **Project URL** e a chave **anon/public**
3. Abra o arquivo `src/renderer/supabase.js` e substitua:
```js
const SUPABASE_URL = 'https://SEU_PROJETO.supabase.co'
const SUPABASE_ANON_KEY = 'SUA_CHAVE_PUBLICA_AQUI'
```

---

## Rodar em desenvolvimento

```bash
npm install

# Terminal 1 — Renderer (interface)
npm run dev:renderer

# Terminal 2 — Electron (janela)
npm run dev:electron
```

## Gerar instalador .exe para Windows

```bash
npm install
npm run build:win
```
O arquivo `.exe` aparece em `dist-electron/`.

---

## Sincronização em tempo real

Qualquer alteração feita em um PC (novo cliente, edição, arquivo) aparece **instantaneamente** em todos os outros PCs com o app aberto. O indicador verde "Sincronizado — tempo real" na sidebar confirma a conexão ativa.

---

## Estrutura de arquivos

```
tecnoiso-crm/
├── src/
│   ├── main/
│   │   ├── main.js          # Processo Electron (janela, IPC)
│   │   └── preload.js       # Bridge renderer ↔ main
│   └── renderer/
│       ├── App.jsx          # Interface completa
│       ├── supabase.js      # ← Configure sua URL aqui
│       ├── seed.sql         # ← Cole no Supabase SQL Editor
│       ├── main.jsx
│       └── style.css
├── index.html
├── vite.config.js
└── package.json
```
