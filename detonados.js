'use strict';
// Interface translation for the walkthrough pages. Guide bodies are written in Portuguese; EN/ES readers get a notice and a translate link.
(()=>{
 const T={
  pt:{catalog:'Catálogo',browser:'Jogar no navegador',reviews:'Avaliações',guides:'Detonados',language:'Idioma',eyebrow:'GUIAS DO BORA DE PLAY',title:'Detonados',
   intro:'Travou em algum enigma? Encontre o trecho que precisa ou acompanhe a campanha desde o começo.',open:'Abrir detonado →',back:'← Todos os detonados',
   series:'Assista à série completa',footer1:'Detonados do Bora de Play, escritos a partir das nossas gameplays.',footer2:'Não distribuímos jogos, BIOS, chaves ou arquivos protegidos.',
   guideTag:'GUIA EM PORTUGUÊS',top:'↑ Índice',
   rem:['Villa Ashmann, convento e final','Da chegada à villa até a Freira Vermelha. Cofre, pilares, marionetes, porta alquímica e dicas para fugir das perseguidoras.'],
   tsc:['Campanha completa e chefes','De Arkham alagada ao chefe final. Todos os códigos de cofres e comportas, enigmas do hotel e do hospital e dicas para os chefes.'],
   sp:['Campanha e os três finais','Da chegada ao motel até Leave, Rest e Live. Inclui atalhos para enigmas, tabelas de rota e capturas da gameplay.'],
   pageTitle:'Detonados | Bora de Play'},
  en:{catalog:'Catalog',browser:'Play in the browser',reviews:'Reviews',guides:'Walkthroughs',language:'Language',eyebrow:'BORA DE PLAY GUIDES',title:'Walkthroughs',
   intro:'Stuck on a puzzle? Find the section you need or follow the campaign from the start. The guides are written in Portuguese, with a one-click translation.',open:'Open walkthrough →',back:'← All walkthroughs',
   series:'Watch the full series',footer1:'Bora de Play walkthroughs, written from our own gameplay.',footer2:'We do not distribute games, BIOS files, keys or protected files.',
   guideTag:'GUIDE IN PORTUGUESE',top:'↑ Contents',
   rem:['Villa Ashmann, convent and ending','From arriving at the villa to the Red Nun. Safe, pillars, puppets, the alchemical door and tips to escape the stalkers.'],
   tsc:['Full campaign and bosses','From flooded Arkham to the final boss. Every safe and floodgate code, hotel and hospital puzzles and boss tips.'],
   sp:['Campaign and the three endings','From the motel to Leave, Rest and Live. Puzzle shortcuts, route tables and gameplay screenshots.'],
   notice:'This walkthrough is written in Portuguese. Codes, numbers and video timestamps work in any language.',translate:'Read it translated into English ↗',
   pageTitle:'Walkthroughs | Bora de Play'},
  es:{catalog:'Catálogo',browser:'Jugar en el navegador',reviews:'Reseñas',guides:'Guías',language:'Idioma',eyebrow:'GUÍAS DE BORA DE PLAY',title:'Guías',
   intro:'¿Atascado en un acertijo? Encuentra la parte que necesitas o sigue la campaña desde el principio. Las guías están en portugués, con traducción en un clic.',open:'Abrir guía →',back:'← Todas las guías',
   series:'Mira la serie completa',footer1:'Guías de Bora de Play, escritas a partir de nuestros gameplays.',footer2:'No distribuimos juegos, BIOS, claves ni archivos protegidos.',
   guideTag:'GUÍA EN PORTUGUÉS',top:'↑ Índice',
   rem:['Villa Ashmann, convento y final','Desde la llegada a la villa hasta la Monja Roja. Caja fuerte, pilares, marionetas, puerta alquímica y consejos para huir de las acosadoras.'],
   tsc:['Campaña completa y jefes','Desde Arkham inundada hasta el jefe final. Todos los códigos de cajas fuertes y compuertas, acertijos del hotel y del hospital y consejos para los jefes.'],
   sp:['Campaña y los tres finales','Desde el motel hasta Leave, Rest y Live. Atajos para acertijos, tablas de ruta y capturas del gameplay.'],
   notice:'Esta guía está escrita en portugués. Los códigos, números y minutos de los videos sirven en cualquier idioma.',translate:'Leerla traducida al español ↗',
   pageTitle:'Guías | Bora de Play'}
 };
 const langs=['pt','en','es'];let stored=null;try{stored=localStorage.getItem('bora-language');}catch{}
 const requested=new URL(location.href).searchParams.get('lang');
 let lang=langs.includes(requested)?requested:langs.includes(stored)?stored:'pt';
 const guidesTab=document.querySelector('.catalog-tabs');
 function set(sel,text){document.querySelectorAll(sel).forEach(n=>{n.textContent=text;});}
 function apply(){
  const t=T[lang];document.documentElement.lang=lang==='pt'?'pt-BR':lang;
  const select=document.getElementById('language');if(select)select.value=lang;
  document.querySelectorAll('.language-label>span').forEach(n=>n.textContent=t.language);
  if(guidesTab){const a=guidesTab.querySelectorAll('a');[t.catalog,t.browser,t.reviews,t.guides].forEach((x,i)=>{if(a[i])a[i].textContent=x;});
   a.forEach(link=>{const h=link.getAttribute('href').split('?')[0].split('#');if(/^(\.\/)?(navegador|avaliacoes|detonados)\.html$/.test(h[0]))link.href=h[0]+'?lang='+lang+(h[1]?'#'+h[1]:'');});}
  const foot=document.querySelectorAll('footer>div p');if(foot[0])foot[0].textContent=t.footer1;if(foot[1])foot[1].textContent=t.footer2;
  set('.guide-top',t.top);
  if(document.body.dataset.page==='guides'){
   document.title=t.pageTitle;set('.review-intro .eyebrow',t.eyebrow);set('.review-intro h1',t.title);set('.review-intro>p',t.intro);
   document.querySelectorAll('.guide-card').forEach(card=>{const key=card.dataset.guide;const pair=t[key];const eyebrow=card.querySelector('.eyebrow');
    if(eyebrow)eyebrow.textContent=eyebrow.textContent.split('·')[0].trim()+' · '+t.guideTag;if(pair){card.querySelector('h2').textContent=pair[0];card.querySelector('.card-body>p').textContent=pair[1];}
    const button=card.querySelector('.button');if(button){button.textContent=t.open;button.href=button.getAttribute('href').split('?')[0]+(lang==='pt'?'':'?lang='+lang);}});
  }else{
   document.querySelectorAll('.review-intro>a.text-link').forEach(a=>{a.textContent=t.back;a.href='detonados.html'+(lang==='pt'?'':'?lang='+lang);});
   set('.guide-series>strong',t.series);
   let notice=document.getElementById('guide-language-notice');
   if(lang==='pt'){if(notice)notice.remove();}
   else{if(!notice){notice=document.createElement('p');notice.id='guide-language-notice';notice.className='guide-language-notice';document.querySelector('.guide-body')?.prepend(notice);}
    const page=location.origin+location.pathname,link=document.createElement('a');
    link.href='https://translate.google.com/translate?sl=pt&tl='+lang+'&u='+encodeURIComponent(page);link.target='_blank';link.rel='noopener noreferrer';link.textContent=t.translate;
    notice.replaceChildren(document.createTextNode(t.notice+' '),link);}
  }
 }
 document.getElementById('language')?.addEventListener('change',e=>{lang=langs.includes(e.target.value)?e.target.value:'pt';try{localStorage.setItem('bora-language',lang);}catch{}
  try{const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(null,'',u);}catch{}apply();});
 apply();
})();
