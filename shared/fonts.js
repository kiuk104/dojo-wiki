/* Dojo Wiki — 글꼴 시스템 (bible_viewer 와 같은 출처: Google Fonts · 눈누 · 네이버 · KoPub)
   고른 글꼴만 그때 불러온다. 저장 키: cd-fdisp(제목) · cd-fbody(본문). core.js 보다 먼저 로드. */
(function(){
  var NOON='https://cdn.jsdelivr.net/gh/projectnoonnu/', NSQ='https://hangeul.pstatic.net/hangeul_static/webfont/NanumSquare/', KPW='https://cdn.jsdelivr.net/npm/font-kopubworld@1.0.3/fonts/';
  function face(fam,url,fmt,w){ return "@font-face{font-family:'"+fam+"';"+(w?'font-weight:'+w+';':'')+"src:url('"+url+"') format('"+fmt+"');font-display:swap}"; }
  // 키: [이름, 부제, CSS font-family, Google Fonts 쿼리, @font-face CSS]
  var DISP={
    noto:  ['본명조','기본 · 바탕',"'Noto Serif KR','Apple SD Gothic Neo',serif",null,null],
    ridi:  ['리디바탕','명조',"'RIDIBatang','Noto Serif KR',serif",null,face('RIDIBatang',NOON+'noonfonts_twelve@1.0/RIDIBatang.woff','woff')],
    nanumm:['나눔명조','',"'Nanum Myeongjo','Noto Serif KR',serif",'Nanum+Myeongjo:wght@400;700',null],
    kpb:   ['KoPub 바탕','',"'KoPubWorld Batang','Noto Serif KR',serif",null,face('KoPubWorld Batang',KPW+'KoPubWorld-Batang-Medium.woff2','woff2')+face('KoPubWorld Batang',KPW+'KoPubWorld-Batang-Bold.woff2','woff2',700)],
    gowunb:['고운바탕','예전 기본',"'Gowun Batang','Noto Serif KR',serif",'Gowun+Batang:wght@400;700',null],
    // 고딕 계열
    notosans:['본고딕','고딕',"'Noto Sans KR',system-ui,sans-serif",'Noto+Sans+KR:wght@500;700',null],
    nanumg:  ['나눔고딕','고딕',"'Nanum Gothic','Noto Sans KR',sans-serif",'Nanum+Gothic:wght@700;800',null],
    nsqb:    ['나눔스퀘어','고딕 · Bold',"'NanumSquareB','NanumSquare','Noto Sans KR',sans-serif",null,face('NanumSquareB',NSQ+'NanumSquareB.woff','woff')+face('NanumSquareB',NSQ+'NanumSquareEB.woff','woff',700)],
    kpd:     ['KoPub 돋움','고딕',"'KoPubWorld Dotum','Noto Sans KR',sans-serif",null,face('KoPubWorld Dotum',KPW+'KoPubWorld-Dotum-Medium.woff2','woff2')+face('KoPubWorld Dotum',KPW+'KoPubWorld-Dotum-Bold.woff2','woff2',700)],
    scb:     ['에스코어드림','고딕 · Bold',"'SCDreamBold','Noto Sans KR',sans-serif",null,face('SCDreamBold',NOON+'noonfonts_six@1.2/S-CoreDream-6Bold.woff','woff')],
    gowund:  ['고운돋움','고딕',"'Gowun Dodum','Noto Sans KR',sans-serif",'Gowun+Dodum',null],
    plex:    ['IBM Plex Sans','고딕 · 본문과 통일',"'IBM Plex Sans KR',system-ui,sans-serif",'IBM+Plex+Sans+KR:wght@600;700',null],
    sys:     ['기기 기본','',"system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif",null,null]
  };
  var BODY={
    plex:    ['IBM Plex Sans','기본',"'IBM Plex Sans KR',system-ui,-apple-system,'Segoe UI','Malgun Gothic',sans-serif",null,null],
    notosans:['본고딕','',"'Noto Sans KR',system-ui,sans-serif",'Noto+Sans+KR:wght@400;500;600',null],
    nanumg:  ['나눔고딕','',"'Nanum Gothic','Noto Sans KR',sans-serif",'Nanum+Gothic:wght@400;700',null],
    nsq:     ['나눔스퀘어','',"'NanumSquare','Noto Sans KR',sans-serif",null,face('NanumSquare',NSQ+'NanumSquareR.woff','woff')],
    kpd:     ['KoPub 돋움','',"'KoPubWorld Dotum','Noto Sans KR',sans-serif",null,face('KoPubWorld Dotum',KPW+'KoPubWorld-Dotum-Medium.woff2','woff2')+face('KoPubWorld Dotum',KPW+'KoPubWorld-Dotum-Bold.woff2','woff2',700)],
    scl:     ['에스코어드림','Light',"'SCDreamLight','Noto Sans KR',sans-serif",null,face('SCDreamLight',NOON+'noonfonts_six@1.2/S-CoreDream-3Light.woff','woff')],
    gowund:  ['고운돋움','',"'Gowun Dodum','Noto Sans KR',sans-serif",'Gowun+Dodum',null],
    noto:    ['본명조','본문도 바탕으로',"'Noto Serif KR','Apple SD Gothic Neo',serif",null,null],
    sys:     ['기기 기본','',"system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif",null,null]
  };
  function get(k){ try{return localStorage.getItem(k)}catch(e){return null} }
  function loadFont(q){ if(!q) return; var id='gf-'+q.replace(/\W/g,''); if(document.getElementById(id)) return;
    var l=document.createElement('link'); l.id=id; l.rel='stylesheet'; l.href='https://fonts.googleapis.com/css2?family='+q+'&display=swap'; document.head.appendChild(l); }
  function loadFace(css){ if(!css) return; var id='ff-'+css.match(/font-family:'([^']+)'/)[1].replace(/\W/g,''); if(document.getElementById(id)) return;
    var st=document.createElement('style'); st.id=st.id||id; st.textContent=css; document.head.appendChild(st); }
  function load(f){ loadFont(f[3]); loadFace(f[4]); }
  function apply(){
    var R=document.documentElement, d=DISP[get('cd-fdisp')]||DISP.noto, b=BODY[get('cd-fbody')]||BODY.plex;
    load(d); load(b);
    if(d===DISP.noto) R.style.removeProperty('--f-disp'); else R.style.setProperty('--f-disp',d[2]);
    if(b===BODY.plex) R.style.removeProperty('--f-body'); else R.style.setProperty('--f-body',b[2]);
  }
  window.FS_FONTS={DISP:DISP,BODY:BODY,apply:apply,load:load};
  apply();
})();
