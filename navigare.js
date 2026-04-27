const WEB3FORMS_ACCESS_KEY = '12fd20d4-e2f3-4854-a391-2f35e887eb6a';

const LUNI_RO = [
  'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
  'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'
];
const TOATE_ORELE = [
  '08:00','09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00','19:00','20:00'
];

let dataVizualizata = new Date();
let ziSelectata     = null;
let oraSelectata    = null;

const azi = new Date();
azi.setHours(0, 0, 0, 0);

function cheieRezervare(an, luna, zi) {
  return `rezervare_${an}_${luna}_${zi}`;
}

function obtineOreRezervate(an, luna, zi) {
  const cheie = cheieRezervare(an, luna, zi);
  try { return JSON.parse(localStorage.getItem(cheie) || '[]'); }
  catch { return []; }
}

function adaugaOraRezervata(an, luna, zi, ora) {
  const cheie = cheieRezervare(an, luna, zi);
  const ore   = obtineOreRezervate(an, luna, zi);
  if (!ore.includes(ora)) ore.push(ora);
  localStorage.setItem(cheie, JSON.stringify(ore));
}

function ziEsteCompletRezervata(an, luna, zi) {
  return obtineOreRezervate(an, luna, zi).length >= TOATE_ORELE.length;
}

// ── Calendar  ──
function redeazaCalendar(directie) {
  const eticheta       = document.getElementById('cal-month-label');
  const corpCalendar   = document.getElementById('cal-body');
  const containerRadio = document.getElementById('cal-radios');
  const afisajData     = document.getElementById('date-display-val');
  const inputAscuns    = document.getElementById('dateInput');
  const stilDinamic    = document.getElementById('cal-dynamic-css');
  const grilaOre       = document.getElementById('grila-ore');
  const inputOraAscuns = document.getElementById('oraInput');

  if (!eticheta || !corpCalendar) return;

  const an   = dataVizualizata.getFullYear();
  const luna = dataVizualizata.getMonth();

  eticheta.textContent = LUNI_RO[luna] + ' ' + an;

  const primaZi  = new Date(an, luna, 1).getDay();
  const decalaj  = primaZi === 0 ? 6 : primaZi - 1;
  const zileLuna = new Date(an, luna + 1, 0).getDate();

  let celule = Array(decalaj).fill(null);
  for (let z = 1; z <= zileLuna; z++) {
    const data = new Date(an, luna, z);
    data.setHours(0, 0, 0, 0);
    let tip;
    if (+data === +azi)                           tip = 'azi';
    else if (data < azi)                          tip = 'trecuta';
    else if (ziEsteCompletRezervata(an, luna, z)) tip = 'rezervata';
    else                                          tip = 'disponibila';
    celule.push({ z, tip });
  }
  while (celule.length % 7 !== 0) celule.push(null);

  corpCalendar.innerHTML   = '';
  containerRadio.innerHTML = '';
  const selectabile = [];

  for (let r = 0; r < celule.length / 7; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 7; c++) {
      const celula = celule[r * 7 + c];
      const td     = document.createElement('td');

      if (!celula) {
        td.className = 'zi-goala';
      } else if (celula.tip === 'rezervata') {
        td.className = 'zi-rezervata';
        td.innerHTML = `<span>${celula.z}</span>`;
      } else if (celula.tip === 'trecuta') {
        td.className = 'zi-trecuta';
        td.textContent = celula.z;
      } else {
        const id  = `zi-${an}-${luna}-${celula.z}`;
        const cls = celula.tip === 'azi' ? 'zi-selectabila zi-azi' : 'zi-selectabila';
        td.className = cls;
        td.innerHTML = `<label for="${id}">${celula.z}</label>`;
        selectabile.push({ id, z: celula.z, an, luna });
      }
      tr.appendChild(td);
    }
    corpCalendar.appendChild(tr);
  }

  let cssDinamic = '';
  selectabile.forEach(({ id, z, an, luna }) => {
    const inp     = document.createElement('input');
    inp.type      = 'radio';
    inp.name      = 'zi-selectata';
    inp.id        = id;
    inp.className = 'radio-calendar';
    inp.value     = `${z} ${LUNI_RO[luna]} ${an}`;

    inp.addEventListener('change', () => {
      ziSelectata  = { z, luna, an };
      oraSelectata = null;

      if (afisajData) {
        afisajData.textContent    = inp.value;
        afisajData.style.fontStyle = 'normal';
        afisajData.style.color    = 'var(--crem)';
      }
      if (inputAscuns) {
        inputAscuns.value = `${an}-${String(luna + 1).padStart(2, '0')}-${String(z).padStart(2, '0')}`;
      }
      redeazaGrilaOre(an, luna, z);
    });

    containerRadio.appendChild(inp);

    cssDinamic += `
#${id}:checked ~ .cal-table td.zi-selectabila label[for="${id}"] {
  background: var(--auriu); color: var(--fundal-inchis); font-weight: 600; box-shadow: none;
}
#${id}:checked ~ .cal-table td.zi-selectabila label[for="${id}"]::after { opacity: 0; }
`;
  });
  if (stilDinamic) stilDinamic.textContent = cssDinamic;

  if (directie) {
    ziSelectata  = null;
    oraSelectata = null;
    if (afisajData) {
      afisajData.textContent    = 'Selectați din calendar';
      afisajData.style.fontStyle = 'italic';
      afisajData.style.color    = 'var(--gri-cald)';
    }
    if (inputAscuns)    inputAscuns.value    = '';
    if (grilaOre)       grilaOre.innerHTML   = '';
    if (inputOraAscuns) inputOraAscuns.value = '';

    const etichetaOre = document.getElementById('eticheta-ore');
    if (etichetaOre) etichetaOre.style.display = 'none';
  }

  if (directie && corpCalendar) {
    const x = directie === 'inainte' ? '-18px' : '18px';
    corpCalendar.animate(
      [{ opacity: 0.3, transform: `translateX(${x})` },
       { opacity: 1,   transform: 'translateX(0)'    }],
      { duration: 260, easing: 'ease-out', fill: 'forwards' }
    );
  }
}

// ── Grila ore ──
function redeazaGrilaOre(an, luna, zi) {
  const grilaOre       = document.getElementById('grila-ore');
  const inputOraAscuns = document.getElementById('oraInput');
  if (!grilaOre) return;

  const oreRezervate = obtineOreRezervate(an, luna, zi);
  grilaOre.innerHTML = '';

  const etichetaOre = document.getElementById('eticheta-ore');
  if (etichetaOre) etichetaOre.style.display = 'block';

  TOATE_ORELE.forEach(ora => {
    const slot       = document.createElement('div');
    slot.className   = 'slot-ora';
    slot.textContent = ora;

    const esteAzi = ziSelectata &&
      ziSelectata.z    === azi.getDate()  &&
      ziSelectata.luna === azi.getMonth() &&
      ziSelectata.an   === azi.getFullYear();

    const oraTrecuta = esteAzi && parseInt(ora) <= new Date().getHours();

    if (oreRezervate.includes(ora) || oraTrecuta) {
      slot.classList.add('rezervat');
    } else {
      slot.addEventListener('click', () => {
        grilaOre.querySelectorAll('.slot-ora.selectat').forEach(s => s.classList.remove('selectat'));
        slot.classList.add('selectat');
        oraSelectata = ora;
        if (inputOraAscuns) inputOraAscuns.value = ora;
      });
    }
    grilaOre.appendChild(slot);
  });
}

document.addEventListener('DOMContentLoaded', () => {

  // ── Navigare activa ──
  const paginaCurenta = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href').split('#')[0].split('/').pop();
    if (href === paginaCurenta) a.classList.add('activ');
  });

  // ── Porneste calendarul doar daca e pe pagina Rezervari ──
  if (!document.getElementById('cal-month-label')) return;

  let captchaA = Math.floor(Math.random() * 9) + 1;
  let captchaB = Math.floor(Math.random() * 9) + 1;
  const captchaIntrebare = document.getElementById('captcha-intrebare');
  if (captchaIntrebare) captchaIntrebare.textContent = `Cât face ${captchaA} + ${captchaB}?`;

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    const candidat = new Date(dataVizualizata);
    candidat.setMonth(candidat.getMonth() - 1);
    const esteInTrecut =
      candidat.getFullYear() < azi.getFullYear() ||
      (candidat.getFullYear() === azi.getFullYear() && candidat.getMonth() < azi.getMonth());
    if (esteInTrecut) return;
    dataVizualizata.setMonth(dataVizualizata.getMonth() - 1);
    redeazaCalendar('inapoi');
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    dataVizualizata.setMonth(dataVizualizata.getMonth() + 1);
    redeazaCalendar('inainte');
  });

  redeazaCalendar(null);

  // ── Persistenta formular ──
  const CAMPURI_FORMULAR = ['nameInput', 'emailInput', 'telefon', 'tipSesiune'];

  function salveazaCamp(id) {
    const el = document.getElementById(id);
    if (!el) return;
    ['input', 'change'].forEach(ev =>
      el.addEventListener(ev, () => localStorage.setItem(`form_${id}`, JSON.stringify(el.value)))
    );
  }

  function reincarcaFormular() {
    CAMPURI_FORMULAR.forEach(id => {
      const el  = document.getElementById(id);
      const raw = localStorage.getItem(`form_${id}`);
      if (el && raw !== null) {
        try { el.value = JSON.parse(raw); actualizeazaStilCamp(el); } catch { /* ignora */ }
      }
    });
  }

  function stergeFormularSalvat() {
    CAMPURI_FORMULAR.forEach(id => localStorage.removeItem(`form_${id}`));
  }

  function actualizeazaStilCamp(el) {
    if (!el) return;
    if (!el.value.trim()) { el.classList.remove('camp-valid', 'camp-invalid'); return; }
    const esteValid = el.checkValidity !== undefined ? el.checkValidity() : true;
    el.classList.toggle('camp-valid',   esteValid);
    el.classList.toggle('camp-invalid', !esteValid);
  }

  function shakeButon(btn) {
    if (!btn) return;
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
    btn.addEventListener('animationend', () => btn.classList.remove('shake'), { once: true });
  }

  CAMPURI_FORMULAR.forEach(id => {
    salveazaCamp(id);
    const el = document.getElementById(id);
    if (!el) return;
    ['input', 'change', 'blur'].forEach(ev => el.addEventListener(ev, () => actualizeazaStilCamp(el)));
  });

  reincarcaFormular();

  // ── Formular rezervare ──
  const form       = document.getElementById('formular-rezervare');
  const btnRezerva = document.getElementById('btn-rezerva');
  const notificare = document.getElementById('notificare');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (document.getElementById('hp')?.value) return;

    const ultimaTrimitere = localStorage.getItem('ultimaTrimitere');
    const acum = Date.now();
    if (ultimaTrimitere && acum - parseInt(ultimaTrimitere) < 60000) {
      afisareMesaj('Vă rugăm așteptați un minut între cereri.', 'eroare');
      return;
    }

    const raspunsCaptcha = parseInt(document.getElementById('captcha-raspuns')?.value);
    if (isNaN(raspunsCaptcha) || raspunsCaptcha !== captchaA + captchaB) {
      afisareMesaj('Răspuns greșit. Vă rugăm încercați din nou.', 'eroare');
      captchaA = Math.floor(Math.random() * 9) + 1;
      captchaB = Math.floor(Math.random() * 9) + 1;
      if (captchaIntrebare) captchaIntrebare.textContent = `Cât face ${captchaA} + ${captchaB}?`;
      const campCaptcha = document.getElementById('captcha-raspuns');
      if (campCaptcha) campCaptcha.value = '';
      return;
    }

    const nume      = document.getElementById('nameInput')?.value.trim();
    const email     = document.getElementById('emailInput')?.value.trim();
    const nrTelefon = document.getElementById('telefon')?.value.trim();
    const serviciu  = document.getElementById('tipSesiune')?.value;
    const data      = document.getElementById('dateInput')?.value;
    const ora       = document.getElementById('oraInput')?.value;

    if (!nume || nume.length < 9) {
      afisareMesaj('Vă rugăm introduceți un nume valid (minim 9 caractere).', 'eroare');
      shakeButon(btnRezerva); return;
    }
    const elTelefon = document.getElementById('telefon');
    if (!elTelefon || !elTelefon.checkValidity()) {
      afisareMesaj('Vă rugăm introduceți un nr. de telefon valid.', 'eroare');
      shakeButon(btnRezerva); return;
    }
    if (!data) {
      afisareMesaj('Vă rugăm selectați o dată din calendar.', 'eroare');
      shakeButon(btnRezerva); return;
    }
    if (!ora) {
      afisareMesaj('Vă rugăm selectați o oră de mai sus.', 'eroare');
      shakeButon(btnRezerva); return;
    }

    btnRezerva.disabled    = true;
    btnRezerva.textContent = 'Se trimite...';

    const dataRezervare = `${ziSelectata.z} ${LUNI_RO[ziSelectata.luna]} ${ziSelectata.an}`;

    try {
      const raspuns = await fetch('https://api.web3forms.com/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject:    `Rezervare nouă — ${serviciu} — ${dataRezervare}, ora ${ora}`,
          from_name:  nume, email, telefon: nrTelefon, serviciu,
          data: dataRezervare, ora,
          mesaj: `Rezervare nouă:\nNume: ${nume}\nEmail: ${email}\nNr. de Contact: ${nrTelefon}\nServiciu: ${serviciu}\nData: ${dataRezervare}\nOra: ${ora}`
        })
      });

      const rezultat = await raspuns.json();

      if (raspuns.ok && rezultat.success) {
        adaugaOraRezervata(ziSelectata.an, ziSelectata.luna, ziSelectata.z, ora);
        localStorage.setItem('ultimaTrimitere', acum.toString());
        stergeFormularSalvat();
        CAMPURI_FORMULAR.forEach(id => document.getElementById(id)?.classList.remove('camp-valid', 'camp-invalid'));
        afisareMesaj(`Rezervare trimisă! Veți fi contactat în 24 ore. (${dataRezervare}, ora ${ora})`, 'succes');
        form.reset();
        redeazaGrilaOre(ziSelectata.an, ziSelectata.luna, ziSelectata.z);
        if (ziEsteCompletRezervata(ziSelectata.an, ziSelectata.luna, ziSelectata.z)) redeazaCalendar(null);
        oraSelectata = null;
        document.getElementById('oraInput').value = '';
        const afisajData = document.getElementById('date-display-val');
        if (afisajData) {
          afisajData.textContent    = 'Selectați din calendar';
          afisajData.style.fontStyle = 'italic';
          afisajData.style.color    = 'var(--gri-cald)';
        }
        document.getElementById('dateInput').value = '';
        captchaA = Math.floor(Math.random() * 9) + 1;
        captchaB = Math.floor(Math.random() * 9) + 1;
        if (captchaIntrebare) captchaIntrebare.textContent = `Cât face ${captchaA} + ${captchaB}?`;
      } else {
        throw new Error(rezultat.message || 'Eroare necunoscuta');
      }
    } catch (err) {
      console.error('Web3Forms eroare:', err);
      afisareMesaj('A apărut o eroare. Vă rugăm încercați din nou mai târziu.', 'eroare');
    }

    btnRezerva.disabled    = false;
    btnRezerva.textContent = 'Trimite Cererea de Rezervare';
  });

  function afisareMesaj(text, tip) {
    if (!notificare) return;
    notificare.textContent = text;
    notificare.className   = 'notificare ' + tip;
    notificare.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { notificare.className = 'notificare'; }, 6000);
  }
});

const PAROLA_ADMIN_REZ = 'veil2026';

function adminRezVerificaParola() {
  const input = document.getElementById('admin-rez-parola');
  if (!input) return;
  if (input.value === PAROLA_ADMIN_REZ) {
    document.getElementById('admin-rez-login').style.display    = 'none';
    document.getElementById('admin-rez-continut').style.display = 'block';
    input.classList.remove('eroare');
    adminRezRedeazaLista();
  } else {
    input.classList.add('eroare');
    input.value = '';
  }
}

function adminRezRedeazaLista() {
  const lista = document.getElementById('admin-rez-lista');
  if (!lista) return;
  lista.innerHTML = '';

  const chei = [];
  for (let i = 0; i < localStorage.length; i++) {
    const cheie = localStorage.key(i);
    if (cheie && cheie.startsWith('rezervare_')) chei.push(cheie);
  }
  chei.sort();

  if (chei.length === 0) {
    lista.innerHTML = '<p class="admin-gol">Nicio rezervare găsită.</p>';
    return;
  }

  chei.forEach(cheie => {
    const parti = cheie.replace('rezervare_', '').split('_');
    const an    = parti[0];
    const luna  = parseInt(parti[1]);
    const zi    = parti[2];
    const ore   = JSON.parse(localStorage.getItem(cheie) || '[]');

    const bloc = document.createElement('div');
    bloc.className = 'admin-poza-item';
    bloc.style.cssText = 'flex-direction:column; align-items:flex-start; gap:8px; margin-bottom:10px;';

    const titluZi = document.createElement('div');
    titluZi.style.cssText = 'display:flex; justify-content:space-between; width:100%; align-items:center;';
    titluZi.innerHTML = `
      <span class="admin-poza-titlu">${zi} ${LUNI_RO[luna]} ${an}</span>
      <button class="admin-btn-sterge" onclick="adminRezStergeZi('${cheie}')">✕ Șterge ziua</button>`;

    const oreContainer = document.createElement('div');
    oreContainer.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px;';

    ore.forEach(ora => {
      const btn = document.createElement('button');
      btn.className = 'admin-slot-ora';
      btn.innerHTML = `${ora} <span class="delete-x">✕</span>`;
      btn.onclick = () => adminRezStergeOra(cheie, ora);
      oreContainer.appendChild(btn);
    });

    bloc.appendChild(titluZi);
    bloc.appendChild(oreContainer);
    lista.appendChild(bloc);
  });
}

function adminRezStergeOra(cheie, ora) {
  const ore = JSON.parse(localStorage.getItem(cheie) || '[]');
  const noi = ore.filter(o => o !== ora);
  if (noi.length === 0) {
    localStorage.removeItem(cheie);
  } else {
    localStorage.setItem(cheie, JSON.stringify(noi));
  }
  adminRezRedeazaLista();
  // Actualizeaza grila vizibila daca ziua respectiva e selectata in calendar
  if (ziSelectata) {
    redeazaGrilaOre(ziSelectata.an, ziSelectata.luna, ziSelectata.z);
  }
}

function adminRezStergeZi(cheie) {
  localStorage.removeItem(cheie);
  adminRezRedeazaLista();
  redeazaCalendar(null);
}

function adminRezInchide() {
  document.getElementById('admin-rez-panel').style.display    = 'none';
  document.getElementById('admin-rez-overlay').style.display  = 'none';
  document.getElementById('admin-rez-login').style.display    = 'block';
  document.getElementById('admin-rez-continut').style.display = 'none';
  const input = document.getElementById('admin-rez-parola');
  if (input) { input.value = ''; input.classList.remove('eroare'); }
}

// ── Shortcut Ctrl+Shift+R doar pe Rezervari.html ──
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    const pagina = window.location.pathname.split('/').pop();
    if (pagina !== 'Rezervari.html') return;
    e.preventDefault();
    const panel   = document.getElementById('admin-rez-panel');
    const overlay = document.getElementById('admin-rez-overlay');
    if (!panel || !overlay) return;
    panel.style.display   = 'block';
    overlay.style.display = 'block';
    overlay.onclick       = adminRezInchide;
  }
});