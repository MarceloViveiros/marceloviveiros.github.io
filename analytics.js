'use strict';
(()=>{
 const ID='G-HSPRZZMVC1'; // Public GA4 measurement ID, configured after creating the web stream.
 const KEY='bora-analytics-consent-v1', MAX_AGE=180*24*60*60*1000;
 if(!/^G-[A-Z0-9]+$/.test(ID)||!['marceloviveiros.github.io','localhost','127.0.0.1'].includes(location.hostname))return;
 const copy={
  pt:{title:'Podemos contar sua visita?',body:'Usamos o Google Analytics para entender as visitas e melhorar o Bora de Play. Com sua permissão, ele usa cookies para medir páginas acessadas e a origem das visitas. Você pode recusar e continuar navegando normalmente.',yes:'Permitir estatísticas',no:'Recusar estatísticas',privacy:'Saiba mais',settings:'Preferências de visitas'},
  en:{title:'May we count your visit?',body:'We use Google Analytics to understand visits and improve Bora de Play. With your permission, it uses cookies to measure page views and where visits come from. You can decline and keep browsing normally.',yes:'Allow statistics',no:'Decline statistics',privacy:'Learn more',settings:'Visit preferences'},
  es:{title:'¿Podemos contar tu visita?',body:'Usamos Google Analytics para entender las visitas y mejorar Bora de Play. Con tu permiso, usa cookies para medir páginas visitadas y el origen de las visitas. Puedes rechazarlo y seguir navegando normalmente.',yes:'Permitir estadísticas',no:'Rechazar estadísticas',privacy:'Más información',settings:'Preferencias de visitas'}
 };
 let choice=null,started=false,banner,settings;
 try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&['granted','denied'].includes(saved.value)&&Number.isFinite(saved.at)&&Date.now()-saved.at>=0&&Date.now()-saved.at<MAX_AGE)choice=saved.value;}catch{}
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
 window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 function cleanURL(value){
  if(!value)return '';
  try{const u=new URL(value,location.href);u.hash='';
   const allowed=new URLSearchParams();
   for(const key of ['id','lang','utm_source','utm_medium','utm_campaign']){const v=u.searchParams.get(key);if(v&&/^[a-zA-Z0-9_. -]{1,100}$/.test(v))allowed.set(key,v);}
   u.search=allowed.toString();return u.href;
  }catch{return '';}
 }
 function start(){
  if(started)return;started=true;window['ga-disable-'+ID]=false;
  window.gtag('consent','update',{analytics_storage:'granted'});
  window.gtag('js',new Date());
  window.gtag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:MAX_AGE/1000,cookie_update:false,page_location:cleanURL(location.href),page_referrer:cleanURL(document.referrer)});
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.append(script);
 }
 function choose(value){
  choice=value;try{localStorage.setItem(KEY,JSON.stringify({value,at:Date.now()}));}catch{}
  banner.hidden=true;
  if(value==='granted')start();
  else{
   window['ga-disable-'+ID]=true;
   if(started){
    // Stop this page's tag and remove first-party GA cookies when consent is withdrawn.
    for(const part of document.cookie.split(';')){const name=part.split('=')[0].trim();if(/^_ga(?:_|$)/.test(name))for(const domain of ['', '; domain='+location.hostname])document.cookie=name+'=; max-age=0; path=/'+domain;}
    location.reload();
   }
  }
  settings.focus();
 }
 function lang(){return document.querySelector('#language')?.value||document.documentElement.lang.split('-')[0]||'pt';}
 function render(){
  const language=copy[lang()]?lang():'pt',c=copy[language];
  const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  banner.replaceChildren();banner.setAttribute('aria-label',c.title);
  const heading=node('h2',c.title),body=node('p',c.body),link=node('a',c.privacy);link.href='privacidade.html?lang='+language;
  const actions=node('div');actions.className='analytics-actions';
  for(const [value,label]of[['granted',c.yes],['denied',c.no]]){const button=node('button',label);button.type='button';button.onclick=()=>choose(value);actions.append(button);}
  banner.append(heading,body,link,actions);settings.textContent=c.settings;
 }
 function init(){
  banner=document.createElement('section');banner.className='analytics-consent';banner.hidden=choice!==null;
  settings=document.createElement('button');settings.type='button';settings.className='analytics-settings';settings.onclick=()=>{banner.hidden=false;render();banner.querySelector('button').focus();};
  (document.querySelector('footer')||document.body).append(settings);document.body.append(banner);render();
  document.querySelector('#language')?.addEventListener('change',render);
  if(choice==='granted')start();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
