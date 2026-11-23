'use strict';
(() => {
const KEY='be1a4736da800301ae9f7abe0a1a975e';
const cdn='https://cdn.amplitude.com/script/'+KEY;
const root=document.body.dataset.root, page=document.body.dataset.page;
const routes={launcher:'',explore:'explore/',stock:'stocks/cape-meridian/',preview:'order/preview/',confirmation:'order/confirmation/',portfolio:'portfolio/',holding:'portfolio/cape-meridian/',activity:'activity/',details:'activity/order/'};
const titles={explore:'Explore',stock:'Cape Meridian',preview:'Order preview',confirmation:'Confirmation',portfolio:'Portfolio',holding:'Cape Meridian holding',activity:'Activity',details:'Order details'};
const view=document.querySelector('#view'), $=s=>document.querySelector(s);
const read=(k,f=null)=>JSON.parse(localStorage.getItem('luno:'+k)||JSON.stringify(f));
const write=(k,v)=>localStorage.setItem('luno:'+k,JSON.stringify(v));
let id=read('active'), user=id&&read(id), attempt=user?.draft, busy=false, panelMode=null;
const save=()=>{if(id===read('active'))write(id,user)}, go=p=>location.assign(root+routes[p]);
const current=()=>id===read('active');
const fixtures=[
 ['google','cpc','za_stock_search','www.google.com'],['google','organic','za_stock_learning','www.google.com'],
 ['instagram','social','za_stock_discovery','www.instagram.com'],['stock_partner','affiliate','za_partner_stocks','partner.example'],
 ['ai_assistant','ai','za_stock_questions','chatgpt.com']
];
const clean=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
function attribution(){
 const params=new URL(location.href).searchParams, values={};
 for(const key of ['utm_source','utm_medium','utm_campaign'])if(params.get(key))values[key]=params.get(key);
 const fixture=fixtures.find(([s,m,c])=>s===values.utm_source&&m===values.utm_medium&&c===values.utm_campaign);
 const ref=document.referrer&&new URL(document.referrer);
 if(ref&&ref.origin!==location.origin){values.referrer=ref.href;values.referring_domain=ref.hostname}
 else if(fixture){values.referring_domain=fixture[3];values.referrer='https://'+fixture[3]+'/'}
 return values;
}
const mark='<span class="wordmark"><img alt="Luno" src="'+root+'assets/luno.webp"></span>';
const icons={back:'M15 4l-8 8 8 8',account:'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21c1-8 15-8 16 0',Home:'M3 10l9-7 9 7v11h-6v-7H9v7H3z',Crypto:'M12 3a9 9 0 1 0 .1 0 M12 7a5 5 0 1 0 .1 0',Stocks:'M4 4h16v16H4z M5 15l5-5 3 2 6-6',Earn:'M12 21V11 M12 15C3 15 3 6 3 6c8 0 9 7 9 7 M12 11c0-7 9-8 9-8s0 8-9 8',Portfolio:'M3 7h18v14H3z M4 7V4h14v3 M15 12h6v4h-6z',ETFs:'M13 3a8 8 0 1 0 5 14 M16 11a5 5 0 1 0 .1 0'};
function icon(k){return '<svg aria-hidden="true" class="ico" viewBox="0 0 24 24"><path d="'+icons[k]+'"/></svg>'}
const asset='<span class="assetmark" aria-hidden="true">M</span>';
const line='0,74 14,70 22,75 32,55 45,62 54,44 65,51 74,43 84,51 99,33 108,39 123,22 135,34 145,23 156,25 170,8 180,12';
function chart(large=false){return '<svg class="'+(large?'chart':'spark')+'" viewBox="0 0 180 85" preserveAspectRatio="none" aria-hidden="true">'+(large?'<path d="M0 24h180 M0 51h180 M0 78h180" stroke="#e2e2e2" stroke-dasharray="2 4" fill="none"/>':'')+'<polyline points="'+line+'" fill="none" stroke="currentColor" stroke-width="'+(large?'2':'4')+'" stroke-linejoin="round"/></svg>'}
function launcher(){
 const directory=read('directory',{});view.innerHTML='<section class="scroll launcher">'+mark+'<h1>Sign in</h1><form><label>Profile name<input class="amp-mask" id="name" required pattern="[A-Za-z ]*[A-Za-z][A-Za-z ]*" maxlength="30" autocomplete="off"></label><label>Profile number<input id="num" type="number" min="1" max="99999" step="1" required></label><p class="profile-reference">Account ID<br><output id="identity"></output></p><button class="cta">Sign in</button></form></section>';
 $('#name').value=user?.name||'Naledi';$('#num').value=user?.number||1;
 function identity(){const key=clean($('#name').value)+'_'+Number($('#num').value);return [key,directory[key]||'luno_'+key+'_'+new Date().toISOString().slice(0,10).replaceAll('-','')]}
 function update(){$('#identity').textContent=identity()[1]}
 update();$('form').oninput=update;
 $('form').onsubmit=e=>{e.preventDefault();const [key,next]=identity();directory[key]=next;write('directory',directory);
 if(user&&next!==id&&user.queue.length){showFailure('Previous account has pending events');return}
 const touch=attribution();const previous=read(next);
 const u=previous||{name:$('#name').value.trim(),number:Number($('#num').value),ack:false,guideDismissed:false,surveyUsed:false,exited:false,first:touch,orders:[],queue:[],age:180};
 if(user&&next!==id){user.draft=null;save()}
 u.touch=touch;write(next,u);write('active',next);go('explore')};
}
const back=p=>'<a class="icon" aria-label="Back" href="'+root+routes[p]+'">'+icon('back')+'</a>';
function header(prev){return '<header>'+(prev?back(prev):mark)+'<strong>'+(prev?titles[page]:'')+'</strong><button class="icon" id="account" aria-label="Switch profile">'+icon('account')+'</button></header>'}
const footer=(label,action)=>'<div class="actions"><button class="cta" id="'+action+'">'+label+'</button></div>';
const list=(rows)=>'<dl class="receipt">'+rows.map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+b+'</dd></div>').join('')+'</dl>';
const guideKey='guide-understand-tokenised';
const practiceQuote={quantity:1,unit_price_usd:100,platform_fee_usd:1};
const money=value=>'$'+value.toFixed(2);
const orderUrl=(route,order)=>root+routes[route]+'?order='+encodeURIComponent(order.order_id);
function orders(){
 const history=[...(user.orders||[])];
 if(user.receipt&&!history.some(order=>order.order_id===user.receipt.order_id))history.push(user.receipt);
 return history.map(order=>({...practiceQuote,...order}));
}
function selectedOrder(){
 const key=new URLSearchParams(location.search).get('order');
 return orders().find(order=>order.order_id===(key??(page==='confirmation'?user.receipt?.order_id:null)));
}
function amounts(order){
 const value=order.quantity*order.unit_price_usd;
 return [['Quantity',order.quantity+' '+(order.quantity===1?'unit':'units')],['Unit price',money(order.unit_price_usd)],['Order value',money(value)],['Platform fee',money(order.platform_fee_usd)],['Total · USD',money(value+order.platform_fee_usd)]];
}
function link(label,route,selector,style='textbtn'){
 return '<a class="'+style+'" id="'+selector+'" href="'+root+routes[route]+'">'+label+'</a>';
}
function accountScreen(){
 const history=orders(),qty=history.reduce((sum,order)=>sum+order.quantity,0);
 const units=qty+' '+(qty===1?'unit':'units');
 const parent={portfolio:'explore',holding:'portfolio',activity:'holding',details:'activity'}[page];
 let content='';
 if(page==='portfolio')content=qty?link('Cape Meridian · '+units,'holding','holding-card','card'):'<p>You have no holdings yet.</p>';
 if(page==='holding')content=(qty?'<p>'+units+'</p>':'<p>You have no Cape Meridian units.</p>')+link('Activity','activity','holding-activity','textbtn guide-record');
 if(page==='activity')content=history.length?history.reverse().map(order=>'<a class="card purchase '+(order.order_id===user.walk?.order?'guide-record':'')+'" href="'+orderUrl('details',order)+'">Cape Meridian purchase · '+order.order_id+'</a>').join(''):'<p>No purchases yet.</p>';
 if(page==='details'){
   const order=selectedOrder();
   content=order?'<p>Cape Meridian · CMX</p>'+list([...amounts(order),['Order ID',order.order_id]]):'<p>Purchase unavailable for this profile.</p>';
   if(order&&user.walk?.active&&order.order_id===user.walk.order)content+='<button id="finish-guide" class="cta guide-record" disabled>Finish guide</button>';
 }
 return header(parent)+'<section class="scroll"><h1>'+titles[page]+'</h1>'+content+'</section>';
}
function render(){
 if(page==='explore'){
 const tabs='<div class="tabs"><span class="active">'+icon('Stocks')+'Stocks</span><button disabled>'+icon('ETFs')+'ETFs</button></div>';
 const nav='<nav aria-label="Main navigation">'+['Home','Crypto','Stocks','Earn','Portfolio'].map(k=>k==='Stocks'?'<span class="active" aria-current="page">'+icon(k)+k+'</span>':k==='Portfolio'?link(icon(k)+k,'portfolio','portfolio-tab','nav-link'):'<button disabled>'+icon(k)+k+'</button>').join('')+'</nav>';
 view.innerHTML=header()+tabs+'<section class="scroll listing"><h1 class="sr-only">Stocks</h1><a class="card" id="company-card" href="'+root+routes.stock+'"><div class="subhead">'+asset+'<span aria-hidden="true">›</span></div><div class="row"><span><strong>Cape Meridian</strong><br><small>CMX</small></span>'+chart()+'<span class="money"><strong>$100.00</strong><br><small class="positive">+1.20%</small></span></div></a><button class="textbtn" id="begin-guide" disabled>Walk me through my first order</button><br><button class="textbtn" id="market-highlights">Market highlights</button></section>'+nav;
 }else if(page==='stock'){
 view.innerHTML=header('explore')+'<section class="scroll">'+asset+'<p class="eyebrow">CMX · USD</p><h1>Cape Meridian</h1><p class="price">$100.00</p><small class="positive">+$1.19 (1.20%) today</small>'+chart(true)+'<div class="section"><h2>Instrument details</h2><div class="subhead"><span>Tokenised stock</span><button class="textbtn" id="ownership-guide" disabled>What would I own?</button></div><p class="mini muted">Illustrative price · US dollars</p></div></section>'+footer('Preview order','request');
 const explanation=$('#ownership-guide');
 explanation.hidden=!user.walk?.active;
 explanation.disabled=false;
 explanation.onclick=()=>{if(!panelMode&&current()){openPanel('guide');track('Ownership Explanation Opened',{entry_point:'guide'})}};
 $('#request').onclick=request;
 }else if(page==='preview'){
 view.innerHTML=header('stock')+'<section class="scroll"><p class="eyebrow">One-time purchase</p><h1>Review your order</h1><p>Cape Meridian · CMX</p>'+list(amounts(user.draft.quote||practiceQuote))+'<p class="notice">Confirming this order won’t move money or buy shares.</p><label class="mini">Private note (optional)<input class="amp-mask" maxlength="36" autocomplete="off" placeholder="Add a note"></label></section>'+footer('Confirm order','confirm');$('#confirm').onclick=confirm;
 }else if(page==='confirmation'){
 const order=selectedOrder();
 view.innerHTML=header('explore')+'<section class="scroll"><span class="seal">✓</span><h1>Order confirmed</h1><p>Cape Meridian · CMX</p>'+list([...amounts(order),['Order ID',order.order_id]])+'<p class="notice">No shares were purchased or funds transferred.</p></section><div class="actions">'+link('View my portfolio','portfolio','view-portfolio','cta')+'<button id="home" class="secondary">Back to Explore</button></div>';$('#home').onclick=()=>go('explore');
 }else{
 view.innerHTML=accountScreen();
 }
 $('#account').onclick=switchAccount;
}
function openPanel(mode){
 if(panelMode)return;panelMode=mode;const layer=document.createElement('div');layer.className='overlay';
 layer.innerHTML='<section class="sheet" role="dialog" aria-modal="true" aria-labelledby="panel-title"><div class="handle"></div><h2 id="panel-title" tabindex="-1">What would I own?</h2><p>You own a digital token. Real shares are held to back it. The token follows the share price.</p><button class="cta" id="ack">'+(mode==='guide'?'I understand':'I understand · Continue')+'</button><button class="secondary" id="leave">'+(mode==='guide'?'Back to overview':'Back to Explore')+'</button></section>';
 view.inert=true;$('.phone').append(layer);$('#panel-title').focus();
 const close=()=>{layer.remove();view.inert=false;panelMode=null;(mode==='guide'&&!user.ack?$('#ownership-guide'):$('#request')).focus()};
 layer.onkeydown=e=>{if(e.key==='Tab'){const at=document.activeElement;if(e.shiftKey&&at!== $('#leave')){e.preventDefault();$('#leave').focus()}else if(!e.shiftKey&&at===$('#leave')){e.preventDefault();$('#ack').focus()}}if(e.key==='Escape'&&mode==='guide')close()};
 $('#ack').onclick=()=>{if(busy)return;if(user.ack){close();return}user.ack=true;
 if(mode==='preview_gate')user.draft.status='ready';save();identifyUpdate();
 const op=track('Ownership Explanation Acknowledged',{entry_point:mode});close();if(mode==='preview_gate')trackThenGo(op,'preview')};
 $('#leave').onclick=()=>{if(mode==='guide'){close();return}if(busy)return;user.exited=true;user.draft=null;save();const op=track('Order Preview Abandoned',{exit_action:'back_to_explore'});trackThenGo(op,'explore')};
}
function request(){
 if(busy||panelMode)return;
 attempt=user.draft={id:crypto.randomUUID(),snapshot:user.ack?'Returning':'First-time',quote:{...practiceQuote},status:user.ack?'ready':'gate'};save();
 const op=track('Order Preview Requested');if(user.ack){trackThenGo(op,'preview');return}
 openPanel('preview_gate');track('Ownership Panel Viewed',{entry_point:'preview_gate'});
}
function confirm(){
 if(busy||!current())return;
 const displayedDraft=attempt?.id;
 const commit=()=>confirmDraft(displayedDraft);
 if(navigator.locks){navigator.locks.request('luno-order:'+id,commit).catch(showFailure);return}
 commit();
}
function confirmDraft(displayedDraft){
 if(busy||!current())return;
 user=read(id);attempt=user.draft;
 if(attempt&&attempt.id!==displayedDraft){location.reload();return}
 if(!attempt||attempt.status!=='ready'){location.reload();return}
 const quote=attempt.quote||practiceQuote;
 const shortId=attempt.id.slice(0,8).toUpperCase();
 const order_id=orders().some(order=>order.order_id===shortId)?attempt.id.toUpperCase():shortId;
 const props={transaction_value_usd:quote.quantity*quote.unit_price_usd,platform_fee_usd:quote.platform_fee_usd,order_id};
 user.receipt={order_id,snapshot:attempt.snapshot,...quote};user.orders??=[];user.orders.push(user.receipt);if(user.walk?.active&&!user.walk.order)user.walk.order=order_id;user.draft=null;
 // The receipt and its outbox entry are committed together by track().
 const op=track('Demo Order Confirmed',props,{insert_id:attempt.id,revenue:quote.platform_fee_usd,price:quote.platform_fee_usd,quantity:1,revenueType:'simulated_platform_fee',currency:'USD'});
 trackThenGo(op,'confirmation',user.receipt);
}
const diagnostics={plugins:{},errors:[],stage:'idle'};
const observed=new Set();
const country={country:'South Africa'}, answers=['what I would own','fees','how trading works','just browsing','something else'];
let ready, tail=Promise.resolve(), identifying=Promise.resolve();
function record(type,body){
 if(localStorage.getItem('luno:record')==='1'){const rows=read('recorded',[]);rows.push({type,id,page,body});write('recorded',rows)}
}
function common(){
 const props={...user.touch,data_origin:'browser_demo',ownership_explanation_acknowledged:user.ack,instrument:'Cape Meridian',currency:'USD',quote_usd:100};
 if(attempt)props.explorer_at_request=attempt.snapshot;return props;
}
function identifyUpdate(){
 identifying=Promise.resolve(ready).then(sendIdentify);identifying.catch(showFailure);return identifying;
}
async function sendIdentify(){
 const ident=new amplitude.Identify(), attrs={account_age_days:user.age,device_type:'Desktop',ownership_explanation_acknowledged:user.ack,ownership_guide_dismissed:user.guideDismissed,preview_exit_recorded:user.exited,preview_survey_consumed:user.surveyUsed};
 for(const [k,v] of Object.entries(attrs))ident.set(k,v);
 for(const k of ['utm_source','utm_medium','utm_campaign','referrer','referring_domain']){
 if(user.touch[k])ident.set(k,user.touch[k]);else ident.unset(k);
 if(user.first[k])ident.setOnce('initial_'+k,user.first[k]);
 }
 const result=await amplitude.identify(ident,country).promise;
 if(result?.code!==200)throw Error('Identify delivery '+result.code);
 record('identify',attrs);
}
function track(name,properties={},options={}){
 const event={name,properties:{...common(),...properties},options:{...country,insert_id:crypto.randomUUID(),time:Date.now(),...options}};
 user.queue.push(event);save();record('intent',event);
 return drain();
}
function drain(){
 tail=tail.catch(()=>{}).then(async()=>{
 await ready;await identifying;
 while(current()&&user.queue.length){
 const e=user.queue[0];const result=await amplitude.track(e.name,e.properties,e.options).promise;
 if(result?.code!==200)throw Error('Analytics delivery pending');
 if(!current())return;user.queue.shift();save();
 }
 });tail.catch(showFailure);return tail;
}
function showFailure(e){diagnostics.errors.push(String(e));if(document.querySelector('.callout'))return;const note=document.createElement('p');note.className='callout mini';note.setAttribute('role','status');note.textContent='Connection unavailable. Your progress is saved on this device.';view.prepend(note)}
const bound=(p,ms=1300)=>Promise.race([p,new Promise(resolve=>setTimeout(resolve,ms))]);
async function trackThenGo(op,target,order){if(busy)return;busy=true;await bound(op.then(()=>amplitude.flush().promise).catch(()=>{}));if(order)location.assign(orderUrl(target,order));else go(target)}
async function switchAccount(){
 if(busy)return;busy=true;
 try{await bound(tail);if(user.queue.length)throw Error('Pending delivery');await bound(ready.then(()=>amplitude.flush().promise));amplitude.reset();user.draft=null;save();go('launcher')}
 catch(e){busy=false;showFailure(e)}
}
const loadScript=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(Error('Unavailable SDK script'));document.head.append(el)});
function wrapped(plugin,label){
 const setup=plugin.setup?.bind(plugin);
 return {...plugin,async setup(...args){await setup?.(...args);diagnostics.plugins[label]='setup complete'}};
}
function handleNative(event){
 const props=event.event_properties||{}, type=event.event_type||'';
 if(props['[Guides-Surveys] Key']===guideKey&&user.walk?.active){
   if(type==='[Guides-Surveys] Guide Viewed'&&props['[Guides-Surveys] Step Index']===5&&$('#finish-guide'))$('#finish-guide').disabled=false;
   if(type==='[Guides-Surveys] Guide Dismissed'||type==='[Guides-Surveys] Guide Completed'){
     const completed=type.endsWith('Completed');
     user.walk={...user.walk,active:false,completed};save();
     if(!completed){user.guideDismissed=true;track('Ownership Guide Dismissed');identifyUpdate()}
     if($('#begin-guide'))$('#begin-guide').hidden=completed;
     if($('#ownership-guide'))$('#ownership-guide').hidden=true;
     if($('#finish-guide'))$('#finish-guide').hidden=true;
   }
 }
 if(page!=='explore'||!user.exited||!surveyOpen)return;
 if(props['[Guides-Surveys] Key']!=='survey-what-did-you-need')return;
 const answer=props['[Guides-Surveys] Survey Response String'];
 if(type==='[Guides-Surveys] Survey Submitted'&&answers.includes(answer)&&!user.surveyAnswered){
 user.surveyUsed=user.surveyAnswered=true;save();track('Preview Feedback Submitted',{answer});identifyUpdate();
 }
 if(type==='[Guides-Surveys] Survey Viewed'){user.surveyUsed=true;save()}
}
let surveyOpen=false;
async function bootstrap(){
 diagnostics.stage='checking privacy';
 const res=await fetch('https://sr-client-cfg.amplitude.com/config/'+KEY+'?config_group=browser',{cache:'no-store'});
 if(!res.ok)throw Error('Replay configuration unavailable');
 const configs=(await res.json()).configs, cfg=configs?.sessionReplay;
 diagnostics.privacy=cfg;
 if(cfg?.sr_privacy_config?.defaultMaskLevel!=='medium'||cfg?.sr_sampling_config?.capture_enabled!==true||cfg.sr_sampling_config.sample_rate!==1||
 ['maskSelector','blockSelector','unmaskSelector'].some(k=>!Array.isArray(cfg.sr_privacy_config[k])||cfg.sr_privacy_config[k].length)||
 Object.keys(configs.analyticsSDK||{}).length)throw Error('Review remote settings before recording');
 diagnostics.stage='loading';
 await loadScript(cdn+'.js');
 const amp=window.amplitude, selector='#market-highlights';
 const nativeNames=new Set(['[Amplitude] Rage Click','[Amplitude] Dead Click']);
 const nativeIds=new Set();
 const guard={name:'luno-approved-events',type:'before',async execute(e){
 const explicit=user.queue.some(q=>q.options.insert_id===e.insert_id&&q.name===e.event_type);
 const click=page==='explore'&&location.pathname==='/luno-demo/explore/'&&nativeNames.has(e.event_type);
 if(!explicit&&!click&&!nativeIds.delete(e.insert_id)&&e.event_type!=='$identify'&&e.event_type!=='[Amplitude] Replay Captured')return null;
 e.country='South Africa';e.event_properties={...e.event_properties,data_origin:'browser_demo'};observed.add(e.event_type);return e}};
 amp.add(guard);
 const replay=window.sessionReplay.plugin({sampleRate:1,privacyConfig:{defaultMaskLevel:'medium'}});
 amp.add(replay._STUBBED_PLUGIN_NAME?replay:wrapped(replay,'replay'));
 amp.add({name:'@amplitude/engagement-browser',type:'enrichment',
   setup(config,client){
     const bridge=Object.create(client);
     bridge.track=(event,...args)=>{
       if(!event||typeof event!=='object')return;
       event={...event,insert_id:event.insert_id||crypto.randomUUID(),country:'South Africa'};
       nativeIds.add(event.insert_id);handleNative(event);
       return client.track(event,...args);
     };
     startEngagement=()=>connectEngagement(config,bridge);
   },
   async execute(event){
     const replayId=event.event_properties?.['[Amplitude] Session Replay ID'];
     if(replayId)diagnostics.plugins.replay={sessionReplayId:replayId};
     if(engagementPlugin)return engagementPlugin.execute(event);
     pendingEngagementEvents.push(event);
     return event;
   }
 });
 const clicks={cssSelectorAllowlist:[selector]};
 const autocapture={attribution:false,pageViews:false,sessions:false,formInteractions:false,fileDownloads:false,pageUrlEnrichment:false,elementInteractions:false,networkTracking:false,webVitals:false,performanceTracking:false,
 frustrationInteractions:page==='explore'?{rageClicks:clicks,deadClicks:clicks,errorClicks:false,thrashedCursor:false,pageUrlAllowlist:[/^https?:\/\/[^/]+\/luno-demo\/explore\/(?:\?.*)?$/]}:false};
 await amp.init(KEY,id,{serverZone:'US',fetchRemoteConfig:true,autocapture,flushIntervalMillis:200,deviceId:user.deviceId,enableDiagnostics:false}).promise;
 if(window.amplitude.getUserId()!==id)throw Error('Analytics identity mismatch');
 diagnostics.stage='initialized';await sendIdentify();
 ensureEngagement();
}
const pendingEngagementEvents=[];
let startEngagement, engagementPlugin, engagementTask, bundle, bundleFailed=false;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function connectEngagement(config,bridge){
 // Init only loads the runtime. Boot through the Analytics plugin after the
 // real API replaces the snippet, so the snippet cannot discard a queued boot.
 if(!bundle){
   await loadScript(cdn+'.engagement.js');
   window.engagement.init(KEY,{serverZone:'US',options:{splitting:false}});
   bundle=document.getElementById('engagement-sdk-bundle');
   if(!bundle)throw Error('Guides runtime script was not created');
 }else if(bundleFailed){
   const retry=document.createElement('script');
   retry.id=bundle.id;retry.src=bundle.src;
   bundle.replaceWith(retry);bundle=retry;bundleFailed=false;
 }
 bundle.addEventListener('error',()=>{bundleFailed=true},{once:true});
 const deadline=Date.now()+30000;
 while(!('getInstance' in window.engagement)){
   if(bundleFailed||Date.now()>deadline)throw Error('Guides runtime unavailable');
   await delay(80);
 }
 if(!current())throw Error('Account switched during Guides startup');
 const eng=window.engagement;
 if(!engagementPlugin){
   const plugin=eng.plugin({serverZone:'US'});
   await plugin.setup(config,bridge);
   if(eng._analytics?.hasBooted!==true||eng._?.user?.user_id!==id)
     throw Error('Guides session did not start for the selected account');
   engagementPlugin=plugin;
   for(const event of pendingEngagementEvents.splice(0))await plugin.execute(event);
 }
 diagnostics.plugins.engagement='setup complete';
 eng.addCallback('luno_skip_feedback',()=>{if(surveyOpen){user.surveyUsed=true;save();identifyUpdate()}});
 return eng;
}
function engagementMessage(message,retry=false){
 let note=$('#engagement-status');
 if(!note){note=document.createElement('div');note.id='engagement-status';note.setAttribute('role','status');
   const anchor=$('#ownership-guide');
   if(anchor)anchor.parentElement.after(note);else view.prepend(note)}
 note.replaceChildren(document.createTextNode(message));
 if(retry){const button=document.createElement('button');button.className='textbtn';button.textContent='Retry';
   button.onclick=()=>ensureEngagement();note.append(' ',button)}
}
function ensureEngagement(){
 if(engagementTask)return engagementTask;
 const guide=page==='explore'&&!user.walk?.completed;
 const survey=page==='explore'&&user.exited&&!user.surveyUsed;
 engagementTask=(async()=>{
   const eng=await startEngagement();
   if(!current())return;
   if(survey){surveyOpen=true;eng.gs.show('survey-what-did-you-need')}
   const entry=$('#begin-guide');
   if(entry){
     entry.hidden=!!(user.walk?.active||user.walk?.completed);
     entry.disabled=false;
     entry.onclick=()=>{
       if(!current()||user.walk?.active||user.walk?.completed)return;
       user.walk={active:true};save();entry.hidden=true;eng.gs.show(guideKey);
     };
   }
   $('#engagement-status')?.remove();
 })().catch(error=>{
   diagnostics.errors.push(String(error));engagementTask=null;
   if((guide||survey)&&current())engagementMessage(guide?'Ownership guide unavailable.':'Survey unavailable.',true);
 });
 return engagementTask;
}
window.sdkCheck=()=>{
 const resources=performance.getEntriesByType('resource').map(e=>e.name).filter(s=>/amplitude/.test(s)).map(s=>{const u=new URL(s);return u.origin+u.pathname});
 const client=window.webExperiment,eng=window.engagement,session=window.amplitude?.getSessionId?.();
 return {...diagnostics,analytics:{type:typeof window.amplitude,version:resources.join(' ').match(/analytics-browser-([\d.]+)-/)?.[1],initialized:diagnostics.stage==='initialized',user:window.amplitude?.getUserId?.(),session},
 replay:{type:typeof window.sessionReplay,version:resources.join(' ').match(/plugin-session-replay-browser-([\d.]+)-/)?.[1],sessionId:window.sessionReplay?.getSessionReplayProperties?.()?.['[Amplitude] Session Replay ID'],setup:diagnostics.plugins.replay||'check Replay Captured and ingestion'},
 engagement:{type:typeof eng,version:typeof eng?.version==='string'?eng.version:null,installedViaPlugin:!!engagementPlugin,booted:eng?._analytics?.hasBooted,user:eng?._?.user?.user_id,session:eng?._?.user?.getSessionId?.()},
 experiment:{globals:Object.fromEntries(['Experiment','webExperiment','WebExperiment'].map(k=>[k,typeof window[k]])),version:client?.version||window.WebExperiment?.VERSION||null,initialized:!!(client?.isRunning&&!client.isStub&&client.getExperimentClient?.())},resources,events:[...observed]};
};
function visit(){
 const href=location.href;
 track('[Amplitude] Page Viewed',{'[Amplitude] Page Title':titles[page],'[Amplitude] Page Domain':location.hostname,'[Amplitude] Page Path':location.pathname,'[Amplitude] Page URL':href,'[Amplitude] Page Location':href});
 if(page==='explore')track('Explore Opened');
 else if(page==='stock')track('Stock Overview Viewed');
 else if(page==='preview')track('Order Preview Viewed');
}
if(page==='launcher'){launcher();return}
if(!user){location.replace(root);return}
if(page==='preview'&&user.draft?.status!=='ready'){location.replace(root+routes[user.receipt?'confirmation':'stock']);return}
if(page==='confirmation'&&!selectedOrder()){location.replace(root+routes.explore);return}
window.addEventListener('storage',event=>{if(event.key==='luno:active'&&!current())location.replace(root)});
if(!user.deviceId){user.deviceId=crypto.randomUUID();save()}
if(page==='explore'||page==='stock')attempt=null;
if(page==='confirmation'){const order=selectedOrder();attempt={snapshot:order.snapshot};if(!location.search)history.replaceState(null,'',orderUrl('confirmation',order))}
const external=document.referrer&&new URL(document.referrer).origin!==location.origin;
if(external||new URLSearchParams(location.search).has('utm_source')||(!document.referrer&&performance.getEntriesByType('navigation')[0]?.type==='navigate')){user.touch=attribution();save()}
render();ready=bootstrap();ready.catch(showFailure);visit();
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
})();
