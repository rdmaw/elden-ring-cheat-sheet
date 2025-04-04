// Profile keys and cache root
const key = 'er';
const D = 'default';
const root = document.documentElement;

// Initialize default profile, p = profile, def = default
function initProfile() {
  const def = { [D]: { data: {}, col: {} } };

  try {
    const p = JSON.parse(localStorage.getItem(key)) ?? def;

    if (p[D]?.data &&
      p[D]?.col &&
      typeof p[D] === 'object' &&
      !Object.keys(def[D]).some(key => !(key in p[D]))) {
      return p;
    }

    localStorage.setItem(key, JSON.stringify({ ...p, [D]: { ...def[D], ...p[D] } }));
    return { ...p, [D]: { ...def[D], ...p[D] } };
  } catch (e) {
    console.error('Error initializing profile:', e);
    return def;
  }
}

// Manage profile data
const mgr = {
  get() {
    return initProfile()[D];
  },

  setCl(id, checked) {
    if (!id) return;
    const p = initProfile();
    checked ? p[D].data[id] = 1 : delete p[D].data[id];
    localStorage.setItem(key, JSON.stringify(p));
  },

  setCol(id, expanded) {
    if (!id) return;
    const p = initProfile();
    if (!p[D].col) p[D].col = {};
    expanded ? delete p[D].col[id] : p[D].col[id] = 1;
    localStorage.setItem(key, JSON.stringify(p));
  },

  col() {
    return this.get().col || {};
  }
};

// Restore checked state from storage
function restoreCheckboxes() {
  const { data } = mgr.get();
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    const checked = !!data[checkbox.id];
    checkbox.checked = checked;
    checkbox.closest('li').classList.toggle('c', checked);
  });
}

// Calculate totals
function calculateTotals() {
  const firstCheckbox = document.querySelector('input[type="checkbox"]');
  if (!firstCheckbox) return;
  const prefix = firstCheckbox.id.charAt(0);
  const totalAll = document.getElementById(`${prefix}-ot`);
  if (!totalAll) return;
  const sectionSpans = document.querySelectorAll(`span[id^="${prefix}-t"]`);
  const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));

  const sectionMap = allCheckboxes.reduce((map, checkbox) => {
    const section = checkbox.id.slice(prefix.length).split('-')[0];
    map.has(section) ? map.get(section).push(checkbox) : map.set(section, [checkbox]);
    return map;
  }, new Map());

  let overallChecked = 0, overallTotal = 0;

  sectionSpans.forEach(span => {
    const section = span.id.split('-t')[1];
    const checkboxes = sectionMap.get(section) || [];
    const checked = checkboxes.filter(cb => cb.checked).length;
    const total = checkboxes.length;

    span.classList.remove('d');
    span.textContent = total ? `${checked === total ? 'DONE' : `${checked}/${total}`}` : '0/0';
    if (checked === total && total > 0) span.classList.add('d');
    overallChecked += checked;
    overallTotal += total;
  });
  totalAll.classList.remove('d');
  totalAll.textContent = overallTotal ? `${overallChecked === overallTotal ? 'DONE' : `${overallChecked}/${overallTotal}`}` : '0/0';
  if (overallChecked === overallTotal && overallTotal > 0) totalAll.classList.add('d');
}

// TODO: Monitor autocomplete
(function () {
  const c = document.querySelectorAll('input[type="checkbox"]');
  for (let i = 0, l = c.length; i < l; i++) c[i].autocomplete = 'off';
})();

// Store checkbox state when clicked
document.addEventListener('change', e => {
  if (e.target.matches('input[type="checkbox"]')) {
    e.target.closest('li').classList.toggle('c', e.target.checked);
    mgr.setCl(e.target.id, e.target.checked);
    calculateTotals();
  }
});

// After DOM load
document.addEventListener('DOMContentLoaded', () => {
  restoreCheckboxes();
  calculateTotals();

  // Open every external link in new tab
  const links = document.querySelectorAll('a[href^="http"]');

  for (let i = 0, len = links.length; i < len; i++) {
    const link = links[i];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  // Handle color theme switching - t = theme, d = dark, l = light, cb = colorblind
  const theme = document.getElementById('theme');
  const cb = document.getElementById('cb');

  if (theme) {
    theme.value = localStorage.getItem('t') || 'l';

    theme.addEventListener('change', () => {
      const dark = theme.value === 'd';
      root.classList.toggle('dark', dark);
      localStorage.setItem('t', theme.value);
    });
  }

  if (cb) {
    const cbRemove = ['pro', 'deu', 'tri', 'ach'];

    const cbUpdate = () => {
      const value = cb.value;
      root.classList.remove(...cbRemove);
      if (value !== '0') root.classList.add(value);
      localStorage.setItem('cb', value);
    };

    cb.value = localStorage.getItem('cb') || '0';
    cbUpdate();
    cb.addEventListener('change', cbUpdate);
  }

  // Toggle sidebar functionality
  const menu = document.getElementById('menu');
  const sidebar = document.getElementById('sidebar');
  const close = sidebar.querySelector('.close');

  function toggleSidebar() {
    const hidden = sidebar.ariaHidden === 'true';

    if (hidden) {
      sidebar.ariaHidden = 'false';
      menu.ariaExpanded = 'true';
      sidebar.removeAttribute('inert');
    } else {
      menu.focus({ preventScroll: true });
      sidebar.ariaHidden = 'true';
      menu.ariaExpanded = 'false';
      sidebar.setAttribute('inert', '');
    }
  }

  menu.addEventListener('click', toggleSidebar);
  close.addEventListener('click', toggleSidebar);

  document.addEventListener('keydown', (e) => {
    // Close sidebar with Esc
    if (e.key === 'Escape' && sidebar.ariaHidden === 'false') toggleSidebar();

    // Toggle sidebar with 'q'
    if (e.key.toLowerCase() === 'q' && !e.ctrlKey && !e.metaKey) {
      const active = document.activeElement;
      const isFormControl = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT';

      if (!isFormControl) {
        e.preventDefault();
        toggleSidebar();
        close.focus();
      }
    }
  });

  // Handle to-top button logic
  const up = document.getElementById('up');

  if (up) {
    const scroll = () => up.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', scroll, { passive: true });
    scroll();

    up.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth'});
      setTimeout(() => menu?.focus(), 700);
    });
  }

  // Handle collapse/expand functionality
  const col = document.querySelectorAll('.col');
  const expA = document.getElementById('exp-a');
  const colA = document.getElementById('col-a');
  const ulMap = new Map();

  for (const btn of col) {
    const ulId = btn.getAttribute('aria-controls');
    const ul = document.getElementById(ulId);
    if (!ul) continue;
    ulMap.set(btn, ul);

    const isCollapsed = !!mgr.col()[ulId];
    btn.ariaExpanded = String(!isCollapsed);
    ul.classList.toggle('f', isCollapsed);

    btn.addEventListener('click', () => {
      const shouldExpand = btn.ariaExpanded !== 'true';
      btn.ariaExpanded = String(shouldExpand);
      ul.classList.toggle('f', !shouldExpand);
      mgr.setCol(ulId, shouldExpand);
    });
  }

  document.querySelector('style[data-c]')?.remove();

  const toggleAll = (expand) => {
    ulMap.forEach((ul, btn) => {
      const ulId = btn.getAttribute('aria-controls');
      btn.ariaExpanded = String(expand);
      ul.classList.toggle('f', !expand);
      mgr.setCol(ulId, expand);
    });
  };

  expA?.addEventListener('click', () => toggleAll(true));
  colA?.addEventListener('click', () => toggleAll(false));

  // Hide completed checkboxes
  const hide = document.getElementById('hide');

  if (hide) {
    const hideTxt = hide.querySelector('span');
    const isHidden = localStorage.getItem('hide') === '1';
    root.classList.toggle('hide', isHidden);
    hideTxt.textContent = isHidden ? 'Show Completed' : 'Hide Completed';

    hide.addEventListener('click', () => {
      const shouldHide = !root.classList.contains('hide');
      root.classList.toggle('hide', shouldHide);
      hideTxt.textContent = shouldHide ? 'Show Completed' : 'Hide Completed';
      localStorage.setItem('hide', shouldHide ? '1' : '0');
    });
  }

  // NG+ Reset

  // Delete profile
  const delBtn = document.getElementById('del');

  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this profile? This cannot be undone.')) {
        const p = initProfile();
        const current = document.getElementById('profile').value || D;

        if (current === D) {
          p[D] = {
            data: {},
            col: {}
          };
        } else {
          delete p[current];
        }
        localStorage.setItem(key, JSON.stringify(p));
        window.location.reload();
      }
    });
  }

});