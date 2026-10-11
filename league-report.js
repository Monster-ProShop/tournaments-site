const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=value=>window.LeagueI18n?.t(value)||value;
const table=(headers,rows)=>`<div class="table-scroll"><table class="score-grid"><thead><tr>${headers.map(h=>`<th>${esc(tr(h))}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td translate="no">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function grouped(rows,headers,values){
  if(!rows.length)return `<p>${esc(tr('No scores yet.'))}</p>`;
  const groups=new Map();for(const row of rows){const key=row.division||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  return [...groups].map(([division,items])=>`${groups.size>1||division?`<h4 translate="no">${esc(division||tr('No division'))}</h4>`:''}${table(headers,items.map(values))}`).join('');
}
export const teamStandings=rows=>grouped(rows,['#','Team','Games Played','Games Won','Games Lost','High Game + HCP','High Series + HCP','Total Pinfall + HCP'],r=>[r.teamNumber,r.name,r.played,r.wins,r.losses,r.highGame,r.highSeries,r.handicapPinfall]);
export const bowlerStandings=rows=>grouped(rows,['Bowler','Games','Average','HCP','High Game + HCP','High Series + HCP','Total Pinfall + HCP'],r=>[r.name,r.games,r.average,r.handicap,r.high_game_handicap,r.high_series_handicap,r.handicapPinfall]);
export const honorTable=rows=>rows.length?table(['Bowler','Session','Date','Honor','Game','Scratch'],rows.map(r=>[r.name,r.session,r.date,tr(r.type),r.game??'—',r.score])):`<p>${esc(tr('No 300 games or 800+ scratch series yet.'))}</p>`;
export const pointsNote='Games Played = possible points from scored matchups; Games Won = points earned; Games Lost = possible points minus points earned. Ties retain fractional points.';
export function reportHTML(report,competition){
  const t=value=>esc(tr(value));
  const records=table(['Record (with handicap)','Score','Team / bowler'],[['Highest team game',report.records.teamGame],['Highest team series',report.records.teamSeries],['Highest individual game',report.records.individualGame],['Highest individual series',report.records.individualSeries]].map(([label,r])=>[tr(label),r.score,r.names.join(', ')||'—']));
  const next=report.currentSession;
  const lanes=next?`<p translate="no">${esc(next.label)} · ${esc(next.date)}</p>${table(['Lane','Team','Lane','Team'],next.assignments.map(m=>[m.laneA,m.provisional?tr(m.teamA):m.teamA,m.laneB,m.provisional?tr(m.teamB):m.teamB]))}${next.assignments.some(m=>m.provisional)?`<p>${t('Position-round assignments are pending confirmation.')}</p>`:''}`:`<p>${t('All scheduled sessions are complete.')}</p>`;
  const title=report.weekly?'Weekly results':'Current standings';
  const header=`<header><img src="${esc(new URL('assets/prodrillos-gold-mark-v2.png',location.href).href)}" alt="ProDrillOS"><div><strong>Tournaments by ProDrillOS</strong><h1 translate="no">${esc(competition.name)}</h1><p>${t(title)}${report.throughSession?` · <span translate="no">${esc(report.throughSession.label)} · ${esc(report.throughSession.date)}</span>`:''}</p></div></header>`;
  const section=(label,body)=>`<section><h2>${t(label)}</h2>${body}</section>`;
  return `<!doctype html><html lang="${window.LeagueI18n?.language==='es'?'es-MX':'en'}"><head><meta charset="utf-8"><title>${t(title)} · ${esc(competition.name)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#ddd;color:#191918;font:9pt Arial,sans-serif}header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #b38b35;margin-bottom:12px;padding-bottom:10px}header img{width:70px;height:45px;object-fit:contain}header strong{color:#73551a;font-size:10pt}h1{font-size:18pt;margin:3px 0}h2{font-size:11pt;border-bottom:1px solid #b38b35;margin:10px 0 5px}h4{font-size:9pt;margin:7px 0 3px}p{margin:5px 0}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:4px 3px;border-bottom:1px solid #ddd;text-align:right;overflow-wrap:anywhere}th{background:#f4ecd9;font-size:.9em;color:#493b20}th:first-child,td:first-child{text-align:left}section{margin-bottom:10px}.sheet{width:8.5in;height:11in;padding:.35in;background:white;margin:16px auto;position:relative}.viewport{height:9.95in;overflow:visible}.content{transform-origin:top left}.footer{position:absolute;bottom:.2in;left:.35in;right:.35in;border-top:1px solid #bbb;padding-top:4px;font-size:8pt;display:flex;justify-content:space-between}.note{font-size:8pt;color:#555}.toolbar{padding:16px;text-align:center}.toolbar button{padding:10px 18px}#overflow{color:#9b1520;font-weight:bold}.columns{columns:2;column-gap:16px}.columns tr{break-inside:avoid}.columns h4{break-after:avoid}
    @page{size:letter portrait;margin:0}@media print{body{background:white}.toolbar{display:none}.sheet{margin:0;break-after:page;overflow:hidden}.viewport{overflow:hidden}.sheet:last-child{break-after:auto}body.overfull .sheet{display:none}body.overfull .toolbar{display:block}body.overfull .toolbar button{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><div class="toolbar"><button id="print">${t('Print / Save PDF')}</button><p>${t('US letter · two pages · print double-sided, flip on long edge. Disable browser headers and footers.')}</p><p id="overflow" hidden>${t('This league exceeds two readable pages. No rows were omitted. Reduce the report scope before printing.')}</p></div>
    <article class="sheet"><div class="viewport"><div class="content">${header}${section('Team Standings',teamStandings(report.teams))}<p class="note">${t(pointsNote)}</p>${section('League records',records)}${section('Honor Scores',honorTable(report.honorScores))}</div></div><footer class="footer"><span>Tournaments by ProDrillOS</span><span>1 / 2</span></footer></article>
    <article class="sheet"><div class="viewport"><div class="content">${header}${section('Current session to be bowled',lanes)}${section(report.weekly?'Weekly bowler results':'Bowler Standings',`<div class="columns">${bowlerStandings(report.weekly?report.weekly.bowlers:report.bowlers)}</div>`)}<p class="note">${t('Honor scores use scratch scores: every 300 game and every complete three-game series of at least 800. Team records require complete lineups; series records require all scheduled games.')}</p></div></div><footer class="footer"><span>Tournaments by ProDrillOS</span><span>2 / 2</span></footer></article></body></html>`;
}
export async function prepareReport(preview){
  const doc=preview.document;
  await doc.fonts.ready;
  await Promise.all([...doc.images].map(image=>image.complete?Promise.resolve():Promise.race([
    new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;}),
    new Promise(resolve=>setTimeout(resolve,1000))
  ])));
  let overflow=false;
  for(const content of doc.querySelectorAll('.content')){
    content.style.transform='';content.style.width='';const available=content.parentElement.clientHeight;let scale=1;
    for(let i=0;i<12;i++){scale=Math.min(1,available/content.scrollHeight);content.style.width=(100/scale)+'%';}
    scale=Math.min(1,available/content.scrollHeight);content.style.transform=`scale(${scale})`;if(scale<.6)overflow=true;
  }
  doc.body.classList.toggle('overfull',overflow);doc.getElementById('overflow').hidden=!overflow;doc.getElementById('print').disabled=overflow;
  doc.getElementById('print').onclick=()=>preview.print();preview.reportReady=true;
}
