(function(){
  /* 0 = 기본 모모(빨간 털모자), 1~4 = 계절 */
  var KEYS = ['base','spring','summer','autumn','winter'];
  var BODY_BG = ['#a3232b','#c4426f','#1673c9','#b44f1c','#145640'];
  var COPY = [
    {name:'모모', say:'안녕, 나는 모모야.',        desc:'양쪽 화살표를 누르면 계절 모모를 볼 수 있어.'},
    {name:'봄',   say:'벚꽃 보러 같이 갈래?',     desc:'분홍 보닛에 벚꽃 두 송이. 노란 가디건을 걸치고 꽃길을 걷습니다.'},
    {name:'여름', say:'수박바는 양보 못 해.',      desc:'밀짚 보닛에 선글라스, 꽃무늬 셔츠. 한 손에는 늘 수박바가 있어요.'},
    {name:'가을', say:'커피 한 잔 들고 좀 걷자.',  desc:'머스터드 보닛에 트렌치코트. 낙엽 밟는 소리를 좋아합니다.'},
    {name:'겨울', say:'네 선물도 준비했어.',       desc:'털 달린 빨간 보닛에 목도리와 털부츠. 크리스마스를 제일 기다려요.'}
  ];
  /* 첫 장면, 계절별 슬롯 6개: [x%, y%, 크기(vmin), 회전(deg), 블러(px)] */
  var LAYOUT = [
    [[11,22,15,-15,0],[27,75,11,20,0],[62,15,9,10,0],[87,20,20,25,6],[6,78,23,-30,8],[72,85,12,-10,0]],
    [[10,24,16,-15,0],[26,72,11,20,0],[60,17,9,10,0],[86,15,22,25,6],[6,80,25,-30,8],[70,84,12,-10,0]],
    [[14,68,18,10,0],[82,13,21,-20,6],[29,19,8,0,0],[63,82,9,15,0],[5,20,24,0,8],[25,86,11,30,0]],
    [[9,62,17,25,0],[61,14,12,-25,0],[87,80,23,15,7],[24,18,11,-10,0],[72,87,10,0,0],[4,12,23,20,8]],
    [[26,16,12,0,0],[8,76,23,20,8],[85,17,21,0,6],[61,85,9,0,0],[12,36,13,0,0],[74,11,10,-15,0]]
  ];
  /* 나머지 장면: 슬롯 번호 → 위치. 없는 슬롯은 화면 밖으로 날아감 */
  var SCENE_SLOTS = [
    null,
    {0:[7,18,12,-15,0], 3:[47,86,8,20,0], 4:[94,84,15,25,6]},   // 소개: 3개
    {1:[95,22,13,15,6], 4:[4,88,16,-20,8]}                       // 굿즈: 2개
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

  /* 기본 모모 주변 소품: 네 계절에서 하나씩 */
  var BASE_OBJ = ['spring/spring-0','summer/summer-0','autumn/autumn-0','winter/winter-4','spring/spring-1','autumn/autumn-1'];
  for (var i = 0; i < 6; i++){
    var slot = document.createElement('div'); slot.className = 'slot';
    var par = document.createElement('div'); par.className = 'par';
    var bob = document.createElement('div'); bob.className = 'bob';
    bob.style.setProperty('--d', (5 + i*0.9) + 's');
    bob.style.setProperty('--dl', (-i*1.3) + 's');
    var imgs = KEYS.map(function(k){
      var im = new Image(); im.src = 'img/' + (k === 'base' ? BASE_OBJ[i] : k + '/' + k + '-' + i) + '.png'; im.alt = ''; im.draggable = false;
      bob.appendChild(im); return im;
    });
    par.appendChild(bob); slot.appendChild(par); slotsEl.appendChild(slot);
    slots.push({slot:slot, par:par, bob:bob, imgs:imgs, depth:1, x:50});
  }

  /* 인스타그램 구간 카드 9장: 지금 계절 사진·소품·한마디 */
  var PHOTO = ['', 'Spring cherry blossoms', 'Summer watermelon', 'Autumn coffee', 'Winter gift'];
  var DOING = ['', '꽃잎 모으기', '녹기 전에 먹기', '낙엽 밟기', '선물 포장'];
  var OBJ = [0,[0,2],[0,2],[0,2],[4,2]];
  var seasonBtns = document.querySelectorAll('[data-season-go]');
  var cardsEl = document.getElementById('cards'), cardList = [];
  for (var c = 0; c < 9; c++){
    var el = document.createElement('div');
    el.className = 'card frame' + (c === 8 ? ' big' : '');
    cardsEl.appendChild(el);
    cardList.push({el:el, i:c, dx:0, dy:0, fly:0});
  }
  function fillCards(n){
    var k = KEYS[n], dir = 'img/' + k + '/', name = COPY[n].name;
    function ph(file, cap, src){ return '<img class="ph" src="' + (src || dir + encodeURIComponent(file)) + '" alt="' + name + '의 모모" draggable="false"><span class="cap">' + cap + '</span>'; }
    function obj(j, cap, src){ return '<img class="obj" src="' + (src || dir + k + '-' + j + '.png') + '" alt="" draggable="false"><span class="cap">' + cap + '</span>'; }
    function txt(label, big, sub, cls){ return '<small>' + label + '</small><i class="dia"></i><b' + (cls ? ' class="' + cls + '"' : '') + '>' + big + '</b>' + (sub ? '<span class="sub">' + sub + '</span>' : ''); }
    var html = n === 0 ? [   // 기본 모모: 네 계절을 한 장씩 맛보기
      txt('모모', '사계절', 'FOUR SEASONS'),
      ph('', '봄의 모모', 'img/spring/g-spring.jpg'),
      obj(0, '봄 · 꽃잎 모으기', 'img/spring/spring-0.png'),
      ph('', '여름의 모모', 'img/summer/g-summer.jpg'),
      ph('', '가을의 모모', 'img/autumn/g-autumn.jpg'),
      txt('모모의 한마디', COPY[0].say, '', 'say'),
      obj(0, '겨울 · 선물 포장', 'img/winter/winter-4.png'),
      txt('게시물', '15', '@momo_bearstudio'),
      '<img class="ph cut" src="img/base/momo-base.png" alt="빨간 털모자를 쓴 기본 모모" draggable="false"><span class="cap">@momo_bearstudio</span>'
    ] : [
      txt('계절', name, k.toUpperCase()),
      ph(PHOTO[n] + '.png', name + '의 모모'),
      obj(OBJ[n][0], DOING[n]),
      ph(PHOTO[n] + '2.png', DOING[n]),
      txt('모모의 한마디', COPY[n].say, '', 'say'),
      ph(PHOTO[n] + '3.png', '오늘의 모모'),
      obj(OBJ[n][1], '모모의 소품'),
      txt('게시물', '15', '@momo_bearstudio'),
      ph('g-' + k + '.jpg', '@momo_bearstudio')
    ];
    cardList.forEach(function(c, i){ c.el.innerHTML = html[i]; });
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
    document.body.dataset.season = KEYS[n];
    document.body.style.setProperty('--season', BODY_BG[n]);
    seasonBtns.forEach(function(b){ b.setAttribute('aria-pressed', String(+b.dataset.seasonGo === n)); });
    fillCards(n);
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
    n = (n + KEYS.length) % KEYS.length;
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
    if (moving || busy || to === scene || to < 0 || to > last()) return;
    var fast = reduce || instant;
    var from = scene, dir = to > from ? 1 : -1;
    var momoFrom = from <= 1, momoTo = to <= 1;   // 모모는 첫 장면과 소개에만 있음
    var swap = momoFrom !== momoTo;                // 소개 ↔ 굿즈: 모모는 날아가지 않고 제자리에서 사라지거나 나타남
    hero.classList.toggle('quick', swap);          //    이때는 다음 장면도 기다리지 않고 바로
    moving = true;
    hero.style.setProperty('--sd', dir);
    scenes[from].classList.remove('on');
    if (!fast){
      if (!swap){ hero.classList.add('pump'); momo.classList.add('fly'); }
      else if (momoFrom) momo.classList.add('gone');
    }
    setTimeout(function(){
      hero.classList.remove('pump');
      scene = to;
      hero.dataset.scene = to;
      scenes[to].classList.add('on');
      scenes[to].scrollTop = 0;
      menuLinks.forEach(function(a){ a.setAttribute('aria-current', String(+a.dataset.sceneGo === to)); });
      layout();
      if (fast){ momo.classList.toggle('gone', !momoTo); moving = false; return; }
      if (swap){ momo.classList.toggle('gone', !momoTo); setTimeout(function(){ moving = false; }, 800); return; }
      if (momoTo){
        momo.classList.add('fly'); void momo.offsetWidth;            // 새 자리 위쪽 화면 밖에서
        momo.classList.add('land'); momo.classList.remove('fly');    // 아래로 떨어져 정착
      }
      setTimeout(function(){ momo.classList.remove('land'); moving = false; }, 900);
    }, fast ? 0 : swap ? 420 : 480);   // 소개 ↔ 굿즈: 모모가 사라지는 걸 보여 준 뒤 다음 장면
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

  /* 첫 무대가 화면에 딱 맞을 때만 장면을 넘김. 첫 장면에서 올리면 인트로로, 마지막 장면에서 내리면 아래로 스크롤 */
  /* 굿즈는 기본 모모일 때만. 계절 모모는 소개가 끝나면 바로 아래(인스타그램)로 */
  function last(){ return cur === 0 ? scenes.length - 1 : 1; }
  function heroTop(){ return hero.getBoundingClientRect().top; }
  function atHero(){ return Math.abs(heroTop()) < 2; }
  function toHero(smooth){ scrollBy({top:heroTop(), behavior:smooth ? 'smooth' : 'instant'}); }
  /* 맨 위로 갈 수 있는 건 기본 모모일 때뿐. 계절 모모는 첫 무대가 첫 화면 */
  function topScene(){ return scene === 0 && cur === 0; }
  /* 휠 예측이 빗나가도(부드러운 스크롤, 트랙패드 관성) 첫 무대를 지나치면 그 자리로 되돌림 */
  var lastT = heroTop(), held_ = 0;
  addEventListener('scroll', function(){
    var t = heroTop(), now = Date.now();
    var hold = now < held_ && Math.abs(t) > 1;                          // 멈춘 직후 1초는 남은 관성 스크롤도 막음
    var arrive = (lastT >= 1 && t < 1) || (lastT <= -1 && t > -1);      // 위·아래에서 첫 무대에 닿거나 지나침
    if (hold || (cur !== 0 && t > 1) || arrive){
      if (Math.abs(t) > .5) toHero();
      t = 0;
      if (!hold){ held_ = now + 1000; cool = now + 1000; locked = true; }
    }
    lastT = t;
    var ready = t < 1;                                                   // 인트로 모모가 첫 무대 모모 자리에 닿음
    hero.classList.toggle('ready', ready); opening.classList.toggle('done', ready);
  }, {passive:true});

  /* 휠: 두 칸 정도 굴리면 다음/이전 장면 */
  /* locked: 장면이 바뀌거나 첫 무대에 멈춘 뒤엔, 휠을 한 번 멈춰야(250ms 쉼) 다음 입력을 받음.
     계속 굴리거나 트랙패드 관성이 남아 있어도 장면을 줄줄이 넘기지 않게 */
  var acc = 0, accT, cool = 0, locked = false, lastWheel = 0;
  addEventListener('wheel', function(e){
    var down = e.deltaY > 0, now = Date.now(), gap = now - lastWheel;
    lastWheel = now;
    if (innerScroll(e.target, down)) return;
    var t = heroTop();
    if (Math.abs(t) >= 2){
      /* 스크롤하다 첫 무대를 지나치지 않게 그 자리에 멈춤 (관성은 잠깐 무시) */
      if (down ? t > 0 && t - e.deltaY <= 0 : t < 0 && t - e.deltaY >= 0){ e.preventDefault(); toHero(); acc = 0; cool = now + 1000; held_ = now + 1000; locked = true; }
      return;
    }
    if (locked){
      if (gap < 250 || now < cool){ e.preventDefault(); return; }
      locked = false;
    }
    var idle = !moving && !busy;
    if (idle && (down ? scene === last() : topScene())) return;   // 페이지 스크롤에 맡김
    e.preventDefault();
    if (!idle) return;
    acc += e.deltaY * (e.deltaMode === 1 ? 40 : 1);   // 파이어폭스는 줄 단위
    clearTimeout(accT); accT = setTimeout(function(){ acc = 0; }, 300);
    if (Math.abs(acc) < 150) return;                  // 마우스 휠 약 2칸
    acc = 0; cool = now + 900; locked = true;         // 장면마다 한 번씩 멈춤
    go(scene + (down ? 1 : -1));
  }, {passive:false});

  addEventListener('keydown', function(e){
    var k = e.key;
    if (!atHero()) return;
    if (scene === 0 && k === 'ArrowLeft') return show(cur - 1, -1);
    if (scene === 0 && k === 'ArrowRight') return show(cur + 1, 1);
    var sp = k === ' ' && !/^(BUTTON|A|INPUT)$/.test(document.activeElement.tagName);   // 버튼에 포커스가 있으면 스페이스는 누르기
    var down = k === 'ArrowDown' || k === 'PageDown' || k === 'End' || (sp && !e.shiftKey),
        up = k === 'ArrowUp' || k === 'PageUp' || k === 'Home' || (sp && e.shiftKey);
    if (!down && !up) return;
    if (canScroll(scenes[scene], down) || (down ? scene === last() : topScene())) return;
    e.preventDefault(); go(scene + (down ? 1 : -1));
  });

  /* 터치: 가로 = 계절(첫 장면), 세로 = 장면 */
  var sx = null, sy = 0, sAt = false, edgeDown = false, edgeUp = false;
  hero.addEventListener('touchstart', function(e){
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; sAt = atHero();
    edgeDown = !innerScroll(e.target, true); edgeUp = !innerScroll(e.target, false);
  }, {passive:true});
  /* 장면이 남아 있으면 페이지가 같이 밀려 올라가지 않게 막음 */
  hero.addEventListener('touchmove', function(e){
    if (sx === null || !sAt) return;
    var dy = e.touches[0].clientY - sy;
    if (dy < 0 ? edgeDown && scene < last() : edgeUp && scene === 0 && cur !== 0) e.preventDefault();
  }, {passive:false});
  hero.addEventListener('touchend', function(e){
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (!sAt || !atHero()) return;
    if (Math.abs(dx) > Math.abs(dy)){
      if (scene === 0 && Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    } else if (dy < -60 && edgeDown && scene < last()) go(scene + 1);
    else if (dy > 60 && edgeUp && scene > 0) go(scene - 1);
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


  /* 메뉴 → 장면 (다른 곳에 있으면 첫 무대로 먼저) */
  menuLinks.forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault(); toHero();
      var to = +a.dataset.sceneGo;
      if (to > last()){ momos[cur].classList.remove('on'); momos[0].classList.add('on'); apply(0); setText(0); }   // 굿즈는 기본 모모로
      go(to);
    });
  });
  /* 인스타그램 카드의 계절 → 첫 장면으로 올라가서 그 계절로 */
  seasonBtns.forEach(function(b){
    b.addEventListener('click', function(){
      var n = +b.dataset.seasonGo;
      toHero(); go(0, true);
      setTimeout(function(){ show(n, n > cur ? 1 : -1); }, reduce ? 0 : 250);
    });
  });

  /* ── 인스타그램 구간: 스크롤 진행도(0~1)에 맞춰 액자 확대 → 털이 화면을 덮음 → momo → 카드 ── */
  var insta = document.getElementById('insta'), intro = document.getElementById('intro'), fur = document.getElementById('fur'),
      word = document.getElementById('word'), hint = document.getElementById('hint'), keep = document.getElementById('keep'),
      introText = document.getElementById('introText');
  var mobile = matchMedia('(max-width:860px)');
  /* [x%, y%, 회전] — 8장은 두 줄, 마지막 큰 카드는 가운데 */
  var POS = [[12,27,-4],[37,24,3],[63,26,-2],[88,24,4],[12,75,3],[37,77,-3],[63,74,2],[88,76,-4],[50,50,1]];
  var POS_M = [[27,17,-4],[73,15,4],[26,40,3],[74,38,-3],[27,63,-2],[73,61,3],[28,85,2],[72,86,-3],[50,50,1]];
  var zTop = 1, held = null, H = innerHeight;
  function clamp01(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
  function out3(t){ return 1 - Math.pow(1 - t, 3); }
  function inOut(t){ return t * t * (3 - 2 * t); }

  function place(c){
    var P = (mobile.matches ? POS_M : POS)[c.i], f = 1 - c.fly;
    c.el.style.left = P[0] + '%'; c.el.style.top = P[1] + '%';
    c.el.style.transform = 'translate(' + c.dx + 'px,' + (c.dy + f * H * 1.15) + 'px) rotate(' + (P[2] + f * (c.i % 2 ? 28 : -28)) + 'deg)';
    c.el.style.visibility = c.fly > 0 ? '' : 'hidden';
  }

  var ticking = false;
  function tick(){
    ticking = false; H = innerHeight;
    opTick();
    var r = insta.getBoundingClientRect();
    var p = clamp01(-r.top / (r.height - H));
    var cover = Math.max(innerWidth / intro.offsetWidth, H / intro.offsetHeight);
    var z = inOut(clamp01((p - .05) / .33));                        // 1) 액자 확대
    intro.style.transform = 'scale(' + (1 + z * z * (cover * 1.2 - 1)) + ')';   // 처음엔 천천히
    var f0 = intro.offsetHeight / fur.offsetHeight;                  //    털은 액자보다 먼저 커져 화면을 덮음
    fur.style.transform = 'scale(' + (f0 * .95 + inOut(clamp01(z / .6)) * (1 - f0 * .95)) + ')';
    introText.style.opacity = 1 - clamp01((p - .03) / .07);
    keep.style.opacity = 1 - clamp01(p / .04);
    var w = out3(clamp01((p - .36) / .1));                          // 2) momo 글자
    word.style.opacity = w; word.style.transform = 'scale(' + (.88 + .12 * w) + ')';
    cardList.forEach(function(c){                                    // 3) 카드가 한 장씩 아래에서 날아옴
      c.fly = out3(clamp01((p - .44 - c.i * .042) / .1)); place(c);
    });
    hint.style.opacity = clamp01((p - .86) / .05) * .75;
  }
  function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(tick); } }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);

  /* 카드 끌어서 옮기기 (마우스·펜만, 휴대폰에선 스크롤을 막지 않게) */
  cardList.forEach(function(c){
    c.el.addEventListener('pointerdown', function(e){
      if (e.pointerType === 'touch' || c.fly < 1) return;
      e.preventDefault(); c.el.setPointerCapture(e.pointerId);
      held = {c:c, x:e.clientX - c.dx, y:e.clientY - c.dy};
      c.el.style.zIndex = ++zTop; c.el.classList.add('held');
    });
    c.el.addEventListener('pointermove', function(e){
      if (!held || held.c !== c) return;
      c.dx = e.clientX - held.x; c.dy = e.clientY - held.y; place(c);
    });
    function drop(){ if (held && held.c === c){ held = null; c.el.classList.remove('held'); } }
    c.el.addEventListener('pointerup', drop);
    c.el.addEventListener('pointercancel', drop);
  });

  /* ── 인트로: 스크롤 진행도(0~1)로 위에서 아래로 색 입히기 → 모모에서 배경색이 퍼져 첫 무대로 ── */
  var opening = document.getElementById('opening'), opWord = document.getElementById('opWord'), opCross = document.getElementById('opCross'),
      opMouse = document.getElementById('opMouse'), opFill = document.getElementById('opFill'),
      opSmall = opening.querySelector('.op-small'), opColor = opSmall.querySelector('.c');
  var opTitle = opening.querySelector('.op-title');
  function opTick(){
    H = innerHeight;
    var r = opening.getBoundingClientRect(), p = clamp01(-r.top / (r.height - H));
    if (r.bottom < 0) return;                                        // 지나간 뒤엔 계산 안 함
    /* 1) 화면 위에서 아래로 내려오는 한 줄(lineY)을 기준으로 글자와 모모에 색이 차오름 */
    var lineY = (clamp01((p - .03) / .45) * 1.1 - .05) * H;
    var wr = opWord.getBoundingClientRect();
    var x0 = opSmall.offsetLeft, y0 = opSmall.offsetTop, w0 = opSmall.offsetWidth, h0 = opSmall.offsetHeight;
    opWord.style.setProperty('--w', ((lineY - wr.top) / wr.height * 100) + '%');
    /*    모모는 털모자에서 원으로 색이 퍼지고, 이어서 몸 전체로 */
    opColor.style.clipPath = 'circle(' + (clamp01((p - .2) / .11) * 34 + clamp01((p - .3) / .16) * 70) + '% at 50% 26%)';
    /*    십자는 처음엔 빨강, 글자가 다 빨개지면 흰색. 스크롤 내내 회전 */
    var cr = opCross.getBoundingClientRect(), cw = clamp01((lineY - cr.top) / (wr.bottom - cr.top));
    opCross.style.setProperty('--cc', 'color-mix(in srgb, #fff ' + Math.round(cw * 100) + '%, #d8333b)');
    opCross.style.transform = 'rotate(' + (45 + p * 720) + 'deg)';
    opMouse.style.opacity = 1 - clamp01(p / .03);
    /* 2) 모모에서 기본 모모 배경색이 원으로 퍼짐. 글자는 그 위에 남고 흰색으로 */
    var e = inOut(clamp01((p - .52) / .3));
    opFill.style.setProperty('--fx', (x0 + w0 / 2) + 'px');
    opFill.style.setProperty('--fy', (y0 + h0 * .45) + 'px');
    opFill.style.setProperty('--fr', (e * Math.hypot(innerWidth, H)) + 'px');
    opWord.style.setProperty('--ink', 'color-mix(in srgb, #fff ' + Math.round(e * 100) + '%, var(--red))');
    /* 3) 다 칠해지면 인트로 화면이 위로 스크롤되어 올라가고(q: 0→1), 모모는 화면을 따라 내려와
          첫 무대 모모 자리에 닿음 (곰 부분 = 원본 1488x1275 중 x430 y240, 640x870) */
    var q = clamp01((H - r.bottom) / H);
    var mr = momo.getBoundingClientRect(), ht = hero.getBoundingClientRect().top;
    var tw = mr.width * 640 / 1488, tx = mr.left + mr.width * 430 / 1488, ty = mr.top - ht + mr.height * 240 / 1275;
    var m = inOut(q), sc = 1 + m * (tw / w0 - 1);
    opSmall.style.transform = 'translate(' + (m * (tx - x0)) + 'px,' + (m * (ty - y0) + q * H) + 'px) scale(' + sc + ')';   // q*H = 올라간 만큼 되돌려 화면에 붙어 있게
  }

  apply(0); setText(0); tick(); opTick(); hero.classList.toggle('ready', heroTop() < 1); opening.classList.toggle('done', heroTop() < 1);
  /* 주소에 #about 등이 있으면 그 장면으로 바로 */
  var start = [].indexOf.call(scenes, document.getElementById(location.hash.slice(1)));
  if (start > 0) go(start, true);
})();
