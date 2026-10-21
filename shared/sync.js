// Dojo Wiki — 구글 로그인 + 북마크 클라우드 동기화 (Firebase 프로젝트: reddesert-checklist)
// 한 번 로그인하면 같은 사이트의 모든 게임 페이지·체크리스트가 같은 계정을 쓴다.
const cfg={apiKey:"AIzaSyBMFO-kqcx3vgd1LvMP9ly_0kPmsAIvvZo",authDomain:"reddesert-checklist.firebaseapp.com",projectId:"reddesert-checklist",storageBucket:"reddesert-checklist.firebasestorage.app",messagingSenderId:"853446207690",appId:"1:853446207690:web:8ac77b10c7fee19201ec33"};
const $=id=>document.getElementById(id);
const acctBtn=$("acctBtn"), acctInfo=$("acctInfo");
const G=window.FSG||{};
const FIELD=G.cloudField||("bm_"+String(G.id||"").replace(/-/g,"_"));
const BM=window.CDBM||null;
try{
  const V="10.12.2";
  const {initializeApp}=await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const A=await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  const F=await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  const app=initializeApp(cfg), auth=A.getAuth(app), db=F.getFirestore(app);
  const provider=new A.GoogleAuthProvider();
  A.getRedirectResult(auth).catch(()=>{});
  let signedIn=false;
  if(acctBtn){
    acctBtn.hidden=false;
    acctBtn.addEventListener("click",async()=>{
      if(signedIn){ A.signOut(auth); return; }
      try{ await A.signInWithPopup(auth,provider); }
      catch(e){
        if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment","auth/cancelled-popup-request"].includes(e.code)) A.signInWithRedirect(auth,provider);
        else if(e.code!=="auth/popup-closed-by-user" && acctInfo) acctInfo.textContent="로그인 실패";
      }
    });
  }
  let unsub=null, timer=null, chain=Promise.resolve();
  A.onAuthStateChanged(auth, async user=>{
    signedIn=!!user;
    if(acctBtn) acctBtn.textContent=user?"로그아웃":"구글로 로그인";
    if(acctInfo) acctInfo.textContent=user?(user.displayName||user.email||"로그인됨"):"로그인하면 북마크·체크리스트가 기기 사이에 동기화돼요";
    if(!BM) return;
    if(unsub){unsub();unsub=null;} BM.setCloud(null);
    if(!user){ BM.status("이 기기에 저장 · 설정에서 로그인하면 동기화"); return; }
    const ref=F.doc(db,"checklists",user.uid);
    const put=list=>F.setDoc(ref,{[FIELD]:list,bmUpdatedAt:F.serverTimestamp()},{mergeFields:[FIELD,"bmUpdatedAt"]});
    try{
      const snap=await F.getDoc(ref);
      const cloud=snap.exists()?snap.data()[FIELD]:undefined;
      if(Array.isArray(cloud)){
        const local=BM.get(), keys=new Set(cloud.map(b=>b.k)), extra=local.filter(b=>!keys.has(b.k));
        const merged=cloud.concat(extra); BM.set(merged);
        if(extra.length) await put(merged);
      } else await put(BM.get());
    }catch(e){ BM.status("동기화 실패 · 이 기기에 저장"); return; }
    BM.setCloud(list=>{ clearTimeout(timer); timer=setTimeout(()=>{ const l=list.slice();
      chain=chain.then(()=>put(l)).then(()=>BM.status("☁ 동기화됨",true)).catch(()=>BM.status("저장 실패")); },300); });
    unsub=F.onSnapshot(ref,s=>{ if(s.metadata.hasPendingWrites) return; const b=s.exists()?s.data()[FIELD]:undefined; if(Array.isArray(b)) BM.set(b); BM.status("☁ 동기화됨",true); },()=>BM.status("동기화 끊김"));
  });
}catch(e){ /* 오프라인 등: 이 기기 저장만 사용 */ if(acctInfo) acctInfo.textContent="오프라인 — 이 기기에만 저장"; }
