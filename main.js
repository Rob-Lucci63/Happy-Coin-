const AES_KEY = 'SuperStrongKey2025!';
const hasCrypto = typeof CryptoJS !== 'undefined';

// ابزار رمزنگاری
function encrypt(d) { return hasCrypto ? CryptoJS.AES.encrypt(JSON.stringify(d), AES_KEY).toString() : btoa(JSON.stringify(d)); }
function decrypt(c) {
  try {
    if (hasCrypto) {
      const b = CryptoJS.AES.decrypt(c, AES_KEY);
      return JSON.parse(b.toString(CryptoJS.enc.Utf8)) || {};
    } else return JSON.parse(atob(c));
  } catch { return {}; }
}

// ابزار پیغام کوتاه (toast)
function showToast(msg) {
  const div = document.createElement('div');
  div.className = 'toast';
  div.innerText = msg;
  document.body.appendChild(div);
  setTimeout(()=>{ div.style.opacity = 0; setTimeout(()=>div.remove(), 500) }, 2000);
}

// وضعیت بازی
let db = {}, currentUser = null, ai = null;

// بارگذاری وضعیت
function loadState() {
  const stored = localStorage.getItem('hc_enc');
  db = stored ? decrypt(stored) : {};
  const userEnc = localStorage.getItem('hcUser');
  try { currentUser = userEnc ? (hasCrypto ? CryptoJS.AES.decrypt(userEnc, AES_KEY).toString(CryptoJS.enc.Utf8) : atob(userEnc)) : null; } catch{}
}

// ذخیره وضعیت
function saveState() {
  localStorage.setItem('hc_enc', encrypt(db));
  if(currentUser){
    const ue = hasCrypto ? CryptoJS.AES.encrypt(currentUser, AES_KEY).toString() : btoa(currentUser);
    localStorage.setItem('hcUser', ue);
  }
}

function sanitize(str) { return str.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '').substring(0,50); }

// UI ساز
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <section>
      <h2>Happy Coin 🎮</h2>
      <input id="usernameInput" placeholder="اسم خود را وارد کنید" />
      <button class="btn" id="loginBtn">ورود / ثبت‌نام</button>
    </section>
  `;
  document.getElementById('loginBtn').onclick = () => {
    let name = sanitize(document.getElementById('usernameInput').value.trim());
    if(name.length < 2) return showToast('اسم باید حداقل ۲ حرف باشد');
    if(!db[name]) db[name] = {coins:0,black:0,floors:0,dark:false,cheats:[]};
    currentUser = name;
    saveState();
    renderGame();
  };
}

function renderGame() {
  const u = db[currentUser];
  document.getElementById('app').innerHTML = `
    <section>
      <h2>سلام <span>${currentUser}</span>!</h2>
      <canvas id="coinCanvas" width="120" height="120"></canvas>
      <div>سکه: <span id="count">${u.coins}</span> | سیاه: <span id="blackCount">${u.black}</span></div>
      <button class="btn" id="darkModeBtn">تغییر تم</button>
      <button class="btn" id="autoBtn">Auto-Click (۴۵ سیاه)</button>
      <button class="btn" id="cheatBtn">کد تقلب</button>
      <button class="btn" id="logoutBtn">خروج</button>
      <div id="footer">نسخه بهبود یافته | ساخته شده توسط <strong>Rob Lucci</strong></div>
    </section>
  `;
  document.getElementById('coinCanvas').onclick = clickCoin;
  document.getElementById('darkModeBtn').onclick = toggleDark;
  document.getElementById('autoBtn').onclick = buyAuto;
  document.getElementById('cheatBtn').onclick = applyCheat;
  document.getElementById('logoutBtn').onclick = logout;
  document.body.classList.toggle('dark',u.dark);
  drawCoin();
}

function drawCoin() {
  const canvas = document.getElementById('coinCanvas'), ctx = canvas.getContext('2d');
  const cx=60,cy=60,r=50;
  const g=ctx.createRadialGradient(cx-10,cy-10,10,cx,cy,r);
  g.addColorStop(0,'#fff2a8'); g.addColorStop(.5,'#ffd700'); g.addColorStop(1,'#b8860b');
  ctx.clearRect(0,0,120,120);
  ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
  ctx.fillStyle=g; ctx.fill();
  ctx.lineWidth=4; ctx.strokeStyle='#e5c100'; ctx.stroke();
}

function clickCoin() {
  const u = db[currentUser];
  u.coins++;
  if(u.coins%15===0)u.black++;
  saveState();
  document.getElementById('count').innerText = u.coins;
  document.getElementById('blackCount').innerText = u.black;
}

function toggleDark() {
  const u = db[currentUser];
  u.dark = !u.dark;
  saveState();
  document.body.classList.toggle('dark',u.dark);
}

function buyAuto() {
  const u = db[currentUser];
  if(u.black<45) return showToast('سیاه کم است');
  u.black -= 45;
  saveState();
  showToast('Auto-Click فعال شد!');
  // ...
}

function applyCheat() {
  let code = prompt('کد تقلب:');
  if(!code) return;
  code = code.trim().toLowerCase();
  const u = db[currentUser];
  if(u.cheats.includes(code)) return showToast('تکراری');
  if(code==='fff')u.coins+=600;
  else if(code==='ff')u.black+=25;
  else if(code==='cp9'){u.coins+=1000;u.black+=30;}
  else if(code==='ty'){u.coins+=2000;u.black+=50;}
  else return showToast('کد غلط');
  u.cheats.push(code);
  saveState();
  renderGame();
  showToast('اعمال شد');
}

function logout() {
  currentUser = null;
  saveState();
  renderLogin();
}

// شروع
loadState();
if(currentUser && db[currentUser]) renderGame();
else renderLogin();