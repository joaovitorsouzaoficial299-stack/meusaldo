const KEY="meusaldo_test_v2";let data;try{data=JSON.parse(localStorage.getItem(KEY))||{transactions:[],bills:[]}}catch{data={transactions:[],bills:[]}};if(!Array.isArray(data.transactions))data.transactions=[];if(!Array.isArray(data.bills))data.bills=[];const $=id=>document.getElementById(id);const money=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n);const save=()=>localStorage.setItem(KEY,JSON.stringify(data));const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));const date=s=>{const [y,m,d]=s.split("-");return d+"/"+m+"/"+y};function item(t,bill=false,preview=false){const paid=bill&&t.paid;const info='<div class="item-info"><b>'+esc(t.name)+'</b><small>'+date(t.date)+(bill?(paid?' · Pago':' · Pendente'):(t.kind==='income'?' · Entrada':' · Saída'))+'</small></div>';const amount='<span class="amount '+(t.kind==='income'&&!bill?'income':'expense')+'">'+(bill?'':t.kind==='income'?'+':'−')+money(t.value)+'</span>';const actions=preview?'':'<div class="item-actions">'+(bill?'<button type="button" data-paid="'+esc(t.id)+'">'+(paid?'Reabrir':'Pagar')+'</button>':'')+'<button type="button" data-edit="'+esc(t.id)+'" data-type="'+(bill?'bill':'transaction')+'">Editar</button><button type="button" data-delete="'+esc(t.id)+'" data-type="'+(bill?'bill':'transaction')+'">Excluir</button></div>';return '<div class="item">'+info+amount+actions+'</div>'}function render(){const balance=data.transactions.reduce((n,t)=>n+(t.kind==="income"?t.value:-t.value),0);const pending=data.bills.filter(b=>!b.paid).reduce((n,b)=>n+b.value,0);$("balance").textContent=money(balance);$("balance-secondary").textContent=money(balance);$("pending").textContent=money(pending);$("available").textContent=money(balance-pending);const currentMonth=new Date().toISOString().slice(0,7);const monthly=data.transactions.filter(t=>t.date.slice(0,7)===currentMonth);const totalIncome=monthly.filter(t=>t.kind==="income").reduce((s,t)=>s+t.value,0);const totalExpenses=monthly.filter(t=>t.kind==="expense").reduce((s,t)=>s+t.value,0);$("expense-total").textContent=money(totalExpenses);$("income-month").textContent=money(totalIncome);$("expense-month").textContent=money(totalExpenses);$("bills-month").textContent=money(pending);const maxBar=Math.max(totalIncome,totalExpenses,pending,1);[["income-bar",totalIncome],["expense-bar",totalExpenses],["bills-bar",pending]].forEach(([id,n])=>$(id).style.width=(n/maxBar*100)+"%");const allocationTotal=Math.max(totalExpenses+pending+Math.max(balance-pending,0),1);const p1=totalExpenses/allocationTotal*100,p2=pending/allocationTotal*100;$("expense-donut").style.background="conic-gradient(#e2c296 0 "+p1+"%,#a39a96 "+p1+"% "+(p1+p2)+"%,#44434a "+(p1+p2)+"% 100%)";$("legend-expenses").textContent=Math.round(p1)+"%";$("legend-bills").textContent=Math.round(p2)+"%";$("legend-free").textContent=Math.round(100-p1-p2)+"%";$("goal-transactions").textContent=data.transactions.length+" registros";$("goal-bills").textContent=data.bills.length+" contas";$("goal-transactions-bar").style.width=Math.min(data.transactions.length/10*100,100)+"%";$("goal-bills-bar").style.width=Math.min(data.bills.length/5*100,100)+"%";renderChart();const tx=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));$("recent").innerHTML=tx.length?tx.slice(0,3).map(t=>item(t,false,true)).join(""):'<div class="empty">Comece registrando sua primeira movimentação.</div>';$("transaction-count").textContent=tx.length+" registro"+(tx.length===1?"":"s");$("transactions").innerHTML=tx.length?tx.map(t=>item(t)).join(""):'<div class="empty">Nenhuma movimentação registrada ainda.</div>';$("bills-pending-total").textContent=money(pending);$("bills-pending-count").textContent=data.bills.filter(b=>!b.paid).length+" conta(s) pendente(s)";$("bills").innerHTML=data.bills.length?[...data.bills].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>item(t,true)).join(""):'<div class="empty">Adicione suas contas e dívidas para planejar o mês.</div>'}let newsLastFetched=0,newsLoading=false;
async function loadFinancialNews(force=false){
 const list=$("news-cards"),status=$("news-status"),refresh=$("news-refresh");
 if(!list||!status||newsLoading||(!force&&Date.now()-newsLastFetched<15*60*1000))return;
 newsLoading=true;if(refresh)refresh.disabled=true;
 status.textContent="Buscando notícias atualizadas...";
 try{
  const response=await fetch("/api/news",{cache:"no-store",headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error("Fonte indisponível");
  const json=await response.json(),articles=Array.isArray(json.articles)?json.articles:[];
  if(!articles.length)throw new Error("Nenhuma notícia encontrada");
  list.replaceChildren();
  articles.forEach(article=>{
   let url;try{url=new URL(article.link);if(!["https:","http:"].includes(url.protocol))return}catch{return}
   const card=document.createElement("a");card.className="news-card";card.href=url.href;card.target="_blank";card.rel="noopener noreferrer";
   if(article.image){
    try{
     const imageUrl=new URL(article.image);
     if(imageUrl.protocol==="https:"){
      const media=document.createElement("div");media.className="news-card-media";
      const img=document.createElement("img");img.src=imageUrl.href;img.alt="Imagem da notícia";img.loading="lazy";img.decoding="async";img.referrerPolicy="no-referrer";
      img.addEventListener("error",()=>media.remove(),{once:true});
      media.append(img);card.append(media);
     }
    }catch{}
   }
   const top=document.createElement("div");top.className="news-card-top";
   const source=document.createElement("span");source.className="news-source";source.textContent=String(article.source||url.hostname).slice(0,55);
   const published=document.createElement("time");published.className="news-date";const when=new Date(article.date);if(Number.isFinite(when.getTime())){published.dateTime=when.toISOString();published.textContent=new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(when)}else published.textContent="Notícia recente";
   top.append(source,published);
   const title=document.createElement("h2");title.textContent=article.title;
   const description=document.createElement("p");description.textContent=String(article.description||"Leia a notícia completa na fonte original.").slice(0,200);
   const more=document.createElement("span");more.className="news-more";more.textContent="Ler notícia ↗";
   const content=document.createElement("div");content.className="news-card-content";content.append(top,title,description,more);card.append(content);list.append(card);
  });
  if(!list.childElementCount)throw new Error("Nenhuma notícia válida");
  newsLastFetched=Date.now();status.textContent="Últimas manchetes · Atualização automática a cada 15 minutos";
 }catch(error){
  status.textContent="Não foi possível carregar notícias agora. Toque em Atualizar para tentar novamente.";
  if(!list.childElementCount){const empty=document.createElement("div");empty.className="news-empty";empty.textContent="As notícias estão temporariamente indisponíveis. Seus dados financeiros continuam funcionando normalmente.";list.replaceChildren(empty)}
 }finally{newsLoading=false;if(refresh)refresh.disabled=false}
}
$("news-refresh")?.addEventListener("click",()=>loadFinancialNews(true));
function tab(name){if(name==="aprender")loadFinancialNews();document.querySelectorAll(".view").forEach(e=>e.classList.toggle("active",e.id===name));document.querySelectorAll("[data-tab]").forEach(e=>{const active=e.dataset.tab===name;e.classList.toggle("active",active);if(active)e.setAttribute("aria-current","page");else e.removeAttribute("aria-current")});window.scrollTo({top:0,behavior:"smooth"})}document.querySelectorAll("[data-tab]").forEach(e=>e.addEventListener("click",()=>tab(e.dataset.tab)));document.querySelectorAll("[data-go]").forEach(e=>e.addEventListener("click",()=>tab(e.dataset.go)));let mode="transaction",editingId=null;function open(kind,id=null){editingId=id;mode=kind==="bill"?"bill":"transaction";$("entry-form").reset();$("entry-date").value=[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,"0"),String(new Date().getDate()).padStart(2,"0")].join("-");$("dialog-title").textContent=mode==="bill"?"Adicionar conta":"Nova movimentação";$("kind-label").hidden=mode==="bill";$("date-label").textContent=mode==="bill"?"Data de vencimento":"Data";$("entry-kind").value=kind==="income"?"income":"expense";if(id){const existing=(mode==="bill"?data.bills:data.transactions).find(x=>x.id===id);if(existing){$("entry-name").value=existing.name;$("entry-value").value=existing.value;$("entry-date").value=existing.date;if(mode!=="bill")$("entry-kind").value=existing.kind;$("dialog-title").textContent=mode==="bill"?"Editar conta":"Editar registro";}}$("delete-entry").hidden=!id;$("entry-dialog").showModal()}$("add-bill").onclick=()=>open("bill");$("close-dialog").onclick=()=>$("entry-dialog").close();$("entry-form").onsubmit=e=>{e.preventDefault();const value=Number($("entry-value").value);if(!Number.isFinite(value)||value<=0)return;const entry={id:String(Date.now())+Math.random().toString(36).slice(2),name:$("entry-name").value.trim(),value,date:$("entry-date").value};if(!entry.name||!entry.date)return;if(editingId){const arr=mode==="bill"?data.bills:data.transactions;const old=arr.find(x=>x.id===editingId);if(old)Object.assign(old,{name:entry.name,value:entry.value,date:entry.date,...(mode==="bill"?{}:{kind:$("entry-kind").value})});}else if(mode==="bill")data.bills.push({...entry,paid:false});else data.transactions.push({...entry,kind:$("entry-kind").value});save();render();$("entry-dialog").close();showSaveFeedback(editingId?"Conta atualizada":"Conta adicionada","Seu planejamento está em dia.")};$("bills").addEventListener("click",e=>{const btn=e.target.closest("[data-paid]");if(!btn)return;const bill=data.bills.find(b=>b.id===btn.dataset.paid);if(bill){bill.paid=!bill.paid;save();render()}});document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){if(edit.dataset.type==="bill")open("bill",edit.dataset.edit);else editTransaction(edit.dataset.edit)}if(del&&confirm("Excluir este registro?")){const arr=del.dataset.type==="bill"?data.bills:data.transactions;const i=arr.findIndex(x=>x.id===del.dataset.delete);if(i>=0){arr.splice(i,1);save();render()}}});$("delete-entry").onclick=()=>{if(!editingId||!confirm("Excluir este registro?"))return;const arr=mode==="bill"?data.bills:data.transactions;const i=arr.findIndex(x=>x.id===editingId);if(i>=0){arr.splice(i,1);save();render()}$("entry-dialog").close()};$("today").textContent=new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"long",year:"numeric"}).format(new Date());let chartPeriod="6M";
render();
document.querySelectorAll("[data-chart-period]").forEach(btn=>btn.addEventListener("click",()=>{
 chartPeriod=btn.dataset.chartPeriod;
 document.querySelectorAll("[data-chart-period]").forEach(b=>{const active=b===btn;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 renderChart();
}));
function renderChart(){
 const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),day=86400000;
 const records=data.transactions.map((t,i)=>({...t,order:i,time:Date.parse(t.date+"T12:00:00Z")})).filter(t=>Number.isFinite(t.time)).sort((a,b)=>a.time-b.time||a.order-b.order);
 const amount=t=>t.kind==="income"?Number(t.value):-Number(t.value);
 const offsets={"1M":1,"3M":3,"6M":6,"1A":12};
 const start=chartPeriod==="ALL"&&records.length?new Date(records[0].time):new Date(today.getFullYear(),today.getMonth()-(offsets[chartPeriod]||6)+1,1);
 const startTime=Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),start.getUTCDate()),endTime=Date.UTC(today.getFullYear(),today.getMonth(),today.getDate())+day;
 const visible=records.filter(t=>t.time>=startTime&&t.time<=endTime);
 let balance=records.filter(t=>t.time<startTime).reduce((n,t)=>n+amount(t),0);
 const points=[{time:startTime,value:balance}];
 visible.forEach(t=>{balance+=amount(t);points.push({time:t.time,value:balance,name:t.name,change:amount(t),date:t.date})});
 points.push({time:Math.max(endTime,startTime+day),value:balance});
 const values=points.map(p=>p.value),lo=Math.min(0,...values),hi=Math.max(1,...values),pad=Math.max((hi-lo)*.12,1),min=lo-pad,max=hi+pad,range=max-min;
 // A date-only axis overlaps transactions entered on the same day.
 // For sparse histories, space each event visibly while retaining chronological order.
 // With larger histories, blend calendar position and event order.
 const eventCount=visible.length;
 const calendarX=t=>Math.max(0,Math.min(1,(t-startTime)/Math.max(day,endTime-startTime)));
 const pts=points.map((p,i)=>{
  const eventX=i/Math.max(1,points.length-1);
  const progress=eventCount<=8?eventX:calendarX(p.time)*.45+eventX*.55;
  return {...p,x:14+570*progress,y:207-175*(p.value-min)/range};
 });
 const line="M"+pts.map(p=>p.x.toFixed(2)+" "+p.y.toFixed(2)).join(" L");
 const area=line+" L"+pts[pts.length-1].x.toFixed(2)+" 220 L"+pts[0].x.toFixed(2)+" 220 Z";
 const svg=$("balance-chart");
 const gold="#dfb877",end=pts[pts.length-1];
 const grid=[0,1,2,3,4].map(i=>'<line x1="0" y1="'+(32+i*44)+'" x2="600" y2="'+(32+i*44)+'" stroke="currentColor" opacity=".10" stroke-width="1"/>').join("");
 const dots=pts.filter(p=>p.name).map(p=>'<circle cx="'+p.x.toFixed(2)+'" cy="'+p.y.toFixed(2)+'" r="3.3" fill="'+(p.change>=0?"#e4c28d":"#b0a59a")+'" stroke="#fff" stroke-opacity=".45" stroke-width=".7"><title>'+esc(date(p.date)+" · "+p.name+" · "+(p.change>=0?"+":"")+money(p.change)+" · Saldo "+money(p.value))+'</title></circle>').join("");
 svg.innerHTML='<defs><linearGradient id="chartfill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#dfb877" stop-opacity=".42"/><stop offset="1" stop-color="#dfb877" stop-opacity="0"/></linearGradient><filter id="chartglow" x="-25%" y="-80%" width="150%" height="260%"><feGaussianBlur stdDeviation="5"/></filter></defs>'+grid+'<path d="'+area+'" fill="url(#chartfill)"/><path d="'+line+'" fill="none" stroke="'+gold+'" stroke-width="9" opacity=".23" filter="url(#chartglow)" stroke-linecap="round" stroke-linejoin="round"/><path d="'+line+'" fill="none" stroke="'+gold+'" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'+dots+'<circle cx="'+end.x.toFixed(2)+'" cy="'+end.y.toFixed(2)+'" r="10" fill="'+gold+'" opacity=".15"/><circle cx="'+end.x.toFixed(2)+'" cy="'+end.y.toFixed(2)+'" r="5.5" fill="'+gold+'" stroke="#fff" stroke-width="1.5"/>';
 const labels=chartPeriod==="1M"?5:6;
 const labelFormat=new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"});
 $("chart-months").innerHTML=eventCount>0&&eventCount<=4
  ?points.map((p,i)=>"<span>"+(i===0?"Início":i===points.length-1?"Hoje":labelFormat.format(new Date(p.time)).replace(".",""))+"</span>").join("")
  :Array.from({length:labels},(_,i)=>{const d=new Date(startTime+(endTime-startTime)*i/(labels-1));return "<span>"+(chartPeriod==="1M"?labelFormat.format(d).replace(".",""):new Intl.DateTimeFormat("pt-BR",{month:"short",year:chartPeriod==="ALL"||chartPeriod==="1A"?"2-digit":undefined}).format(d).replace(".",""))+"</span>"}).join("");
 const axis=document.querySelector(".performance .chart-grid");if(axis)axis.innerHTML=[4,3,2,1,0].map(i=>"<span>"+money(min+range*i/4).replace(",00","")+"</span>").join("");
 const small=$("wealth-chart");if(small)small.innerHTML='<path d="M'+pts.map(p=>(p.x/600*360).toFixed(2)+" "+(p.y/230*135).toFixed(2)).join(" L")+'" fill="none" stroke="#e9cb9e" stroke-width="2.5" stroke-linecap="round"/>';
 const current=points[points.length-1].value,first=points[0].value,diff=current-first;
 $("growth").textContent=visible.length?(diff>=0?"+":"")+money(diff)+" no período":"Registre entradas e saídas";
 const label=$("chart-period-label");if(label)label.textContent=({"1M":"1 mês","3M":"3 meses","6M":"6 meses","1A":"1 ano","ALL":"Todo o período"})[chartPeriod];
}

// PWA install flow
let deferredInstall=null;const banner=$("install-banner");const standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;if(!standalone&&!sessionStorage.getItem("hideInstall"))banner.hidden=false});$("install-app").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;banner.hidden=true}else if(/iphone|ipad|ipod/i.test(navigator.userAgent)){alert("No Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.")}else{alert("Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial.")}};$("dismiss-install").onclick=()=>{banner.hidden=true;sessionStorage.setItem("hideInstall","1")};if(!standalone&&/iphone|ipad|ipod/i.test(navigator.userAgent)&&!sessionStorage.getItem("hideInstall"))banner.hidden=false;if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));

// Local profile until authentication is connected.
const PROFILE_KEY="meusaldo_profile_name";let profileName=localStorage.getItem(PROFILE_KEY)||"";function updateGreeting(){const hour=new Date().getHours();const period=hour<12?"Bom dia":hour<18?"Boa tarde":"Boa noite";$("greeting").textContent=profileName?period+", "+profileName+"!":period+"!";}function editProfile(){const name=prompt("Como você gostaria de ser chamado?",profileName);if(name===null)return;const cleaned=name.trim().replace(/\s+/g," ").slice(0,50);profileName=cleaned;if(cleaned)localStorage.setItem(PROFILE_KEY,cleaned);else localStorage.removeItem(PROFILE_KEY);updateGreeting()}$("greeting").addEventListener("click",editProfile);updateGreeting();document.addEventListener("visibilitychange",()=>{if(!document.hidden)updateGreeting()});

// Full-page transaction editor, matching the selected reference.
let transactionKind="income",transactionCategory="Outros",transactionEditingId=null;
const transactionForm=$("transaction-form");
const amountInput=$("transaction-amount");
const numberBR=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const localISODate=()=>{const now=new Date();return [now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-")};
function setTransactionKind(kind){transactionKind=kind;for(const [id,k] of [["transaction-income","income"],["transaction-expense","expense"]]){const el=$(id);el.classList.toggle("is-active",kind===k);el.setAttribute("aria-pressed",String(kind===k))}}
function setTransactionCategory(category){transactionCategory=category;const chips=$("transaction-category-chips");if(![...chips.querySelectorAll("[data-category]")].some(el=>el.dataset.category===category)){const chip=document.createElement("button");chip.type="button";chip.dataset.category=category;chip.textContent=category;chip.setAttribute("aria-pressed","false");chips.append(chip)}chips.querySelectorAll("[data-category]").forEach(el=>{const active=el.dataset.category===category;el.classList.toggle("is-active",active);el.setAttribute("aria-pressed",String(active))})}
const readAmount=()=>Number(amountInput.value.replace(/[^0-9]/g,""))/100;
function showAmount(value){amountInput.value=value>0?numberBR.format(value):""}
function resetTransactionForm(){transactionEditingId=null;transactionForm.reset();amountInput.value="";$("transaction-date").value=localISODate();setTransactionKind("income");setTransactionCategory("Outros");$("transaction-page-title").textContent="Nova movimentação";$("transaction-save").textContent="Salvar movimentação";$("transaction-cancel-edit").hidden=true}
function editTransaction(id){const entry=data.transactions.find(t=>t.id===id);if(!entry)return;tab("movimentos");transactionEditingId=id;showAmount(entry.value);$("transaction-title").value=entry.name;$("transaction-date").value=entry.date;$("transaction-note").value=entry.note||"";setTransactionKind(entry.kind);setTransactionCategory(entry.category||"Outros");$("transaction-page-title").textContent="Editar movimentação";$("transaction-save").textContent="Salvar alterações";$("transaction-cancel-edit").hidden=false;window.scrollTo({top:0,behavior:"smooth"})}
amountInput.addEventListener("input",()=>{const digits=amountInput.value.replace(/\D/g,"").slice(0,11);showAmount(Number(digits)/100)});
amountInput.addEventListener("focus",()=>{if(!amountInput.value)amountInput.placeholder="R$ 0,00"});
$("transaction-income").addEventListener("click",()=>setTransactionKind("income"));
$("transaction-expense").addEventListener("click",()=>setTransactionKind("expense"));
$("transaction-category-chips").addEventListener("click",e=>{const chip=e.target.closest("[data-category]");if(chip)setTransactionCategory(chip.dataset.category)});
$("transaction-back").addEventListener("click",()=>tab("inicio"));
$("transaction-cancel-edit").addEventListener("click",resetTransactionForm);
transactionForm.addEventListener("submit",e=>{
 e.preventDefault();e.stopPropagation();
 const button=$("transaction-save");
 if(button.disabled)return;
 const value=Math.round(readAmount()*100)/100;
 const name=$("transaction-title").value.trim(),dateValue=$("transaction-date").value;
 if(!Number.isFinite(value)||value<=0){amountInput.setCustomValidity("Informe um valor maior que zero.");amountInput.reportValidity();amountInput.focus();return}
 amountInput.setCustomValidity("");
 if(!name){$("transaction-title").focus();return}
 if(!dateValue){$("transaction-date").focus();return}
 const entry={name,value,date:dateValue,kind:transactionKind,category:transactionCategory,note:$("transaction-note").value.trim()};
 const wasEditing=Boolean(transactionEditingId);
 const previous=data.transactions.map(t=>({...t}));
 button.disabled=true;button.textContent="Salvando...";
 try{
  if(wasEditing){
   const old=data.transactions.find(t=>t.id===transactionEditingId);
   if(!old)throw new Error("Movimentação não encontrada para edição.");
   Object.assign(old,entry);
  }else data.transactions.push({id:String(Date.now())+Math.random().toString(36).slice(2),...entry});
  save();
  const stored=JSON.parse(localStorage.getItem(KEY)||"{}");
  if(!Array.isArray(stored.transactions)||stored.transactions.length!==data.transactions.length)throw new Error("Não foi possível confirmar o salvamento.");
  try{render()}catch(renderError){console.error("Erro ao atualizar painel:",renderError)}
  resetTransactionForm();
  document.activeElement?.blur?.();
  showSaveFeedback(wasEditing?"Movimentação atualizada":"Movimentação salva",money(value)+" · "+(entry.kind==="income"?"Entrada":"Saída"));
 }catch(error){
  data.transactions=previous;
  console.error("Falha ao salvar movimentação:",error);
  alert("Não foi possível salvar a movimentação. Seus dados foram mantidos no formulário. Tente novamente.");
 }finally{
  button.disabled=false;
  button.textContent=transactionEditingId?"Salvar alterações":"Salvar movimentação";
 }
});
amountInput.addEventListener("input",()=>amountInput.setCustomValidity(""));
resetTransactionForm();

let feedbackTimer;function showSaveFeedback(title,detail){const el=$("save-feedback");if(!el)return;clearTimeout(feedbackTimer);el.hidden=true;$("save-feedback-title").textContent=title;$("save-feedback-detail").textContent=detail;void el.offsetWidth;el.hidden=false;feedbackTimer=setTimeout(()=>{el.hidden=true},3100)}

// Preferência de aparência exclusiva do painel
const dashboardThemeButton=document.getElementById("dashboard-theme-switch");const dashboardThemeKey="meusaldo_dashboard_theme";function setDashboardTheme(mode){const light=mode==="light";document.body.classList.toggle("dashboard-light",light);dashboardThemeButton.setAttribute("aria-checked",String(light));dashboardThemeButton.setAttribute("aria-label",light?"Ativar modo escuro":"Ativar modo claro");dashboardThemeButton.querySelector("svg").innerHTML=light?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>':'<path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>';document.querySelector('meta[name="theme-color"]').content=light?"#f7f5f0":"#0d0e11";try{localStorage.setItem(dashboardThemeKey,mode)}catch{}}let dashboardSavedTheme="dark";try{dashboardSavedTheme=localStorage.getItem(dashboardThemeKey)||"dark"}catch{}setDashboardTheme(dashboardSavedTheme);dashboardThemeButton.addEventListener("click",()=>setDashboardTheme(document.body.classList.contains("dashboard-light")?"dark":"light"));
