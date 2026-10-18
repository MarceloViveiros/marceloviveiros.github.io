'use strict';
async function initBrowserCatalog(){
 let stored;try{stored=localStorage.getItem('bora-language');}catch{}
 let language=pickLanguage(new URL(location.href).searchParams.get('lang'),stored),projects=[],failed=false,automation=null;
 const host=document.querySelector('#results'),form=document.querySelector('#browser-filters'),select=document.querySelector('#language');
 const accessKeys={demo:'browserDemo',shareware:'browserShareware','own-files':'browserOwn',free:'browserFree',web:'browserWeb'};
 const t=key=>BORA_I18N[language][key];
 function render(){
  document.documentElement.lang=language==='pt'?'pt-BR':language;document.title='Bora de Play | '+t('browserNav');select.value=language;
  document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=t(n.dataset.i18n));
  document.querySelectorAll('[data-i18n-aria-label]').forEach(n=>n.setAttribute('aria-label',t(n.dataset.i18nAriaLabel)));
  document.querySelectorAll('a[href^="navegador.html"]').forEach(a=>a.href='navegador.html?lang='+language);
  document.querySelectorAll('a[href^="contribuir.html"]').forEach(a=>a.href='contribuir.html?lang='+language);
  document.querySelectorAll('a[href^="./#"]').forEach(a=>a.href='./?lang='+language+a.hash);
  const auto=document.querySelector('#browser-automation');auto.textContent=automation?.lastRunAt?t('browserAuto')+new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(automation.lastRunAt))+'. '+t('browserCheckNote'):'';
  if(automation?.inxanity){const source=automation.inxanity;document.querySelector('#browser-automation').textContent+=' '+(source.status==='source-unavailable'?t('inxUnavailable'):t('inxSummary').replace('{count}',String(source.added)));}
  const q=normalize(document.querySelector('#browser-query').value),access=document.querySelector('#browser-access').value;
  const matches=projects.filter(p=>(!q||normalize(p.game+' '+p.name).includes(q))&&(!access||p.browser.access===access));
  const total=document.querySelector('#browser-total');total.textContent=failed?t('loadError'):matches.length+' / '+projects.length+' · '+t('browserNav');host.replaceChildren();
  if(failed){host.append(el('p',t('loadHelp'),'community-error'));return;}
  for(const p of matches){
   const article=el('article',undefined,'card');article.dataset.project=p.id;const cover=projectVisual(p,language),body=el('div',undefined,'card-body');
   body.append(el('span',t(accessKeys[p.browser.access]),'badge browser-access-badge'),el('h3',p.game),el('p',p.name,'project-name'),el('p',p.content[language].summary));
   const status=el('span',t(p.playability),'badge');status.title=t('status');body.append(status);if(p.developmentStage==='experimental')body.append(el('span',t('experimental'),'badge')); const credit=imageCredit(p,language);if(credit)body.append(credit);
   const actions=el('div',undefined,'browser-card-actions'),play=p.browser.health?.status==='review'?el('span',t('browserLinkReview'),'badge'):link(t('browserPlay'),p.browser.url);if(play.tagName==='A')play.className='button';const details=el('a',t('browserDetails'));details.href=projectURL(p.id,language);actions.append(play,details,link(t('browserEvidence'),p.evidenceUrl));body.append(actions);article.append(cover,body);host.append(article);
  }
  if(!matches.length)host.append(el('p',t('noResults')));
 }
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',render);form.addEventListener('change',render);
 select.addEventListener('change',()=>{language=pickLanguage(select.value);try{localStorage.setItem('bora-language',language);}catch{}const u=new URL(location.href);u.searchParams.set('lang',language);history.replaceState(null,'',u);render();});
 try{const response=await fetch('data/browser-projects.json',{cache:'no-store'});if(!response.ok)throw Error();const data=await response.json();if(data.schemaVersion!==3||!Array.isArray(data.projects))throw Error();projects=data.projects.map(validateProject);automation=data.automation||null;if(projects.some(p=>!p.browser))throw Error();}catch{failed=true;}
 render();
}
initBrowserCatalog();
