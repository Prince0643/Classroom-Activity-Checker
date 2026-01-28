(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
 
  const state = {
    user: null,
    schedules: [
      {
        id: 'sch-1',
        classroom: 'Room 301',
        subject: 'Computer Science Fundamentals',
        time: '08:00 - 09:30',
        building: 'IT Building',
        status: 'Scheduled',
      },
    ],
    publicBoard: [
      {
        classroom: 'Room 301',
        subject: 'Computer Science Fundamentals',
        professor: 'Prof. Maria Santos',
        time: '08:00 - 09:30',
        building: 'IT Building',
        status: 'Scheduled',
      },
      {
        classroom: 'Room 205',
        subject: 'Business Management',
        professor: 'Prof. Juan Dela Cruz',
        time: '09:00 - 10:30',
        building: 'Business Hall',
        status: 'In Progress',
      },
      {
        classroom: 'Room 401',
        subject: 'Database Systems',
        professor: 'Prof. Ana Reyes',
        time: '10:00 - 11:30',
        building: 'IT Building',
        status: 'Scheduled',
      },
      {
        classroom: 'Lab 102',
        subject: 'Programming Laboratory',
        professor: 'Prof. Carlos Martinez',
        time: '11:00 - 13:00',
        building: 'IT Building',
        status: 'Scheduled',
      },
      {
        classroom: 'Room 103',
        subject: 'English Literature',
        professor: 'Prof. Isabella Garcia',
        time: '13:00 - 14:30',
        building: 'Arts Building',
        status: 'Scheduled',
      },
    ],
  };
 
  const statusToTagClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'scheduled') return 'tag--scheduled';
    if (s === 'in progress' || s === 'in_progress') return 'tag--progress';
    if (s === 'completed') return 'tag--completed';
    if (s === 'cancelled' || s === 'canceled') return 'tag--cancelled';
    if (s === 'on time' || s === 'ontime') return 'tag--ontime';
    if (s === 'delayed') return 'tag--delayed';
    if (s === 'room change' || s === 'room_change') return 'tag--room';
    return 'tag--scheduled';
  };
 
  const pad2 = (n) => String(n).padStart(2, '0');
  const setClock = () => {
    const d = new Date();
    const clock = $('#clock');
    const today = $('#today');
    if (clock) clock.textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    if (today) today.textContent = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
 
  const showScreen = (name) => {
    $$('.screen').forEach((el) => {
      el.classList.toggle('hidden', el.dataset.screen !== name);
    });
    if (name === 'public') {
      $('#btnProfessorLogin')?.classList.remove('hidden');
      $('#btnLogout')?.classList.add('hidden');
    }
    if (name === 'login') {
      $('#btnProfessorLogin')?.classList.add('hidden');
      $('#btnLogout')?.classList.add('hidden');
    }
    if (name === 'dashboard') {
      $('#btnProfessorLogin')?.classList.add('hidden');
      $('#btnLogout')?.classList.remove('hidden');
    }
  };
 
  const renderPublicBoard = () => {
    const root = $('#publicTable');
    if (!root) return;
    root.innerHTML = '';
 
    for (const row of state.publicBoard) {
      const el = document.createElement('div');
      el.className = 'table__row';
      el.innerHTML = `
        <div>
          <div class="cellValue">${row.classroom}</div>
        </div>
        <div>
          <div class="cellValue">${row.subject}</div>
        </div>
        <div>
          <div class="cellValue">${row.professor}</div>
        </div>
        <div>
          <div class="cellValue">${row.time}</div>
        </div>
        <div>
          <div class="cellValue">${row.building}</div>
        </div>
        <div>
          <span class="tag ${statusToTagClass(row.status)}">${row.status}</span>
        </div>
      `.trim();
      root.appendChild(el);
    }
  };
 
  const renderSchedules = () => {
    const root = $('#scheduleList');
    if (!root) return;
    root.innerHTML = '';
 
    for (const row of state.schedules) {
      const el = document.createElement('div');
      el.className = 'scheduleItem';
      el.dataset.id = row.id;
 
      el.innerHTML = `
        <div>
          <div class="cellTitle">Classroom</div>
          <div class="cellValue">${row.classroom}</div>
        </div>
        <div>
          <div class="cellTitle">Subject</div>
          <div class="cellValue">${row.subject}</div>
        </div>
        <div>
          <div class="cellTitle">Time</div>
          <div class="cellValue">${row.time}</div>
        </div>
        <div>
          <div class="cellTitle">Building</div>
          <div class="cellValue">${row.building}</div>
        </div>
        <div>
          <div class="cellTitle">Status</div>
          <select class="select" data-role="status">
            <option ${row.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
            <option ${row.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${row.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option ${row.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </div>
        <div class="rowActions">
          <button class="actionBtn" type="button" data-role="edit" aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4.5a2.1 2.1 0 0 0-3 0L3 15v5Z" stroke="currentColor" stroke-width="1.6"/>
            </svg>
          </button>
          <button class="actionBtn actionBtn--danger" type="button" data-role="delete" aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M10 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M14 11v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M6 7l1 14h10l1-14" stroke="currentColor" stroke-width="1.6"/>
              <path d="M9 7V4h6v3" stroke="currentColor" stroke-width="1.6"/>
            </svg>
          </button>
        </div>
      `.trim();
 
      root.appendChild(el);
    }
  };
 
  const setUser = (user) => {
    state.user = user;
    $('#metaUser').textContent = user ? `Logged in as ${user.displayName}` : 'Not logged in';
    $('#welcomeTitle').textContent = user ? `Welcome, ${user.displayName}` : 'Welcome, Prof.';
    $('#welcomeDept').textContent = user?.department ? `${user.department} Department` : 'Computer Science Department';
 
    $('#profName').textContent = user?.fullName || 'Maria Santos';
    $('#profId').textContent = user?.employeeId || 'EMP-2018-001';
    $('#profEmail').textContent = user?.email || 'maria.santos@lcu.edu.ph';
    $('#profDept').textContent = user?.department || 'Computer Science';
    $('#profPhone').textContent = user?.phone || '+63 917 123 4567';
    $('#profOffice').textContent = user?.office || 'IT Building, Room 405';
    $('#profSpec').textContent = user?.specialization || 'Algorithms & Data Structures';
 
    const qrUrl = makeQrUrl(user);
    $('#qrImg').src = qrUrl;
    $('#qrFullImg').src = qrUrl;
  };
 
  const makeQrUrl = (user) => {
    const payload = {
      name: user?.fullName || 'Maria Santos',
      id: user?.employeeId || 'EMP-2018-001',
      dept: user?.department || 'Computer Science',
      email: user?.email || 'maria.santos@lcu.edu.ph',
    };
    const data = encodeURIComponent(JSON.stringify(payload));
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
  };
 
  const bindTabs = () => {
    const tabs = $$('.tab');
    const panes = $$('.pane');
    tabs.forEach((t) => {
      t.addEventListener('click', () => {
        tabs.forEach((x) => x.classList.toggle('is-active', x === t));
        panes.forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== t.dataset.tab));
      });
    });
  };
 
  const bindScheduleInteractions = () => {
    const root = $('#scheduleList');
    if (!root) return;
 
    root.addEventListener('change', (e) => {
      const sel = e.target;
      if (!(sel instanceof HTMLSelectElement)) return;
      if (sel.dataset.role !== 'status') return;
 
      const row = sel.closest('.scheduleItem');
      const id = row?.dataset.id;
      const item = state.schedules.find((x) => x.id === id);
      if (!item) return;
      item.status = sel.value;
 
      const match = state.publicBoard.find((b) => b.classroom === item.classroom && b.time === item.time);
      if (match) match.status = item.status;
      renderPublicBoard();
    });
 
    root.addEventListener('click', (e) => {
      const btn = e.target instanceof Element ? e.target.closest('button[data-role]') : null;
      if (!btn) return;
      const role = btn.getAttribute('data-role');
      const rowEl = btn.closest('.scheduleItem');
      const id = rowEl?.dataset.id;
 
      if (role === 'delete') {
        state.schedules = state.schedules.filter((x) => x.id !== id);
        renderSchedules();
        return;
      }
 
      if (role === 'edit') {
        alert('Edit action is a placeholder in this HTML/CSS/JS prototype.');
      }
    });
  };
 
  const bindAuth = () => {
    $('#btnProfessorLogin')?.addEventListener('click', () => showScreen('login'));
    $('#btnCancelLogin')?.addEventListener('click', () => showScreen('public'));
    $('#btnLogout')?.addEventListener('click', () => {
      setUser(null);
      showScreen('public');
    });
 
    $('#loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const username = String(fd.get('username') || '').trim();
      const password = String(fd.get('password') || '').trim();
 
      if (username !== 'msantos' || password !== 'password123') {
        alert('Invalid credentials. Try: msantos / password123');
        return;
      }
 
      setUser({
        displayName: 'Prof. Maria Santos',
        fullName: 'Maria Santos',
        employeeId: 'EMP-2018-001',
        email: 'maria.santos@lcu.edu.ph',
        phone: '+63 917 123 4567',
        department: 'Computer Science',
        office: 'IT Building, Room 405',
        specialization: 'Algorithms & Data Structures',
      });
 
      showScreen('dashboard');
    });
  };
 
  const bindQr = () => {
    const modal = $('#qrModal');
    const open = () => modal?.classList.remove('hidden');
    const close = () => modal?.classList.add('hidden');
 
    $('#btnQrFull')?.addEventListener('click', open);
 
    $('#btnQrDownload')?.addEventListener('click', () => {
      const img = $('#qrImg');
      if (!(img instanceof HTMLImageElement) || !img.src) return;
 
      const a = document.createElement('a');
      a.href = img.src;
      a.download = 'my-qr-code.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
 
    modal?.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.getAttribute('data-close') === 'true') close();
    });
 
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  };
 
  const bindAddSchedule = () => {
    $('#btnAddSchedule')?.addEventListener('click', () => {
      const next = {
        id: `sch-${Math.random().toString(16).slice(2)}`,
        classroom: 'Room 205',
        subject: 'New Schedule',
        time: '14:00 - 15:30',
        building: 'IT Building',
        status: 'Scheduled',
      };
      state.schedules = [next, ...state.schedules];
      renderSchedules();
    });
  };
 
  const init = () => {
    setClock();
    setInterval(setClock, 1000);
 
    renderPublicBoard();
    renderSchedules();
 
    bindTabs();
    bindScheduleInteractions();
    bindAuth();
    bindQr();
    bindAddSchedule();
 
    setUser(null);
    showScreen('public');
  };
 
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
 