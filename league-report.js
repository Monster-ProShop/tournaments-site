const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=value=>window.LeagueI18n?.t(value)||value;
const table=(headers,rows,cell=esc)=>`<div class="table-scroll"><table class="score-grid"><thead><tr>${headers.map(h=>`<th>${esc(tr(h))}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td translate="no">${cell(v,i)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function grouped(rows,headers,values,cell){
  if(!rows.length)return `<p>${esc(tr('No scores yet.'))}</p>`;
  const groups=new Map();for(const row of rows){const key=row.division||'';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  return [...groups].map(([division,items])=>`${groups.size>1||division?`<h4 translate="no">${esc(division||tr('No division'))}</h4>`:''}${table(headers,items.map(values),cell)}`).join('');
}
export const teamStandings=rows=>grouped(rows,['Place','Team','Games Played','Games Won','Games Lost','High Game + HCP','High Series + HCP','Total Pinfall + HCP'],
  (r,i)=>[{place:i+1,movement:r.movement},r.name,r.played,r.wins,r.losses,r.highGame,r.highSeries,r.handicapPinfall],
  (value,index)=>{
    if(index!==0)return esc(value);
    const {place,movement}=value;
    if(!movement)return esc(place);
    const direction=movement>0?'up':'down',count=Math.abs(movement);
    const label=`${tr(direction==='up'?'Places gained':'Places lost')} ${count}`;
    return `<span class="standing-place">${place} <span class="standing-${direction}" role="img" aria-label="${esc(label)}" title="${esc(label)}">${movement>0?'▲':'▼'}${count}</span></span>`;
  });
function renderBowlerStandings(rows,compact=false){
  const headers=compact?['Pl.','Bowler','Team','G','Avg','HCP','HG','HS','Pins']:
    ['Place','Bowler','Team','Games','Average','HCP','High Game + HCP','High Series + HCP','Total Pinfall + HCP'];
  return grouped(rows,headers,r=>[r.place,r.name,r.team,r.games,r.average,r.handicap,r.high_game_handicap,r.high_series_handicap,r.handicapPinfall]);
}
export const bowlerStandings=rows=>renderBowlerStandings(rankBowlers(rows));
export const honorTable=rows=>rows.length?table(['Bowler','Session','Date','Honor','Game','Scratch'],rows.map(r=>[r.name,r.session,r.date,tr(r.type),r.game??'—',r.score])):`<p>${esc(tr('No 300 games or 800+ scratch series yet.'))}</p>`;
export const pointsNote='Games Played = possible points from scored matchups; Games Won = points earned; Games Lost = possible points minus points earned. Ties retain fractional points.';
export const movementNote='Arrows show places gained or lost since the previous scored session in the same division.';
export function rankBowlers(rows){
  const places=new Map();
  return rows.map(row=>{
    const key=row.division||'',place=(places.get(key)||0)+1;
    places.set(key,place);
    return {...row,place};
  });
}
function printBowlerColumns(rows){
  const ranked=rankBowlers(rows);
  const split=Math.ceil(ranked.length/2);
  return `<div class="columns"><div>${renderBowlerStandings(ranked.slice(0,split),true)}</div>${ranked.length>1?`<div>${renderBowlerStandings(ranked.slice(split),true)}</div>`:''}</div>`;
}
function printHonors(rows){
  if(!rows.length)return honorTable(rows);
  return `<ul class="honor-list">${rows.map(row=>`<li>
    <div><strong translate="no">${esc(row.name)}</strong><strong>${esc(row.score)}</strong></div>
    <small>${esc(tr(row.type))}${row.game==null?'':` · ${esc(tr(`Game ${row.game}`))}`} · <span translate="no">${esc(row.session)} · ${esc(row.date)}</span></small>
  </li>`).join('')}</ul>`;
}
function printWeeklyAudit(matches){
  if(!matches.length)return `<p>${esc(tr('No team matchup scores are available for this session.'))}</p>`;
  const gameCount=Math.max(...matches.map(match=>match.teams[0].games.length));
  const headers=['Lanes','Team',...Array.from({length:gameCount},(_,i)=>`Game ${i+1}`),
    'Scratch series','Series + HCP','Bonus points','Match points'];
  const rows=matches.flatMap(match=>match.teams.map(team=>[
    `${match.laneA??'—'}/${match.laneB??'—'}`,team.name,
    ...Array.from({length:gameCount},(_,i)=>team.games[i]?.total),
    team.scratchSeries,team.series.total,team.bonusPoints,team.points
  ]));
  return `<div class="team-audit">${table(headers,rows)}</div><p class="note">${esc(tr('Game totals include handicap. Match points include bonuses.'))}</p>`;
}
function scheduleHTML(session){
  if(!session)return `<p>${esc(tr('All scheduled sessions are complete.'))}</p>`;
  const assignments=session.assignments.map(match=>{
    const teamA=match.provisional?tr(match.teamA):match.teamA;
    const teamB=match.provisional?tr(match.teamB):match.teamB;
    return `<li><strong class="lane-pair">${esc(match.laneA)}/${esc(match.laneB)}</strong><span translate="no">${esc(teamA)} vs ${esc(teamB)}</span></li>`;
  }).join('');
  const pending=session.assignments.some(match=>match.provisional)
    ?`<p class="note">${esc(tr('Position-round assignments are pending confirmation.'))}</p>`:'';
  return `<p translate="no">${esc(session.label)} · ${esc(session.date)}</p><ul class="lane-list">${assignments}</ul>${pending}`;
}
export function reportHTML(report,competition,leagueLogo){
  const logo=typeof leagueLogo==='string'&&/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(leagueLogo)?leagueLogo:null;
  const t=value=>esc(tr(value));
  const records=table(['Record (with handicap)','Score','Team / bowler'],[['Highest team game',report.records.teamGame],['Highest team series',report.records.teamSeries],['Highest individual game',report.records.individualGame],['Highest individual series',report.records.individualSeries]].map(([label,r])=>[tr(label),r.score,r.names.join(', ')||'—']));
  const lanes=scheduleHTML(report.currentSession);
  const title=report.weekly?'Weekly results':'Current standings';
  const header=`<header><img src="${esc(new URL('assets/prodrillos-gold-mark-v2.png',location.href).href)}" alt="ProDrillOS"><div><strong>Tournaments by ProDrillOS</strong><h1 translate="no">${esc(competition.name)}</h1><p>${t(title)}${report.throughSession?` · <span translate="no">${esc(report.throughSession.label)} · ${esc(report.throughSession.date)}</span>`:''}</p></div>${logo?`<img class="league-report-logo" src="${esc(logo)}" alt="${t('League logo')}">`:''}</header>`;
  const section=(label,body)=>`<section><h2>${t(label)}</h2>${body}</section>`;
  const teams=section('Team Standings',teamStandings(report.teams)+`<p class="note">${t(pointsNote)}</p>${report.teams.some(team=>team.movement)?`<p class="note">${t(movementNote)}</p>`:''}`);
  const honorNote=`<p class="note">${t('Honor scores use scratch scores: every 300 game and every complete three-game series of at least 800. Team records require complete lineups; series records require all scheduled games.')}</p>`;
  const honors=section('League records',records)+section('Honor Scores',printHonors(report.honorScores)+honorNote);
  const secondPage=report.weekly
    ?section('Weekly team score audit',printWeeklyAudit(report.weekly.matches||[]))
    :section('Bowler Standings',printBowlerColumns(report.bowlers))+`<p class="note">${t('Pl. = place · G = games · Avg = scratch average · HG = high game · HS = high series. HG, HS and Pins include handicap.')}</p>`;
  const front=`<div class="report-layout front-layout"><div class="team-results">${teams}</div><aside class="report-sidebar">${honors}</aside></div>`;
  const back=`<div class="report-layout back-layout"><div class="bowler-results">${secondPage}</div><aside class="report-sidebar schedule">${section('Current session to be bowled',lanes)}</aside></div>`;
  return `<!doctype html><html lang="${window.LeagueI18n?.language==='es'?'es-MX':'en'}"><head><meta charset="utf-8"><title>${t(title)} · ${esc(competition.name)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#ddd;color:#191918;font:9pt Arial,sans-serif}header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #b38b35;margin-bottom:12px;padding-bottom:10px}header img{width:70px;height:45px;object-fit:contain}header strong{color:#73551a;font-size:10pt}h1{font-size:18pt;margin:3px 0}h2{font-size:11pt;border-bottom:1px solid #b38b35;margin:10px 0 5px}h4{font-size:9pt;margin:7px 0 3px}p{margin:5px 0}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:4px 3px;border-bottom:1px solid #ddd;text-align:right;overflow-wrap:anywhere}th{background:#f4ecd9;font-size:.9em;color:#493b20}th:first-child,td:first-child{text-align:left}section{margin-bottom:10px}.sheet{width:8.5in;height:11in;padding:.35in;background:white;margin:16px auto;position:relative}.viewport{height:9.95in;overflow:visible}.content{transform-origin:top left}.footer{position:absolute;bottom:.2in;left:.35in;right:.35in;border-top:1px solid #bbb;padding-top:4px;font-size:8pt;display:flex;justify-content:space-between}.note{font-size:8pt;color:#555}.toolbar{padding:16px;text-align:center}.toolbar button{padding:10px 18px}#overflow{color:#9b1520;font-weight:bold}.columns{columns:2;column-gap:16px}.columns tr{break-inside:avoid}.columns h4{break-after:avoid}
    header .league-report-logo{width:72px;height:45px;margin-left:auto;flex-shrink:0}
    .report-layout{display:grid;align-items:start;gap:12px}
    .front-layout{grid-template-columns:minmax(0,1.9fr) minmax(0,1fr)}
    .sheet-back{padding-right:.28in}.sheet-back .footer{right:.28in}
    .back-layout{grid-template-columns:minmax(0,3.5fr) minmax(0,1fr)}
    .report-sidebar{min-width:0;border-left:1px solid #d7c9a9;padding-left:10px}
    .team-results th:first-child{width:8%}.team-results th:nth-child(2){width:22%;text-align:left}.team-results td:nth-child(2){text-align:left}
    .report-sidebar th,.report-sidebar td{padding:3px 2px}
    .report-sidebar section:first-child th:first-child{width:45%}.report-sidebar section:first-child th:nth-child(2){width:17%}
    .schedule .lane-list,.honor-list{list-style:none;margin:6px 0 0;padding:0;font-size:8pt}
    .lane-list li{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:5px;border-bottom:1px solid #ddd;padding:4px 0;break-inside:avoid}
    .lane-pair{font-variant-numeric:tabular-nums;white-space:nowrap}
    .honor-list li{border-bottom:1px solid #ddd;padding:4px 0;break-inside:avoid}
    .honor-list li>div{display:flex;justify-content:space-between;gap:6px}
    .bowler-results .columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:10px;font-size:7.7pt;line-height:1.15}
    .bowler-results th,.bowler-results td{padding:2px 1px}
    .columns .table-scroll{break-inside:avoid}.columns th:nth-child(1){width:6%}.columns th:nth-child(2){width:28%}.columns th:nth-child(3){width:20%}
    .columns th:nth-child(2),.columns th:nth-child(3),.columns td:nth-child(2),.columns td:nth-child(3){text-align:left}
    .columns th:nth-child(4){width:5%}.columns th:nth-child(5){width:9%}.columns th:nth-child(6){width:6%}
    .columns th:nth-child(7),.columns th:nth-child(8){width:8%}.columns th:nth-child(9){width:10%}
    .columns td:nth-child(n+4){white-space:nowrap}
    .team-results tbody tr:nth-child(even),.columns tbody tr:nth-child(even){background:#f7f5ef}
    .standing-place{white-space:nowrap}.standing-up{color:#176033}.standing-down{color:#9b2537}.standing-up,.standing-down{font-weight:bold}
    .team-results th:first-child{width:11%}
    .team-audit th,.team-audit td{padding:4px 2px}.team-audit th:nth-child(2){width:23%}
    .team-audit td:nth-child(2),.team-audit th:nth-child(2){text-align:left}.team-audit tbody tr:nth-child(4n+1),.team-audit tbody tr:nth-child(4n+2){background:#f7f5ef}
    @page{size:letter portrait;margin:0}@media print{body{background:white}.toolbar{display:none}.sheet{margin:0;break-after:page;overflow:hidden}.viewport{overflow:hidden}.sheet:last-child{break-after:auto}body.overfull .sheet{display:none}body.overfull .toolbar{display:block}body.overfull .toolbar button{display:none}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body><div class="toolbar"><button id="print">${t('Print / Save PDF')}</button><p>${t('US letter · two pages · print double-sided, flip on long edge. Disable browser headers and footers.')}</p><p id="overflow" hidden>${t('This league exceeds two readable pages. No rows were omitted. Reduce the report scope before printing.')}</p></div>
    <article class="sheet"><div class="viewport"><div class="content">${header}${front}</div></div><footer class="footer"><span>Tournaments by ProDrillOS</span><span>1 / 2</span></footer></article>
    <article class="sheet sheet-back"><div class="viewport"><div class="content">${header}${back}</div></div><footer class="footer"><span>Tournaments by ProDrillOS</span><span>2 / 2</span></footer></article></body></html>`;
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
    content.style.transform='';
    const available=content.parentElement.clientHeight;
    const fits=scale=>{
      content.style.width=`${100/scale}%`;
      return content.scrollHeight*scale<=available;
    };
    let scale=1;
    if(!fits(scale)){
      const minimum=.6;
      if(!fits(minimum)){
        overflow=true;
        scale=minimum;
      }else{
        let low=minimum,high=1;
        for(let i=0;i<14;i++){
          const candidate=(low+high)/2;
          if(fits(candidate))low=candidate;else high=candidate;
        }
        scale=low;
      }
    }
    // Apply the same scale and width used by the fitting check.
    content.style.width=`${100/scale}%`;
    content.style.transform=`scale(${scale})`;
  }
  doc.body.classList.toggle('overfull',overflow);doc.getElementById('overflow').hidden=!overflow;doc.getElementById('print').disabled=overflow;
  doc.getElementById('print').onclick=()=>preview.print();preview.reportReady=true;
}
