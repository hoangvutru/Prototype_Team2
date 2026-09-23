/* ============================================================
   Capstone AI — shared shell + interactions
   <body data-role="student|teacher|admin" data-active="<id>" data-title="...">
   ============================================================ */
(function () {
  /* theme (dark default, light toggle) */
  try { if (localStorage.getItem('cai-theme') === 'light') document.documentElement.setAttribute('data-theme','light'); } catch(e){}

  const NAV = {
    student: { label:'Học sinh · Nhóm 4', items:[
      {id:'dashboard', label:'Trang chủ', href:'dashboard.html', icon:'house'},
      {id:'plan', label:'Kế hoạch dự án', href:'plan.html', icon:'clipboard-list'},
      {id:'agent-review', label:'Nhận xét từ AI', href:'agent-review.html', icon:'sparkles', tag:'2'},
      {id:'progress', label:'Tiến độ & minh chứng', href:'progress.html', icon:'clipboard-check'},
      {id:'versions', label:'Lịch sử phiên bản', href:'versions.html', icon:'history'},
      {id:'approval', label:'Gửi phê duyệt', href:'approval.html', icon:'send'},
    ]},
    teacher: { label:'Giáo viên', items:[
      {id:'teacher-dashboard', label:'Bảng điều khiển', href:'teacher-dashboard.html', icon:'layout-dashboard'},
      {id:'teacher-group', label:'Chi tiết nhóm', href:'teacher-group.html', icon:'users'},
      {id:'teacher-queue', label:'Hàng chờ phê duyệt', href:'teacher-queue.html', icon:'list-checks', tag:'4'},
    ]},
    admin: { label:'Quản trị viên', items:[
      {id:'agents', label:'Quản lý Agent', href:'agents.html', icon:'layout-grid'},
      {id:'add-external-agent', label:'Thêm agent ngoài', href:'add-external-agent.html', icon:'circle-plus'},
      {id:'agent-detail', label:'Chi tiết / Manifest', href:'agent-detail.html', icon:'file-cog'},
    ]}
  };
  const FOOT = { student:['MA','Minh An','Nhóm 4 · 11A2'], teacher:['CT','Cô Thu','GV hướng dẫn'], admin:['SP','S. Pham','Quản trị viên'] };
  const CRUMB = { student:'<b>Dự án</b> · Camera phát hiện rác', teacher:'<b>Lớp</b> · 11A2 & 11A3', admin:'<b>Hệ thống</b> · Quản trị agent' };
  const ROLE_HOME = { student:'dashboard.html', teacher:'teacher-dashboard.html', admin:'agents.html' };

  function svg(inner){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">'+inner+'</svg>'; }
  function icon(name, cls, style){ return '<i data-lucide="'+name+'"'+(cls?' class="'+cls+'"':'')+(style?' style="'+style+'"':'')+'></i>'; }
  function renderIcons(){ try{ if(window.lucide) window.lucide.createIcons(); }catch(e){} }
  window.renderIcons = renderIcons;
  function ensureLucide(){
    if(window.lucide){ renderIcons(); return; }
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js';
    s.onload=function(){ renderIcons(); };
    document.head.appendChild(s);
  }

  function buildShell(role, active, title){
    const cfg = NAV[role], foot = FOOT[role];
    const navItems = cfg.items.map(it=>
      '<a href="'+it.href+'"'+(it.id===active?' class="active"':'')+'>'+icon(it.icon)+it.label+(it.tag?'<span class="tag">'+it.tag+'</span>':'')+'</a>'
    ).join('');
    return ''+
    '<div class="app">'+
      '<aside class="sidebar" id="sidebar">'+
        '<a class="brand" href="index.html" title="Về trang chọn vai trò"><div class="logo">C</div><div class="n">Capstone <b>AI</b></div></a>'+
        '<nav class="nav"><div class="grp">'+cfg.label+'</div>'+navItems+'</nav>'+
        '<div class="side-foot"><div class="avatar">'+foot[0]+'</div><div class="who">'+foot[1]+'<small>'+foot[2]+'</small></div></div>'+
      '</aside>'+
      '<div class="scrim" id="scrim" hidden></div>'+
      '<div class="main">'+
        '<header class="topbar">'+
          '<button class="menu-btn" id="menuBtn" aria-label="Mở menu">'+icon('menu')+'</button>'+
          '<div><div class="crumb">'+CRUMB[role]+'</div><h1>'+(title||'')+'</h1></div>'+
          '<div class="spacer"></div>'+
          '<button class="icon-btn" id="themeBtn" aria-label="Đổi giao diện sáng/tối" title="Sáng / Tối"></button>'+
        '</header>'+
        '<div class="scroll"><div class="page" id="pageHost"></div></div>'+
      '</div>'+
    '</div>'+
    '<div class="overlay" id="overlay" hidden><div class="modal" id="modalBox"></div></div>'+
    '<div class="toast-wrap" id="toastWrap"></div>';
  }

  function themeIcon(){
    const light = document.documentElement.getAttribute('data-theme')==='light';
    return light ? icon('sun') : icon('moon');
  }
  window.toggleTheme = function(){
    const root=document.documentElement;
    const light = root.getAttribute('data-theme')==='light';
    if(light){ root.removeAttribute('data-theme'); try{localStorage.setItem('cai-theme','dark')}catch(e){} }
    else { root.setAttribute('data-theme','light'); try{localStorage.setItem('cai-theme','light')}catch(e){} }
    const btn=document.getElementById('themeBtn'); if(btn) btn.innerHTML=themeIcon();
    renderIcons();
  };

  document.addEventListener('DOMContentLoaded', function(){
    const b = document.body;
    const role = b.dataset.role, active = b.dataset.active, title = b.dataset.title;
    const content = b.querySelector('.page-content');
    if(!role || !content){ return; }
    b.innerHTML = buildShell(role, active, title);
    document.getElementById('pageHost').appendChild(content);
    document.getElementById('menuBtn').addEventListener('click', openMenu);
    document.getElementById('scrim').addEventListener('click', closeMenu);
    document.getElementById('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') closeModal(); });
    const tb=document.getElementById('themeBtn'); tb.innerHTML=themeIcon(); tb.addEventListener('click', toggleTheme);
    ensureLucide();
    if(active==='workspace') resetFlow();
    if(active==='add-external-agent') extReset();
  });

  /* ---------- shared ---------- */
  window.toast = function(msg){
    const w = document.getElementById('toastWrap'); if(!w) return;
    const t = document.createElement('div'); t.className='toast';
    t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>'+msg;
    w.appendChild(t); setTimeout(()=>{ t.style.opacity=0; t.style.transition='.3s'; setTimeout(()=>t.remove(),300); },2600);
  };
  window.openModal = function(html, lg){ const o=document.getElementById('overlay'); const box=document.getElementById('modalBox'); box.className='modal'+(lg?' lg':''); box.innerHTML=html; o.hidden=false; };
  window.closeModal = function(){ document.getElementById('overlay').hidden=true; };
  window.openMenu = function(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('scrim').hidden=false; };
  window.closeMenu = function(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('scrim').hidden=true; };
  window.go = function(target){ if(target && target.endsWith('.html')) location.href = target; };

  /* ---------- plan.html : Project Design chat ---------- */
  function pushDesign(who, html){
    const c = document.getElementById('designChat'); if(!c) return;
    const d = document.createElement('div'); d.className='msg '+who;
    d.innerHTML = (who==='ai'?'<div class="who">Project Design Agent</div>':'')+html;
    c.appendChild(d); c.scrollTop=c.scrollHeight;
  }
  window.sendDesign = function(){
    const inp=document.getElementById('designInput'), t=inp.value.trim(); if(!t) return;
    pushDesign('user', t); inp.value='';
    setTimeout(()=>pushDesign('ai','Mình đã ghi nhận yêu cầu trong phạm vi thiết kế kế hoạch. (Bản mẫu — phản hồi AI sẽ do backend/agent thật xử lý.)'),350);
  };
  window.quickDesign = function(kind){
    if(kind==='metric'){
      pushDesign('user','Đề xuất chỉ số đo lường');
      setTimeout(()=>pushDesign('ai','Gợi ý chỉ số <b>đo được</b>: (1) độ chính xác ≥ 85% trên tập kiểm thử; (2) thời gian phát hiện &lt; 2 giây/khung. Mình chỉ diễn đạt chỉ số quan sát được, <b>không</b> tạo tiêu chuẩn đánh giá chính thức.'),350);
    } else {
      pushDesign('user','Lên lịch cho nhóm đi Tam Đảo cuối tuần');
      setTimeout(()=>{ pushDesign('ai','<span class="badge b-out"><span class="bd"></span>OUT_OF_SCOPE</span><br><br>Lập kế hoạch du lịch <b>không thuộc</b> phạm vi dự án Capstone nên mình không thực hiện.'); toast('Yêu cầu ngoài phạm vi đã bị từ chối'); },350);
    }
  };
  window.confirmVersion = function(){
    openModal('<div class="modal-ic" style="background:var(--primary-tint);color:var(--primary-ink)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg></div>'+
      '<h3>Xác nhận lưu thành phiên bản?</h3><p>Bản nháp sẽ được lưu thành <b>phiên bản v4</b>. Chỉ bạn — không phải AI — thực hiện bước này. Phiên bản v3 sẽ được đánh dấu OUTDATED.</p>'+
      '<div class="actions"><button class="btn btn-ghost" onclick="closeModal()">Huỷ</button><button class="btn btn-primary" onclick="closeModal();toast(\'Đã lưu phiên bản v4\')">Xác nhận lưu v4</button></div>');
  };

  /* ---------- agent-review.html ---------- */
  const AGENT_NAME = { feas:'Feasibility & Capability', safety:'Safety & Governance', design:'Project Design', progress:'Progress & Evidence' };
  const savedBodies = {};
  window.toggleAgent = function(key, on){
    const card = document.querySelector('.agent-card[data-agent="'+key+'"]'); if(!card) return;
    const body = card.querySelector('[data-body]');
    card.classList.toggle('off', !on);
    if(!on){
      savedBodies[key] = body.innerHTML;
      body.innerHTML = '<div style="margin-bottom:10px"><span class="badge b-unchecked"><span class="bd"></span>Chưa được kiểm tra</span></div>'+
        '<div class="callout grey" style="padding:12px"><svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><path d="M12 2v10"/></svg>'+
        '<div>Agent <b>'+AGENT_NAME[key]+'</b> đang tắt. Phần này ghi <b>"Chưa được kiểm tra"</b> — hệ thống không suy diễn PASS.</div></div>';
      toast('Đã tắt '+AGENT_NAME[key]+' · ghi "Chưa được kiểm tra"');
    } else { if(savedBodies[key]) body.innerHTML = savedBodies[key]; toast('Đã bật lại '+AGENT_NAME[key]); }
  };

  /* ---------- workspace.html ---------- */
  window.pickAgent = function(btn, name){
    document.querySelectorAll('#agentPick button').forEach(b=>b.classList.remove('sel'));
    btn.classList.add('sel'); document.getElementById('wsAgent').innerHTML = name;
  };
  window.wsSend = function(){
    const inp=document.getElementById('wsInput'), t=inp.value.trim(); if(!t) return;
    const c=document.getElementById('wsChat'), d=document.createElement('div');
    d.className='msg user'; d.textContent=t; c.appendChild(d); c.scrollTop=c.scrollHeight; inp.value='';
    toast('Đã gửi yêu cầu · bấm Run để chạy pipeline');
  };
  window.resetFlow = function(){ document.querySelectorAll('#flow .node,#flow .arw').forEach(n=>n.classList.remove('on')); };
  window.runPipeline = function(){
    const els=[...document.querySelectorAll('#flow .node,#flow .arw')]; resetFlow();
    els.forEach((el,i)=>setTimeout(()=>{ el.classList.add('on'); if(i===els.length-1) toast('Hoàn tất · kết quả đã gắn plan version + Audit Log'); }, i*260));
  };

  /* ---------- run-result.html ---------- */
  window.toggleResultOff = function(off){
    const box=document.getElementById('resContent'); if(!box) return;
    if(off){
      box.dataset.saved = box.innerHTML;
      box.innerHTML = '<div class="callout grey" style="padding:18px"><svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><path d="M12 2v10"/></svg>'+
        '<div><b style="font-size:15px;color:var(--slate-ink)">Feasibility Agent đang TẮT</b><br><br>Tính khả thi và năng lực: <span class="badge b-unchecked"><span class="bd"></span>CHƯA ĐƯỢC KIỂM TRA</span><br><br>Hệ thống <b>không</b> hiển thị thành PASS. Học sinh vẫn có thể nhập/sửa thủ công; các agent còn bật vẫn chạy.</div></div>';
    } else if(box.dataset.saved){ box.innerHTML = box.dataset.saved; }
  };

  /* ---------- approval.html ---------- */
  window.confirmSend = function(){
    openModal('<div class="modal-ic" style="background:var(--amber-tint);color:var(--amber-ink)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg></div>'+
      '<h3>Gửi phiên bản v3 cho giáo viên?</h3><p>Kế hoạch còn <b>cảnh báo an toàn chưa xử lý</b>. Bạn vẫn có thể gửi; giáo viên sẽ là người quyết định phê duyệt.</p>'+
      '<div class="actions"><button class="btn btn-ghost" onclick="closeModal()">Xem lại</button><button class="btn btn-accent" onclick="closeModal();toast(\'Đã gửi v3 — vào hàng chờ phê duyệt\')">Gửi ngay</button></div>');
  };

  /* ---------- teacher-group.html ---------- */
  window.verifyMilestone = function(btn){
    window._verifyBtn = btn;
    openModal('<div class="modal-ic" style="background:var(--green-tint);color:var(--green-ink)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg></div>'+
      '<h3>Xác nhận Teacher Verified cho Mốc 2?</h3><p>Bạn xác nhận mốc này đạt yêu cầu dựa trên minh chứng. Đây là hành động <b>chỉ giáo viên</b> mới thực hiện được — agent không thể tự nâng trạng thái.</p>'+
      '<div class="actions"><button class="btn btn-ghost" onclick="closeModal()">Huỷ</button><button class="btn btn-primary" onclick="closeModal();doVerify()">Xác nhận</button></div>');
  };
  window.doVerify = function(){
    const btn=window._verifyBtn;
    if(btn){ const s=document.createElement('span'); s.className='badge b-pass'; s.innerHTML='<span class="bd"></span>Giáo viên xác nhận'; btn.replaceWith(s); }
    toast('Mốc 2 đã được giáo viên xác nhận đạt');
  };

  /* ---------- teacher-queue.html ---------- */
  window.decide = function(kind){
    const map = {
      approve:['Phê duyệt kế hoạch?','var(--green-tint)','var(--green-ink)','Kế hoạch sẽ chuyển sang trạng thái Đã duyệt.','Phê duyệt','Đã phê duyệt kế hoạch','btn-primary'],
      changes:['Yêu cầu chỉnh sửa?','var(--amber-tint)','var(--amber-ink)','Gửi lại cho học sinh kèm ghi chú cần sửa.','Gửi yêu cầu','Đã gửi yêu cầu chỉnh sửa','btn-accent'],
      reject:['Từ chối kế hoạch?','var(--red-tint)','var(--red-ink)','Học sinh sẽ nhận thông báo từ chối kèm lý do.','Từ chối','Đã từ chối kế hoạch','btn-danger']
    };
    const m = map[kind];
    openModal('<div class="modal-ic" style="background:'+m[1]+';color:'+m[2]+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></div>'+
      '<h3>'+m[0]+'</h3><p>'+m[3]+' Quyết định này do giáo viên chịu trách nhiệm.</p>'+
      '<div class="field" style="margin-top:8px"><label>Ghi chú cho học sinh</label><textarea placeholder="Nhập ghi chú…"></textarea></div>'+
      '<div class="actions"><button class="btn btn-ghost" onclick="closeModal()">Huỷ</button><button class="btn '+m[6]+'" onclick="closeModal();toast(\''+m[5]+'\')">'+m[4]+'</button></div>');
  };

  /* ---------- add-external-agent.html : wizard ---------- */
  let extStep = 1;
  window.extReset = function(){ extStep=1; showExtStep(); };
  function showExtStep(){
    document.querySelectorAll('[data-step]').forEach(el=>{ el.hidden = (+el.dataset.step !== extStep); });
    document.querySelectorAll('#extStepper .st').forEach(st=>{ const s=+st.dataset.s; st.classList.toggle('active', s===extStep); st.classList.toggle('done', s<extStep); });
    const back=document.getElementById('extBack'), next=document.getElementById('extNext'), sub=document.getElementById('extSubmit');
    if(back) back.style.display = extStep>1 ? 'inline-flex':'none';
    if(next) next.style.display = extStep<4 ? 'inline-flex':'none';
    if(sub)  sub.style.display  = extStep===4 ? 'inline-flex':'none';
  }
  window.extStepMove = function(d){ extStep=Math.min(4,Math.max(1,extStep+d)); showExtStep(); const s=document.querySelector('.scroll'); if(s) s.scrollTop=0; };
  window.runBoundaryTest = function(){
    const rows=document.querySelectorAll('#btResults .bt-status');
    rows.forEach((b,i)=>setTimeout(()=>{
      const fail = b.dataset.fail==='1';
      b.className='badge bt-status '+(fail?'b-out':'b-pass'); b.innerHTML='<span class="bd"></span>'+(fail?'FAIL':'PASS');
      if(i===rows.length-1) toast('Boundary test xong · 4/5 PASS, 1 FAIL cần sửa');
    }, i*300));
  };
  window.submitExternal = function(){
    openModal('<div class="modal-ic" style="background:var(--green-tint);color:var(--green-ink)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg></div>'+
      '<h3>Đăng ký agent bên ngoài?</h3><p>Agent sẽ được lưu ở trạng thái <b>Registered</b>. Chỉ người có quyền mới <b>Enable</b> sau khi rà soát. Agent chỉ hoạt động trong domain <b>Vinschool Capstone</b>.</p>'+
      '<div class="actions"><button class="btn btn-ghost" onclick="closeModal()">Huỷ</button><button class="btn btn-primary" onclick="closeModal();go(\'agents.html\')">Đăng ký</button></div>');
  };

  /* ---------- agent-detail.html : tabs ---------- */
  window.detTab = function(name, btn){
    document.querySelectorAll('#detTabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('[data-tab]').forEach(el=>{ el.hidden = (el.dataset.tab !== name); });
  };

  /* ---------- create child agent ---------- */
  window.openChild = function(){
    const diagram =
      '<svg viewBox="0 0 260 130" style="width:100%;height:auto">'+
      '<defs><marker id="ar" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="var(--faint)"/></marker></defs>'+
      '<g font-family="Plus Jakarta Sans" font-size="8" font-weight="600">'+
      '<rect x="2" y="52" width="58" height="26" rx="6" fill="var(--sunken)" stroke="var(--border-strong)"/><text x="31" y="63" text-anchor="middle" fill="var(--muted)">Parent</text><text x="31" y="72" text-anchor="middle" fill="var(--faint)" font-size="7">Project Design</text>'+
      '<rect x="80" y="52" width="52" height="26" rx="6" fill="var(--sunken)" stroke="var(--border-strong)"/><text x="106" y="67" text-anchor="middle" fill="var(--muted)">Orchestrator</text>'+
      '<rect x="152" y="52" width="52" height="26" rx="6" fill="var(--primary-tint)" stroke="var(--primary)"/><text x="178" y="63" text-anchor="middle" fill="var(--primary-ink)">Child</text><text x="178" y="72" text-anchor="middle" fill="var(--primary-ink)" font-size="7">Draft</text>'+
      '<rect x="152" y="8" width="106" height="22" rx="6" fill="var(--surface-2)" stroke="var(--border)"/><text x="205" y="22" text-anchor="middle" fill="var(--muted)" font-size="7">Domain Consistency Check</text>'+
      '<rect x="152" y="100" width="106" height="22" rx="6" fill="var(--surface-2)" stroke="var(--border)"/><text x="205" y="114" text-anchor="middle" fill="var(--muted)" font-size="7">Boundary Test</text>'+
      '<line x1="60" y1="65" x2="78" y2="65" stroke="var(--faint)" marker-end="url(#ar)"/>'+
      '<line x1="132" y1="65" x2="150" y2="65" stroke="var(--faint)" marker-end="url(#ar)"/>'+
      '<line x1="178" y1="52" x2="178" y2="32" stroke="var(--faint)" marker-end="url(#ar)"/>'+
      '<line x1="178" y1="78" x2="178" y2="98" stroke="var(--faint)" marker-end="url(#ar)"/>'+
      '</g></svg>';
    openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><h3 style="margin:0">Tạo agent con</h3><button class="icon-btn" onclick="closeModal()" aria-label="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>'+
      '<div class="row" data-nowrap style="gap:18px;flex-wrap:nowrap;align-items:flex-start">'+
        '<div style="flex:1;min-width:0">'+
          '<div class="row" style="gap:12px"><div class="field" style="flex:1;min-width:130px;margin-bottom:10px"><label>Agent cha</label><input value="Project Design Agent" readonly></div>'+
          '<div class="field" style="flex:1;min-width:130px;margin-bottom:10px"><label>Domain <span class="badge b-out" style="padding:1px 7px">🔒 LOCKED</span></label><input value="Vinschool Capstone" readonly></div></div>'+
          '<div class="field" style="margin-bottom:10px"><label>Tên agent con</label><input placeholder="VD: Metric Helper"></div>'+
          '<div class="field" style="margin-bottom:10px"><label>Mô tả</label><textarea style="min-height:52px" placeholder="Vai trò của agent con…"></textarea></div>'+
          '<div class="field" style="margin-bottom:10px"><label>Supported objects</label><div class="pill-list"><span class="chip">Capstone Plan <b>×</b></span><span class="chip">Metrics Map <b>×</b></span></div></div>'+
          '<div class="field" style="margin-bottom:10px"><label>Supported intents</label><div class="pill-list"><span class="chip">metric_structuring <b>×</b></span><span class="chip">scope_clarity_check <b>×</b></span></div></div>'+
          '<div class="field" style="margin-bottom:0"><label>Allowed tools (⊆ allowlist cha)</label><div class="pill-list"><span class="chip">Proposal Draft Writer <b>×</b></span></div></div>'+
        '</div>'+
        '<div style="flex:0 0 250px;max-width:100%"><div class="eyebrow" style="margin-bottom:8px">Sơ đồ kiến trúc</div><div class="card" style="padding:10px">'+diagram+'</div>'+
          '<div class="callout warn" style="padding:11px;margin-top:12px"><svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><div>Không đổi được domain sang ngoài phạm vi. Agent con phối hợp qua Orchestrator, phải qua Manifest + Boundary test trước khi Enable.</div></div>'+
        '</div>'+
      '</div>'+
      '<div class="actions"><button class="btn btn-ghost" onclick="closeModal()">Huỷ</button><button class="btn btn-ghost" onclick="toast(\'Bản mẫu: validate manifest\')">Validate</button><button class="btn btn-primary" onclick="closeModal();go(\'agents.html\')">Tạo bản nháp</button></div>',
      true
    );
  };
})();
