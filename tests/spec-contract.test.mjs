import assert from 'node:assert/strict'
import { buildSourceRegistry, requiredEvidenceFields, buildResearchPlan } from '../src/services/sourceRegistry.js'
import { identityScore, normalizeEvidence, extractRelationsFromText } from '../src/services/genealogyEngine.js'
import { runResearchCycle } from '../src/services/researchRunner.js'
const root={id:'root',canonicalName:'Juan García López',givenNames:'Juan',surname1:'García',surname2:'López',birthFrom:'1888',municipality:'Toledo',province:'Toledo',country:'España',isRoot:true,status:'accepted',confidence:1,evidenceIds:[]}
const registry=buildSourceRegistry(root)
const ids=new Set(registry.map(s=>s.id))
for(const id of ['familysearch','pares','bne-hemeroteca','bne-digital','bne-linked','hispana','boe-gazeta','ign','ine','catastro','catastro-ensenada','cee','parroquiales','ahp','protocolos-notariales','defensa','nobleza','censo-guia','registro-civil','archivos-municipales','padrones-censos','censos-electorales','geneanet','prensa-regional','regional-andalucia','regional-aragon','regional-asturias','regional-canarias','regional-cantabria','regional-clm','regional-cyl','regional-catalunya','regional-valencia','regional-extremadura','regional-galicia','regional-madrid','regional-murcia','regional-navarra','regional-paisvasco','regional-larioja']) assert(ids.has(id),`Falta ${id}`)
const expected=['source','source_type','repository','external_id','record_type','title','date','place','people','relations','url','image_url','raw_metadata','raw_text','ocr_text','retrieved_at','source_weight','hash','semantic_fingerprint']
assert.deepEqual(requiredEvidenceFields,expected)
const plan=buildResearchPlan(root,registry)
for(const id of ['familysearch','pares','bne-hemeroteca','hispana','regional-clm']) assert(plan.some(q=>q.sourceId===id),`Plan sin ${id}`)
assert(identityScore(root,{name:'Juan García López',date:'1888',place:'Toledo',relations:[]})>=.8)
assert(identityScore(root,{name:'Juan García',date:'1891',place:'Toledo',relations:[]})<.8)
const rels=extractRelationsFromText('Padre: Pedro García Martín. Madre: María López Ruiz. Cónyuge: Ana Martín Pérez.',root.canonicalName)
assert(rels.some(r=>r.relation==='padre'))
assert(rels.some(r=>r.relation==='madre'))
assert(rels.some(r=>r.relation==='cónyuge'))
const ev=normalizeEvidence({source:'PARES',source_type:'Archivo estatal',repository:'AHN',external_id:'ABC-123',record_type:'expediente',title:'Expediente',date:'1910',place:'Toledo',people:['Juan García López'],relations:[],url:'record'})
for(const field of expected) assert(Object.hasOwn(ev,field),`Falta ${field}`)
const study={id:'s1',people:[root],relations:[],events:[],evidence:[],places:[],conflicts:[],runs:[],sourceSettings:{pares:true},researchPlan:[]}
const mockFetcher=async source=>{
  if(source.id==='pares') return {text:'Juan García López · nacimiento 1888 · Toledo · Signatura: TEST-123 · Padre: Pedro García Martín. Madre: María López Ruiz.',via:'fixture'}
  if(source.id==='ign') return {text:'[{"address":"Toledo","municipality":"Toledo","province":"Toledo","lat":39.8628,"lng":-4.0273}]',via:'fixture'}
  return {text:'Sin resultados',via:'fixture'}
}
const cycle=await runResearchCycle(study,{registry:registry.filter(s=>['pares','ign'].includes(s.id)),fetcher:mockFetcher,maxDepth:1,maxPeople:10})
assert.equal(cycle.evidence.length,1)
assert(cycle.people.some(p=>p.canonicalName==='Pedro García Martín'))
assert(cycle.people.some(p=>p.canonicalName==='María López Ruiz'))
assert(cycle.relations.some(r=>r.relationType==='padre'))
assert(cycle.relations.some(r=>r.relationType==='madre'))
assert(cycle.events.some(e=>e.dateFrom==='1888'))
assert(cycle.places.some(p=>p.municipality==='Toledo'))
assert(cycle.evidence[0].url)
console.log('SPEC_CONTRACT_OK',registry.length,plan.length,cycle.evidence.length)
