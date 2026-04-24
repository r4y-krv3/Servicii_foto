const EMAILJS_PUBLIC_KEY  = 'iMTr-u8ZydfWbvhBn';
const EMAILJS_SERVICE_ID  = 'service_89bjj8b';
const EMAILJS_TEMPLATE_ID = 'template_zanxiao';
const EMAIL_DESTINATAR    = 'ilina.vision@gmail.com';

document.addEventListener('DOMContentLoaded', () => {

  if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // ── Navigare activa ──
  const paginaCurenta = window.location.pathname.split('/').pop() || 'Home.html';
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href').split('#')[0].split('/').pop();
    if (href === paginaCurenta) a.classList.add('activ');
  });

  // ── Referinte DOM ──
  const eticheta       = document.getElementById('cal-month-label');
  const corpCalendar   = document.getElementById('cal-body');
  const containerRadio = document.getElementById('cal-radios');
  const afisajData     = document.getElementById('date-display-val');
  const inputAscuns    = document.getElementById('dateInput');
  const stilDinamic    = document.getElementById('cal-dynamic-css');
  const grilaOre       = document.getElementById('grila-ore');
  const inputOraAscuns = document.getElementById('oraInput');

  if (!eticheta) return;

  const LUNI_RO = [
    'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
    'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'
  ];
  const TOATE_ORELE = [
    '08:00','09:00','10:00','11:00','12:00','13:00',
    '14:00','15:00','16:00','17:00','18:00','19:00','20:00'
  ];

  let dataVizualizata = new Date();
  const azi = new Date();
  azi.setHours(0, 0, 0, 0);

  let ziSelectata  = null;
  let oraSelectata = null;

  // ── Helpers localStorage ──
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
    const ore = obtineOreRezervate(an, luna, zi);
    if (!ore.includes(ora)) ore.push(ora);
    localStorage.setItem(cheie, JSON.stringify(ore));
  }

  function ziEsteCompletRezervata(an, luna, zi) {
    return obtineOreRezervate(an, luna, zi).length >= TOATE_ORELE.length;
  }

  // ── Randeaza calendar ──
  function redeazaCalendar(directie) {
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
      if (+data === +azi)                              tip = 'azi';
      else if (data < azi)                             tip = 'trecuta';
      else if (ziEsteCompletRezervata(an, luna, z))    tip = 'rezervata';
      else                                             tip = 'disponibila';
      celule.push({ z, tip });
    }
    while (celule.length % 7 !== 0) celule.push(null);

    corpCalendar.innerHTML  = '';
    containerRadio.innerHTML = '';
    const selectabile = [];

    for (let r = 0; r < celule.length / 7; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 7; c++) {
        const celula = celule[r * 7 + c];
        const td = document.createElement('td');

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
      const inp = document.createElement('input');
      inp.type      = 'radio';
      inp.name      = 'zi-selectata';
      inp.id        = id;
      inp.className = 'radio-calendar';
      inp.value     = `${z} ${LUNI_RO[luna]} ${an}`;

      inp.addEventListener('change', () => {
        ziSelectata  = { z, luna, an };
        oraSelectata = null;

        if (afisajData) {
          afisajData.textContent = inp.value;
          afisajData.style.fontStyle = 'normal';
          afisajData.style.color = 'var(--crem)';
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
        afisajData.textContent = 'Selectați din calendar';
        afisajData.style.fontStyle = 'italic';
        afisajData.style.color = 'var(--gri-cald)';
      }
      if (inputAscuns)    inputAscuns.value = '';
      if (grilaOre)       grilaOre.innerHTML = '';
      if (inputOraAscuns) inputOraAscuns.value = '';

      // Ascunde eticheta orelor cand schimbam luna
      const etichetaOre = document.getElementById('eticheta-ore');
      if (etichetaOre) etichetaOre.style.display = 'none';
    }

    if (directie && corpCalendar) {
      const x = directie === 'inainte' ? '-18px' : '18px';
      corpCalendar.animate(
        [{ opacity: 0.3, transform: `translateX(${x})` },
         { opacity: 1,   transform: 'translateX(0)' }],
        { duration: 260, easing: 'ease-out', fill: 'forwards' }
      );
    }
  }

  // ── Randeaza grila ore ──
  // FIX: redenumit variabila interna pentru a nu umbri `eticheta` din scope-ul exterior
  function redeazaGrilaOre(an, luna, zi) {
    if (!grilaOre) return;
    const oreRezervate = obtineOreRezervate(an, luna, zi);
    grilaOre.innerHTML = '';

    const etichetaOre = document.getElementById('eticheta-ore');
    if (etichetaOre) etichetaOre.style.display = 'block';

    TOATE_ORELE.forEach(ora => {
      const slot = document.createElement('div');
      slot.className = 'slot-ora';
      slot.textContent = ora;

      if (oreRezervate.includes(ora)) {
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

  // ── Formular ──
  const form       = document.getElementById('formular-rezervare');
  const btnRezerva = document.getElementById('btn-rezerva');
  const notificare = document.getElementById('notificare');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nume     = document.getElementById('nameInput')?.value.trim();
    const email    = document.getElementById('emailInput')?.value.trim();
    const serviciu = document.getElementById('tipSesiune')?.value;
    const data     = inputAscuns?.value;
    const ora      = inputOraAscuns?.value;

    if (!nume || nume.length < 3) {
      afisareMesaj('Vă rugăm introduceți un nume valid (minim 3 caractere).', 'eroare');
      return;
    }
    if (!data) {
      afisareMesaj('Vă rugăm selectați o dată din calendar.', 'eroare');
      return;
    }
    if (!ora) {
      afisareMesaj('Vă rugăm selectați o oră din grila de mai jos.', 'eroare');
      return;
    }

    btnRezerva.disabled    = true;
    btnRezerva.textContent = 'Se trimite...';

    const parametri = {
      to_email:   EMAIL_DESTINATAR,
      from_name:  nume,
      from_email: email,
      serviciu,
      data:       `${ziSelectata.z} ${LUNI_RO[ziSelectata.luna]} ${ziSelectata.an}`,
      ora,
      mesaj: `Rezervare nouă:\nNumele: ${nume}\nEmail: ${email}\nServiciu: ${serviciu}\nData: ${ziSelectata.z} ${LUNI_RO[ziSelectata.luna]} ${ziSelectata.an}\nOra: ${ora}`
    };

    try {
      if (typeof emailjs !== 'undefined') {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, parametri);
      }

      adaugaOraRezervata(ziSelectata.an, ziSelectata.luna, ziSelectata.z, ora);

      afisareMesaj(`✓ Rezervare trimisă! Veți fi contactat în 24 ore. (${parametri.data}, ora ${ora})`, 'succes');
      form.reset();

      redeazaGrilaOre(ziSelectata.an, ziSelectata.luna, ziSelectata.z);

      if (ziEsteCompletRezervata(ziSelectata.an, ziSelectata.luna, ziSelectata.z)) {
        redeazaCalendar(null);
      }

      oraSelectata = null;
      if (inputOraAscuns) inputOraAscuns.value = '';
      if (afisajData) {
        afisajData.textContent = 'Selectați din calendar';
        afisajData.style.fontStyle = 'italic';
        afisajData.style.color = 'var(--gri-cald)';
      }
      if (inputAscuns) inputAscuns.value = '';

    } catch (err) {
      console.error('EmailJS eroare:', err);
      afisareMesaj('A apărut o eroare la trimitere. Vă rugăm contactați-ne direct la ' + EMAIL_DESTINATAR, 'eroare');
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