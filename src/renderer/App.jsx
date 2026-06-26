import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase.js'

// ─── Ícones SVG inline ────────────────────────────────────────────────────────
const Icon = ({ name, size = 14, color = 'currentColor' }) => {
  const icons = {
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>,
    file: <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
    upload: <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    download: <><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    wifi: <><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    'wifi-off': <><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 16 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    arkmeds: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12h8M12 8v8"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    refresh: <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  )
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
const cor = {
  ARKMEDS:  { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  'E-MAIL': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  'FÍSICO': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  'GOOGLE DRIVE': { bg: '#faf5ff', text: '#7c3aed', border: '#ddd6fe' },
  default:  { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' },
}
const badge = (forma) => {
  const c = cor[forma] || cor.default
  return { backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 500 }
}
const avatar = (nome) => nome ? nome.slice(0,2).toUpperCase() : '??'
const fmt = (ts) => ts ? new Date(ts).toLocaleDateString('pt-BR') : ''
const fmtSize = (b) => b < 1024 ? `${b}B` : b < 1048576 ? `${(b/1024).toFixed(0)}KB` : `${(b/1048576).toFixed(1)}MB`

// ─── Estilos base ─────────────────────────────────────────────────────────────
const S = {
  app:    { display:'flex', height:'100vh', fontFamily:'Inter,system-ui,sans-serif', fontSize:13, color:'#1a1a1a', background:'#fff', overflow:'hidden' },
  side:   { width:240, borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', background:'#fafafa', flexShrink:0 },
  main:   { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  card:   { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:14, marginBottom:12 },
  label:  { fontSize:10, fontWeight:600, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 },
  val:    { fontSize:13, color:'#111', lineHeight:1.4 },
  input:  { width:'100%', border:'1px solid #d1d5db', borderRadius:6, padding:'6px 10px', fontSize:13, outline:'none', background:'#fff', color:'#111' },
  btnPri: { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer' },
  btnSec: { display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:7, fontSize:12, cursor:'pointer' },
  btnDan: { display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:'transparent', color:'#dc2626', border:'1px solid #fca5a5', borderRadius:7, fontSize:12, cursor:'pointer' },
  obs:    { background:'#fffbeb', border:'1px solid #fde68a', borderRadius:7, padding:10, fontSize:12, color:'#78350f', lineHeight:1.6 },
  toast:  { position:'fixed', bottom:20, right:20, padding:'10px 16px', borderRadius:8, fontSize:12, fontWeight:500, zIndex:999, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(0,0,0,.15)' },
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer
function Toast({ msg, type = 'ok' }) {
  if (!msg) return null
  const styles = {
    ok:    { background:'#052e16', color:'#bbf7d0' },
    error: { background:'#450a0a', color:'#fecaca' },
    info:  { background:'#1e3a5f', color:'#bfdbfe' },
  }
  return <div style={{ ...S.toast, ...styles[type] }}>
    <Icon name={type === 'ok' ? 'check' : type === 'error' ? 'x' : 'info'} size={13} />
    {msg}
  </div>
}

// ─── MODAL DE CADASTRO / EDIÇÃO ───────────────────────────────────────────────
function Modal({ cliente, onSave, onClose }) {
  const [form, setForm] = useState(cliente || {
    nome:'', razao_social:'', cnpj:'', contato:'', email:'', telefone:'',
    cidade:'', uf:'', forma_entrega:'ARKMEDS', link_arkmeds:'', observacoes:'', data_corte:''
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const formas = ['ARKMEDS','E-MAIL','FÍSICO','GOOGLE DRIVE','ARKMEDS / E-MAIL','SISTEMA WEB','SITE']

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:12, width:620, maxHeight:'90vh', overflow:'auto', padding:24, boxShadow:'0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:600 }}>{cliente?.id ? 'Editar cliente' : 'Novo cliente'}</h2>
          <button style={{ background:'none', border:'none', cursor:'pointer', color:'#6b7280' }} onClick={onClose}><Icon name="x" size={18}/></button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            ['nome','Nome / Razão curta','text',true,'1/-1'],
            ['razao_social','Razão social completa','text',false,'1/-1'],
            ['cnpj','CNPJ','text'],['contato','Contato','text'],
            ['email','E-mail','email','','1/-1'],
            ['telefone','Telefone','text'],['cidade','Cidade','text'],['uf','UF','text'],
            ['link_arkmeds','Link Arkmeds / Pasta','text',false,'1/-1'],
            ['data_corte','Data de corte (ex: Dia 20)','text'],
          ].map(([k, label, type, req, col]) => (
            <div key={k} style={{ gridColumn: col || 'auto' }}>
              <div style={S.label}>{label}{req && ' *'}</div>
              <input style={S.input} type={type} value={form[k]||''} onChange={e => set(k, e.target.value)} />
            </div>
          ))}

          <div>
            <div style={S.label}>Forma de entrega</div>
            <select style={S.input} value={form.forma_entrega||'ARKMEDS'} onChange={e => set('forma_entrega', e.target.value)}>
              {formas.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div style={{ gridColumn:'1/-1' }}>
            <div style={S.label}>Observações / Regras especiais</div>
            <textarea style={{ ...S.input, minHeight:80, resize:'vertical' }}
              value={form.observacoes||''} onChange={e => set('observacoes', e.target.value)} />
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
          <button style={S.btnSec} onClick={onClose}>Cancelar</button>
          <button style={S.btnPri} onClick={() => onSave(form)}>
            <Icon name="save" size={13} color="#fff"/> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PAINEL DE CONFIGURAÇÃO SUPABASE ─────────────────────────────────────────
function ConfigPanel({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:12, width:540, padding:28, boxShadow:'0 20px 60px rgba(0,0,0,.25)' }}>
        <h2 style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>⚙️ Configuração — Banco de dados</h2>
        <p style={{ color:'#374151', lineHeight:1.7, marginBottom:16, fontSize:13 }}>
          Este sistema usa o <strong>Supabase</strong> como banco de dados na nuvem.
          É gratuito para o volume de uso da Tecnoiso e sincroniza em tempo real entre todos os PCs.
        </p>
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:16, marginBottom:16 }}>
          <p style={{ fontWeight:600, marginBottom:8, fontSize:13 }}>Passos para configurar:</p>
          <ol style={{ paddingLeft:18, lineHeight:2, fontSize:12, color:'#374151' }}>
            <li>Acesse <strong>supabase.com</strong> → Crie uma conta gratuita</li>
            <li>Crie um novo projeto chamado <code>tecnoiso-crm</code></li>
            <li>Vá em <strong>SQL Editor</strong> e cole o conteúdo do arquivo <code>seed.sql</code></li>
            <li>Vá em <strong>Settings → API</strong> e copie a URL e a chave <em>anon/public</em></li>
            <li>Cole os valores no arquivo <code>src/renderer/supabase.js</code></li>
            <li>Reinstale o app em todos os PCs com o mesmo <code>supabase.js</code></li>
          </ol>
        </div>
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginBottom:20, fontSize:12, color:'#1e40af' }}>
          💡 Dica: o arquivo <code>seed.sql</code> já vem com todos os clientes da planilha pré-cadastrados. 
          Basta colar no SQL Editor que eles aparecem automaticamente.
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button style={S.btnPri} onClick={onClose}>Entendi</button>
        </div>
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [clientes, setClientes]     = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [arquivos, setArquivos]     = useState([])
  const [historico, setHistorico]   = useState([])
  const [busca, setBusca]           = useState('')
  const [filtroForma, setFiltroForma] = useState('')
  const [aba, setAba]               = useState('ficha')
  const [modal, setModal]           = useState(null) // null | 'novo' | 'editar'
  const [toast, setToast]           = useState(null)
  const [online, setOnline]         = useState(true)
  const [config, setConfig]         = useState(false)
  const [loading, setLoading]       = useState(true)

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => setToast(null), 3000)
  }

  // ── Carrega clientes ────────────────────────────────────────────────────────
  const carregarClientes = useCallback(async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('nome')
    if (error) { setOnline(false); showToast('Erro ao conectar ao banco', 'error') }
    else { setOnline(true); setClientes(data || []) }
    setLoading(false)
  }, [])

  useEffect(() => { carregarClientes() }, [carregarClientes])
  

  // ── Realtime — sincronização automática ────────────────────────────────────
  useEffect(() => {
    const canal = supabase
      .channel('crm-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => {
        if (payload.eventType === 'INSERT') {
          setClientes(cs => [...cs, payload.new].sort((a,b) => a.nome.localeCompare(b.nome)))
          showToast(`Novo cliente: ${payload.new.nome}`, 'info')
        }
        if (payload.eventType === 'UPDATE') {
          setClientes(cs => cs.map(c => c.id === payload.new.id ? payload.new : c))
          if (selecionado?.id === payload.new.id) setSelecionado(payload.new)
        }
        if (payload.eventType === 'DELETE') {
          setClientes(cs => cs.filter(c => c.id !== payload.old.id))
          if (selecionado?.id === payload.old.id) setSelecionado(null)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arquivos' }, payload => {
        if (selecionado && payload.new?.cliente_id === selecionado.id) {
          carregarArquivos(selecionado.id)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico' }, payload => {
        if (selecionado && payload.new?.cliente_id === selecionado.id) {
          carregarHistorico(selecionado.id)
        }
      })
      .subscribe(status => setOnline(status === 'SUBSCRIBED'))

    return () => supabase.removeChannel(canal)
  }, [selecionado?.id])

  // ── Carrega arquivos e histórico do cliente ─────────────────────────────────
  const carregarArquivos = async (id) => {
    const { data } = await supabase.from('arquivos').select('*').eq('cliente_id', id).order('criado_em', { ascending: false })
    setArquivos(data || [])
  }

  const carregarHistorico = async (id) => {
    const { data } = await supabase.from('historico').select('*').eq('cliente_id', id).order('criado_em', { ascending: false }).limit(20)
    setHistorico(data || [])
  }

  const selecionarCliente = (c) => {
    setSelecionado(c)
    setAba('ficha')
    carregarArquivos(c.id)
    carregarHistorico(c.id)
  }

  // ── CRUD clientes ───────────────────────────────────────────────────────────
  const salvarCliente = async (form) => {
    if (!form.nome) return showToast('Nome é obrigatório', 'error')

    if (form.id) {
      const { error } = await supabase.from('clientes').update({ ...form, atualizado_em: new Date().toISOString() }).eq('id', form.id)
      if (error) return showToast('Erro ao salvar', 'error')
      await supabase.from('historico').insert({ cliente_id: form.id, descricao: 'Cadastro atualizado' })
      showToast('Cliente atualizado')
    } else {
      const { data, error } = await supabase.from('clientes').insert(form).select().single()
      if (error) return showToast('Erro ao criar cliente', 'error')
      await supabase.from('historico').insert({ cliente_id: data.id, descricao: 'Cliente cadastrado' })
      showToast('Cliente criado!')
      setSelecionado(data)
    }
    setModal(null)
  }

  const excluirCliente = async () => {
    if (!selecionado) return
    if (!confirm(`Excluir ${selecionado.nome}? Esta ação não pode ser desfeita.`)) return
    await supabase.from('clientes').delete().eq('id', selecionado.id)
    setSelecionado(null)
    showToast('Cliente excluído')
  }

  // ── Upload de arquivo ───────────────────────────────────────────────────────
  const uploadArquivo = async () => {
    if (!selecionado) return
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '*'
    input.onchange = async (e) => {
      for (const file of e.target.files) {
        const ext = file.name.split('.').pop()
        const path = `${selecionado.id}/${Date.now()}.${ext}`

        // Upload para Supabase Storage
        const { error: upErr } = await supabase.storage.from('arquivos').upload(path, file)
        if (upErr) { showToast(`Erro ao enviar ${file.name}`, 'error'); continue }

        const { data: urlData } = supabase.storage.from('arquivos').getPublicUrl(path)

        await supabase.from('arquivos').insert({
          cliente_id: selecionado.id,
          nome_original: file.name,
          nome_arquivo: path,
          caminho_local: urlData.publicUrl,
          tipo: file.type,
          tamanho: file.size,
        })
        await supabase.from('historico').insert({ cliente_id: selecionado.id, descricao: `Arquivo adicionado: ${file.name}` })
      }
      showToast('Arquivo(s) enviado(s)!')
      carregarArquivos(selecionado.id)
    }
    input.click()
  }

  const excluirArquivo = async (arq) => {
    await supabase.storage.from('arquivos').remove([arq.nome_arquivo])
    await supabase.from('arquivos').delete().eq('id', arq.id)
    await supabase.from('historico').insert({ cliente_id: selecionado.id, descricao: `Arquivo removido: ${arq.nome_original}` })
    carregarArquivos(selecionado.id)
    showToast('Arquivo excluído')
  }

  const abrirArquivo = (arq) => {
    if (arq.caminho_local) window.open(arq.caminho_local, '_blank')
  }

  // ── Filtros ─────────────────────────────────────────────────────────────────
  const formas = [...new Set(clientes.map(c => c.forma_entrega).filter(Boolean))]
  const clientesFiltrados = clientes.filter(c => {
    const q = busca.toLowerCase()
    const matchBusca = !busca || c.nome.toLowerCase().includes(q) || (c.cidade||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q)
    const matchForma = !filtroForma || c.forma_entrega === filtroForma
    return matchBusca && matchForma
  })

  const formaLabel = (f) => {
    if (!f) return 'OUTRO'
    if (f.includes('ARKMEDS')) return 'ARK'
    if (f.includes('E-MAIL') || f.includes('EMAIL')) return 'EMAIL'
    if (f.includes('FÍSICO') || f.includes('FISICO')) return 'FÍSICO'
    if (f.includes('GOOGLE')) return 'DRIVE'
    if (f.includes('SITE') || f.includes('WEB')) return 'SITE'
    return f.slice(0,5)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.app}>
      {/* ── SIDEBAR ── */}
      <div style={S.side}>
        {/* Cabeçalho */}
        <div style={{ padding:'14px 14px 10px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14, color:'#111' }}>Tecnoiso CRM</div>
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:1 }}>{clientesFiltrados.length} de {clientes.length} clientes</div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button title="Sincronizar" style={{ ...S.btnSec, padding:'5px 7px' }} onClick={carregarClientes}>
                <Icon name="refresh" size={12}/>
              </button>
              <button title="Configuração" style={{ ...S.btnSec, padding:'5px 7px' }} onClick={() => setConfig(true)}>
                <Icon name="settings" size={12}/>
              </button>
            </div>
          </div>
          {/* Status online */}
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: online ? '#22c55e' : '#ef4444' }}/>
            <span style={{ fontSize:10, color: online ? '#15803d' : '#dc2626' }}>
              {online ? 'Sincronizado — tempo real' : 'Sem conexão'}
            </span>
          </div>
        </div>

        {/* Busca */}
        <div style={{ padding:'8px 10px 4px' }}>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}>
              <Icon name="search" size={12}/>
            </div>
            <input style={{ ...S.input, paddingLeft:26, fontSize:12 }}
              placeholder="Buscar por nome, cidade..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        {/* Filtro por forma */}
        <div style={{ padding:'2px 10px 6px', display:'flex', gap:4, flexWrap:'wrap' }}>
          {['', ...formas].slice(0,5).map(f => (
            <button key={f||'todos'} onClick={() => setFiltroForma(f)}
              style={{ fontSize:10, padding:'2px 7px', borderRadius:4, border:'1px solid',
                borderColor: filtroForma === f ? '#2563eb' : '#d1d5db',
                background: filtroForma === f ? '#eff6ff' : 'transparent',
                color: filtroForma === f ? '#1d4ed8' : '#6b7280', cursor:'pointer' }}>
              {f ? formaLabel(f) : 'Todos'}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div style={{ flex:1, overflowY:'auto', padding:'4px 6px' }}>
          {loading && <div style={{ padding:20, textAlign:'center', color:'#9ca3af', fontSize:12 }}>Carregando...</div>}
          {!loading && clientesFiltrados.length === 0 && (
            <div style={{ padding:20, textAlign:'center', color:'#9ca3af', fontSize:12 }}>Nenhum cliente encontrado</div>
          )}
          {clientesFiltrados.map(c => (
            <div key={c.id} onClick={() => selecionarCliente(c)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, cursor:'pointer',
                background: selecionado?.id === c.id ? '#eff6ff' : 'transparent',
                border: selecionado?.id === c.id ? '1px solid #bfdbfe' : '1px solid transparent', marginBottom:2 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                background: selecionado?.id === c.id ? '#dbeafe' : '#f3f4f6', fontSize:10, fontWeight:600,
                color: selecionado?.id === c.id ? '#1d4ed8' : '#4b5563' }}>
                {avatar(c.nome)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, color: selecionado?.id === c.id ? '#1d4ed8' : '#111',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.nome}</div>
                {c.cidade && <div style={{ fontSize:10, color:'#9ca3af' }}>{c.cidade}{c.uf ? `, ${c.uf}` : ''}</div>}
              </div>
              <span style={badge(c.forma_entrega)}>{formaLabel(c.forma_entrega)}</span>
            </div>
          ))}
        </div>

        {/* Botão novo */}
        <div style={{ padding:'10px', borderTop:'1px solid #e5e7eb' }}>
          <button style={{ ...S.btnPri, width:'100%', justifyContent:'center' }} onClick={() => setModal('novo')}>
            <Icon name="plus" size={13} color="#fff"/> Novo cliente
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={S.main}>
        {!selecionado ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#9ca3af' }}>
            <Icon name="user" size={40} color="#d1d5db"/>
            <div style={{ fontSize:14 }}>Selecione um cliente para ver os detalhes</div>
            <button style={{ ...S.btnPri, marginTop:4 }} onClick={() => setModal('novo')}>
              <Icon name="plus" size={13} color="#fff"/> Cadastrar primeiro cliente
            </button>
          </div>
        ) : (
          <>
            {/* Topbar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px',
              borderBottom:'1px solid #e5e7eb', background:'#fafafa' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'#dbeafe', display:'flex',
                  alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#1d4ed8' }}>
                  {avatar(selecionado.nome)}
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:600 }}>{selecionado.nome}</div>
                  <div style={{ fontSize:11, color:'#9ca3af', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={badge(selecionado.forma_entrega)}>{selecionado.forma_entrega}</span>
                    {selecionado.cidade && <span><Icon name="pin" size={10}/> {selecionado.cidade}{selecionado.uf ? `, ${selecionado.uf}` : ''}</span>}
                    {selecionado.data_corte && <span>📅 Corte: {selecionado.data_corte}</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={S.btnSec} onClick={() => setModal('editar')}><Icon name="edit" size={12}/> Editar</button>
                <button style={S.btnDan} onClick={excluirCliente}><Icon name="trash" size={12}/> Excluir</button>
              </div>
            </div>

            {/* Abas */}
            <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', background:'#fafafa' }}>
              {[['ficha','Ficha'], ['arquivos','Arquivos'], ['historico','Histórico']].map(([id, label]) => (
                <button key={id} onClick={() => setAba(id)}
                  style={{ padding:'9px 18px', fontSize:12, fontWeight:500, border:'none', background:'transparent', cursor:'pointer',
                    borderBottom: aba === id ? '2px solid #2563eb' : '2px solid transparent',
                    color: aba === id ? '#1d4ed8' : '#6b7280' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Conteúdo */}
            <div style={{ flex:1, overflowY:'auto', padding:20 }}>

              {/* ── ABA FICHA ── */}
              {aba === 'ficha' && (
                <div style={{ display:'flex', gap:16, maxWidth:1100 }}>
                  <div style={{ flex:1 }}>

                    {/* Dados gerais */}
                    <div style={S.card}>
                      <div style={{ ...S.label, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                        <Icon name="user" size={11}/> Informações gerais
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        {[
                          ['nome', 'Nome'],
                          ['razao_social', 'Razão social'],
                          ['cnpj', 'CNPJ'],
                          ['contato', 'Contato'],
                          ['email', 'E-mail'],
                          ['telefone', 'Telefone'],
                          ['cidade', 'Cidade'],
                          ['uf', 'UF'],
                        ].map(([k, l]) => selecionado[k] ? (
                          <div key={k} style={k === 'razao_social' || k === 'email' ? { gridColumn:'1/-1' } : {}}>
                            <div style={S.label}>{l}</div>
                            <div style={{ ...S.val, ...(k === 'email' ? { color:'#1d4ed8' } : {}) }}>
                              {k === 'email' ? <a href={`mailto:${selecionado[k]}`} style={{ color:'#1d4ed8', textDecoration:'none' }}>{selecionado[k]}</a> : selecionado[k]}
                            </div>
                          </div>
                        ) : null)}
                      </div>
                    </div>

                    {/* Observações */}
                    {selecionado.observacoes && (
                      <div style={S.card}>
                        <div style={{ ...S.label, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                          <Icon name="info" size={11}/> Observações e regras especiais
                        </div>
                        <div style={S.obs}>{selecionado.observacoes}</div>
                      </div>
                    )}

                    {/* Arquivos recentes */}
                    <div style={S.card}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <div style={{ ...S.label, display:'flex', alignItems:'center', gap:6, marginBottom:0 }}>
                          <Icon name="folder" size={11}/> Arquivos recentes
                        </div>
                        <button style={{ ...S.btnSec, padding:'4px 10px', fontSize:11 }} onClick={uploadArquivo}>
                          <Icon name="upload" size={11}/> Enviar
                        </button>
                      </div>
                      {arquivos.slice(0,3).map(a => (
                        <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                          border:'1px solid #e5e7eb', borderRadius:7, marginBottom:6, background:'#fafafa' }}>
                          <Icon name="file" size={14} color="#6b7280"/>
                          <span style={{ flex:1, fontSize:12, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome_original}</span>
                          <span style={{ fontSize:10, color:'#9ca3af' }}>{fmtSize(a.tamanho||0)}</span>
                          <button style={{ background:'none', border:'none', cursor:'pointer', color:'#2563eb' }} onClick={() => abrirArquivo(a)}>
                            <Icon name="download" size={13}/>
                          </button>
                        </div>
                      ))}
                      {arquivos.length === 0 && (
                        <div onClick={uploadArquivo} style={{ border:'1px dashed #d1d5db', borderRadius:7, padding:'14px 0', textAlign:'center',
                          color:'#9ca3af', fontSize:12, cursor:'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
                          onMouseLeave={e => e.currentTarget.style.borderColor='#d1d5db'}>
                          <Icon name="upload" size={14}/><br/>Arraste ou clique para enviar
                        </div>
                      )}
                      {arquivos.length > 3 && (
                        <button style={{ ...S.btnSec, width:'100%', justifyContent:'center', marginTop:6 }} onClick={() => setAba('arquivos')}>
                          Ver todos os {arquivos.length} arquivos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Coluna direita */}
                  <div style={{ width:210 }}>
                    <div style={S.card}>
                      <div style={{ ...S.label, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <Icon name="arkmeds" size={11}/> Entrega
                      </div>
                      <div style={S.label}>Forma</div>
                      <span style={{ ...badge(selecionado.forma_entrega), fontSize:11, padding:'2px 10px' }}>{selecionado.forma_entrega}</span>
                      {selecionado.link_arkmeds && (
                        <div style={{ marginTop:10 }}>
                          <div style={S.label}>Link / Pasta</div>
                          <a href={selecionado.link_arkmeds} target="_blank" rel="noreferrer"
                            style={{ fontSize:12, color:'#1d4ed8', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                            <Icon name="folder" size={12}/> Abrir ↗
                          </a>
                        </div>
                      )}
                      {selecionado.data_corte && (
                        <div style={{ marginTop:10 }}>
                          <div style={S.label}>Data de corte</div>
                          <div style={S.val}>{selecionado.data_corte}</div>
                        </div>
                      )}
                    </div>

                    <div style={S.card}>
                      <div style={{ ...S.label, marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                        <Icon name="clock" size={11}/> Histórico recente
                      </div>
                      {historico.slice(0,5).map(h => (
                        <div key={h.id} style={{ display:'flex', gap:8, paddingBottom:8, borderBottom:'1px solid #f3f4f6', marginBottom:8 }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:'#2563eb', marginTop:4, flexShrink:0 }}/>
                          <div>
                            <div style={{ fontSize:11, color:'#374151', lineHeight:1.4 }}>{h.descricao}</div>
                            <div style={{ fontSize:10, color:'#9ca3af' }}>{fmt(h.criado_em)}</div>
                          </div>
                        </div>
                      ))}
                      {historico.length === 0 && <div style={{ fontSize:11, color:'#9ca3af' }}>Sem registros</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ABA ARQUIVOS ── */}
              {aba === 'arquivos' && (
                <div style={{ maxWidth:700 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <h3 style={{ fontSize:14, fontWeight:600 }}>{arquivos.length} arquivo(s)</h3>
                    <button style={S.btnPri} onClick={uploadArquivo}><Icon name="upload" size={13} color="#fff"/> Enviar arquivo</button>
                  </div>
                  {arquivos.length === 0 && (
                    <div onClick={uploadArquivo} style={{ border:'2px dashed #d1d5db', borderRadius:10, padding:40, textAlign:'center',
                      color:'#9ca3af', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='#d1d5db'}>
                      <Icon name="upload" size={28} color="#d1d5db"/><br/>
                      <span style={{ fontSize:13, marginTop:8, display:'block' }}>Clique ou arraste arquivos aqui</span>
                      <span style={{ fontSize:11 }}>PDF, planilhas, fotos e qualquer outro arquivo</span>
                    </div>
                  )}
                  {arquivos.map(a => (
                    <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                      border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8, background:'#fafafa' }}>
                      <Icon name="file" size={18} color="#6b7280"/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome_original}</div>
                        <div style={{ fontSize:10, color:'#9ca3af' }}>{fmtSize(a.tamanho||0)} · {fmt(a.criado_em)}</div>
                      </div>
                      <button style={{ ...S.btnSec, padding:'5px 10px', fontSize:11 }} onClick={() => abrirArquivo(a)}>
                        <Icon name="download" size={11}/> Abrir
                      </button>
                      <button style={{ ...S.btnDan, padding:'5px 8px' }} onClick={() => excluirArquivo(a)}>
                        <Icon name="trash" size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ── ABA HISTÓRICO ── */}
              {aba === 'historico' && (
                <div style={{ maxWidth:600 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Histórico de atividades</h3>
                  {historico.length === 0 && <div style={{ color:'#9ca3af', fontSize:13 }}>Nenhuma atividade registrada</div>}
                  {historico.map((h, i) => (
                    <div key={h.id} style={{ display:'flex', gap:12, paddingBottom:16 }}>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background:'#2563eb', flexShrink:0 }}/>
                        {i < historico.length-1 && <div style={{ width:1, flex:1, background:'#e5e7eb', marginTop:4 }}/>}
                      </div>
                      <div style={{ paddingBottom:8 }}>
                        <div style={{ fontSize:13, color:'#111' }}>{h.descricao}</div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{fmt(h.criado_em)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODAIS ── */}
      {modal === 'novo' && <Modal onSave={salvarCliente} onClose={() => setModal(null)} />}
      {modal === 'editar' && <Modal cliente={selecionado} onSave={salvarCliente} onClose={() => setModal(null)} />}
      {config && <ConfigPanel onClose={() => setConfig(false)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
