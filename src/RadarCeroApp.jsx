import { useEffect, useMemo, useState } from 'react'
import {
  slug,
  pageHasNoResults,
  extractValidatedSnippets,
  extractExternalId,
  extractRecordUrl,
  extractYears,
  extractRelatives,
  confidenceForSnippet
} from './services/evidenceValidation.js'

const STORAGE_KEY='radar-cero-studies-v4'
const esc=encodeURIComponent
const nowIso=()=>new Date().toISOString()
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`
const fingerprint=(v='')=>slug(v).slice(0,500)

const REGIONAL=[
  ['andalucia','Andalucía · @rchivAWeb','https://www.juntadeandalucia.es/cultura/archivos/web_es/',['andalucía','andalucia','sevilla','málaga','malaga','cádiz','cadiz','córdoba','cordoba','granada','huelva','jaén','jaen','almería','almeria']],
  ['aragon','Aragón · DARA','https://dara.aragon.es/opac/app/simple/',['aragón','aragon','zaragoza','huesca','teruel']],
  ['asturias','Asturias · Archivos de Asturias','https://archivosdeasturias.info/',['asturias','oviedo']],
  ['canarias','Canarias · Memoria Digital','https://mdc.ulpgc.es/',['canarias','tenerife','gran canaria','las palmas']],
  ['cantabria','Cantabria · Archivo Histórico Provincial','https://cultura.cantabria.es/archivos',['cantabria','santander']],
  ['clm','Castilla-La Mancha · Archivos','https://archivos.castillalamancha.es/',['castilla-la mancha','toledo','ciudad real','cuenca','guadalajara','albacete']],
  ['cyl','Castilla y León · Archivos','https://archivoscastillayleon.jcyl.es/',['castilla y león','castilla y leon','valladolid','zamora','salamanca','león','leon','burgos','palencia','segovia','soria','ávila','avila']],
  ['catalunya','Cataluña · Arxius en Línia','https://arxiusenlinia.cultura.gencat.cat/',['cataluña','catalunya','barcelona','girona','lleida','tarragona']],
  ['valencia','Comunitat Valenciana · SAVEX','https://savex.gva.es/',['comunitat valenciana','valencia','alicante','castellón','castellon']],
  ['extremadura','Extremadura · WAREX','https://archivosextremadura.gobex.es/',['extremadura','badajoz','cáceres','caceres']],
  ['galicia','Galicia · Arquivos de Galicia / Galiciana','https://arquivosdegalicia.xunta.gal/',['galicia','a coruña','coruña','lugo','ourense','pontevedra']],
  ['madrid','Madrid · Portal de Archivos','https://www.comunidad.madrid/servicios/cultura/archivos',['madrid']],
  ['murcia','Murcia · Archivo General / Carmesí','https://archivogeneral.carm.es/',['murcia']],
  ['navarra','Navarra · Archivo Abierto','https://archivoabierto.navarra.es/',['navarra','pamplona']],
  ['paisvasco','País Vasco · Dokuklik / Badator','https://dokuklik.euskadi.eus/',['país vasco','pais vasco','euskadi','álava','alava','bizkaia','vizcaya','gipuzkoa','guipúzcoa']],
  ['larioja','La Rioja · Archivos','https://www.larioja.org/archivo/es',['la rioja','logroño','logrono']]
]

function rootParts(p){
  const full=[p.givenNames,p.surname1,p.surname2].filter(Boolean).join(' ')
  const surname=[p.surname1,p.surname2].filter(Boolean).join(' ')
  const place=[p.municipality,p.province].filter(Boolean).join(', ')
  const y=Number(String(p.birthFrom||'').slice(0,4))||null
  return {full,surname,place,y}
}

function sourceRegistry(p){
  const {full,surname,place,y}=rootParts(p)
  const q=[full,place].filter(Boolean).join(' ')
  const regionSlug=slug(`${p.municipality||''} ${p.province||''}`)
  const regional=REGIONAL.map(([id,name,url,tokens])=>({
    id:`regional-${id}`,name,url,type:'Archivo regional',priority:2,weight:.84,mode:'search_adapter',enabled:true,
    relevant:tokens.some(t=>regionSlug.includes(slug(t)))
  }))
  return [
    {id:'familysearch',name:'FamilySearch',type:'Repositorio oficial / fuente original',priority:2,weight:.94,mode:'search_adapter',enabled:true,relevant:true,url:`https://www.familysearch.org/search/record/results?count=20&q.givenName=${esc(p.givenNames||'')}&q.surname=${esc(surname)}${place?`&q.birthLikePlace=${esc(place)}`:''}${y?`&q.birthLikeDate.from=${y-3}&q.birthLikeDate.to=${y+3}`:''}`},
    {id:'pares',name:'PARES · Portal de Archivos Españoles',type:'Archivo estatal',priority:1,weight:.96,mode:'official_search_adapter',enabled:true,relevant:true,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(q)}`},
    {id:'bne-hemeroteca',name:'BNE · Hemeroteca Digital',type:'Prensa histórica',priority:4,weight:.64,mode:'search_adapter',enabled:true,relevant:true,url:`https://hemerotecadigital.bne.es/hd/es/results?query=${esc('"'+full+'" '+place)}`},
    {id:'bne-digital',name:'BNE Digital',type:'Biblioteca digital',priority:2,weight:.74,mode:'search_adapter',enabled:true,relevant:true,url:`https://bdh.bne.es/bnesearch/Search.do?text=&field1val=${esc(q)}&field1Op=AND&numfields=1`},
    {id:'bne-linked',name:'Datos BNE · Linked Data',type:'Autoridades / RDF / SPARQL',priority:3,weight:.78,mode:'linked_data',enabled:true,relevant:true,url:'https://datos.bne.es/'},
    {id:'hispana',name:'Hispana',type:'Agregador OAI-PMH',priority:2,weight:.8,mode:'oai_search',enabled:true,relevant:true,url:`https://hispana.mcu.es/es/consulta/resultados.do?busq_palabra=${esc(q)}`},
    {id:'boe',name:'BOE · Gazeta histórica',type:'Diario oficial',priority:2,weight:.86,mode:'official_search_adapter',enabled:true,relevant:true,url:`https://www.boe.es/buscar/gazeta.php?campo%5B0%5D=TIT&dato%5B0%5D=${esc(full)}`},
    {id:'ign',name:'IGN / CartoCiudad',type:'Normalización geográfica',priority:3,weight:.82,mode:'context_api',enabled:true,relevant:true,contextOnly:true,url:`https://www.cartociudad.es/geocoder/api/geocoder/find?q=${esc(place||p.primaryPlace||'')}`},
    {id:'ine',name:'INE · Nomenclátor',type:'Normalización administrativa',priority:3,weight:.8,mode:'context',enabled:true,relevant:true,contextOnly:true,url:'https://www.ine.es/nomen2/index.do'},
    {id:'catastro',name:'Catastro actual',type:'Contexto territorial',priority:3,weight:.74,mode:'legal_public_only',enabled:true,relevant:true,contextOnly:true,url:'https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCBusqueda.aspx'},
    {id:'ensenada',name:'Catastro de Ensenada',type:'Fuente histórica',priority:1,weight:.93,mode:'source_discovery',enabled:true,relevant:y&&y<1820,url:`https://www.familysearch.org/search/catalog/results?count=20&query=%2Bkeywords%3A${esc('Catastro Ensenada '+place)}`},
    {id:'cee',name:'Conferencia Episcopal · Directorio parroquial',type:'Directorio eclesiástico',priority:3,weight:.72,mode:'source_discovery',enabled:true,relevant:true,contextOnly:true,url:'https://www.conferenciaepiscopal.es/parroquias/'},
    {id:'parroquial',name:'Registros parroquiales / archivos diocesanos',type:'Fuente primaria',priority:1,weight:.97,mode:'source_discovery',enabled:true,relevant:true,url:`https://www.familysearch.org/search/catalog/results?count=20&query=%2Bplace%3A${esc(place)}%20%2Bkeywords%3Aparish`},
    {id:'ahp',name:'Archivo Histórico Provincial',type:'Fuente primaria',priority:1,weight:.96,mode:'source_discovery',enabled:true,relevant:true,url:'https://censoarchivos.mcu.es/CensoGuia/portada.htm'},
    {id:'notarial',name:'Protocolos notariales',type:'Fuente primaria',priority:1,weight:.97,mode:'source_discovery',enabled:true,relevant:true,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(surname+' '+place+' testamento')}`},
    {id:'defensa',name:'Biblioteca Virtual de Defensa',type:'Documentación militar',priority:2,weight:.88,mode:'search_adapter',enabled:true,relevant:true,url:`https://bibliotecavirtual.defensa.gob.es/BVMDefensa/es/consulta/resultados.do?busq_palabra=${esc(full)}`},
    {id:'militares',name:'Archivos militares',type:'Fuente primaria',priority:1,weight:.95,mode:'source_discovery',enabled:true,relevant:true,url:'https://www.defensa.gob.es/portaldecultura/patrimoniocultural/archivos/'},
    {id:'nobleza',name:'Archivo Histórico de la Nobleza',type:'Archivo estatal',priority:1,weight:.95,mode:'search_adapter',enabled:true,relevant:true,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(surname)}`},
    {id:'censo-guia',name:'Censo-Guía de Archivos',type:'Descubrimiento de fuentes',priority:3,weight:.7,mode:'source_discovery',enabled:true,relevant:true,contextOnly:true,url:'https://censoarchivos.mcu.es/CensoGuia/portada.htm'},
    {id:'registro-civil',name:'Registro Civil',type:'Fuente primaria',priority:1,weight:.99,mode:'user_document_or_authorized_request',enabled:true,relevant:y?y>=1871:true,contextOnly:true,url:'https://sede.mjusticia.gob.es/'},
    {id:'municipal',name:'Archivos municipales / padrones / censos / quintas',type:'Fuente primaria',priority:1,weight:.96,mode:'source_discovery',enabled:true,relevant:true,url:'https://censoarchivos.mcu.es/CensoGuia/portada.htm'},
    {id:'geneanet',name:'Geneanet',type:'Colaborativa',priority:5,weight:.38,mode:'hint_only',enabled:true,relevant:true,url:`https://es.geneanet.org/fonds/individus/?go=1&nom=${esc(surname)}&prenom=${esc(p.givenNames||'')}`},
    {id:'findagrave',name:'Find a Grave',type:'Cementerios',priority:4,weight:.42,mode:'hint_only',enabled:true,relevant:true,url:`https://www.findagrave.com/memorial/search?firstname=${esc(p.givenNames||'')}&lastname=${esc(surname)}`},
    {id:'billiongraves',name:'BillionGraves',type:'Cementerios',priority:4,weight:.4,mode:'hint_only',enabled:true,relevant:true,url:'https://billiongraves.com/search'},
    {id:'cyndi',name:"Cyndi's List / HISPAGEN / Foro Raíces",type:'Descubrimiento colaborativo',priority:5,weight:.3,mode:'hint_only',enabled:true,relevant:true,contextOnly:true,url:'https://www.cyndislist.com/spain/'},
    ...regional
  ]
}

async function fetchText(url){
  const attempts=[url,`https://r.jina.ai/${url}`]
  let last=''
  for(const candidate of attempts){
    try{
      const r=await fetch(candidate,{headers:{Accept:'text/plain, text/html, application/json'}})
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const text=await r.text()
      if(text&&text.length>40) return {text,via:candidate}
    }catch(e){last=String(e.message||e)}
  }
  throw new Error(last||'No accesible desde navegador')
}

function parsePlaceContext(text,p){
  try{
    const parsed=JSON.parse(text)
    const item=Array.isArray(parsed)?parsed[0]:parsed
    if(!item||typeof item!=='object') return null
    return {source:'IGN / CartoCiudad',name:item.address||item.name||p.municipality||'',municipality:item.municipality||p.municipality||'',province:item.province||p.province||'',lat:item.lat??item.latitude??null,lon:item.lng??item.lon??item.longitude??null,raw:item}
  }catch{return null}
}

const blankForm={title:'',givenNames:'',surname1:'',surname2:'',sex:'',birthFrom:'',municipality:'',province:'',country:'España'}
const tabs=['resumen','fuentes','personas','relaciones','eventos','evidencias','conflictos','informe']

export default function RadarCeroApp(){
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
  const registry=useMemo(()=>study?sourceRegistry(study.people.find(p=>p.isRoot)||study.people[0]):[],[study])
  const updateStudy=(id,patch)=>setStudies(v=>v.map(s=>s.id===id?{...s,...patch,updatedAt:nowIso()}:s))

  function createStudy(e){
    e.preventDefault()
    if(!form.givenNames.trim()||!form.surname1.trim()) return
    const id=uid(),rootId=uid()
    const root={id:rootId,canonicalName:[form.givenNames,form.surname1,form.surname2].filter(Boolean).join(' '),givenNames:form.givenNames.trim(),surname1:form.surname1.trim(),surname2:form.surname2.trim(),sex:form.sex,birthFrom:form.birthFrom.trim(),municipality:form.municipality.trim(),province:form.province.trim(),country:form.country.trim()||'España',confidence:1,status:'accepted',isRoot:true,isCollateral:false,evidenceIds:[]}
    const s={id,title:form.title.trim()||`Estudio · ${root.canonicalName}`,status:'ready',mode:'autónomo',progress:0,createdAt:nowIso(),updatedAt:nowIso(),people:[root],relations:[],events:[],evidence:[],conflicts:[],runs:[],places:[],researchQueue:[rootId],lastConclusion:''}
    setStudies(v=>[s,...v]);setSelected(id);setForm(blankForm);setTab('resumen')
  }

  async function runResearch(){
    if(!study||running) return
    setRunning(true);setProgress(0);setStatus('Preparando investigación autónoma…')
    const root=study.people.find(p=>p.isRoot)||study.people[0]
    const evidence=[...study.evidence]
    const people=[...study.people]
    const relations=[...study.relations]
    const events=[...study.events]
    const conflicts=[...study.conflicts]
    const places=[...(study.places||[])]
    const runs=[]
    const queue=[root]
    const researched=new Set()
    let operationCount=0

    while(queue.length&&researched.size<4){
      const target=queue.shift()
      if(!target||researched.has(slug(target.canonicalName))) continue
      researched.add(slug(target.canonicalName))
      const sources=sourceRegistry(target).filter(s=>s.enabled&&s.relevant&&(target.isRoot||['familysearch','pares','hispana','boe','bne-hemeroteca'].includes(s.id)))
      for(const src of sources){
        operationCount++
        setStatus(`Consultando ${src.name} · ${target.canonicalName}`)
        setProgress(Math.min(96,Math.round((operationCount/(Math.max(1,sources.length)*Math.max(1,queue.length+researched.size)))*100)))
        const startedAt=nowIso()
        if(src.mode==='user_document_or_authorized_request'){
          runs.push({id:uid(),sourceId:src.id,source:src.name,status:'discovery',hits:0,verifiedHits:0,startedAt,finishedAt:nowIso(),url:src.url,note:'Requiere certificado aportado por el usuario o solicitud autorizada; no se consulta indiscriminadamente.'})
          continue
        }
        if(src.contextOnly&&src.id!=='ign'){
          runs.push({id:uid(),sourceId:src.id,source:src.name,status:'discovery',hits:0,verifiedHits:0,startedAt,finishedAt:nowIso(),url:src.url,note:'Fuente registrada para contexto o descubrimiento.'})
          continue
        }
        try{
          const {text,via}=await fetchText(src.url)
          if(src.id==='ign'){
            const placeResult=parsePlaceContext(text,target)
            if(placeResult&&!places.some(x=>slug(x.name)===slug(placeResult.name)&&slug(x.province)===slug(placeResult.province))) places.push({...placeResult,id:uid()})
            runs.push({id:uid(),sourceId:src.id,source:src.name,status:'ok',hits:placeResult?1:0,verifiedHits:0,contextHits:placeResult?1:0,startedAt,finishedAt:nowIso(),url:src.url,via})
            continue
          }
          const noResults=pageHasNoResults(text)
          const snippets=noResults?[]:extractValidatedSnippets(text,target,src.id)
          let verifiedHits=0
          for(const snippet of snippets){
            const extId=extractExternalId(snippet,src.id)
            const recordUrl=extractRecordUrl(snippet,src.url)
            const fp=fingerprint(`${src.id}|${extId}|${snippet}`)
            if(evidence.some(e=>e.semantic_fingerprint===fp)) continue
            const confidence=confidenceForSnippet(snippet,target,src.weight)
            const evId=uid()
            const ev={id:evId,source:src.name,source_type:src.type,repository:src.name,external_id:extId,record_type:'resultado documental verificado',title:`Coincidencia validada para ${target.canonicalName}`,date:'',place:[target.municipality,target.province].filter(Boolean).join(', '),people:[target.canonicalName],relations:[],url:recordUrl,image_url:'',raw_metadata:{connector:src.id,priority:src.priority,mode:src.mode,validatedIdentity:true,subjectPersonId:target.id},raw_text:snippet,ocr_text:'',retrieved_at:nowIso(),source_weight:src.weight,hash:fp,semantic_fingerprint:fp,confidence,status:src.priority===5?'detected':'probable'}
            evidence.push(ev);verifiedHits++
            const tp=people.find(p=>p.id===target.id)
            if(tp) tp.evidenceIds=[...new Set([...(tp.evidenceIds||[]),evId])]
            for(const year of extractYears(snippet)){
              if(!events.some(x=>x.personId===target.id&&x.dateFrom===year&&x.sourceEvidenceId===evId)) events.push({id:uid(),personId:target.id,eventType:'mención documental',dateFrom:year,place:ev.place,confidence,status:'detected',sourceEvidenceId:evId})
            }
            for(const rel of extractRelatives(snippet,target.canonicalName)){
              let relative=people.find(p=>slug(p.canonicalName)===slug(rel.name))
              if(!relative){
                relative={id:uid(),canonicalName:rel.name,givenNames:rel.name.split(' ')[0],surname1:rel.name.split(' ').slice(1).join(' '),surname2:'',confidence:Math.max(.42,confidence-.18),status:'detected',isRoot:false,isCollateral:!['padre','madre','hijo','hija'].includes(rel.relation),evidenceIds:[evId],municipality:target.municipality,province:target.province,country:target.country}
                people.push(relative);queue.push(relative)
              }else relative.evidenceIds=[...new Set([...(relative.evidenceIds||[]),evId])]
              if(!relations.some(r=>r.personA===target.id&&r.personB===relative.id&&r.relationType===rel.relation)) relations.push({id:uid(),personA:target.id,personB:relative.id,relationType:rel.relation,confidence,status:'detected',sourceEvidenceId:evId})
            }
          }
          runs.push({id:uid(),sourceId:src.id,source:src.name,status:'ok',hits:verifiedHits,verifiedHits,noResults,startedAt,finishedAt:nowIso(),url:src.url,via})
        }catch(err){
          runs.push({id:uid(),sourceId:src.id,source:src.name,status:'unavailable',hits:0,verifiedHits:0,error:String(err.message||err),startedAt,finishedAt:nowIso(),url:src.url})
        }
      }
    }

    for(const p of people.filter(x=>!x.isRoot)){
      const evs=evidence.filter(e=>e.people?.some(n=>slug(n)===slug(p.canonicalName))||p.evidenceIds?.includes(e.id))
      const independent=new Set(evs.map(e=>e.repository)).size
      const hasOfficial=evs.some(e=>(e.raw_metadata?.priority||5)<=2)
      p.status=independent>=2&&hasOfficial?'probable':'detected'
      p.confidence=Math.min(.95,Math.max(p.confidence||.3,.35+independent*.18+(hasOfficial?.16:0)))
    }

    const rootYears=events.filter(e=>e.personId===root.id).map(e=>Number(e.dateFrom)).filter(Boolean)
    if(rootYears.length>1&&Math.max(...rootYears)-Math.min(...rootYears)>100&&!conflicts.some(c=>c.type==='cronología incompatible')) conflicts.push({id:uid(),personId:root.id,type:'cronología incompatible',severity:'high',status:'open',payload:{years:rootYears}})

    const verified=evidence.filter(e=>e.raw_metadata?.validatedIdentity)
    const conclusion=verified.length
      ?`${verified.length} coincidencias documentales han superado el filtro de identidad. Los parentescos permanecen como hipótesis hasta corroboración independiente.`
      :'No se ha encontrado todavía una coincidencia documental suficientemente fuerte para atribuirla a la persona raíz sin riesgo de falso positivo.'
    updateStudy(study.id,{people:[...people],relations:[...relations],events:[...events],evidence:[...evidence],conflicts:[...conflicts],places:[...places],runs:[...runs,...study.runs].slice(0,250),status:'completed',progress:100,lastResearchAt:nowIso(),lastConclusion:conclusion})
    setProgress(100);setStatus(`Completado · ${verified.length} evidencias validadas`);setRunning(false);setTab('informe')
  }

  function deleteStudy(){
    if(study&&confirm('¿Eliminar este estudio completo?')){setStudies(v=>v.filter(s=>s.id!==study.id));setSelected(null);setTab('resumen')}
  }

  const latestRuns=study?.runs||[]
  const metric=(label,value)=><div className="panel metric"><strong>{value}</strong><span>{label}</span></div>
  const personName=id=>study?.people.find(p=>p.id===id)?.canonicalName||'—'

  return <div className="app-shell">
    <header className="topbar"><div><div className="brand">RADAR CERO</div><div className="subtitle">Investigación genealógica autónoma</div></div><span className="online">● ONLINE</span></header>
    <main>
      <section className="hero"><div><span className="eyebrow">EVIDENCIA → PERSONAS → EVENTOS → RELACIONES → ÁRBOL</span><h1>Genealogía con fuentes reales y trazabilidad.</h1><p>Consulta fuentes oficiales y contextuales, descarta ecos de búsqueda y homónimos débiles, conserva la procedencia y separa hechos, hipótesis y conflictos.</p></div><div className="hero-badge"><strong>{studies.length}</strong><span>estudios guardados</span></div></section>

      {!study&&<section className="panel create-panel"><h2>Nuevo estudio</h2><form onSubmit={createStudy} className="form-grid">
        <label>Nombre del estudio<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
        <label>Nombre<input required value={form.givenNames} onChange={e=>setForm({...form,givenNames:e.target.value})}/></label>
        <label>Primer apellido<input required value={form.surname1} onChange={e=>setForm({...form,surname1:e.target.value})}/></label>
        <label>Segundo apellido<input value={form.surname2} onChange={e=>setForm({...form,surname2:e.target.value})}/></label>
        <label>Sexo<select value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option value="">Sin indicar</option><option value="M">Hombre</option><option value="F">Mujer</option></select></label>
        <label>Nacimiento aproximado<input inputMode="numeric" value={form.birthFrom} onChange={e=>setForm({...form,birthFrom:e.target.value})}/></label>
        <label>Municipio<input value={form.municipality} onChange={e=>setForm({...form,municipality:e.target.value})}/></label>
        <label>Provincia<input value={form.province} onChange={e=>setForm({...form,province:e.target.value})}/></label>
        <button className="primary full" type="submit">Crear estudio e iniciar expediente</button>
      </form></section>}

      <div className="workspace">
        <aside className="panel studies"><div className="panel-head"><h3>Estudios</h3><button className="iconbtn" onClick={()=>setSelected(null)}>+</button></div>{studies.length===0?<p className="muted">Todavía no hay estudios.</p>:studies.map(s=><button key={s.id} className={`study-item ${selected===s.id?'active':''}`} onClick={()=>setSelected(s.id)}><strong>{s.title}</strong><span>{s.status} · {s.people.length} personas</span></button>)}</aside>

        <section className="study-area">
          {!study?<div className="panel empty">Crea un estudio o selecciona uno existente.</div>:<>
            <div className="panel study-head"><div><span className="eyebrow">{study.mode}</span><h2>{study.title}</h2><p>{study.people.find(p=>p.isRoot)?.canonicalName} · {study.people.find(p=>p.isRoot)?.birthFrom||'fecha desconocida'} · {[study.people.find(p=>p.isRoot)?.municipality,study.people.find(p=>p.isRoot)?.province].filter(Boolean).join(', ')}</p></div><div className="actions"><button className="primary" disabled={running} onClick={runResearch}>{running?'Investigando…':'Investigar ahora'}</button><button className="danger" onClick={deleteStudy}>Eliminar</button></div></div>
            <div className="panel progress-wrap"><div className="progress-row"><span>{status||study.lastConclusion||'Preparado para investigar'}</span><strong>{running?progress:study.progress||0}%</strong></div><div className="progress"><i style={{width:`${running?progress:study.progress||0}%`}}/></div></div>
            <div className="tabs">{tabs.map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>

            {tab==='resumen'&&<div className="dashboard-grid">
              {metric('personas',study.people.length)}{metric('relaciones',study.relations.length)}{metric('eventos',study.events.length)}{metric('evidencias',study.evidence.length)}{metric('conflictos',study.conflicts.length)}{metric('fuentes registradas',registry.length)}
              <div className="panel wide"><h3>Árbol de trabajo</h3><div className="tree-root">{study.people.map(p=><div className={`person-node ${p.status}`} key={p.id}><strong>{p.canonicalName}</strong><span>{p.isRoot?'Persona raíz':p.isCollateral?'Colateral':'Familiar'}</span><small>{p.status} · confianza {Math.round((p.confidence||0)*100)}% · {p.evidenceIds?.length||0} evidencias</small></div>)}</div></div>
            </div>}

            {tab==='fuentes'&&<div className="cards">{registry.map(src=>{const run=latestRuns.find(r=>r.sourceId===src.id);return <div className="panel source-card" key={src.id}><span className={`priority p${src.priority}`}>P{src.priority}</span><h3>{src.name}</h3><p>{src.type} · {src.mode}</p><p>{src.relevant?'Seleccionada automáticamente para este estudio':'Registrada; no prioritaria para la localización actual'}</p><div className="source-foot"><span className={`status ${run?.status||'pending'}`}>{run?.status||'pendiente'}</span><a href={src.url} target="_blank" rel="noreferrer">Abrir fuente</a></div></div>})}</div>}

            {tab==='personas'&&<div className="cards">{study.people.map(p=><div className="panel person-card" key={p.id}><span className={`chip ${p.status}`}>{p.status}</span><h3>{p.canonicalName}</h3><p>{p.isRoot?'Persona raíz':p.isCollateral?'Búsqueda colateral':'Familiar detectado'}</p><p>Confianza {Math.round((p.confidence||0)*100)}% · Evidencias {p.evidenceIds?.length||0}</p></div>)}</div>}

            {tab==='relaciones'&&<div className="evidence-list">{study.relations.length===0?<div className="panel empty">No hay parentescos suficientemente sustentados todavía.</div>:study.relations.map(r=><div className="panel evidence" key={r.id}><h3>{personName(r.personA)} → {r.relationType} → {personName(r.personB)}</h3><div className="meta"><span>confianza {Math.round((r.confidence||0)*100)}%</span><span>{r.status}</span></div>{r.sourceEvidenceId&&<button className="evidence-link" onClick={()=>setTab('evidencias')}>VER EVIDENCIA</button>}</div>)}</div>}

            {tab==='eventos'&&<div className="evidence-list">{study.events.length===0?<div className="panel empty">No hay eventos documentales validados todavía.</div>:study.events.map(e=><div className="panel evidence" key={e.id}><h3>{e.eventType}</h3><p>{personName(e.personId)} · {e.dateFrom||'sin fecha'} · {e.place||'sin lugar'}</p><div className="meta"><span>confianza {Math.round((e.confidence||0)*100)}%</span><span>{e.status}</span></div></div>)}</div>}

            {tab==='evidencias'&&<div className="evidence-list">{study.evidence.length===0?<div className="panel empty">No hay evidencias validadas. Las páginas de búsqueda, consultas reflejadas y nombres parciales no se guardan como evidencia.</div>:study.evidence.map(e=><div className="panel evidence" key={e.id}><span className="confidence">{Math.round((e.confidence||0)*100)}%</span><h3>{e.title}</h3><div className="meta"><span>{e.source}</span><span>{e.record_type}</span><span>{e.external_id||'sin ID externo'}</span><span>{e.retrieved_at}</span></div><p>{e.raw_text}</p><a className="evidence-link" href={e.url} target="_blank" rel="noreferrer">VER EVIDENCIA</a></div>)}</div>}

            {tab==='conflictos'&&<div className="evidence-list">{study.conflicts.length===0?<div className="panel empty">No hay conflictos detectados.</div>:study.conflicts.map(c=><div className="panel evidence" key={c.id}><h3>{c.type}</h3><p>{c.severity} · {c.status}</p><pre>{JSON.stringify(c.payload,null,2)}</pre></div>)}</div>}

            {tab==='informe'&&<div className="panel report"><div className="report-title"><div><span className="eyebrow">INFORME DE INVESTIGACIÓN</span><h2>{study.title}</h2></div><span>{study.lastResearchAt||study.updatedAt}</span></div><div className="report-summary"><p><strong>{study.people.length}</strong><br/>personas</p><p><strong>{study.relations.length}</strong><br/>relaciones</p><p><strong>{study.evidence.length}</strong><br/>evidencias validadas</p><p><strong>{latestRuns.filter(r=>r.status==='ok').length}</strong><br/>fuentes accesibles</p><p><strong>{latestRuns.filter(r=>r.noResults).length}</strong><br/>fuentes sin resultados</p><p><strong>{study.places?.length||0}</strong><br/>lugares normalizados</p></div><h3>Conclusión</h3><p>{study.lastConclusion||'Aún no se ha ejecutado la investigación.'}</p><h3>Ejecuciones</h3>{latestRuns.slice(0,80).map(r=><div className="report-run" key={r.id}><strong>{r.source}</strong><span>{r.status}</span><span>{r.verifiedHits??r.hits??0} válidas</span></div>)}<h3>Evidencias aceptadas</h3>{study.evidence.length===0?<p className="muted">Ninguna. Radar Cero no ha convertido resultados ambiguos en hechos.</p>:study.evidence.map(e=><div className="report-evidence" key={e.id}><strong>{e.source}</strong><p>{e.raw_text}</p><a href={e.url} target="_blank" rel="noreferrer">VER EVIDENCIA</a></div>)}</div>}
          </>}
        </section>
      </div>
    </main>
    <footer>RADAR CERO · Cada hecho debe poder volver a su evidencia.</footer>
  </div>
}
