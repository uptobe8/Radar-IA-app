const esc=encodeURIComponent
const norm=(v='')=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()

export const requiredEvidenceFields=['source','source_type','repository','external_id','record_type','title','date','place','people','relations','url','image_url','raw_metadata','raw_text','ocr_text','retrieved_at','source_weight','hash','semantic_fingerprint']
export const SOURCE_PRIORITIES={1:'Primaria',2:'Repositorio oficial',3:'Contexto',4:'Secundaria',5:'Colaborativa'}

const REGIONS=[
  ['andalucia','Andalucía · @rchivAWeb','https://www.juntadeandalucia.es/cultura/archivos/','andalucia sevilla malaga cadiz cordoba granada huelva jaen almeria'],
  ['aragon','Aragón · DARA','https://dara.aragon.es/','aragon zaragoza huesca teruel'],
  ['asturias','Asturias · Archivos de Asturias','https://archivosdeasturias.info/','asturias oviedo gijon aviles'],
  ['canarias','Canarias · Memoria Digital','https://mdc.ulpgc.es/','canarias tenerife gran canaria las palmas lanzarote fuerteventura'],
  ['cantabria','Cantabria · Archivo Histórico Provincial','https://cultura.cantabria.es/archivos','cantabria santander'],
  ['clm','Castilla-La Mancha · Archivos','https://archivos.castillalamancha.es/','castilla-la mancha toledo ciudad real cuenca guadalajara albacete'],
  ['cyl','Castilla y León · Archivos','https://archivoscastillayleon.jcyl.es/','castilla y leon valladolid zamora salamanca leon burgos palencia segovia soria avila'],
  ['catalunya','Cataluña · Arxius en Línia','https://arxiusenlinia.cultura.gencat.cat/','cataluna catalunya barcelona girona lerida lleida tarragona'],
  ['valencia','Comunitat Valenciana · SAVEX','https://savex.gva.es/','comunitat valenciana valencia alicante castellon'],
  ['extremadura','Extremadura · WAREX','https://archivosextremadura.gobex.es/','extremadura badajoz caceres'],
  ['galicia','Galicia · Arquivos de Galicia / Galiciana','https://arquivosdegalicia.xunta.gal/','galicia coruna lugo ourense pontevedra'],
  ['madrid','Madrid · Portal de Archivos','https://www.comunidad.madrid/servicios/cultura/archivos','madrid'],
  ['murcia','Murcia · Archivo General / Carmesí','https://archivogeneral.carm.es/','murcia cartagena lorca'],
  ['navarra','Navarra · Archivo Abierto','https://archivoabierto.navarra.es/','navarra pamplona'],
  ['paisvasco','País Vasco · Dokuklik / Badator','https://dokuklik.euskadi.eus/','pais vasco euskadi alava bizkaia vizcaya gipuzkoa guipuzcoa'],
  ['larioja','La Rioja · Sistema de Archivos','https://www.larioja.org/archivo/es','la rioja logrono']
]

const personParts=p=>{
  const full=[p.givenNames,p.surname1,p.surname2].filter(Boolean).join(' ').trim()
  const surnames=[p.surname1,p.surname2].filter(Boolean).join(' ').trim()
  const place=[p.municipality,p.province].filter(Boolean).join(', ').trim()
  const year=Number(String(p.birthFrom||'').match(/\d{4}/)?.[0])||null
  return {full,surnames,place,year}
}

const src=(id,name,type,priority,weight,method,url,relevant=true,extra={})=>({id,name,type,priority,weight,method,enabled:true,relevant,url,...extra})

export function regionIdForPerson(p={}){
  const hay=norm(`${p.municipality||''} ${p.province||''}`)
  const hit=REGIONS.find(([, , ,tokens])=>tokens.split(' ').some(t=>t.length>4&&hay.includes(norm(t))))
  if(hit) return `regional-${hit[0]}`
  if(hay.includes('toledo')||hay.includes('albacete')||hay.includes('cuenca')||hay.includes('guadalajara')||hay.includes('ciudad real')) return 'regional-clm'
  return null
}

export function buildSourceRegistry(p={}){
  const {full,surnames,place,year}=personParts(p)
  const q=esc([full,place].filter(Boolean).join(' '))
  const qName=esc(full)
  const qSurname=esc(surnames)
  const regional=REGIONS.map(([id,name,url,tokens])=>src(`regional-${id}`,name,'Archivo regional',2,.86,'search_adapter',url,tokens.split(' ').some(t=>t.length>4&&norm(`${p.municipality||''} ${p.province||''}`).includes(norm(t))),{scope:'regional'}))
  return [
    src('familysearch','FamilySearch','Registros genealógicos y reproducciones de fuentes originales',2,.95,'search_adapter',`https://www.familysearch.org/search/record/results?count=20&q.givenName=${esc(p.givenNames||'')}&q.surname=${qSurname}${place?`&q.birthLikePlace=${esc(place)}`:''}${year?`&q.birthLikeDate.from=${year-5}&q.birthLikeDate.to=${year+5}`:''}`,true,{adapter:'familysearch.ts',interchange:'GEDCOM X',queryKinds:['nacimiento','bautismo','matrimonio','defunción','padres','hijos','hermanos','censo','municipal','pasaporte','consular','prematrimonial','notarial','eclesiástico']}),
    src('pares','PARES · Portal de Archivos Españoles','Archivo estatal',2,.96,'official_search_adapter',`https://pares.mcu.es/ParesBusquedas20/catalogo/find?texto=${q}`,true,{adapter:'pares.ts',capabilities:['official_search_adapter','HTR_adapter','digital_object_fetcher'],repositories:['Archivo Histórico Nacional','Archivo General de Simancas','Archivo General de Indias','Archivo General de la Administración','Archivo de la Corona de Aragón','Real Chancillería de Valladolid','Archivo Histórico de la Nobleza']}),
    src('bne-hemeroteca','BNE · Hemeroteca Digital','Prensa histórica',4,.68,'search_adapter',`https://hemerotecadigital.bne.es/hd/es/results?query=${esc(`"${full}" ${place}`)}`,true,{adapter:'bneHemeroteca.ts',queryKinds:['nombre','apellido_municipio','profesión','matrimonio','fallecimiento','esquela','accidente','nombramiento','juicio','emigración','comercio','militar']}),
    src('bne-digital','BNE Digital','Biblioteca digital',2,.8,'search_adapter',`https://bdh.bne.es/bnesearch/Search.do?field1val=${q}&field1Op=AND&numfields=1`,true,{adapter:'bneDigital.ts'}),
    src('bne-linked','Datos BNE · Linked Data','Autoridades y metadatos RDF',3,.82,'sparql_rdf','https://datos.bne.es/',true,{adapter:'bneLinkedData.ts',capabilities:['SPARQL','RDF','content_negotiation']}),
    src('hispana','Hispana','Agregador nacional OAI-PMH',2,.86,'oai_pmh',`https://hispana.mcu.es/es/consulta/resultados.do?busq_palabra=${q}`,true,{adapter:'hispana.ts',capabilities:['ListRecords','GetRecord','ListSets','resumptionToken','incremental_harvesting']}),
    src('boe-gazeta','BOE · Gazeta histórica','Diario oficial histórico',2,.9,'official_search_adapter',`https://www.boe.es/buscar/gazeta.php?campo%5B0%5D=TIT&dato%5B0%5D=${qName}`,true,{adapter:'boeGazeta.ts'}),
    src('ign','IGN · Nomenclátor / CartoCiudad','Normalización geográfica',3,.9,'api',`https://www.cartociudad.es/geocoder/api/geocoder/find?q=${esc(place)}`,true,{contextOnly:true,adapter:'ign.ts',historicalYears:[1858,1863,1888,1900,1910,1920,1930,1940,1950]}),
    src('ine','INE · Nomenclátor','Entidades y núcleos de población',3,.86,'open_data','https://www.ine.es/nomen2/index.do',true,{contextOnly:true,adapter:'ine.ts'}),
    src('catastro','Catastro actual','Contexto territorial público',3,.78,'public_web_services','https://www.sedecatastro.gob.es/',true,{contextOnly:true,adapter:'catastro.ts',protectedData:false}),
    src('catastro-ensenada','Catastro de Ensenada','Fuente histórica de hogares',1,.96,'search_adapter',`https://www.familysearch.org/search/catalog/results?count=20&query=%2Bkeywords%3A${esc(`Catastro Ensenada ${place}`)}`,Boolean(year&&year<1820),{adapter:'catastroEnsenada.ts'}),
    src('cee','Conferencia Episcopal · Directorio parroquial','Directorio eclesiástico',3,.78,'source_discovery_only','https://www.conferenciaepiscopal.es/parroquias/',true,{contextOnly:true,adapter:'cee.ts'}),
    src('parroquiales','Registros parroquiales y archivos diocesanos','Fuente primaria eclesiástica',1,.99,'search_adapter',`https://www.familysearch.org/search/catalog/results?count=20&query=%2Bplace%3A${esc(place)}%20%2Bkeywords%3Aparish`,true,{adapter:'parroquiales.ts',queryKinds:['bautismo','matrimonio','defunción','entierro','confirmación','expediente matrimonial','dispensa','libro de fábrica','padrón parroquial']}),
    src('ahp','Archivo Histórico Provincial','Fuente primaria provincial',1,.98,'source_discovery_only','https://censoarchivos.mcu.es/CensoGuia/portada.htm',true,{adapter:'ahp.ts'}),
    src('protocolos-notariales','Protocolos notariales','Fuente primaria notarial',1,.99,'search_adapter',`https://pares.mcu.es/ParesBusquedas20/catalogo/find?texto=${esc(`${surnames} ${place} testamento`)}`,true,{adapter:'protocolosNotariales.ts',queryKinds:['testamento','codicilo','partición','inventario post mortem','capitulaciones','dote','poder','compraventa','herencia','tutela']}),
    src('defensa','Biblioteca Virtual de Defensa','Documentación militar',2,.9,'search_adapter',`https://bibliotecavirtual.defensa.gob.es/BVMDefensa/es/consulta/resultados.do?busq_palabra=${qName}`,true,{adapter:'defensa.ts'}),
    src('militar-segovia','Archivo General Militar de Segovia','Fuente primaria militar',1,.98,'source_discovery_only','https://www.defensa.gob.es/portaldecultura/patrimoniocultural/archivos/',true,{adapter:'militarSegovia.ts'}),
    src('militar-guadalajara','Archivo General Militar de Guadalajara','Fuente primaria militar',1,.98,'source_discovery_only','https://www.defensa.gob.es/portaldecultura/patrimoniocultural/archivos/',true,{adapter:'militarGuadalajara.ts'}),
    src('militar-avila','Archivo General Militar de Ávila','Fuente primaria militar',1,.98,'source_discovery_only','https://www.defensa.gob.es/portaldecultura/patrimoniocultural/archivos/',true,{adapter:'militarAvila.ts'}),
    src('defensa-historico','Archivo General e Histórico de Defensa','Fuente primaria militar',1,.98,'source_discovery_only','https://www.defensa.gob.es/portaldecultura/patrimoniocultural/archivos/',true,{adapter:'defensaHistorico.ts'}),
    src('armada-historico','Archivo Histórico de la Armada','Fuente primaria militar naval',1,.98,'source_discovery_only','https://www.defensa.gob.es/portaldecultura/patrimoniocultural/archivos/',true,{adapter:'armadaHistorico.ts'}),
    src('nobleza','Archivo Histórico de la Nobleza','Archivo estatal de linajes',1,.97,'search_adapter',`https://pares.mcu.es/ParesBusquedas20/catalogo/find?texto=${qSurname}`,true,{adapter:'nobleza.ts'}),
    src('censo-guia','Censo-Guía de Archivos','Descubrimiento de archivos',3,.72,'source_discovery_only','https://censoarchivos.mcu.es/CensoGuia/portada.htm',true,{contextOnly:true,adapter:'censoGuia.ts'}),
    src('archivos-municipales','Archivos municipales','Fuente primaria municipal',1,.98,'source_discovery_only','https://censoarchivos.mcu.es/CensoGuia/portada.htm',true,{adapter:'municipal.ts'}),
    src('padrones-censos','Padrones y censos','Fuente primaria poblacional',1,.99,'search_adapter',`https://pares.mcu.es/ParesBusquedas20/catalogo/find?texto=${esc(`${full} ${place} padrón censo`)}`,true,{adapter:'padrones.ts'}),
    src('censos-electorales','Censos electorales','Fuente primaria censal',1,.96,'search_adapter',`https://www.familysearch.org/search/record/results?count=20&q.givenName=${esc(p.givenNames||'')}&q.surname=${qSurname}&q.residencePlace=${esc(place)}`,true,{adapter:'censosElectorales.ts'}),
    src('registro-civil','Registro Civil','Fuente primaria civil',1,1,'user_document_or_authorized_request','https://sede.mjusticia.gob.es/',Boolean(!year||year>=1871),{adapter:'registroCivil.ts',documentOCR:true}),
    src('findagrave','Find a Grave','Cementerio / secundaria',4,.44,'hint_only',`https://www.findagrave.com/memorial/search?firstname=${esc(p.givenNames||'')}&lastname=${qSurname}`,true,{adapter:'findAGrave.ts'}),
    src('billiongraves','BillionGraves','Cementerio / secundaria',4,.42,'hint_only','https://billiongraves.com/search',true,{adapter:'billionGraves.ts'}),
    src('geneanet','Geneanet','Árboles colaborativos',5,.35,'hint_only',`https://es.geneanet.org/fonds/individus/?go=1&nom=${qSurname}&prenom=${esc(p.givenNames||'')}`,true,{adapter:'geneanet.ts'}),
    src('cyndi-hispagen-raices',"Cyndi's List · HISPAGEN · Foro Raíces",'Directorios colaborativos',5,.3,'source_discovery_only','https://www.cyndislist.com/spain/',true,{contextOnly:true,adapter:'collaborativeDirectories.ts'}),
    src('prensa-regional','Prensa regional y local','Hemerotecas territoriales',4,.62,'source_discovery_only','https://hispana.mcu.es/',true,{adapter:'regionalPress.ts'}),
    ...regional
  ]
}

const add=(out,sourceId,kind,query,priority)=>out.push({id:`${sourceId}:${kind}:${norm(query)}`,sourceId,kind,query,priority})

export function buildResearchPlan(p={},registry=buildSourceRegistry(p)){
  const {full,surnames,place}=personParts(p)
  const byId=new Map(registry.map(s=>[s.id,s]))
  const out=[]
  for(const kind of ['nacimiento','bautismo','matrimonio','defunción','padres','hijos','hermanos','censo','registros municipales','pasaportes','registros consulares','expedientes prematrimoniales','protocolos notariales','registros eclesiásticos']) add(out,'familysearch',kind,`${full} ${place} ${kind}`,2)
  for(const kind of ['nombre completo','apellidos','variantes','testamento','herencia','expediente','judicial','militar','notario','propiedad']) add(out,'pares',kind,`${kind==='apellidos'?surnames:full} ${place} ${kind}`,2)
  for(const kind of ['nombre exacto','apellido municipio','profesión','matrimonio','fallecimiento','esquela','accidente','nombramiento','juicio','emigración','comercio','militar']) add(out,'bne-hemeroteca',kind,`${full} ${place} ${kind}`,4)
  add(out,'bne-digital','documentos',`${full} ${place}`,2)
  add(out,'bne-linked','autoridades',full,3)
  add(out,'hispana','patrimonio',`${full} ${place}`,2)
  add(out,'boe-gazeta','gazeta',full,2)
  add(out,'ign','topónimo',place,3)
  add(out,'ine','entidad',place,3)
  add(out,'catastro','contexto territorial',place,3)
  add(out,'cee','parroquias',place,3)
  add(out,'parroquiales','sacramentales',`${full} ${place}`,1)
  add(out,'ahp','archivo provincial',`${surnames} ${place}`,1)
  add(out,'protocolos-notariales','notarial',`${surnames} ${place}`,1)
  add(out,'defensa','militar',full,2)
  add(out,'archivos-municipales','municipal',`${full} ${place}`,1)
  add(out,'padrones-censos','padrón',`${full} ${place}`,1)
  add(out,'censos-electorales','electoral',`${full} ${place}`,1)
  add(out,'registro-civil','civil',`${full} ${place}`,1)
  add(out,'geneanet','hipótesis',`${full} ${place}`,5)
  add(out,'prensa-regional','prensa local',`${full} ${place}`,4)
  const region=regionIdForPerson(p)
  if(region&&byId.has(region)) add(out,region,'archivo regional',`${full} ${place}`,2)
  return out.filter(x=>byId.has(x.sourceId)&&byId.get(x.sourceId).enabled!==false&&byId.get(x.sourceId).relevant!==false)
}
