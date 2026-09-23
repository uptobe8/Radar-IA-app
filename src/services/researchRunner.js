import { buildResearchPlan, buildSourceRegistry } from './sourceRegistry.js'
import { slug, uid, nowIso, fetchSourceText, extractCandidateRecords, evidenceFromCandidate, expandPeopleQueue, eventsFromEvidence, relationsFromEvidence, dedupeEvidence, assessPersonStatus } from './genealogyEngine.js'

const clone=v=>JSON.parse(JSON.stringify(v))

function parsePlace(text,target){
  try{
    const parsed=JSON.parse(text)
    const item=Array.isArray(parsed)?parsed[0]:parsed?.results?.[0]||parsed
    if(!item||typeof item!=='object') return null
    const municipality=item.municipality||item.muni||target.municipality||''
    const province=item.province||item.provincia||target.province||''
    const name=item.address||item.name||item.label||municipality||province
    return {id:uid(),source:'IGN / CartoCiudad',name,original:[target.municipality,target.province].filter(Boolean).join(', '),municipality,province,lat:item.lat??item.latitude??item.y??null,lon:item.lng??item.lon??item.longitude??item.x??null,historicalNames:[],raw:item}
  }catch{return null}
}

function conflictScan(people,events,existing=[]){
  const conflicts=[...existing]
  for(const person of people){
    const years=events.filter(e=>e.personId===person.id&&e.dateFrom).map(e=>Number(e.dateFrom)).filter(Boolean)
    if(years.length>1&&Math.max(...years)-Math.min(...years)>25&&!conflicts.some(c=>c.personId===person.id&&c.type==='cronología incompatible')) conflicts.push({id:uid(),personId:person.id,type:'cronología incompatible',severity:'high',status:'open',payload:{years:[...new Set(years)].sort()}})
  }
  return conflicts
}

export async function runResearchCycle(studyInput={},options={}){
  const study=clone(studyInput)
  const people=study.people||[]
  const evidence=study.evidence||[]
  const events=study.events||[]
  const relations=study.relations||[]
  const runs=[]
  const places=study.places||[]
  const discoveries=[]
  const root=people.find(p=>p.isRoot)||people[0]
  if(!root) throw new Error('El estudio no tiene persona raíz')
  const maxDepth=Math.max(0,Number(options.maxDepth??2))
  const maxPeople=Math.max(1,Number(options.maxPeople??30))
  const fetcher=options.fetcher||fetchSourceText
  const baseRegistry=options.registry||buildSourceRegistry(root)
  const sourceSettings=study.sourceSettings||{}
  const queue=[{person:root,depth:0}]
  const researched=new Set()
  let researchPlan=[]

  while(queue.length&&people.length<=maxPeople){
    const {person:target,depth}=queue.shift()
    if(!target||depth>maxDepth||researched.has(target.id)) continue
    researched.add(target.id)
    const registry=options.registry||buildSourceRegistry(target)
    const enabled=registry.filter(s=>s.enabled!==false&&s.relevant!==false&&sourceSettings[s.id]!==false)
    const plan=buildResearchPlan(target,registry)
    researchPlan=[...researchPlan,...plan.map(q=>({...q,personId:target.id,personName:target.canonicalName}))]
    const grouped=new Map()
    for(const q of plan){if(!grouped.has(q.sourceId))grouped.set(q.sourceId,[]);grouped.get(q.sourceId).push(q)}

    for(const source of enabled){
      const startedAt=nowIso()
      const queries=grouped.get(source.id)||[]
      if(source.method==='source_discovery_only'||source.method==='user_document_or_authorized_request'){
        discoveries.push({id:uid(),sourceId:source.id,source:source.name,personId:target.id,url:source.url,queries,reason:source.method})
        runs.push({id:uid(),sourceId:source.id,source:source.name,personId:target.id,status:'discovery',queryCount:queries.length,hits:0,verifiedHits:0,url:source.url,method:source.method,startedAt,finishedAt:nowIso()})
        continue
      }
      try{
        const result=await fetcher(source,queries[0]?.query||target.canonicalName)
        if(source.id==='ign'){
          const place=parsePlace(result.text,target)
          if(place&&!places.some(p=>slug(p.name)===slug(place.name)&&slug(p.province)===slug(place.province))) places.push(place)
          runs.push({id:uid(),sourceId:source.id,source:source.name,personId:target.id,status:'ok',queryCount:queries.length,hits:place?1:0,verifiedHits:0,contextHits:place?1:0,url:source.url,via:result.via,method:source.method,startedAt,finishedAt:nowIso()})
          continue
        }
        const candidates=extractCandidateRecords(result.text,target,source)
        let verifiedHits=0
        let hintHits=0
        for(const candidate of candidates){
          if(source.priority===5){hintHits++;continue}
          const ev=evidenceFromCandidate(candidate,target,source)
          if(!ev) continue
          ev.id=uid()
          ev.raw_metadata={...ev.raw_metadata,priority:source.priority,query:queries[0]?.query||'',via:result.via}
          if(evidence.some(e=>e.semantic_fingerprint===ev.semantic_fingerprint||e.hash===ev.hash)) continue
          evidence.push(ev)
          verifiedHits++
          const linked=people.find(p=>p.id===target.id)
          if(linked) linked.evidenceIds=[...new Set([...(linked.evidenceIds||[]),ev.id])]
          const newPeople=expandPeopleQueue(people,ev.relations,target).slice(0,Math.max(0,maxPeople-people.length))
          for(const np of newPeople){np.evidenceIds=[ev.id];people.push(np);if(depth<maxDepth)queue.push({person:np,depth:depth+1})}
          const newRelations=relationsFromEvidence(ev,target,people)
          for(const rel of newRelations) if(!relations.some(r=>r.personA===rel.personA&&r.personB===rel.personB&&r.relationType===rel.relationType)) relations.push(rel)
          const newEvents=eventsFromEvidence(ev,target.id)
          for(const event of newEvents) if(!events.some(e=>e.personId===event.personId&&e.eventType===event.eventType&&e.dateFrom===event.dateFrom&&e.sourceEvidenceId===event.sourceEvidenceId)) events.push(event)
        }
        runs.push({id:uid(),sourceId:source.id,source:source.name,personId:target.id,status:'ok',queryCount:queries.length,hits:candidates.length,verifiedHits,hintHits,url:source.url,via:result.via,method:source.method,startedAt,finishedAt:nowIso()})
      }catch(error){
        runs.push({id:uid(),sourceId:source.id,source:source.name,personId:target.id,status:'unavailable',queryCount:queries.length,hits:0,verifiedHits:0,url:source.url,method:source.method,error:String(error?.message||error),startedAt,finishedAt:nowIso()})
      }
      if(options.onProgress) options.onProgress({runs:[...runs],people:[...people],evidence:[...evidence],events:[...events],relations:[...relations],places:[...places],target,source})
    }
  }

  const cleaned=dedupeEvidence(evidence)
  for(const p of people){const status=assessPersonStatus(p,cleaned);p.status=status.status;p.confidence=status.confidence}
  const conflicts=conflictScan(people,events,study.conflicts||[])
  const verified=cleaned.filter(e=>e.raw_metadata?.validated_identity)
  const official=verified.filter(e=>Number(e.raw_metadata?.priority)<=2)
  const conclusion=verified.length
    ?`${verified.length} evidencias documentales han superado el filtro de identidad; ${official.length} proceden de fuentes primarias u oficiales. Las relaciones detectadas mantienen enlace a su evidencia y se amplían automáticamente por familiares y colaterales.`
    :'No se ha atribuido ningún documento a la persona raíz sin evidencia suficiente. Las coincidencias débiles no se convierten en personas, eventos ni parentescos.'
  return {...study,people,relations,events,evidence:cleaned,conflicts,places,runs:[...runs,...(study.runs||[])].slice(0,800),discoveries:[...discoveries,...(study.discoveries||[])].slice(0,400),researchPlan,status:'completed',progress:100,lastResearchAt:nowIso(),lastConclusion:conclusion}
}
