import fs from 'node:fs'

const result = JSON.parse(fs.readFileSync('study-result.json','utf8'))
const badEvidence = result.evidence.filter(e => {
  const t = String(e.raw_text || '').toLowerCase()
  return t.includes('search results') || t.includes('búsqueda efectuada') || t.startsWith('palabra:') || t.includes('palabra: juan garcía lópez toledo')
})
const partialFamilySearch = result.evidence.filter(e => e.source === 'FamilySearch' && !String(e.raw_text || '').toLowerCase().includes('garcía lópez'))
const bogusPeople = result.detectedPeople.filter(n => /search results|juan garc[ií]a l[oó]pez toledo/i.test(n))
const bogusYears = result.detectedYears.filter(y => y === '1885' || y === '1891')

if (badEvidence.length) throw new Error(`Query/header text accepted as evidence: ${badEvidence.map(e=>e.raw_text).join(' | ')}`)
if (partialFamilySearch.length) throw new Error(`Partial FamilySearch names accepted as evidence: ${partialFamilySearch.map(e=>e.raw_text).join(' | ')}`)
if (bogusPeople.length) throw new Error(`UI/query text accepted as people: ${bogusPeople.join(', ')}`)
if (bogusYears.length) throw new Error(`Search-bound years accepted as events: ${bogusYears.join(', ')}`)

console.log('VALIDATION_OK')
