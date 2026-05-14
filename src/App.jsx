// ╔══════════════════════════════════════════════════════════════════╗
// ║  DELTAgroup REPORT — App Admin v1.0                             ║
// ║  Desktop-first · Verde #1B6B1B · PIN: 101318                    ║
// ╚══════════════════════════════════════════════════════════════════╝
const SUPABASE_URL = "https://golheevkvfqcpgovnawj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbGhlZXZrdmZxY3Bnb3ZuYXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNDIwODMsImV4cCI6MjA4OTgxODA4M30.M6S4oxVB112VBj9CZ8ZSFW79Kz7rJGs9tk1qpGhneWI";
const ADMIN_PIN = '101318';
const GREEN = '#1B6B1B';
const GREEN_LIGHT = '#eaf3de';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ── SUPABASE ───────────────────────────────────────────────────────
let _sb = null;
async function sb() {
  if (_sb) return _sb;
  if (!window.supabase) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return _sb;
}

// ── JSPDF ─────────────────────────────────────────────────────────
async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  return window.jspdf.jsPDF;
}

// ── UTILS ─────────────────────────────────────────────────────────
const fromISO = (iso) => { if (!iso) return '—'; const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
const fmtDT = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const MONTHS_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DAYS_SHORT = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];

// ── PDF GENERATION ─────────────────────────────────────────────────
async function generateReportPDF(report) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 18;
  let y = 18;

  doc.setFillColor(27,107,27); doc.rect(0,0,W,28,'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('DELTA', M, 12);
  doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.text('group', M+19.5, 12);
  doc.setFontSize(16); doc.setFont('helvetica','bold'); doc.text('REPORT', M+31, 12);
  doc.setFontSize(8); doc.setFont('helvetica','normal');
  doc.text('DELTAgroup Security & Services AG  \u00B7  Filiale Ticino  \u00B7  Via alla Foce 4, CH-6933 Muzzano', M, 21);
  doc.setFontSize(12); doc.setFont('helvetica','bold');
  doc.text(`N\u00B0 ${report.report_number}`, W-M, 12, {align:'right'});

  y = 38;
  doc.setTextColor(27,107,27); doc.setFontSize(13); doc.setFont('helvetica','bold');
  doc.text('RAPPORTO DI SERVIZIO', M, y);
  doc.setTextColor(100,100,100); doc.setFontSize(9); doc.setFont('helvetica','normal');
  doc.text(report.report_type === 'pdf_firma' ? 'PDF \u2013 Con firma cliente' : 'Solo testo', W-M, y, {align:'right'});

  y += 4; doc.setDrawColor(200,200,200); doc.line(M, y, W-M, y);

  const field = (label, value, x, yw, maxW=80) => {
    doc.setTextColor(120,120,120); doc.setFontSize(7.5); doc.setFont('helvetica','normal');
    doc.text(label, x, yw);
    doc.setTextColor(20,20,20); doc.setFontSize(10);
    doc.text(String(value||'\u2014'), x, yw+5, {maxWidth:maxW});
  };

  y += 8;
  field('DATA', fromISO(report.service_date), M, y);
  field('N\u00B0 RAPPORTO', report.report_number, 70, y);
  y += 14;
  const agenti = Array.isArray(report.agents_json) ? report.agents_json.map(a=>a.name).join(', ') : (report.submitted_by_name||'');
  field('AGENTI', agenti, M, y, 160);
  y += 14;
  field('CLIENTE', report.client_name, M, y);
  field('LUOGO', report.location, 110, y);
  y += 14;
  field('INDIRIZZO', report.address, M, y, 160);
  y += 14;
  field('INIZIO SERVIZIO', report.start_time||'\u2014', M, y);
  field('FINE SERVIZIO', report.end_time||'\u2014', 80, y);

  if (report.has_break) {
    y += 14;
    field('PAUSA \u2013 COPERTA DA', report.break_covered_by||'\u2014', M, y);
    field('INIZIO', report.break_start||'\u2014', 110, y);
    field('FINE', report.break_end||'\u2014', 150, y, 30);
  }

  if (report.notes) {
    y += 18;
    doc.setDrawColor(230,230,230);
    doc.roundedRect(M, y-4, W-M*2, 28, 2, 2, 'S');
    field('OSSERVAZIONI', report.notes, M+3, y, 160);
    y += 10;
  }

  y += 24;
  doc.setDrawColor(200,200,200); doc.line(M, y, W-M, y);
  y += 10;

  if (report.agent_signature) {
    doc.setTextColor(120,120,120); doc.setFontSize(8); doc.text('FIRMA AGENTE', M, y);
    try { doc.addImage(report.agent_signature, 'PNG', M, y+3, 75, 20); } catch(e){}
    doc.rect(M, y+3, 75, 20);
    doc.setTextColor(80,80,80); doc.setFontSize(8);
    doc.text(agenti, M, y+27);
  }

  if (report.client_unavailable) {
    doc.setTextColor(120,120,120); doc.setFontSize(8); doc.text('FIRMA CLIENTE', 115, y);
    doc.setFillColor(250,238,218); doc.roundedRect(115,y+3,75,20,2,2,'F');
    doc.setDrawColor(200,150,50); doc.roundedRect(115,y+3,75,20,2,2,'S');
    doc.setTextColor(122,80,0); doc.setFontSize(8); doc.setFont('helvetica','bold');
    doc.text('Firma non raccolta', 152.5, y+10, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text('Responsabile cliente assente', 152.5, y+16, {align:'center'});
    doc.text('al termine del servizio', 152.5, y+21, {align:'center'});
  } else if (report.client_signature) {
    doc.setTextColor(120,120,120); doc.setFontSize(8); doc.text('FIRMA CLIENTE', 115, y);
    if (report.client_signer_name) {
      doc.setTextColor(40,40,40); doc.setFontSize(9);
      doc.text(report.client_signer_name, 115, y+5);
    }
    try { doc.addImage(report.client_signature, 'PNG', 115, y+8, 75, 18); } catch(e){}
    doc.rect(115, y+3, 75, 20);
    y += 30;
    doc.setTextColor(120,120,120); doc.setFontSize(7.5);
    doc.text("Con la firma si conferma l'impiego svolto e l'esattezza dei dati", 115, y, {maxWidth:75});
  }

  doc.setFillColor(245,245,245); doc.rect(0, 287, W, 10, 'F');
  doc.setTextColor(150,150,150); doc.setFontSize(7);
  doc.text(`DELTAgroup REPORT \u00B7 Generato il ${fmtDT(new Date().toISOString())} \u00B7 ${report.report_number}`, W/2, 293, {align:'center'});

  return doc;
}

// ── STATUS / TYPE BADGE ────────────────────────────────────────────
const STATUS_CFG = {
  submitted:       { label:'Non letto',    bg:'#fcebeb', color:'#a32d2d', dot:'#e24b4a' },
  read:            { label:'Da inviare',   bg:'#faeeda', color:'#854f0b', dot:'#ef9f27' },
  sent_to_client:  { label:'Inviato',      bg:GREEN_LIGHT, color:'#27500a', dot:GREEN },
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.submitted;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:500,background:s.bg,color:s.color,whiteSpace:'nowrap'}}>
      <span style={{width:7,height:7,borderRadius:'50%',background:s.dot,flexShrink:0}} />{s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span style={{fontSize:10,padding:'2px 8px',borderRadius:5,fontWeight:500,whiteSpace:'nowrap',background:type==='pdf_firma'?GREEN_LIGHT:'#f0f0f0',color:type==='pdf_firma'?'#1a5c1a':'#666'}}>
      {type==='pdf_firma'?'PDF – Firma cliente':'Solo testo'}
    </span>
  );
}

// ── APP NAME ──────────────────────────────────────────────────────
function AppName({ dark = false }) {
  const c = dark ? GREEN : '#fff';
  const cs = dark ? '#555' : 'rgba(255,255,255,0.85)';
  return (
    <span style={{display:'inline-flex',alignItems:'baseline'}}>
      <span style={{fontSize:16,fontWeight:700,color:c,letterSpacing:0.5}}>DELTA</span>
      <span style={{fontSize:11,color:cs}}>group</span>
      <span style={{fontSize:16,fontWeight:700,color:c,letterSpacing:1.5,marginLeft:7}}>REPORT</span>
    </span>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────
const NAV = [
  { id:'inbox',        icon:'📥', label:'Inbox' },
  { id:'spedisci',     icon:'📤', label:'Spedisci' },
  { id:'clienti',      icon:'🏢', label:'Clienti' },
  { id:'collaboratori',icon:'👥', label:'Collaboratori' },
  { id:'regolamento',  icon:'📄', label:'Regolamento' },
];

function Sidebar({ active, onNav, onLogout }) {
  return (
    <div style={{width:200,background:'#0f3d0f',display:'flex',flexDirection:'column',height:'100vh',flexShrink:0}}>
      <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
        <AppName />
        <div style={{fontSize:10,color:'rgba(255,255,255,0.45)',marginTop:5}}>Pannello Amministratore</div>
      </div>
      <nav style={{flex:1,padding:'12px 8px',overflowY:'auto'}}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => onNav(item.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:'none',cursor:'pointer',marginBottom:2,fontSize:14,fontFamily:'inherit',background:active===item.id?'rgba(255,255,255,0.12)':'transparent',color:active===item.id?'#fff':'rgba(255,255,255,0.6)',fontWeight:active===item.id?500:400}}>
            <span style={{fontSize:17}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.1)'}}>
        <button onClick={onLogout} style={{width:'100%',padding:'9px 12px',border:'none',borderRadius:8,background:'transparent',color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:13,textAlign:'left',fontFamily:'inherit'}}>⬅ Esci</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const handleLogin = () => {
    if (pin === ADMIN_PIN) onLogin();
    else { setError('PIN non corretto.'); setPin(''); }
  };

  return (
    <div style={{minHeight:'100vh',background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:16,padding:'40px 36px',width:340,boxShadow:'0 2px 20px rgba(0,0,0,0.08)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{display:'block',margin:'0 auto 14px'}}>
            <rect width="52" height="52" rx="12" fill={GREEN}/>
            <polygon points="26,10 46,43 6,43" fill="none" stroke="white" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
          <AppName dark />
          <div style={{fontSize:12,color:'#999',marginTop:6}}>Accesso amministratore</div>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:'#555',fontWeight:500,display:'block',marginBottom:6}}>PIN amministratore</label>
          <input ref={ref} type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()} placeholder="••••••" style={{width:'100%',padding:'12px 14px',border:'1px solid #ddd',borderRadius:9,fontSize:18,letterSpacing:6,textAlign:'center',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
        </div>
        {error && <div style={{background:'#fcebeb',color:'#a32d2d',padding:'9px 13px',borderRadius:8,fontSize:13,marginBottom:12,textAlign:'center'}}>{error}</div>}
        <button onClick={handleLogin} style={{width:'100%',padding:13,background:GREEN,color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Accedi</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB: INBOX
// ═══════════════════════════════════════════════════════════════════
function InboxTab() {
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayReports, setDayReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [clientsMap, setClientsMap] = useState({});
  const [sendingId, setSendingId] = useState(null);

  const loadDays = useCallback(async () => {
    setLoading(true);
    const c = await sb();
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear()-1);
    const { data } = await c.from('dr_reports').select('id,service_date,status,is_late,report_type,submitted_at').gte('service_date', oneYearAgo.toISOString().split('T')[0]).order('service_date',{ascending:false});
    if (data) {
      const grouped = {};
      data.forEach(r => {
        if (!grouped[r.service_date]) grouped[r.service_date] = {total:0,submitted:0,read:0,sent:0,late:0};
        grouped[r.service_date].total++;
        if (r.status==='submitted') grouped[r.service_date].submitted++;
        if (r.status==='read') grouped[r.service_date].read++;
        if (r.status==='sent_to_client') grouped[r.service_date].sent++;
        if (r.is_late) grouped[r.service_date].late++;
      });
      setDays(Object.entries(grouped).sort((a,b) => b[0].localeCompare(a[0])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDays(); }, []);

  useEffect(() => {
    sb().then(c => c.from('report_clients').select('name,email')).then(({data}) => {
      if (data) { const m = {}; data.forEach(cl => { m[cl.name.toLowerCase()] = cl.email; }); setClientsMap(m); }
    });
  }, []);

  const loadDay = async (date) => {
    setSelectedDay(date); setSelectedReport(null); setEditMode(false); setLoadingDay(true);
    const c = await sb();
    const { data } = await c.from('dr_reports').select('*').eq('service_date', date).order('submitted_at',{ascending:false});
    if (data) {
      setDayReports(data);
      const toRead = data.filter(r => r.status==='submitted').map(r => r.id);
      if (toRead.length > 0) {
        await c.from('dr_reports').update({status:'read'}).in('id', toRead);
        setDayReports(prev => prev.map(r => toRead.includes(r.id) ? {...r,status:'read'} : r));
        loadDays();
      }
    }
    setLoadingDay(false);
  };

  const openReport = async (report) => {
    setSelectedReport(report);
    setEditForm({client_name:report.client_name,location:report.location,address:report.address,start_time:report.start_time,end_time:report.end_time,has_break:report.has_break,break_covered_by:report.break_covered_by,break_start:report.break_start,break_end:report.break_end,notes:report.notes});
    setEditMode(false);
    const c = await sb();
    const { data } = await c.from('report_revisions').select('*').eq('report_id', report.id).order('changed_at',{ascending:false});
    if (data) setRevisions(data);
  };

  const saveEdit = async () => {
    setSaving(true);
    const c = await sb();
    const labels = {client_name:'Cliente',location:'Luogo',address:'Indirizzo',start_time:'Inizio',end_time:'Fine',has_break:'Pausa',break_covered_by:'Pausa coperta da',break_start:'Inizio pausa',break_end:'Fine pausa',notes:'Osservazioni'};
    const changes = [];
    Object.keys(labels).forEach(k => {
      if (String(editForm[k]??'') !== String(selectedReport[k]??''))
        changes.push({report_id:selectedReport.id,field_name:labels[k],old_value:String(selectedReport[k]??''),new_value:String(editForm[k]??''),changed_by:'Admin'});
    });
    await c.from('dr_reports').update({...editForm,updated_at:new Date().toISOString()}).eq('id',selectedReport.id);
    if (changes.length > 0) await c.from('report_revisions').insert(changes);
    const updated = {...selectedReport,...editForm};
    setSelectedReport(updated);
    setDayReports(prev => prev.map(r => r.id===updated.id ? updated : r));
    if (changes.length > 0) setRevisions(prev => [...changes.map(ch=>({...ch,changed_at:new Date().toISOString()})), ...prev]);
    setEditMode(false); setSaving(false);
  };

  const sendToClient = async (report) => {
    setSendingId(report.id);
    try {
      const doc = await generateReportPDF(report);
      const blob = doc.output('blob');
      const file = new File([blob], `Rapporto_${report.report_number}.pdf`, {type:'application/pdf'});
      const email = clientsMap[(report.client_name||'').toLowerCase()] || '';
      const subject = encodeURIComponent(`Rapporto di Servizio ${report.report_number} – ${report.client_name}`);
      const body = encodeURIComponent(`Spettabile Cliente,\n\nin allegato trasmettiamo il Rapporto di Servizio N\u00B0 ${report.report_number} del ${fromISO(report.service_date)}.\n\nCordiali saluti,\nDELTAgroup Security & Services AG`);
      if (navigator.canShare && navigator.canShare({files:[file]})) {
        await navigator.share({files:[file], title:`Rapporto ${report.report_number}`});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download=file.name; a.click();
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      }
      const c = await sb();
      await c.from('dr_reports').update({status:'sent_to_client',sent_to_client_at:new Date().toISOString()}).eq('id',report.id);
      setSelectedReport(r => ({...r,status:'sent_to_client',sent_to_client_at:new Date().toISOString()}));
      setDayReports(prev => prev.map(r => r.id===report.id ? {...r,status:'sent_to_client'} : r));
      loadDays();
    } catch(e) { console.error(e); }
    setSendingId(null);
  };

  const previewPDF = async (report) => {
    const doc = await generateReportPDF(report);
    const blob = doc.output('blob');
    window.open(URL.createObjectURL(blob), '_blank');
  };

  const dayStatus = (d) => { if(d.submitted>0) return 'error'; if(d.read>0) return 'warning'; return 'ok'; };

  const filteredDays = searchDate ? days.filter(([date]) => date.includes(searchDate)) : days;

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>

      {/* Colonna 1: giorni */}
      <div style={{width:280,borderRight:'1px solid #e8e8e8',display:'flex',flexDirection:'column',background:'#fafafa',flexShrink:0}}>
        <div style={{padding:'14px 14px 10px',borderBottom:'1px solid #e8e8e8'}}>
          <div style={{fontWeight:500,fontSize:15,marginBottom:10}}>📥 Inbox</div>
          <input type="date" value={searchDate} onChange={e=>setSearchDate(e.target.value)} style={{width:'100%',padding:'8px 10px',border:'1px solid #ddd',borderRadius:7,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} />
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {loading && <div style={{padding:20,textAlign:'center',color:'#888',fontSize:13}}>Caricamento…</div>}
          {filteredDays.map(([date,stats]) => {
            const d = new Date(date+'T12:00:00');
            const isSelected = selectedDay===date;
            const isToday = date===todayISO();
            const st = dayStatus(stats);
            return (
              <div key={date} onClick={() => loadDay(date)} style={{padding:'11px 14px',cursor:'pointer',borderBottom:'0.5px solid #eee',background:isSelected?'#e8f5e8':'#fafafa',display:'flex',alignItems:'center',gap:12}}>
                <div style={{textAlign:'center',minWidth:36}}>
                  <div style={{fontSize:20,fontWeight:600,lineHeight:1,color:isSelected?GREEN:'#111'}}>{d.getDate()}</div>
                  <div style={{fontSize:10,color:'#888'}}>{MONTHS_SHORT[d.getMonth()]}</div>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:isToday?600:400}}>{isToday?'Oggi':DAYS_SHORT[d.getDay()]+' '+d.getDate()+' '+MONTHS_SHORT[d.getMonth()]}</div>
                  <div style={{fontSize:11,color:'#888'}}>
                    {stats.total} rapporti{stats.submitted>0?` \u00B7 ${stats.submitted} non letti`:stats.read>0?` \u00B7 ${stats.read} da inviare`:' \u00B7 tutti inviati'}
                  </div>
                  {stats.late>0 && <span style={{fontSize:9,background:'#faeeda',color:'#854f0b',padding:'1px 5px',borderRadius:3}}>+{stats.late} ritardo</span>}
                </div>
                <div>
                  {st==='error' && <div style={{width:10,height:10,borderRadius:'50%',background:'#e24b4a'}} />}
                  {st==='warning' && <div style={{width:10,height:10,borderRadius:'50%',background:'#ef9f27'}} />}
                  {st==='ok' && <span style={{fontSize:14,color:GREEN}}>✓</span>}
                </div>
              </div>
            );
          })}
          {!loading && filteredDays.length===0 && <div style={{padding:20,textAlign:'center',color:'#aaa',fontSize:13}}>Nessun dato</div>}
        </div>
      </div>

      {/* Colonna 2: rapporti del giorno */}
      <div style={{width:320,borderRight:'1px solid #e8e8e8',display:'flex',flexDirection:'column',background:'#fff',flexShrink:0}}>
        {!selectedDay
          ? <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#bbb',fontSize:14}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:10}}>📅</div>Seleziona un giorno</div></div>
          : <>
            <div style={{padding:'14px',borderBottom:'1px solid #eee'}}>
              <div style={{fontWeight:500,fontSize:14}}>{fromISO(selectedDay)}</div>
              <div style={{fontSize:12,color:'#888'}}>{dayReports.length} rapporti</div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {loadingDay && <div style={{padding:20,textAlign:'center',color:'#888',fontSize:13}}>Caricamento…</div>}
              {dayReports.map(r => (
                <div key={r.id} onClick={() => openReport(r)} style={{padding:'11px 14px',cursor:'pointer',borderBottom:'0.5px solid #f0f0f0',borderLeft:`3px solid ${r.status==='sent_to_client'?GREEN:r.status==='read'?'#ef9f27':'#e24b4a'}`,background:selectedReport?.id===r.id?'#f5fbf5':'#fff'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:3,gap:6}}>
                    <div style={{fontWeight:500,fontSize:13,minWidth:0}}>{r.submitted_by_name}</div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{fontSize:12,color:'#666',marginBottom:4}}>{r.client_name} \u00B7 {r.address}</div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:6}}>
                    <TypeBadge type={r.report_type} />
                    <div style={{fontSize:10,color:'#bbb'}}>{fmtTime(r.submitted_at)}</div>
                  </div>
                  {r.is_late && <div style={{fontSize:10,color:'#854f0b',background:'#faeeda',padding:'1px 6px',borderRadius:4,marginTop:4,display:'inline-block'}}>Ricevuto in ritardo</div>}
                </div>
              ))}
            </div>
          </>
        }
      </div>

      {/* Colonna 3: dettaglio rapporto */}
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#fff',overflowY:'auto'}}>
        {!selectedReport
          ? <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#bbb',fontSize:14}}><div style={{textAlign:'center'}}><div style={{fontSize:32,marginBottom:10}}>📋</div>Seleziona un rapporto</div></div>
          : <div style={{padding:24,maxWidth:700}}>
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:12}}>
              <div>
                <div style={{fontSize:18,fontWeight:600}}>{selectedReport.report_number}</div>
                <div style={{fontSize:13,color:'#888',marginTop:2}}>Ricevuto {fmtDT(selectedReport.submitted_at)} \u00B7 da {selectedReport.submitted_by_name}</div>
                {selectedReport.is_late && <span style={{fontSize:11,color:'#854f0b',background:'#faeeda',padding:'2px 8px',borderRadius:5,marginTop:4,display:'inline-block'}}>Ricevuto in ritardo rispetto alla data servizio</span>}
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                <StatusBadge status={selectedReport.status} />
                <TypeBadge type={selectedReport.report_type} />
              </div>
            </div>

            {/* Dati rapporto */}
            <div style={{background:'#fafafa',borderRadius:12,padding:20,marginBottom:16,border:'1px solid #e8e8e8'}}>
              {!editMode ? (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 24px'}}>
                  {[
                    ['Data servizio', fromISO(selectedReport.service_date)],
                    ['Agenti', Array.isArray(selectedReport.agents_json) ? selectedReport.agents_json.map(a=>a.name).join(', ') : selectedReport.submitted_by_name],
                    ['Cliente', selectedReport.client_name, true],
                    ['Luogo', selectedReport.location],
                    ['Indirizzo', selectedReport.address, true],
                    ['Inizio', selectedReport.start_time||'—'],
                    ['Fine', selectedReport.end_time||'—'],
                    selectedReport.has_break && ['Pausa', `${selectedReport.break_start}–${selectedReport.break_end} (${selectedReport.break_covered_by})`],
                    selectedReport.notes && ['Osservazioni', selectedReport.notes, true],
                  ].filter(Boolean).map(([label,value,full]) => (
                    <div key={label} style={{gridColumn:full?'1/-1':'auto'}}>
                      <div style={{fontSize:10,color:'#999',marginBottom:2}}>{label}</div>
                      <div style={{fontSize:14,color:label==='Fine'&&!selectedReport.end_time?'#e24b4a':'#111'}}>{value}</div>
                    </div>
                  ))}
                  {!selectedReport.end_time && (
                    <div style={{gridColumn:'1/-1',padding:'8px 12px',background:'#fcebeb',borderRadius:7,display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                      <span style={{color:'#a32d2d',fontSize:14}}>⚠️</span>
                      <span style={{fontSize:12,color:'#a32d2d'}}>Orario di fine mancante — correggere prima di inviare al cliente</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
                  {[
                    ['Cliente','client_name','text',true],
                    ['Luogo','location','text',false],
                    ['Indirizzo','address','text',true],
                    ['Inizio','start_time','time',false],
                    ['Fine','end_time','time',false],
                  ].map(([label,key,type,full]) => (
                    <div key={key} style={{gridColumn:full?'1/-1':'auto',marginBottom:12}}>
                      <div style={{fontSize:11,color:'#888',marginBottom:3}}>{label}</div>
                      <input type={type} value={editForm[key]||''} onChange={e=>setEditForm(f=>({...f,[key]:e.target.value}))} style={{width:'100%',padding:'8px 10px',border:'1px solid #ddd',borderRadius:7,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} />
                    </div>
                  ))}
                  <div style={{gridColumn:'1/-1',marginBottom:12}}>
                    <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:8}}>
                      <input type="checkbox" checked={editForm.has_break||false} onChange={e=>setEditForm(f=>({...f,has_break:e.target.checked}))} style={{accentColor:GREEN}} />
                      <span style={{fontSize:13}}>Pausa effettuata</span>
                    </label>
                    {editForm.has_break && (
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0 12px'}}>
                        {[['Coperta da','break_covered_by','text'],['Inizio pausa','break_start','time'],['Fine pausa','break_end','time']].map(([label,key,type]) => (
                          <div key={key}><div style={{fontSize:11,color:'#888',marginBottom:3}}>{label}</div><input type={type} value={editForm[key]||''} onChange={e=>setEditForm(f=>({...f,[key]:e.target.value}))} style={{width:'100%',padding:'8px 10px',border:'1px solid #ddd',borderRadius:7,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} /></div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{gridColumn:'1/-1',marginBottom:12}}>
                    <div style={{fontSize:11,color:'#888',marginBottom:3}}>Osservazioni</div>
                    <textarea value={editForm.notes||''} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',height:80,padding:'8px 10px',border:'1px solid #ddd',borderRadius:7,fontSize:13,resize:'none',fontFamily:'inherit',boxSizing:'border-box'}} />
                  </div>
                </div>
              )}
            </div>

            {/* Firme */}
            {(selectedReport.agent_signature||selectedReport.client_signature) && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                {selectedReport.agent_signature && (
                  <div style={{background:'#fafafa',borderRadius:10,padding:14,border:'1px solid #e8e8e8'}}>
                    <div style={{fontSize:11,color:'#888',marginBottom:8}}>FIRMA AGENTE</div>
                    <img src={selectedReport.agent_signature} style={{width:'100%',height:70,objectFit:'contain',border:'0.5px solid #eee',borderRadius:6}} />
                  </div>
                )}
                {selectedReport.client_signature && (
                  <div style={{background:'#fafafa',borderRadius:10,padding:14,border:'1px solid #e8e8e8'}}>
                    <div style={{fontSize:11,color:'#888',marginBottom:4}}>FIRMA CLIENTE</div>
                    {selectedReport.client_signer_name && <div style={{fontSize:12,fontWeight:500,marginBottom:6}}>{selectedReport.client_signer_name}</div>}
                    <img src={selectedReport.client_signature} style={{width:'100%',height:70,objectFit:'contain',border:'0.5px solid #eee',borderRadius:6}} />
                  </div>
                )}
              </div>
            )}

            {/* Azioni */}
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              {!editMode
                ? <button onClick={() => setEditMode(true)} style={{flex:1,padding:10,border:'1px solid #ddd',borderRadius:9,background:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>✏️ Correggi</button>
                : <>
                  <button onClick={saveEdit} disabled={saving} style={{flex:1,padding:10,border:'none',borderRadius:9,background:GREEN,color:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',fontWeight:500}}>{saving?'Salvataggio…':'💾 Salva'}</button>
                  <button onClick={() => setEditMode(false)} style={{padding:'10px 16px',border:'1px solid #ddd',borderRadius:9,background:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Annulla</button>
                </>
              }
              <button onClick={() => previewPDF(selectedReport)} style={{flex:1,padding:10,border:'1px solid #ddd',borderRadius:9,background:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>📄 Anteprima PDF</button>
            </div>

            {!editMode && selectedReport.status!=='sent_to_client' && (
              <button onClick={() => sendToClient(selectedReport)} disabled={sendingId===selectedReport.id} style={{width:'100%',padding:14,background:GREEN,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:500,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16,opacity:sendingId===selectedReport.id?0.6:1}}>
                {sendingId===selectedReport.id?'Preparazione…':'📤 Invia al cliente'}
              </button>
            )}
            {selectedReport.status==='sent_to_client' && (
              <div style={{padding:'10px 14px',background:GREEN_LIGHT,borderRadius:9,fontSize:13,color:'#1a5c1a',marginBottom:16}}>
                ✅ Inviato al cliente il {fmtDT(selectedReport.sent_to_client_at)}
              </div>
            )}

            {/* Cronologia */}
            {revisions.length>0 && (
              <div style={{background:'#fafafa',borderRadius:10,padding:'12px 16px',border:'1px solid #eee'}}>
                <div style={{fontSize:11,fontWeight:600,color:'#888',marginBottom:10}}>CRONOLOGIA MODIFICHE</div>
                {revisions.map((r,i) => (
                  <div key={i} style={{fontSize:12,color:'#555',marginBottom:6,paddingBottom:6,borderBottom:i<revisions.length-1?'0.5px solid #eee':'none'}}>
                    <span style={{color:'#999',fontSize:11}}>{fmtDT(r.changed_at)}</span> · <strong>{r.field_name}</strong>: <span style={{color:'#999',textDecoration:'line-through'}}>{r.old_value||'—'}</span> → <span style={{color:GREEN}}>{r.new_value||'—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB: SPEDISCI
// ═══════════════════════════════════════════════════════════════════
function SpedisciTab() {
  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  const load = useCallback(async () => {
    const c = await sb();
    const [rpt, cli] = await Promise.all([
      c.from('dr_reports').select('id,report_number,service_date,submitted_by_name,client_name,client_id,address,report_type,status,submitted_at').neq('status','sent_to_client').order('service_date',{ascending:false}),
      c.from('report_clients').select('*').order('name'),
    ]);
    if (rpt.data) setReports(rpt.data);
    if (cli.data) setClients(cli.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g = {};
    reports.forEach(r => {
      if (!g[r.client_name]) g[r.client_name] = [];
      g[r.client_name].push(r);
    });
    return Object.entries(g).sort(([a],[b]) => a.localeCompare(b));
  }, [reports]);

  const isChecked = (id) => selected[id] !== false;
  const toggle = (id) => setSelected(s => ({...s,[id]:!isChecked(id)}));
  const toggleAll = (ids) => { const allOn = ids.every(id => isChecked(id)); const u={...selected}; ids.forEach(id=>{u[id]=!allOn;}); setSelected(u); };

  const sendGroup = async (clientName, rpts) => {
    const toSend = rpts.filter(r => isChecked(r.id));
    if (toSend.length===0) return;
    setSending(clientName);
    const clientObj = clients.find(cl => cl.name.toLowerCase()===clientName.toLowerCase());
    const email = clientObj?.email||'';
    try {
      const files = [];
      for (const r of toSend) {
        const doc = await generateReportPDF(r);
        const blob = doc.output('blob');
        files.push(new File([blob], `Rapporto_${r.report_number}.pdf`, {type:'application/pdf'}));
      }
      const subject = encodeURIComponent(`Rapporti di Servizio – ${clientName}`);
      const body = encodeURIComponent(`Spettabile Cliente,\n\nin allegato trasmettiamo i Rapporti di Servizio.\n\nCordiali saluti,\nDELTAgroup Security & Services AG`);
      if (navigator.canShare && navigator.canShare({files})) {
        await navigator.share({files, title:`Rapporti ${clientName}`});
      } else {
        files.forEach(f => { const url=URL.createObjectURL(f); const a=document.createElement('a'); a.href=url; a.download=f.name; a.click(); });
        window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      }
      const c = await sb();
      const ids = toSend.map(r => r.id);
      await c.from('dr_reports').update({status:'sent_to_client',sent_to_client_at:new Date().toISOString()}).in('id',ids);
      setReports(prev => prev.filter(r => !ids.includes(r.id)));
    } catch(e) { console.error(e); }
    setSending(null);
  };

  if (loading) return <div style={{padding:40,textAlign:'center',color:'#888'}}>Caricamento…</div>;

  return (
    <div style={{padding:28,maxWidth:820,overflowY:'auto',height:'100vh',boxSizing:'border-box'}}>
      <div style={{fontWeight:600,fontSize:18,marginBottom:4}}>📤 Spedisci per cliente</div>
      <div style={{color:'#888',fontSize:13,marginBottom:24}}>Rapporti da inviare, raggruppati per cliente.</div>
      {grouped.length===0 && <div style={{padding:40,textAlign:'center',color:'#888',background:'#fafafa',borderRadius:12,border:'1px solid #eee'}}>Nessun rapporto da inviare 🎉</div>}
      {grouped.map(([clientName, rpts]) => {
        const clientObj = clients.find(cl => cl.name.toLowerCase()===clientName.toLowerCase());
        const ids = rpts.map(r=>r.id);
        const nSelected = rpts.filter(r=>isChecked(r.id)).length;
        return (
          <div key={clientName} style={{border:'1px solid #e0e0e0',borderRadius:12,marginBottom:16,overflow:'hidden'}}>
            <div style={{background:'#f5f5f5',padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #e0e0e0'}}>
              <div>
                <div style={{fontWeight:500,fontSize:15}}>{clientName}</div>
                <div style={{fontSize:12,color:clientObj?.email?'#777':'#e24b4a'}}>{clientObj?.email||'Email non registrata — vai su Clienti per aggiungerla'}</div>
              </div>
              <span style={{fontSize:12,background:'#fcebeb',color:'#a32d2d',padding:'3px 10px',borderRadius:6}}>{rpts.length} da inviare</span>
            </div>
            <div style={{padding:'0 18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'0.5px solid #f0f0f0'}}>
                <input type="checkbox" checked={ids.every(id=>isChecked(id))} onChange={() => toggleAll(ids)} style={{accentColor:GREEN}} />
                <span style={{fontSize:12,color:'#888'}}>Seleziona tutti</span>
              </div>
              {rpts.map(r => (
                <label key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'0.5px solid #f5f5f5',cursor:'pointer'}}>
                  <input type="checkbox" checked={isChecked(r.id)} onChange={() => toggle(r.id)} style={{accentColor:GREEN,flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{fontSize:13}}>{r.report_number} · {r.submitted_by_name} · {fromISO(r.service_date)}</div>
                    <div style={{fontSize:11,color:'#888'}}>{r.address}</div>
                  </div>
                  <TypeBadge type={r.report_type} />
                </label>
              ))}
            </div>
            <div style={{padding:'12px 18px',background:'#fafafa',borderTop:'1px solid #e0e0e0',display:'flex',alignItems:'center',gap:10}}>
              {clientObj?.email && (
                <div style={{display:'flex',alignItems:'center',gap:6,flex:1,background:'#fff',padding:'7px 11px',borderRadius:7,border:'1px solid #e8e8e8'}}>
                  <span style={{fontSize:13,color:'#555',flex:1}}>📧 {clientObj.email}</span>
                  <button onClick={() => navigator.clipboard?.writeText(clientObj.email)} style={{background:GREEN,color:'#fff',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>Copia</button>
                </div>
              )}
              <button onClick={() => sendGroup(clientName, rpts)} disabled={sending===clientName||nSelected===0} style={{padding:'10px 20px',background:GREEN,color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'inherit',whiteSpace:'nowrap',opacity:sending===clientName||nSelected===0?0.5:1}}>
                {sending===clientName?'Preparazione…':`📤 Invia ${nSelected} PDF`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB: CLIENTI
// ═══════════════════════════════════════════════════════════════════
function ClientiTab() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({name:'',email:'',notes:''});
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    sb().then(c => c.from('report_clients').select('*').order('name')).then(({data}) => { if(data) setClients(data); });
  }, []);

  const save = async () => {
    const c = await sb();
    if (editing) {
      const {data} = await c.from('report_clients').update({name:form.name,email:form.email,notes:form.notes,updated_at:new Date().toISOString()}).eq('id',editing).select().single();
      if (data) setClients(prev => prev.map(cl => cl.id===editing?data:cl));
    } else {
      const {data} = await c.from('report_clients').insert({name:form.name,email:form.email,notes:form.notes}).select().single();
      if (data) setClients(prev => [...prev,data].sort((a,b)=>a.name.localeCompare(b.name)));
    }
    setForm({name:'',email:'',notes:''}); setEditing(null); setShowForm(false);
  };

  const del = async (id) => {
    if (!confirm('Eliminare questo cliente?')) return;
    const c = await sb();
    await c.from('report_clients').delete().eq('id',id);
    setClients(prev => prev.filter(cl => cl.id!==id));
  };

  const startEdit = (cl) => { setForm({name:cl.name,email:cl.email,notes:cl.notes||''}); setEditing(cl.id); setShowForm(true); };
  const filtered = clients.filter(cl => cl.name.toLowerCase().includes(search.toLowerCase()) || cl.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{padding:28,maxWidth:700,overflowY:'auto',height:'100vh',boxSizing:'border-box'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><div style={{fontWeight:600,fontSize:18}}>🏢 Anagrafica Clienti</div><div style={{fontSize:13,color:'#888',marginTop:2}}>Email per l'invio dei rapporti</div></div>
        <button onClick={() => {setForm({name:'',email:'',notes:''});setEditing(null);setShowForm(true);}} style={{padding:'9px 16px',background:GREEN,color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'inherit'}}>+ Aggiungi cliente</button>
      </div>
      {showForm && (
        <div style={{background:'#fafafa',borderRadius:12,padding:20,marginBottom:20,border:'1px solid #e0e0e0'}}>
          <div style={{fontWeight:500,fontSize:14,marginBottom:14}}>{editing?'Modifica cliente':'Nuovo cliente'}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><div style={{fontSize:11,color:'#888',marginBottom:4}}>Nome cliente *</div><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:'1px solid #ddd',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} placeholder="Es. SPALU – DSU" /></div>
            <div><div style={{fontSize:11,color:'#888',marginBottom:4}}>Email *</div><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} type="email" style={{width:'100%',padding:'9px 11px',border:'1px solid #ddd',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} placeholder="rapporti@cliente.ch" /></div>
            <div style={{gridColumn:'1/-1'}}><div style={{fontSize:11,color:'#888',marginBottom:4}}>Note</div><input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:'1px solid #ddd',borderRadius:8,fontSize:13,boxSizing:'border-box',fontFamily:'inherit'}} placeholder="Note opzionali" /></div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} disabled={!form.name||!form.email} style={{padding:'9px 20px',background:GREEN,color:'#fff',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'inherit',opacity:!form.name||!form.email?0.5:1}}>Salva</button>
            <button onClick={() => {setShowForm(false);setEditing(null);}} style={{padding:'9px 16px',border:'1px solid #ddd',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Annulla</button>
          </div>
        </div>
      )}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca cliente o email…" style={{width:'100%',padding:'10px 13px',border:'1px solid #ddd',borderRadius:9,fontSize:14,marginBottom:14,boxSizing:'border-box',fontFamily:'inherit'}} />
      {filtered.map(cl => (
        <div key={cl.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 16px',background:'#fff',borderRadius:10,marginBottom:8,border:'0.5px solid #e8e8e8'}}>
          <div>
            <div style={{fontWeight:500,fontSize:14}}>{cl.name}</div>
            <div style={{fontSize:12,color:'#777',marginTop:2}}>📧 {cl.email}</div>
            {cl.notes && <div style={{fontSize:11,color:'#aaa',marginTop:2}}>{cl.notes}</div>}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={() => startEdit(cl)} style={{padding:'6px 12px',border:'1px solid #ddd',borderRadius:7,background:'#fff',cursor:'pointer',fontSize:12,fontFamily:'inherit'}}>✏️ Modifica</button>
            <button onClick={() => del(cl.id)} style={{padding:'6px 12px',border:'1px solid #ffcccc',borderRadius:7,background:'#fff',cursor:'pointer',fontSize:12,color:'#cc0000',fontFamily:'inherit'}}>🗑</button>
          </div>
        </div>
      ))}
      {filtered.length===0 && <div style={{textAlign:'center',color:'#aaa',padding:30}}>Nessun cliente trovato.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB: COLLABORATORI
// ═══════════════════════════════════════════════════════════════════
function CollaboratoriTab() {
  const [collabs, setCollabs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    const c = await sb();
    const {data} = await c.from('report_collaborators').select('*').order('agent_name');
    if (data) setCollabs(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (id, current) => {
    const c = await sb();
    await c.from('report_collaborators').update({is_active:!current,updated_at:new Date().toISOString()}).eq('id',id);
    setCollabs(prev => prev.map(cl => cl.id===id ? {...cl,is_active:!current} : cl));
  };

  const resetPin = async (id, name) => {
    if (!confirm(`Generare un nuovo PIN per ${name}? Dovrà rifare il primo accesso.`)) return;
    const c = await sb();
    const {data:pin} = await c.rpc('generate_random_pin');
    await c.from('report_collaborators').update({pin,pin_revealed:false,pin_revealed_at:null,regulation_accepted:false,regulation_accepted_at:null,regulation_version:0,updated_at:new Date().toISOString()}).eq('id',id);
    setCollabs(prev => prev.map(cl => cl.id===id ? {...cl,pin,pin_revealed:false,regulation_accepted:false} : cl));
    alert(`Nuovo PIN per ${name}: ${pin}`);
  };

  const importFromPlan = async () => {
    if (!confirm('Importare i nuovi collaboratori attivi dal PLAN?')) return;
    setImporting(true);
    const c = await sb();
    const {data} = await c.rpc('import_agents_to_report');
    alert(`${data} collaboratori importati.`);
    load();
    setImporting(false);
  };

  const filtered = collabs.filter(cl => cl.agent_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{padding:28,overflowY:'auto',height:'100vh',boxSizing:'border-box'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <div><div style={{fontWeight:600,fontSize:18}}>👥 Collaboratori</div><div style={{fontSize:13,color:'#888',marginTop:2}}>Gestione accessi e PIN · {collabs.length} totali</div></div>
        <button onClick={importFromPlan} disabled={importing} style={{padding:'9px 16px',background:'#1d4ed8',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'inherit'}}>
          {importing?'Import in corso…':'⬇ Importa da PLAN'}
        </button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca collaboratore…" style={{width:'100%',padding:'10px 13px',border:'1px solid #ddd',borderRadius:9,fontSize:14,marginBottom:14,boxSizing:'border-box',fontFamily:'inherit'}} />
      {loading && <div style={{textAlign:'center',color:'#888',padding:30}}>Caricamento…</div>}
      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #e0e0e0',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'#f5f5f5'}}>
              {['Collaboratore','PIN','Primo accesso','Regolamento','Stato','Azioni'].map(h => (
                <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:0.5}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((cl,i) => (
              <tr key={cl.id} style={{borderTop:i>0?'0.5px solid #f0f0f0':'none'}}>
                <td style={{padding:'11px 14px',fontWeight:500}}>{cl.agent_name}</td>
                <td style={{padding:'11px 14px',fontFamily:'monospace',fontSize:14,color:cl.pin_revealed?'#aaa':GREEN,fontWeight:600}}>{cl.pin_revealed?'••••••':cl.pin}</td>
                <td style={{padding:'11px 14px',fontSize:12,color:'#888'}}>{cl.pin_revealed?fmtDT(cl.pin_revealed_at):'— Non ancora'}</td>
                <td style={{padding:'11px 14px'}}>{cl.regulation_accepted?<span style={{color:GREEN}}>✓ Accettato</span>:<span style={{color:'#ccc'}}>— Non ancora</span>}</td>
                <td style={{padding:'11px 14px'}}>{cl.is_active?<span style={{color:GREEN,fontWeight:500}}>● Attivo</span>:<span style={{color:'#999'}}>○ Disabilitato</span>}</td>
                <td style={{padding:'11px 14px'}}>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={() => toggleActive(cl.id,cl.is_active)} style={{padding:'4px 10px',border:`1px solid ${cl.is_active?'#ffcccc':'#ccffcc'}`,borderRadius:6,background:'#fff',cursor:'pointer',fontSize:11,color:cl.is_active?'#cc0000':GREEN,fontFamily:'inherit'}}>
                      {cl.is_active?'Disabilita':'Abilita'}
                    </button>
                    <button onClick={() => resetPin(cl.id,cl.agent_name)} style={{padding:'4px 10px',border:'1px solid #ddd',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:11,fontFamily:'inherit'}}>Reset PIN</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && !loading && <div style={{textAlign:'center',color:'#aaa',padding:30}}>Nessun collaboratore trovato.</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB: REGOLAMENTO
// ═══════════════════════════════════════════════════════════════════
function RegolamentoTab() {
  const [content, setContent] = useState('');
  const [version, setVersion] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    sb().then(c => c.from('report_regulations').select('*').order('version',{ascending:false}).limit(1).single()).then(({data}) => {
      if (data) { setContent(data.content); setVersion(data.version); }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const c = await sb();
    await c.from('report_regulations').insert({content,version:version+1,updated_by:'Admin',updated_at:new Date().toISOString()});
    setVersion(v => v+1);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
    setSaving(false);
    alert(`Regolamento salvato come v${version+1}.\n\nSe vuoi forzare la riaccettazione a tutti, aggiorna REGULATION_VERSION=${version+1} nel codice dell'app collaboratore.`);
  };

  return (
    <div style={{padding:28,maxWidth:700,height:'100vh',boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <div><div style={{fontWeight:600,fontSize:18}}>📄 Regolamento</div><div style={{fontSize:13,color:'#888',marginTop:2}}>Versione corrente: v{version}</div></div>
        <button onClick={save} disabled={saving} style={{padding:'9px 20px',background:GREEN,color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'inherit'}}>
          {saving?'Salvataggio…':saved?'✓ Salvato':'Salva nuova versione'}
        </button>
      </div>
      <div style={{fontSize:12,color:'#e07000',background:'#faeeda',padding:'9px 13px',borderRadius:8,marginBottom:14}}>
        ⚠️ Salvando crei una nuova versione. Per forzare la riaccettazione aggiorna <code>REGULATION_VERSION</code> nell'app collaboratore.
      </div>
      <textarea value={content} onChange={e=>setContent(e.target.value)} style={{flex:1,padding:'14px 16px',border:'1px solid #ddd',borderRadius:10,fontSize:13,lineHeight:1.7,resize:'none',fontFamily:'inherit',boxSizing:'border-box',outline:'none'}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');

  if (!loggedIn) return <AdminLogin onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'}}>
      <Sidebar active={activeTab} onNav={setActiveTab} onLogout={() => setLoggedIn(false)} />
      <div style={{flex:1,overflow:'hidden'}}>
        {activeTab==='inbox'          && <InboxTab />}
        {activeTab==='spedisci'       && <SpedisciTab />}
        {activeTab==='clienti'        && <ClientiTab />}
        {activeTab==='collaboratori'  && <CollaboratoriTab />}
        {activeTab==='regolamento'    && <RegolamentoTab />}
      </div>
    </div>
  );
}
