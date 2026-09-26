/* ============================================================
   players.js  —  選手マスタ
   ------------------------------------------------------------
   ここに選手を足すだけで、アプリの選択肢とコレクションに
   自動で追加されます。（アプリ本体は触らなくてOK）

   id        : 世界で1つの名前（英数字とアンダースコアだけ）
   name      : 選手名
   team      : 所属チーム（WBCの選手は「その大会当時」のチーム）
   type      : "batter"（打者） / "pitcher"（投手） / "both"（両方）
   wbcYears  : 出場したWBCの年（複数可）。WBC以外の選手は []
   group     : "wbc" / "legend" など。表示タブの仕分けに使用
   ============================================================ */

const PLAYERS = [
  /* ---------------- 2006 WBC（初代王者） ---------------- */
  { id: "ichiro",           name: "イチロー",     team: "シアトル・マリナーズ",       type: "batter",  wbcYears: [2006, 2009], group: "wbc" },
  { id: "matsuzaka_2006",   name: "松坂大輔",     team: "西武ライオンズ",             type: "pitcher", wbcYears: [2006],       group: "wbc" },
  { id: "uehara_2006",      name: "上原浩治",     team: "読売ジャイアンツ",           type: "pitcher", wbcYears: [2006],       group: "wbc" },
  { id: "otsuka_2006",      name: "大塚晶則",     team: "テキサス・レンジャーズ",     type: "pitcher", wbcYears: [2006],       group: "wbc" },
  { id: "watanabe_2006",    name: "渡辺俊介",     team: "千葉ロッテマリーンズ",       type: "pitcher", wbcYears: [2006],       group: "wbc" },
  { id: "wada_2006",        name: "和田毅",       team: "福岡ソフトバンクホークス",   type: "pitcher", wbcYears: [2006],       group: "wbc" },
  { id: "matsunaka_2006",   name: "松中信彦",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2006],       group: "wbc" },
  { id: "ogasawara_2006",   name: "小笠原道大",   team: "北海道日本ハムファイターズ", type: "batter",  wbcYears: [2006],       group: "wbc" },
  { id: "fukudome_2006",    name: "福留孝介",     team: "中日ドラゴンズ",             type: "batter",  wbcYears: [2006],       group: "wbc" },
  { id: "satozaki_2006",    name: "里崎智也",     team: "千葉ロッテマリーンズ",       type: "batter",  wbcYears: [2006],       group: "wbc" },
  { id: "kawasaki_2006",    name: "川崎宗則",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2006],       group: "wbc" },
  { id: "tamura_2006",      name: "多村仁",       team: "横浜ベイスターズ",           type: "batter",  wbcYears: [2006],       group: "wbc" },
  { id: "miyamoto_2006",    name: "宮本慎也",     team: "東京ヤクルトスワローズ",     type: "batter",  wbcYears: [2006],       group: "wbc" },

  /* ---------------- 2009 WBC（連覇） ---------------- */
  { id: "matsuzaka_2009",   name: "松坂大輔",     team: "ボストン・レッドソックス",   type: "pitcher", wbcYears: [2009],       group: "wbc" },
  { id: "darvish_2009",     name: "ダルビッシュ有", team: "北海道日本ハムファイターズ", type: "pitcher", wbcYears: [2009],     group: "wbc" },
  { id: "iwakuma_2009",     name: "岩隈久志",     team: "東北楽天ゴールデンイーグルス", type: "pitcher", wbcYears: [2009],     group: "wbc" },
  { id: "fujikawa_2009",    name: "藤川球児",     team: "阪神タイガース",             type: "pitcher", wbcYears: [2009],       group: "wbc" },
  { id: "sugiuchi_2009",    name: "杉内俊哉",     team: "福岡ソフトバンクホークス",   type: "pitcher", wbcYears: [2009],       group: "wbc" },
  { id: "jojima_2009",      name: "城島健司",     team: "シアトル・マリナーズ",       type: "batter",  wbcYears: [2009],       group: "wbc" },
  { id: "aoki_2009",        name: "青木宣親",     team: "東京ヤクルトスワローズ",     type: "batter",  wbcYears: [2009],       group: "wbc" },
  { id: "inaba_2009",       name: "稲葉篤紀",     team: "北海道日本ハムファイターズ", type: "batter",  wbcYears: [2009],       group: "wbc" },
  { id: "uchikawa_2009",    name: "内川聖一",     team: "横浜ベイスターズ",           type: "batter",  wbcYears: [2009],       group: "wbc" },
  { id: "murata_2009",      name: "村田修一",     team: "横浜ベイスターズ",           type: "batter",  wbcYears: [2009],       group: "wbc" },
  { id: "nakajima_2009",    name: "中島裕之",     team: "埼玉西武ライオンズ",         type: "batter",  wbcYears: [2009],       group: "wbc" },
  { id: "ogasawara_2009",   name: "小笠原道大",   team: "読売ジャイアンツ",           type: "batter",  wbcYears: [2009],       group: "wbc" },

  /* ---------------- 2013 WBC ---------------- */
  { id: "tanaka_2013",      name: "田中将大",     team: "東北楽天ゴールデンイーグルス", type: "pitcher", wbcYears: [2013],     group: "wbc" },
  { id: "maeda_2013",       name: "前田健太",     team: "広島東洋カープ",             type: "pitcher", wbcYears: [2013],       group: "wbc" },
  { id: "nomi_2013",        name: "能見篤史",     team: "阪神タイガース",             type: "pitcher", wbcYears: [2013],       group: "wbc" },
  { id: "settsu_2013",      name: "摂津正",       team: "福岡ソフトバンクホークス",   type: "pitcher", wbcYears: [2013],       group: "wbc" },
  { id: "sugiuchi_2013",    name: "杉内俊哉",     team: "読売ジャイアンツ",           type: "pitcher", wbcYears: [2013],       group: "wbc" },
  { id: "abe_2013",         name: "阿部慎之助",   team: "読売ジャイアンツ",           type: "batter",  wbcYears: [2013],       group: "wbc" },
  { id: "sakamoto_2013",    name: "坂本勇人",     team: "読売ジャイアンツ",           type: "batter",  wbcYears: [2013],       group: "wbc" },
  { id: "toritani_2013",    name: "鳥谷敬",       team: "阪神タイガース",             type: "batter",  wbcYears: [2013],       group: "wbc" },
  { id: "uchikawa_2013",    name: "内川聖一",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2013],       group: "wbc" },
  { id: "itoi_2013",        name: "糸井嘉男",     team: "オリックス・バファローズ",   type: "batter",  wbcYears: [2013],       group: "wbc" },
  { id: "nakata_2013",      name: "中田翔",       team: "北海道日本ハムファイターズ", type: "batter",  wbcYears: [2013],       group: "wbc" },
  { id: "ibata_2013",       name: "井端弘和",     team: "中日ドラゴンズ",             type: "batter",  wbcYears: [2013],       group: "wbc" },

  /* ---------------- 2017 WBC ---------------- */
  { id: "sugano_2017",      name: "菅野智之",     team: "読売ジャイアンツ",           type: "pitcher", wbcYears: [2017],       group: "wbc" },
  { id: "norimoto_2017",    name: "則本昂大",     team: "東北楽天ゴールデンイーグルス", type: "pitcher", wbcYears: [2017],     group: "wbc" },
  { id: "fujinami_2017",    name: "藤浪晋太郎",   team: "阪神タイガース",             type: "pitcher", wbcYears: [2017],       group: "wbc" },
  { id: "makita_2017",      name: "牧田和久",     team: "埼玉西武ライオンズ",         type: "pitcher", wbcYears: [2017],       group: "wbc" },
  { id: "matsui_2017",      name: "松井裕樹",     team: "東北楽天ゴールデンイーグルス", type: "pitcher", wbcYears: [2017],     group: "wbc" },
  { id: "kobayashi_2017",   name: "小林誠司",     team: "読売ジャイアンツ",           type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "sakamoto_2017",    name: "坂本勇人",     team: "読売ジャイアンツ",           type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "kikuchi_r_2017",   name: "菊池涼介",     team: "広島東洋カープ",             type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "yamada_2017",      name: "山田哲人",     team: "東京ヤクルトスワローズ",     type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "tsutsugo_2017",    name: "筒香嘉智",     team: "横浜DeNAベイスターズ",       type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "aoki_2017",        name: "青木宣親",     team: "ヒューストン・アストロズ",   type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "akiyama_2017",     name: "秋山翔吾",     team: "埼玉西武ライオンズ",         type: "batter",  wbcYears: [2017],       group: "wbc" },
  { id: "matsuda_2017",     name: "松田宣浩",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2017],       group: "wbc" },

  /* ---------------- 2023 WBC（世界一） ---------------- */
  { id: "ohtani_2023",      name: "大谷翔平",     team: "ロサンゼルス・エンゼルス",   type: "both",    wbcYears: [2023],       group: "wbc" },
  { id: "darvish_2023",     name: "ダルビッシュ有", team: "サンディエゴ・パドレス",   type: "pitcher", wbcYears: [2023],       group: "wbc" },
  { id: "yamamoto_2023",    name: "山本由伸",     team: "オリックス・バファローズ",   type: "pitcher", wbcYears: [2023],       group: "wbc" },
  { id: "sasaki_2023",      name: "佐々木朗希",   team: "千葉ロッテマリーンズ",       type: "pitcher", wbcYears: [2023],       group: "wbc" },
  { id: "imanaga_2023",     name: "今永昇太",     team: "横浜DeNAベイスターズ",       type: "pitcher", wbcYears: [2023],       group: "wbc" },
  { id: "takahashi_2023",   name: "高橋宏斗",     team: "中日ドラゴンズ",             type: "pitcher", wbcYears: [2023],       group: "wbc" },
  { id: "togo_2023",        name: "戸郷翔征",     team: "読売ジャイアンツ",           type: "pitcher", wbcYears: [2023],       group: "wbc" },
  { id: "murakami_2023",    name: "村上宗隆",     team: "東京ヤクルトスワローズ",     type: "batter",  wbcYears: [2023],       group: "wbc" },
  { id: "yoshida_2023",     name: "吉田正尚",     team: "ボストン・レッドソックス",   type: "batter",  wbcYears: [2023],       group: "wbc" },
  { id: "kondo_2023",       name: "近藤健介",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2023],       group: "wbc" },
  { id: "nootbaar_2023",    name: "ラーズ・ヌートバー", team: "セントルイス・カージナルス", type: "batter", wbcYears: [2023],  group: "wbc" },
  { id: "okamoto_2023",     name: "岡本和真",     team: "読売ジャイアンツ",           type: "batter",  wbcYears: [2023],       group: "wbc" },
  { id: "genda_2023",       name: "源田壮亮",     team: "埼玉西武ライオンズ",         type: "batter",  wbcYears: [2023],       group: "wbc" },
  { id: "nakamura_y_2023",  name: "中村悠平",     team: "東京ヤクルトスワローズ",     type: "batter",  wbcYears: [2023],       group: "wbc" },
  { id: "maki_2023",        name: "牧秀悟",       team: "横浜DeNAベイスターズ",       type: "batter",  wbcYears: [2023],       group: "wbc" },

  /* ---------------- 2026 WBC ---------------- */
  { id: "ohtani_2026",      name: "大谷翔平",     team: "ロサンゼルス・ドジャース",   type: "both",    wbcYears: [2026],       group: "wbc" },
  { id: "yamamoto_2026",    name: "山本由伸",     team: "ロサンゼルス・ドジャース",   type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "kikuchi_y_2026",   name: "菊池雄星",     team: "ロサンゼルス・エンゼルス",   type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "sugano_2026",      name: "菅野智之",     team: "コロラド・ロッキーズ",       type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "ito_2026",         name: "伊藤大海",     team: "北海道日本ハムファイターズ", type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "miyagi_2026",      name: "宮城大弥",     team: "オリックス・バファローズ",   type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "takahashi_2026",   name: "高橋宏斗",     team: "中日ドラゴンズ",             type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "taisei_2026",      name: "大勢",         team: "読売ジャイアンツ",           type: "pitcher", wbcYears: [2026],       group: "wbc" },
  { id: "murakami_2026",    name: "村上宗隆",     team: "シカゴ・ホワイトソックス",   type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "okamoto_2026",     name: "岡本和真",     team: "トロント・ブルージェイズ",   type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "suzuki_2026",      name: "鈴木誠也",     team: "シカゴ・カブス",             type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "yoshida_2026",     name: "吉田正尚",     team: "ボストン・レッドソックス",   type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "sato_2026",        name: "佐藤輝明",     team: "阪神タイガース",             type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "morishita_2026",   name: "森下翔太",     team: "阪神タイガース",             type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "kondo_2026",       name: "近藤健介",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "maki_2026",        name: "牧秀悟",       team: "横浜DeNAベイスターズ",       type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "kozono_2026",      name: "小園海斗",     team: "広島東洋カープ",             type: "batter",  wbcYears: [2026],       group: "wbc" },
  { id: "shuto_2026",       name: "周東佑京",     team: "福岡ソフトバンクホークス",   type: "batter",  wbcYears: [2026],       group: "wbc" },

  /* ---------------- レジェンド（WBC以外の名選手） ---------------- */
  { id: "oh_sadaharu",      name: "王貞治",       team: "読売ジャイアンツ",           type: "batter",  wbcYears: [], group: "legend" },
  { id: "nagashima",        name: "長嶋茂雄",     team: "読売ジャイアンツ",           type: "batter",  wbcYears: [], group: "legend" },
  { id: "matsui_hideki",    name: "松井秀喜",     team: "ニューヨーク・ヤンキース",   type: "batter",  wbcYears: [], group: "legend" },
  { id: "nomo",             name: "野茂英雄",     team: "ロサンゼルス・ドジャース",   type: "pitcher", wbcYears: [], group: "legend" },
  { id: "kaneda",           name: "金田正一",     team: "国鉄スワローズ",             type: "pitcher", wbcYears: [], group: "legend" },
  { id: "enatsu",           name: "江夏豊",       team: "阪神タイガース",             type: "pitcher", wbcYears: [], group: "legend" }
];

/* WBCコレクションのタブに出す大会。増やすときはここに足す */
const WBC_YEARS = [2026, 2023, 2017, 2013, 2009, 2006];
