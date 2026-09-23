import { useEffect, useMemo, useRef, useState } from 'react'
import { buildSourceRegistry, buildResearchPlan, SOURCE_PRIORITIES } from './services/sourceRegistry.js'
import {
  uid,
  nowIso,
  slug,
  fetchSourceText,
  extractCandidateRecords,
  evidenceFromCandidate,
  expandPeopleQueue,
  eventsFromEvidence,
  relationsFromEvidence,
  assessPersonStatus,
  dedupeEvidence
} from './services/genealogyEngine.js'

const STORAGE_KEY='radar-cero-studies-v5'
const blankForm={title:'',givenNames:'',surname1:'',surname2:'',sex:'',birthFrom:'',municipality:'',province:'',country:'España'}
const SCREENS=['resumen','investigacion','fuentes','personas','arbol','eventos','relaciones','evidencias','lugares','conflictos','informe']
const LABELS={resumen:'Resumen',investigacion:'Investigación',fuentes:'Fuentes',personas:'Personas',arbol:'Árbol',eventos:'Eventos',relaciones:'Relaciones',evidencias:'Evidencias',lugares:'Lugares',conflictos:'Conflictos',informe:'Informe'}

const rootName=p=>[p?.givenNames,p?.surname1,p?.surname2].filter(Boolean).join(' ').trim()
const rootPlace=p=>[p?.municipality,p?.province].filter(Boolean).join(', ')
const percent=n=>`${Math.round((Number(n)||0)*100)}%`

function parseIgn(text,person){
  try{
    const data=JSON.parse(text)
    const arr=Array.isArray(data)?data:(Array.isArray(data?.results)?data.results:[data])
    return arr.slice(0,5).filter(Boolean).map(x=>({
      id:uid(),source:'IGN / CartoCiudad',name:x.address||x.name||x.municipality||person.municipality||'',
      municipality:x.municipality||person.municipality||'',province:x.province||person.province||'',
      lat:x.lat??x.latitude??x.y??null,lon:x.lng??x.lon??x.longitude??x.x??null,raw:x
    }))
  }catch{return []}
}

function detectConflicts(events=[]){
  const out=[]
  const byKey=new Map()
  for(const e of events){
    const key=`${e.personId}|${e.eventType}`
    if(!byKey.has(key))byKey.set(key,[])
    byKey.get(key).push(e)
  }
  for(const [key,list] of byKey){
    const years=[...new Set(list.map(e=>Number(e.dateFrom)).filter(Boolean))].sort((a,b)=>a-b)
    if(years.length>1&&years.at(-1)-years[0]>5){
      out.push({id:uid(),type:'cronología incompatible',severity:'high',status:'open',payload:{key,years,evidenceIds:[...new Set(list.flatMap(e=>e.evidenceIds||[]))]}})
    }
  }
  return out
}

function SourceStatus({run}){
  const state=run?.status||'activo'
  return <span className={`status ${state}`}>{state}</span>
}

export default function RadarCeroV2(){
  const [studies,setStudies]=useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}})
  const [selected,setSelected]=useState(null)
  const [form,setForm]=useState(blankForm)
  const [screen,setScreen]=useState('resumen')
  const [running,setRunning]=useState(false)
  const [progress,setProgress]=useState(0)
  const [status,setStatus]=useState('')
  const autoStarted=useRef(new Set())

  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(studies)),[studies])
  useEffect(()=>{if(!selected&&studies[0])setSelected(studies[0].id)},[studies,selected])

  const study=studies.find(s=>s.id===selected)||null
  const root=study?.people?.find(p=>p.isRoot)||study?.people?.[0]||null
  const registry=useMemo(()=>root?buildSourceRegistry(root):[],[root?.id,root?.canonicalName,root?.birthFrom,root?.municipality,root?.province])
  const plan=useMemo(()=>root?buildResearchPlan(root,registry):[],[root?.id,registry])

  const replaceStudy=(id,next)=>setStudies(v=>v.map(s=>s.id===id?next:s))

  function createStudy(e){
    e.preventDefault()
    if(!form.givenNames.trim()||!form.surname1.trim())return
    const person={id:uid(),canonicalName:[form.givenNames,form.surname1,form.surname2].filter(Boolean).join(' ').trim(),givenNames:form.givenNames.trim(),surname1:form.surname1.trim(),surname2:form.surname2.trim(),sex:form.sex,birthFrom:form.birthFrom.trim(),municipality:form.municipality.trim(),province:form.province.trim(),country:form.country.trim()||'España',confidence:1,status:'accepted',isRoot:true,isCollateral:false,evidenceIds:[]}
    const s={id:uid(),title:form.title.trim()||`Estudio · ${person.canonicalName}`,status:'queued',mode:'autónomo',progress:0,createdAt:nowIso(),updatedAt:nowIso(),people:[person],relations:[],events:[],evidence:[],conflicts:[],runs:[],places:[],researchQueue:[person.id],lastConclusion:'',lastResearchAt:null}
    setStudies(v=>[s,...v]);setSelected(s.id);setForm(blankForm);setScreen('investigacion')
  }

  async function runResearch(forcedStudy=study){
    if(!forcedStudy||running)return
    setRunning(true);setProgress(1);setStatus('Preparando investigación multifuente…');setScreen('investigacion')
    const working=structuredClone(forcedStudy)
    const people=[...(working.people||[])]
    const evidence=[...(working.evidence||[])]
    const events=[...(working.events||[])]
    const relations=[...(working.relations||[])]
    const places=[...(working.places||[])]
    const runs=[]
    const queue=[...(working.researchQueue||people.map(p=>p.id))]
    const processed=new Set()
    let operations=0
    const maxPeople=18
    const maxOperations=120

    while(queue.length&&processed.size<maxPeople&&operations<maxOperations){
      const personId=queue.shift()
      if(processed.has(personId))continue
      const person=people.find(p=>p.id===personId)
      if(!person)continue
      processed.add(personId)
      const sources=buildSourceRegistry(person).filter(s=>s.enabled&&s.relevant)
      const personPlan=buildResearchPlan(person,sources)
      const queryBySource=new Map(personPlan.map(q=>[q.sourceId,q.query]))

      for(const source of sources){
        if(operations>=maxOperations)break
        operations++
        const startedAt=nowIso()
        const sourceQuery=queryBySource.get(source.id)||rootName(person)
        setStatus(`${source.name} · ${rootName(person)}`)
        setProgress(Math.min(96,Math.round(5+(operations/maxOperations)*90)))

        if(['source_discovery_only','user_document_or_authorized_request'].includes(source.method)){
          runs.push({id:uid(),personId,sourceId:source.id,source:source.name,status:'descubrimiento',method:source.method,query:sourceQuery,hits:0,verifiedHits:0,url:source.url,startedAt,finishedAt:nowIso()})
          continue
        }
        if(source.method==='hint_only'){
          runs.push({id:uid(),personId,sourceId:source.id,source:source.name,status:'hipótesis',method:source.method,query:sourceQuery,hits:0,verifiedHits:0,url:source.url,startedAt,finishedAt:nowIso()})
          continue
        }

        try{
          const {text,via}=await fetchSourceText(source,sourceQuery)
          if(source.id==='ign'){
            const found=parseIgn(text,person)
            for(const p of found)if(!places.some(x=>slug(x.name)===slug(p.name)&&slug(x.province)===slug(p.province)))places.push(p)
            runs.push({id:uid(),personId,sourceId:source.id,source:source.name,status:'ok',method:source.method,query:sourceQuery,hits:found.length,verifiedHits:0,contextHits:found.length,url:source.url,via,startedAt,finishedAt:nowIso()})
            continue
          }

          const candidates=extractCandidateRecords(text,person,source)
          let verifiedHits=0
          for(const candidate of candidates){
            const ev=evidenceFromCandidate(candidate,person,source)
            if(!ev)continue
            ev.id=uid()
            ev.raw_metadata={...(ev.raw_metadata||{}),priority:source.priority,query:sourceQuery,subjectPersonId:person.id}
            if(evidence.some(x=>x.semantic_fingerprint===ev.semantic_fingerprint||x.hash===ev.hash))continue
            evidence.push(ev);verifiedHits++
            person.evidenceIds=[...new Set([...(person.evidenceIds||[]),ev.id])]

            const discovered=expandPeopleQueue(people,ev.relations,person)
            for(const p of discovered){people.push(p);queue.push(p.id)}
            for(const rel of relationsFromEvidence(ev,person,people))if(!relations.some(r=>r.personA===rel.personA&&r.personB===rel.personB&&r.relationType===rel.relationType))relations.push(rel)
            for(const evt of eventsFromEvidence(ev,person.id))if(!events.some(e=>e.personId===evt.personId&&e.eventType===evt.eventType&&e.dateFrom===evt.dateFrom&&e.sourceEvidenceId===evt.sourceEvidenceId))events.push(evt)
          }
          runs.push({id:uid(),personId,sourceId:source.id,source:source.name,status:'ok',method:source.method,query:sourceQuery,hits:candidates.length,verifiedHits,url:source.url,via,startedAt,finishedAt:nowIso()})
        }catch(err){
          runs.push({id:uid(),personId,sourceId:source.id,source:source.name,status:'no accesible',method:source.method,query:sourceQuery,hits:0,verifiedHits:0,url:source.url,error:String(err?.message||err),startedAt,finishedAt:nowIso()})
        }
      }
    }

    const cleanEvidence=dedupeEvidence(evidence)
    for(const p of people){Object.assign(p,assessPersonStatus(p,cleanEvidence))}
    const conflicts=detectConflicts(events)
    const acceptedRelations=relations.filter(r=>r.evidenceIds?.length||r.sourceEvidenceId)
    const rootEvidence=cleanEvidence.filter(e=>e.raw_metadata?.subjectPersonId===root?.id||e.people?.some(n=>slug(n)===slug(root?.canonicalName||'')))
    const conclusion=rootEvidence.length
      ?`${rootEvidence.length} evidencias documentales superan el filtro de identidad para ${root?.canonicalName}. Se han detectado ${people.length-1} personas relacionadas y ${acceptedRelations.length} relaciones trazables.`
      :`No se ha atribuido ningún documento a ${root?.canonicalName} sin evidencia suficiente. Las coincidencias débiles se han descartado.`

    const next={...working,people,relations:acceptedRelations,events,evidence:cleanEvidence,conflicts,places,runs:[...runs,...(working.runs||[])].slice(0,600),researchQueue:queue,status:'completed',progress:100,lastResearchAt:nowIso(),updatedAt:nowIso(),lastConclusion:conclusion}
    replaceStudy(working.id,next)
    setProgress(100);setStatus('Investigación completada');setRunning(false);setScreen('informe')
  }

  useEffect(()=>{
    if(study?.status==='queued'&&!running&&!autoStarted.current.has(study.id)){
      autoStarted.current.add(study.id)
      const timer=setTimeout(()=>runResearch(study),50)
      return()=>clearTimeout(timer)
    }
  },[study?.id,study?.status])

  function deleteStudy(){
    if(!study)return
    if(confirm('¿Eliminar este estudio completo?')){setStudies(v=>v.filter(s=>s.id!==study.id));setSelected(null);setScreen('resumen')}
  }

  const latestRuns=study?.runs||[]
  const latestFor=sourceId=>latestRuns.find(r=>r.sourceId===sourceId)
  const personName=id=>study?.people.find(p=>p.id===id)?.canonicalName||'—'
  const evidenceById=id=>study?.evidence.find(e=>e.id===id)
  const metric=(label,value)=><div className="panel metric"><strong>{value}</strong><span>{label}</span></div>

  return <div className="app-shell">
    <header className="topbar"><div><div className="brand">RADAR CERO</div><div className="subtitle">Investigación genealógica automática con trazabilidad documental</div></div><span className="online">● ONLINE</span></header>
    <main>
      <section className="hero"><div><span className="eyebrow">FUENTES REALES → EVIDENCIA → IDENTIDAD → ÁRBOL</span><h1>Investiga una persona. Radar Cero construye el expediente.</h1><p>Consulta fuentes, valida identidades, extrae personas, eventos y parentescos, expande familiares y conserva siempre el documento de origen.</p></div><div className="hero-badge"><strong>{studies.length}</strong><span>estudios guardados</span></div></section>

      {!study&&<section className="panel create-panel"><h2>Nuevo estudio</h2><p className="muted">Introduce la persona raíz. La investigación comienza automáticamente.</p><form onSubmit={createStudy} className="form-grid">
        <label>Nombre del estudio<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
        <label>Nombre<input required value={form.givenNames} onChange={e=>setForm({...form,givenNames:e.target.value})}/></label>
        <label>Primer apellido<input required value={form.surname1} onChange={e=>setForm({...form,surname1:e.target.value})}/></label>
        <label>Segundo apellido<input value={form.surname2} onChange={e=>setForm({...form,surname2:e.target.value})}/></label>
        <label>Sexo<select value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option value="">Sin indicar</option><option value="M">Hombre</option><option value="F">Mujer</option></select></label>
        <label>Nacimiento aproximado<input inputMode="numeric" value={form.birthFrom} onChange={e=>setForm({...form,birthFrom:e.target.value})} placeholder="1888"/></label>
        <label>Municipio<input value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})} placeholder="Toledo"/></label>
        <label>Provincia<input value={form.province} onChange={e=>setForm({...form,province:e.target.value})} placeholder="Toledo"/></label>
        <button className="primary full" type="submit">CREAR ESTUDIO E INVESTIGAR</button>
      </form></section>}

      <div className="workspace">
        <aside className="panel studies"><div className="panel-head"><h3>Estudios</h3><button className="iconbtn" onClick={()=>setSelected(null)}>+</button></div>{studies.length===0?<p className="muted">Todavía no hay estudios.</p>:studies.map(s=><button key={s.id} className={`study-item ${selected===s.id?'active':''}`} onClick={()=>{setSelected(s.id);setScreen('resumen')}}><strong>{s.title}</strong><span>{s.status} · {s.people.length} personas · {s.evidence.length} evidencias</span></button>)}</aside>

        <section className="study-area">
          {!study?<div className="panel empty">Crea un estudio o selecciona uno existente.</div>:<>
            <div className="panel study-head"><div><span className="eyebrow">EXPEDIENTE AUTÓNOMO</span><h2>{study.title}</h2><p>{rootName(root)} · {root?.birthFrom||'fecha desconocida'} · {rootPlace(root)||'lugar desconocido'}</p></div><div className="actions"><button className="primary" disabled={running} onClick={()=>runResearch(study)}>{running?'Investigando…':'Reinvestigar'}</button><button className="danger" onClick={deleteStudy}>Eliminar</button></div></div>
            <div className="panel progress-wrap"><div className="progress-row"><span>{status||study.lastConclusion||'Preparado'}</span><strong>{running?progress:study.progress||0}%</strong></div><div className="progress"><i style={{width:`${running?progress:study.progress||0}%`}}/></div></div>
            <div className="tabs">{SCREENS.map(s=><button key={s} className={screen===s?'active':''} onClick={()=>setScreen(s)}>{LABELS[s]}</button>)}</div>

            {screen==='resumen'&&<div className="dashboard-grid">
              {metric('personas',study.people.length)}{metric('relaciones',study.relations.length)}{metric('eventos',study.events.length)}{metric('evidencias',study.evidence.length)}{metric('conflictos',study.conflicts.length)}{metric('fuentes activas',registry.filter(s=>s.enabled).length)}
              <div className="panel wide"><h3>Estado del expediente</h3><p>{study.lastConclusion||'La investigación aún no ha terminado.'}</p><div className="meta"><span>{plan.length} consultas planificadas</span><span>{latestRuns.length} ejecuciones registradas</span><span>{study.places.length} lugares normalizados</span></div></div>
            </div>}

            {screen==='investigacion'&&<div className="evidence-list">
              <div className="panel"><h3>Pipeline automático</h3><p>Consultar fuentes → recuperar documentos/metadatos → extraer personas, fechas, lugares y parentescos → comparar identidades → guardar evidencias → expandir familiares → construir árbol.</p><div className="meta"><span>{processedLabel(study,running)}</span><span>{plan.length} consultas iniciales</span></div></div>
              {latestRuns.length===0?<div className="panel empty">La ejecución comenzará automáticamente.</div>:latestRuns.slice(0,120).map(r=><div className="panel evidence" key={r.id}><h3>{r.source}</h3><p>{personName(r.personId)} · {r.query||'consulta de fuente'}</p><div className="meta"><span>{r.status}</span><span>{r.method}</span><span>{r.verifiedHits||0} evidencias</span><span>{r.hits||0} candidatos</span></div>{r.error&&<p className="muted">{r.error}</p>}</div>)}
            </div>}

            {screen==='fuentes'&&<div className="cards">{registry.map(src=>{const run=latestFor(src.id);return <div className="panel source-card" key={src.id}><span className={`priority p${src.priority}`}>P{src.priority} · {SOURCE_PRIORITIES[src.priority]}</span><h3>{src.name}</h3><p>{src.type}</p><p><strong>Método:</strong> {src.method}</p><p><strong>Conector:</strong> {src.adapter||'integrado'}</p><div className="source-foot"><SourceStatus run={run}/><span>{run?.verifiedHits||0} evidencias</span><a href={src.url} target="_blank" rel="noreferrer">Abrir fuente</a></div></div>})}</div>}

            {screen==='personas'&&<div className="cards">{study.people.map(p=><div className="panel person-card" key={p.id}><span className={`chip ${p.status}`}>{p.status}</span><h3>{p.canonicalName}</h3><p>{p.isRoot?'Persona raíz':p.isCollateral?'Colateral':'Familiar detectado'}</p><p>{p.birthFrom||'fecha por determinar'} · {[p.municipality,p.province].filter(Boolean).join(', ')||'lugar por determinar'}</p><div className="meta"><span>confianza {percent(p.confidence)}</span><span>{p.evidenceIds?.length||0} evidencias</span></div></div>)}</div>}

            {screen==='arbol'&&<div className="panel"><h3>Árbol documentado</h3><div className="tree-root">{study.people.map(p=><div className={`person-node ${p.status}`} key={p.id}><strong>{p.canonicalName}</strong><span>{p.isRoot?'RAÍZ':p.discoveredVia||'RELACIONADO'}</span><small>{percent(p.confidence)} · {p.evidenceIds?.length||0} evidencias</small>{p.evidenceIds?.[0]&&<button className="evidence-link" onClick={()=>setScreen('evidencias')}>VER EVIDENCIA</button>}</div>)}</div>{study.relations.length>0&&<div className="evidence-list">{study.relations.map(r=><div className="report-run" key={r.id}><strong>{personName(r.personA)} → {r.relationType} → {personName(r.personB)}</strong><span>{percent(r.confidence)}</span><button className="evidence-link" onClick={()=>setScreen('evidencias')}>VER EVIDENCIA</button></div>)}</div>}</div>}

            {screen==='eventos'&&<div className="evidence-list">{study.events.length===0?<div className="panel empty">No hay eventos documentales validados todavía.</div>:study.events.sort((a,b)=>String(a.dateFrom).localeCompare(String(b.dateFrom))).map(e=><div className="panel evidence" key={e.id}><h3>{e.dateFrom||'sin fecha'} · {e.eventType}</h3><p>{personName(e.personId)} · {e.place||'sin lugar'}</p><div className="meta"><span>{percent(e.confidence)}</span></div>{e.sourceEvidenceId&&<button className="evidence-link" onClick={()=>setScreen('evidencias')}>VER EVIDENCIA</button>}</div>)}</div>}

            {screen==='relaciones'&&<div className="evidence-list">{study.relations.length===0?<div className="panel empty">No hay parentescos suficientemente sustentados todavía.</div>:study.relations.map(r=><div className="panel evidence" key={r.id}><h3>{personName(r.personA)} → {r.relationType} → {personName(r.personB)}</h3><div className="meta"><span>confianza {percent(r.confidence)}</span><span>{r.status}</span></div>{r.sourceEvidenceId&&<button className="evidence-link" onClick={()=>setScreen('evidencias')}>VER EVIDENCIA</button>}</div>)}</div>}

            {screen==='evidencias'&&<div className="evidence-list">{study.evidence.length===0?<div className="panel empty">No hay evidencias validadas. Los resultados ambiguos no se convierten en hechos.</div>:study.evidence.map(e=><div className="panel evidence" key={e.id}><span className="confidence">{percent(e.raw_metadata?.identity_score||e.source_weight)}</span><h3>{e.title}</h3><div className="meta"><span>{e.source}</span><span>{e.repository}</span><span>{e.record_type}</span><span>{e.external_id||'sin ID externo'}</span></div><p>{e.date||'sin fecha'} · {e.place||'sin lugar'}</p><p>{e.raw_text}</p>{e.relations?.length>0&&<p><strong>Relaciones:</strong> {e.relations.map(r=>`${r.relation}: ${r.name}`).join(' · ')}</p>}<a className="evidence-link" href={e.url} target="_blank" rel="noreferrer">VER EVIDENCIA ORIGINAL</a></div>)}</div>}

            {screen==='lugares'&&<div className="cards">{study.places.length===0?<div className="panel empty">Todavía no hay lugares normalizados por IGN.</div>:study.places.map(p=><div className="panel" key={p.id}><h3>{p.name||p.municipality}</h3><p>{p.municipality} · {p.province}</p><div className="meta"><span>{p.lat??'—'}, {p.lon??'—'}</span><span>{p.source}</span></div></div>)}</div>}

            {screen==='conflictos'&&<div className="evidence-list">{study.conflicts.length===0?<div className="panel empty">No hay conflictos detectados.</div>:study.conflicts.map(c=><div className="panel evidence" key={c.id}><h3>{c.type}</h3><p>{c.severity} · {c.status}</p><pre>{JSON.stringify(c.payload,null,2)}</pre></div>)}</div>}

            {screen==='informe'&&<div className="panel report"><div className="report-title"><div><span className="eyebrow">INFORME DE INVESTIGACIÓN</span><h2>{study.title}</h2></div><span>{study.lastResearchAt||study.updatedAt}</span></div><div className="report-summary"><p><strong>{study.people.length}</strong><br/>personas</p><p><strong>{study.relations.length}</strong><br/>relaciones</p><p><strong>{study.events.length}</strong><br/>eventos</p><p><strong>{study.evidence.length}</strong><br/>evidencias</p><p><strong>{latestRuns.filter(r=>r.status==='ok').length}</strong><br/>fuentes ejecutadas</p><p><strong>{study.conflicts.length}</strong><br/>conflictos</p></div><h3>Conclusión</h3><p>{study.lastConclusion||'Aún no se ha ejecutado la investigación.'}</p><h3>Personas y relaciones</h3>{study.people.map(p=><div className="report-run" key={p.id}><strong>{p.canonicalName}</strong><span>{p.status}</span><span>{p.evidenceIds?.length||0} evidencias</span></div>)}<h3>Evidencias aceptadas</h3>{study.evidence.length===0?<p className="muted">Ninguna evidencia supera todavía el filtro de identidad.</p>:study.evidence.map(e=><div className="report-evidence" key={e.id}><strong>{e.source} · {e.record_type}</strong><p>{e.title}</p><a href={e.url} target="_blank" rel="noreferrer">VER EVIDENCIA</a></div>)}</div>}
          </>}
        </section>
      </div>
    </main>
    <footer>RADAR CERO · Cada afirmación debe poder volver a su evidencia.</footer>
  </div>
}

function processedLabel(study,running){
  if(running)return 'investigación en curso'
  if(study?.status==='completed')return 'ciclo completado'
  return 'preparado'
}
