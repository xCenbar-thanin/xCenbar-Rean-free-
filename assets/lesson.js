/* injected into every lesson page: home button, login gate, visit + study-time tracking */
(function () {
  var CFG = window.XC_CONFIG || {}, me = document.currentScript, id = me && me.getAttribute("data-id");
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var user = get("xc_session", null);
  if (CFG.REQUIRE_LOGIN && !user) { try { sessionStorage.setItem("xc_next", id); } catch (e) {} location.replace("../index.html#login"); return; }
  var key = "xc_stats_" + (user ? user.uid : "guest");
  function day() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  var s = get(key, {}); s.visits = s.visits || {}; s.daily = s.daily || {}; s.favs = s.favs || {};
  var v = s.visits[id] || { n: 0, first: Date.now(), days: [] };
  v.n++; v.last = Date.now(); if (v.days.indexOf(day()) < 0) v.days = v.days.concat(day()).slice(-60);
  s.visits[id] = v; s.last = id; set(key, s);
  setInterval(function () { if (document.visibilityState !== "visible") return; var t = get(key, {}); t.daily = t.daily || {}; t.daily[day()] = (t.daily[day()] || 0) + 30; set(key, t); }, 30000);
  function addBtn() {
    var a = document.createElement("a");
    a.href = "../index.html#courses"; a.title = "ត្រឡប់ទៅ xCenBar Rean Free";
    a.setAttribute("aria-label", "xCenBar Rean Free");
    a.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:2147483000;width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#7a1d1d,#c9973a);box-shadow:0 6px 18px rgba(0,0,0,.3);display:grid;place-items:center;text-decoration:none;opacity:.92";
    a.innerHTML = '<img src="../assets/logo.svg" alt="" width="34" height="34" style="display:block">';
    document.body.appendChild(a);
  }
  if (document.body) addBtn(); else document.addEventListener("DOMContentLoaded", addBtn);
})();
