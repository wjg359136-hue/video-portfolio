const state={page:1,pageSize:25,total:0,role:'',q:'',videos:[],activeId:null};
let snapshotCache=null;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'未知').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=v=>v?new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'numeric',day:'numeric'}).format(new Date(v)):'未知';

const dictionary=[
  ['视频ID','来源身份','每条记录的稳定主键；同一视频复核时不新建主记录。','防止重复入库','按日期+序号生成'],
  ['文件指纹','来源身份','由原视频文件计算的唯一摘要。','识别改名后的同一文件','相同指纹视为重复'],
  ['内容理解','内容理解','一句话说清这支视频在讲什么、承担什么任务。','后续检索和脚本复用的入口','先看画面和字幕，再做策略解释'],
  ['内容角色','内容理解','成交内容、产品教育或品牌内容。','不同角色应看不同指标','成交看片点击；教育看完播；品牌看记忆'],
  ['卖哪个品','五项拆解','商品、款式、价格和核心卖点。','避免把不同SKU混在一起','不确定就写未知'],
  ['面向谁','五项拆解','身形、穿衣场景、痛点与购买阻力。','判断内容是否对准真实买家','越具体越能测试'],
  ['前3秒说什么','五项拆解','0–3秒逐字文案、首帧和时间码。','直接对应停留意愿','用3秒留存率验证'],
  ['证明画面','五项拆解','镜头、证明的卖点和出现时间码。','区分口头承诺与可见证据','强/中/弱分级'],
  ['目标结果','五项拆解','视频承诺的结果和希望观众采取的动作。','决定应使用哪组指标','不能写成真实成交结果'],
  ['观察事实','判断质量','画面、字幕或口播直接可见可听的信息。','保护数据库不被猜测污染','能够回看验证'],
  ['AI策略推断','判断质量','对意图、受众心理和结构作用的解释。','形成下一轮实验假设','必须同时保存置信度'],
  ['分析版本','历史追溯','同一视频的每次复核都新增版本。','旧结论不会因改判而丢失','最新版本默认展示'],
  ['3秒留存率','发布结果','播放到3秒仍留下的观众占比。','验证开头钩子','同SKU、同流量条件比较'],
  ['完播率','发布结果','完整看完视频的观众占比。','验证叙事承接和时长','不能代替成交'],
  ['商品点击率','发布结果','商品点击数÷播放量。','验证卖点和证明画面','主要看证据链'],
  ['成交转化率','发布结果','成交单量÷商品点击数。','验证产品匹配、信任、价格与CTA','自然流与投流分开']
];

function showView(id){$$('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===id));$$('.view').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo({top:0,behavior:'smooth'});}
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
$$('[data-jump]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.jump)));

async function load(){
  try{
    if(!snapshotCache){const res=await fetch('./data/bootstrap.json',{cache:'no-store'});if(!res.ok)throw new Error('读取失败');snapshotCache=await res.json();}
    let rows=snapshotCache.videos;if(state.role)rows=rows.filter(v=>v.content_role===state.role);if(state.q){const q=state.q.toLowerCase();rows=rows.filter(v=>JSON.stringify(v).toLowerCase().includes(q));}
    const total=rows.length;const start=(state.page-1)*state.pageSize;const data={...snapshotCache,total,videos:rows.slice(start,start+state.pageSize)};
    state.total=data.total;state.videos=data.videos;
    renderSummary(data.summary,data.roles,data.evidence,data.storageStatus);
    renderLatest(data.videos.slice(0,3));renderPatterns(data.patterns);renderList();
    if(!state.activeId||!state.videos.some(v=>v.id===state.activeId))state.activeId=state.videos[0]?.id||null;
    renderDetail();
  }catch(error){$('#storageLabel').textContent='数据库暂不可用';$('#videoList').innerHTML='<div class="empty">暂时无法读取数据，请稍后刷新。</div>';toast(error.message);}
}

function renderSummary(s,roles,evidence,storage){
  $('#videoCount').textContent=s.video_count;$('#revisionCount').textContent=s.revision_count;$('#durationTotal').textContent=Number(s.duration_total||0).toFixed(1)+'秒';$('#metricCount').textContent=s.metric_count+'条';
  $('#lastUpdated').textContent='最近入库：'+fmtDate(s.last_seen);$('#storageLabel').textContent=storage==='persistent'?'持久化数据库已连接':'只读基线数据';
  $('#stageValue').textContent=s.video_count<20?'建立基线（'+s.video_count+'/20）':'进入规律验证';$('#conclusionState').textContent=s.video_count<20?'结论状态：待验证':'结论状态：可验证';
  const max=Math.max(1,...roles.map(r=>r.count));$('#roleChart').innerHTML=roles.map(r=>`<div class="role-row"><span>${esc(r.content_role)}</span><div class="track"><div class="bar" style="width:${r.count/max*100}%"></div></div><strong>${r.count}</strong></div>`).join('')||'<div class="empty">暂无数据</div>';
  const map=new Map(evidence.map(x=>[x.evidence_strength,x.count]));$('#evidenceChart').innerHTML=['强','中','弱'].map(x=>`<div class="evidence-box"><span>${x}证据</span><strong>${map.get(x)||0}</strong></div>`).join('');
}

function renderLatest(videos){$('#latestUnderstanding').innerHTML=videos.map(v=>`<article class="latest-card"><time>${esc(v.recorded_date)} · ${esc(v.content_role)}</time><h4>${esc(v.title)}</h4><p>${esc(v.summary)}</p></article>`).join('')||'<div class="empty">暂无视频</div>';}
function renderPatterns(items){$('#patternGrid').innerHTML=items.map(p=>`<article class="pattern-card"><div class="pattern-top"><code>${esc(p.id)}</code><span>${esc(p.status)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.hypothesis)}</p><dl><div><dt>主要指标</dt><dd>${esc(p.primary_metric)}</dd></div><div><dt>测试进度</dt><dd>${p.test_count}/${p.required_tests}</dd></div></dl></article>`).join('')||'<div class="empty">暂无规律假设</div>';}

function renderList(){
  $('#videoList').innerHTML=state.videos.map(v=>`<button class="video-card ${v.id===state.activeId?'active':''}" data-id="${esc(v.id)}"><img src="${esc(v.image_path||'')}" alt=""><div><div class="video-card-top"><span class="role-tag">${esc(v.content_role)}</span><time>${esc(v.recorded_date)} · ${Number(v.duration_seconds).toFixed(1)}秒</time></div><h3>${esc(v.title)}</h3><p>${esc(v.summary)}</p></div></button>`).join('')||'<div class="empty">没有符合条件的视频</div>';
  $$('.video-card').forEach(b=>b.addEventListener('click',()=>{state.activeId=b.dataset.id;renderList();renderDetail();}));
  const pages=Math.max(1,Math.ceil(state.total/state.pageSize));$('#pageInfo').textContent=`第 ${state.page} / ${pages} 页 · 共 ${state.total} 条`;$('#prevPage').disabled=state.page<=1;$('#nextPage').disabled=state.page>=pages;
}

function renderDetail(){
  const v=state.videos.find(x=>x.id===state.activeId);if(!v){$('#videoDetail').innerHTML='<div class="empty">没有可显示的记录</div>';return;}
  let tags=[];try{tags=JSON.parse(v.tags_json||'[]')}catch{}
  $('#videoDetail').innerHTML=`<div class="detail-head"><div><span class="role-tag">${esc(v.content_role)}</span><h2>${esc(v.title)}</h2><p>${esc(v.id)} · ${esc(v.source_filename)} · v${v.version}</p></div><div class="confidence"><span>AI置信度</span><strong>${esc(v.confidence)}</strong></div></div>
  <div class="understanding"><span>这条视频在讲什么</span><p>${esc(v.summary)}</p></div>
  <div class="five-grid"><div class="five-item"><span>01 卖哪个品</span><p>${esc(v.product)}</p></div><div class="five-item"><span>02 面向谁</span><p>${esc(v.audience)}</p></div><div class="five-item wide"><span>03 前3秒说什么 · ${esc(v.hook_timecode)}</span><p>${esc(v.hook_text)}；首帧：${esc(v.first_frame)}</p></div><div class="five-item"><span>04 证明画面 · ${esc(v.proof_timecode)}</span><p>${esc(v.proof)}</p></div><div class="five-item"><span>05 最终带来什么结果</span><p>${esc(v.promised_result)}；行动：${esc(v.intended_action)}</p></div></div>
  <div class="evidence-strip"><div><span>证据强度</span><strong>${esc(v.evidence_strength)}</strong></div><div><span>发布数据</span><strong>${v.metric_snapshots?esc(v.metric_snapshots)+'个快照':'待回填'}</strong></div><div><span>标签</span><strong>${esc(tags.join(' · ')||'无')}</strong></div></div>
  <div class="detail-section"><h3>观察事实</h3><p>${esc(v.facts)}</p></div><div class="detail-section"><h3>AI策略推断</h3><p>${esc(v.inference)}</p></div><div class="detail-section alert"><h3>需要人工确认</h3><p>${esc(v.manual_checks)}</p></div>
  <details class="history"><summary>数据历史（${v.revision_total}个分析版本）</summary><ul><li>首次入库：${esc(v.first_seen_at)}</li><li>当前分析版本：v${v.version}，生成于 ${esc(v.analysis_created_at)}</li><li>原记录不会被后续复核覆盖；指标也按24小时、72小时和7天分别追加。</li></ul></details>`;
}

$('#dictionaryGrid').innerHTML=dictionary.map(d=>`<article class="field-card"><div class="field-head"><h3>${d[0]}</h3><span>${d[1]}</span></div><p>${d[2]}</p><div class="field-meta"><div><small>为什么记录</small><strong>${d[3]}</strong></div><div><small>怎么判断</small><strong>${d[4]}</strong></div></div></article>`).join('');
$('#searchButton').addEventListener('click',()=>{state.q=$('#searchInput').value.trim();state.role=$('#roleFilter').value;state.page=1;load();});
$('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#searchButton').click();});
$('#prevPage').addEventListener('click',()=>{state.page--;load();});$('#nextPage').addEventListener('click',()=>{state.page++;load();});
const dialog=$('#guideDialog');$('#openGuide').addEventListener('click',()=>dialog.showModal());$('#closeGuide').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3000)}
load();
