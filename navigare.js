document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Date curente ── */
  const BOOKED_DAYS = [3, 7, 12, 15, 18, 22, 25]; // zile rezervate (fixe demo)
  const MONTHS_RO = [
    'Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
    'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'
  ];

  let viewDate = new Date();          // luna afișată
  const today  = new Date();
  today.setHours(0,0,0,0);

  /* ── 2. Referințe DOM ── */
  const monthLabel  = document.getElementById('cal-month-label');
  const calBody     = document.getElementById('cal-body');
  const radioWrap   = document.getElementById('cal-radios');     // container radios
  const dateDisplay = document.getElementById('date-display-val');
  const hiddenDate  = document.getElementById('dateInput');
  const styleTag    = document.getElementById('cal-dynamic-css');

  /* ── 3. Render calendar ── */
  function render() {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();

    monthLabel.textContent = MONTHS_RO[m] + ' ' + y;

    const firstDay    = new Date(y, m, 1).getDay();       // 0=Sun
    const offset      = firstDay === 0 ? 6 : firstDay - 1; // Mon-based
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // Build rows
    let cells = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      date.setHours(0,0,0,0);
      let type;
      if (+date === +today)          type = 'today';
      else if (BOOKED_DAYS.includes(d)) type = 'booked';
      else if (date < today)         type = 'past';
      else                           type = 'available';
      cells.push({ d, type });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    // Clear & fill tbody
    calBody.innerHTML = '';
    const selectable = [];

    for (let r = 0; r < cells.length / 7; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 7; c++) {
        const cell = cells[r * 7 + c];
        const td   = document.createElement('td');

        if (!cell) {
          td.className = 'cal-empty';
        } else if (cell.type === 'booked') {
          td.className = 'cal-booked';
          td.innerHTML = `<span>${cell.d}</span>`;
        } else if (cell.type === 'past') {
          td.className = 'cal-past';
          td.textContent = cell.d;
        } else {
          // today or available — selectable
          const id = `day-${y}-${m}-${cell.d}`;
          const cls = cell.type === 'today' ? 'cal-selectable cal-today' : 'cal-selectable';
          td.className = cls;
          td.innerHTML = `<label for="${id}">${cell.d}</label>`;
          selectable.push({ id, d: cell.d, y, m });
        }
        tr.appendChild(td);
      }
      calBody.appendChild(tr);
    }

    // Rebuild radios
    radioWrap.innerHTML = '';
    selectable.forEach(({ id, d, y, m }) => {
      const inp = document.createElement('input');
      inp.type  = 'radio';
      inp.name  = 'selected-day';
      inp.id    = id;
      inp.className = 'cal-radio';
      inp.value = `${d} ${MONTHS_RO[m]} ${y}`;
      inp.addEventListener('change', () => {
        dateDisplay.textContent = inp.value;
        dateDisplay.style.fontStyle = 'normal';
        dateDisplay.style.color = 'var(--cream)';
        if (hiddenDate) hiddenDate.value = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      });
      radioWrap.appendChild(inp);
    });

    // Dynamic CSS: highlight selected label + date-display border
    let dynamicCSS = '';
    selectable.forEach(({ id }) => {
      dynamicCSS += `
#${id}:checked ~ .cal-table td.cal-selectable label[for="${id}"] {
  background: var(--accent); color: var(--bg-dark); font-weight: 600; box-shadow: none;
}
#${id}:checked ~ .cal-table td.cal-selectable label[for="${id}"]::after { opacity: 0; }
`;
    });
    styleTag.textContent = dynamicCSS;

    // Reset selection display
    dateDisplay.textContent = 'Selectați din calendar';
    dateDisplay.style.fontStyle = 'italic';
    dateDisplay.style.color = 'var(--warm-gray)';
    if (hiddenDate) hiddenDate.value = '';
  }

  /* ── 4. Nav buttons ── */
  document.getElementById('cal-prev').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    render();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    render();
  });

  render();
});