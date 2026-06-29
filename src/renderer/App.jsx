import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase.js'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  red:      '#D32F2F',
  redDark:  '#B71C1C',
  redLight: '#FFEBEE',
  bg:       '#F0F2F5',
  white:    '#FFFFFF',
  border:   '#E0E0E0',
  text:     '#1A1A1A',
  sub:      '#616161',
  muted:    '#9E9E9E',
  sidebar:  '#1C1C2E',
}

// ─── Colunas do board (por forma de entrega/certificado) ──────────────────────
const COLUNAS = [
  { id: 'ARKMEDS',       label: 'ARKMEDS',       cor: '#1565C0', bg: '#E3F2FD', ico: 'monitor' },
  { id: 'E-MAIL',        label: 'E-MAIL',         cor: '#2E7D32', bg: '#E8F5E9', ico: 'mail'    },
  { id: 'FÍSICO',        label: 'FÍSICO',          cor: '#E65100', bg: '#FFF3E0', ico: 'package' },
  { id: 'GOOGLE DRIVE',  label: 'GOOGLE DRIVE',   cor: '#6A1B9A', bg: '#F3E5F5', ico: 'drive'   },
  { id: 'OUTROS',        label: 'OUTROS',         cor: '#37474F', bg: '#ECEFF1', ico: 'folder'  },
]

// Tipos de certificado que a Tecnoiso emite
const TIPOS_CERT = [
  'Dimensional',
  'Elétrico',
  'Força',
  'Massa / Balança',
  'Pressão',
  'Temperatura',
  'Torque',
  'Velocidade',
  'Outros',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const av   = (n = '') => (n.trim().slice(0, 2) || '??').toUpperCase()
const fmt  = (ts) => ts ? new Date(ts).toLocaleDateString('pt-BR') : '—'
const fmtSz= (b = 0) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`

function colDeCliente(c) {
  const f = (c.forma_entrega || '').toUpperCase()
  if (COLUNAS.find(cl => cl.id === f)) return f
  return 'OUTROS'
}

function tipoArquivo(nome = '', tipo = '') {
  const ext = nome.split('.').pop().toLowerCase()
  if (ext === 'pdf' || tipo === 'application/pdf') return 'pdf'
  if (['jpg','jpeg','png','gif','webp','bmp','svg'].includes(ext) || tipo.startsWith('image/')) return 'image'
  if (['xlsx','xls','xlsm','xlsb'].includes(ext)) return 'xlsx'
  if (ext === 'csv') return 'csv'
  return 'externo'
}

// Gera cor de avatar a partir do nome
const AV_CORES = ['#E53935','#8E24AA','#1E88E5','#00897B','#E65100','#43A047','#5E35B1','#00ACC1']
const avCor = (nome = '') => AV_CORES[nome.charCodeAt(0) % AV_CORES.length] || AV_CORES[0]

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
function Ic({ n, s = 14, c = 'currentColor' }) {
  const paths = {
    search:   <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    plus:     <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    x:        <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:    <polyline points="20 6 9 17 4 12"/>,
    edit:     <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash:    <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
    save:     <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    refresh:  <><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.36"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></>,
    file:     <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
    upload:   <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
    eye:      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
    mail:     <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    phone:    <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.67 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
    pin:      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    clock:    <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    info:     <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    folder:   <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
    monitor:  <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
    package:  <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    drive:    <><path d="M12 2L2 19h20L12 2z"/><path d="M2 19l10-7 10 7"/></>,
    user:     <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    award:    <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>,
    list:     <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
    grid:     <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    wifi:     <><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    wifiOff:  <><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    filter:   <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    cnpj:     <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {paths[n] || null}
    </svg>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Av({ nome, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: avCor(nome), display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: '#fff',
    }}>
      {av(nome)}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let _tt
function Toast({ msg, type = 'ok' }) {
  if (!msg) return null
  const bg  = { ok: '#1B5E20', error: '#B71C1C', info: '#0D47A1' }[type]
  const ico = { ok: 'check',   error: 'x',       info: 'info'    }[type]
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:bg, color:'#fff',
      padding:'11px 18px', borderRadius:10, fontSize:12, fontWeight:600,
      display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 28px rgba(0,0,0,.22)', zIndex:9999 }}>
      <Ic n={ico} s={13} c="#fff"/> {msg}
    </div>
  )
}

// ─── Visualizador de Arquivo Inline ──────────────────────────────────────────
function FileViewer({ arq, onClose }) {
  const tipo = tipoArquivo(arq.nome_original, arq.tipo || '')
  const url  = arq.caminho_local
  const [xlsxData, setXlsxData]     = useState(null)  // { sheets:[{name,rows}], active:0 }
  const [xlsxLoading, setXlsxLoading] = useState(false)
  const [xlsxErr, setXlsxErr]       = useState(null)
  const [activeSheet, setActiveSheet] = useState(0)

  // Carregar XLSX/CSV via SheetJS quando for planilha
  useEffect(() => {
    if (tipo !== 'xlsx' && tipo !== 'csv') return
    setXlsxLoading(true)
    setXlsxErr(null)

    import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js')
      .then(() => {
        const XLSX = window.XLSX
        fetch(url)
          .then(r => r.arrayBuffer())
          .then(buf => {
            const wb = XLSX.read(buf, { type: 'array', cellDates: true })
            const sheets = wb.SheetNames.map(name => {
              const ws = wb.Sheets[name]
              const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
              return { name, rows }
            })
            setXlsxData({ sheets })
            setActiveSheet(0)
            setXlsxLoading(false)
          })
          .catch(e => { setXlsxErr('Erro ao baixar o arquivo.'); setXlsxLoading(false) })
      })
      .catch(() => { setXlsxErr('Erro ao carregar o leitor de planilhas.'); setXlsxLoading(false) })
  }, [url, tipo])

  const sheetAtual = xlsxData?.sheets?.[activeSheet]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.78)', zIndex:1100,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      {/* Barra superior */}
      <div style={{ width:'min(96vw,1100px)', background:'#1C1C2E', padding:'10px 16px',
        borderRadius:'12px 12px 0 0', display:'flex', alignItems:'center', gap:12,
        borderBottom:'1px solid #333' }}>
        <Ic n="file" s={15} c="#aaa"/>
        <span style={{ color:'#fff', fontSize:13, fontWeight:600, flex:1,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {arq.nome_original}
        </span>
        <span style={{ color:'#9ca3af', fontSize:11 }}>{fmtSz(arq.tamanho)}</span>
        <a href={url} download={arq.nome_original}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
            background:'#1565C0', color:'#fff', borderRadius:7, fontSize:11,
            fontWeight:600, textDecoration:'none' }}>
          <Ic n="external" s={11} c="#fff"/> Download
        </a>
        <button onClick={onClose}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px',
            background:'#37474F', color:'#fff', border:'none', borderRadius:7,
            fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
          <Ic n="x" s={11} c="#fff"/> Fechar
        </button>
      </div>

      {/* Abas de planilha */}
      {xlsxData && xlsxData.sheets.length > 1 && (
        <div style={{ width:'min(96vw,1100px)', background:'#23233a', display:'flex',
          gap:2, padding:'6px 12px 0', borderBottom:'1px solid #333', overflowX:'auto' }}>
          {xlsxData.sheets.map((s, i) => (
            <button key={i} onClick={() => setActiveSheet(i)}
              style={{ padding:'5px 14px', fontSize:11, fontWeight:600, border:'none',
                borderRadius:'6px 6px 0 0', cursor:'pointer', fontFamily:'inherit',
                background: i === activeSheet ? '#fff' : 'transparent',
                color: i === activeSheet ? '#111' : '#9ca3af', whiteSpace:'nowrap' }}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo */}
      <div style={{ width:'min(96vw,1100px)', background:'#fff',
        borderRadius: xlsxData ? '0 0 12px 12px' : '0 0 12px 12px',
        overflow:'hidden', display:'flex', flexDirection:'column',
        maxHeight:'82vh', minHeight:400 }}>

        {/* PDF */}
        {tipo === 'pdf' && (
          <iframe src={url} title={arq.nome_original}
            style={{ width:'100%', height:'82vh', border:'none' }} />
        )}

        {/* Imagem */}
        {tipo === 'image' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
            background:'#111', height:'82vh' }}>
            <img src={url} alt={arq.nome_original}
              style={{ maxWidth:'100%', maxHeight:'82vh', objectFit:'contain' }} />
          </div>
        )}

        {/* XLSX / CSV */}
        {(tipo === 'xlsx' || tipo === 'csv') && (
          <div style={{ flex:1, overflow:'auto', background:'#fff' }}>
            {xlsxLoading && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                padding:60, color:'#6b7280', gap:10 }}>
                <Ic n="refresh" s={18} c="#9ca3af"/> Carregando planilha...
              </div>
            )}
            {xlsxErr && (
              <div style={{ padding:40, textAlign:'center', color:'#DC2626' }}>
                <Ic n="x" s={28} c="#DC2626"/>
                <div style={{ marginTop:10 }}>{xlsxErr}</div>
              </div>
            )}
            {sheetAtual && (
              <table style={{ borderCollapse:'collapse', fontSize:12, minWidth:'100%', tableLayout:'auto' }}>
                <tbody>
                  {sheetAtual.rows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri === 0 ? '#F8F9FA' : ri % 2 === 0 ? '#FAFAFA' : '#fff' }}>
                      {/* Número da linha */}
                      <td style={{ padding:'4px 8px', borderRight:'1px solid #E5E7EB',
                        borderBottom:'1px solid #E5E7EB', color:'#9ca3af', fontSize:10,
                        fontWeight:600, textAlign:'right', userSelect:'none',
                        background: ri === 0 ? '#F0F0F0' : '#F8F8F8', minWidth:36 }}>
                        {ri === 0 ? '#' : ri}
                      </td>
                      {Array.isArray(row) && row.map((cell, ci) => (
                        ri === 0
                          ? <th key={ci} style={{ padding:'6px 12px', border:'1px solid #D1D5DB',
                              background:'#F3F4F6', fontWeight:700, color:'#374151',
                              whiteSpace:'nowrap', textAlign:'left', position:'sticky', top:0, zIndex:1 }}>
                              {cell !== '' ? cell : <span style={{ color:'#D1D5DB' }}>—</span>}
                            </th>
                          : <td key={ci} style={{ padding:'5px 12px', border:'1px solid #E5E7EB',
                              whiteSpace:'nowrap', color: cell === '' ? '#D1D5DB' : '#212121' }}>
                              {cell instanceof Date
                                ? cell.toLocaleDateString('pt-BR')
                                : cell !== '' ? String(cell) : '—'}
                            </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Outros formatos */}
        {tipo === 'externo' && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
            background:'#111', height:'82vh' }}>
            <div style={{ textAlign:'center', color:'#6b7280', padding:48 }}>
              <Ic n="file" s={48} c="#4b5563"/>
              <div style={{ marginTop:14, fontSize:14, color:'#9ca3af' }}>
                Este formato não pode ser visualizado aqui.
              </div>
              <a href={url} download={arq.nome_original}
                style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:16,
                  padding:'8px 20px', background:'#1565C0', color:'#fff', borderRadius:8,
                  fontSize:13, fontWeight:600, textDecoration:'none' }}>
                <Ic n="external" s={13} c="#fff"/> Baixar arquivo
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal Cadastro / Edição ──────────────────────────────────────────────────
function ModalCliente({ cliente, onSave, onClose }) {
  const [form, setForm] = useState(cliente || {
    nome: '', forma_entrega: 'ARKMEDS', link_arkmeds: '', observacoes: '',
  })
  const [arquivosPendentes, setArquivosPendentes] = useState([])
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const formas  = ['ARKMEDS', 'E-MAIL', 'FÍSICO', 'GOOGLE DRIVE', 'ARKMEDS / E-MAIL', 'SITE']

  const inp = (extra = {}) => ({
    width: '100%', border: '1px solid #E0E0E0', borderRadius: 7,
    padding: '8px 11px', fontSize: 13, outline: 'none', background: '#FAFAFA',
    color: '#1A1A1A', fontFamily: 'inherit', ...extra,
  })
  const lbl = { fontSize: 11, fontWeight: 700, color: '#757575',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' }

  const selecionarArquivos = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.multiple = true; input.accept = '*'
    input.onchange = e => {
      const novos = Array.from(e.target.files)
      setArquivosPendentes(prev => [...prev, ...novos])
    }
    input.click()
  }

  const removerPendente = (idx) =>
    setArquivosPendentes(prev => prev.filter((_, i) => i !== idx))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:800,
      display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:640, maxHeight:'92vh',
        overflow:'auto', padding:'26px 28px', boxShadow:'0 24px 64px rgba(0,0,0,.22)' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#111', margin:0 }}>
              {cliente?.id ? 'Editar cliente' : 'Novo cliente'}
            </h2>
            <p style={{ fontSize:12, color:'#9ca3af', margin:'3px 0 0' }}>
              Informações cadastrais e operacionais
            </p>
          </div>
          <button style={{ background:'none', border:'none', cursor:'pointer', padding:4 }} onClick={onClose}>
            <Ic n="x" s={20} c="#9ca3af"/>
          </button>
        </div>

        {/* Seção: Identificação */}
        <div style={{ fontSize:11, fontWeight:700, color:T.red, textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${T.redLight}` }}>
          Identificação
        </div>
        <div style={{ marginBottom:18 }}>
          <div>
            <label style={lbl}>Empresa *</label>
            <input style={inp()} value={form.nome} onChange={e => set('nome', e.target.value)}
              onFocus={e => e.target.style.borderColor = T.red}
              onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
          </div>
        </div>

        {/* Seção: Certificação */}
        <div style={{ fontSize:11, fontWeight:700, color:T.red, textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${T.redLight}` }}>
          Certificação
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:18 }}>
          <div>
            <label style={lbl}>Forma de entrega do certificado</label>
            <select style={inp()} value={form.forma_entrega||'ARKMEDS'} onChange={e => set('forma_entrega', e.target.value)}>
              {formas.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Link Arkmeds / Pasta</label>
            <input style={inp()} value={form.link_arkmeds||''} onChange={e => set('link_arkmeds', e.target.value)}
              onFocus={e => e.target.style.borderColor = T.red}
              onBlur={e => e.target.style.borderColor = '#E0E0E0'} />
          </div>
        </div>

        {/* Observações */}
        <div style={{ fontSize:11, fontWeight:700, color:T.red, textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${T.redLight}` }}>
          Observações e regras especiais
        </div>
        <textarea
          style={{ ...inp(), minHeight:80, resize:'vertical' }}
          placeholder="Regras de emissão, atenções especiais, periodicidade..."
          value={form.observacoes||''} onChange={e => set('observacoes', e.target.value)}
          onFocus={e => e.target.style.borderColor = T.red}
          onBlur={e => e.target.style.borderColor = '#E0E0E0'}
        />

        {/* Arquivos — só no cadastro novo */}
        {!cliente?.id && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:T.red, textTransform:'uppercase',
              letterSpacing:'0.08em', marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${T.redLight}`,
              marginTop:18 }}>
              Arquivos
            </div>

            {/* Zona de drop / botão */}
            <div onClick={selecionarArquivos}
              style={{ border:'1.5px dashed #D1D5DB', borderRadius:9, padding:'16px 14px',
                textAlign:'center', cursor:'pointer', marginBottom: arquivosPendentes.length ? 10 : 18,
                transition:'border .12s', background:'#FAFAFA' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
              <Ic n="upload" s={18} c="#9ca3af"/>
              <div style={{ fontSize:12, color:'#9ca3af', marginTop:5 }}>
                Clique para adicionar arquivos
              </div>
              <div style={{ fontSize:10, color:'#bbb', marginTop:2 }}>PDF, planilhas, imagens e mais</div>
            </div>

            {/* Lista de arquivos pendentes */}
            {arquivosPendentes.length > 0 && (
              <div style={{ marginBottom:18, display:'flex', flexDirection:'column', gap:5 }}>
                {arquivosPendentes.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                    background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:7 }}>
                    <Ic n="file" s={13} c="#9ca3af"/>
                    <span style={{ flex:1, fontSize:12, overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#374151' }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize:10, color:'#9ca3af', flexShrink:0 }}>
                      {fmtSz(f.size)}
                    </span>
                    <button onClick={() => removerPendente(i)}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:2,
                        display:'flex', alignItems:'center', color:'#DC2626' }}>
                      <Ic n="x" s={12} c="#DC2626"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Rodapé */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:22,
          paddingTop:18, borderTop:'1px solid #F0F0F0' }}>
          <button style={{ padding:'8px 16px', background:'transparent', color:'#616161',
            border:'1px solid #E0E0E0', borderRadius:8, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
            onClick={onClose}>
            Cancelar
          </button>
          <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 22px',
            background:T.red, color:'#fff', border:'none', borderRadius:8,
            fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            onClick={() => onSave(form, arquivosPendentes)}>
            <Ic n="save" s={13} c="#fff"/> Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Painel Config ────────────────────────────────────────────────────────────
function ConfigPanel({ onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:900,
      display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:14, width:520, padding:'26px 28px',
        boxShadow:'0 24px 60px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h2 style={{ fontSize:16, fontWeight:700 }}>⚙️ Configuração — Banco de dados</h2>
          <button style={{ background:'none', border:'none', cursor:'pointer' }} onClick={onClose}>
            <Ic n="x" s={18} c="#9ca3af"/>
          </button>
        </div>
        <p style={{ color:'#374151', lineHeight:1.7, marginBottom:14, fontSize:13 }}>
          Este sistema usa o <strong>Supabase</strong> como banco de dados na nuvem — gratuito
          e sincronizado em tempo real entre todos os computadores da Tecnoiso.
        </p>
        <div style={{ background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:16, marginBottom:14 }}>
          <p style={{ fontWeight:700, marginBottom:8, fontSize:12, color:'#374151' }}>Passos para configurar:</p>
          <ol style={{ paddingLeft:18, lineHeight:2.1, fontSize:12, color:'#374151' }}>
            <li>Acesse <strong>supabase.com</strong> → crie uma conta gratuita</li>
            <li>Crie um projeto chamado <code>tecnoiso-crm</code></li>
            <li>Vá em <strong>SQL Editor</strong> e cole o arquivo <code>seed.sql</code></li>
            <li>Em <strong>Settings → API</strong>, copie a URL e a chave <em>anon/public</em></li>
            <li>Cole-as em <code>src/renderer/supabase.js</code></li>
          </ol>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button style={{ padding:'8px 22px', background:T.red, color:'#fff', border:'none',
            borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}
            onClick={onClose}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer de detalhe do cliente ─────────────────────────────────────────────
function Drawer({ c, arquivos, historico, onClose, onEdit, onDelete, onUpload, onAbrirArq, onExcluirArq }) {
  const [aba, setAba] = useState('ficha')

  const col = COLUNAS.find(cl => cl.id === colDeCliente(c)) || COLUNAS[4]

  const secTit = (label) => (
    <div style={{ fontSize:10, fontWeight:800, color:T.sub, textTransform:'uppercase',
      letterSpacing:'0.1em', marginBottom:10, marginTop:16, paddingBottom:6,
      borderBottom:'1px solid #F0F0F0', display:'flex', alignItems:'center', gap:6 }}>
      {label}
    </div>
  )
  const campo = (label, valor, link) => valor ? (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:10, fontWeight:700, color:'#9ca3af', textTransform:'uppercase',
        letterSpacing:'0.07em', marginBottom:2 }}>{label}</div>
      {link
        ? <a href={link} target="_blank" rel="noreferrer"
            style={{ fontSize:13, color:'#1565C0', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            <Ic n="external" s={11} c="#1565C0"/> {valor}
          </a>
        : <div style={{ fontSize:13, color:'#212121', lineHeight:1.4 }}>{valor}</div>
      }
    </div>
  ) : null

  const statusCor = { Ativo: '#2E7D32', Inativo: '#C62828', Pendente: '#E65100' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:700, display:'flex' }}>
      <div style={{ flex:1, background:'rgba(0,0,0,.28)' }} onClick={onClose}/>

      <div style={{ width:580, height:'100%', background:'#F7F8FA', display:'flex',
        flexDirection:'column', boxShadow:'-6px 0 36px rgba(0,0,0,.14)', overflow:'hidden' }}>

        {/* ── Header ── */}
        <div style={{ background:'#fff', padding:'18px 20px 14px', borderBottom:'1px solid #EBEBEB' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Av nome={c.nome} size={46}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#111',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {c.nome}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
                {/* Badge forma entrega */}
                <span style={{ background:col.bg, color:col.cor, fontSize:10, fontWeight:700,
                  padding:'2px 9px', borderRadius:5, border:`1px solid ${col.cor}22` }}>
                  {col.label}
                </span>
              </div>
            </div>
            {/* Ações */}
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              <button onClick={onEdit}
                style={{ padding:'6px 12px', background:'transparent', border:'1px solid #E0E0E0',
                  borderRadius:7, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit' }}>
                <Ic n="edit" s={12}/> Editar
              </button>
              <button onClick={onDelete}
                style={{ padding:'6px 8px', background:'transparent', border:'1px solid #FECACA',
                  color:'#DC2626', borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center' }}>
                <Ic n="trash" s={13}/>
              </button>
              <button onClick={onClose}
                style={{ padding:'6px 8px', background:'transparent', border:'1px solid #E0E0E0',
                  borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center' }}>
                <Ic n="x" s={14} c="#666"/>
              </button>
            </div>
          </div>
        </div>

        {/* ── Abas ── */}
        <div style={{ background:'#fff', display:'flex', borderBottom:'1px solid #E5E7EB', flexShrink:0 }}>
          {[
            ['ficha',    '📋 Ficha'],
            ['arquivos', `📁 Arquivos${arquivos.length ? ` (${arquivos.length})` : ''}`],
            ['historico','🕐 Histórico'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setAba(id)}
              style={{ padding:'10px 16px', fontSize:12, fontWeight:600, border:'none',
                background:'transparent', cursor:'pointer', fontFamily:'inherit',
                color: aba===id ? T.red : '#6B7280',
                borderBottom: aba===id ? `2px solid ${T.red}` : '2px solid transparent' }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Conteúdo ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px 24px' }}>

          {/* ──── ABA FICHA ──── */}
          {aba === 'ficha' && (
            <>
              {/* Bloco certificação — destaque */}
              <div style={{ background:'#fff', border:`1.5px solid ${col.cor}33`,
                borderLeft:`4px solid ${col.cor}`, borderRadius:10, padding:'14px 16px', marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:800, color:col.cor, textTransform:'uppercase',
                  letterSpacing:'0.1em', marginBottom:10 }}>
                  Certificação
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {campo('Forma de entrega', c.forma_entrega)}
                  {c.link_arkmeds && campo('Link / Pasta', 'Abrir pasta ↗', c.link_arkmeds)}
                </div>
              </div>

              {/* Observações — destaque amarelo */}
              {c.observacoes && (
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A',
                  borderLeft:'4px solid #F59E0B', borderRadius:10, padding:'12px 14px', marginBottom:12 }}>
                  <div style={{ fontSize:10, fontWeight:800, color:'#92400E',
                    textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>
                    📌 Observações e regras especiais
                  </div>
                  <div style={{ fontSize:13, color:'#78350F', lineHeight:1.65 }}>{c.observacoes}</div>
                </div>
              )}

              {/* Últimos arquivos */}
              <div style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:10, fontWeight:800, color:T.sub, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                    Arquivos recentes
                  </div>
                  <button onClick={onUpload}
                    style={{ fontSize:11, padding:'4px 10px', background:T.red, color:'#fff',
                      border:'none', borderRadius:6, cursor:'pointer',
                      display:'flex', alignItems:'center', gap:4, fontFamily:'inherit' }}>
                    <Ic n="upload" s={10} c="#fff"/> Enviar
                  </button>
                </div>
                {arquivos.length === 0 && (
                  <div onClick={onUpload} style={{ border:'1px dashed #D1D5DB', borderRadius:8,
                    padding:'14px 0', textAlign:'center', color:'#9ca3af', fontSize:12, cursor:'pointer' }}>
                    <Ic n="upload" s={14} c="#D1D5DB"/><br/>Enviar arquivo
                  </div>
                )}
                {arquivos.slice(0, 3).map(a => (
                  <div key={a.id} onClick={() => onAbrirArq(a)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                      border:'1px solid #EBEBEB', borderRadius:7, marginBottom:5,
                      background:'#FAFAFA', cursor:'pointer', transition:'border .12s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#EBEBEB'}>
                    <Ic n="file" s={14} c="#9ca3af"/>
                    <span style={{ flex:1, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome_original}</span>
                    <span style={{ fontSize:10, color:'#9ca3af' }}>{fmtSz(a.tamanho)}</span>
                    <Ic n="eye" s={12} c="#bbb"/>
                  </div>
                ))}
                {arquivos.length > 3 && (
                  <button onClick={() => setAba('arquivos')}
                    style={{ width:'100%', marginTop:6, padding:'6px 0', background:'transparent',
                      border:'1px solid #E0E0E0', borderRadius:6, fontSize:11, color:'#6B7280',
                      cursor:'pointer', fontFamily:'inherit' }}>
                    Ver todos ({arquivos.length})
                  </button>
                )}
              </div>
            </>
          )}

          {/* ──── ABA ARQUIVOS ──── */}
          {aba === 'arquivos' && (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#111' }}>
                  {arquivos.length} arquivo(s)
                </h3>
                <button onClick={onUpload}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px',
                    background:T.red, color:'#fff', border:'none', borderRadius:8,
                    fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <Ic n="upload" s={12} c="#fff"/> Enviar arquivo
                </button>
              </div>

              {arquivos.length === 0 && (
                <div onClick={onUpload} style={{ border:'2px dashed #D1D5DB', borderRadius:12,
                  padding:48, textAlign:'center', color:'#9ca3af', cursor:'pointer', transition:'border .12s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
                  <Ic n="upload" s={32} c="#D1D5DB"/>
                  <div style={{ fontSize:13, marginTop:12 }}>Clique para enviar arquivos</div>
                  <div style={{ fontSize:11, marginTop:4 }}>PDF, planilhas, imagens e mais</div>
                </div>
              )}

              {arquivos.map(a => (
                <div key={a.id} onClick={() => onAbrirArq(a)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    border:'1px solid #E5E7EB', borderRadius:9, marginBottom:7, background:'#fff',
                    transition:'border .12s', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}>
                  <Ic n="file" s={18} c="#9ca3af"/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome_original}</div>
                    <div style={{ fontSize:10, color:'#9ca3af' }}>{fmtSz(a.tamanho)} · {fmt(a.criado_em)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onExcluirArq(a) }}
                    style={{ padding:'5px 8px', background:'transparent', border:'1px solid #FECACA',
                      color:'#DC2626', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', flexShrink:0 }}>
                    <Ic n="trash" s={12}/>
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ──── ABA HISTÓRICO ──── */}
          {aba === 'historico' && (
            <>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:16 }}>Histórico de atividades</h3>
              {historico.length === 0 && (
                <div style={{ color:'#9ca3af', fontSize:13, textAlign:'center', padding:28 }}>
                  Nenhuma atividade registrada
                </div>
              )}
              {historico.map((h, i) => (
                <div key={h.id} style={{ display:'flex', gap:12, paddingBottom:14 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', background:T.red, flexShrink:0, marginTop:2 }}/>
                    {i < historico.length - 1 && (
                      <div style={{ width:1, flex:1, background:'#E5E7EB', marginTop:4 }}/>
                    )}
                  </div>
                  <div style={{ paddingBottom:6 }}>
                    <div style={{ fontSize:13, color:'#212121' }}>{h.descricao}</div>
                    <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>{fmt(h.criado_em)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Card do Kanban ───────────────────────────────────────────────────────────
function KCard({ c, col, onClick }) {
  const [hov, setHov] = useState(false)

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:'#fff', border:`1px solid ${hov ? col.cor : '#E5E7EB'}`,
        borderRadius:10, padding:'11px 13px', marginBottom:8, cursor:'pointer',
        boxShadow: hov ? `0 4px 14px ${col.cor}22` : '0 1px 3px rgba(0,0,0,.06)',
        transition:'all .14s' }}>

      {/* Linha 1 — nome */}
      <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0, marginBottom:6 }}>
        <Av nome={c.nome} size={24}/>
        <span style={{ fontSize:12, fontWeight:700, color:'#111',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {c.nome}
        </span>
      </div>

      {/* Observações — truncadas */}
      {c.observacoes && (
        <div style={{ fontSize:11, color:'#757575', lineHeight:1.4,
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2,
          WebkitBoxOrient:'vertical' }}>
          {c.observacoes}
        </div>
      )}
    </div>
  )
}

// ─── Coluna Kanban ────────────────────────────────────────────────────────────
function KCol({ col, clientes, onCardClick }) {
  return (
    <div style={{ minWidth:230, width:230, display:'flex', flexDirection:'column',
      flexShrink:0, height:'100%', maxHeight:'100%' }}>
      {/* Header */}
      <div style={{ background:'#fff', borderRadius:'10px 10px 0 0', padding:'11px 14px 9px',
        borderBottom:`3px solid ${col.cor}`, boxShadow:'0 1px 4px rgba(0,0,0,.06)', flexShrink:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:col.bg,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Ic n={col.ico} s={14} c={col.cor}/>
            </div>
            <span style={{ fontSize:12, fontWeight:800, color:'#212121' }}>{col.label}</span>
          </div>
          <span style={{ background:col.cor, color:'#fff', fontSize:10, fontWeight:800,
            padding:'2px 8px', borderRadius:12 }}>
            {clientes.length}
          </span>
        </div>
      </div>

      {/* Cards — scroll vertical aqui */}
      <div style={{ flex:1, minHeight:0, overflowY:'auto', overflowX:'hidden',
        padding:'8px 6px', background:'rgba(0,0,0,.018)',
        borderRadius:'0 0 10px 10px' }}>
        {clientes.length === 0 && (
          <div style={{ textAlign:'center', color:'#D1D5DB', fontSize:11, padding:'20px 0' }}>
            Nenhum cliente
          </div>
        )}
        {clientes.map(c => (
          <KCard key={c.id} c={c} col={col} onClick={() => onCardClick(c)}/>
        ))}
      </div>
    </div>
  )
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [clientes, setClientes]         = useState([])
  const [selecionado, setSelecionado]   = useState(null)
  const [arquivos, setArquivos]         = useState([])
  const [todosArquivos, setTodosArquivos] = useState([])
  const [historico, setHistorico]       = useState([])
  const [busca, setBusca]               = useState('')
  const [buscaArq, setBuscaArq]         = useState('')
  const [modal, setModal]               = useState(null)
  const [toast, setToast]               = useState(null)
  const [online, setOnline]             = useState(true)
  const [config, setConfig]             = useState(false)
  const [loading, setLoading]           = useState(true)
  const [fileViewer, setFileViewer]     = useState(null)
  const [view, setView]                 = useState('board') // 'board' | 'clientes' | 'arquivos' | 'relatorio'

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    clearTimeout(_tt)
    _tt = setTimeout(() => setToast(null), 3200)
  }

  // ── Carregar ───────────────────────────────────────────────────────────────
  const carregarClientes = useCallback(async () => {
    const { data, error } = await supabase.from('clientes').select('*').order('nome')
    if (error) { setOnline(false); showToast('Erro ao conectar ao banco', 'error') }
    else { setOnline(true); setClientes(data || []) }
    setLoading(false)
  }, [])

  const carregarTodosArquivos = useCallback(async () => {
    const { data } = await supabase
      .from('arquivos')
      .select('*, clientes(nome)')
      .order('criado_em', { ascending: false })
    setTodosArquivos(data || [])
  }, [])

  useEffect(() => { carregarClientes(); carregarTodosArquivos() }, [carregarClientes, carregarTodosArquivos])

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const canal = supabase.channel('crm-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, payload => {
        if (payload.eventType === 'INSERT')
          setClientes(cs => [...cs, payload.new].sort((a, b) => a.nome.localeCompare(b.nome)))
        if (payload.eventType === 'UPDATE') {
          setClientes(cs => cs.map(c => c.id === payload.new.id ? payload.new : c))
          if (selecionado?.id === payload.new.id) setSelecionado(payload.new)
        }
        if (payload.eventType === 'DELETE') {
          setClientes(cs => cs.filter(c => c.id !== payload.old.id))
          if (selecionado?.id === payload.old.id) setSelecionado(null)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arquivos' }, () => {
        if (selecionado) carregarArquivos(selecionado.id)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historico' }, () => {
        if (selecionado) carregarHistorico(selecionado.id)
      })
      .subscribe(s => setOnline(s === 'SUBSCRIBED'))
    return () => supabase.removeChannel(canal)
  }, [selecionado?.id])

  const carregarArquivos = async (id) => {
    const { data } = await supabase.from('arquivos').select('*').eq('cliente_id', id)
      .order('criado_em', { ascending: false })
    setArquivos(data || [])
  }

  const carregarHistorico = async (id) => {
    const { data } = await supabase.from('historico').select('*').eq('cliente_id', id)
      .order('criado_em', { ascending: false }).limit(30)
    setHistorico(data || [])
  }

  const selecionarCliente = (c) => {
    setSelecionado(c)
    carregarArquivos(c.id)
    carregarHistorico(c.id)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const salvarCliente = async (form, arquivosPendentes = []) => {
    if (!form.nome?.trim()) return showToast('Nome é obrigatório', 'error')

    if (form.id) {
      const { error } = await supabase.from('clientes')
        .update({ ...form, atualizado_em: new Date().toISOString() }).eq('id', form.id)
      if (error) return showToast('Erro ao salvar', 'error')
      await supabase.from('historico').insert({ cliente_id: form.id, descricao: 'Cadastro atualizado' })
      setSelecionado(prev => prev?.id === form.id ? { ...prev, ...form } : prev)
      showToast('Cliente atualizado')
    } else {
      const { data, error } = await supabase.from('clientes').insert(form).select().single()
      if (error) return showToast('Erro ao criar cliente', 'error')
      await supabase.from('historico').insert({ cliente_id: data.id, descricao: 'Cliente cadastrado' })

      // Upload dos arquivos pendentes do modal
      for (const file of arquivosPendentes) {
        const ext = file.name.split('.').pop()
        const path = `${data.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('arquivos').upload(path, file)
        if (upErr) { showToast(`Erro ao enviar ${file.name}`, 'error'); continue }
        const { data: urlData } = supabase.storage.from('arquivos').getPublicUrl(path)
        await supabase.from('arquivos').insert({
          cliente_id: data.id, nome_original: file.name, nome_arquivo: path,
          caminho_local: urlData.publicUrl, tipo: file.type, tamanho: file.size,
        })
        await supabase.from('historico').insert({
          cliente_id: data.id, descricao: `Arquivo adicionado: ${file.name}`
        })
      }

      showToast(arquivosPendentes.length
        ? `Cliente criado com ${arquivosPendentes.length} arquivo(s)!`
        : 'Cliente criado!')
      selecionarCliente(data)
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

  // ── Arquivos ───────────────────────────────────────────────────────────────
  const uploadArquivo = async () => {
    if (!selecionado) return
    const input = document.createElement('input')
    input.type = 'file'; input.multiple = true; input.accept = '*'
    input.onchange = async (e) => {
      for (const file of e.target.files) {
        const ext = file.name.split('.').pop()
        const path = `${selecionado.id}/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('arquivos').upload(path, file)
        if (error) { showToast(`Erro ao enviar ${file.name}`, 'error'); continue }
        const { data: urlData } = supabase.storage.from('arquivos').getPublicUrl(path)
        await supabase.from('arquivos').insert({
          cliente_id: selecionado.id, nome_original: file.name, nome_arquivo: path,
          caminho_local: urlData.publicUrl, tipo: file.type, tamanho: file.size,
        })
        await supabase.from('historico').insert({
          cliente_id: selecionado.id, descricao: `Arquivo adicionado: ${file.name}`
        })
      }
      showToast('Arquivo(s) enviado(s)!')
      carregarArquivos(selecionado.id)
    }
    input.click()
  }

  const excluirArquivo = async (arq) => {
    await supabase.storage.from('arquivos').remove([arq.nome_arquivo])
    await supabase.from('arquivos').delete().eq('id', arq.id)
    await supabase.from('historico').insert({
      cliente_id: selecionado?.id || arq.cliente_id, descricao: `Arquivo removido: ${arq.nome_original}`
    })
    if (selecionado) carregarArquivos(selecionado.id)
    carregarTodosArquivos()
    showToast('Arquivo excluído')
  }

  const abrirArquivo = (arq) => {
    const tipo = tipoArquivo(arq.nome_original, arq.tipo || '')
    if (tipo === 'pdf' || tipo === 'image' || tipo === 'xlsx' || tipo === 'csv') setFileViewer(arq)
    else if (arq.caminho_local) window.open(arq.caminho_local, '_blank')
  }

  // ── Filtros ────────────────────────────────────────────────────────────────
  const clientesFiltrados = clientes.filter(c => {
    const q = busca.toLowerCase()
    return !busca ||
      c.nome?.toLowerCase().includes(q) ||
      c.razao_social?.toLowerCase().includes(q) ||
      c.cnpj?.toLowerCase().includes(q) ||
      c.cidade?.toLowerCase().includes(q) ||
      c.contato?.toLowerCase().includes(q)
  })

  const arquivosFiltrados = todosArquivos.filter(a => {
    const q = buscaArq.toLowerCase()
    return !buscaArq ||
      a.nome_original?.toLowerCase().includes(q) ||
      a.clientes?.nome?.toLowerCase().includes(q)
  })

  // Métricas resumo
  const totalAtivos   = clientes.filter(c => c.status !== 'Inativo').length
  const totalInativos = clientes.filter(c => c.status === 'Inativo').length

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:'Inter,system-ui,sans-serif',
      fontSize:13, color:T.text, background:T.bg, overflow:'hidden' }}>

      {/* ══ SIDEBAR ══ */}
      <div style={{ width:54, background:T.sidebar, display:'flex', flexDirection:'column',
        alignItems:'center', paddingTop:14, paddingBottom:14, flexShrink:0, height:'100vh' }}>
        {/* Logo */}
        <div style={{ width:36, height:36, background:T.red, borderRadius:9,
          display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        {/* Nav */}
        {[
          { ico:'grid',   title:'Board Kanban',  key:'board'     },
          { ico:'user',   title:'Clientes',       key:'clientes'  },
          { ico:'folder', title:'Arquivos',        key:'arquivos'  },
          { ico:'list',   title:'Relatório',       key:'relatorio' },
        ].map(item => (
          <button key={item.key} title={item.title}
            onClick={() => setView(item.key)}
            style={{ width:38, height:38, borderRadius:8, border:'none', cursor:'pointer',
              marginBottom:2, background: view === item.key ? T.red : 'transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background .14s' }}>
            <Ic n={item.ico} s={18} c={view === item.key ? '#fff' : '#616161'}/>
          </button>
        ))}

        <div style={{ flex:1 }}/>

        <button title="Sincronizar" onClick={() => { carregarClientes(); carregarTodosArquivos() }}
          style={{ width:38, height:38, borderRadius:8, border:'none', cursor:'pointer',
            background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 }}>
          <Ic n="refresh" s={16} c="#616161"/>
        </button>
        <button title="Configuração" onClick={() => setConfig(true)}
          style={{ width:38, height:38, borderRadius:8, border:'none', cursor:'pointer',
            background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:6 }}>
          <Ic n="settings" s={18} c="#616161"/>
        </button>
        <div title={online ? 'Sincronizado' : 'Sem conexão'}
          style={{ width:8, height:8, borderRadius:'50%', background: online ? '#4CAF50' : '#EF5350' }}/>
      </div>

      {/* ══ CONTEÚDO ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>

        {/* ── HEADER ── */}
        <div style={{ background:'#fff', borderBottom:'1px solid #E5E7EB', padding:'0 20px',
          height:54, minHeight:54, display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>

          <div style={{ fontWeight:800, fontSize:14, color:'#111', whiteSpace:'nowrap', marginRight:4 }}>
            Tecnoiso <span style={{ color:T.red }}>CRM</span>
          </div>

          <div style={{ width:1, height:22, background:'#E5E7EB' }}/>

          {/* Título da view */}
          <div style={{ fontSize:12, fontWeight:700, color:T.sub, textTransform:'uppercase',
            letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
            { view === 'board'     ? 'Board Kanban'
            : view === 'clientes' ? 'Clientes'
            : view === 'arquivos'  ? 'Arquivos'
            : 'Relatório' }
          </div>

          <div style={{ width:1, height:22, background:'#E5E7EB' }}/>

          {/* Busca */}
          <div style={{ position:'relative', flex:'0 0 260px' }}>
            <div style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#bbb' }}>
              <Ic n="search" s={13}/>
            </div>
            <input
              value={view === 'arquivos' ? buscaArq : busca}
              onChange={e => view === 'arquivos' ? setBuscaArq(e.target.value) : setBusca(e.target.value)}
              placeholder={view === 'arquivos' ? 'Buscar arquivo, cliente...' : 'Buscar cliente, CNPJ, cidade...'}
              style={{ width:'100%', border:'1px solid #E5E7EB', borderRadius:20,
                padding:'7px 12px 7px 30px', fontSize:12, outline:'none',
                background:'#F8F9FA', fontFamily:'inherit', transition:'border .14s' }}
              onFocus={e => e.target.style.borderColor = T.red}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>

          <div style={{ flex:1 }}/>

          {/* Métricas */}
          <div style={{ display:'flex', gap:18, alignItems:'center' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#111' }}>
                {view === 'arquivos' ? arquivosFiltrados.length : clientesFiltrados.length}
              </div>
              <div style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>exibidos</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#2E7D32' }}>{totalAtivos}</div>
              <div style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>ativos</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#C62828' }}>{totalInativos}</div>
              <div style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.05em' }}>inativos</div>
            </div>
          </div>

          <div style={{ width:1, height:22, background:'#E5E7EB' }}/>

          {/* Botão de ação contextual */}
          {(view === 'board' || view === 'clientes') && (
            <button onClick={() => setModal('novo')}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 18px',
                background:T.red, color:'#fff', border:'none', borderRadius:20,
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              <Ic n="plus" s={13} c="#fff"/> Novo cliente
            </button>
          )}
          {view === 'arquivos' && (
            <button onClick={carregarTodosArquivos}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 18px',
                background:'#1565C0', color:'#fff', border:'none', borderRadius:20,
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              <Ic n="refresh" s={13} c="#fff"/> Atualizar
            </button>
          )}
        </div>

        {/* ── VIEW: BOARD KANBAN ── */}
        {view === 'board' && (
          <div style={{ flex:1, minHeight:0, overflowX:'auto', overflowY:'hidden', padding:'14px 14px 0' }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                height:'100%', color:'#9ca3af', fontSize:14 }}>
                Carregando clientes...
              </div>
            ) : (
              <div style={{ display:'flex', gap:10, height:'100%', minHeight:0,
                alignItems:'stretch', paddingBottom:14 }}>
                {COLUNAS.map(col => (
                  <KCol key={col.id} col={col}
                    clientes={clientesFiltrados.filter(c => colDeCliente(c) === col.id)}
                    onCardClick={selecionarCliente}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: CLIENTES (lista com scroll) ── */}
        {view === 'clientes' && (
          <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'16px 20px' }}>
            {loading ? (
              <div style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>Carregando...</div>
            ) : clientesFiltrados.length === 0 ? (
              <div style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>
                <Ic n="user" s={32} c="#D1D5DB"/>
                <div style={{ marginTop:12 }}>Nenhum cliente encontrado</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {/* Cabeçalho da tabela */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 140px 140px 120px 90px 80px',
                  padding:'8px 16px', fontSize:10, fontWeight:800, color:'#9ca3af',
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  <span>Cliente</span>
                  <span>Cidade / UF</span>
                  <span>Contato</span>
                  <span>Forma entrega</span>
                  <span>Status</span>
                  <span style={{ textAlign:'right' }}>Ações</span>
                </div>

                {clientesFiltrados.map(c => {
                  const cor = { Ativo:'#2E7D32', Inativo:'#C62828', Pendente:'#E65100' }[c.status] || T.sub
                  const col = COLUNAS.find(cl => cl.id === colDeCliente(c)) || COLUNAS[4]
                  return (
                    <div key={c.id}
                      style={{ display:'grid', gridTemplateColumns:'1fr 140px 140px 120px 90px 80px',
                        padding:'11px 16px', background:'#fff', borderRadius:10,
                        border:'1px solid #EBEBEB', alignItems:'center', transition:'border .12s',
                        cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.red}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#EBEBEB'}
                      onClick={() => selecionarCliente(c)}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                        <Av nome={c.nome} size={30}/>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, overflow:'hidden',
                            textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</div>
                          {c.cnpj && <div style={{ fontSize:11, color:'#9ca3af' }}>{c.cnpj}</div>}
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:T.sub }}>
                        {c.cidade ? `${c.cidade}${c.uf ? `, ${c.uf}` : ''}` : '—'}
                      </span>
                      <span style={{ fontSize:12, color:T.sub, overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {c.contato || '—'}
                      </span>
                      <span style={{ background:col.bg, color:col.cor, fontSize:10, fontWeight:700,
                        padding:'3px 9px', borderRadius:5, display:'inline-block' }}>
                        {col.label}
                      </span>
                      <span style={{ fontSize:11, fontWeight:700, color:cor,
                        display:'flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%',
                          background:cor, display:'inline-block' }}/>
                        {c.status || '—'}
                      </span>
                      <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                        <button onClick={e => { e.stopPropagation(); selecionarCliente(c); setModal('editar') }}
                          style={{ padding:'5px 8px', background:'transparent', border:'1px solid #E0E0E0',
                            borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center', color:'#616161' }}>
                          <Ic n="edit" s={12}/>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: ARQUIVOS (todos os clientes) ── */}
        {view === 'arquivos' && (
          <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'16px 20px' }}>
            {arquivosFiltrados.length === 0 ? (
              <div style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>
                <Ic n="folder" s={32} c="#D1D5DB"/>
                <div style={{ marginTop:12 }}>Nenhum arquivo encontrado</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {/* Cabeçalho */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 90px 110px 80px',
                  padding:'8px 16px', fontSize:10, fontWeight:800, color:'#9ca3af',
                  textTransform:'uppercase', letterSpacing:'0.06em' }}>
                  <span>Arquivo</span>
                  <span>Cliente</span>
                  <span>Tamanho</span>
                  <span>Data</span>
                  <span style={{ textAlign:'right' }}>Ações</span>
                </div>

                {arquivosFiltrados.map(a => (
                  <div key={a.id} onClick={() => abrirArquivo(a)}
                    style={{ display:'grid', gridTemplateColumns:'1fr 180px 90px 110px 80px',
                      padding:'11px 16px', background:'#fff', borderRadius:10,
                      border:'1px solid #EBEBEB', alignItems:'center', transition:'border .12s',
                      cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#1565C0'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#EBEBEB'}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                      <div style={{ width:32, height:32, borderRadius:7, background:'#E3F2FD',
                        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Ic n="file" s={15} c="#1565C0"/>
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, overflow:'hidden',
                          textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nome_original}</div>
                        <div style={{ fontSize:10, color:'#9ca3af' }}>{a.tipo || 'arquivo'}</div>
                      </div>
                    </div>
                    <span style={{ fontSize:12, color:T.sub, overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {a.clientes?.nome || '—'}
                    </span>
                    <span style={{ fontSize:12, color:T.sub }}>{fmtSz(a.tamanho)}</span>
                    <span style={{ fontSize:12, color:T.sub }}>{fmt(a.criado_em)}</span>
                    <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                      <button onClick={e => { e.stopPropagation(); excluirArquivo(a) }}
                        style={{ padding:'5px 8px', background:'transparent', border:'1px solid #FECACA',
                          color:'#DC2626', borderRadius:6, cursor:'pointer', display:'flex', alignItems:'center' }}>
                        <Ic n="trash" s={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── VIEW: RELATÓRIO ── */}
        {view === 'relatorio' && (
          <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:'16px 20px' }}>
            {/* Cards de resumo */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Total de clientes', valor:clientes.length, cor:'#1565C0', bg:'#E3F2FD', ico:'user' },
                { label:'Clientes ativos',   valor:totalAtivos,     cor:'#2E7D32', bg:'#E8F5E9', ico:'check' },
                { label:'Clientes inativos', valor:totalInativos,   cor:'#C62828', bg:'#FFEBEE', ico:'x' },
                { label:'Arquivos enviados', valor:todosArquivos.length, cor:'#6A1B9A', bg:'#F3E5F5', ico:'file' },
              ].map(m => (
                <div key={m.label} style={{ background:'#fff', borderRadius:12, padding:'16px 18px',
                  border:'1px solid #EBEBEB', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:m.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Ic n={m.ico} s={18} c={m.cor}/>
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:800, color:m.cor }}>{m.valor}</div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Distribuição por forma de entrega */}
            <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px', border:'1px solid #EBEBEB', marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#111', marginBottom:14 }}>
                Clientes por forma de entrega
              </div>
              {COLUNAS.map(col => {
                const qtd = clientes.filter(c => colDeCliente(c) === col.id).length
                const pct = clientes.length ? (qtd / clientes.length * 100) : 0
                return (
                  <div key={col.id} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:12 }}>
                      <span style={{ color:'#212121', fontWeight:600 }}>{col.label}</span>
                      <span style={{ color:'#9ca3af' }}>{qtd} clientes ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height:8, background:'#F3F4F6', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:col.cor,
                        borderRadius:99, transition:'width .4s' }}/>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Top clientes com mais arquivos */}
            <div style={{ background:'#fff', borderRadius:12, padding:'18px 20px', border:'1px solid #EBEBEB' }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#111', marginBottom:14 }}>
                Clientes com mais arquivos
              </div>
              {clientes
                .map(c => ({ ...c, qtdArq: todosArquivos.filter(a => a.cliente_id === c.id).length }))
                .filter(c => c.qtdArq > 0)
                .sort((a, b) => b.qtdArq - a.qtdArq)
                .slice(0, 8)
                .map((c, i) => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10,
                    padding:'8px 0', borderBottom:'1px solid #F5F5F5' }}
                    onClick={() => { selecionarCliente(c); setView('clientes') }}
                    onMouseEnter={e => e.currentTarget.style.cursor = 'pointer'}
                  >
                    <span style={{ fontSize:11, fontWeight:800, color:'#D1D5DB', width:20 }}>#{i+1}</span>
                    <Av nome={c.nome} size={26}/>
                    <span style={{ flex:1, fontSize:13, fontWeight:600 }}>{c.nome}</span>
                    <span style={{ fontSize:11, color:'#1565C0', fontWeight:700,
                      background:'#E3F2FD', padding:'2px 9px', borderRadius:5 }}>
                      {c.qtdArq} arquivo(s)
                    </span>
                  </div>
                ))
              }
              {todosArquivos.length === 0 && (
                <div style={{ color:'#9ca3af', fontSize:12, textAlign:'center', padding:16 }}>
                  Nenhum arquivo enviado ainda
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ DRAWER DETALHE ══ */}
      {selecionado && (
        <Drawer
          c={selecionado}
          arquivos={arquivos}
          historico={historico}
          onClose={() => setSelecionado(null)}
          onEdit={() => setModal('editar')}
          onDelete={excluirCliente}
          onUpload={uploadArquivo}
          onAbrirArq={abrirArquivo}
          onExcluirArq={excluirArquivo}
        />
      )}

      {/* ══ MODAIS ══ */}
      {modal === 'novo'   && <ModalCliente onSave={salvarCliente} onClose={() => setModal(null)} />}
      {modal === 'editar' && <ModalCliente cliente={selecionado} onSave={salvarCliente} onClose={() => setModal(null)} />}
      {config             && <ConfigPanel onClose={() => setConfig(false)} />}
      {fileViewer         && <FileViewer arq={fileViewer} onClose={() => setFileViewer(null)} />}
      {toast              && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}