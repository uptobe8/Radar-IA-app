import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY='radar-cero-simple-v1'

const SOURCES=[
  {id:'familysearch',name:'FamilySearch',url:'https://www.familysearch.org/search/record/results',kind:'Registros genealógicos'},
  {id:'pares',name:'PARES',url:'https://pares.mcu.es/ParesBusquedas20/catalogo/search',kind:'Archivos estatales'},
  {id:'bne',name:'BNE Hemeroteca',url:'https://hemerotecadigital.bne.es/hd/es/advancedsearch',kind:'Prensa histórica'},
  {id:'hispana',name:'Hispana',url:'https://hispana.mcu.es/es/consulta/busqueda.do',kind:'Patrimonio digital'},
  {id:'boe',name:'BOE Gazeta',url:'https://www.boe.es/buscar/gazeta.php',kind:'Diarios oficiales'},
  {id:'ign',name:'IGN',url:'https://www.ign.es/web/ign/portal',kind:'Toponimia y geografía'},
  {id:'catastro',name:'Catastro',url:'https://www.sedecatastro.gob.es/',kind:'Contexto territorial'}
]

const blankPerson={givenNames:'',surname1:'',surname2:'',birthDate:'',place:'',sex:'M'}
const blankEvidence={sourceId:'familysearch',title:'',date:'',place:'',people:'',relation:'',url:'',notes:''}

const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`
const fullName=p=>[p?.givenNames,p?.surname1,p?.surname2].filter(Boolean).join(' ').trim()
const normalize=s=>(s||'').trim()

function makeQueries(person){
  const name=fullName(person)
  const surname=[person.surname1,person.surname2].filter(Boolean).join(' ')
  const place=normalize(person.place)
  const birth=normalize(person.birthDate)
  return SOURCES.map(source=>{
    let query=`"${name}"`
    if(source.id==='familysearch') query=[name,birth,place].filter(Boolean).join(' · ')
    if(source.id==='pares') query=[name,surname,place].filter(Boolean).join(' · ')
    if(source.id==='bne') query=[`"${name}"`,place].filter(Boolean).join(' + ')
    if(source.id==='hispana') query=[name,place].filter(Boolean).join(' + ')
    if(source.id==='boe') query=`"${name}"`
    if(source.id==='ign') query=place||'Localidad de la persona'
    if(source.id==='catastro') query=place||'Localidad / dirección'
    return {...source,query}
  })
}

function groupedEvidence(evidence){
  return SOURCES.map(source=>({source,count:evidence.filter(e=>e.sourceId===source.id).length})).filter(x=>x.count)
}

export default function SimpleRadar(){
  const [study,setStudy]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||null}catch{return null}})
  const [person,setPerson]=useState(blankPerson)
  const [tab,setTab]=useState('estudio')
  const [evidenceForm,setEvidenceForm]=useState(blankEvidence)
  const [notice,setNotice]=useState('')

  useEffect(()=>{
    if(study)localStorage.setItem(STORAGE_KEY,JSON.stringify(study))
    else localStorage.removeItem(STORAGE_KEY)
  },[study])

  const queries=useMemo(()=>study?makeQueries(study.person):[],[study])
  const groups=useMemo(()=>groupedEvidence(study?.evidence||[]),[study])

  function createStudy(e){
    e.preventDefault()
    if(!person.givenNames.trim()||!person.surname1.trim())return
    setStudy({id:uid(),createdAt:new Date().toISOString(),person:{...person},evidence:[]})
    setTab('fuentes')
    setNotice('Estudio creado. Ya puedes consultar las fuentes oficiales.')
  }

  async function copyQuery(query){
    try{await navigator.clipboard.writeText(query);setNotice('Búsqueda copiada.')}catch{setNotice('Mantén pulsado sobre la búsqueda para copiarla.')}
  }

  function addEvidence(e){
    e.preventDefault()
    if(!evidenceForm.title.trim()||!evidenceForm.url.trim())return
    const item={...evidenceForm,id:uid(),createdAt:new Date().toISOString(),title:evidenceForm.title.trim(),url:evidenceForm.url.trim(),people:evidenceForm.people.split(',').map(x=>x.trim()).filter(Boolean)}
    setStudy(s=>({...s,evidence:[item,...s.evidence]}))
    setEvidenceForm(blankEvidence)
    setNotice('Evidencia guardada con su fuente y URL.')
  }

  function removeEvidence(id){
    setStudy(s=>({...s,evidence:s.evidence.filter(e=>e.id!==id)}))
  }

  function newStudy(){
    setStudy(null);setPerson(blankPerson);setEvidenceForm(blankEvidence);setTab('estudio');setNotice('')
  }

  return <div className="app-shell simple-radar">
    <header className="topbar"><div><div className="brand">RADAR CERO</div><div className="subtitle">Investigación genealógica simple y verificable</div></div><span className="online">● GUARDADO LOCAL</span></header>
    <main>
      <section className="hero simple-hero"><div><span className="eyebrow">FUENTES OFICIALES · EVIDENCIAS · INFORME</span><h1>Investiga sin inventar resultados.</h1><p>Crea una persona, abre búsquedas preparadas en fuentes oficiales y guarda únicamente las evidencias que puedas verificar.</p></div></section>

      {notice&&<div className="simple-notice">{notice}</div>}

      {!study?<section className="panel create-panel">
        <h2>Nuevo estudio</h2>
        <form onSubmit={createStudy} className="form-grid">
          <label>Nombre<input required value={person.givenNames} onChange={e=>setPerson({...person,givenNames:e.target.value})}/></label>
          <label>Primer apellido<input required value={person.surname1} onChange={e=>setPerson({...person,surname1:e.target.value})}/></label>
          <label>Segundo apellido<input value={person.surname2} onChange={e=>setPerson({...person,surname2:e.target.value})}/></label>
          <label>Sexo<select value={person.sex} onChange={e=>setPerson({...person,sex:e.target.value})}><option value="M">Hombre</option><option value="F">Mujer</option><option value="">Sin indicar</option></select></label>
          <label>Fecha de nacimiento<input placeholder="20/01/1981" value={person.birthDate} onChange={e=>setPerson({...person,birthDate:e.target.value})}/></label>
          <label>Lugar<input placeholder="Madrid" value={person.place} onChange={e=>setPerson({...person,place:e.target.value})}/></label>
          <button className="primary full" type="submit">CREAR ESTUDIO</button>
        </form>
      </section>:<>
        <section className="panel simple-study-head">
          <div><span className="eyebrow">ESTUDIO ACTIVO</span><h2>{fullName(study.person)}</h2><p>{study.person.birthDate||'Fecha no indicada'} · {study.person.place||'Lugar no indicado'} · {study.person.sex==='M'?'Hombre':study.person.sex==='F'?'Mujer':'Sexo no indicado'}</p></div>
          <button className="danger" onClick={newStudy}>Nuevo estudio</button>
        </section>

        <nav className="simple-tabs">
          {['estudio','fuentes','evidencias','informe'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}
        </nav>

        {tab==='estudio'&&<section className="panel report">
          <h2>{fullName(study.person)}</h2>
          <div className="report-summary"><p><b>Nacimiento</b><br/>{study.person.birthDate||'—'}</p><p><b>Lugar</b><br/>{study.person.place||'—'}</p><p><b>Evidencias</b><br/>{study.evidence.length}</p></div>
          <p className="muted">La aplicación no acepta coincidencias automáticamente. Solo entran en el informe las evidencias guardadas con una URL verificable.</p>
        </section>}

        {tab==='fuentes'&&<section className="cards">
          {queries.map(q=><article className="panel source-card" key={q.id}>
            <span className="priority">FUENTE OFICIAL</span>
            <h3>{q.name}</h3><p>{q.kind}</p>
            <div className="simple-query">{q.query}</div>
            <div className="source-foot"><button className="simple-secondary" onClick={()=>copyQuery(q.query)}>Copiar búsqueda</button><a className="evidence-link" href={q.url} target="_blank" rel="noreferrer">ABRIR FUENTE</a></div>
          </article>)}
        </section>}

        {tab==='evidencias'&&<section className="simple-two-col">
          <form className="panel evidence-form" onSubmit={addEvidence}>
            <h2>Guardar evidencia</h2>
            <label>Fuente<select value={evidenceForm.sourceId} onChange={e=>setEvidenceForm({...evidenceForm,sourceId:e.target.value})}>{SOURCES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Título / tipo de documento<input required value={evidenceForm.title} onChange={e=>setEvidenceForm({...evidenceForm,title:e.target.value})} placeholder="Registro de matrimonio"/></label>
            <label>Fecha<input value={evidenceForm.date} onChange={e=>setEvidenceForm({...evidenceForm,date:e.target.value})} placeholder="14/06/1911"/></label>
            <label>Lugar<input value={evidenceForm.place} onChange={e=>setEvidenceForm({...evidenceForm,place:e.target.value})} placeholder="Toledo"/></label>
            <label>Personas relacionadas<input value={evidenceForm.people} onChange={e=>setEvidenceForm({...evidenceForm,people:e.target.value})} placeholder="Pedro García, María López"/></label>
            <label>Parentesco / evento<input value={evidenceForm.relation} onChange={e=>setEvidenceForm({...evidenceForm,relation:e.target.value})} placeholder="Padre / matrimonio / defunción"/></label>
            <label>URL del documento<input required inputMode="url" value={evidenceForm.url} onChange={e=>setEvidenceForm({...evidenceForm,url:e.target.value})} placeholder="https://..."/></label>
            <label>Notas<textarea value={evidenceForm.notes} onChange={e=>setEvidenceForm({...evidenceForm,notes:e.target.value})} placeholder="Dato exacto observado en el documento"/></label>
            <button className="primary" type="submit">GUARDAR EVIDENCIA</button>
          </form>
          <div className="evidence-list">
            {study.evidence.length===0?<div className="panel empty">Aún no hay evidencias guardadas.</div>:study.evidence.map(ev=>{
              const source=SOURCES.find(s=>s.id===ev.sourceId)
              return <article className="panel evidence" key={ev.id}><span className="confidence">VERIFICABLE</span><h3>{ev.title}</h3><p>{source?.name||ev.sourceId} · {ev.date||'sin fecha'} · {ev.place||'sin lugar'}</p>{ev.relation&&<p><b>{ev.relation}</b></p>}{ev.people?.length>0&&<p>Personas: {ev.people.join(', ')}</p>}{ev.notes&&<p>{ev.notes}</p>}<a className="evidence-link" href={ev.url} target="_blank" rel="noreferrer">VER EVIDENCIA</a><button className="simple-delete" onClick={()=>removeEvidence(ev.id)}>Eliminar</button></article>
            })}
          </div>
        </section>}

        {tab==='informe'&&<section className="panel report">
          <div className="report-title"><div><span className="eyebrow">INFORME</span><h2>{fullName(study.person)}</h2></div><span>{study.evidence.length} evidencias verificables</span></div>
          <div className="report-summary"><p><b>Fecha de nacimiento</b><br/>{study.person.birthDate||'—'}</p><p><b>Lugar</b><br/>{study.person.place||'—'}</p><p><b>Sexo</b><br/>{study.person.sex==='M'?'Hombre':study.person.sex==='F'?'Mujer':'—'}</p></div>
          <h3>Fuentes con evidencias</h3>
          {groups.length===0?<p className="muted">Todavía no hay documentación verificable guardada. El informe no inventará coincidencias.</p>:groups.map(g=><div className="report-run" key={g.source.id}><strong>{g.source.name}</strong><span>{g.count} evidencia{g.count===1?'':'s'}</span></div>)}
          <h3>Evidencias</h3>
          {study.evidence.map(ev=><div className="report-evidence" key={ev.id}><strong>{ev.title}</strong><p>{SOURCES.find(s=>s.id===ev.sourceId)?.name} · {ev.date||'sin fecha'} · {ev.place||'sin lugar'}{ev.relation?` · ${ev.relation}`:''}</p><a href={ev.url} target="_blank" rel="noreferrer">VER EVIDENCIA</a></div>)}
        </section>}
      </>}
    </main>
  </div>
}
