'use strict';
const LANGUAGES = ['pt', 'en', 'es'];
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
function safeURL(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; } }
const PLATFORM_IMAGES={"PS1": "ps1", "PS2": "ps2", "PS3": "ps3", "PS4": "ps4", "Xbox 360": "xbox360", "Nintendo 64": "n64", "GameCube": "gamecube", "Switch": "switch", "Wii U": "wiiu"};
function fallbackImage(p){return "assets/platforms/"+(PLATFORM_IMAGES[p.origins[0]]||"generic")+".svg";}
function safeImageURL(value){
  if(typeof value!=='string')return null;
  if(/^assets\/platforms\/(?:ps[1-4]|xbox360|n64|gamecube|switch|wiiu|generic)\.svg$/.test(value))return value;
  const safe=safeURL(value);if(!safe)return null;
  const parsedImage=new URL(safe);if(parsedImage.hostname==='www.inxanitylabs.com'&&/^\/assets\/games\/[a-z0-9-]+\.(?:webp|png|jpg|jpeg)$/.test(parsedImage.pathname)&&!parsedImage.search)return safe;
  const allowed=['upload.wikimedia.org','thumb.wikimedia.org','raw.githubusercontent.com','cdn2.steamgriddb.com','images.nintendolife.com'];
  return allowed.includes(new URL(safe).hostname)?safe:null;
}
function validDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
function validateProject(p) {
  const required = ['id','editionId','game','name','type','playability','developmentStage','approach','instructionsUrl','reviewedAt','reviewedVersion','evidenceUrl'];
  if (!p || required.some(k => typeof p[k] !== 'string' || !p[k].trim())) throw new Error('Incomplete entry');
  if (!(['port','recompilacao','remake','emulador'].includes(p.type)||(p.browser&&p.type==='jogo-fa')) || !['jogavel','parcial','nao-verificado','por-jogo'].includes(p.playability)) throw new Error('Invalid classification');
  if (!['desenvolvimento','beta','experimental','maduro','parado','desconhecido'].includes(p.developmentStage)) throw new Error('Invalid stage');
  if (!(['source-port','static-recompilation','engine-reimplementation','native-runtime','emulation'].includes(p.approach)||(p.browser&&p.approach==='web-unconfirmed'))) throw new Error('Invalid approach');
  if (p.reviewedRelease && (!safeURL(p.reviewedRelease.url) || typeof p.reviewedRelease.tag !== 'string' || !p.reviewedRelease.tag.trim())) throw new Error('Invalid release');
  if (p.relatedProject && !safeURL(p.relatedProject)) throw new Error('Invalid related project');
  for (const k of ['origins','targets']) if (!Array.isArray(p[k]) || !p[k].length || p[k].some(v => typeof v !== 'string' || !v.trim())) throw new Error('Invalid platform list');
  if(p.image&&(!safeImageURL(p.image.url)||!['console','reference'].includes(p.image.kind)||(p.image.source&&!safeURL(p.image.source))))throw new Error('Invalid project image');
  if(p.browser&&(!safeURL(p.browser.url)||!['demo','shareware','own-files','free','web'].includes(p.browser.access)||p.browser.verification!=='documentation'))throw new Error('Invalid browser project');
  if(p.browser?.health&&!['reachable','review'].includes(p.browser.health.status))throw new Error('Invalid browser link state');
  const github = safeURL(p.github);
  if (p.sourceKind==='website') { if(!p.browser||p.github!==null||p.stars!==null||p.evidenceUrl!==p.browser.url||p.instructionsUrl!==p.browser.url||!/^https:\/\//.test(p.evidenceUrl)||!(/^[a-f0-9]{64}$/).test(p.reviewedVersion))throw new Error('Invalid website-only source'); }
  else if (!github || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(github)) throw new Error('Invalid repository');
  if (!safeURL(p.instructionsUrl) || !safeURL(p.evidenceUrl)) throw new Error('Invalid source');
  if (!validDate(p.reviewedAt) || p.reviewMethod !== 'documentation') throw new Error('Invalid review');
  if (!(p.stars === null || (Number.isInteger(p.stars) && p.stars >= 0))) throw new Error('Invalid stars');
  if (p.stars !== null && (typeof p.starsCollectedAt !== 'string' || !validDate(p.starsCollectedAt.slice(0,10)) || Number.isNaN(Date.parse(p.starsCollectedAt)))) throw new Error('Missing star timestamp');
  for (const lang of LANGUAGES) {
    const text = p.content?.[lang];
    for (const k of ['summary','originalFiles','limitations']) if (typeof text?.[k] !== 'string' || !text[k].trim()) throw new Error('Missing translation: '+lang+'/'+k);
    for (const k of ['requirements','installation']) if (!Array.isArray(text?.[k]) || !text[k].length || text[k].some(v => typeof v !== 'string' || !v.trim())) throw new Error('Missing translated list: '+lang+'/'+k);
  }
  return p;
}
function filterProjects(projects, f) {
  const q = normalize(f.query || '');
  return projects.filter(p => (!q || normalize(p.game + ' ' + p.name).includes(q)) && (!f.origin || p.origins.includes(f.origin)) && (!f.target || p.targets.includes(f.target)) && (!f.type || p.type === f.type) && (!f.status || p.playability === f.status) && (!f.stage || p.developmentStage === f.stage) && (!Number(f.minStars) || (p.stars !== null && p.stars >= Number(f.minStars))));
}
function sortProjects(projects, sort = 'stars', lang = 'pt') {
  return [...projects].sort((a,b) => {
    if (sort === 'stars') return (b.stars ?? -1) - (a.stars ?? -1) || a.game.localeCompare(b.game, lang);
    if (sort === 'origin') return a.origins[0].localeCompare(b.origins[0], lang) || a.game.localeCompare(b.game, lang);
    return a.game.localeCompare(b.game, lang);
  });
}
function pickLanguage(requested, stored) { return LANGUAGES.includes(requested) ? requested : LANGUAGES.includes(stored) ? stored : 'pt'; }
function el(tag, text, className) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; }
function link(text, url) { const a = el('a',text); a.href = safeURL(url); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }

function projectURL(id,language='pt'){return 'projeto.html?id='+encodeURIComponent(id)+'&lang='+pickLanguage(language);}
function projectVisual(p,language='pt',large=false){
  const t=key=>BORA_I18N[language][key];
  const cover=el('div',undefined,'project-cover'+(large?' project-visual':''));cover.dataset.origin=p.origins[0];
  const image=(p.image&&safeImageURL(p.image.url))||fallbackImage(p);
  if(image){
    cover.classList.add('has-image');const back=el('img',undefined,'cover-backdrop'),front=el('img',undefined,'cover-foreground');
    back.src=image;back.alt='';back.setAttribute('aria-hidden','true');front.src=image;front.alt=t((!p.image||p.image.kind==='console')?'consoleImage':'gameImage')+' '+((!p.image||p.image.kind==='console')?p.origins[0]:p.game);
    for(const node of [back,front]){node.loading=large?'eager':'lazy';node.decoding='async';node.referrerPolicy='no-referrer';if(node===front)node.onerror=()=>{const fallback=fallbackImage(p);if(front.getAttribute('src')!==fallback){front.src=fallback;back.src=fallback;front.alt=t('consoleImage')+' '+p.origins[0];}else{cover.classList.remove('has-image');back.remove();front.remove();}};}
    cover.append(back,front);
  }
  const meta=el('div',undefined,'cover-labels');meta.append(el('span',p.origins[0]),el('span',t(p.type),'cover-type'));cover.append(meta);if(p.channelReview?.status==='approved'){const stamp=el('div',undefined,'channel-stamp');stamp.append(el('strong','✓'),el('span',t('channelApproved')),el('small','BORA DE PLAY'));cover.append(stamp);}if(!large){const likes=el('a','♡ —','cover-likes');likes.href=projectURL(p.id,language)+'#community';likes.dataset.likesProject=p.id;likes.dataset.language=language;likes.setAttribute('aria-label',BORA_I18N[language].communityLikesLogin);likes.title=BORA_I18N[language].communityLikesLogin;cover.append(likes);}return cover;
}
function imageCredit(p,language){const text=BORA_I18N[language];const box=el('p',undefined,'image-credit');if(p.image?.source)box.append(link(text.imageSource,p.image.source));else box.textContent=text.originalConsoleArt;return box;}
async function init() {
  let stored; try { stored = localStorage.getItem('bora-language'); } catch { /* Storage is optional. */ }
  let language = pickLanguage(new URL(location.href).searchParams.get('lang'), stored);
  const languageSelect = document.querySelector('#language');
  const form = document.querySelector('#filters'), results = document.querySelector('#results'), total = document.querySelector('#total');
  let projects = [], data = null, loadFailed = false, discoveries = null, channelVideo = null, visibleCount = 10;
  const t = (key, values = {}) => BORA_I18N[language][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  const date = value => new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : language, {dateStyle:'medium', timeZone:'UTC'}).format(new Date(value.slice(0,10)+'T00:00:00Z'));
  const number = value => new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : language).format(value);
  function translatePage() {
    document.querySelectorAll('a[href^="navegador.html"]').forEach(a=>a.href="navegador.html?lang="+language);
    document.querySelectorAll('a[href^="contribuir.html"]').forEach(a=>a.href="contribuir.html?lang="+language);
    document.documentElement.lang = language === 'pt' ? 'pt-BR' : language;
    document.title = t('pageTitle'); document.querySelector('meta[name="description"]').content = t('description');
    document.querySelectorAll('[data-i18n]').forEach(n => n.textContent = t(n.dataset.i18n));
    for (const attr of ['aria-label','placeholder','alt']) document.querySelectorAll(`[data-i18n-${attr}]`).forEach(n => n.setAttribute(attr,t(n.getAttribute('data-i18n-'+attr))));
    languageSelect.value = language;
  }
  function empty(title, body, action) {
    const box = el('div', undefined, 'empty'), icon = el('span','▦','empty-icon'); icon.setAttribute('aria-hidden','true');
    box.append(icon,el('h3',title),el('p',body)); if(action)box.append(action); results.replaceChildren(box);
  }
  function card(p) {
    const text=p.content[language], article=el('article',undefined,'card'); article.dataset.project=p.id;
    const cover=projectVisual(p,language);
    const body=el('div',undefined,'card-body');
    const stars=el('p',p.stars===null?t('unknownStars'):'★ '+number(p.stars),'stars');
    stars.setAttribute('aria-label',p.stars===null?t('unknownStars'):t('stars',{count:number(p.stars)}));
    if(p.stars!==null)stars.title=t('snapshot',{date:date(p.starsCollectedAt)});
    const playableBadge=el('span',t(p.playability),'badge');playableBadge.title=t('status');
    const stageBadge=el('span',t(p.developmentStage),'badge stage-badge');stageBadge.title=t('stage');
    body.append(el('span',t(p.type),'badge'),playableBadge,stageBadge,el('h3',p.game),el('p',p.name,'project-name'),stars,el('p',text.summary),el('p',`${p.origins.join(' / ')} → ${p.targets.join(' / ')}`,'platforms'));
    const credit=imageCredit(p,language);if(credit)body.append(credit);
    const details=el('details'); details.append(el('summary',t('details')));
    details.append(el('h4',t('approach')),el('p',t(p.approach)));
    for(const [title,value] of [['originalFiles',text.originalFiles],['limitations',text.limitations]])details.append(el('h4',t(title)),el('p',value));
    for(const [title,items,tag] of [['requirements',text.requirements,'ul'],['installation',text.installation,'ol']]){const list=el(tag);items.forEach(i=>list.append(el('li',i)));details.append(el('h4',t(title)),list);}
    details.append(link(t('instructions'),p.instructionsUrl),el('p',t('review',{date:date(p.reviewedAt),version:p.reviewedVersion.slice(0,12)}),'review'),el('p',t(p.channelReview?.status==='approved'?'channelTestNote':'notTested'),'review'),link(t('evidence'),p.evidenceUrl));
    if(p.stars!==null)details.append(el('p',t('snapshot',{date:date(p.starsCollectedAt)}),'review'));
    if(p.reviewedRelease)details.append(el('h4',t('reviewedRelease')),link(p.reviewedRelease.tag+' ↗',p.reviewedRelease.url),el('p',t('releaseNotice'),'review'));
    if(p.relatedProject)details.append(el('p',undefined,'related-project'));if(p.relatedProject)details.lastChild.append(link(t('relatedVersion'),p.relatedProject));
    const page=el('a',t('viewProject'),'button project-link');page.href=projectURL(p.id,language);if(p.authorClaim)details.append(el('h4',t('sourceClaim')),el('p',p.authorClaim));
    if(p.upstream?.latestRelease)details.append(el('h4',t('latestRelease')),link(p.upstream.latestRelease.tag,p.upstream.latestRelease.url));
    if(p.upstream?.documentationChanged)details.append(el('p',t('upstreamChanged'),'review'));
    body.append(page,details,link(t('github'),p.github));article.append(cover,body);return article;
  }
  function renderChannel(){
    if(!channelVideo)return;
    const hero=document.querySelector('.hero-art');hero.classList.add('video-hero');
    const frame=el('div',undefined,'channel-player'),button=el('button',undefined,'video-poster');button.type='button';button.setAttribute('aria-label',t('watchVideo')+': '+channelVideo.title);
    const poster=el('img');poster.src='https://i.ytimg.com/vi/'+channelVideo.videoId+'/hqdefault.jpg';poster.alt='';poster.width=480;poster.height=360;
    button.append(poster,el('span','▶ '+t('watchVideo'),'video-play-label'));frame.append(button);
    button.onclick=()=>{const iframe=el('iframe');iframe.src='https://www.youtube-nocookie.com/embed/'+channelVideo.videoId+'?autoplay=1&rel=0';iframe.title=channelVideo.title;iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.setAttribute('allowfullscreen','');frame.replaceChildren(iframe);};
    const caption=el('div',undefined,'video-caption');caption.append(el('small',t('latestVideo')),el('p',channelVideo.title),link(t('watchYouTube'),'https://www.youtube.com/watch?v='+channelVideo.videoId));hero.replaceChildren(frame,caption);
  }
  function renderDiscoveries(){
    if(!discoveries)return;
    document.querySelector('#discoveries').hidden=false;
    const box=document.querySelector('#discoveries-list');box.replaceChildren();
    if(!discoveries.projects.length){box.append(el('p',t('discoveriesEmpty')));return;}
    const list=el('ul');discoveries.projects.forEach(p=>{const item=el('li');item.append(link(p.repository,p.github),el('span',' · ★ '+number(p.stars)));list.append(item);});box.append(list);
  }
  function render() {
    renderDiscoveries();
    if(loadFailed){total.textContent=t('unavailable');empty(t('loadError'),t('loadHelp'));return;}
    const f={query:document.querySelector('#query').value}; ['origin','target','type','status','stage','minStars'].forEach(k=>f[k]=document.getElementById(k).value);
    const shown=sortProjects(filterProjects(projects,f),document.querySelector('#sort').value,language);
    total.textContent=t('count',{shown:shown.length,total:projects.length});
    document.querySelector('#collection-note').textContent=(data?.collectedAt?t('collection',{date:date(data.collectedAt)}):'')+(data?.updatedAt?' '+t('syncDate',{date:new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(data.updatedAt))}):'');
    if(!projects.length){const a=el('a',t('suggest'),'text-link');a.href='contribuir.html';empty(t('empty'),t('emptyBody'),a);return;}
    if(!shown.length){const b=el('button',t('clear'));b.type='button';b.onclick=()=>form.reset();empty(t('noResults'),t('tryAgain'),b);return;}
    const grid=el('div',undefined,'cards');shown.slice(0,visibleCount).forEach(p=>grid.append(card(p)));results.replaceChildren(grid);
    const paging=el('div',undefined,'catalog-pagination');paging.append(el('p',t('shownCount',{shown:Math.min(visibleCount,shown.length),total:shown.length})));
    if(visibleCount<shown.length){const more=el('button',t('loadMore'),'button');more.type='button';more.setAttribute('aria-controls','results');more.onclick=()=>{const firstNew=visibleCount;visibleCount+=10;render();const heading=results.querySelectorAll('.card h3')[firstNew];if(heading){heading.tabIndex=-1;heading.focus();}};paging.append(more);}results.append(paging);
  }
  translatePage();
  languageSelect.addEventListener('change',()=>{
    language=pickLanguage(languageSelect.value);
    try{localStorage.setItem('bora-language',language);}catch{/* Still works without storage. */}
    try{const url=new URL(location.href);url.searchParams.set('lang',language);history.replaceState(null,'',url);}catch{/* Language works without URL persistence. */}
    visibleCount=10;translatePage();renderChannel();render();
  });
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>{visibleCount=10;render();});form.addEventListener('change',()=>{visibleCount=10;render();});form.addEventListener('reset',()=>setTimeout(()=>{visibleCount=10;render();},0));
  try {
    const response=await fetch('./data/projects.json',{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);
    data=await response.json();if(data.schemaVersion!==3||!Array.isArray(data.projects))throw new Error('Invalid data version');
    projects=data.projects.map(validateProject);if(new Set(projects.map(p=>p.id)).size!==projects.length)throw new Error('Duplicate IDs');
    for(const [id,values]of [['origin',projects.flatMap(p=>p.origins)],['target',projects.flatMap(p=>p.targets)]]){const select=document.getElementById(id);[...new Set(values)].sort().forEach(v=>{if(![...select.options].some(o=>o.value===v))select.append(el('option',v));});}
  }catch(error){loadFailed=true;console.error(error);}
  try{const response=await fetch('./data/discoveries.json',{cache:'no-store'});if(response.ok){const value=await response.json();if(value.schemaVersion===1&&Array.isArray(value.projects)&&value.projects.every(p=>typeof p.repository==='string'&&safeURL(p.github)&&Number.isInteger(p.stars)))discoveries=value;}}catch{/* Discoveries never block the reviewed catalog. */}
  try{const response=await fetch('./data/youtube.json',{cache:'no-store'});if(response.ok){const value=await response.json();if(value.schemaVersion===1&&value.videoFormat==='long'&&value.durationSeconds>180&&value.channelId==='UCIyP0J7kf8JiKr6kG7RY4EA'&&/^[A-Za-z0-9_-]{11}$/.test(value.videoId)&&typeof value.title==='string')channelVideo=value;}}catch{/* Keep the channel artwork if the feed snapshot is unavailable. */}
  renderChannel();render();
}
if(typeof document!=='undefined' && document.querySelector('#filters'))init();
if(typeof module!=='undefined')module.exports={filterProjects,sortProjects,validateProject,safeURL,pickLanguage,validDate,projectURL,safeImageURL};
