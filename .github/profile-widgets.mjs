import fs from 'node:fs/promises';
import path from 'node:path';

const login='fuck-jhus';
const steamUrl='https://steamcommunity.com/id/iamjhus/';
const musicUrl='https://music.apple.com/profile/jhus';
const fixtureIndex=process.argv.indexOf('--fixtures');
const fixtures=fixtureIndex>=0?path.resolve(process.argv[fixtureIndex+1]):null;
const assets=path.resolve('assets');
const checked=new Date().toLocaleDateString('es-GT',{timeZone:'America/Guatemala',day:'numeric',month:'short',year:'numeric'});
const C={bg:'#0d1117',ink:'#c9d1d9',muted:'#8b949e',blue:'#58a6ff',green:'#3fb950'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const txt=(s,x,y,size=17,color=C.ink,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(s)}</text>`;
const symbols={
 repo:'<path d="M3 2h10v12H3V2Zm0 9h10M6 5h4"/>',
 people:'<circle cx="6" cy="5" r="2.5"/><path d="M1 14v-2a5 5 0 0 1 10 0v2m0-11a2.5 2.5 0 0 1 0 5m2 2a4 4 0 0 1 2 4"/>',
 star:'<path d="m8 1 2.1 4.3 4.9.7-3.5 3.4.8 4.9L8 12l-4.3 2.3.8-4.9L1 6l4.9-.7L8 1Z"/>',
 fork:'<circle cx="4" cy="3" r="2"/><circle cx="12" cy="3" r="2"/><circle cx="8" cy="13" r="2"/><path d="M4 5v2l4 2 4-2V5M8 9v2"/>',
 clock:'<circle cx="8" cy="8" r="6.5"/><path d="M8 4v4l3 2"/>',
 code:'<path d="m5 4-4 4 4 4m6-8 4 4-4 4M9 2 7 14"/>',
 calendar:'<rect x="1" y="3" width="14" height="12" rx="1"/><path d="M4 1v4m8-4v4M1 7h14"/>',
 game:'<path d="M4 5h8c3 0 4 7 2 8-1 1-3-2-4-2H6c-1 0-3 3-4 2C0 12 1 5 4 5Z"/><path d="M5 7v4M3 9h4m4-1h.1m2 2h.1"/>',
 music:'<path d="M6 12V3l8-2v9M6 6l8-2"/><ellipse cx="3.5" cy="12.5" rx="2.5" ry="1.8"/><ellipse cx="11.5" cy="10.5" rx="2.5" ry="1.8"/>',
};
const icon=(type,x,y,color=C.muted,size=19)=>`<g transform="translate(${x} ${y}) scale(${size/16})" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${symbols[type]||symbols.code}</g>`;
const heading=(s,type='code')=>icon(type,25,22,C.muted,22)+txt(s,60,42,22,C.blue);
function svg(title,height,body){return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="${height}" viewBox="0 0 1000 ${height}" role="img" aria-labelledby="title"><title id="title">${esc(title)}</title><style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}</style><rect width="1000" height="${height}" fill="${C.bg}"/>${body}</svg>`;}
async function get(url,fixture){
 if(fixtures&&fixture)return fs.readFile(path.join(fixtures,fixture),'utf8');
 const headers={'User-Agent':'jhus-profile-widgets','Accept':'application/json'};
 if(new URL(url).hostname==='api.github.com'&&process.env.GITHUB_TOKEN)headers.Authorization=`Bearer ${process.env.GITHUB_TOKEN}`;
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error(`Source unavailable: HTTP ${response.status} at ${new URL(url).hostname}`);
 return response.text();
}
async function imageData(url){
 const allowed=['shared.fastly.steamstatic.com','avatars.fastly.steamstatic.com','cdn.akamai.steamstatic.com'];
 if(!allowed.includes(new URL(url).hostname))return null;
 const cache=fixtures?path.join(fixtures,`steam-image-${Buffer.from(url).toString('base64url').slice(-70)}.txt`):null;
 if(cache){try{return await fs.readFile(cache,'utf8');}catch{}}
 const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)return null;
 const mime=r.headers.get('content-type')?.split(';')[0];if(!['image/jpeg','image/png','image/webp'].includes(mime))return null;
 const value=`data:${mime};base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`;
 if(cache)await fs.writeFile(cache,value);return value;
}
function calendarDays(html){
 const tips=new Map([...html.matchAll(/<tool-tip\b[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)].map(m=>[m[1],plain(m[2])]));
 const days=[...html.matchAll(/<td\b[^>]*data-date="[^"]+"[^>]*>/g)].map(m=>{
  const a=Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]]));
  const tip=tips.get(a.id);if(!tip)throw Error('Contribution tooltip is missing');
  const count=Number((tip.match(/([\d,]+) contributions?/)?.[1]||'0').replaceAll(',',''));
  return {date:a['data-date'],count,level:Number(a['data-level'])};
 }).sort((a,b)=>a.date.localeCompare(b.date));
 if(days.length<300||days.some(d=>!Number.isFinite(d.count)))throw Error('Incomplete public contribution calendar');
 return days;
}
function isoCalendar(allDays,duration){
 const days=allDays.slice(-duration), first=new Date(days[0].date+'T00:00:00Z');first.setUTCDate(first.getUTCDate()-first.getUTCDay());
 const total=days.reduce((s,d)=>s+d.count,0),max=Math.max(...days.map(d=>d.count));
 let run=0,best=0;for(const d of days){run=d.count?run+1:0;best=Math.max(best,run);}
 // An unfinished day without contributions does not end yesterday's streak.
 let current=0;for(let i=days.length-1-(days.at(-1).count?0:1);i>=0&&days[i].count;i--)current++;
 const full=duration>200,wx=full?11.1:20,wy=full?4.5:7.2,baseY=106,baseX=121;
 const greens=['#dbe3ea','#0e4429','#006d32','#26a641','#39d353'];
 let body=heading(full?'Calendario de contribuciones · último año':'Calendario de contribuciones · últimos 6 meses','calendar');
 for(const d of days){
  const delta=Math.round((new Date(d.date+'T00:00:00Z')-first)/86400000),week=Math.floor(delta/7),day=delta%7;
  const x=baseX+week*wx-day*11.4,y=baseY+week*wy+day*5.8,h=d.count?Math.min(56,8+Math.log2(d.count+1)*8):0;
  body+=`<g><title>${d.date}: ${d.count} contribuciones públicas</title><path d="M${x} ${y-h}l10.4 4.8-10.4 5.3-10.4-4.8Z" fill="${greens[d.level]}"/>`;
  if(h)body+=`<path d="M${x+10.4} ${y-h+4.8}l-10.4 5.3v${h}l10.4-5.3Z" fill="#16813e"/><path d="M${x} ${y-h+10.1}l-10.4-4.8v${h}l10.4 4.8Z" fill="#0e4429"/>`;
  body+='</g>';
 }
 const stats=[['Contribuciones',total],['Racha actual',current+' día'+(current===1?'':'s')],['Mejor racha',best+' día'+(best===1?'':'s')],['Máximo en un día',max],['Media diaria',(total/days.length).toLocaleString('es-GT',{maximumFractionDigits:2})]];
 stats.forEach(([k,v],i)=>body+=txt(k,751,112+i*53,17,C.blue)+txt(v,751,136+i*53,19));
 body+=txt(`${days[0].date} — ${days.at(-1).date}`,25,409,15,C.muted)+txt(`Datos públicos · ${checked}`,575,409,15,C.muted);
 return svg('Calendario público de GitHub de jhus',435,body);
}
function parseSteam(html){
 const blocks=html.split(/<div class="recent_game">/).slice(1,4);
 const games=blocks.map(b=>{
  const name=b.match(/class="game_name"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/)?.[1];
  const image=b.match(/class="game_capsule" src="([^"]+)"/)?.[1];
  const info=plain(b.match(/class="game_info_details"[^>]*>([\s\S]*?)<\/div>/)?.[1]||'');
  return {name:name?plain(name):'',image,hours:info.match(/([\d,.]+) hrs on record/)?.[1],last:info.match(/last played on (.*)$/)?.[1],achievements:plain(b.match(/class="game_info_achievement_summary"[^>]*>([\s\S]*?)<\/span>/)?.[1]||'')};
 });
 if(!games.length||games.some(g=>!g.name))throw Error('Steam does not expose a recent games list');
 return games;
}
async function steamPanel(html){
 const games=parseSteam(html);
 const pictures=await Promise.all(games.map(g=>g.image?imageData(g.image).catch(()=>null):null));
 let body=heading('Steam · juegos recientes','game');
 games.forEach((g,i)=>{
  const y=76+i*91;
  if(pictures[i])body+=`<image x="26" y="${y}" width="128" height="48" preserveAspectRatio="xMidYMid slice" xlink:href="${esc(pictures[i])}"/>`;
  body+=txt(g.name,173,y+17,19,C.blue);
  body+=icon('clock',174,y+31,C.muted,15)+txt(g.hours?`${g.hours} h en total`:'Horas no visibles',197,y+44,16,C.muted);
  body+=txt(g.last?`Última partida: ${g.last}`:'Actividad visible en Steam',445,y+44,16,C.muted);
  const achievements=g.achievements.match(/(\d+)\s+of\s+(\d+)\s+Achievements/i);
  if(achievements)body+=txt(`${achievements[1]} / ${achievements[2]} logros`,730,y+44,15,C.muted);
 });
 body+=txt(`iamjhus · Fuente: perfil público de Steam · ${checked}`,26,371,15,C.muted);
 return svg('Juegos recientes de jhus en Steam',392,body);
}
async function techPanel(){
 const tools=[['nodejs','Node.js'],['python','Python'],['rust','Rust'],['c','C'],['cplusplus','C++'],['csharp','C#'],['dotnetcore','.NET'],['react','React'],['vite','Vite'],['microsoftsqlserver','SQL Server'],['postgresql','PostgreSQL'],['docker','Docker'],['nginx','Nginx'],['windows11','Windows'],['linux','Linux'],['apple','macOS / iOS'],['android','Android']];
 let body=heading('Tecnologías y plataformas','code');
 for(let i=0;i<tools.length;i++){
  const file=await fs.readFile(path.join(assets,tools[i][0]+'.svg'));
  body+=`<image x="${25+i*56}" y="70" width="40" height="40" xlink:href="data:image/svg+xml;base64,${file.toString('base64')}"/>`;
 }
 let x=25,y=141;
 for(const [,label] of tools){const width=label.length*8+26;if(x+width>975){x=25;y+=35;}
  body+=`<rect x="${x}" y="${y}" width="${width}" height="27" rx="13.5" fill="#162d46"/>`+txt(label,x+13,y+19,15,C.blue);x+=width+9;
 }
 return svg('Tecnologías y plataformas de jhus',y+56,body);
}
await fs.mkdir(assets,{recursive:true});
const [userText,reposText,calendar]=await Promise.all([
 get(`https://api.github.com/users/${login}`,'enriched-user.json'),
 get(`https://api.github.com/users/${login}/repos?per_page=100&type=owner`,'enriched-repos.json'),
 get(`https://github.com/users/${login}/contributions`,'enriched-calendar.txt'),
]);
const user=JSON.parse(userText),repos=JSON.parse(reposText),days=calendarDays(calendar);
if(!Array.isArray(repos)||repos.length<user.public_repos)throw Error('Public repository list is incomplete');
const stats=[['repo',`${user.public_repos} repositorio${user.public_repos===1?'':'s'} público${user.public_repos===1?'':'s'}`],['people',`${user.followers} seguidores`],['star',`${repos.reduce((s,r)=>s+r.stargazers_count,0)} estrellas`],['fork',`${repos.reduce((s,r)=>s+r.forks_count,0)} forks`],['code',`${user.public_gists} gists públicos`]];
let summary=txt(user.name||login,25,42,26,C.blue,600)+txt('@'+login,25,70,17,C.muted);
summary+=icon('clock',26,88,C.muted,18)+txt('En GitHub desde '+new Date(user.created_at).toLocaleDateString('es-GT',{timeZone:'America/Guatemala',month:'short',year:'numeric'}),54,103,17,C.muted);
stats.forEach(([type,value],i)=>{const x=i<3?26:510,y=142+(i<3?i:i-3)*30;summary+=icon(type,x,y-15)+txt(value,x+29,y,18);});
const tail=days.slice(-14);tail.forEach((d,i)=>summary+=`<rect x="${510+i*25}" y="39" width="18" height="18" rx="2" fill="${d.count?C.green:'#c9d1d9'}"><title>${d.date}: ${d.count} contribuciones</title></rect>`);
summary+=txt('Actividad pública · últimos 14 días',510,83,17,C.muted)+txt(`${days.reduce((s,d)=>s+d.count,0)} contribuciones públicas en el último año`,510,115,18,C.blue)+txt(`Actualizado: ${checked}`,510,216,15,C.muted);
await fs.writeFile(path.join(assets,'github-summary-v2.svg'),svg('Resumen público de GitHub de jhus',240,summary));
await fs.writeFile(path.join(assets,'github-calendar-v2.svg'),isoCalendar(days,365));
await fs.writeFile(path.join(assets,'github-calendar-half-v2.svg'),isoCalendar(days,183));
await fs.writeFile(path.join(assets,'profile-technologies-v2.svg'),await techPanel());
try{
 const steam=await get(steamUrl,'enriched-steam.txt');
 await fs.writeFile(path.join(assets,'steam-recent-v2.svg'),await steamPanel(steam));
 console.log('Steam: public recent games refreshed');
}catch(e){console.warn('Steam unchanged:',e.message);if(!await fs.stat(path.join(assets,'steam-recent-v2.svg')).catch(()=>null))throw e;}
try{
 const music=await get(musicUrl,'apple-profile.html');
 const privateProfile=/content="Private Profile"/.test(music);
 const body=heading('Apple Music · @jhus','music')+txt(privateProfile?'Las escuchas recientes no están disponibles públicamente.':'Mi actividad musical está en mi perfil de Apple Music.',25,89,19,C.ink)+txt('music.apple.com/profile/jhus',25,125,17,C.blue);
 await fs.writeFile(path.join(assets,'apple-music-v2.svg'),svg('Perfil de jhus en Apple Music',154,body));
 console.log('Apple Music:',privateProfile?'private profile; no listening history retrieved':'profile link refreshed');
}catch(e){console.warn('Apple Music unchanged:',e.message);}
console.log(`GitHub: ${user.public_repos} public repositories, ${days.length} calendar days, ${days.reduce((s,d)=>s+d.count,0)} public contributions`);
