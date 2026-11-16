(function(){
  var KEYS = ['spring','summer','autumn','winter'];
  var BODY_BG = ['#c4426f','#1673c9','#b44f1c','#145640'];
  var COPY = [
    {name:'봄',   say:'벚꽃 보러 같이 갈래?',     desc:'분홍 보닛에 벚꽃 두 송이. 노란 가디건을 걸치고 꽃길을 걷습니다.'},
    {name:'여름', say:'수박바는 양보 못 해.',      desc:'밀짚 보닛에 선글라스, 꽃무늬 셔츠. 한 손에는 늘 수박바가 있어요.'},
    {name:'가을', say:'커피 한 잔 들고 좀 걷자.',  desc:'머스터드 보닛에 트렌치코트. 낙엽 밟는 소리를 좋아합니다.'},
    {name:'겨울', say:'네 선물도 준비했어.',       desc:'털 달린 빨간 보닛에 목도리와 털부츠. 크리스마스를 제일 기다려요.'}
  ];
  /* 첫 장면, 계절별 슬롯 6개: [x%, y%, 크기(vmin), 회전(deg), 블러(px)] */
  var LAYOUT = [
    [[10,24,16,-15,0],[26,72,11,20,0],[60,17,9,10,0],[86,15,22,25,6],[6,80,25,-30,8],[70,84,12,-10,0]],
    [[14,68,18,10,0],[82,13,21,-20,6],[29,19,8,0,0],[63,82,9,15,0],[5,20,24,0,8],[25,86,11,30,0]],
    [[9,62,17,25,0],[61,14,12,-25,0],[87,80,23,15,7],[24,18,11,-10,0],[72,87,10,0,0],[4,12,23,20,8]],
    [[26,16,12,0,0],[8,76,23,20,8],[85,17,21,0,6],[61,85,9,0,0],[12,36,13,0,0],[74,11,10,-15,0]]
  ];
  /* 나머지 장면: 슬롯 번호 → 위치. 없는 슬롯은 화면 밖으로 날아감 */
  var SCENE_SLOTS = [
    null,
    {0:[7,18,12,-15,0], 3:[47,86,8,20,0], 4:[94,84,15,25,6]},   // 소개: 3개
    {1:[95,22,13,15,6], 4:[4,88,16,-20,8]},                      // 굿즈: 2개
    {2:[96,90,12,10,6], 5:[3,16,14,-25,8]},                      // 갤러리: 2개
    {0:[95,20,12,20,6], 3:[5,86,15,-15,8]}                       // 이야기: 2개
  ];

  var hero = document.getElementById('hero');
  var slotsEl = document.getElementById('slots');
  var bgs = hero.querySelectorAll('.bg');
  var momo = document.getElementById('momo');
  var momos = momo.querySelectorAll('#hop img');
  var tabs = hero.querySelectorAll('.dot');
  var copy = document.getElementById('copy');
  var hop = document.getElementById('hop');
  var scenes = hero.querySelectorAll('.scene');
  var menuLinks = hero.querySelectorAll('[data-scene-go]');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, scene = 0, slots = [];

  for (var i = 0; i < 6; i++){
    var slot = document.createElement('div'); slot.className = 'slot';
    var par = document.createElement('div'); par.className = 'par';
    var bob = document.createElement('div'); bob.className = 'bob';
    bob.style.setProperty('--d', (5 + i*0.9) + 's');
    bob.style.setProperty('--dl', (-i*1.3) + 's');
    var imgs = KEYS.map(function(k){
      var im = new Image(); im.src = 'img/' + k + '/' + k + '-' + i + '.png'; im.alt = ''; im.draggable = false;
      bob.appendChild(im); return im;
    });
    par.appendChild(bob); slot.appendChild(par); slotsEl.appendChild(slot);
    slots.push({slot:slot, par:par, bob:bob, imgs:imgs, depth:1, x:50});
  }

  function setText(n){
    document.getElementById('cName').textContent = COPY[n].name;
    document.getElementById('cSay').textContent = COPY[n].say;
    document.getElementById('cDesc').textContent = COPY[n].desc;
  }

  /* 현재 장면 + 계절에 맞춰 오브제 배치 */
  function layout(){
    var map = SCENE_SLOTS[scene];
    slots.forEach(function(s, i){
      var L = map ? map[i] : LAYOUT[cur][i];
      if (!L) L = [s.x < 50 ? -20 : 120, LAYOUT[cur][i][1], LAYOUT[cur][i][2], LAYOUT[cur][i][3] + 90, 0];  // 화면 밖으로
      else s.x = L[0];
      s.slot.style.left = L[0] + '%';
      s.slot.style.top = L[1] + '%';
      s.slot.style.transform = 'rotate(calc(' + L[3] + 'deg + var(--spin))) scale(var(--pump))';
      s.slot.style.filter = L[4] ? 'blur(' + L[4] + 'px)' : 'none';
      s.slot.classList.toggle('front', L[4] > 0);
      s.bob.style.setProperty('--s', L[2] + 'vmin');
      s.depth = L[2] / 10;
    });
  }

  function apply(n){
    cur = n;
    hero.dataset.season = KEYS[n];
    document.body.style.background = BODY_BG[n];
    bgs.forEach(function(b, i){ b.classList.toggle('on', i === n); });
    tabs.forEach(function(t, i){ t.setAttribute('aria-pressed', String(i === n)); });
    slots.forEach(function(s){
      s.imgs.forEach(function(im, k){
        im.classList.toggle('out', im.classList.contains('on') && k !== n);
        im.classList.toggle('on', k === n);
      });
    });
    layout();
  }

  /* ── 계절 전환 (첫 장면) ── */
  var busy = false;
  function show(n, dir){
    n = (n + 4) % 4;
    if (busy || moving || n === cur) return;
    var old = momos[cur], nw = momos[n];
    if (reduce){ old.classList.remove('on'); nw.classList.add('on'); apply(n); setText(n); return; }
    busy = true;
    hero.style.setProperty('--dir', dir);
    hero.classList.add('pump');
    copy.classList.add('out');
    setTimeout(function(){
      hero.classList.remove('pump');
      old.classList.remove('on'); old.classList.add('leave');
      nw.classList.add('on', 'enter');
      apply(n); setText(n); copy.classList.remove('out');
      setTimeout(function(){ old.classList.remove('leave'); nw.classList.remove('enter'); busy = false; }, 820);
    }, 540);
  }

  /* ── 장면 전환: 화면은 그대로, 내용만 바뀜 ── */
  var moving = false;
  function go(to, instant){
    if (moving || busy || to === scene || to < 0 || to >= scenes.length) return;
    var fast = reduce || instant;
    var from = scene, dir = to > from ? 1 : -1;
    var momoFrom = from <= 1, momoTo = to <= 1;   // 모모는 첫 장면과 소개에만 있음
    moving = true;
    hero.style.setProperty('--sd', dir);
    scenes[from].classList.remove('on');
    if (!fast){ hero.classList.add('pump'); if (momoFrom) momo.classList.add('fly'); }
    setTimeout(function(){
      hero.classList.remove('pump');
      scene = to;
      hero.dataset.scene = to;
      scenes[to].classList.add('on');
      scenes[to].scrollTop = 0;
      menuLinks.forEach(function(a){ a.setAttribute('aria-current', String(+a.dataset.sceneGo === to)); });
      layout();
      if (fast){ momo.classList.toggle('fly', !momoTo); moving = false; return; }
      if (momoTo){
        momo.classList.add('fly'); void momo.offsetWidth;            // 새 자리 위쪽 화면 밖에서
        momo.classList.add('land'); momo.classList.remove('fly');    // 아래로 떨어져 정착
      }
      setTimeout(function(){ momo.classList.remove('land'); moving = false; }, 900);
    }, fast ? 0 : 480);
  }

  /* 장면 안 내용(또는 인스타 피드처럼 안쪽 스크롤 영역)이 남아 있으면 먼저 그 안에서 스크롤 */
  function canScroll(el, down){
    return el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY) &&
      (down ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0);
  }
  function innerScroll(t, down){
    for (; t && t !== hero; t = t.parentElement) if (t.nodeType === 1 && canScroll(t, down)) return true;
    return false;
  }

  /* 휠: 두 칸 정도 굴리면 다음/이전 장면 */
  var acc = 0, accT, cool = 0;
  addEventListener('wheel', function(e){
    var down = e.deltaY > 0;
    if (innerScroll(e.target, down)) return;
    e.preventDefault();
    if (moving || busy || Date.now() < cool) return;
    acc += e.deltaY * (e.deltaMode === 1 ? 40 : 1);   // 파이어폭스는 줄 단위
    clearTimeout(accT); accT = setTimeout(function(){ acc = 0; }, 300);
    if (Math.abs(acc) < 150) return;                  // 마우스 휠 약 2칸
    acc = 0; cool = Date.now() + 1500;                // 트랙패드 관성으로 두 장면 넘어가는 것 방지
    go(scene + (down ? 1 : -1));
  }, {passive:false});

  addEventListener('keydown', function(e){
    var k = e.key;
    if (scene === 0 && k === 'ArrowLeft') return show(cur - 1, -1);
    if (scene === 0 && k === 'ArrowRight') return show(cur + 1, 1);
    var down = k === 'ArrowDown' || k === 'PageDown', up = k === 'ArrowUp' || k === 'PageUp';
    if (!down && !up) return;
    if (canScroll(scenes[scene], down)) return;
    e.preventDefault(); go(scene + (down ? 1 : -1));
  });

  /* 터치: 가로 = 계절(첫 장면), 세로 = 장면 */
  var sx = null, sy = 0, edgeDown = false, edgeUp = false;
  hero.addEventListener('touchstart', function(e){
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    edgeDown = !innerScroll(e.target, true); edgeUp = !innerScroll(e.target, false);
  }, {passive:true});
  hero.addEventListener('touchend', function(e){
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > Math.abs(dy)){
      if (scene === 0 && Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    } else if (dy < -60 && edgeDown) go(scene + 1);
    else if (dy > 60 && edgeUp) go(scene - 1);
  });

  document.getElementById('prev').addEventListener('click', function(){ show(cur - 1, -1); });
  document.getElementById('next').addEventListener('click', function(){ show(cur + 1, 1); });
  tabs.forEach(function(t){ t.addEventListener('click', function(){ var n = +t.dataset.go; show(n, n > cur ? 1 : -1); }); });

  /* 모모 누르면 폴짝 */
  document.getElementById('hit').addEventListener('click', function(){
    hop.classList.remove('hop'); void hop.offsetWidth; hop.classList.add('hop');
  });

  /* 마우스 패럴랙스 */
  if (!reduce){
    hero.addEventListener('pointermove', function(e){
      if (e.pointerType === 'touch') return;
      var dx = e.clientX / innerWidth - .5, dy = e.clientY / innerHeight - .5;
      slots.forEach(function(s){
        s.par.style.transform = 'translate(' + (-dx*26*s.depth) + 'px,' + (-dy*20*s.depth) + 'px)';
      });
    });
  }

  /* 메뉴 → 장면 */
  menuLinks.forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); go(+a.dataset.sceneGo); });
  });
  /* 갤러리 계절 사진 → 첫 장면으로 가서 그 계절로 */
  document.querySelectorAll('[data-season-go]').forEach(function(b){
    b.addEventListener('click', function(){
      var n = +b.dataset.seasonGo;
      go(0);
      setTimeout(function(){ show(n, n > cur ? 1 : -1); }, reduce ? 0 : 1450);
    });
  });

  apply(0); setText(0);
  /* 주소에 #about 등이 있으면 그 장면으로 바로 */
  var start = [].indexOf.call(scenes, document.getElementById(location.hash.slice(1)));
  if (start > 0) go(start, true);
})();
