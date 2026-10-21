'use strict';
async function initBrowserCatalog(){
 let stored;try{stored=localStorage.getItem('bora-language');}catch{}
 let language=pickLanguage(new URL(location.href).searchParams.get('lang'),stored),projects=[],failed=false,visibleCount=10;
 const host=document.querySelector('#results'),form=document.querySelector('#browser-filters'),select=document.querySelector('#language');
 const paging=el('div',undefined,'catalog-pagination');host.after(paging);
 const accessKeys={demo:'browserDemo',shareware:'browserShareware','own-files':'browserOwn',free:'browserFree',web:'browserWeb'};
 const t=key=>BORA_I18N[language][key];
 function render(){
  document.documentElement.lang=language==='pt'?'pt-BR':language;document.title='Bora de Play | '+t('browserNav');select.value=language;
  document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
  document.querySelectorAll('[data-i18n-aria-label]').forEach(n=>n.setAttribute('aria-label',t(n.dataset.i18nAriaLabel)));
  document.querySelectorAll('a[href^="navegador.html"]').forEach(a=>a.href='navegador.html?lang='+language);
  document.querySelectorAll('a[href^="contribuir.html"]').forEach(a=>a.href='contribuir.html?lang='+language);
  document.querySelectorAll('a[href^="./#"]').forEach(a=>a.href='./?lang='+language+a.hash);
  const q=normalize(document.querySelector('#browser-query').value),access=document.querySelector('#browser-access').value;
  const matches=sortProjects(projects.filter(p=>(!q||normalize(p.game+' '+p.name).includes(q))&&(!access||p.browser.access===access)),'name',language);
  const total=document.querySelector('#browser-total');total.textContent=failed?t('loadError'):matches.length+' / '+projects.length+' · '+t('browserNav');host.replaceChildren();paging.replaceChildren();
  if(failed){host.append(el('p',t('loadHelp'),'community-error'));return;}
  for(const p of matches.slice(0,visibleCount)){
   const article=el('article',undefined,'card');article.dataset.project=p.id;const cover=projectVisual(p,language),body=el('div',undefined,'card-body');
   body.append(el('span',t(accessKeys[p.browser.access]),'badge browser-access-badge'),el('h3',p.game),el('p',p.name,'project-name'),el('p',p.content[language].summary));
   const status=el('span',t(p.playability),'badge');status.title=t('status');body.append(status);if(p.developmentStage==='experimental')body.append(el('span',t('experimental'),'badge')); const credit=imageCredit(p,language);if(credit)body.append(credit);
   const actions=el('div',undefined,'browser-card-actions'),play=p.browser.health?.status==='review'?el('span',t('browserLinkReview'),'badge'):link(t('browserPlay'),p.browser.url);if(play.tagName==='A')play.className='button';const details=el('a',t('browserDetails'));details.href=projectURL(p.id,language);actions.append(play,details,link(t('browserEvidence'),p.evidenceUrl));body.append(actions);article.append(cover,body);host.append(article);
  }
  if(!matches.length)host.append(el('p',t('noResults')));
  else{paging.append(el('p',t('shownCount').replace('{shown}',String(Math.min(visibleCount,matches.length))).replace('{total}',String(matches.length))));if(visibleCount<matches.length){const more=el('button',t('loadMore'),'button');more.type='button';more.setAttribute('aria-controls','results');more.onclick=()=>{const firstNew=visibleCount;visibleCount+=10;render();const heading=host.querySelectorAll('.card h3')[firstNew];if(heading){heading.tabIndex=-1;heading.focus();}};paging.append(more);}}
 }
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>{visibleCount=10;render();});form.addEventListener('change',()=>{visibleCount=10;render();});
 select.addEventListener('change',()=>{language=pickLanguage(select.value);try{localStorage.setItem('bora-language',language);}catch{}const u=new URL(location.href);u.searchParams.set('lang',language);history.replaceState(null,'',u);visibleCount=10;render();});
 try{const response=await fetch('data/browser-projects.json',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(data.schemaVersion!==3||!Array.isArray(data.projects))throw Error();projects=data.projects.map(validateProject);if(projects.some(p=>!p.browser))throw Error();}catch{failed=true;}
 render();
}
initBrowserCatalog();
