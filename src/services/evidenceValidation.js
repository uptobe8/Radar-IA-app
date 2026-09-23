export const slug = (v='') => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()

const NO_RESULTS = [
  'no hay ningún registro que cumpla',
  'no hay ningun registro que cumpla',
  '0 resultados',
  '0 results',
  'no results found',
  'sin resultados'
]

const QUERY_ECHO = [
  'search results',
  'búsqueda efectuada',
  'busqueda efectuada',
  'palabra:',
  'field1val=',
  'busq_palabra=',
  'q.givenname=',
  'q.surname=',
  'query='
]

const RECORD_SIGNALS = [
  'ark:/',
  'signatura',
  'fecha',
  'nacimiento',
  'bautismo',
  'matrimonio',
  'defunción',
  'defuncion',
  'entierro',
  'padre',
  'madre',
  'cónyuge',
  'conyuge',
  'esposo',
  'esposa',
  'hijo',
  'hija',
  'domicilio',
  'profesión',
  'profesion',
  'registro',
  'expediente',
  'fondo',
  'serie',
  'página',
  'pagina'
]

export function pageHasNoResults(text='') {
  const s = slug(text)
  return NO_RESULTS.some(v => s.includes(slug(v)))
}

export function isQueryEcho(line='') {
  const s = slug(line)
  return QUERY_ECHO.some(v => s.includes(slug(v)))
}

export function exactRootNamePresent(line, person) {
  const full = slug([person.givenNames,person.surname1,person.surname2].filter(Boolean).join(' '))
  return full.length > 3 && slug(line).includes(full)
}

export function recordSignalPresent(line='') {
  const s = slug(line)
  return RECORD_SIGNALS.some(v => s.includes(slug(v))) || /\b(1[5-9]\d{2}|20[0-2]\d)\b/.test(line)
}

export function extractValidatedSnippets(text, person, sourceId='') {
  if (!text || pageHasNoResults(text)) return []
  const lines = String(text).replace(/<[^>]+>/g,' ').split(/\n|\r/).map(v=>v.replace(/\s+/g,' ').trim()).filter(v=>v.length>12)
  const full = slug([person.givenNames,person.surname1,person.surname2].filter(Boolean).join(' '))
  const out = []
  for (const line of lines) {
    if (isQueryEcho(line)) continue
    const s = slug(line)
    if (!s.includes(full)) continue
    if (sourceId === 'familysearch') {
      const m = line.match(/\[([^\]]+)\]\((https?:\/\/www\.familysearch\.org\/ark:\/61903\/1:1:[^)]+)\)/i)
      if (!m) continue
      if (slug(m[1]) !== full) continue
      out.push(line)
      continue
    }
    if (!recordSignalPresent(line)) continue
    out.push(line)
  }
  return [...new Set(out)].slice(0,10)
}

export function extractExternalId(line='', sourceId='') {
  if (sourceId === 'familysearch') {
    const m = line.match(/ark:\/61903\/1:1:([A-Z0-9-]+)/i)
    return m ? m[1] : ''
  }
  const signatura = line.match(/signatura\s*[:\-]?\s*([^|;,]+)/i)
  return signatura ? signatura[1].trim() : ''
}

export function extractRecordUrl(line='', fallback='') {
  const m = line.match(/\((https?:\/\/[^)]+)\)/)
  return m ? m[1] : fallback
}

export function extractYears(line='') {
  return [...new Set((String(line).match(/\b(1[5-9]\d{2}|20[0-2]\d)\b/g)||[]))]
}

export function extractRelatives(line='', rootName='') {
  const result=[]
  const re=/\b(padre|madre|c[oó]nyuge|esposo|esposa|hijo|hija|hermano|hermana)\s*[:\-]?\s*([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñüÜ'-]+(?:\s+(?:de|del|la|las|los|y))?\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñüÜ'-]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñüÜ'-]+){0,2})/g
  let m
  while((m=re.exec(String(line))) && result.length<10){
    const name=m[2].replace(/\s+/g,' ').trim()
    if(slug(name)!==slug(rootName) && !result.some(x=>slug(x.name)===slug(name))) result.push({relation:m[1].toLowerCase(),name})
  }
  return result
}

export function confidenceForSnippet(line, person, sourceWeight=.5) {
  let score=.35 + Number(sourceWeight||0)*.35
  if (exactRootNamePresent(line,person)) score += .12
  if (/\b(1[5-9]\d{2}|20[0-2]\d)\b/.test(line)) score += .06
  if (extractRelatives(line,[person.givenNames,person.surname1,person.surname2].filter(Boolean).join(' ')).length) score += .07
  return Math.min(.98,Math.round(score*100)/100)
}
