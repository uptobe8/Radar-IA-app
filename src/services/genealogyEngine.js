import { requiredEvidenceFields } from './sourceRegistry.js'

export const slug=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()
export const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`
export const nowIso=()=>new Date().toISOString()

const fullName=p=>[p.givenNames,p.surname1,p.surname2].filter(Boolean).join(' ').trim()
const yearOf=v=>Number(String(v||'').match(/\b(1[4-9]\d{2}|20[0-2]\d)\b/)?.[0])||null
const hashString=v=>{
  let h=2166136261
  for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
  return `fnv1a-${(h>>>0).toString(16).padStart(8,'0')}`
}

export function normalizeEvidence(input={}){
  const raw={
    source:String(input.source||''),source_type:String(input.source_type||''),repository:String(input.repository||input.source||''),external_id:String(input.external_id||''),record_type:String(input.record_type||''),title:String(input.title||''),date:String(input.date||''),place:String(input.place||''),people:Array.isArray(input.people)?input.people:[],relations:Array.isArray(input.relations)?input.relations:[],url:String(input.url||''),image_url:String(input.image_url||''),raw_metadata:input.raw_metadata&&typeof input.raw_metadata==='object'?input.raw_metadata:{},raw_text:String(input.raw_text||''),ocr_text:String(input.ocr_text||''),retrieved_at:String(input.retrieved_at||nowIso()),source_weight:Number(input.source_weight||0),hash:String(input.hash||''),semantic_fingerprint:String(input.semantic_fingerprint||'')
  }
  if(!raw.hash) raw.hash=hashString(`${raw.source}|${raw.external_id}|${raw.url}|${raw.raw_text}`)
  if(!raw.semantic_fingerprint) raw.semantic_fingerprint=hashString(`${slug(raw.title)}|${slug(raw.date)}|${slug(raw.place)}|${raw.people.map(slug).sort().join('|')}`)
  for(const f of requiredEvidenceFields) if(!Object.hasOwn(raw,f)) raw[f]=''
  return raw
}

const tokenSet=v=>new Set(slug(v).split(' ').filter(Boolean))
const jaccard=(a,b)=>{
  const A=tokenSet(a),B=tokenSet(b)
  if(!A.size||!B.size) return 0
  const i=[...A].filter(x=>B.has(x)).length
  return i/(A.size+B.size-i)
}

export function identityScore(person={},candidate={}){
  const root=person.canonicalName||fullName(person)
  const cand=candidate.name||candidate.title||''
  const rn=slug(root),cn=slug(cand)
  const rootTokens=rn.split(' ').filter(Boolean)
  const candTokens=cn.split(' ').filter(Boolean)
  const exact=rn&&cn&&(cn===rn||cn.includes(rn))
  const allTokens=rootTokens.length>=2&&rootTokens.every(t=>candTokens.includes(t))
  const given=slug(person.givenNames||'')
  const s1=slug(person.surname1||'')
  const s2=slug(person.surname2||'')
  const hasGiven=given&&cn.includes(given)
  const hasS1=s1&&cn.includes(s1)
  const hasS2=!s2||cn.includes(s2)
  let score=0
  if(exact) score+=.54
  else if(allTokens) score+=.48
  else {
    if(hasGiven) score+=.14
    if(hasS1) score+=.16
    if(hasS2&&s2) score+=.12
    score+=Math.min(.12,jaccard(root,cand)*.12)
  }
  const py=yearOf(person.birthFrom)
  const cy=yearOf(candidate.date)
  if(py&&cy){const d=Math.abs(py-cy);score+=d<=1?.18:d<=3?.11:d<=7?.04:-.14}
  const place=slug([person.municipality,person.province].filter(Boolean).join(' '))
  const cplace=slug(candidate.place||'')
  if(place&&cplace){
    if(cplace.includes(slug(person.municipality||''))&&person.municipality) score+=.12
    else if(person.province&&cplace.includes(slug(person.province))) score+=.07
    else score-=.04
  }
  const relations=Array.isArray(candidate.relations)?candidate.relations:[]
  if(relations.length) score+=Math.min(.12,relations.length*.04)
  if(!exact&&!allTokens&&(!hasGiven||!hasS1||!hasS2)) score=Math.min(score,.68)
  return Math.max(0,Math.min(1,Math.round(score*100)/100))
}

const relationWords='padre|madre|c[oó]nyuge|esposo|esposa|hijo|hija|hermano|hermana|abuelo|abuela|padrino|madrina|testigo|heredero|heredera|cuñado|cuñada|sobrino|sobrina|vecino|vecina'
const namePattern="[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñüÜ'-]+(?:\\s+(?:de|del|la|las|los|y))?(?:\\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñüÜ'-]+){1,4}"

export function extractRelationsFromText(text='',rootName=''){
  const result=[]
  const re=new RegExp(`\\b(${relationWords})\\s*[:\\-–]?\\s*(${namePattern})`,'gi')
  let m
  while((m=re.exec(String(text)))&&result.length<30){
    const relation=m[1].toLowerCase().replace('conyuge','cónyuge')
    const name=m[2].replace(/\s+/g,' ').trim().replace(/[.,;:]$/,'')
    if(slug(name)!==slug(rootName)&&!result.some(x=>x.relation===relation&&slug(x.name)===slug(name))) result.push({relation,name})
  }
  return result
}

export function extractYears(text=''){
  return [...new Set((String(text).match(/\b(1[4-9]\d{2}|20[0-2]\d)\b/g)||[]))]
}

export function extractRecordLinks(text='',sourceUrl=''){
  const out=[]
  const md=/\[([^\]]{2,180})\]\((https?:\/\/[^)\s]+)\)/g
  let m
  while((m=md.exec(String(text)))&&out.length<80) out.push({title:m[1].trim(),url:m[2]})
  const html=/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{2,180})<\/a>/gi
  while((m=html.exec(String(text)))&&out.length<120){
    let url=m[1]
    try{url=new URL(url,sourceUrl).href}catch{}
    out.push({title:m[2].replace(/\s+/g,' ').trim(),url})
  }
  return out.filter((x,i,a)=>x.url&&a.findIndex(y=>y.url===x.url)===i)
}

const badPage=text=>{
  const s=slug(text)
  return !s||s.includes('javascript is required')||s.includes('access denied')||s.includes('captcha')||s.includes('enable javascript and cookies')
}

const recordSignals=['signatura','registro','expediente','nacimiento','bautismo','matrimonio','defunción','entierro','padrón','censo','testamento','protocolo','fondo','serie','archivo','ark:/61903/1:1:','fecha','page','página','pdf']

export function extractCandidateRecords(text='',person={},source={}){
  if(badPage(text)) return []
  const root=fullName(person)
  const rootSlug=slug(root)
  const lines=String(text).replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ').split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(x=>x.length>20&&x.length<2500)
  const links=extractRecordLinks(text,source.url)
  const out=[]
  for(const line of lines){
    const s=slug(line)
    if(!rootSlug||!s.includes(rootSlug)) continue
    if(s.includes('search results')||s.includes('resultados de busqueda')||s.includes('busq palabra')||s.includes('q givenname')) continue
    const signal=recordSignals.some(k=>s.includes(slug(k)))||extractYears(line).length>0
    if(!signal) continue
    const nearbyLink=links.find(l=>line.includes(l.title)||slug(line).includes(slug(l.title)))
    if(source.id==='familysearch'){
      const fs=links.find(l=>/familysearch\.org\/ark:\/61903\/1:1:/i.test(l.url)&&slug(l.title).includes(rootSlug))
      if(!fs) continue
      out.push({name:fs.title,date:extractYears(line)[0]||'',place:person.municipality||'',relations:extractRelationsFromText(line,root),title:fs.title,url:fs.url,raw_text:line,external_id:fs.url.match(/1:1:([A-Z0-9-]+)/i)?.[1]||'',record_type:'registro genealógico'})
      continue
    }
    const url=nearbyLink?.url||source.url
    const ext=(line.match(/signatura\s*[:\-]?\s*([^|;,]+)/i)?.[1]||url.match(/(?:id|record|document|doc|ark)[=\/:]([A-Za-z0-9._:-]{4,})/i)?.[1]||'').trim()
    out.push({name:root,date:extractYears(line)[0]||'',place:line.match(/(?:lugar|localidad|municipio|place)\s*[:\-]\s*([^|;,]+)/i)?.[1]?.trim()||person.municipality||'',relations:extractRelationsFromText(line,root),title:nearbyLink?.title||`Registro relacionado con ${root}`,url,raw_text:line,external_id:ext,record_type:guessRecordType(line)})
  }
  return out.filter((x,i,a)=>a.findIndex(y=>slug(y.raw_text)===slug(x.raw_text)&&y.url===x.url)===i).slice(0,20)
}

export function guessRecordType(text=''){
  const s=slug(text)
  for(const [key,label] of [['nacimiento','nacimiento'],['bautismo','bautismo'],['matrimonio','matrimonio'],['defuncion','defunción'],['entierro','entierro'],['padron','padrón'],['censo','censo'],['testamento','testamento'],['protocolo','protocolo notarial'],['expediente','expediente'],['esquela','esquela'],['nombramiento','nombramiento'],['militar','registro militar']]) if(s.includes(key)) return label
  return 'mención documental'
}

export function evidenceFromCandidate(candidate,person,source){
  const score=identityScore(person,candidate)
  if(score<.8) return null
  const relations=candidate.relations||[]
  return normalizeEvidence({source:source.name,source_type:source.type,repository:source.repository||source.name,external_id:candidate.external_id||'',record_type:candidate.record_type||'mención documental',title:candidate.title||`Registro de ${fullName(person)}`,date:candidate.date||'',place:candidate.place||'',people:[fullName(person),...relations.map(r=>r.name)],relations, url:candidate.url||source.url,image_url:candidate.image_url||'',raw_metadata:{source_id:source.id,method:source.method,priority:source.priority,identity_score:score,validated_identity:true},raw_text:candidate.raw_text||'',ocr_text:candidate.ocr_text||'',retrieved_at:nowIso(),source_weight:source.weight})
}

export function expandPeopleQueue(existing=[],relations=[],origin={}){
  const out=[]
  for(const rel of relations){
    if(!rel?.name||slug(rel.name)===slug(origin.canonicalName||fullName(origin))) continue
    if(existing.some(p=>slug(p.canonicalName)===slug(rel.name))||out.some(p=>slug(p.canonicalName)===slug(rel.name))) continue
    const direct=['padre','madre','hijo','hija','cónyuge','esposo','esposa','abuelo','abuela'].includes(rel.relation)
    out.push({id:uid(),canonicalName:rel.name,givenNames:rel.name.split(' ')[0]||'',surname1:rel.name.split(' ').slice(1).join(' '),surname2:'',sex:'',birthFrom:'',municipality:origin.municipality||'',province:origin.province||'',country:origin.country||'España',confidence:.45,status:'detected',isRoot:false,isCollateral:!direct,evidenceIds:[],discoveredVia:rel.relation})
  }
  return out
}

export function eventsFromEvidence(evidence,personId){
  const years=extractYears(`${evidence.date} ${evidence.raw_text}`)
  const type=evidence.record_type||'mención documental'
  return years.slice(0,4).map(y=>({id:uid(),personId,eventType:type,dateFrom:y,dateTo:'',place:evidence.place||'',confidence:evidence.raw_metadata?.identity_score||evidence.source_weight||.5,status:'detected',sourceEvidenceId:evidence.id||'',evidenceIds:evidence.id?[evidence.id]:[]}))
}

export function relationsFromEvidence(evidence,originPerson,people){
  const result=[]
  for(const rel of evidence.relations||[]){
    const target=people.find(p=>slug(p.canonicalName)===slug(rel.name))
    if(!target) continue
    result.push({id:uid(),personA:originPerson.id,personB:target.id,relationType:rel.relation,confidence:evidence.raw_metadata?.identity_score||.5,status:'detected',sourceEvidenceId:evidence.id||'',evidenceIds:evidence.id?[evidence.id]:[]})
  }
  return result
}

export async function fetchSourceText(source,query='',timeoutMs=16000){
  const url=source.url
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),timeoutMs)
  const candidates=[url]
  try{
    const u=new URL(url)
    candidates.push(`https://r.jina.ai/https://${u.host}${u.pathname}${u.search}`)
  }catch{}
  let error=''
  for(const candidate of candidates){
    try{
      const r=await fetch(candidate,{signal:controller.signal,headers:{Accept:'text/html,text/plain,application/json,application/xml,text/xml'}})
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const text=await r.text()
      if(text&&text.length>40){clearTimeout(timer);return {text,via:candidate,query}}
    }catch(e){error=String(e?.message||e)}
  }
  clearTimeout(timer)
  throw new Error(error||'Fuente no accesible desde el navegador')
}

export function dedupeEvidence(items=[]){
  const seen=new Set()
  return items.filter(e=>{const k=e.semantic_fingerprint||e.hash;if(seen.has(k))return false;seen.add(k);return true})
}

export function assessPersonStatus(person,evidence=[]){
  const linked=evidence.filter(e=>e.people?.some(n=>slug(n)===slug(person.canonicalName))||person.evidenceIds?.includes(e.id))
  const repos=new Set(linked.map(e=>e.repository).filter(Boolean))
  const p1=linked.some(e=>Number(e.raw_metadata?.priority)===1)
  const p2=linked.some(e=>Number(e.raw_metadata?.priority)===2)
  if(p1&&repos.size>=1) return {status:'probable',confidence:Math.max(person.confidence||0,.88)}
  if((p1||p2)&&repos.size>=2) return {status:'probable',confidence:Math.max(person.confidence||0,.9)}
  return {status:person.isRoot?'accepted':'detected',confidence:person.isRoot?1:Math.max(person.confidence||0,.4)}
}
