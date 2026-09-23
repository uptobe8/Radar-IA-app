import fs from 'node:fs'

const result = JSON.parse(fs.readFileSync('study-result.json','utf8'))
const evidence = Array.isArray(result.evidence) ? result.evidence : []
const people = Array.isArray(result.people) ? result.people : []
const events = Array.isArray(result.events) ? result.events : []

const badEvidence = evidence.filter(e => {
  const t = String(e.raw_text || '').toLowerCase()
  return t.includes('search results') || t.includes('búsqueda efectuada') || t.startsWith('palabra:') || t.includes('palabra: juan garcía lópez toledo')
})
const partialFamilySearch = evidence.filter(e => e.source === 'FamilySearch' && (!String(e.raw_text || '').toLowerCase().includes('garcía lópez') || !e.external_id))
const unvalidatedEvidence = evidence.filter(e => e.raw_metadata?.validatedIdentity !== true)
const bogusPeople = people
  .map(p => String(p.canonicalName || p.name || ''))
  .filter(n => /search results|juan garc[ií]a l[oó]pez toledo/i.test(n))
const bogusYears = events
  .map(e => String(e.dateFrom || e.date || ''))
  .filter(y => y === '1885' || y === '1891')

if (badEvidence.length) throw new Error(`Query/header text accepted as evidence: ${badEvidence.map(e=>e.raw_text).join(' | ')}`)
if (partialFamilySearch.length) throw new Error(`Partial/unidentified FamilySearch records accepted: ${partialFamilySearch.map(e=>e.raw_text).join(' | ')}`)
if (unvalidatedEvidence.length) throw new Error(`Evidence without identity validation: ${unvalidatedEvidence.map(e=>e.id || e.title).join(', ')}`)
if (bogusPeople.length) throw new Error(`UI/query text accepted as people: ${bogusPeople.join(', ')}`)
if (bogusYears.length) throw new Error(`Search-bound years accepted as events: ${bogusYears.join(', ')}`)
if (Number(result.summary?.verifiedEvidenceCount ?? evidence.length) !== evidence.length) throw new Error('Summary evidence count does not match evidence array')
if (people.slice(1).some(p => !Array.isArray(p.evidenceIds) || p.evidenceIds.length === 0)) throw new Error('Non-root person without evidence')
if (result.relations?.some(r => !r.sourceEvidenceId)) throw new Error('Relationship without source evidence')

console.log('VALIDATION_OK')
