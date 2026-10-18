'use strict';
async function initProject(){
  let stored;try{stored=localStorage.getItem('bora-language');}catch{}
  const requested=new URL(location.href).searchParams;
  let language=pickLanguage(requested.get('lang'),stored),project=null,projects=[],loadFailed=false;
  const select=document.querySelector('#language'),content=document.querySelector('#project-content');
  const t=(key,values={})=>BORA_I18N[language][key].replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
  const date=value=>new Intl.DateTimeFormat(language==='pt'?'pt-BR':language,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value.slice(0,10)+'T00:00:00Z'));
  function section(title,value,tag){const box=el('section',undefined,'project-section');box.append(el('h2',t(title)));if(tag){const list=el(tag);value.forEach(v=>list.append(el('li',v)));box.append(list);}else box.append(el('p',value));return box;}
  function render(){
    document.documentElement.lang=language==='pt'?'pt-BR':language;
    document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
    document.querySelectorAll('[data-i18n-aria-label]').forEach(n=>n.setAttribute('aria-label',t(n.dataset.i18nAriaLabel)));
    select.value=language;document.querySelector('#back-catalog').href=project?.browser?'navegador.html?lang='+language:'./?lang='+language+'#catalogo';if(project?.browser)document.querySelector('#back-catalog').textContent=t('browserNav');
    document.title=(project?project.game:t('projectDetails'))+' | Bora de Play';
    document.querySelector('#share-panel').hidden=!project;
    if(!project){const box=el('div',undefined,'empty');box.append(el('h1',t(loadFailed?'loadError':'notFound')),el('p',t(loadFailed?'loadHelp':'notFoundHelp')));content.replaceChildren(box);return;}
    const text=project.content[language];document.querySelector('meta[name="description"]').content=text.summary;
    const article=el('article',undefined,'project-detail');article.dataset.project=project.id;const hero=el('header',undefined,'project-heading');
    hero.append(el('span',project.origins.join(' / ')+' → '+project.targets.join(' / '),'eyebrow'),el('h1',project.game),el('p',project.name,'project-name'));
    for(const key of [project.type,project.playability,project.developmentStage])hero.append(el('span',t(key),'badge'));
    hero.insertBefore(projectVisual(project,language,true),hero.firstChild);if(project.browser){const play=project.browser.health?.status==='review'?el('span',t('browserLinkReview'),'badge'):link(t('browserPlay'),project.browser.url);if(play.tagName==='A')play.className='button';hero.append(play);}const credit=imageCredit(project,language);if(credit)hero.append(credit);
    const stars=el('p',project.stars===null?t('unknownStars'):'★ '+new Intl.NumberFormat(language).format(project.stars),'stars');
    if(project.stars!==null)stars.append(el('small',t('snapshot',{date:date(project.starsCollectedAt)})));
    if(project.stars!==null)hero.append(stars);hero.append(el('p',text.summary,'project-summary'));const source=link(t(project.github?'openGithub':'openWebsite'),project.github||project.browser.url);source.className='button';hero.append(source);article.append(hero);
    const grid=el('div',undefined,'project-columns');grid.append(section('approach',t(project.approach)),section('originalFiles',text.originalFiles),section('requirements',text.requirements,'ul'),section('installation',text.installation,'ol'),section('limitations',text.limitations));article.append(grid);
    const evidence=el('section',undefined,'project-section evidence-panel');evidence.append(el('h2',t('evidence')),el('p',project.sourceKind==='website'?t('websiteReview')+' '+date(project.reviewedAt)+' · SHA-256 '+project.reviewedVersion.slice(0,12):t('review',{date:date(project.reviewedAt),version:project.reviewedVersion.slice(0,12)})),el('p',t(project.channelReview?.status==='approved'?'channelTestNote':'notTested')),link(t('instructions'),project.instructionsUrl),el('br'),link(t('evidence'),project.evidenceUrl));
    if(project.reviewAgent)evidence.append(el('p',t('autoReview'),'review'));if(project.authorClaim)evidence.append(el('h3',t('sourceClaim')),el('p',project.authorClaim));
    if(project.reviewedRelease)evidence.append(el('h3',t('reviewedRelease')),link(project.reviewedRelease.tag,project.reviewedRelease.url),el('p',t('releaseNotice')));
    if(project.upstream?.latestRelease)evidence.append(el('h3',t('latestRelease')),link(project.upstream.latestRelease.tag,project.upstream.latestRelease.url));if(project.upstream?.documentationChanged)evidence.append(el('p',t('upstreamChanged')));article.append(evidence);
    const related=projects.filter(p=>p.editionId===project.editionId&&p.id!==project.id);
    if(related.length){const box=el('section',undefined,'project-section');box.append(el('h2',t('otherProjects')));related.forEach(p=>{const a=el('a',p.name,'text-link');a.href=projectURL(p.id,language);box.append(a,el('br'));});article.append(box);}
    else if(project.relatedProject)article.append(link(t('relatedVersion'),project.relatedProject));
    content.replaceChildren(article);
    window.dispatchEvent(new CustomEvent('bora-project-change',{detail:{id:project.id,language}}));
    document.querySelector('#share-url').value=new URL(projectURL(project.id,language),location.href).href;
    document.querySelector('#share-status').textContent='';
  }
  select.addEventListener('change',()=>{language=pickLanguage(select.value);try{localStorage.setItem('bora-language',language);}catch{}const u=new URL(location.href);u.searchParams.set('lang',language);history.replaceState(null,'',u);render();});
  document.querySelector('#copy-link').addEventListener('click',async()=>{const input=document.querySelector('#share-url'),status=document.querySelector('#share-status');try{await navigator.clipboard.writeText(input.value);status.textContent=t('copied');}catch{input.focus();input.select();status.textContent=t('copyFallback');}});
  try{const response=await fetch('./data/projects.json',{cache:'no-store'});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if((requested.get('id')||'').startsWith('web-')){const browserResponse=await fetch('./data/browser-projects.json',{cache:'no-store'});if(!browserResponse.ok)throw Error('Browser catalog unavailable');const web=await browserResponse.json();if(web.schemaVersion!==3||!Array.isArray(web.projects))throw Error('Invalid browser catalog');data.projects.push(...web.projects);}if(data.schemaVersion!==3||!Array.isArray(data.projects))throw Error('Invalid catalog');projects=data.projects.map(validateProject);project=projects.find(p=>p.id===requested.get('id'))||null;}catch(error){loadFailed=true;console.error(error);}
  render();
}
initProject();
