/* ============================================================
   野球モンスターズ  app.js
   ------------------------------------------------------------
   ・保存はすべて localStorage（スマホの中だけ／サーバーなし）
   ・得点やコレクションは、毎回すべての記録から計算し直す方式。
     （あとから記録をなおしても、数がずれない）
   ============================================================ */

'use strict';

/* ====== 保存キー ====== */
const KEY = {
  settings: 'baseballMonsters_settings',
  games:    'baseballMonsters_games',
  players:  'baseballMonsters_players'
};

const REGULATION_DAYS = 7;   // 1試合の日数

/* ------------------------------------------------------------
   泰志の写真を出す／出さないのスイッチ
   ------------------------------------------------------------
   公開サイトでは、写真を出さない設定（空っぽ）にしています。
   家のMacやiPadだけで使う版で写真を出したいときは、
   taishi.png（正方形）と taishi-card.png をこのフォルダに置いて、
   下の2行を次のように書きかえてください。

     const TAISHI_FACE = 'taishi.png';
     const TAISHI_CARD = 'taishi-card.png';

   ※ GitHubに上げるファイルでこれを有効にすると、
     URLを知っている人は誰でも写真を見られる状態になります。
   ------------------------------------------------------------ */
const TAISHI_FACE = '';
const TAISHI_CARD = '';

/* 泰志の顔（写真がなければ絵文字） */
function taishiFace(cls) {
  return TAISHI_FACE
    ? '<img class="ava ' + (cls || '') + '" src="' + TAISHI_FACE + '" alt="泰志">'
    : '<div class="vs-face' + (cls === 'ava-big' ? ' vs-face-big' : '') + '">🧑‍🦱</div>';
}

/* ====== 状態 ====== */
let S = {
  settings: { started: false, startedAt: null, seenResults: [], lastPicked: {} },
  games: [],
  customPlayers: []
};

/* 画面の一時的な状態 */
let view = { screen: 'home', playerTab: 'batter', pick: null };

/* ============================================================
   日付のべんりな関数（ぜんぶ「その端末の今日」で計算）
   ============================================================ */
function dstr(d) {
  const y = d.getFullYear(), m = ('0' + (d.getMonth() + 1)).slice(-2), dd = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + dd;
}
function today() { return dstr(new Date()); }
function parseD(s) { const a = s.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
function addDays(s, n) { const d = parseD(s); d.setDate(d.getDate() + n); return dstr(d); }
function dayDiff(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
function jpDate(s) { const d = parseD(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }

/* ============================================================
   保存・読み込み
   ============================================================ */
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY.settings) || 'null');
    if (s) S.settings = Object.assign(S.settings, s);
    const g = JSON.parse(localStorage.getItem(KEY.games) || 'null');
    if (Array.isArray(g)) S.games = g;
    const p = JSON.parse(localStorage.getItem(KEY.players) || 'null');
    if (Array.isArray(p)) S.customPlayers = p;
  } catch (e) { /* こわれていても起動できるように、なにもしない */ }
}
function save() {
  try {
    localStorage.setItem(KEY.settings, JSON.stringify(S.settings));
    localStorage.setItem(KEY.games, JSON.stringify(S.games));
    localStorage.setItem(KEY.players, JSON.stringify(S.customPlayers));
  } catch (e) { /* 保存できなくてもアプリは止めない */ }
}

/* ============================================================
   選手
   ============================================================ */
function allPlayers() { return PLAYERS.concat(S.customPlayers); }
function findPlayer(id) { return allPlayers().find(function (p) { return p.id === id; }) || null; }
function playersFor(kind) {                    // kind: 'batting' | 'pitching'
  const want = kind === 'batting' ? 'batter' : 'pitcher';
  return allPlayers().filter(function (p) { return p.type === want || p.type === 'both'; });
}

/* ============================================================
   試合
   ============================================================ */
function activeGame() { return S.games.find(function (g) { return g.status === 'active'; }) || null; }

function pickMonster() {
  const col = monsterCollection();
  const prev = S.games.length ? S.games[S.games.length - 1].monsterId : null;
  let best = null, bestN = Infinity;
  MONSTERS.forEach(function (m) {
    const n = (col[m.id] ? col[m.id].defeatCount : 0) + (m.id === prev ? 0.5 : 0);
    if (n < bestN) { bestN = n; best = m; }
  });
  return best ? best.id : MONSTERS[0].id;
}

function newGame(startDate) {
  const g = {
    id: 'game_' + (S.games.length + 1),
    startDate: startDate,
    monsterId: pickMonster(),
    records: {},
    status: 'active',
    result: null,
    endDate: null
  };
  S.games.push(g);
  return g;
}

function getRecord(game, date) {
  return game.records[date] || null;
}
function ensureRecord(game, date) {
  if (!game.records[date]) {
    game.records[date] = {
      date: date,
      battingCompleted: false, battingPlayerId: null,
      pitchingCompleted: false, pitchingPlayerId: null,
      confirmed: false
    };
  }
  return game.records[date];
}
function recScore(r) { return (r.battingCompleted ? 1 : 0) + (r.pitchingCompleted ? 1 : 0); }

/* 記録してよい日か？（今日と前日だけ。さらに試合の期間内） */
function canEdit(game, date) {
  const t = today();
  if (date !== t && date !== addDays(t, -1)) return false;
  const n = dayDiff(game.startDate, date) + 1;
  if (n < 1) return false;
  const ev = evaluate(game);
  if (n <= REGULATION_DAYS) return true;
  return ev.extra && ev.status === 'playing';       // 延長戦中だけ8日目以降もOK
}

/* ---------- 試合の計算（いちばん大事なところ） ---------- */
function evaluate(game) {
  const t = today(), yest = addDays(t, -1);
  const cells = [];
  let y = 0, m = 0, blanks = 0, undecided = 0;

  for (let n = 1; n <= REGULATION_DAYS; n++) {
    const date = addDays(game.startDate, n - 1);
    const r = getRecord(game, date);
    if (r && r.confirmed) {
      const ys = recScore(r);
      y += ys; m += 1;
      cells.push({ n: n, date: date, y: ys, m: 1, state: 'done' });
    } else if (date > t) {
      undecided++; cells.push({ n: n, date: date, state: 'future' });
    } else if (date === t || date === yest) {
      undecided++; cells.push({ n: n, date: date, state: 'open' });
    } else {
      blanks++; cells.push({ n: n, date: date, state: 'blank' });
    }
  }

  const regDone = (undecided === 0);
  if (regDone && blanks > 0) {
    m += blanks;
    cells.forEach(function (c) { if (c.state === 'blank') { c.y = 0; c.m = 1; } });
  }

  let status = 'playing', result = null, extra = false;

  if (regDone) {
    if (y !== m) {
      status = 'finished'; result = (y > m) ? 'win' : 'lose';
    } else {
      extra = true;
      let n = REGULATION_DAYS + 1, guard = 0;
      while (guard++ < 400) {
        const date = addDays(game.startDate, n - 1);
        const r = getRecord(game, date);
        if (r && r.confirmed) {
          const ys = recScore(r);
          y += ys; m += 1;
          cells.push({ n: n, date: date, y: ys, m: 1, state: 'done' });
          if (y !== m) { status = 'finished'; result = (y > m) ? 'win' : 'lose'; break; }
          n++; continue;
        }
        if (date > t) { cells.push({ n: n, date: date, state: 'future' }); break; }
        if (date === t || date === yest) { cells.push({ n: n, date: date, state: 'open' }); break; }
        cells.push({ n: n, date: date, state: 'skip' });   // 延長は未記録でも負けにしない
        n++;
      }
    }
  }

  const lastCell = cells[cells.length - 1];
  return {
    cells: cells, y: y, m: m, regDone: regDone, extra: extra,
    status: status, result: result, lastDate: lastCell ? lastCell.date : game.startDate
  };
}

/* 試合の終了を保存し、必要なら次の試合を用意する */
function syncGames() {
  let changed = false;
  S.games.forEach(function (g) {
    if (g.status !== 'active') return;
    const ev = evaluate(g);
    if (ev.status === 'finished') {
      g.status = 'finished'; g.result = ev.result; g.endDate = ev.lastDate;
      g.finalY = ev.y; g.finalM = ev.m;
      changed = true;
    }
  });
  if (!activeGame() && S.settings.started) {
    const last = S.games[S.games.length - 1];
    let start = today();
    if (last && last.endDate) {
      const next = addDays(last.endDate, 1);
      if (next > start) start = next;
    }
    newGame(start);
    changed = true;
  }
  if (changed) save();
}

/* ============================================================
   コレクション・記録（すべての試合から計算し直す）
   ============================================================ */
function allConfirmedRecords() {
  const out = [];
  S.games.forEach(function (g) {
    Object.keys(g.records).forEach(function (d) {
      const r = g.records[d];
      if (r.confirmed) out.push(r);
    });
  });
  out.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  return out;
}

function playerCollection() {
  const col = {};
  allConfirmedRecords().forEach(function (r) {
    [r.battingCompleted && r.battingPlayerId, r.pitchingCompleted && r.pitchingPlayerId]
      .forEach(function (id) {
        if (!id) return;
        if (!col[id]) col[id] = { playerId: id, getCount: 0, firstGetDate: r.date, lastGetDate: r.date };
        col[id].getCount++;
        if (r.date < col[id].firstGetDate) col[id].firstGetDate = r.date;
        if (r.date > col[id].lastGetDate) col[id].lastGetDate = r.date;
      });
  });
  return col;
}

function monsterCollection() {
  const col = {};
  S.games.forEach(function (g) {
    if (g.status === 'finished' && g.result === 'win') {
      if (!col[g.monsterId]) col[g.monsterId] = { monsterId: g.monsterId, defeatCount: 0, firstDefeatDate: g.endDate };
      col[g.monsterId].defeatCount++;
      if (g.endDate < col[g.monsterId].firstDefeatDate) col[g.monsterId].firstDefeatDate = g.endDate;
    }
  });
  return col;
}

function dayScoreMap() {
  const map = {};
  allConfirmedRecords().forEach(function (r) { map[r.date] = recScore(r); });
  return map;
}

function streaks() {
  const map = dayScoreMap();
  const dates = Object.keys(map).filter(function (d) { return map[d] >= 1; }).sort();
  /* いま続いている日数 */
  let cur = 0;
  let d = today();
  if (!(map[d] >= 1)) d = addDays(d, -1);
  while (map[d] >= 1) { cur++; d = addDays(d, -1); }
  /* 最高記録 */
  let best = 0, run = 0, prev = null;
  dates.forEach(function (x) {
    run = (prev && dayDiff(prev, x) === 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = x;
  });
  return { current: cur, best: best };
}

function stats() {
  const recs = allConfirmedRecords();
  const pc = playerCollection(), mc = monsterCollection();
  const st = {
    wins: 0, losses: 0, winStreak: 0, bestWinStreak: 0, bestGameScore: 0,
    practiceDays: 0, battingDays: 0, pitchingDays: 0,
    players: Object.keys(pc).length, monsters: Object.keys(mc).length
  };
  let run = 0;
  S.games.forEach(function (g) {
    if (g.status !== 'finished') return;
    if (g.result === 'win') { st.wins++; run++; if (run > st.bestWinStreak) st.bestWinStreak = run; }
    else { st.losses++; run = 0; }
    if (typeof g.finalY === 'number' && g.finalY > st.bestGameScore) st.bestGameScore = g.finalY;
  });
  st.winStreak = run;
  recs.forEach(function (r) {
    if (recScore(r) >= 1) st.practiceDays++;
    if (r.battingCompleted) st.battingDays++;
    if (r.pitchingCompleted) st.pitchingDays++;
  });
  const s = streaks();
  st.streakCurrent = s.current; st.streakBest = s.best;
  return st;
}

/* ============================================================
   画面えがき
   ============================================================ */
const $ = function (sel) { return document.querySelector(sel); };
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
function monsterOf(id) { return MONSTERS.find(function (m) { return m.id === id; }) || MONSTERS[0]; }

function render() {
  if (!S.settings.started) {
    $('#screen-start').hidden = false; $('#main').hidden = true; $('#nav').hidden = true;
    return;
  }
  syncGames();
  $('#screen-start').hidden = true; $('#main').hidden = false; $('#nav').hidden = false;

  renderHome();
  renderPlayers();
  renderMonsters();
  renderRecords();

  ['home', 'players', 'monsters', 'records'].forEach(function (name) {
    $('#screen-' + name).hidden = (name !== view.screen);
  });
  document.querySelectorAll('.nav-btn').forEach(function (b) {
    b.classList.toggle('is-on', b.dataset.screen === view.screen);
  });
}

/* ---------- ホーム ---------- */
function renderHome() {
  const g = activeGame();
  if (!g) { $('#screen-home').innerHTML = ''; return; }
  const ev = evaluate(g), mon = monsterOf(g.monsterId), t = today();
  const dayNo = dayDiff(g.startDate, t) + 1;
  const pc = playerCollection();
  const st = streaks();

  /* --- 対戦カード --- */
  let html = '<div class="vs-card">' +
    '<div class="vs-label">いまの試合</div>' +
    '<div class="vs-row">' +
      '<div class="vs-side">' + taishiFace() + '<div class="vs-name">泰志</div><div class="vs-score">' + ev.y + '</div></div>' +
      '<div class="vs-mid">VS</div>' +
      '<div class="vs-side"><div class="vs-face">' + mon.emoji + '</div><div class="vs-name">' + esc(mon.name) + '</div><div class="vs-score">' + ev.m + '</div></div>' +
    '</div>' +
    '<div class="vs-day">' + (dayNo < 1
      ? '次の試合は ' + jpDate(g.startDate) + ' スタート！'
      : (dayNo > REGULATION_DAYS ? '延長戦 ' + (dayNo - REGULATION_DAYS) + '日目' : '第' + dayNo + '日目 / ' + REGULATION_DAYS + '日')) +
    '</div></div>';

  /* --- スコアボード --- */
  html += '<div class="board"><table class="score"><tr><th></th>';
  ev.cells.forEach(function (c) {
    html += '<th>' + (c.n > REGULATION_DAYS ? 'EX' + (c.n - REGULATION_DAYS) : c.n) + '</th>';
  });
  html += '<th>計</th></tr>';
  html += '<tr><td class="name">泰志</td>';
  ev.cells.forEach(function (c) { html += '<td>' + (typeof c.y === 'number' ? c.y : '<span class="dash">-</span>') + '</td>'; });
  html += '<td class="total">' + ev.y + '</td></tr>';
  html += '<tr><td class="name">MONSTER</td>';
  ev.cells.forEach(function (c) { html += '<td>' + (typeof c.m === 'number' ? c.m : '<span class="dash">-</span>') + '</td>'; });
  html += '<td class="total">' + ev.m + '</td></tr></table></div>';

  /* --- 今日のチャレンジ --- */
  const editable = canEdit(g, t);
  const r = getRecord(g, t);
  html += '<div class="h">⚾ 今日のチャレンジ</div>';

  if (!editable) {
    html += '<div class="ch-card"><div class="ch-icon">🌙</div><div class="ch-body">' +
      '<div class="ch-title">' + (dayNo < 1 ? 'つぎの試合をまとう！' : '今日はおやすみ') + '</div>' +
      '<div class="ch-note">' + (dayNo < 1 ? jpDate(g.startDate) + 'からスタート！' : 'また明日チャレンジしよう！') + '</div>' +
      '</div></div>';
  } else {
    html += challengeCard('batting', '素振り10回', '🏏', r, t);
    html += challengeCard('pitching', 'シャドーピッチング10回', '⚾', r, t);

    if (r && !r.confirmed && recScore(r) >= 1) {
      html += '<button class="btn btn-green" data-action="confirm" data-date="' + t + '">今日の結果を確定！</button>';
    } else if (r && r.confirmed) {
      html += '<div class="streak">今日は ' + recScore(r) + '点 かくてい！ また明日！</div>' +
        '<button class="btn btn-sub" style="margin-top:10px" data-action="unconfirm" data-date="' + t + '">今日の記録をなおす</button>';
    } else {
      html += '<div class="ch-note" style="text-align:center;color:#cfe4f7;margin-top:4px">10回おわったら「できた！」をおしてね</div>';
    }
  }

  /* --- 前日の記録 --- */
  const yest = addDays(t, -1);
  if (canEdit(g, yest)) {
    const ry = getRecord(g, yest);
    html += '<button class="btn btn-sub" style="margin-top:12px" data-action="edit-yesterday">' +
      'きのう（' + jpDate(yest) + '）の記録' + (ry && ry.confirmed ? 'をなおす' : 'を入れる') + '</button>';
  }

  /* --- 連続記録 --- */
  if (st.current >= 2) html += '<div class="streak">🔥 ' + st.current + '日連続！</div>';
  else if (st.current === 1) html += '<div class="streak">🔥 今日も練習した！</div>';

  /* --- 最近GETした選手 --- */
  const recent = Object.keys(pc).map(function (k) { return pc[k]; })
    .sort(function (a, b) { return a.lastGetDate < b.lastGetDate ? 1 : -1; }).slice(0, 5);
  if (recent.length) {
    html += '<div class="h">🌟 さいきんGETした選手</div><div class="grid">';
    recent.forEach(function (c) { html += playerCard(findPlayer(c.playerId), c); });
    html += '</div>';
  }

  $('#screen-home').innerHTML = html;
}

function challengeCard(kind, title, icon, r, date) {
  const done = r && (kind === 'batting' ? r.battingCompleted : r.pitchingCompleted);
  const pid = r && (kind === 'batting' ? r.battingPlayerId : r.pitchingPlayerId);
  const p = pid ? findPlayer(pid) : null;
  return '<button class="ch-card' + (done ? ' done' : '') + '" data-action="challenge" data-kind=' +
    '"' + kind + '" data-date="' + date + '">' +
    '<div class="ch-icon">' + icon + '</div><div class="ch-body">' +
    '<div class="ch-title">' + title + '</div>' +
    '<div class="ch-note">' + (done && p ? esc(p.name) + 'のマネでできた！' : 'だれのマネをする？') + '</div>' +
    '</div>' + (done ? '<div class="ch-done-mark">できた！</div>' : '') + '</button>';
}

/* ---------- 選手コレクション ---------- */
function playerCard(p, col) {
  if (!p) return '';
  const got = col && col.getCount > 0;
  const year = (p.wbcYears && p.wbcYears.length) ? p.wbcYears[p.wbcYears.length - 1] : '';
  return '<div class="pcard' + (got ? '' : ' locked') + '">' +
    (year ? '<div class="pyear">' + year + '</div>' : '') +
    '<div class="pname">' + esc(p.name) + '</div>' +
    '<div class="pteam">' + esc(p.team) + '</div>' +
    (got ? '<div class="pget">GET × ' + col.getCount + '</div>' : '') +
    '</div>';
}

function renderPlayers() {
  const pc = playerCollection();
  const tabs = [
    { key: 'batter', label: '打者' },
    { key: 'pitcher', label: '投手' }
  ].concat(WBC_YEARS.map(function (y) { return { key: 'wbc' + y, label: y + ' WBC' }; }))
   .concat([{ key: 'legend', label: 'レジェンド' }, { key: 'custom', label: '追加選手' }]);

  let html = '<div class="h">🧑‍🦱 選手コレクション <span class="badge">' + Object.keys(pc).length + '人GET</span></div><div class="tabs">';
  tabs.forEach(function (t) {
    html += '<button class="tab' + (view.playerTab === t.key ? ' is-on' : '') + '" data-action="ptab" data-tab="' + t.key + '">' + t.label + '</button>';
  });
  html += '</div>';

  const key = view.playerTab;
  let list;
  if (key === 'batter') list = allPlayers().filter(function (p) { return p.type === 'batter' || p.type === 'both'; });
  else if (key === 'pitcher') list = allPlayers().filter(function (p) { return p.type === 'pitcher' || p.type === 'both'; });
  else if (key === 'legend') list = allPlayers().filter(function (p) { return p.group === 'legend'; });
  else if (key === 'custom') list = S.customPlayers.slice();
  else {
    const y = parseInt(key.replace('wbc', ''), 10);
    list = allPlayers().filter(function (p) { return (p.wbcYears || []).indexOf(y) >= 0; });
  }

  if (!list.length) {
    html += '<div class="ch-card"><div class="ch-icon">➕</div><div class="ch-body"><div class="ch-title">まだいません</div>' +
      '<div class="ch-note">チャレンジのときに「その他の選手を追加」でふやせるよ</div></div></div>';
  } else {
    html += '<div class="grid">';
    list.forEach(function (p) { html += playerCard(p, pc[p.id]); });
    html += '</div>';
  }
  $('#screen-players').innerHTML = html;
}

/* ---------- モンスター図鑑 ---------- */
function renderMonsters() {
  const mc = monsterCollection();
  let html = '<div class="h">👹 モンスター図鑑 <span class="badge">' + Object.keys(mc).length + '/' + MONSTERS.length + '</span></div><div class="grid">';
  MONSTERS.forEach(function (m) {
    const c = mc[m.id];
    html += '<div class="mcard' + (c ? '' : ' locked') + '">' +
      '<div class="mface">' + m.emoji + '</div>' +
      '<div class="mname">' + esc(m.name) + '</div>' +
      '<div class="mnote">' + (c ? 'たおした回数 ' + c.defeatCount + '<br>はじめて ' + jpDate(c.firstDefeatDate) : esc(m.desc)) + '</div>' +
      '</div>';
  });
  html += '</div>';
  $('#screen-monsters').innerHTML = html;
}

/* ---------- 記録 ---------- */
function renderRecords() {
  const st = stats();
  const rows = [
    ['通算勝利', st.wins + ' 勝'],
    ['通算敗戦', st.losses + ' 敗'],
    ['いまの連勝', st.winStreak + ' 連勝'],
    ['最高連勝', st.bestWinStreak + ' 連勝'],
    ['1試合の最高得点', st.bestGameScore + ' 点'],
    ['練習した日', st.practiceDays + ' 日'],
    ['素振りした日', st.battingDays + ' 日'],
    ['シャドーピッチングした日', st.pitchingDays + ' 日'],
    ['いまの連続記録', st.streakCurrent + ' 日'],
    ['最高の連続記録', st.streakBest + ' 日'],
    ['GETした選手', st.players + ' 人'],
    ['GETしたモンスター', st.monsters + ' 体']
  ];
  let html = '<div class="h">📊 これまでの記録</div><div class="stat-list">';
  rows.forEach(function (r) { html += '<div class="stat-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; });
  html += '</div><div class="ch-note" style="text-align:center;color:#cfe4f7;margin-top:12px">くらべる相手は、きのうまでの泰志だけ。</div>';
  $('#screen-records').innerHTML = html;
}

/* ============================================================
   シート（下から出る画面）
   ============================================================ */
function openSheet(html) {
  $('#sheet').innerHTML = html;
  $('#sheet').hidden = false; $('#sheet-bg').hidden = false;
  $('#sheet').scrollTop = 0;
}
function closeSheet() {
  $('#sheet').hidden = true; $('#sheet-bg').hidden = true; view.pick = null;
}

/* ---------- 選手えらび ---------- */
function openPicker(kind, date, selectedId) {
  view.pick = { kind: kind, date: date, playerId: selectedId || null };
  const kindLabel = kind === 'batting' ? '素振り10回' : 'シャドーピッチング10回';
  const list = playersFor(kind);
  const pc = playerCollection();

  let html = '<h2>' + (date === today() ? '今日' : 'きのう') + 'は だれのマネをする？</h2>' +
    '<div class="sheet-sub">' + kindLabel + '</div>';

  /* えらんだあと */
  if (view.pick.playerId) {
    const p = findPlayer(view.pick.playerId);
    html += '<div class="pick is-on"><div><div class="pk-name">' + esc(p.name) + '</div>' +
      '<div class="pk-team">' + esc(p.team) + '</div></div></div>' +
      '<button class="btn btn-green btn-huge" data-action="done" >10回できた！</button>' +
      '<div style="height:10px"></div>' +
      '<button class="btn btn-sub" data-action="clear-pick">べつの選手にする</button>' +
      '<div style="height:6px"></div>' +
      '<button class="btn btn-sub" data-action="close-sheet">とじる</button>';
    openSheet(html);
    return;
  }

  html += '<div class="hint">選手をえらんでから「10回できた！」をおしてね</div>';

  /* さいきん使った選手 */
  const recentIds = (S.settings.lastPicked[kind] || []).filter(function (id) { return findPlayer(id); });
  if (recentIds.length) {
    html += '<div class="sheet-sec">さいきんマネした選手</div>';
    recentIds.slice(0, 6).forEach(function (id) { html += pickRow(findPlayer(id), pc[id]); });
  }

  /* 大会べつ */
  WBC_YEARS.forEach(function (y) {
    const group = list.filter(function (p) { return (p.wbcYears || []).indexOf(y) >= 0; });
    if (!group.length) return;
    html += '<div class="sheet-sec">' + y + ' WBC 侍ジャパン</div>';
    group.forEach(function (p) { html += pickRow(p, pc[p.id]); });
  });

  const legends = list.filter(function (p) { return p.group === 'legend'; });
  if (legends.length) {
    html += '<div class="sheet-sec">レジェンド</div>';
    legends.forEach(function (p) { html += pickRow(p, pc[p.id]); });
  }

  const customs = list.filter(function (p) { return p.custom; });
  if (customs.length) {
    html += '<div class="sheet-sec">追加した選手</div>';
    customs.forEach(function (p) { html += pickRow(p, pc[p.id]); });
  }

  html += '<div style="height:8px"></div>' +
    '<button class="btn btn-sub" data-action="add-player-form">➕ その他の選手を追加</button>' +
    '<div style="height:8px"></div>' +
    '<button class="btn btn-sub" data-action="close-sheet">とじる</button>';

  openSheet(html);
}

function pickRow(p, col) {
  if (!p) return '';
  return '<button class="pick" data-action="pick" data-id="' + p.id + '">' +
    '<div><div class="pk-name">' + esc(p.name) + '</div><div class="pk-team">' + esc(p.team) + '</div></div>' +
    (col && col.getCount ? '<div class="pk-tag">GET × ' + col.getCount + '</div>' : '') +
    '</button>';
}

/* ---------- 選手の追加フォーム ---------- */
function openAddForm() {
  const kind = view.pick ? view.pick.kind : 'batting';
  openSheet(
    '<h2>その他の選手を追加</h2>' +
    '<div class="sheet-sub">' + (kind === 'batting' ? '打者' : '投手') + 'として追加されます</div>' +
    '<input class="field" id="np-name" placeholder="選手名（れい：山田太郎）" autocomplete="off">' +
    '<input class="field" id="np-team" placeholder="チーム名（れい：阪神タイガース）" autocomplete="off">' +
    '<button class="btn" data-action="add-player">この選手を追加する</button>' +
    '<div style="height:8px"></div>' +
    '<button class="btn btn-sub" data-action="back-picker">もどる</button>'
  );
}

/* ---------- できた／とりけす のメニュー ---------- */
function openDoneMenu(kind, date) {
  const g = activeGame(), r = getRecord(g, date);
  const pid = kind === 'batting' ? r.battingPlayerId : r.pitchingPlayerId;
  const p = findPlayer(pid);
  openSheet(
    '<h2>' + (kind === 'batting' ? '素振り10回' : 'シャドーピッチング10回') + '</h2>' +
    '<div class="sheet-sub">' + (p ? esc(p.name) + 'のマネで できた！' : 'できた！') + '</div>' +
    '<button class="btn btn-sub" data-action="repick" data-kind="' + kind + '" data-date="' + date + '">選手をかえる</button>' +
    '<div style="height:8px"></div>' +
    '<button class="btn btn-sub" data-action="undo" data-kind="' + kind + '" data-date="' + date + '">やっぱり取りけす</button>' +
    '<div style="height:8px"></div>' +
    '<button class="btn btn-sub" data-action="close-sheet">とじる</button>'
  );
}

/* ---------- きのうの記録 ---------- */
function openYesterday() {
  const g = activeGame(), date = addDays(today(), -1);
  const r = getRecord(g, date);
  let html = '<h2>きのう（' + jpDate(date) + '）の記録</h2><div class="sheet-sub">入れわすれは ここから</div>';
  html += challengeCard('batting', '素振り10回', '🏏', r, date);
  html += challengeCard('pitching', 'シャドーピッチング10回', '⚾', r, date);
  if (r && !r.confirmed && recScore(r) >= 1) {
    html += '<button class="btn btn-green" data-action="confirm" data-date="' + date + '">きのうの結果を確定！</button><div style="height:8px"></div>';
  } else if (r && r.confirmed) {
    html += '<div class="hint">きのうは ' + recScore(r) + '点 で確定しています</div>' +
      '<button class="btn btn-sub" data-action="unconfirm" data-date="' + date + '">確定をとりけす</button><div style="height:8px"></div>';
  }
  html += '<button class="btn btn-sub" data-action="close-sheet">とじる</button>';
  openSheet(html);
}

/* ============================================================
   結果の表示
   ============================================================ */
function showDayResult(date) {
  const g = activeGame() || S.games[S.games.length - 1];
  const r = getRecord(g, date) || (S.games.map(function (x) { return x.records[date]; }).filter(Boolean)[0]);
  if (!r) return;
  const pc = playerCollection();
  const gets = [];
  if (r.battingCompleted && r.battingPlayerId) gets.push(r.battingPlayerId);
  if (r.pitchingCompleted && r.pitchingPlayerId) gets.push(r.pitchingPlayerId);

  let html = '<div class="ov-inner">' +
    '<div class="ov-small">' + jpDate(date) + '</div>' +
    taishiFace('ava-big pop') +
    '<div class="ov-big pop">今日 ' + recScore(r) + '点 GET！</div>';
  gets.forEach(function (id) {
    const p = findPlayer(id), c = pc[id];
    if (!p) return;
    html += '<div class="ov-get pop">' + esc(p.name) + ' GET' + (c && c.getCount > 1 ? ' × ' + c.getCount : '') + '！' +
      '<span class="team">' + esc(p.team) + '</span></div>';
  });
  const st = streaks();
  if (st.current >= 2) html += '<div class="ov-mid">🔥 ' + st.current + '日連続！</div>';
  html += '<div class="ov-small">つぎのチャレンジも まってるよ</div>' +
    '<button class="btn" data-action="close-overlay">ホームへ</button></div>';
  $('#overlay').innerHTML = html;
  $('#overlay').hidden = false;
}

function showGameResult(game) {
  const mon = monsterOf(game.monsterId);
  const win = game.result === 'win';
  const pc = playerCollection();
  const used = {};
  Object.keys(game.records).forEach(function (d) {
    const r = game.records[d];
    if (!r.confirmed) return;
    if (r.battingCompleted && r.battingPlayerId) used[r.battingPlayerId] = true;
    if (r.pitchingCompleted && r.pitchingPlayerId) used[r.pitchingPlayerId] = true;
  });
  const st = stats();

  let html = '<div class="ov-inner">' +
    '<div class="ov-small">試合終了</div>' +
    '<div class="ov-mid">泰志 VS ' + esc(mon.name) + '</div>' +
    '<div class="ov-big pop">' + game.finalY + ' - ' + game.finalM + '</div>';

  if (win) {
    html += '<div class="ov-monster pop">' + mon.emoji + '</div>' +
      '<div class="ov-big">VICTORY！</div>' +
      '<div class="ov-mid">モンスターを倒した！</div>' +
      '<div class="ov-get pop">' + esc(mon.name) + ' GET！<span class="team">モンスター図鑑にくわわった</span></div>';
  } else {
    html += '<div class="ov-monster">' + mon.emoji + '</div>' +
      '<div class="ov-mid">今回はモンスターの勝ち！<br>次の試合でもう一度チャレンジ！</div>';
  }

  const names = Object.keys(used).map(function (id) { const p = findPlayer(id); return p ? p.name : null; }).filter(Boolean);
  if (names.length) {
    html += '<div class="ov-small">この試合でマネした選手</div>' +
      '<div class="ov-get">' + names.map(esc).join('・') + '</div>';
  }
  html += '<div class="ov-mid">最高 ' + st.streakBest + '日連続！</div>';
  html += '<button class="btn" data-action="close-overlay">つぎの試合へ！</button></div>';

  $('#overlay').innerHTML = html;
  $('#overlay').hidden = false;
}

function closeOverlay() {
  $('#overlay').hidden = true;
  $('#overlay').innerHTML = '';
  checkGameResult();
}

/* まだ見せていない試合結果があれば見せる */
function checkGameResult() {
  syncGames();
  const pending = S.games.find(function (g) {
    return g.status === 'finished' && S.settings.seenResults.indexOf(g.id) < 0;
  });
  if (pending) {
    S.settings.seenResults.push(pending.id);
    save();
    showGameResult(pending);
    return true;
  }
  render();
  return false;
}

/* ============================================================
   操作
   ============================================================ */
function actDone() {
  if (!view.pick || !view.pick.playerId) return;
  const g = activeGame();
  const date = view.pick.date, kind = view.pick.kind, pid = view.pick.playerId;
  if (!canEdit(g, date)) { closeSheet(); render(); return; }
  const r = ensureRecord(g, date);
  if (kind === 'batting') { r.battingCompleted = true; r.battingPlayerId = pid; }
  else { r.pitchingCompleted = true; r.pitchingPlayerId = pid; }
  /* さいきん使った選手 */
  const lp = S.settings.lastPicked[kind] || [];
  S.settings.lastPicked[kind] = [pid].concat(lp.filter(function (x) { return x !== pid; })).slice(0, 8);
  save();
  closeSheet();
  if (date !== today()) { openYesterday(); }
  render();
}

function actConfirm(date) {
  const g = activeGame();
  if (!g || !canEdit(g, date)) return;
  const r = getRecord(g, date);
  if (!r || r.confirmed) return;
  r.confirmed = true;
  save();
  closeSheet();
  render();
  showDayResult(date);
}

function actUnconfirm(date) {
  const g = activeGame();
  if (!g || !canEdit(g, date)) return;
  const r = getRecord(g, date);
  if (!r) return;
  r.confirmed = false;
  save();
  closeSheet();
  render();
}

function actUndo(kind, date) {
  const g = activeGame();
  if (!g || !canEdit(g, date)) return;
  const r = getRecord(g, date);
  if (!r) return;
  if (kind === 'batting') { r.battingCompleted = false; r.battingPlayerId = null; }
  else { r.pitchingCompleted = false; r.pitchingPlayerId = null; }
  if (recScore(r) === 0) r.confirmed = false;
  save();
  closeSheet();
  if (date !== today()) openYesterday();
  render();
}

function actAddPlayer() {
  const name = ($('#np-name').value || '').trim();
  const team = ($('#np-team').value || '').trim();
  if (!name) { $('#np-name').focus(); return; }
  const kind = view.pick ? view.pick.kind : 'batting';
  const p = {
    id: 'custom_' + Date.now(),
    name: name,
    team: team || 'チームなし',
    type: kind === 'batting' ? 'batter' : 'pitcher',
    wbcYears: [],
    group: 'custom',
    custom: true
  };
  S.customPlayers.push(p);
  save();
  openPicker(kind, view.pick ? view.pick.date : today(), p.id);
}

function actStart() {
  S.settings.started = true;
  S.settings.startedAt = today();
  newGame(today());
  save();
  render();
}

/* ============================================================
   クリックの受付（1か所でまとめて処理）
   ============================================================ */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;

  if (a === 'start-game') return actStart();
  if (a === 'go') { view.screen = el.dataset.screen; render(); return; }
  if (a === 'close-sheet') { closeSheet(); render(); return; }
  if (a === 'close-overlay') return closeOverlay();
  if (a === 'ptab') { view.playerTab = el.dataset.tab; renderPlayers(); return; }

  if (a === 'challenge') {
    const kind = el.dataset.kind, date = el.dataset.date;
    const g = activeGame(), r = getRecord(g, date);
    const done = r && (kind === 'batting' ? r.battingCompleted : r.pitchingCompleted);
    if (done) openDoneMenu(kind, date);
    else openPicker(kind, date, null);
    return;
  }
  if (a === 'pick') { const k = view.pick; openPicker(k.kind, k.date, el.dataset.id); return; }
  if (a === 'clear-pick') { const k = view.pick; openPicker(k.kind, k.date, null); return; }
  if (a === 'done') return actDone();
  if (a === 'add-player-form') return openAddForm();
  if (a === 'add-player') return actAddPlayer();
  if (a === 'back-picker') { const k = view.pick; openPicker(k.kind, k.date, null); return; }
  if (a === 'repick') { openPicker(el.dataset.kind, el.dataset.date, null); return; }
  if (a === 'undo') return actUndo(el.dataset.kind, el.dataset.date);
  if (a === 'confirm') return actConfirm(el.dataset.date);
  if (a === 'unconfirm') return actUnconfirm(el.dataset.date);
  if (a === 'edit-yesterday') return openYesterday();
});

/* 日付が変わったときのために、もどってきたら作り直す */
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) { load(); render(); }
});

/* ============================================================
   起動
   ============================================================ */
/* スタート画面。写真があればカードを出す */
if (TAISHI_CARD) {
  const v = $('#start-visual');
  if (v) v.innerHTML = '<img class="start-card" src="' + TAISHI_CARD + '" alt="泰志のカード">';
}

load();
if (S.settings.started) { checkGameResult(); } else { render(); }

/* PWA（ホーム画面に追加／オフライン） */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* 失敗してもアプリは動く */ });
  });
}
