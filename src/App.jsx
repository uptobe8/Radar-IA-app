import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'radar-cero-studies-v3'

const slug = (v='') => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
const esc = encodeURIComponent
const nowIso = () => new Date().toISOString()
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const REGIONAL = [
  ['andalucia','Andalucía · @rchivAWeb','https://www.juntadeandalucia.es/cultura/archivos/web_es/'],
  ['aragon','Aragón · DARA','https://dara.aragon.es/opac/app/simple/'],
  ['asturias','Asturias · Archivos de Asturias','https://archivosdeasturias.info/'],
  ['canarias','Canarias · Memoria Digital','https://mdc.ulpgc.es/'],
  ['cantabria','Cantabria · Archivo Histórico Provincial','https://cultura.cantabria.es/archivos'],
  ['clm','Castilla-La Mancha · Archivos','https://archivos.castillalamancha.es/'],
  ['cyl','Castilla y León · Archivos','https://archivoscastillayleon.jcyl.es/'],
  ['catalunya','Cataluña · Arxius en Línia','https://arxiusenlinia.cultura.gencat.cat/'],
  ['valencia','Comunitat Valenciana · SAVEX','https://savex.gva.es/'],
  ['extremadura','Extremadura · WAREX','https://archivosextremadura.gobex.es/'],
  ['galicia','Galicia · Arquivos de Galicia','https://arquivosdegalicia.xunta.gal/'],
  ['madrid','Madrid · Portal de Archivos','https://www.comunidad.madrid/servicios/cultura/archivos'],
  ['murcia','Murcia · Archivo General / Carmesí','https://archivogeneral.carm.es/'],
  ['navarra','Navarra · Archivo Abierto','https://archivoabierto.navarra.es/'],
  ['paisvasco','País Vasco · Dokuklik / Badator','https://dokuklik.euskadi.eus/'],
  ['larioja','La Rioja · Archivos','https://www.larioja.org/archivo/es']
]

const buildSources = (p) => {
  const full = [p.givenNames,p.surname1,p.surname2].filter(Boolean).join(' ')
  const surname = [p.surname1,p.surname2].filter(Boolean).join(' ')
  const place = [p.municipality,p.province].filter(Boolean).join(', ')
  const q = [full, place].filter(Boolean).join(' ')
  const y = Number(String(p.birthFrom||'').slice(0,4)) || null
  return [
    {id:'familysearch',name:'FamilySearch',type:'Repositorio oficial',priority:2,weight:.92,url:`https://www.familysearch.org/search/record/results?count=20&q.givenName=${esc(p.givenNames||'')}&q.surname=${esc(surname)}${place?`&q.birthLikePlace=${esc(place)}`:''}${y?`&q.birthLikeDate.from=${y-3}&q.birthLikeDate.to=${y+3}`:''}`},
    {id:'pares',name:'PARES · Portal de Archivos Españoles',type:'Archivo estatal',priority:1,weight:.95,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(q)}`},
    {id:'bne-hemeroteca',name:'BNE · Hemeroteca Digital',type:'Prensa histórica',priority:4,weight:.62,url:`https://hemerotecadigital.bne.es/hd/es/results?query=${esc('"'+full+'" '+place)}`},
    {id:'bne-digital',name:'BNE Digital',type:'Biblioteca digital',priority:2,weight:.72,url:`https://bdh.bne.es/bnesearch/Search.do?text=&field1val=${esc(q)}&field1Op=AND&numfields=1`},
    {id:'bne-linked',name:'Datos BNE · Linked Data',type:'Autoridades / RDF',priority:3,weight:.76,url:`https://datos.bne.es/`},
    {id:'hispana',name:'Hispana',type:'Agregador OAI-PMH',priority:2,weight:.78,url:`https://hispana.mcu.es/es/consulta/resultados.do?busq_palabra=${esc(q)}`},
    {id:'boe',name:'BOE · Gazeta histórica',type:'Diario oficial',priority:2,weight:.84,url:`https://www.boe.es/buscar/gazeta.php?campo%5B0%5D=TIT&dato%5B0%5D=${esc(full)}`},
    {id:'ign',name:'IGN / CartoCiudad',type:'Normalización geográfica',priority:3,weight:.8,url:`https://www.cartociudad.es/geocoder/api/geocoder/find?q=${esc(place||p.primaryPlace||'')}`},
    {id:'ine',name:'INE · Nomenclátor',type:'Normalización administrativa',priority:3,weight:.8,url:'https://www.ine.es/nomen2/index.do'},
    {id:'catastro',name:'Catastro',type:'Contexto territorial',priority:3,weight:.74,url:'https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCBusqueda.aspx'},
    {id:'defensa',name:'Biblioteca Virtual de Defensa',type:'Documentación militar',priority:2,weight:.86,url:`https://bibliotecavirtual.defensa.gob.es/BVMDefensa/es/consulta/resultados.do?busq_palabra=${esc(full)}`},
    {id:'nobleza',name:'Archivo Histórico de la Nobleza',type:'Archivo estatal',priority:1,weight:.94,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(surname)}`},
    {id:'censo-guia',name:'Censo-Guía de Archivos',type:'Descubrimiento de fuentes',priority:3,weight:.68,url:'https://censoarchivos.mcu.es/CensoGuia/portada.htm'},
    ...REGIONAL.map(([id,name,base])=>({id:`regional-${id}`,name,type:'Archivo regional',priority:2,weight:.82,url:base}))
  ]
}

async function fetchText(url){
  const attempts = [url, `https://r.jina.ai/${url}`]
  let last = ''
  for(const candidate of attempts){
    try{
      const r = await fetch(candidate,{headers:{Accept:'text/plain, text/html, application/json'}})
      if(!r.ok) throw new Error(`${r.status}`)
      const t = await r.text()
      if(t && t.length > 40) return {text:t,url}
    }catch(e){ last = e.message }
  }
  throw new Error(last || 'No accesible desde navegador')
}

function extractSnippets(text, person){
  const lines = text.replace(/<[^>]+>/g,' ').split(/\n|\r/).map(v=>v.replace(/\s+/g,' ').trim()).filter(v=>v.length>25)
  const tokens = [person.givenNames,person.surname1,person.surname2,person.municipality,person.province].filter(v=>v&&v.length>2).map(slug)
  const strong = [person.surname1,person.surname2].filter(Boolean).map(slug)
  const matches = lines.filter(line=>{
    const s=slug(line)
    const hits=tokens.filter(t=>s.includes(t)).length
    return hits>=2 && strong.some(t=>s.includes(t))
  })
  return [...new Set(matches)].slice(0,5)
}

function namesFromText(text){
  const out=[]
  const re=/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñü]+(?:\s+(?:de|del|la|las|los|y))?\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+){0,2})\b/g
  let m
  while((m=re.exec(text)) && out.length<12){
    const n=m[1].replace(/\s+/g,' ').trim()
    if(n.length<70 && !out.some(x=>slug(x)===slug(n))) out.push(n)
  }
  return out
}

function yearsFromText(text){
  return [...new Set((text.match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)||[]))].slice(0,10)
}

const blankForm={title:'',givenNames:'',surname1:'',surname2:'',sex:'',birthFrom:'',municipality:'',province:'',country:'España'}

export default function App(){
  const [studies,setStudies]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}})
  const [selected,setSelected]=useState(null)
  const [form,setForm]=useState(blankForm)
  const [tab,setTab]=useState('resumen')
  const [running,setRunning]=useState(false)
  const [progress,setProgress]=useState(0)
  const [status,setStatus]=useState('')

  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(studies)),[studies])
  useEffect(()=>{if(!selected&&studies[0])setSelected(studies[0].id)},[studies,selected])

  const study=studies.find(s=>s.id===selected)||null
  const updateStudy=(id,patch)=>setStudies(v=>v.map(s=>s.id===id?{...s,...patch,updatedAt:nowIso()}:s))

  const createStudy=(e)=>{
    e.preventDefault()
    if(!form.givenNames.trim()||!form.surname1.trim()) return
    const id=uid(); const rootId=uid()
    const root={id:rootId,canonicalName:[form.givenNames,form.surname1,form.surname2].filter(Boolean).join(' '),givenNames:form.givenNames,surname1:form.surname1,surname2:form.surname2,sex:form.sex,birthFrom:form.birthFrom,municipality:form.municipality,province:form.province,country:form.country,confidence:1,status:'accepted',isRoot:true,evidenceIds:[]}
    const s={id,title:form.title||`Estudio · ${root.canonicalName}`,status:'ready',mode:'autónomo',progress:0,createdAt:nowIso(),updatedAt:nowIso(),people:[root],relations:[],events:[],evidence:[],conflicts:[],runs:[],connectors:{},researchQueue:[rootId]}
    setStudies(v=>[s,...v]); setSelected(id); setForm(blankForm); setTab('resumen')
  }

  const runResearch=async()=>{
    if(!study||running) return
    setRunning(true); setProgress(0); setStatus('Preparando investigación…')
    const root=study.people.find(p=>p.isRoot)||study.people[0]
    const sources=buildSources(root)
    const newEvidence=[...study.evidence], newPeople=[...study.people], newEvents=[...study.events], newRuns=[]
    for(let i=0;i<sources.length;i++){
      const src=sources[i]; setStatus(`Consultando ${src.name}`); setProgress(Math.round((i/sources.length)*100))
      const started=nowIso()
      try{
        const {text}=await fetchText(src.url)
        const snippets=extractSnippets(text,root)
        let hits=0
        for(const snippet of snippets){
          const fingerprint=slug(`${src.id}|${snippet}`).slice(0,240)
          if(newEvidence.some(e=>e.semantic_fingerprint===fingerprint)) continue
          const ev={id:uid(),source:src.name,source_type:src.type,repository:src.name,external_id:'',record_type:'resultado documental',title:`Coincidencia para ${root.canonicalName}`,date:'',place:[root.municipality,root.province].filter(Boolean).join(', '),people:[root.canonicalName],relations:[],url:src.url,image_url:'',raw_metadata:{connector:src.id,priority:src.priority},raw_text:snippet,ocr_text:'',retrieved_at:nowIso(),source_weight:src.weight,hash:fingerprint,semantic_fingerprint:fingerprint,status:'detected',confidence:Math.min(.95,.45+src.weight*.35)}
          newEvidence.push(ev); hits++
          const years=yearsFromText(snippet)
          years.slice(0,2).forEach(y=>{if(!newEvents.some(x=>x.personId===root.id&&x.dateFrom===y&&x.sourceEvidenceId===ev.id))newEvents.push({id:uid(),personId:root.id,eventType:'mención documental',dateFrom:y,place:ev.place,confidence:ev.confidence,status:'detected',sourceEvidenceId:ev.id})})
          namesFromText(snippet).filter(n=>slug(n)!==slug(root.canonicalName)).slice(0,3).forEach(n=>{
            if(!newPeople.some(p=>slug(p.canonicalName)===slug(n))) newPeople.push({id:uid(),canonicalName:n,givenNames:n.split(' ')[0],surname1:n.split(' ').slice(1).join(' '),confidence:.35,status:'detected',isRoot:false,isCollateral:true,evidenceIds:[ev.id]})
          })
        }
        newRuns.push({id:uid(),sourceId:src.id,source:src.name,status:'ok',hits,startedAt:started,finishedAt:nowIso(),url:src.url})
      }catch(err){
        newRuns.push({id:uid(),sourceId:src.id,source:src.name,status:'unavailable',hits:0,error:String(err.message||err),startedAt:started,finishedAt:nowIso(),url:src.url})
      }
      await new Promise(r=>setTimeout(r,80))
    }
    const rootEvidence=newEvidence.filter(e=>e.people?.some(n=>slug(n)===slug(root.canonicalName)))
    const finalPeople=newPeople.map(p=>p.id===root.id?{...p,evidenceIds:[...new Set([...(p.evidenceIds||[]),...rootEvidence.map(e=>e.id)])]}:p)
    const conflicts=[]
    const years=newEvents.filter(e=>e.personId===root.id).map(e=>Number(e.dateFrom)).filter(Boolean)
    if(years.length>1&&Math.max(...years)-Math.min(...years)>100) conflicts.push({id:uid(),personId:root.id,type:'cronología amplia',severity:'medium',status:'open',payload:{years}})
    const completed=nowIso()
    updateStudy(study.id,{people:finalPeople,events:newEvents,evidence:newEvidence,runs:[...newRuns,...study.runs].slice(0,100),conflicts:[...conflicts,...study.conflicts],status:'completed',progress:100,lastResearchAt:completed})
    setProgress(100); setStatus(`Completado · ${newEvidence.length-study.evidence.length} evidencias nuevas`); setRunning(false); setTab('informe')
  }

  const sources=useMemo(()=>study?buildSources(study.people.find(p=>p.isRoot)||study.people[0]):[],[study])
  const deleteStudy=()=>{if(study&&confirm('¿Eliminar este estudio completo?')){setStudies(v=>v.filter(s=>s.id!==study.id));setSelected(null)}}

  return <div className="app-shell">
    <header className="topbar"><div><div className="brand">RADAR CERO</div><div className="subtitle">Investigación genealógica autónoma</div></div><span className="online">● ONLINE</span></header>
    <main>
      <section className="hero">
        <div><span className="eyebrow">EVIDENCIA → PERSONAS → EVENTOS → RELACIONES → ÁRBOL</span><h1>Genealogía con fuentes reales y trazabilidad.</h1><p>La aplicación consulta repositorios, conserva la procedencia de cada hallazgo y separa hechos, hipótesis y conflictos.</p></div>
        <div className="hero-badge"><strong>{studies.length}</strong><span>estudios guardados</span></div>
      </section>

      {!study && <section className="panel create-panel"><h2>Nuevo estudio</h2><form onSubmit={createStudy} className="form-grid">
        <label>Nombre del estudio<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Familia García López"/></label>
        <label>Nombre *<input required value={form.givenNames} onChange={e=>setForm({...form,givenNames:e.target.value})} placeholder="Juan"/></label>
        <label>Primer apellido *<input required value={form.surname1} onChange={e=>setForm({...form,surname1:e.target.value})} placeholder="García"/></label>
        <label>Segundo apellido<input value={form.surname2} onChange={e=>setForm({...form,surname2:e.target.value})} placeholder="López"/></label>
        <label>Sexo<select value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option value="">Sin especificar</option><option>Hombre</option><option>Mujer</option></select></label>
        <label>Nacimiento aproximado<input value={form.birthFrom} onChange={e=>setForm({...form,birthFrom:e.target.value})} placeholder="1888"/></label>
        <label>Municipio<input value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})} placeholder="Toledo"/></label>
        <label>Provincia<input value={form.province} onChange={e=>setForm({...form,province:e.target.value})} placeholder="Toledo"/></label>
        <button className="primary full" type="submit">Crear estudio e iniciar</button>
      </form></section>}

      <section className="workspace">
        <aside className="studies panel"><div className="panel-head"><h3>Estudios</h3><button className="iconbtn" onClick={()=>setSelected(null)}>＋</button></div>{studies.length===0?<p className="muted">Todavía no hay estudios.</p>:studies.map(s=><button key={s.id} className={`study-item ${s.id===selected?'active':''}`} onClick={()=>setSelected(s.id)}><strong>{s.title}</strong><span>{s.people?.[0]?.canonicalName}</span></button>)}</aside>

        {study && <section className="study-area">
          <div className="study-head panel"><div><span className="eyebrow">{study.mode}</span><h2>{study.title}</h2><p>{study.people.find(p=>p.isRoot)?.canonicalName}</p></div><div className="actions"><button className="primary" disabled={running} onClick={runResearch}>{running?'Investigando…':'Iniciar investigación automática'}</button><button className="danger" onClick={deleteStudy}>Eliminar</button></div></div>
          {(running||status)&&<div className="progress-wrap panel"><div className="progress-row"><span>{status}</span><strong>{progress}%</strong></div><div className="progress"><i style={{width:`${progress}%`}}/></div></div>}
          <nav className="tabs">{['resumen','fuentes','personas','evidencias','conflictos','informe'].map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?'active':''}>{t}</button>)}</nav>

          {tab==='resumen'&&<div className="dashboard-grid">
            {[['Personas',study.people.length],['Relaciones',study.relations.length],['Eventos',study.events.length],['Evidencias',study.evidence.length],['Conflictos',study.conflicts.length],['Fuentes',sources.length]].map(([k,v])=><div className="metric panel" key={k}><strong>{v}</strong><span>{k}</span></div>)}
            <div className="panel wide"><h3>Árbol actual</h3><div className="tree-root">{study.people.filter(p=>p.isRoot).map(p=><div key={p.id} className="person-node accepted"><strong>{p.canonicalName}</strong><span>{p.birthFrom||'fecha desconocida'} · {[p.municipality,p.province].filter(Boolean).join(', ')||'lugar desconocido'}</span><small>confianza {Math.round((p.confidence||0)*100)}%</small></div>)}{study.people.filter(p=>!p.isRoot).slice(0,10).map(p=><div key={p.id} className="person-node detected"><strong>{p.canonicalName}</strong><span>colateral detectado</span><small>confianza {Math.round((p.confidence||0)*100)}%</small></div>)}</div></div>
          </div>}

          {tab==='fuentes'&&<div className="cards">{sources.map(src=>{const run=study.runs.find(r=>r.sourceId===src.id);return <article className="source-card panel" key={src.id}><div><span className={`priority p${src.priority}`}>P{src.priority}</span><h3>{src.name}</h3><p>{src.type}</p></div><div className="source-foot"><span className={`status ${run?.status||'pending'}`}>{run?`${run.status} · ${run.hits} hallazgos`:'pendiente'}</span><a href={src.url} target="_blank" rel="noreferrer">Abrir fuente</a></div></article>})}</div>}

          {tab==='personas'&&<div className="cards">{study.people.map(p=><article className="panel person-card" key={p.id}><div className="row"><h3>{p.canonicalName}</h3><span className={`chip ${p.status}`}>{p.status}</span></div><p>{p.isRoot?'Persona raíz':p.isCollateral?'Colateral detectado':'Persona'}</p><p>Confianza: {Math.round((p.confidence||0)*100)}%</p><p>Evidencias: {(p.evidenceIds||[]).length}</p></article>)}</div>}

          {tab==='evidencias'&&<div className="evidence-list">{study.evidence.length===0?<div className="empty panel">Aún no hay evidencias. Ejecuta la investigación automática.</div>:study.evidence.map(e=><article className="panel evidence" key={e.id}><div className="row"><div><span className="eyebrow">{e.source}</span><h3>{e.title}</h3></div><span className="confidence">{Math.round((e.confidence||0)*100)}%</span></div><p>{e.raw_text}</p><div className="meta"><span>{e.place||'—'}</span><span>{new Date(e.retrieved_at).toLocaleString('es-ES')}</span></div><a className="evidence-link" href={e.url} target="_blank" rel="noreferrer">VER EVIDENCIA ↗</a></article>)}</div>}

          {tab==='conflictos'&&<div className="evidence-list">{study.conflicts.length===0?<div className="empty panel">No se han detectado conflictos todavía.</div>:study.conflicts.map(c=><article className="panel evidence" key={c.id}><span className="eyebrow">{c.severity}</span><h3>{c.type}</h3><pre>{JSON.stringify(c.payload,null,2)}</pre></article>)}</div>}

          {tab==='informe'&&<section className="panel report"><div className="report-title"><div><span className="eyebrow">INFORME DE INVESTIGACIÓN</span><h2>{study.title}</h2></div><span>{study.lastResearchAt?new Date(study.lastResearchAt).toLocaleString('es-ES'):'Sin ejecutar'}</span></div><div className="report-summary"><p><strong>Persona raíz:</strong> {study.people.find(p=>p.isRoot)?.canonicalName}</p><p><strong>Fuentes registradas:</strong> {sources.length}</p><p><strong>Fuentes consultadas:</strong> {study.runs.length}</p><p><strong>Evidencias recuperadas:</strong> {study.evidence.length}</p><p><strong>Personas detectadas:</strong> {study.people.length}</p><p><strong>Eventos extraídos:</strong> {study.events.length}</p><p><strong>Conflictos:</strong> {study.conflicts.length}</p></div><h3>Trazabilidad</h3>{study.runs.length===0?<p className="muted">Ejecuta la investigación para generar el informe.</p>:study.runs.map(r=><div className="report-run" key={r.id}><span>{r.source}</span><span>{r.status}</span><strong>{r.hits} hallazgos</strong></div>)}<h3>Evidencias destacadas</h3>{study.evidence.slice(0,12).map(e=><div className="report-evidence" key={e.id}><strong>{e.source}</strong><p>{e.raw_text}</p><a href={e.url} target="_blank" rel="noreferrer">Ver documento original</a></div>)}</section>}
        </section>}
      </section>
    </main>
    <footer>Radar Cero · Los datos colaborativos se tratan como hipótesis hasta quedar respaldados por documentación independiente.</footer>
  </div>
}
