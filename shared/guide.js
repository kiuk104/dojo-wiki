/* Dojo Wiki — 가이드 페이지 공통 동작: 검색, 목차, 읽던 위치, 북마크 */
(function(){
  var G=window.FSG||{}, K=G.keys||{bm:'fs-'+G.id+'-bm',nav:'fs-'+G.id+'-nav',pos:'fs-'+G.id+'-pos'};
  var q=document.getElementById('q'), hits=document.getElementById('hits'),
      blks=[].slice.call(document.querySelectorAll('.blk')),
      navs=[].slice.call(document.querySelectorAll('#nav a')),
      empty=document.getElementById('empty'),
      side=document.getElementById('side'), scrim=document.getElementById('scrim');

  function filter(){
    var v=q.value.trim().toLowerCase(), shown=0;
    if(!v){
      blks.forEach(function(b){b.hidden=false});
      navs.forEach(function(a){a.hidden=false});
      hits.textContent=''; empty.hidden=true; return;
    }
    var ok={};
    blks.forEach(function(b){
      var m=(b.dataset.s||'').indexOf(v)>-1;
      b.hidden=!m; if(m){shown++; ok['#'+b.id.replace(/^blk-/,'')]=1;}
    });
    navs.forEach(function(a){ a.hidden=!ok[a.getAttribute('href')]; });
    hits.textContent=shown?shown+'개 항목':'';
    empty.hidden=shown>0;
  }
  q.addEventListener('input',filter);
  q.addEventListener('keydown',function(e){ if(e.key==='Escape'){q.value='';filter();q.blur();} });
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&document.activeElement!==q){e.preventDefault();openSearch();}
  });

  // scrollspy
  var ids=navs.map(function(a){return a.getAttribute('href').slice(1)});
  function spy(){
    var best=null, bt=-1e9;
    ids.forEach(function(id){
      var el=document.getElementById(id); if(!el||el.offsetParent===null)return;
      var t=el.getBoundingClientRect().top-90;
      if(t<=0&&t>bt){bt=t;best=id;}
    });
    navs.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+best)});
  }
  var tick=false;
  window.addEventListener('scroll',function(){ if(tick)return; tick=true;
    requestAnimationFrame(function(){spy();tick=false;}); },{passive:true});
  spy();

  // collapsible TOC (parts → sections → Q items)
  var navEl=document.getElementById('nav');
  var groups=[]; (function(){ var p=null,s=null;
    navs.forEach(function(a){
      if(a.classList.contains('nav0')){ p={el:a,kids:[],subs:[]}; groups.push(p); s=null; }
      else if(a.classList.contains('nav1')){ if(p){p.kids.push(a);} s={el:a,kids:[]}; if(p)p.subs.push(s); a._parent=p; }
      else if(a.classList.contains('nav2')){ if(s){s.kids.push(a); a._sec=s;} if(p)a._parent=p; }
    });
  })();
  var openSet={}; try{ openSet=JSON.parse(localStorage.getItem(K.nav)||'{}')||{}; }catch(e){}
  function saveOpen(){ try{localStorage.setItem(K.nav,JSON.stringify(openSet))}catch(e){} }
  function applyCollapse(){
    groups.forEach(function(g){
      var gOpen=!!openSet[g.el.getAttribute('href')];
      g.el.classList.toggle('open',gOpen);
      g.subs.forEach(function(s){
        s.el.classList.toggle('cz',!gOpen);
        var sOpen=!!openSet[s.el.getAttribute('href')];
        s.el.classList.toggle('open',sOpen);
        s.kids.forEach(function(k){ k.classList.toggle('cz',!(gOpen&&sOpen)); });
      });
    });
  }
  groups.forEach(function(g){ g.el.classList.add('tg');
    g.subs.forEach(function(s){ if(s.kids.length) s.el.classList.add('tg'); }); });
  navs.forEach(function(a){
    a.addEventListener('click',function(e){
      if(!a.classList.contains('tg') || navEl.classList.contains('filtering')) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var h=a.getAttribute('href'); if(openSet[h]) delete openSet[h]; else openSet[h]=1;
      saveOpen(); applyCollapse();
    });
  });
  function revealCurrent(id){
    var a=navs.filter(function(x){return x.getAttribute('href')==='#'+id})[0]; if(!a)return;
    var g=a.classList.contains('nav0')?null:a._parent; if(g) openSet[g.el.getAttribute('href')]=1;
    if(a._sec) openSet[a._sec.el.getAttribute('href')]=1;
    applyCollapse();
  }
  applyCollapse();
  q.addEventListener('input',function(){ navEl.classList.toggle('filtering', !!q.value.trim()); });

  // remember reading position
  var POS=K.pos, topH=function(){ return (document.getElementById('topbar')||{offsetHeight:60}).offsetHeight+8; };
  function curBlock(){
    var best=null, lim=topH();
    for(var i=0;i<blks.length;i++){ var b=blks[i]; if(b.hidden)continue; var r=b.getBoundingClientRect(); if(r.top<=lim) best={b:b,top:r.top}; else break; }
    return best;
  }
  var saveT=null;
  function savePos(){ if(q.value.trim())return; var c=curBlock(); if(!c)return;
    try{ localStorage.setItem(POS, JSON.stringify({id:c.b.id, off:c.top, y:window.scrollY})); }catch(e){} }
  window.addEventListener('scroll',function(){ clearTimeout(saveT); saveT=setTimeout(savePos,250); },{passive:true});
  window.addEventListener('pagehide',savePos);
  document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='hidden') savePos(); });
  function restorePos(){
    if(location.hash) return;
    var s=null; try{ s=JSON.parse(localStorage.getItem(POS)||'null'); }catch(e){}
    if(!s) return; var el=document.getElementById(s.id);
    if(!el){ window.scrollTo(0,s.y||0); return; }
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - (s.off||0));
    var idm=s.id.replace(/^blk-/,''); revealCurrent(idm);
  }
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  restorePos();
  var touched=false; ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){ window.addEventListener(ev,function(){touched=true;},{passive:true,once:true}); });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){ if(!touched) restorePos(); });

  // search (icon → expands)
  var tbar=document.getElementById('topbar'), sbox=document.getElementById('searchBox'),
      sbtn=document.getElementById('searchBtn');
  function openSearch(){ sbox.hidden=false; tbar.classList.add('searching'); q.focus(); }
  function closeSearch(){ q.value=''; filter(); sbox.hidden=true; tbar.classList.remove('searching'); sbtn.focus(); }
  sbtn.addEventListener('click',openSearch);
  document.getElementById('searchClose').addEventListener('click',closeSearch);
  q.addEventListener('blur',function(){ setTimeout(function(){ if(!q.value.trim() && document.activeElement!==q && !sbox.contains(document.activeElement)){ sbox.hidden=true; tbar.classList.remove('searching'); } },150); });

  var panel=document.getElementById('setPanel'), setBtn=document.getElementById('setBtn');
  // bookmarks
  var BMK=K.bm, bmBtn=document.getElementById('bmBtn'), bmPanel=document.getElementById('bmPanel'),
      bmList=document.getElementById('bmList'), bmEmpty=document.getElementById('bmEmpty'), bmCount=document.getElementById('bmCount');
  var bms=[]; try{ bms=JSON.parse(localStorage.getItem(BMK)||'[]')||[]; }catch(e){}
  var heads=[].slice.call(document.querySelectorAll('#content h3.sec, #content h4.sub'));
  function keyOf(h){ return h.dataset.title; }
  function partOf(h){ var p=h.closest('.blk'); while(p&&(p=p.previousElementSibling)){ var x=p.querySelector('h3.sec'); if(x) return x.dataset.title; } return ''; }
  function findHead(key){
    var h=heads.filter(function(x){return keyOf(x)===key})[0]; if(h) return h;
    var m=key.match(/^Q\d+\./); if(m) return heads.filter(function(x){return keyOf(x).indexOf(m[0])===0})[0]||null;
    return null;
  }
  var cloudSaveBm=null;
  function saveBm(){ try{localStorage.setItem(BMK,JSON.stringify(bms))}catch(e){} if(cloudSaveBm) cloudSaveBm(bms); }
  function isOn(key){ return bms.some(function(b){return b.k===key}); }
  function renderBm(){
    heads.forEach(function(h){ var on=isOn(keyOf(h)); h._bm.classList.toggle('on',on); h._bm.textContent=on?'★':'☆';
      h._bm.setAttribute('aria-pressed',String(on)); h._bm.setAttribute('aria-label',(on?'북마크 해제: ':'북마크: ')+keyOf(h)); });
    bmList.innerHTML='';
    bms.forEach(function(b,i){
      var li=document.createElement('li'), a=document.createElement('a'), d=document.createElement('button');
      a.href='#'; a.textContent=b.k;
      if(b.p){ var w=document.createElement('span'); w.className='bm-where'; w.textContent=b.p; a.appendChild(w); }
      a.addEventListener('click',function(e){ e.preventDefault(); gotoBm(b.k); });
      d.className='bm-del'; d.type='button'; d.textContent='✕'; d.setAttribute('aria-label','북마크 삭제: '+b.k);
      d.addEventListener('click',function(e){ e.stopPropagation(); bms.splice(i,1); saveBm(); renderBm(); });
      li.appendChild(a); li.appendChild(d); bmList.appendChild(li);
    });
    bmEmpty.hidden=bms.length>0; bmCount.hidden=!bms.length; bmCount.textContent=bms.length;
  }
  function toggleBm(open){ bmPanel.hidden=!open; bmBtn.setAttribute('aria-expanded',String(open));
    if(open){ panel.hidden=true; setBtn.setAttribute('aria-expanded','false'); } }
  function gotoBm(key){
    var h=findHead(key); toggleBm(false); if(!h) return;
    if(q.value.trim()){ q.value=''; filter(); navEl.classList.remove('filtering'); }
    var top=h.getBoundingClientRect().top+window.scrollY-topH()-6;
    window.scrollTo({top:top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    revealCurrent(h.id); var b=h.closest('.blk'); b.classList.remove('bm-flash'); void b.offsetWidth; b.classList.add('bm-flash');
  }
  heads.forEach(function(h){
    h.dataset.title=h.textContent.trim();
    var btn=document.createElement('button'); btn.type='button'; btn.className='bmk'; h._bm=btn; h.appendChild(btn);
    btn.addEventListener('click',function(e){ e.preventDefault(); var k=keyOf(h);
      if(isOn(k)) bms=bms.filter(function(b){return b.k!==k}); else bms.unshift({k:k,p:h.tagName==='H4'?partOf(h):'',t:Date.now()});
      saveBm(); renderBm(); });
  });
  bmBtn.addEventListener('click',function(e){ e.stopPropagation(); toggleBm(bmPanel.hidden); });
  document.addEventListener('click',function(e){ if(!bmPanel.hidden && !bmPanel.contains(e.target) && !bmBtn.contains(e.target)) toggleBm(false); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && !bmPanel.hidden){ toggleBm(false); bmBtn.focus(); } });
  window.CDBM={ get:function(){return bms},
    set:function(v){ bms=Array.isArray(v)?v:[]; try{localStorage.setItem(BMK,JSON.stringify(bms))}catch(e){} renderBm(); },
    setCloud:function(fn){cloudSaveBm=fn},
    status:function(txt,on){ var s=document.getElementById('bmSync'); s.textContent=txt; s.className='bm-sync'+(on?' on':''); } };
  renderBm();

  // mobile drawer
  var R=document.documentElement, mobile=window.matchMedia('(max-width:860px)');
  function close(){side.classList.remove('open');scrim.classList.remove('on');}
  document.getElementById('menuBtn').addEventListener('click',function(){
    if(!mobile.matches && R.classList.contains('sb-collapsed')){ setSidebar(false); return; }
    side.classList.toggle('open'); scrim.classList.toggle('on');
  });

  // desktop sidebar — 오른쪽 경계선이 손잡이: 클릭 → 숨기기, 드래그 → 너비 조절 (코딩Dojo 방식). Ctrl+B 로 토글.
  function lsSet(k,v){ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,v); }catch(e){} }
  function setSidebar(collapsed){ R.classList.toggle('sb-collapsed',collapsed); lsSet('cd-sb',collapsed?'collapsed':null); }
  var sbW=parseInt(getComputedStyle(R).getPropertyValue('--sb-w'))||274;
  function applyW(){ R.style.setProperty('--sb-w',sbW+'px'); }
  var handle=document.getElementById('sbHandle'), tip=document.getElementById('sbTip');
  if(handle&&tip){
    var placeTip=function(y){ tip.style.left=(sbW+12)+'px'; tip.style.top=Math.max(8,y-18)+'px'; };
    handle.addEventListener('mouseenter',function(e){ placeTip(e.clientY); tip.classList.add('show'); });
    handle.addEventListener('mousemove',function(e){ if(!R.classList.contains('sb-resizing')) placeTip(e.clientY); });
    handle.addEventListener('mouseleave',function(){ tip.classList.remove('show'); });
    handle.addEventListener('pointerdown',function(e){
      if(e.button!==0) return; e.preventDefault(); handle.setPointerCapture(e.pointerId);
      var startX=e.clientX, startW=sbW, moved=false;
      function move(ev){
        if(!moved && Math.abs(ev.clientX-startX)>3){ moved=true; R.classList.add('sb-resizing'); tip.classList.remove('show'); }
        if(moved){ sbW=Math.max(220,Math.min(480,startW+ev.clientX-startX)); applyW(); }
      }
      function up(){
        handle.removeEventListener('pointermove',move); handle.removeEventListener('pointerup',up); handle.removeEventListener('pointercancel',up);
        R.classList.remove('sb-resizing');
        if(moved) lsSet('cd-sbw',String(sbW)); else { tip.classList.remove('show'); setSidebar(true); }
      }
      handle.addEventListener('pointermove',move); handle.addEventListener('pointerup',up); handle.addEventListener('pointercancel',up);
    });
    handle.addEventListener('dblclick',function(){ sbW=274; applyW(); lsSet('cd-sbw',null); });
  }
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey) && !e.shiftKey && !e.altKey && (e.key==='b'||e.key==='B')){
      e.preventDefault();
      if(mobile.matches){ side.classList.toggle('open'); scrim.classList.toggle('on'); }
      else setSidebar(!R.classList.contains('sb-collapsed'));
    }
  });
  scrim.addEventListener('click',close);
  navs.forEach(function(a){a.addEventListener('click',close)});
})();
