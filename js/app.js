// 베리트365 — 누구나, 그리고 각 교회로
// 화면은 주소 끝(#/home 등)에 따라 바뀐다. 자료는 data/*.json (깃허브 액션이 날마다 새로 씀).
// 1단계: 기록은 이 기기에만 저장된다(로그인·나눔은 2단계에서 파이어베이스로).
(function () {
  'use strict';
  const $app = document.getElementById('app');
  const D = { today: null, sermon: null, churches: [] };

  // ---------- 저장(이 기기) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('berith.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('berith.' + k, JSON.stringify(v)); } catch (e) { /* 사생활 보호 창 등 */ } }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }
  function todayKey() { const d = new Date(Date.now() + 9 * 3600e3); return d.toISOString().slice(0, 10); }  // 한국 날짜
  function dateLabel(iso) { const d = new Date(iso + 'T00:00:00+09:00'); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${'일월화수목금토'[d.getDay()]}요일`; }

  // ---------- 아이콘 ----------
  const I = {
    home: '<path d="M4 11l8-7 8 7v9H4z"/>',
    book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
    mark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    church: '<path d="M12 2v6M9 5h6M5 21V12l7-4 7 4v9z"/><path d="M10 21v-5h4v5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', next: '<path d="M9 5l7 7-7 7"/>', back: '<path d="M15 5l-7 7 7 7"/>',
    play: '<path d="M8 5v14l11-7z"/>', pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
    heart: '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/>',
    check: '<path d="M5 12l5 5 9-10"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const ico = (n, color, size) => `<svg class="icon" width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="${color || 'currentColor'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

  function tabbar(on) {
    const t = [['home', '홈', 'home'], ['word', '말씀', 'book'], ['record', '기록', 'mark'], ['calendar', '일정', 'cal'], ['church', '교회', 'church']];
    return `<nav class="tabbar" aria-label="주 메뉴">${t.map(([r, n, i]) =>
      `<a href="#/${r}" class="${on === r ? 'on' : ''}"${on === r ? ' aria-current="page"' : ''}>${ico(i)}${n}</a>`).join('')}</nav>`;
  }
  const yt = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const bibleUrl = (book, ch) => `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=SAENEW&book=${String(book).toLowerCase()}&chap=${ch}`;
  const watched = () => store.get('watched', {});        // { '2026-11-01': {sec, done} }

  // ---------- 화면들 ----------
  function viewStart() {
    document.body.classList.remove('paper');
    return `<section class="start">
      <svg class="rings" width="420" height="440" viewBox="0 0 420 440" aria-hidden="true">
        ${[150, 215, 285, 360].map((r, i) => `<circle cx="210" cy="490" r="${r}" fill="none" stroke="rgba(198,230,163,${[.32, .2, .12, .07][i]})"/>`).join('')}
        <circle cx="210" cy="340" r="5" fill="#C6E6A3"/></svg>
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
        <img src="images/berith-logo.png" alt="Berith planner 베리트" width="112" height="112" style="border-radius:26px;box-shadow:0 10px 30px rgba(0,0,0,.35)">
        <span class="serif" style="margin-top:6px;font-size:30px;font-weight:700;letter-spacing:.06em">베리트 365</span>
        <span class="muted" style="font-size:14px">하나님과 맺는 매일의 언약</span>
        <span style="margin-top:6px;padding:6px 14px;border-radius:16px;border:1px solid rgba(198,230,163,.45);font-size:13px;letter-spacing:.08em;color:var(--accent-hi)">누구나, 그리고 각 교회로</span>
      </div>
      <div style="position:relative;display:flex;flex-direction:column;gap:14px;text-align:center;padding-top:110px">
        <h1 style="font-weight:600">당신의 매일이<br>예배 되기를</h1>
        <p class="muted" style="margin:0;font-size:14px;line-height:1.7">교회에 다니지 않아도 괜찮습니다.<br>오늘 하루, 말씀 한 장으로 시작해 보세요.</p>
      </div>
      <div style="position:relative;display:flex;flex-direction:column;gap:12px">
        <a class="btn btn-primary" href="#/home" data-start>로그인 없이 바로 시작 ${ico('arrow', '#11281A', 18)}</a>
        <a class="btn btn-ghost" href="#/login">계정으로 로그인 · 기록 이어 쓰기</a>
        <a href="#/church" data-start style="min-height:44px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:14px;color:var(--accent)">${ico('church', '#C6E6A3', 16)}우리 교회 찾아 들어가기</a>
      </div></section>`;
  }

  function viewLogin() {
    return `<main><a href="#/" class="muted" style="display:flex;align-items:center;gap:6px;min-height:44px">${ico('back')}처음으로</a>
      <h1>로그인은 곧 열립니다</h1>
      <p class="muted" style="margin:0;line-height:1.8">교회 성도 계정으로 로그인하면 휴대폰을 바꿔도 기록이 이어지고, '함께 기도해요'로 기도제목을 나눌 수 있습니다. 지금은 준비 중이라, 로그인 없이 시작하시면 이 휴대폰에 기록이 저장됩니다.</p>
      <a class="btn btn-primary" href="#/home" data-start>로그인 없이 시작하기</a></main>`;
  }

  function viewHome() {
    const t = D.today, w = watched()[todayKey()] || {};
    const pct = t ? Math.round(t.day / 365 * 100) : 0;
    return `<main>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="display:flex;align-items:center;gap:10px"><img src="images/berith-logo.png" alt="" width="34" height="34" style="border-radius:9px"><span class="serif" style="font-size:20px;font-weight:700;letter-spacing:.06em">베리트 365</span></span>
        <a href="#/login" aria-label="내 정보" style="width:44px;height:44px;border-radius:22px;background:var(--surface);display:flex;align-items:center;justify-content:center">${ico('user', '#A9BBA5', 20)}</a>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <span style="font-size:13px;color:var(--accent)">${dateLabel(todayKey())}${t ? ` · ${t.day}일째` : ''}</span>
        <h1 style="font-weight:600">오늘도 말씀 앞에<br>머무는 시간</h1>
      </div>
      ${t ? `<a href="#/word" style="position:relative;display:flex;flex-direction:column;gap:14px;padding:26px 24px;border-radius:22px;background:var(--deep);overflow:hidden">
        <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true" style="position:absolute;right:-70px;top:-70px"><circle cx="110" cy="110" r="60" fill="none" stroke="rgba(238,244,234,.22)"/><circle cx="110" cy="110" r="90" fill="none" stroke="rgba(238,244,234,.14)"/><circle cx="110" cy="110" r="108" fill="none" stroke="rgba(238,244,234,.08)"/></svg>
        <span style="font-size:12px;letter-spacing:.22em;font-weight:700;color:var(--accent-hi)">오늘의 베리트</span>
        <span class="serif" style="font-size:25px;font-weight:700">${esc(t.range)}</span>
        ${w.done ? `<span class="done" style="color:var(--accent-hi)">${ico('check', '#D9EFBF', 16)}오늘 말씀 영상 완료</span>` : ''}
        <span style="align-self:flex-start;display:flex;align-items:center;gap:8px;height:40px;padding:0 18px;border-radius:20px;background:var(--text);color:var(--bg);font-size:14px;font-weight:700">영상 보고 읽기 ${ico('arrow', '#11281A', 16)}</span>
      </a>` : `<div class="card muted">오늘의 말씀을 불러오는 중입니다…</div>`}
      ${t ? `<div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px"><span class="muted">일 년 성경 통독</span><b>${t.day} / 365</b></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <span class="muted" style="font-size:12px">${t.dleft != null ? `완주까지 D-${t.dleft} · ` : ''}오늘부터 시작해도 함께 걸어요</span>
      </div>` : ''}
      <div class="grid2">
        <a href="#/record" class="outline" style="display:flex;flex-direction:column;gap:10px">${ico('pen', '#C6E6A3')}<span style="font-size:15px;font-weight:500">나의 베리트</span><span class="muted" style="font-size:12px">오늘 받은 마음 기록</span></a>
        <a href="#/church/seam" class="outline" style="display:flex;flex-direction:column;gap:10px">${ico('play', '#C6E6A3')}<span style="font-size:15px;font-weight:500">이주의 설교</span><span class="muted" style="font-size:12px">${D.sermon ? esc(D.sermon.title) : '새암교회'}</span></a>
      </div>
    </main>${tabbar('home')}`;
  }

  function viewWord() {
    document.body.classList.add('paper');
    const t = D.today;
    if (!t) return `<main><p class="muted">오늘의 말씀을 불러오는 중입니다…</p></main>${tabbar('word')}`;
    const w = watched()[todayKey()] || {};
    const chs = []; for (let c = t.start; c <= t.end; c++) chs.push(c);
    return `<main style="gap:18px;padding-top:20px">
      <div style="display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center">
        <span class="eyebrow" style="font-weight:700">오늘의 베리트 · ${t.day}일째</span>
        <h1 style="font-size:26px">${esc(t.range)}</h1>
      </div>
      <div class="video" id="vbox">
        <img src="${yt(t.video)}" alt="">
        <button class="play" id="vplay" aria-label="오늘의 말씀 영상 재생"><span>${ico('play', '#C6E6A3', 24)}</span></button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:-8px">
        <span class="muted">유튜브 베리트365</span>
        <span id="vstate">${w.done ? `<span class="done">${ico('check', '#2D7442', 14)}시청 완료</span>` : '<span class="muted">70% 넘게 보면 완료로 표시됩니다</span>'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <span style="font-size:13px;font-weight:700;color:var(--deep)">오늘 읽을 말씀 · 새번역</span>
        ${chs.map(c => `<a class="chap" href="${bibleUrl(t.book, c)}" target="_blank" rel="noopener">${esc(t.range.replace(/\s*[\d-]+장$/, ''))} ${c}장 <span style="display:flex;align-items:center;gap:6px;font-family:var(--sans);font-size:12px;color:var(--ink-muted)">읽기 ${ico('ext', '#4E6348', 16)}</span></a>`).join('')}
        <span class="muted" style="font-size:12px;line-height:1.6">새번역 본문은 대한성서공회 누리집에서 열립니다. 사용 허락을 받으면 앱 안에서 바로 읽도록 바꿉니다.</span>
      </div>
      <a class="btn btn-deep" href="#/record">${ico('pen', '#fff', 18)}나의 베리트 쓰기</a>
    </main>${tabbar('word')}`;
  }

  const TYPES = ['묵상', '기도', '감사', '간증'];
  const SHARE = [['me', '나에게', '나만 보기'], ['church', '우리 교회에게', '교회 식구와'], ['all', '모두에게', '누구나 함께']];
  const SHARE_NAME = { me: '나에게', church: '우리 교회에게', all: '모두에게' };
  function viewRecord() {
    const t = D.today, type = store.get('rtype', '묵상'), view = store.get('rview', 'me');
    const all = store.get('records', []).slice().reverse();
    // 내 기록 = 내가 쓴 모든 글, 우리 교회 = 교회·모두로 올린 글, 모두 = 모두로 올린 글
    const shown = all.filter(r => view === 'me' || (view === 'church' ? r.share === 'church' || r.share === 'all' : r.share === 'all')).slice(0, 20);
    return `<main style="gap:20px">
      <div style="display:flex;flex-direction:column;gap:6px">
        <span class="eyebrow">${t ? esc(t.range) : ''}</span>
        <h1>나의 베리트</h1>
        <span class="muted" style="font-size:13px;line-height:1.6">오늘 말씀 앞에서 받은 마음을 기록해 보세요.</span>
      </div>
      <div role="tablist" aria-label="기록 종류" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:4px;border-radius:14px;background:var(--surface)">
        ${TYPES.map(x => `<button role="tab" aria-selected="${x === type}" data-type="${x}" style="height:40px;border:0;border-radius:10px;font-size:13px;${x === type ? 'background:var(--accent);color:var(--bg);font-weight:700' : 'background:none;color:var(--muted)'}">${x}</button>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px"><label class="lab" for="verse">마음에 닿은 구절</label>
        <input type="text" id="verse" placeholder="예: ${t ? esc(t.range.replace(/\s*[\d-]+장$/, '')) + ' ' + t.start + ':1' : '요 3:16'}"></div>
      <div style="display:flex;flex-direction:column;gap:8px"><label class="lab" for="note">${type === '기도' ? '나의 기도제목' : type === '감사' ? '오늘의 감사' : type === '간증' ? '나의 간증' : '하나님이 주신 마음'}</label>
        <textarea id="note" placeholder="오늘 말씀을 통해 깨달은 것, 결단한 것을 적어 보세요."></textarea></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <span class="lab">기록 저장</span>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${SHARE.map(([v, n, d], i) => `<button data-save="${v}" style="min-height:64px;border-radius:16px;border:${i ? '1px solid rgba(198,230,163,.45)' : '0'};background:${i ? 'var(--surface)' : 'var(--accent)'};color:${i ? 'var(--text)' : 'var(--bg)'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:15px;font-weight:700">${n}<span style="font-size:11px;font-weight:400;opacity:.8">${d}</span></button>`).join('')}
        </div>
      </div>
      <div role="tablist" aria-label="기록 보기" class="chips" style="margin-top:6px">
        ${SHARE.map(([v, n]) => `<button class="chip${v === view ? ' on' : ''}" role="tab" aria-selected="${v === view}" data-rview="${v}">${v === 'me' ? '내 기록' : v === 'church' ? '우리 교회 나눔' : '모두의 나눔'}</button>`).join('')}
      </div>
      ${view !== 'me' ? `<span class="muted" style="font-size:12px;line-height:1.6">로그인 기능이 열리면 이곳에 ${view === 'church' ? '새암교회 식구들' : '베리트365를 쓰는 모든 분들'}의 나눔이 함께 올라옵니다. 지금은 이 휴대폰에서 올린 글만 보입니다.</span>` : ''}
      ${shown.length ? `<div class="list">
        ${shown.map(r => `<div class="row" style="align-items:flex-start;padding:12px 0"><span style="flex-shrink:0;display:flex;flex-direction:column;gap:4px;align-items:flex-start"><span style="height:24px;padding:0 10px;border-radius:12px;background:var(--surface);color:var(--accent);font-size:11px;display:flex;align-items:center">${esc(r.type)}</span><span class="sub" style="font-size:10px;padding-left:4px">${esc(SHARE_NAME[r.share || 'me'])}</span></span>
          <span class="grow"><span class="serif" style="font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(r.note)}</span><span class="sub">${esc(r.date)} · ${esc(r.range)}${r.verse ? ' · ' + esc(r.verse) : ''}</span></span></div>`).join('')}</div>`
        : `<p class="muted" style="margin:0;font-size:13px">아직 올린 글이 없습니다.</p>`}
    </main>${tabbar('record')}`;
  }

  // ---------- 일정: 달력 + 나의 베리트 예배 기록 + 내 일정 ----------
  // 그날 '베리트 예배'를 드린 것으로 치는 때: 말씀 영상을 70% 넘게 봤거나, 그날 나의 베리트를 하나라도 썼을 때
  function worshipDays() {
    const set = new Set();
    Object.entries(watched()).forEach(([d, w]) => { if (w.done) set.add(d); });
    store.get('records', []).forEach(r => set.add(r.date));
    return set;
  }
  const ymd = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  function viewCalendar() {
    const today = todayKey(), sel = store.get('calSel', today);
    const [cy, cm] = store.get('calMonth', today.slice(0, 7)).split('-').map(Number);
    const days = worshipDays(), events = store.get('events', {});
    // 위의 세 칸: 올해 몇 번 · 이번 달 몇 번 · 오늘 했는지 (달력을 넘겨도 늘 오늘 기준)
    const [ty, tm] = today.split('-').map(Number);
    const yearCount = [...days].filter(d => d.startsWith(String(ty))).length;
    const monthCount = [...days].filter(d => d.startsWith(today.slice(0, 7))).length;
    const stat = (n, label, hi) => `<div class="card" style="padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:2px"><span class="serif" style="font-size:26px;font-weight:700;color:${hi === false ? 'var(--muted)' : 'var(--accent)'}">${n}</span><span class="muted" style="font-size:12px">${label}</span></div>`;
    // 세는 것: 이번 달 · 연속 · 모두
    const wAll = watched(), recDays = new Set(store.get('records', []).map(r => r.date));
    const first = new Date(Date.UTC(cy, cm - 1, 1)).getUTCDay(), last = new Date(Date.UTC(cy, cm, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push('<span></span>');
    for (let d = 1; d <= last; d++) {
      const k = ymd(cy, cm, d), dow = (first + d - 1) % 7, ev = (events[k] || []).length;
      const isSel = k === sel, isToday = k === today, worship = !!(wAll[k] && wAll[k].done), med = recDays.has(k);
      // 점 색: 베리트 예배(영상) 형광 분홍 · 묵상(기록) 파랑 · 일정 연한 녹색
      const dot = c => `<i style="width:7px;height:7px;border-radius:4px;background:${c}"></i>`;
      cells.push(`<button data-day="${k}" aria-label="${cm}월 ${d}일${worship ? ', 베리트 예배' : ''}${med ? ', 묵상 기록' : ''}${ev ? `, 일정 ${ev}개` : ''}" aria-pressed="${isSel}" style="height:50px;border:0;background:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:0">
        <span style="width:32px;height:32px;line-height:32px;border-radius:16px;font-size:14px;${isSel ? 'background:var(--accent);color:var(--bg);font-weight:700' : isToday ? 'border:1px solid var(--accent);color:var(--accent);font-weight:700' : `color:${dow === 0 ? '#E6A98F' : 'var(--text)'}`}">${d}</span>
        <span style="display:flex;gap:3px;height:7px">${worship ? dot('#FF4FC4') : ''}${med ? dot('#4DA3FF') : ''}${ev ? dot('#C6E6A3') : ''}</span></button>`);
    }
    const sd = new Date(sel + 'T00:00:00+09:00'), selRecs = store.get('records', []).filter(r => r.date === sel);
    const selW = watched()[sel] || {}, selEv = (events[sel] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const editId = store.get('evEdit', null);
    return `<main style="gap:20px">
      <div style="display:flex;flex-direction:column;gap:6px"><span class="eyebrow">나의 베리트 예배</span><h1>일정</h1></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${stat(yearCount + '회', `${ty}년 한 해`)}${stat(monthCount + '회', `${tm}월 한 달`)}${stat(days.has(today) ? '완료' : '아직', '오늘', days.has(today))}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <button data-cal="-1" aria-label="이전 달" style="width:44px;height:44px;border-radius:22px;border:1px solid rgba(238,244,234,.14);background:none;color:var(--text);display:flex;align-items:center;justify-content:center">${ico('back', '#EEF4EA', 18)}</button>
          <span class="serif" style="font-size:19px;font-weight:700">${cy}년 ${cm}월</span>
          <button data-cal="1" aria-label="다음 달" style="width:44px;height:44px;border-radius:22px;border:1px solid rgba(238,244,234,.14);background:none;color:var(--text);display:flex;align-items:center;justify-content:center">${ico('next', '#EEF4EA', 18)}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:12px;color:var(--muted);padding-top:6px">${'일월화수목금토'.split('').map((d, i) => `<span style="${i ? '' : 'color:#E6A98F'}">${d}</span>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px;text-align:center">${cells.join('')}</div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:14px">
        <span class="serif" style="font-size:17px;font-weight:700">${sd.getMonth() + 1}월 ${sd.getDate()}일 ${'일월화수목금토'[sd.getDay()]}요일</span>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:14px">
          ${days.has(sel) ? `<span class="done" style="color:var(--accent);font-size:14px">${ico('check', '#C6E6A3', 16)}베리트 예배를 드렸습니다</span>` : `<span class="muted">${sel > today ? '아직 오지 않은 날입니다' : '이날은 베리트 예배 기록이 없습니다'}</span>`}
          ${selW.done ? '<span class="muted" style="font-size:12px">· 말씀 영상 시청 완료</span>' : ''}
          ${selRecs.map(r => `<span class="muted" style="font-size:12px">· ${esc(r.type)} 기록: ${esc(r.note.slice(0, 40))}${r.note.length > 40 ? '…' : ''}</span>`).join('')}
        </div>
        <div style="height:1px;background:var(--line)"></div>
        ${selEv.map(e => e.id === editId
          // 누른 일정: 그 자리에서 바로 고친다
          ? `<div style="display:flex;flex-direction:column;gap:10px;margin:0 -10px;padding:12px 10px;border-radius:14px;background:rgba(198,230,163,.12)">
              <div style="display:flex;gap:8px">
                <label style="position:absolute;width:1px;height:1px;overflow:hidden" for="edtime">시간</label>
                <input type="time" id="edtime" value="${esc(e.time)}" style="width:128px;flex-shrink:0;border-radius:12px;border:1px solid rgba(238,244,234,.14);background:var(--bg);color:var(--text);padding:0 6px;font-size:14px;color-scheme:dark">
                <label style="position:absolute;width:1px;height:1px;overflow:hidden" for="edtext">일정 내용</label>
                <input type="text" id="edtext" value="${esc(e.text)}" style="flex:1;min-width:0;font-family:var(--sans);font-size:15px;padding:12px 14px;background:var(--bg)">
              </div>
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px">
                <button id="edsave" class="btn btn-primary" style="min-height:44px;font-size:14px">고친 내용 저장</button>
                <button data-evdel="${e.id}" class="btn btn-ghost" style="min-height:44px;font-size:14px">지우기</button>
                <button data-evcancel="1" class="btn btn-ghost" style="min-height:44px;font-size:14px">닫기</button>
              </div></div>`
          : `<button data-evedit="${e.id}" aria-label="${esc(e.text)} 일정 열기" style="display:flex;align-items:center;gap:12px;min-height:48px;padding:0;border:0;background:none;color:var(--text);text-align:left;width:100%">
              <span class="serif" style="width:52px;flex-shrink:0;color:var(--accent);font-weight:600;font-size:15px">${esc(e.time || '종일')}</span><span style="flex:1;font-size:15px">${esc(e.text)}</span>${ico('next', '#A9BBA5', 16)}</button>`).join('')}
        ${selEv.length ? '<span class="muted" style="font-size:11px;margin-top:-6px">일정을 누르면 고치거나 지울 수 있습니다</span>' : '<span class="muted" style="font-size:13px">적어 둔 일정이 없습니다.</span>'}
        <div style="display:flex;gap:8px">
          <label style="position:absolute;width:1px;height:1px;overflow:hidden" for="evtime">시간</label>
          <input type="time" id="evtime" style="width:128px;flex-shrink:0;border-radius:12px;border:1px solid rgba(238,244,234,.14);background:var(--bg);color:var(--text);padding:0 6px;font-size:14px;color-scheme:dark">
          <label style="position:absolute;width:1px;height:1px;overflow:hidden" for="evtext">일정 내용</label>
          <input type="text" id="evtext" placeholder="새 일정 쓰기" style="flex:1;min-width:0;font-family:var(--sans);font-size:14px;padding:12px 14px;background:var(--bg)">
          <button id="evadd" aria-label="일정 넣기" style="width:48px;flex-shrink:0;border:0;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center">${ico('plus', '#11281A', 20)}</button>
        </div>
      </div>
    </main>${tabbar('calendar')}`;
  }

  function viewChurches() {
    return `<main style="gap:22px">
      <div style="display:flex;flex-direction:column;gap:6px">
        <span class="eyebrow">CHURCHES</span><h1>함께하는 교회</h1>
        <span class="muted" style="font-size:13px">교회를 누르면 그 교회의 소식·설교·예배로 들어갑니다.</span>
      </div>
      ${D.churches.map((c, i) => `<a href="#/church/${c.id}" style="position:relative;height:200px;border-radius:22px;overflow:hidden;display:block">
        <img src="${esc(c.photo)}" alt="${esc(c.name)}" style="width:100%;height:100%;object-fit:cover">
        <span style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,40,26,.05) 30%,rgba(17,40,26,.92))"></span>
        ${i === 0 ? '<span class="badge" style="top:14px;left:14px">새암교회</span>' : ''}
        <span style="position:absolute;left:20px;right:20px;bottom:16px;display:flex;justify-content:space-between;align-items:flex-end">
          <span style="display:flex;flex-direction:column;gap:4px"><span class="serif" style="font-size:22px;font-weight:700">${esc(c.name)}</span>
          <span style="font-size:12px;color:var(--soft)">${esc(c.area)} · ${esc(c.worship.slice(0, 2).map(w => w.time.replace('오전 ', '')).join(' · '))}</span></span>
          <span style="width:40px;height:40px;border-radius:20px;background:rgba(238,244,234,.16);display:flex;align-items:center;justify-content:center">${ico('arrow', '#EEF4EA', 18)}</span>
        </span></a>`).join('')}
      <a href="https://saechang888-code.github.io/seamchurch/location.html" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;min-height:50px;border-radius:25px;border:1px dashed rgba(198,230,163,.6);color:var(--accent);font-size:14px">우리 교회도 베리트와 함께하기 · 문의</a>
    </main>${tabbar('church')}`;
  }

  function viewChurch(id) {
    const c = D.churches.find(x => x.id === id);
    if (!c) return viewChurches();
    const tab = store.get('ctab', '소식'), s = D.sermon;
    const sermonCard = s ? `<div style="display:flex;flex-direction:column;border-radius:16px;overflow:hidden;background:var(--surface)">
        <div class="video" id="sbox" style="border-radius:0"><span class="badge">이주의 설교</span><img src="${yt(s.video)}" alt="">
          <button class="play" id="splay" aria-label="이주의 설교 영상 재생"><span>${ico('play', '#C6E6A3', 22)}</span></button></div>
        <div style="display:flex;flex-direction:column;gap:3px;padding:12px 14px"><span class="serif" style="font-size:16px;font-weight:600">${esc(s.title)}</span>
          <span class="muted" style="font-size:12px">${esc(s.when)} · ${esc(s.preacher)}</span></div></div>` : '';
    const body = {
      '소식': sermonCard + `<div class="list"><span class="lab" style="display:block;padding-bottom:4px">교회 소식</span>
        ${c.news.map(n => `<a href="${esc(n.url)}" target="_blank" rel="noopener"><span style="width:48px;height:48px;border-radius:12px;background:var(--deep);display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:10px;color:var(--accent-hi)">${esc(n.month)}</span><span class="serif" style="font-size:17px;font-weight:700;line-height:1">${esc(n.day)}</span></span>
          <span class="grow"><span style="font-size:15px">${esc(n.title)}</span><span class="sub">${esc(n.desc)}</span></span>${ico('next', '#A9BBA5', 16)}</a>`).join('')}</div>`,
      '설교': sermonCard + `<a class="btn btn-ghost" href="https://www.youtube.com/@seamvision" target="_blank" rel="noopener">지난 설교 모두 보기 (유튜브)</a>`,
      '예배': `<div class="grid2" style="gap:10px">${c.worship.map(w => `<div class="card" style="padding:14px 16px;display:flex;flex-direction:column;gap:4px"><span class="muted" style="font-size:12px">${esc(w.name)}</span><span class="serif" style="font-size:17px;font-weight:600">${esc(w.time)}</span></div>`).join('')}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:4px"><span class="muted" style="font-size:12px">주소</span><span style="font-size:14px;line-height:1.6">${esc(c.address)}</span></div>`,
      '소개': `<div class="card" style="line-height:1.8;font-size:14px">${esc(c.denom)} ${esc(c.name)}입니다. ${esc(c.area)}에서 말씀과 기도로 함께 걸어갑니다.</div>
        <div class="list">${c.links.map(l => `<a href="${esc(l.url)}" target="_blank" rel="noopener"><span class="grow"><span style="font-size:15px">${esc(l.name)}</span></span>${ico('ext', '#A9BBA5', 16)}</a>`).join('')}</div>`
    };
    return `<main style="gap:16px">
      <div class="hero"><img src="${esc(c.photo)}" alt="${esc(c.name)} 전경">
        <a href="#/church" class="back" aria-label="교회 목록으로">${ico('back', '#EEF4EA', 20)}</a>
        <div class="cap"><span style="font-size:11px;letter-spacing:.26em;color:var(--accent)">${esc(c.en)}</span><span class="serif" style="font-size:28px;font-weight:700">${esc(c.name)}</span>
        <span style="font-size:12px;color:var(--soft)">${esc(c.denom)} · ${esc(c.area)}</span></div></div>
      <div class="chips" role="tablist" aria-label="교회 메뉴">${Object.keys(body).map(k => `<button class="chip${k === tab ? ' on' : ''}" role="tab" aria-selected="${k === tab}" data-ctab="${k}">${k}</button>`).join('')}</div>
      ${body[tab] || body['소식']}
    </main>${tabbar('church')}`;
  }

  // ---------- 유튜브 재생 + 70% 시청 기록 ----------
  let ytReady = null;
  function loadYT() {
    if (ytReady) return ytReady;
    ytReady = new Promise(res => {
      window.onYouTubeIframeAPIReady = res;
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
    });
    return ytReady;
  }
  function mountPlayer(box, vid, track) {
    box.innerHTML = '<div id="ytp"></div>';
    loadYT().then(() => {
      let last = null, timer = null;
      const p = new YT.Player('ytp', {
        videoId: vid, playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onStateChange: e => {
            if (!track) return;
            clearInterval(timer);
            if (e.data !== YT.PlayerState.PLAYING) return;
            timer = setInterval(() => {
              const cur = p.getCurrentTime(), dur = p.getDuration();
              const all = watched(), k = todayKey(), w = all[k] || { sec: 0 };
              if (last != null && cur > last && cur - last < 5) w.sec += cur - last;   // 실제로 본 시간만 센다(건너뛰기 제외)
              last = cur;
              if (!w.done && dur > 0 && w.sec >= dur * 0.7) {
                w.done = true; toast('오늘 말씀 영상을 다 보셨어요');
                const st = document.getElementById('vstate'); if (st) st.innerHTML = `<span class="done">${ico('check', '#2D7442', 14)}시청 완료</span>`;
              }
              all[k] = w; store.set('watched', all);
            }, 1000);
          }
        }
      });
    });
  }

  // ---------- 길 찾기 ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h && store.get('started', false)) { location.replace('#/home'); return; }
    document.body.classList.remove('paper');
    const [a, b] = h.split('/');
    $app.innerHTML = !a || a === 'start' ? viewStart() : a === 'login' ? viewLogin() : a === 'word' ? viewWord() : a === 'record' ? viewRecord() : a === 'calendar' ? viewCalendar()
      : a === 'church' ? (b ? viewChurch(b) : viewChurches()) : viewHome();
    document.querySelector('meta[name=theme-color]').content = document.body.classList.contains('paper') ? '#F2F8EC' : '#11281A';
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-start],[data-type],[data-save],[data-rview],[data-ctab],[data-day],[data-cal],[data-evdel],[data-evedit],[data-evcancel],#evadd,#edsave,#vplay,#splay');
    if (!el) return;
    if (el.dataset.day) { store.set('calSel', el.dataset.day); store.set('evEdit', null); route(); return; }
    if (el.dataset.evedit || el.dataset.evcancel) {
      store.set('evEdit', el.dataset.evedit || null); route();
      const t = document.getElementById('edtext'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
      return;
    }
    if (el.dataset.cal) {
      const [y, m] = store.get('calMonth', todayKey().slice(0, 7)).split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + Number(el.dataset.cal), 1));
      store.set('calMonth', d.toISOString().slice(0, 7)); route(); return;
    }
    if (el.id === 'evadd' || el.id === 'edsave' || el.dataset.evdel) {
      const sel = store.get('calSel', todayKey()), ev = store.get('events', {});
      if (el.id === 'evadd') {
        const text = document.getElementById('evtext').value.trim();
        if (!text) { toast('일정 내용을 적어 주세요'); return; }
        (ev[sel] = ev[sel] || []).push({ id: Date.now().toString(36), time: document.getElementById('evtime').value, text });
        toast('일정을 넣었습니다');
      } else if (el.id === 'edsave') {
        const text = document.getElementById('edtext').value.trim();
        if (!text) { toast('일정 내용을 적어 주세요'); return; }
        const found = (ev[sel] || []).find(x => x.id === store.get('evEdit', null));
        if (found) { found.time = document.getElementById('edtime').value; found.text = text; toast('일정을 고쳤습니다'); }
        store.set('evEdit', null);
      } else {
        ev[sel] = (ev[sel] || []).filter(x => x.id !== el.dataset.evdel);
        if (!ev[sel].length) delete ev[sel];
        store.set('evEdit', null); toast('일정을 지웠습니다');
      }
      store.set('events', ev); route(); return;
    }
    if (el.hasAttribute('data-start')) store.set('started', true);
    if (el.dataset.type) {   // 종류를 바꿔도 쓰던 글은 그대로 둔다
      const keep = { v: (document.getElementById('verse') || {}).value, n: (document.getElementById('note') || {}).value };
      store.set('rtype', el.dataset.type);
      route();
      if (keep.v) document.getElementById('verse').value = keep.v;
      if (keep.n) document.getElementById('note').value = keep.n;
      return;
    }
    if (el.dataset.rview) { store.set('rview', el.dataset.rview); route(); }
    if (el.dataset.ctab) { store.set('ctab', el.dataset.ctab); route(); }
    if (el.id === 'vplay') mountPlayer(document.getElementById('vbox'), D.today.video, true);
    if (el.id === 'splay') mountPlayer(document.getElementById('sbox'), D.sermon.video, false);
    if (el.dataset.save) {
      const note = document.getElementById('note').value.trim();
      if (!note) { toast('받은 마음을 한 줄이라도 적어 주세요'); return; }
      const recs = store.get('records', []);
      const share = el.dataset.save;
      recs.push({ date: todayKey(), type: store.get('rtype', '묵상'), share, range: D.today ? D.today.range : '', verse: document.getElementById('verse').value.trim(), note });
      store.set('records', recs); store.set('rview', share);
      toast(share === 'me' ? '나에게 저장했습니다' : share === 'church' ? '우리 교회에게 나눴습니다' : '모두에게 나눴습니다'); route();
    }
  });
  window.addEventListener('hashchange', route);

  const bust = '?d=' + todayKey();
  Promise.all(['today', 'sermon', 'churches'].map(n => fetch('data/' + n + '.json' + bust).then(r => r.ok ? r.json() : null).catch(() => null)))
    .then(([t, s, c]) => { D.today = t; D.sermon = s; D.churches = c || []; route(); });
  route();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
