const slug = (v='') => v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
const esc = encodeURIComponent
const nowIso = () => new Date().toISOString()

const person = {
  givenNames: 'Juan',
  surname1: 'García',
  surname2: 'López',
  birthFrom: '1888',
  municipality: 'Toledo',
  province: 'Toledo',
  country: 'España',
}
person.canonicalName = [person.givenNames, person.surname1, person.surname2].join(' ')

const full = person.canonicalName
const surname = `${person.surname1} ${person.surname2}`
const place = `${person.municipality}, ${person.province}`
const y = 1888

const sources = [
  {id:'familysearch',name:'FamilySearch',type:'Repositorio oficial',weight:.92,url:`https://www.familysearch.org/search/record/results?count=20&q.givenName=${esc(person.givenNames)}&q.surname=${esc(surname)}&q.birthLikePlace=${esc(place)}&q.birthLikeDate.from=${y-3}&q.birthLikeDate.to=${y+3}`},
  {id:'pares',name:'PARES',type:'Archivo estatal',weight:.95,url:`https://pares.mcu.es/ParesBusquedas20/catalogo/find?nm=&texto=${esc(full+' '+place)}`},
  {id:'bne-hemeroteca',name:'BNE · Hemeroteca Digital',type:'Prensa histórica',weight:.62,url:`https://hemerotecadigital.bne.es/hd/es/results?query=${esc('"'+full+'" '+place)}`},
  {id:'bne-digital',name:'BNE Digital',type:'Biblioteca digital',weight:.72,url:`https://bdh.bne.es/bnesearch/Search.do?text=&field1val=${esc(full+' '+place)}&field1Op=AND&numfields=1`},
  {id:'hispana',name:'Hispana',type:'Agregador OAI-PMH',weight:.78,url:`https://hispana.mcu.es/es/consulta/resultados.do?busq_palabra=${esc(full+' '+place)}`},
  {id:'boe',name:'BOE · Gazeta histórica',type:'Diario oficial',weight:.84,url:`https://www.boe.es/buscar/gazeta.php?campo%5B0%5D=TIT&dato%5B0%5D=${esc(full)}`},
  {id:'ign',name:'IGN / CartoCiudad',type:'Normalización geográfica',weight:.80,url:`https://www.cartociudad.es/geocoder/api/geocoder/find?q=${esc(place)}`},
  {id:'clm',name:'Castilla-La Mancha · Archivos',type:'Archivo regional',weight:.82,url:'https://archivos.castillalamancha.es/'},
]

async function fetchText(url){
  const attempts = [url, `https://r.jina.ai/${url}`]
  let last = ''
  for(const candidate of attempts){
    try{
      const r = await fetch(candidate,{headers:{Accept:'text/plain, text/html, application/json','User-Agent':'Radar-Cero-Research/1.0'}})
      if(!r.ok) throw new Error(`HTTP ${r.status}`)
      const t = await r.text()
      if(t && t.length > 40) return {text:t, via:candidate}
    }catch(e){ last = e.message }
  }
  throw new Error(last || 'No accesible')
}

function extractSnippets(text){
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

const result = {
  study: {title:`Estudio · ${person.canonicalName}`, root:person, createdAt:nowIso()},
  runs:[], evidence:[], detectedPeople:[], detectedYears:[], summary:{}
}

for (const src of sources) {
  const startedAt = nowIso()
  try {
    const {text,via} = await fetchText(src.url)
    const snippets = extractSnippets(text)
    const names = [...new Set(snippets.flatMap(namesFromText))].filter(n=>slug(n)!==slug(full)).slice(0,10)
    const years = [...new Set(snippets.flatMap(yearsFromText))].slice(0,10)
    result.runs.push({source:src.name,status:'ok',hits:snippets.length,url:src.url,via,startedAt,finishedAt:nowIso()})
    for (const snippet of snippets) {
      result.evidence.push({source:src.name,source_type:src.type,repository:src.name,record_type:'resultado documental',title:`Coincidencia para ${full}`,date:'',place,people:[full],relations:[],url:src.url,image_url:'',raw_text:snippet,retrieved_at:nowIso(),source_weight:src.weight,status:'detected'})
    }
    result.detectedPeople.push(...names)
    result.detectedYears.push(...years)
  } catch (e) {
    result.runs.push({source:src.name,status:'unavailable',hits:0,error:String(e.message||e),url:src.url,startedAt,finishedAt:nowIso()})
  }
}

result.detectedPeople = [...new Set(result.detectedPeople)].slice(0,20)
result.detectedYears = [...new Set(result.detectedYears)].sort()
result.summary = {
  sourcesConsulted: result.runs.length,
  sourcesAvailable: result.runs.filter(r=>r.status==='ok').length,
  sourcesUnavailable: result.runs.filter(r=>r.status!=='ok').length,
  evidenceCount: result.evidence.length,
  detectedPeopleCount: result.detectedPeople.length,
  detectedYearCount: result.detectedYears.length,
}

await import('node:fs').then(fs=>fs.writeFileSync('study-result.json', JSON.stringify(result,null,2)))
console.log('RADAR_CERO_RESULT_START')
console.log(JSON.stringify(result,null,2))
console.log('RADAR_CERO_RESULT_END')
