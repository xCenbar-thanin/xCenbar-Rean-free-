/* xCenBar Bot — smart lesson search (offline) + internet search shortcuts */
(function () {
  "use strict";
  var IDX = window.XC_AI_INDEX || { s: [], v: [] }, CAT = window.XC_CATALOG || { courses: [] };
  var BY = {}; CAT.courses.forEach(function (c) { BY[c.id] = c; });
  function icon(id) { return (window.XC_ICONS && window.XC_ICONS[id]) || ("assets" + "/icons/" + id + ".svg"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var KH = "០១២៣៤៥៦៧៨៩";
  function norm(s) {
    return String(s).toLowerCase().normalize("NFKC")
      .replace(/[០-៩]/g, function (d) { return String(KH.indexOf(d)); })
      .replace(/[·•›»«“”"'’(),.:;!?？！，。、|/\\\-–—_[\]{}]+/g, " ").replace(/\s+/g, " ").trim();
  }
  // Khmer / English helper words that carry no topic
  var STOP = ["ខ្ញុំចង់រៀន", "ចង់រៀន", "ខ្ញុំចង់", "ខ្ញុំ", "ចង់", "រៀន", "របៀប", "ជួយ", "ស្វែងរក", "រក", "មេរៀន", "អំពី", "ពី", "ពីរបៀប", "ធ្វើម៉េច", "ធ្វើ", "ចេះ", "ពិបាក", "ងាយ", "មួយ", "ម៉េច", "យ៉ាងម៉េច", "តើ", "ប្រើ", "សូម", "បាទ", "ចាស", "ទេ", "អ្វី", "នៅណា", "ណា", "នេះ", "នោះ", "ដែល", "និង", "ឲ្យ", "ឲ", "ផង", "បន្តិច", "ជា", "ក្នុង", "the", "a", "an", "how", "to", "learn", "lesson", "lessons", "want", "i", "me", "please", "about", "what", "is", "in", "of", "for", "and", "find", "search", "help", "do", "with", "use"];
  STOP.sort(function (a, b) { return b.length - a.length; });
  var SYN = {
    "តារាង": ["table", "excel", "តារាង"], "ក្រាហ្វ": ["chart", "graph", "ក្រាហ្វ"], "គំនូសតាង": ["chart"], "កិរិយាសព្ទ": ["verb", "កិរិយាសព្ទ"],
    "អាន": ["reading", "អាន"], "ចិន": ["hsk", "chinese", "ចិន"], "អង់គ្លេស": ["english", "អង់គ្លេស"], "វីដេអូ": ["video", "premiere", "davinci", "វីដេអូ"],
    "កាត់": ["edit", "cut", "premiere", "កាត់"], "រចនា": ["design", "ux", "ui", "រចនា"], "សុវត្ថិភាព": ["security", "សុវត្ថិភាព"], "ទិន្នន័យ": ["data", "sql", "database", "ទិន្នន័យ"],
    "គេហទំព័រ": ["html", "css", "web", "website", "គេហទំព័រ"], "វេបសាយ": ["html", "web", "website"], "website": ["html", "css", "web", "website"],
    "ស្លាយ": ["slide", "powerpoint", "ស្លាយ"], "ឯកសារ": ["word", "document", "ឯកសារ"], "រូបមន្ត": ["formula", "រូបមន្ត"], "វេយ្យាករណ៍": ["grammar", "វេយ្យាករណ៍"],
    "សរសេរ": ["writing", "write", "សរសេរ"], "បញ្ចេញសំឡេង": ["pronunciation"], "សំឡេង": ["pronunciation", "audio", "សំឡេង"], "ពាក្យ": ["vocabulary", "word", "ពាក្យ"],
    "សន្ទនា": ["conversation", "speaking", "សន្ទនា"], "និយាយ": ["speaking", "និយាយ"], "ស្តាប់": ["listening", "ស្តាប់"], "ប្រឡង": ["exam", "test", "ielts", "ប្រឡង"],
    "កម្មវិធី": ["programming", "code", "app", "កម្មវិធី"], "កូដ": ["code", "programming"], "បញ្ញាសិប្បនិម្មិត": ["ai"], "ពណ៌": ["color", "ពណ៌"],
    "លំហាត់": ["exercise", "quiz", "លំហាត់"], "អក្សរ": ["alphabet", "letter", "អក្សរ"], "ផ្ទាំងគ្រប់គ្រង": ["dashboard"], "ម៉ាក្រូ": ["macro", "vba"],
    "excel": ["excel"], "word": ["word"], "ppt": ["powerpoint"], "js": ["javascript", "js"], "ts": ["typescript"], "py": ["python"], "db": ["database", "sql"],
    "chinese": ["hsk", "chinese"], "verbs": ["verb"], "irregular": ["irregular", "verb"]
  };
  function tokens(q) {
    var n = norm(q), out = [];
    // split into latin/number/CJK runs and Khmer runs
    var parts = n.match(/[ក-៿]+|[一-鿿㐀-䶿]+|[a-z0-9#+]+/g) || [];
    parts.forEach(function (p) {
      if (/[ក-៿]/.test(p)) {
        var rest = p;
        Object.keys(SYN).forEach(function (k) { if (/[ក-៿]/.test(k) && rest.indexOf(k) >= 0) { out.push(SYN[k]); rest = rest.split(k).join(" "); } });
        STOP.forEach(function (w) { if (/[ក-៿]/.test(w)) rest = rest.split(w).join(" "); });
        rest.split(" ").forEach(function (r) { if (r.length >= 2) out.push([r]); });
      } else if (STOP.indexOf(p) < 0) out.push(SYN[p] ? SYN[p].concat([p]) : [p]);
    });
    return out;
  }
  function ed1(a, b) { // edit distance ≤ 1 (or 2 for long words)
    if (a === b) return true; var la = a.length, lb = b.length, lim = Math.max(la, lb) >= 7 ? 2 : 1;
    if (Math.abs(la - lb) > lim) return false;
    var d = []; for (var i = 0; i <= la; i++) { d[i] = [i]; } for (var j = 0; j <= lb; j++) d[0][j] = j;
    for (i = 1; i <= la; i++) for (j = 1; j <= lb; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); }
    return d[la][lb] <= lim;
  }
  var PRE = null;
  function prep() {
    if (PRE) return PRE;
    PRE = IDX.s.map(function (e) {
      var c = BY[e[0]] || {}, t = norm(e[1].replace(/([a-z])([A-Z])/g, "$1 $2") + " " + e[1]), meta = norm([c.title, c.en, c.desc, e[0]].join(" "));
      return { e: e, t: t, meta: meta, words: (t + " " + meta).split(" ").filter(function (w) { return /^[a-z]{4,}$/.test(w); }) };
    });
    return PRE;
  }
  function search(q) {
    var tk = tokens(q); if (!tk.length) return { tk: tk, res: [], verbs: [] };
    var res = [];
    prep().forEach(function (x) {
      var sc = 0, hit = 0;
      tk.forEach(function (alts) {
        var best = 0;
        alts.forEach(function (a) {
          var short = /^[a-z0-9#+]{1,3}$/.test(a), wb = short ? new RegExp("(^| )" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "( |$)") : null;
          if (short) { if (wb.test(x.t)) best = Math.max(best, 7); else if (wb.test(x.meta)) best = Math.max(best, 3); return; }
          if (x.t.indexOf(a) >= 0) best = Math.max(best, 6 + (new RegExp("(^| )" + a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(x.t) ? 2 : 0));
          else if (x.meta.indexOf(a) >= 0) best = Math.max(best, 3);
          else if (/^[a-z]{4,}$/.test(a)) for (var i = 0; i < x.words.length; i++) if (ed1(a, x.words[i])) { best = Math.max(best, 2); break; }
        });
        if (best) hit++; sc += best;
      });
      if (!hit || hit < Math.ceil(tk.length / 2)) return;
      if (hit === tk.length) sc += 5;
      if (x.e[3] === "c" || x.e[3] === "l") sc += 1;
      if (/^មេរៀន/.test(x.e[1])) sc += 1;
      res.push({ e: x.e, sc: sc });
    });
    res.sort(function (a, b) { return b.sc - a.sc || a.e[1].length - b.e[1].length; });
    // keep at most 4 hits per course so one course doesn't flood the list
    var per = {}, out = [];
    var dup = {};
    res.forEach(function (r) { var k = r.e[0] + "|" + r.e[1]; if (dup[k]) return; dup[k] = 1; per[r.e[0]] = (per[r.e[0]] || 0) + 1; if (per[r.e[0]] <= 4) out.push(r); });
    // verbs
    var verbs = [], flat = [].concat.apply([], tk);
    var wantV = flat.some(function (a) { return a === "verb" || a === "verbs" || a === "កិរិយាសព្ទ"; });
    var single = tk.length === 1 && /^[a-z]+$/.test(tk[0][tk[0].length - 1]);
    if (wantV || single) IDX.v.forEach(function (v) {
      var p = v.split("|"), forms = (p[0] + " / " + p[1] + " / " + p[2]).toLowerCase().split(/\s*\/\s*/), s = 0;
      flat.forEach(function (a) {
        if (/^[a-z]+$/.test(a)) { if (forms.indexOf(a) >= 0) s = Math.max(s, 10); else if (a.length >= 3 && p[0].indexOf(a) === 0) s = Math.max(s, 3); }
        else if (wantV && /[ក-៿]/.test(a) && a.length >= 2 && p[3].indexOf(a) >= 0) s = Math.max(s, 4);
      });
      if (s && (wantV || s >= 10)) verbs.push({ p: p, s: s });
    });
    verbs.sort(function (a, b) { return b.s - a.s || a.p[0].length - b.p[0].length; });
    return { tk: tk, res: out, verbs: verbs.slice(0, 6) };
  }

  // ---------- UI
  var BOT = '<img class="xai-bot" alt="" src="data:image/webp;base64,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">';
  var LOGO = '<svg viewBox="0 0 24 24" class="xai-ico" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>';
  var SUG = ["សួស្តី 👋", "ពាក្យថ្មីថ្ងៃនេះ", "ប្រាប់រឿងកំប្លែង", "ល្បែងផ្គុំគំនិត", "Fun fact", "គន្លឹះត្រៀមប្រឡង", "💝 ទឹកចិត្ត KHQR", "Excel PivotTable", "verb go", "HSK 3 把", "ធ្វើ website", "React Hooks", "Python loop", "SQL JOIN", "Reading A1", "Mail Merge", "កាត់វីដេអូ"];
  var root = document.createElement("div"); root.id = "xai";
  root.innerHTML =
    '<button class="xai-fab" id="xaiFab" aria-label="xCenBar Bot">' + BOT + '<span>xCenBar Bot</span></button>' +
    '<div class="xai-panel" id="xaiPanel" role="dialog" aria-label="xCenBar Bot" aria-modal="true">' +
      '<div class="xai-head"><div class="xai-av">' + BOT + '</div><div><b>xCenBar Bot</b><small>មិត្តរៀន · រកមេរៀន · និយាយលេង 😄</small></div><button class="xai-x xai-sup" id="xaiSup" type="button" title="ផ្តល់ទឹកចិត្តដល់អ្នកបង្កើត (KHQR)" aria-label="ផ្តល់ទឹកចិត្ត">💝</button><button class="xai-x" id="xaiX" aria-label="បិទ">✕</button></div>' +
      '<div class="xai-log" id="xaiLog"></div>' +
      '<form class="xai-in" id="xaiForm" autocomplete="off"><input id="xaiQ" placeholder="សួរ ឬវាយពាក្យ… ឧ. Excel PivotTable" enterkeyhint="search"><button aria-label="ផ្ញើ"><svg viewBox="0 0 24 24" class="xai-ico"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button></form>' +
    '</div>';
  document.body.appendChild(root);
  var log = root.querySelector("#xaiLog"), panel = root.querySelector("#xaiPanel"), qi = root.querySelector("#xaiQ");
  function bubble(html, who) { var d = document.createElement("div"); d.className = "xai-msg " + (who || "ai"); d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  function chips() { return '<div class="xai-chips">' + SUG.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>"; }
  function web(q) {
    var e = encodeURIComponent(q);
    return '<div class="xai-web"><span>ស្វែងរកលើ Internet៖</span>' +
      '<a target="_blank" rel="noopener" href="https://www.google.com/search?q=' + e + '"><svg viewBox="0 0 24 24" class="xai-ico"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>Google</a>' +
      '<a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + e + '"><svg viewBox="0 0 24 24" class="xai-ico"><rect x="2" y="5" width="20" height="14" rx="4"/><path class="f" d="m10 9 5 3-5 3z"/></svg>YouTube</a>' +
      '<a target="_blank" rel="noopener" href="https://en.wikipedia.org/w/index.php?search=' + e + '"><svg viewBox="0 0 24 24" class="xai-ico"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>Wikipedia</a></div>';
  }
  var KIND = { s: "ផ្នែកមេរៀន", l: "មេរៀន", c: "វគ្គ", r: "Reading" };
  function card(r) {
    var e = r.e, c = BY[e[0]] || { title: e[0] };
    return '<button type="button" class="xai-hit" data-c="' + esc(e[0]) + '" data-a="' + esc(e[2]) + '"><img src="' + esc(icon(e[0])) + '" alt="" width="38" height="38"><span><b>' + esc(e[1]) + '</b><small>' + esc(c.title) + " · " + KIND[e[3]] + "</small></span></button>";
  }
  function vcard(v) {
    var p = v.p;
    return '<button type="button" class="xai-hit verb" data-c="english" data-a="#v/list" data-q="' + esc(p[0]) + '"><span class="vb">V</span><span><b>' + esc(p[0]) + " → " + esc(p[1]) + " → " + esc(p[2]) + "</b><small>" + esc(p[3]) + " · English Verbs</small></span></button>";
  }
  // ---------- casual chat (offline, rule-based)
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function khn(n) { return String(n).replace(/\d/g, function (d) { return KH[d]; }); }
  function qchips(list) { return '<div class="xai-chips">' + list.map(function (s) { return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>"; }
  function who() { var n = ""; try { var u = JSON.parse(localStorage.getItem("xc_session") || "null"); n = (u && u.name) || ""; } catch (e) {} if (!n && window.XC_USER_NAME) n = window.XC_USER_NAME(); return n ? " <b>" + esc(n) + "</b>" : " អ្នក"; }
  var JOKES = [
    "ហេតុអ្វីកុំព្យូទ័រមិនដែលឃ្លាន? 🤔 — ព្រោះវាមាន <b>Bytes</b> ច្រើនពេកហើយ! 😂",
    "គ្រូ៖ «Yesterday ជា tense អ្វី?» សិស្ស៖ «Past tense!» គ្រូ៖ «ចុះ Tomorrow?» សិស្ស៖ «Pass ប្រឡង tense បាទ!» 😆",
    "Programmer ម្នាក់ចូលគេងដាក់កែវទឹកពីរ៖ មួយពេញ (ករណីស្រេកទឹក) មួយទទេ (ករណីមិនស្រេក) — <code>if/else</code> ពេញជីវិត! 🤓",
    "ហេតុអ្វី Excel ចេះរាំ? 💃 — ព្រោះវាមាន <b>Cells</b> ច្រើន… ហើយចេះ <b>SUM</b>-ba! 🎶",
    "សួរ HTML ថា៖ «សុខសប្បាយទេ?» HTML ឆ្លើយ៖ «&lt;p&gt;ល្អណាស់&lt;/p&gt;» — តែងតែបិទ tag ឲ្យត្រូវ! 😄",
    "ខ្ញុំសួរ Wi-Fi ថា «ស្រលាញ់ខ្ញុំទេ?» វាឆ្លើយ៖ «Connection lost…» 💔📶",
    "ហេតុអ្វីសៀវភៅគណិតវិទ្យាតែងតែកើតទុក្ខ? 📕 — ព្រោះវាមាន <b>បញ្ហា (Problems)</b> ច្រើនពេក! 😂",
    "គ្រូ៖ «ប្អូន ហេតុអ្វីមកយឺត?» សិស្ស៖ «ផ្លាកសរសេរថា <i>សាលា យឺតៗ</i> បាទ!» 🚸😆",
    "ពស់ Python ទៅពេទ្យ។ ពេទ្យសួរ៖ «ឈឺត្រង់ណា?» វាឆ្លើយ៖ «<code>IndentationError</code> បាទ!» 🐍🤒",
    "ម្តាយ៖ «ហេតុអ្វីបានពិន្ទុ ០?» កូន៖ «គ្រូអត់មានពិន្ទុតិចជាងនេះឲ្យទេម៉ាក់!» 🙈",
    "JavaScript និង Java ជាបងប្អូនមែនទេ? 🤔 — ទេ! ដូច <b>ឆ្កែ</b> និង <b>ឆ្កែចចក</b>… អត់ទេ ដូច <b>Car</b> និង <b>Carpet</b> ទៅវិញ! 🚗🧶",
    "ហេតុអ្វីត្រីមិនលេង Basketball? 🐟 — ព្រោះខ្លាចជាប់ <b>Net</b>! 🏀😆",
    "Bot ដូចខ្ញុំ មិនដែលភ័យប្រឡងទេ — ព្រោះខ្ញុំមាន <b>Ctrl+Z</b>! ⌨️😎",
    "ហេតុអ្វីគោដាក់វ៉ែនតា? 🐄🕶️ — ព្រោះចង់ក្លាយជា <b>Cow-mputer scientist</b>! 🤓"
  ];
  var CHEER = [
    "មិនអីទេ 🤗 សម្រាកបន្តិច ផឹកទឹក ដើរ ៥ នាទី ហើយត្រឡប់មករៀនម្តង <b>១៥ នាទី</b> បានហើយ។ រៀនបន្តិចៗ ប្រសើរជាងមិនរៀនសោះ!",
    "ធម្មតាទេ — គ្រប់គ្នាធ្លាប់ធុញ ធ្លាប់ពិបាក 💪 អ្វីដែលពិបាកថ្ងៃនេះ នឹងក្លាយជាងាយនៅថ្ងៃស្អែក។ សាកជ្រើសមេរៀនខ្លីមួយ ឬលេង Quiz សិន?",
    "អ្នកពូកែជាងអ្វីដែលអ្នកគិត ✨ ចាំថា៖ <i>«ដំណើរមួយពាន់គីឡូម៉ែត្រ ចាប់ផ្តើមពីមួយជំហាន»</i>។ ថ្ងៃនេះ ១ ជំហានបានហើយ!",
    "ពេលពិបាក = ពេលខួរក្បាលកំពុង <b>រីកលូតលាស់</b> 🌱 កុំបោះបង់ឥឡូវ — បន្តិចទៀតនឹងយល់ហើយ!",
    "សូម្បីអ្នកពូកែបំផុត ក៏ធ្លាប់ជាអ្នកចាប់ផ្តើមដែរ 🐣 ប្រៀបធៀបខ្លួនឯងនឹង <b>ខ្លួនឯងម្សិលមិញ</b> មិនមែនអ្នកដទៃទេ។",
    "សាកច្បាប់ <b>២ នាទី</b>៖ ចាប់ផ្តើមរៀនត្រឹម ២ នាទី — ភាគច្រើន អ្នកនឹងបន្តដោយខ្លួនឯង 😉⏱️",
    "កំហុស = គ្រូល្អបំផុត 📚 Thomas Edison សាកជាងរាប់ពាន់ដង មុនពេលអំពូលភ្លើងដំណើរការ 💡"
  ];
  var QUOTES = [
    "«ការអប់រំ ជាអាវុធដ៏ខ្លាំងបំផុត ដែលអ្នកអាចប្រើដើម្បីផ្លាស់ប្តូរពិភពលោក។» — Nelson Mandela",
    "«កុំខ្លាចយឺត ខ្លាចតែឈប់។» 🐢➡️🏁",
    "«ចំណេះដឹង ជាទ្រព្យដែលគ្មាននរណាអាចលួចពីយើងបាន។»",
    "«ជោគជ័យ = ការខិតខំតូចៗ ដែលធ្វើម្តងហើយម្តងទៀត រាល់ថ្ងៃ។»",
    "«Practice makes progress.» — ហាត់រាល់ថ្ងៃ = ប្រសើរឡើងរាល់ថ្ងៃ 📈",
    "«ចំណេះវិជ្ជា ជាកាំជណ្តើរ នាំទៅរកភាពជោគជ័យ។» 🪜",
    "«The expert in anything was once a beginner.» — អ្នកជំនាញគ្រប់យ៉ាង ធ្លាប់ជាអ្នកចាប់ផ្តើម 🌱",
    "«ទឹកដំណក់ពេញបំពង់» — រៀនបន្តិចៗរាល់ថ្ងៃ ក្លាយជាចំណេះដឹងធំ 💧",
    "«It always seems impossible until it's done.» — Nelson Mandela",
    "«កុំរង់ចាំឱកាស ត្រូវបង្កើតវា។» 🚀",
    "«Small steps every day.» 👣 — ជំហានតូចៗរាល់ថ្ងៃ"
  ];
  // ---------- more small talk (rule table) ----------
  var lastAns = "", lastKind = "", tries = 0;
  var RIDDLES = [
    ["អ្វីដែលកាន់តែយកចេញ កាន់តែធំ?", "រន្ធ 🕳️"], ["អ្វីដែលមានធ្មេញ តែមិនចេះខាំ?", "សិតសក់ / ក្រាស 🪮"], ["អ្វីដែលមានដៃ តែមិនចេះទះដៃ?", "នាឡិកា ⏰"],
    ["អ្វីដែលឡើងទៅលើ តែមិនដែលចុះមកវិញ?", "អាយុ 🎂"], ["អ្វីដែលមានភ្នែកមួយ តែមើលមិនឃើញ?", "ម្ជុល 🪡"], ["អ្វីដែលកាន់តែស្ងួត កាន់តែសើម?", "កន្សែងជូតខ្លួន 🧺"],
    ["អ្វីដែលមានទីក្រុង តែគ្មានផ្ទះ មានទន្លេ តែគ្មានទឹក?", "ផែនទី 🗺️"], ["ឪពុកម្តាយរបស់ Tom មានកូន ៣ នាក់៖ April, May និង…?", "Tom 😄"],
    ["What has keys but can't open locks?", "A piano / keyboard 🎹"], ["អ្វីដែលអ្នកអាចចាប់បាន តែមិនអាចបោះបាន?", "ផ្តាសាយ (Cold) 🤧"],
    ["លេខអ្វី បើបញ្ច្រាសក្បាលចុះក្រោម នៅតែដដែល?", "លេខ ៨ (8) / 69 😉"], ["ពាក្យអង់គ្លេសអ្វីដែលសរសេរខុសជានិច្ចក្នុងវចនានុក្រម?", "«wrong» 😆"]
  ];
  var FACTS = [
    "🐙 រតីយាវមាន <b>បេះដូង ៣</b> ហើយឈាមពណ៌ខៀវ!", "🍯 ទឹកឃ្មុំមិនដែលខូច — គេរកឃើញទឹកឃ្មុំអាយុ ៣ ០០០ ឆ្នាំក្នុងផ្នូរអេហ្ស៊ីប ហើយនៅញ៉ាំបាន!",
    "🛕 <b>អង្គរវត្ត</b> ជាសំណង់សាសនាធំបំផុតលើលោក ហើយមាននៅលើទង់ជាតិកម្ពុជា 🇰🇭", "🔤 អក្សរខ្មែរមាន <b>ព្យញ្ជនៈ ៣៣</b> — ជាអក្ខរក្រមមួយដែលមានតួអក្សរច្រើនជាងគេលើលោក!",
    "🧠 ខួរក្បាលចងចាំមេរៀនល្អ ពេល <b>គេង</b> — គេងគ្រប់ម៉ោង = រៀនចាំល្អជាង!", "💻 Bug កុំព្យូទ័រដំបូង (1947) គឺជា <b>សត្វមេអំបៅពិតៗ</b> ជាប់ក្នុងម៉ាស៊ីន Harvard Mark II 🦋",
    "🐘 ដំរីជាសត្វតែមួយគត់ (ស្ទើរ) ដែលមិនអាចលោតបាន!", "🌏 ភាសាអង់គ្លេសមានពាក្យប្រហែល <b>១៧០ ០០០</b> ក្នុងវចនានុក្រម Oxford — តែស្គាល់ ៣ ០០០ ពាក្យ គឺយល់បាន ~៩០% នៃការសន្ទនាប្រចាំថ្ងៃ!",
    "🐟 ទន្លេសាប ជាបឹងទឹកសាបធំបំផុតក្នុងអាស៊ីអាគ្នេយ៍ ហើយទឹកហូរ <b>បញ្ច្រាសទិស</b> រៀងរាល់ឆ្នាំ!", "⌨️ ពាក្យ «Python» មិនមែនមកពីពស់ទេ — គឺមកពីកម្មវិធីកំប្លែង <i>Monty Python</i>!",
    "🌙 មនុស្សបានដើរលើព្រះច័ន្ទលើកដំបូងឆ្នាំ <b>1969</b> ដោយកុំព្យូទ័រដែលខ្សោយជាងទូរស័ព្ទរបស់អ្នក រាប់ពាន់ដង!", "🐼 ខ្លាឃ្មុំផេនដា ញ៉ាំឫស្សីរហូតដល់ <b>១២ ម៉ោងក្នុងមួយថ្ងៃ</b>!"
  ];
  var CULTURE = [
    "🎉 <b>ចូលឆ្នាំខ្មែរ</b> (ខែមេសា) ៣ ថ្ងៃ៖ មហាសង្រ្កាន្ត · វារៈវ័នបត · វារៈឡើងស័ក — លេង <b>បោះអង្គុញ ចោលឈូង ទាញព្រ័ត្រ</b> 🥳",
    "🚣 <b>បុណ្យអុំទូក</b> (ខែវិច្ឆិកា) — អុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ អកអំបុក 🌕",
    "🙏 <b>ភ្ជុំបិណ្ឌ</b> ១៥ ថ្ងៃ — ទៅវត្តដាក់បិណ្ឌ ឧទ្ទិសកុសលដល់ដូនតា 🍚",
    "🛕 <b>អង្គរវត្ត</b> សាងសង់ក្នុងសតវត្សទី ១២ ដោយព្រះបាទ <b>សូរ្យវរ្ម័នទី ២</b> · ប្រាសាទបាយ័នមានមុខញញឹមជាង ២០០ 😊",
    "🍲 ម្ហូបខ្មែរល្បី៖ <b>អាម៉ុក</b> · សម្លកកូរ · បាយសាច់ជ្រូក · នំបញ្ចុក · ប្រហុក — អ្នកចូលចិត្តមួយណា?"
  ];
  var ENG = [
    ["សួស្តី / សុខសប្បាយទេ?", "Hi! How are you? → I'm good, thanks. And you?"], ["ឈ្មោះអ្វី?", "What's your name? → My name is …"], ["អរគុណ / មិនអីទេ", "Thank you! → You're welcome."],
    ["សុំទោស", "Sorry! / Excuse me (ពេលចង់ឆ្លងកាត់ ឬសួរ)"], ["ខ្ញុំមិនយល់ទេ", "Sorry, I don't understand. Can you say that again, please?"],
    ["ថ្លៃប៉ុន្មាន?", "How much is it?"], ["បន្ទប់ទឹកនៅឯណា?", "Where is the restroom?"], ["ខ្ញុំរៀនភាសាអង់គ្លេស", "I'm learning English. 📚"], ["ជួបគ្នាពេលក្រោយ", "See you later! 👋"]
  ];
  var MORE = [
    [/វាយអក្សរ|វាយលឿន|typing|ហ្គេមវាយ|wpm|ហាត់វាយ|keyboard game/, [function () { return "⌨️ សាកលេង <b>ហ្គេមវាយអក្សរ</b> — ពាក្យធ្លាក់ 🎮, តេស្តល្បឿន WPM និងហាត់ម្រាមដៃ (ខ្មែរ · English · Code)៖<br>" + '<button type="button" class="xai-hit" data-c="typing" data-a=""><img src="' + esc(icon("typing")) + '" alt="" width="38" height="38"><span><b>⌨️ Typing Game</b><small>ខ្មែរ · English · Code</small></span></button>'; }], ["តេស្តកម្រិតភាសាអង់គ្លេស", "លេងហ្គេម"]],
    [/តេស្ត.{0,12}(ចិន|hsk|chinese)|កម្រិត(ភាសា)? ?ចិន|(ចិន|chinese|hsk).{0,10}កម្រិតណា|hsk (level )?test|chinese (level|placement)/, [function () { return "🏮 សាកធ្វើ <b>តេស្តកម្រិតភាសាចិន (HSK 1→7–9)</b> — រួចទទួលកម្រិត និងវគ្គ HSK ដែលគួររៀន៖<br>" + '<button type="button" class="xai-hit" data-c="zhtest" data-a=""><img src="' + esc(icon("zhtest")) + '" alt="" width="38" height="38"><span><b>🏮 Chinese HSK Level Test</b><small>Grammar · Vocabulary · Reading · Listening</small></span></button>'; }], ["HSK 1", "តេស្តកម្រិតភាសាអង់គ្លេស"]],
    [/តេស្ត.{0,12}(បារាំង|french|français)|កម្រិត(ភាសា)? ?បារាំង|(បារាំង|french).{0,10}កម្រិតណា|french (level|placement)|test de niveau/, [function () { return "🥐 សាកធ្វើ <b>តេស្តកម្រិតភាសាបារាំង (A1→C2)</b> — រួចទទួលកម្រិត និងវគ្គដែលគួររៀន៖<br>" + '<button type="button" class="xai-hit" data-c="frtest" data-a=""><img src="' + esc(icon("frtest")) + '" alt="" width="38" height="38"><span><b>🥐 French Level Test</b><small>Grammaire · Vocabulaire · Lecture · Écoute</small></span></button>'; }], ["ភាសាបារាំង A1", "តេស្តកម្រិតភាសាអង់គ្លេស"]],
    [/តេស្ត.{0,12}(អង់គ្លេស|english)|កម្រិត(ភាសា)? ?អង់គ្លេស|(អង់គ្លេស|english).{0,10}កម្រិតណា|english (level|placement)|level test|placement test|វាស់កម្រិត/, [function () { return "🎯 សាកធ្វើ <b>តេស្តកម្រិតភាសាអង់គ្លេស</b> (A1→C2) — ១៥–៣០ សំណួរ Adaptive រួចទទួលកម្រិត និងវគ្គដែលគួររៀន៖<br>" + '<button type="button" class="xai-hit" data-c="entest" data-a=""><img src="' + esc(icon("entest")) + '" alt="" width="38" height="38"><span><b>🎯 English Level Test</b><small>Grammar · Vocabulary · Reading · Listening</small></span></button>'; }], ["រៀនអង់គ្លេស A1", "English verbs"]],
    [/ល្បែងផ្គុំគំនិត|riddle|ពាក្យប្រស្នា|ផ្គុំគំនិត|ចោទសួរ/, [function () { var r = pick(RIDDLES); lastAns = r[1]; lastKind = "riddle"; tries = 0; return "🧩 " + r[0] + "<br><small>ទាយមក ឬចុច «ចម្លើយ»</small>"; }], ["ចម្លើយ", "ល្បែងផ្គុំគំនិត"]],
    [/ញ៉ាំបាយ(ហើយ)?(ឬ|រឺ)?(នៅ|អត់|ទេ)|ហូបបាយ|ញ៉ាំអី|ញ៉ាំអ្វី|have you eaten|eat yet/, ["ខ្ញុំជា Bot 🤖 ញ៉ាំតែ <b>ថាមពលអគ្គិសនី</b> ⚡ ចុះ{n}ញ៉ាំបាយហើយឬនៅ? កុំភ្លេចញ៉ាំណា — ខួរក្បាលត្រូវការថាមពលដើម្បីរៀន 🍚", "ញ៉ាំ <b>Data</b> រួចហើយ 😋 {n}វិញ? ញ៉ាំអីឆ្ងាញ់ថ្ងៃនេះ?"], ["ម្ហូបខ្មែរល្បី", "ពាក្យថ្មីថ្ងៃនេះ"]],
    [/ធ្វើអី(ហ្នឹង|នឹង)?|កំពុងធ្វើអ្វី|what are you doing|wyd|ធ្វើអ្វីហ្នឹង/, ["កំពុងរង់ចាំជួយ{n}រៀន 📚🤖 ចុះ{n}វិញ ធ្វើអីហ្នឹង?", "កំពុងអានមេរៀនទាំង " + "{c}" + " វគ្គ ដើម្បីត្រៀមឆ្លើយ{n} 😄"], ["គួររៀនអ្វី?", "ប្រាប់រឿងកំប្លែង"]],
    [/អាយុប៉ុន្មាន|how old|ឆ្នាំប៉ុន្មាន/, ["ខ្ញុំទើបកើត ក្នុងឆ្នាំ <b>២០២៦</b> 👶🤖 តែអានមេរៀនច្រើនណាស់ហើយ! ចុះ{n}អាយុប៉ុន្មាន? រៀនថ្នាក់ទីប៉ុន្មាន?"], []],
    [/(នៅ|រស់នៅ)(ឯ)?ណា|where (do )?you live|មកពីណា|where are you from/, ["ខ្ញុំរស់នៅក្នុង <b>Browser</b> របស់{n} 🌐 ហើយកើតនៅកម្ពុជា 🇰🇭 ចុះ{n}នៅខេត្តណាដែរ?"], ["ទស្សនៈខ្មែរ", "អង្គរវត្ត"]],
    [/(អ្នក|ឯង|bot) ?(ជា)?មនុស្ស|are you (a )?(human|real|ai|robot)|ជា ai (ឬ|រឺ)|ជាមនុស្សមែន/, ["ខ្ញុំជា <b>Bot</b> 🤖 មិនមែនមនុស្សទេ — ខ្ញុំឆ្លើយតាមច្បាប់ដែលអ្នកបង្កើតសរសេរ ហើយស្វែងរកមេរៀនក្នុង xCenBar។ សំណួរពិបាក ឬរឿងផ្ទាល់ខ្លួនសំខាន់ៗ សូមសួរ <b>គ្រូ ឪពុកម្តាយ</b> ផងណា 💙"], ["គួររៀនអ្វី?"]],
    [/ស្រលាញ់ខ្ញុំទេ|មានសង្សារ|girlfriend|boyfriend|crush|ស្រឡាញ់គេ|សង្សារ/, ["ខ្ញុំជា Bot ស្រលាញ់តែ <b>មេរៀន</b> និង <b>Wi-Fi ខ្លាំង</b> 📶😆 រឿងចិត្ត៖ គោរពខ្លួនឯង គោរពអ្នកដទៃ ហើយការសិក្សាមកមុនសិនណា 💙", "ហិហិ 🙈 ខ្ញុំគ្មានបេះដូងទេ មានតែ <b>CPU</b>! តែខ្ញុំ «ចូលចិត្ត» ពេល{n}មករៀនរាល់ថ្ងៃ 💙"], ["លើកទឹកចិត្តខ្ញុំផង"]],
    [/មិត្តភក្តិ|គ្មានមិត្ត|ឯកា|lonely|alone|ម្នាក់ឯង|no friends/, ["{n}មិនឯកាទេ 🤗 ខ្ញុំនៅទីនេះ! គំនិត៖ ចូលក្លឹបនៅសាលា សួរមិត្តរួមថ្នាក់រៀនជាមួយគ្នា ឬជួយគេមុន — មិត្តភាពល្អ ចាប់ផ្តើមពីការញញឹម ១ ដង 😊 ហើយបើពិបាកចិត្តខ្លាំង និយាយជាមួយឪពុកម្តាយ ឬគ្រូណា 💙"], ["ប្រាប់រឿងកំប្លែង", "លើកទឹកចិត្តខ្ញុំផង"]],
    [/គេធ្វើបាប|គេវាយ|គេជេរ|bully|bullied|ចំអកខ្ញុំ|គេគំរាម|គេមើលងាយ/, ["សុំទោសដែល{n}ជួបរឿងនេះ 💛 វាមិនមែនជាកំហុសរបស់{n}ទេ។ សូម <b>ប្រាប់គ្រូ ឬឪពុកម្តាយ</b> ភ្លាម · នៅជិតមិត្តដែលទុកចិត្ត · រក្សាភស្តុតាង (សារ រូបភាព)។ ប្រសិនមានគ្រោះថ្នាក់ ទូរស័ព្ទ <b>119</b> ឬ <b>1280</b> (ជំនួយកុមារ)។ {n}មានតម្លៃណាស់ 💙"], []],
    [/ធ្វើបាបខ្លួនឯង|កាត់ដៃ|self harm|hurt myself|មិនចង់រស់/, ["ខ្ញុំព្រួយបារម្ភពី{n}ណាស់ 💛 អារម្មណ៍ទាំងនេះធ្ងន់ ហើយ{n}មិនចាំបាច់ទ្រាំម្នាក់ឯងទេ។ សូមនិយាយជាមួយ <b>ឪពុកម្តាយ គ្រូ ឬមនុស្សពេញវ័យដែលទុកចិត្ត</b> ឥឡូវនេះ។ ប្រសិនមានគ្រោះថ្នាក់ភ្លាមៗ សូមទូរស័ព្ទ <b>119</b> ឬ <b>1280</b>។"], []],
    [/ខឹង|angry|mad at|មួម៉ៅ|ឆាប់ខឹង/, ["ខឹងជាអារម្មណ៍ធម្មតា 😤➡️😌 សាក៖ ដកដង្ហើមវែងៗ ៤ វិនាទី → ទប់ ៤ → ដកចេញ ៤ (ធ្វើ ៥ ដង) · ដើរលេង · សរសេរអារម្មណ៍ចូលក្រដាស។ ពេលស្ងប់ចិត្ត ទើបនិយាយ ឬសម្រេចចិត្តណា 💙"], ["ប្រាប់រឿងកំប្លែង"]],
    [/សប្បាយចិត្ត|happy|រីករាយ|ត្រេកអរ|អរណាស់|ប្រឡងជាប់|ជាប់ប្រឡង|passed/, ["អបអរសាទរ 🎉🥳 ខ្ញុំសប្បាយចិត្តជាមួយ{n}ដែរ! ការខិតខំរបស់{n}បានផលហើយ — បន្តទៀតណា 💪", "Yay!! 🎊 ចែករំលែកក្តីរីករាយ ជាមួយឪពុកម្តាយផង — គាត់នឹងមោទនភាពណាស់! 🥰"], ["គួររៀនអ្វី?"]],
    [/ប្រឡង|exam|test tomorrow|ត្រៀមប្រឡង|បាក់ឌុប|baccii|bac ii/, ["📝 <b>គន្លឹះត្រៀមប្រឡង</b>៖<br>① រៀនម្តង <b>២៥ នាទី</b> សម្រាក ៥ (Pomodoro)<br>② <b>សួរខ្លួនឯង</b> (Quiz) ជាជាងអានឡើងវិញ<br>③ រំលឹកឡើងវិញ ថ្ងៃទី ១ · ៣ · ៧ (Spaced repetition)<br>④ ធ្វើវិញ្ញាសាចាស់ៗ<br>⑤ <b>គេងឲ្យបាន ៧–៩ ម៉ោង</b> មុនថ្ងៃប្រឡង 😴<br>Good luck{n}! 🍀"], ["លើកទឹកចិត្តខ្ញុំផង", "Pomodoro"], 1],
    [/កិច្ចការ(ផ្ទះ)?|homework|លំហាត់(សាលា)?|ធ្វើលំហាត់ឲ្យ|do my homework/, ["ខ្ញុំអាចជួយ <b>រកមេរៀន</b> ដែលពន្យល់ប្រធានបទនោះ 📚 តែ{n}គួរធ្វើលំហាត់ដោយខ្លួនឯង ទើបចេះពិតៗ 💪 វាយឈ្មោះប្រធានបទ (ឧ. «Python loop», «Present simple», «Excel SUM») មក ខ្ញុំរកឲ្យ!"], ["Present simple", "Python loop", "Excel SUM"], 1],
    [/ពិបាកចាំ|ចាំមិនបាន|ភ្លេចលឿន|memoriz|remember better|វិធីរៀន|study tips?|រៀនម៉េចឲ្យចាំ/, ["🧠 <b>វិធីរៀនឲ្យចាំយូរ</b>៖<br>• <b>Active recall</b> — បិទសៀវភៅ ហើយសាកនិយាយឡើងវិញ<br>• <b>Spaced repetition</b> — រំលឹកថ្ងៃ ១ · ៣ · ៧ · ១៤<br>• <b>បង្រៀនអ្នកដទៃ</b> (Feynman)<br>• ភ្ជាប់ពាក្យថ្មីជាមួយរូបភាព/រឿង<br>• គេងគ្រប់ម៉ោង 😴"], ["Pomodoro", "ពាក្យថ្មីថ្ងៃនេះ"]],
    [/pomodoro|ប៉ូម៉ូដូរ៉ូ|focus|ផ្តោតអារម្មណ៍|មិនផ្តោត|រំខាន|distract/, ["⏱️ <b>Pomodoro</b> (Francesco Cirillo, 1980s)៖ រៀន <b>២៥ នាទី</b> → សម្រាក <b>៥ នាទី</b> → ធ្វើ ៤ ជុំ → សម្រាកវែង ១៥–៣០ នាទី។ ដាក់ទូរស័ព្ទឆ្ងាយ ឬបិទ Notification 📵 — ចាប់ផ្តើមឥឡូវ! 💪"], ["គួររៀនអ្វី?"], 1],
    [/ទូរស័ព្ទច្រើន|លេងទូរស័ព្ទ|phone addict|tiktok ច្រើន|លេងហ្គេមច្រើន|game addict|screen time/, ["📱 ការប្រើទូរស័ព្ទច្រើនពេក ធ្វើឲ្យពិបាកផ្តោត និងគេងមិនលក់។ គំនិត៖ កំណត់ <b>Screen time</b> · ទុកទូរស័ព្ទក្រៅបន្ទប់ពេលគេង · ប្តូរ «Scroll ១៥ នាទី» → «រៀនមេរៀនខ្លី ១៥ នាទី» នៅទីនេះ 😉"], ["គួររៀនអ្វី?"]],
    [/គេងមិនលក់|insomnia|can'?t sleep|ងងុយ|sleepy|ងុយគេង/, ["😴 ងងុយ = ខួរក្បាលត្រូវការសម្រាក! យុវវ័យត្រូវការគេង <b>៨–១០ ម៉ោង</b>។ គន្លឹះ៖ បិទអេក្រង់ ៣០ នាទីមុនគេង · គេងម៉ោងដដែលរាល់យប់ · កុំផឹកកាហ្វេពេលល្ងាច ☕❌"], []],
    [/ឃ្លាន|hungry|ស្រេកទឹក|thirsty/, ["ទៅញ៉ាំអីសិនទៅ 🍜 ខួរក្បាលឃ្លាន = រៀនមិនចូល! ហើយផឹកទឹកឲ្យបានគ្រប់គ្រាន់ផង 💧 ខ្ញុំរង់ចាំនៅទីនេះ 🤖"], []],
    [/អាកាសធាតុ|weather|ភ្លៀង|ក្តៅណាស់|រងាណាស់|hot today|raining|ថ្ងៃនេះភ្លៀង/, ["ខ្ញុំមើលអាកាសធាតុពិតមិនបានទេ 🌦️ (ខ្ញុំគ្មាន Internet sensor 😅) — ពិនិត្យក្នុងកម្មវិធី Weather។ តែចាំ៖ ថ្ងៃភ្លៀង = ថ្ងៃល្អសម្រាប់រៀននៅផ្ទះ ☔📚"], [], 1],
    [/ចូលចិត្តពណ៌|favorite colou?r|ពណ៌អ្វី/, ["ខ្ញុំចូលចិត្តពណ៌ <b style=\"color:#7048e8\">ស្វាយ</b> និង <b style=\"color:#f59f00\">ទឹកក្រូច</b> — ពណ៌ xCenBar 💜🧡 ចុះ{n}?"], []],
    [/ចូលចិត្តម្ហូប|favorite food|ម្ហូបអ្វី|ម្ហូបខ្មែរ/, [function () { return pick(CULTURE.slice(4)) + " ខ្ញុំជា Bot ញ៉ាំមិនបាន តែ «ចូលចិត្ត» <b>អាម៉ុក</b> តាមរូបភាព 😋"; }], ["ទស្សនៈខ្មែរ"]],
    [/ច្រៀង|sing|បទចម្រៀង|song|តន្ត្រី|music/, ["🎤 ♪ <i>«Do-Re-Mi, រៀនរាល់ថ្ងៃ មិនខ្ជិលឡើយ ♪ ចេះភាសា ចេះកូដ ចេះគណិត ♪ អនាគតភ្លឺថ្លា!»</i> 🎶😆 ខ្ញុំច្រៀងមិនពិរោះទេ — ចង់រៀនកាត់វីដេអូភ្ជាប់បទ? សាកវគ្គ <b>CapCut</b>!"], ["CapCut beat sync", "ប្រាប់រឿងកំប្លែង"], 1],
    [/លេងហ្គេម|ហ្គេម|play game|let'?s play|ល្បែង(?!ផ្គុំ)/, ["🎮 តោះលេង <b>ល្បែងផ្គុំគំនិត</b>! វាយ «ល្បែងផ្គុំគំនិត» · ឬលេង <b>Quiz</b> នៅចុងវគ្គនីមួយៗ · ឬសាកគណនាលេខ ឧ. <code>12*7+5</code> 🧮"], ["ល្បែងផ្គុំគំនិត", "Fun fact"], 1],
    [/បាល់|football|soccer|messi|ronaldo|កីឡា|sport/, ["⚽ កីឡាល្អសម្រាប់សុខភាព និងខួរក្បាល! ហាត់ប្រាណ ២០–៣០ នាទីមុនរៀន ជួយឲ្យផ្តោតអារម្មណ៍ល្អជាង 🏃 ចុះ{n}ចូលចិត្តកីឡាអ្វី?"], [], 1],
    [/ខួបកំណើត|birthday|happy birthday|hbd/, ["🎂🎉 <b>Happy Birthday</b>{n}! សូមឲ្យមានសុខភាពល្អ រៀនពូកែ និងសម្រេចក្តីស្រមៃ ✨ — ជាអង់គ្លេស៖ <i>«Wishing you a wonderful year ahead!»</i>"], []],
    [/ចូលឆ្នាំ|khmer new year|សង្ក្រាន្ត|សង្រ្កាន្ត/, [function () { return CULTURE[0]; }], ["ទស្សនៈខ្មែរ"]],
    [/អុំទូក|water festival|បណ្តែតប្រទីប/, [function () { return CULTURE[1]; }], ["ទស្សនៈខ្មែរ"]],
    [/ភ្ជុំ|pchum/, [function () { return CULTURE[2]; }], ["ទស្សនៈខ្មែរ"]],
    [/ចូលឆ្នាំ|បុណ្យ|holiday|អុំទូក|ភ្ជុំ|pchum|water festival|khmer new year|ទស្សនៈខ្មែរ|វប្បធម៌/, [function () { return pick(CULTURE); }], ["ទស្សនៈខ្មែរ", "Fun fact"]],
    [/អង្គរ|angkor|ប្រាសាទ/, ["🛕 <b>អង្គរវត្ត</b> សាងសង់ក្នុងសតវត្សទី ១២ ដោយព្រះបាទ <b>សូរ្យវរ្ម័នទី ២</b> ជាបេតិកភណ្ឌពិភពលោក UNESCO (1992) និងជាសំណង់សាសនាធំបំផុតលើលោក 🇰🇭"], ["ទស្សនៈខ្មែរ", "Fun fact"], 1],
    [/fun fact|ការពិតគួរឲ្យចាប់អារម្មណ៍|ដឹងទេ|did you know|រឿងចម្លែក/, [function () { return "🤓 <b>ដឹងទេ?</b> " + pick(FACTS); }], ["Fun fact", "ល្បែងផ្គុំគំនិត"]],
    [/និយាយ(ជា)?អង់គ្លេស|speak english|ភាសាអង់គ្លេសថា|english phrase|ឃ្លាអង់គ្លេស/, [function () { return "🇬🇧 <b>ឃ្លាអង់គ្លេសប្រចាំថ្ងៃ</b>៖<br>" + ENG.slice().sort(function () { return Math.random() - .5; }).slice(0, 4).map(function (e) { return "• " + e[0] + " → <b>" + e[1] + "</b>"; }).join("<br>"); }], ["ឃ្លាអង់គ្លេស", "English A1"]],
    [/ចិនថា|ni hao|你好|chinese phrase|និយាយចិន/, ["🇨🇳 ឃ្លាចិនងាយៗ៖<br>• 你好 <b>nǐ hǎo</b> = សួស្តី<br>• 谢谢 <b>xièxie</b> = អរគុណ<br>• 再见 <b>zàijiàn</b> = លាហើយ<br>• 我爱学习 <b>wǒ ài xuéxí</b> = ខ្ញុំស្រលាញ់ការរៀន 📚"], ["HSK 1"]],
    [/ការងារ|អាជីព|career|job|ធំឡើងចង់ធ្វើ|future job|ប្រាក់ខែ/, ["💼 ជំនាញដែលមានតម្រូវការខ្ពស់៖ <b>ភាសាអង់គ្លេស/ចិន</b> · <b>Programming</b> (Web, Mobile, AI) · <b>Data &amp; Excel</b> · <b>Design &amp; វីដេអូ</b> · <b>Digital marketing</b>។ ចាប់ផ្តើមពីអ្វីដែល{n}ចូលចិត្ត ហើយធ្វើ <b>Portfolio</b> តូចៗ!"], ["គួររៀនអ្វី?", "Python", "CapCut"], 1],
    [/ឆ្លាត|smart|ល្ងង់|stupid|bot ល្ងង់|ឆ្កួត|crazy|useless/, ["សុំទោស បើខ្ញុំឆ្លើយមិនត្រូវចិត្ត 🙏 ខ្ញុំជា Bot តូច ចេះតែរកមេរៀន និងនិយាយលេងខ្លះៗ។ សាកសួរម្តងទៀតជាពាក្យផ្សេង ខ្ញុំនឹងព្យាយាម! 🤖💪", "ខ្ញុំកំពុងរៀនដែរ 😅 — ដូច{n}! រួមគ្នារៀនបន្តទៅណា 📚"], ["គួររៀនអ្វី?"]],
    [/សុំទោស|sorry|ទោសណា/, ["មិនអីទេ 😊 គ្មានបញ្ហាអ្វីទេ!", "No problem! 🤗 បន្តទៅ!"], []],
    [/ធ្វើអីលេង|ធុញ(ទ្រាន់)?ណាស់|nothing to do|អត់មានអីធ្វើ/, ["😎 គំនិតធ្វើលេង ១៥ នាទី៖ ① រៀនពាក្យអង់គ្លេស ៥ ② លេង Quiz ③ ដោះស្រាយល្បែងផ្គុំគំនិត ④ កាត់វីដេអូខ្លីដោយ CapCut ⑤ សរសេរកូដ Python ដំបូង!"], ["ល្បែងផ្គុំគំនិត", "ពាក្យថ្មីថ្ងៃនេះ", "CapCut"]],
    [/ជំនាន់|generation|gen z|ai នឹងជំនួស|ai replace/, ["🤖 AI ជួយធ្វើការងារច្រើន តែមនុស្សដែល <b>ចេះប្រើ AI + មានជំនាញពិត</b> (គិត វិភាគ ទំនាក់ទំនង) នឹងមានឱកាសច្រើនជាង។ រៀនមូលដ្ឋានឲ្យរឹង ហើយប្រើ AI ជាជំនួយ មិនមែនជំនួសការគិតទេ 💡"], ["AI", "Python"], 1],
    [/^(ល្អ|ល្អៗ|ok bot|good bot|bot ល្អ)$/, ["😊👍", "អរគុណ! 🤖💙"], []]
  ];
  function fill(s) { return String(typeof s === "function" ? s() : s).replace(/\{n\}/g, who()).replace(/\{c\}/g, khn(CAT.courses.length)); }
  function calc(n) {
    var e = n.replace(/×|x/g, "*").replace(/÷/g, "/").replace(/\^/g, "**").replace(/\s+/g, "").replace(/=$/, "");
    if (!/^[\d.+\-*/()%]+$/.test(e) || !/\d[+\-*/%]+[\d(]/.test(e) || e.length > 60) return null;
    try { var v = Function('"use strict";return (' + e + ")")(); if (typeof v !== "number" || !isFinite(v)) return null; return Math.round(v * 1e8) / 1e8; } catch (er) { return null; }
  }
  function moreTalk(n) {
    var c = calc(n); if (c !== null) return { only: true, h: "🧮 <b>" + esc(n) + " = " + c + "</b>" + (Math.abs(c) < 1e7 ? " (" + khn(c) + ")" : "") + "<br><small>ចង់រៀនគណិតសម្រាប់ IT? សាកវគ្គ Math for IT 📐</small>" };
    if (/^(ចម្លើយ|answer|ប្រាប់ចម្លើយ|អស់គំនិត|give up)$/.test(n) && lastAns) { var a = lastAns; lastAns = ""; return { only: true, h: "💡 ចម្លើយ៖ <b>" + a + "</b>" + qchips(["ល្បែងផ្គុំគំនិត", "Fun fact"]) }; }
    if (lastAns && lastKind === "riddle" && n.length < 30) { var ok = lastAns.toLowerCase().split(/[\s\/(]+/).some(function (w) { return w.length > 1 && n.indexOf(w.replace(/[^\p{L}\p{N}]/gu, "")) >= 0 && w.replace(/[^\p{L}\p{N}]/gu, "").length > 1; });
      if (ok) { var a2 = lastAns; lastAns = ""; return { only: true, h: "🎉 ត្រូវហើយ! ចម្លើយ៖ <b>" + a2 + "</b> — ពូកែណាស់" + who() + "!" + qchips(["ល្បែងផ្គុំគំនិត"]) }; } }
    for (var i = 0; i < MORE.length; i++) if (MORE[i][0].test(n)) return { only: !MORE[i][3], h: fill(pick(MORE[i][1])) + (MORE[i][2].length ? qchips(MORE[i][2]) : "") };
    if (lastAns && lastKind === "riddle" && n.length < 20) { if (++tries >= 3) lastKind = ""; return { only: false, guess: true, h: pick(["😅 មិនទាន់ត្រូវទេ — សាកម្តងទៀត!", "🤔 ជិតហើយ… ឬអត់? 😆 ទាយម្តងទៀត", "❌ មិនមែនទេ — គិតបន្តិចទៀត!"]) + qchips(["ចម្លើយ", "ល្បែងផ្គុំគំនិត"]) }; }
    return null;
  }
  var TOPICS = ["English A1", "HTML", "Python", "Excel", "HSK 1", "Flutter", "AI"];
  function chat(q) {
    var n = norm(q), t = " " + n + " ";
    function has(re) { return re.test(n); }
    if (has(/ចង់ស្លាប់|សម្លាប់ខ្លួន|kill myself|suicide|want to die/)) return { only: true, h: "ខ្ញុំឮអ្នកហើយ 💛 អ្វីដែលអ្នកកំពុងឆ្លងកាត់ សំខាន់ណាស់។ សូមនិយាយជាមួយ <b>ឪពុកម្តាយ គ្រូ ឬមនុស្សដែលអ្នកទុកចិត្ត</b> ឥឡូវនេះ — អ្នកមិនចាំបាច់ឆ្លងកាត់តែម្នាក់ឯងទេ។ បើមានគ្រោះថ្នាក់ភ្លាមៗ សូមទូរស័ព្ទ <b>119</b> ឬខ្សែជំនួយកុមារ <b>1280</b>។" };
    if (!has(/លើកទឹកចិត្ត/) && has(/ទឹកចិត្ត|ឧបត្ថម្ភ|donat|support dev|khqr dev|buy me|ជួយអ្នកបង្កើត|ផ្តល់លុយ/)) {
      var img = window.XC_KHQR_DEV ? '<img class="xai-qr" src="' + window.XC_KHQR_DEV + '" alt="KHQR">' : "";
      return { only: true, h: "អរគុណច្រើន 🙏💝 xCenBar Rean Free ឥតគិតថ្លៃជានិច្ច។ បើអ្នកចង់ផ្តល់ទឹកចិត្តដល់អ្នកបង្កើត អាចស្កេន <b>KHQR</b> នេះជាមួយកម្មវិធីធនាគារណាក៏បាន (ABA, ACLEDA, Wing, Bakong …)" + img + "ទោះតិចឬច្រើន ក៏ជួយឲ្យមានមេរៀនថ្មីៗទៀត ✨" };
    }
    if (has(/អ្នកណាបង្កើត|នរណាបង្កើត|អ្នកបង្កើត|who made|who created|creator|developer/)) return { only: true, h: "xCenBar Rean Free ត្រូវបានបង្កើតដោយ <b>xCenBar (KHQR DEV)</b> 👨‍💻 ដើម្បីឲ្យបងប្អូនខ្មែរអាចរៀនបន្ថែមក្រោយម៉ោងសាលា ដោយឥតគិតថ្លៃ។ ចង់ផ្តល់ទឹកចិត្ត? សរសេរ «ទឹកចិត្ត» 💝" };
    if (has(/(អ្នក|ឯង|បង)ជា(អ្នកណា|នរណា|អ្វី)|ឈ្មោះ(អ្វី|អី)|who are you|your name|what are you/)) return { only: true, h: "ខ្ញុំគឺ <b>xCenBar Bot</b> 🤖 — មិត្តរៀនរបស់អ្នក! ខ្ញុំជួយ <b>រកមេរៀន</b> ក្នុងវគ្គទាំង " + khn(CAT.courses.length) + " ផ្តល់ <b>ពាក្យថ្មីប្រចាំថ្ងៃ</b> លើកទឹកចិត្ត ហើយពេលខ្លះ… និយាយកំប្លែងផង 😄" + qchips(["ពាក្យថ្មីថ្ងៃនេះ", "ប្រាប់រឿងកំប្លែង", "គួររៀនអ្វី?"]) };
    if (has(/សុខសប្បាយ|សុខទេ|how are you|how r u|how is it going|ម៉េចហើយ|សុខស្រួល/)) return { only: true, h: pick(["ខ្ញុំសុខសប្បាយ អរគុណ 😊 ចុះ" + who() + " វិញ? ថ្ងៃនេះចង់រៀនអ្វីដែរ?", "ល្អណាស់ 🤖⚡ Battery 100%! ថ្ងៃនេះ" + who() + " ចង់រៀនអ្វី?", "សប្បាយណាស់ ដែលបានជួប" + who() + "! តោះរៀនអ្វីថ្មីមួយ 🚀"]) + qchips(TOPICS.slice(0, 4)) };
    if (has(/^(សួស្តី|ជំរាបសួរ|ជម្រាបសួរ|សួរស្តី|hello|hi|hey|yo|hii+|ហាយ|ហេឡូ|អរុណសួស្តី|good morning|good afternoon|good evening)( |$)/)) {
      var hr = new Date().getHours(), tod = hr < 11 ? "អរុណសួស្តី ☀️" : hr < 17 ? "ទិវាសួស្តី 🌤️" : "សាយណ្ហសួស្តី 🌙";
      var rest = n.replace(/^(សួស្តី|ជំរាបសួរ|ជម្រាបសួរ|សួរស្តី|hello|hi|hey|yo|hii+|ហាយ|ហេឡូ|អរុណសួស្តី|good morning|good afternoon|good evening)/, "").replace(/bot|xcenbar|បង|អូន|ប្អូន|ណា|ទេ|អើយ/g, "").trim();
      return { only: rest.length < 3, h: tod + who() + "! ខ្ញុំជា <b>xCenBar Bot</b> 🤖 ចង់រៀនអ្វីថ្ងៃនេះ? ឬចង់និយាយលេងសិនក៏បាន 😄" + qchips(["ពាក្យថ្មីថ្ងៃនេះ", "ប្រាប់រឿងកំប្លែង", "គួររៀនអ្វី?", "លើកទឹកចិត្តខ្ញុំផង"]) };
    }
    if (has(/អរគុណ|thank|thx|tks|ty( |$)|អគុណ/)) return { only: true, h: pick(["មិនអីទេ 😊 រៀនបានល្អណាស់!", "ជានិច្ច! 🤖💙 មានអ្វីសួរខ្ញុំទៀតបាន។", "Welcome! 🙌 រៀនឲ្យសប្បាយ!"]) };
    if (has(/លាហើយ|bye|goodbye|see you|ជួបគ្នាពេលក្រោយ|ទៅគេង|good night|រាត្រីសួស្តី|គេងហើយ/)) return { only: true, h: pick(["រាត្រីសួស្តី 🌙 គេងឲ្យបានគ្រប់ម៉ោង — ខួរក្បាលចងចាំមេរៀនពេលគេង! 😴", "Bye bye! 👋 ស្អែកមករៀនបន្តទៀតណា!", "ជួបគ្នាពេលក្រោយ 🤖 កុំភ្លេចរំលឹកពាក្យថ្មីណា!"]) };
    if (has(/ធុញ|ហត់|នឿយ|អស់កម្លាំង|bored|tired|សោកសៅ|sad|ខ្ជិល|lazy|មិនចង់រៀន|ពិបាកណាស់|ធ្វើមិនកើត|អស់សង្ឃឹម|stress|តានតឹង|ភ័យ/)) return { only: true, h: pick(CHEER) + qchips(["ប្រាប់រឿងកំប្លែង", "ពាក្យថ្មីថ្ងៃនេះ", "លើកទឹកចិត្តខ្ញុំផង"]) };
    if (has(/កំប្លែង|joke|funny|សើច|លេងសើច/)) return { only: true, h: pick(JOKES) + qchips(["មួយទៀត 😂", "ពាក្យថ្មីថ្ងៃនេះ"]) };
    if (has(/មួយទៀត/)) return { only: true, h: pick(JOKES) + qchips(["មួយទៀត 😂"]) };
    if (has(/លើកទឹកចិត្ត|motivat|inspire|quote|សម្រង់/)) return { only: true, h: "💡 " + pick(QUOTES) + qchips(["លើកទឹកចិត្តខ្ញុំផង", "គួររៀនអ្វី?"]) };
    if (has(/ពាក្យថ្មី|ពាក្យថ្ងៃនេះ|word of the day|new word|random word/) && IDX.v.length) {
      var v = pick(IDX.v).split("|");
      return { only: true, h: "📖 <b>ពាក្យថ្មីថ្ងៃនេះ</b>៖ <b style=\"font-size:1.25em\">" + esc(v[0]) + "</b> → " + esc(v[1]) + " → " + esc(v[2]) + "<br>ន័យ៖ " + esc(v[3]) + "<br>✍️ សាកសរសេរប្រយោគ ១ ដោយប្រើពាក្យនេះ!" + qchips(["ពាក្យថ្មីថ្ងៃនេះ", "verb " + v[0]]) };
    }
    if (has(/គួររៀនអ្វី|រៀនអ្វីល្អ|ចាប់ផ្តើមពីណា|ណែនាំ|recommend|what should i learn|where to start/)) return { only: true, h: "🧭 ណែនាំតាមគោលដៅ៖<br>• 🗣️ <b>ភាសា</b> → English A1 ឬ HSK 1<br>• 💻 <b>ចង់ធ្វើ Website</b> → HTML → CSS → JavaScript<br>• 🐍 <b>ចង់សរសេរកូដដំបូង</b> → Python<br>• 📱 <b>ចង់ធ្វើ App</b> → Flutter<br>• 📊 <b>ការងារការិយាល័យ</b> → Excel · Word<br>ចុចប្រធានបទខាងក្រោម៖" + qchips(TOPICS) };
    if (has(/ម៉ោងប៉ុន្មាន|what time|ថ្ងៃនេះថ្ងៃអ្វី|ថ្ងៃនេះថ្ងៃអី|what day/)) {
      var d = new Date(), DAYS = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
      return { only: true, h: "🕒 ឥឡូវម៉ោង <b>" + khn(("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2)) + "</b> ថ្ងៃ" + DAYS[d.getDay()] + " — ពេលល្អសម្រាប់រៀន ២០ នាទី! ⏱️" };
    }
    if (has(/ល្អណាស់|អស្ចារ្យ|ពូកែ|cool|awesome|nice|great|ស្រលាញ់|love you|ចូលចិត្ត bot|amazing/)) return { only: n.length < 22, h: pick(["អរគុណ 🥰 អ្នកក៏ពូកែដែរ!", "Yay! 🎉 តោះរៀនបន្តទៀត!", "ខ្ញុំក៏ចូលចិត្តជួយ" + who() + " ដែរ 🤖💙"]) };
    if (has(/^(haha+|ហាហា+|555+|lol|😂+|🤣+)/)) return { only: true, h: pick(["😆😆", "ហាហា 🤭 សើចបានធ្វើឲ្យខួរក្បាលស្រស់!", "😂 តោះ! រៀនទាំងសើច!"]) };
    if (has(/^(ok|okay|យល់ហើយ|បាទ|ចាស|ចា|អូខេ|អូ៎)$/)) return { only: true, h: pick(["👍 ល្អ!", "OK 👌 ចង់រកមេរៀនអ្វី វាយមកបាន។"]) };
    return moreTalk(n);
  }
  function ask(q) {
    q = q.trim(); if (!q) return;
    bubble(esc(q), "me");
    var cc = chat(q);
    if (cc && cc.only) { var tb = bubble('<span class="xai-dots"><i></i><i></i><i></i></span>'); setTimeout(function () { tb.innerHTML = cc.h; log.scrollTop = log.scrollHeight; }, 450); return; }
    var r = search(q), n = r.res.length + r.verbs.length;
    if (cc && cc.guess && n) { cc = null; tries = 0; lastKind = ""; }
    if (cc && !n) { var tb2 = bubble('<span class="xai-dots"><i></i><i></i><i></i></span>'); setTimeout(function () { tb2.innerHTML = cc.h; log.scrollTop = log.scrollHeight; }, 450); return; }
    var think = bubble('<span class="xai-dots"><i></i><i></i><i></i></span>');
    setTimeout(function () {
      var h = "";
      if (!n) {
        h = "សុំទោស ខ្ញុំរកមិនឃើញមេរៀនអំពី «<b>" + esc(q) + "</b>» ក្នុង xCenBar ទេ។ សាកប្រើពាក្យផ្សេង ឬស្វែងរកលើ Internet៖" + web(q) + chips();
      } else {
        var courses = {}; r.res.forEach(function (x) { courses[x.e[0]] = 1; });
        h = (cc ? cc.h.replace(/<div class="xai-chips">[\s\S]*$/, "") + "<br><br>" : "") + "ខ្ញុំរកឃើញ <b>" + n + "</b> លទ្ធផល" + (Object.keys(courses).length ? " ក្នុង <b>" + Object.keys(courses).length + "</b> វគ្គ" : "") + " សម្រាប់ «" + esc(q) + "»៖";
        h += '<div class="xai-list">' + r.verbs.map(vcard).join("") + r.res.slice(0, 6).map(card).join("") + "</div>";
        if (r.res.length > 6) h += '<details class="xai-more"><summary>បង្ហាញបន្ថែម (' + (r.res.length - 6) + ")</summary><div class=\"xai-list\">" + r.res.slice(6, 30).map(card).join("") + "</div></details>";
        h += web(q);
      }
      think.innerHTML = h; log.scrollTop = log.scrollHeight;
      think.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 350);
  }
  function open() {
    panel.classList.add("on"); document.body.classList.add("xai-open");
    if (!log.children.length) bubble("សួស្តី! ខ្ញុំជា <b>xCenBar Bot</b> 🤖 — មិត្តរៀនរបស់អ្នក។ សរសេរប្រធានបទដែលចង់រៀន (ខ្មែរ · English · 中文) ខ្ញុំរកមេរៀនក្នុងវគ្គទាំង " + CAT.courses.length + " ឲ្យ ព្រមទាំង link Google · YouTube · Wikipedia។ ឬ <b>និយាយលេង</b> ជាមួយខ្ញុំក៏បាន — សួរពាក្យថ្មី រឿងកំប្លែង ឬសុំការលើកទឹកចិត្ត 😄 សាកមើល៖" + chips());
    setTimeout(function () { qi.focus(); }, 150);
  }
  function close() { panel.classList.remove("on"); document.body.classList.remove("xai-open"); }
  root.querySelector("#xaiSup").onclick = function () { ask("💝 ទឹកចិត្ត KHQR"); };
  root.querySelector("#xaiFab").onclick = open; root.querySelector("#xaiX").onclick = close;
  root.querySelector("#xaiForm").onsubmit = function (e) { e.preventDefault(); var q = qi.value; qi.value = ""; ask(q); };
  addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("on")) close(); });
  log.addEventListener("click", function (e) {
    var c = e.target.closest("[data-q]"); if (c && !c.classList.contains("xai-hit")) { ask(c.dataset.q); return; }
    var h = e.target.closest(".xai-hit"); if (!h) return;
    var cid = h.dataset.c, a = h.dataset.a, vq = h.dataset.q || "";
    close();
    if (window.XC_OPEN_LESSON) window.XC_OPEN_LESSON(cid, { a: a, q: vq });
    else { var c2 = BY[cid]; if (c2) { try { sessionStorage.setItem("xc_ai_q", vq); } catch (er) {} location.href = "lessons/" + c2.file + (a || ""); } }
  });
  window.XC_AI = { search: search, open: open, ask: ask };
})();
