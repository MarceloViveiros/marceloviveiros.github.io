import {communityConfig} from './community-config.js';
import {initializeApp,getApps} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import {getFirestore,collection,getCountFromServer} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';
const labels={pt:'curtidas da comunidade',en:'community likes',es:'me gusta de la comunidad'};
const loginLabels={pt:'Entre com Google na ficha para ver as curtidas',en:'Sign in with Google on the project page to see likes',es:'Entra con Google en la ficha para ver los me gusta'};
let user=null,generation=0,db;const counts=new Map(),pending=new Set();
function render(){
 for(const badge of document.querySelectorAll('[data-likes-project]')){
  const id=badge.dataset.likesProject,lang=badge.dataset.language||'pt';
  if(!user?.emailVerified||!counts.has(id))continue;
  const count=counts.get(id),text=new Intl.NumberFormat(lang).format(count);
  badge.textContent='♡ '+text;badge.setAttribute('aria-label',text+' '+labels[lang]);badge.title=text+' '+labels[lang];
 }
}
async function refresh(){
 if(!db||!user?.emailVerified)return;const token=generation;
 const ids=[...new Set([...document.querySelectorAll('[data-likes-project]')].map(x=>x.dataset.likesProject))];
 for(const id of ids){
  if(!/^[a-z0-9][a-z0-9-]{0,90}$/.test(id)||counts.has(id)||pending.has(id))continue;
  pending.add(id);
  try{const result=await getCountFromServer(collection(db,'projects',id,'likes'));if(token===generation){counts.set(id,result.data().count);render();}}catch{/* Keep unavailable counts distinct from zero. */}finally{if(token===generation)pending.delete(id);}
 }
 render();
}
if(communityConfig.enabled){
 const app=getApps()[0]||initializeApp(communityConfig.firebase);db=getFirestore(app);
 onAuthStateChanged(getAuth(app),next=>{user=next;generation++;counts.clear();pending.clear();for(const badge of document.querySelectorAll('[data-likes-project]')){const lang=badge.dataset.language||'pt';badge.textContent='♡ —';badge.title=loginLabels[lang];badge.setAttribute('aria-label',badge.title);}refresh();});
 const host=document.querySelector('#results');if(host)new MutationObserver(()=>{render();refresh();}).observe(host,{childList:true});
}
