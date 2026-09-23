import fs from 'node:fs'
import {
  slug,
  pageHasNoResults,
  extractValidatedSnippets,
  extractExternalId,
  extractRecordUrl,
  extractYears,
  extractRelatives,
  confidenceForSnippet
} from '../src/services/evidenceValidation.js'

const esc = encodeURIComponent
const nowIso = () => new Date().toISOString()
const hash = (v='') => Buffer.from(String(v)).toString('base64url').slice(0,120)

const person = {
  id:'root',
  givenNames:'Juan',
  surname1:'García',
  surname2:'López',
  birthFrom:'1888',
  municipality:'Toledo',
  province:'Toledo',
  country:'España',
  confidence:1,
  status:'accepted',
  isRoot:true,
  evidenceIds:[]
}
person.canonicalName=[person.givenNames,person.surname1,person.surname2].join(' ')

const full=person.canonicalName
const surname=`${person.surname1} ${person.surname2}`
const place=`${person.municipality}, ${person.province}`
const y=1888

const sources=[
  {id:'familysearch',name:'FamilySearch',type:'Repositorio oficial',weight:.92,url:`https://www.familysearch.org/search/record/results?count=20&q.givenName=${esc(person.givenNames)}&q.surname=${esc(surname)}&q.birthLikePlace=${esc(place)}&q.birthLikeDate.from=${y-3}&q.birthLikeDate.to=${y+3}`},
  {id:'pares',name:'PARES',type:'Archivo estatal',weight:.95,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(full+' '+place)}`},
  {id:'bne-hemeroteca',name:'BNE · Hemeroteca Digital',type:'Prensa histórica',weight:.62,url:`https://hemerotecadigital.bne.es/hd/es/results?query=${esc('"'+full+'" '+place)}`},
  {id:'bne-digital',name:'BNE Digital',type:'Biblioteca digital',weight:.72,url:`https://bdh.bne.es/bnesearch/Search.do?text=&field1val=${esc(full+' '+place)}&field1Op=AND&numfields=1`},
  {id:'hispana',name:'Hispana',type:'Agregador OAI-PMH',weight:.78,url:`https://hispana.mcu.es/es/consulta/resultados.do?busq_palabra=${esc(full+' '+place)}`},
  {id:'boe',name:'BOE · Gazeta histórica',type:'Diario oficial',weight:.84,url:`https://www.boe.es/buscar/gazeta.php?campo%5B0%5D=TIT&dato%5B0%5D=${esc(full)}`},
  {id:'ign',name:'IGN / CartoCiudad',type:'Normalización geográfica',weight:.80,url:`https://www.cartociudad.es/geocoder/api/geocoder/find?q=${esc(place)}`,contextOnly:true},
  {id:'clm',name:'Castilla-La Mancha · Archivos',type:'Archivo regional',weight:.82,url:'https://archivos.castillalamancha.es/'}
]

async function fetchText(url){
  const attempts=[url,`https://r.jina.ai/${url}`]
  let last=''
  for(const candidate of attempts){
    try{
      const r=await fetch(candidate,{headers:{Accept:'text/plain, text/html, application/json','User-Agent':'Radar-Cero-Research/2.0'}})
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const t=await r.text()
      if(t&&t.length>40) return {text:t,via:candidate}
    }catch(e){last=e.message}
  }
  throw new Error(last||'No accesible')
}

function placeContext(text){
  try{
    const parsed=JSON.parse(text)
    const first=Array.isArray(parsed)?parsed[0]:parsed
    if(!first||typeof first!=='object') return null
    return {
      source:'IGN / CartoCiudad',
      name:first.address||first.name||first.municipality||'Toledo',
      municipality:first.municipality||person.municipality,
      province:first.province||person.province,
      lat:first.lat??first.latitude??null,
      lon:first.lng??first.lon??first.longitude??null,
      raw:first
    }
  }catch{return null}
}

const result={
  study:{title:`Estudio · ${person.canonicalName}`,root:person,createdAt:nowIso(),status:'completed'},
  runs:[],
  evidence:[],
  people:[person],
  relations:[],
  events:[],
  conflicts:[],
  places:[],
  summary:{}
}

for(const src of sources){
  const startedAt=nowIso()
  try{
    const {text,via}=await fetchText(src.url)
    if(src.contextOnly){
      const normalized=placeContext(text)
      if(normalized) result.places.push(normalized)
      result.runs.push({source:src.name,status:'ok',hits:normalized?1:0,verifiedHits:0,contextHits:normalized?1:0,url:src.url,via,startedAt,finishedAt:nowIso(),noResults:false})
      continue
    }
    const noResults=pageHasNoResults(text)
    const snippets=noResults?[]:extractValidatedSnippets(text,person,src.id)
    let verifiedHits=0
    for(const snippet of snippets){
      const externalId=extractExternalId(snippet,src.id)
      const recordUrl=extractRecordUrl(snippet,src.url)
      const fingerprint=hash(`${src.id}|${externalId}|${slug(snippet)}`)
      if(result.evidence.some(e=>e.semantic_fingerprint===fingerprint)) continue
      const confidence=confidenceForSnippet(snippet,person,src.weight)
      const evId=`ev-${result.evidence.length+1}`
      const ev={
        id:evId,
        source:src.name,
        source_type:src.type,
        repository:src.name,
        external_id:externalId,
        record_type:'resultado documental verificado',
        title:`Coincidencia validada para ${full}`,
        date:'',
        place,
        people:[full],
        relations:[],
        url:recordUrl,
        image_url:'',
        raw_metadata:{connector:src.id,validatedIdentity:true},
        raw_text:snippet,
        ocr_text:'',
        retrieved_at:nowIso(),
        source_weight:src.weight,
        hash:fingerprint,
        semantic_fingerprint:fingerprint,
        confidence,
        status:'detected'
      }
      result.evidence.push(ev)
      person.evidenceIds.push(evId)
      verifiedHits++
      for(const year of extractYears(snippet)){
        if(!result.events.some(e=>e.personId===person.id&&e.dateFrom===year&&e.sourceEvidenceId===evId)) result.events.push({id:`event-${result.events.length+1}`,personId:person.id,eventType:'mención documental',dateFrom:year,place,confidence,status:'detected',sourceEvidenceId:evId})
      }
      for(const rel of extractRelatives(snippet,full)){
        let relative=result.people.find(p=>slug(p.canonicalName)===slug(rel.name))
        if(!relative){
          relative={id:`person-${result.people.length+1}`,canonicalName:rel.name,confidence:Math.max(.45,confidence-.2),status:'detected',isRoot:false,isCollateral:true,evidenceIds:[evId]}
          result.people.push(relative)
        }
        if(!result.relations.some(r=>r.personA===person.id&&r.personB===relative.id&&r.relationType===rel.relation)) result.relations.push({id:`rel-${result.relations.length+1}`,personA:person.id,personB:relative.id,relationType:rel.relation,confidence,status:'detected',sourceEvidenceId:evId})
      }
    }
    result.runs.push({source:src.name,status:'ok',hits:verifiedHits,verifiedHits,url:src.url,via,startedAt,finishedAt:nowIso(),noResults})
  }catch(e){
    result.runs.push({source:src.name,status:'unavailable',hits:0,verifiedHits:0,error:String(e.message||e),url:src.url,startedAt,finishedAt:nowIso(),noResults:false})
  }
}

const candidateYears=result.events.map(e=>Number(e.dateFrom)).filter(Boolean)
if(candidateYears.length>1&&Math.max(...candidateYears)-Math.min(...candidateYears)>100){
  result.conflicts.push({id:'conflict-1',personId:person.id,type:'cronología incompatible',severity:'high',status:'open',payload:{years:candidateYears}})
}

result.summary={
  sourcesConsulted:result.runs.length,
  sourcesAvailable:result.runs.filter(r=>r.status==='ok').length,
  sourcesUnavailable:result.runs.filter(r=>r.status!=='ok').length,
  sourcesWithNoResults:result.runs.filter(r=>r.noResults).length,
  verifiedEvidenceCount:result.evidence.length,
  peopleCount:result.people.length,
  relationCount:result.relations.length,
  eventCount:result.events.length,
  conflictCount:result.conflicts.length,
  placeContextCount:result.places.length,
  conclusion:result.evidence.length?'Hay coincidencias documentales validadas pendientes de corroboración cruzada.':'No se ha encontrado todavía una coincidencia documental suficientemente fuerte para atribuirla a la persona raíz sin riesgo de falso positivo.'
}

fs.writeFileSync('study-result.json',JSON.stringify(result,null,2))
console.log('RADAR_CERO_RESULT_START')
console.log(JSON.stringify(result,null,2))
console.log('RADAR_CERO_RESULT_END')
