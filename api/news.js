// Atualização automática de manchetes financeiras. Sem chaves e sem dados pessoais.
const feeds=[
 "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml",
 "https://news.google.com/rss/search?q="+encodeURIComponent("(economia OR mercado financeiro OR inflação OR juros OR dólar OR investimentos) when:3d")+"&hl=pt-BR&gl=BR&ceid=BR:pt-419"
];
function decode(s){return String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/<[^>]*>/g,"").trim()}
function field(item,name){const m=item.match(new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i"));return m?decode(m[1]):""}
function imageFromItem(item){
 const candidates=[];
 for(const m of item.matchAll(/<(?:media:content|media:thumbnail|enclosure)\b([^>]*)\/?\s*>/gi)){
  const attrs=m[1],url=attrs.match(/\burl=["']([^"']+)["']/i),type=attrs.match(/\btype=["']([^"']+)["']/i);
  if(url&&(!type||type[1].startsWith("image/")))candidates.push(decode(url[1]));
 }
 const descriptionRaw=(item.match(/<description(?:\s[^>]*)?>([\s\S]*?)<\/description>/i)||[])[1]||"";
 const embedded=descriptionRaw.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
 if(embedded)candidates.push(decode(embedded[1]));
 for(const candidate of candidates){try{const u=new URL(candidate);if(u.protocol==="https:"&&u.hostname&&!u.username&&!u.password)return u.href}catch{}}
 return null;
}
function parse(xml){return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m=>{const x=m[1];const title=field(x,"title");const link=field(x,"link");const date=field(x,"pubDate");const description=field(x,"description").slice(0,240);let source=field(x,"source");try{const url=new URL(link);if(!["http:","https:"].includes(url.protocol))return null;if(!source)source=url.hostname.replace(/^www\./,"");return {title,link:url.href,date,source,description,image:imageFromItem(x)}}catch{return null}}).filter(x=>x&&x.title&&x.link)}
module.exports=async function handler(req,res){
 if(req.method!=="GET")return res.status(405).json({error:"Método não permitido"});
 res.setHeader("Cache-Control","public, s-maxage=900, stale-while-revalidate=1800");
 for(const feed of feeds){
  try{
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);
   let response;try{response=await fetch(feed,{signal:controller.signal,headers:{"User-Agent":"MeuSaldo/1.0 (financial news feed)"}})}finally{clearTimeout(timer)}
   if(!response.ok)continue;
   const articles=parse(await response.text()).filter(a=>!Number.isFinite(Date.parse(a.date))||Date.parse(a.date)<Date.now()+3600000).sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,12);
   if(articles.length)return res.status(200).json({articles,updatedAt:new Date().toISOString()});
  }catch(e){console.error("Feed indisponível",String(e).slice(0,120))}
 }
 return res.status(503).json({articles:[],error:"Notícias temporariamente indisponíveis"});
};