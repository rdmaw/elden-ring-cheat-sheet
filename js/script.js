// Profile keys and cache root
const root = document.documentElement;
const PROFILE_KEY = 'er';
const DEFAULT_PROFILE = 'default';

// Initialize default profile with checks if doesn't exist
function initializeProfiles() {
  const defaultProfile = {
    [DEFAULT_PROFILE]: {
      data: {},
      col: {}
    }
  };

  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (!profiles) return defaultProfile;

    if (profiles[DEFAULT_PROFILE]?.data &&
      profiles[DEFAULT_PROFILE]?.col &&
      !Object.keys(defaultProfile[DEFAULT_PROFILE])
        .some(key => !(key in profiles[DEFAULT_PROFILE]))) {
      return profiles;
    }

    profiles[DEFAULT_PROFILE] = {
      ...defaultProfile[DEFAULT_PROFILE],
      ...profiles[DEFAULT_PROFILE]
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
    return profiles;

  } catch {
    return defaultProfile;
  }
}

const profileManager = {
  getCurrentProfile() {
    return initializeProfiles()[DEFAULT_PROFILE];
  },

  updateChecklistState(id, checked) {
    if (!id) return;
    const profiles = initializeProfiles();

    checked ?
      profiles[DEFAULT_PROFILE].data[id] = 1 :
      delete profiles[DEFAULT_PROFILE].data[id];

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  },

  updateExpanded(id, expanded) {
    if (!id) return;
    const profiles = initializeProfiles();

    if (!profiles[DEFAULT_PROFILE].col) profiles[DEFAULT_PROFILE].col = {};
    
    expanded ? delete profiles[DEFAULT_PROFILE].col[id] : profiles[DEFAULT_PROFILE].col[id] = 1;

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  },

  getExpanded() {
    const profile = this.getCurrentProfile();
    return profile.col || {};
  }
};

// Restore checked state from storage
function restoreCheckboxes() {
  const { data } = profileManager.getCurrentProfile();
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
    if (!map.has(section)) map.set(section, []);
    map.get(section).push(checkbox);
    return map;
  }, new Map());

  let overallChecked = 0;
  let overallTotal = 0;

  sectionSpans.forEach(span => {
    const section = span.id.split('-t')[1];
    const checkboxes = sectionMap.get(section) || [];
    const checked = checkboxes.filter(cb => cb.checked).length;
    const total = checkboxes.length;

    span.classList.remove('d', 'x');

    if (total > 0) {
      span.textContent = checked === total ? 'DONE' : `${checked}/${total}`;
      span.classList.add(checked === total ? 'd' : 'x');
    } else {
      span.textContent = '0/0';
      span.classList.add('x');
    }
    overallChecked += checked;
    overallTotal += total;
  });
  totalAll.classList.remove('d', 'x');
  if (overallTotal > 0) {
    totalAll.textContent = overallChecked === overallTotal ? 'DONE' : `${overallChecked}/${overallTotal}`;
    totalAll.classList.add(overallChecked === overallTotal ? 'd' : 'x');
  } else {
    totalAll.textContent = '0/0';
    totalAll.classList.add('x');
  }
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
    profileManager.updateChecklistState(e.target.id, e.target.checked);
    calculateTotals();
  }
});

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

    const isCollapsed = !!profileManager.getExpanded()[ulId];
    btn.ariaExpanded = String(!isCollapsed);
    ul.classList.toggle('f', isCollapsed);

    btn.addEventListener('click', () => {
      const shouldExpand = btn.ariaExpanded !== 'true';
      btn.ariaExpanded = String(shouldExpand);
      ul.classList.toggle('f', !shouldExpand);
      profileManager.updateExpanded(ulId, shouldExpand);
    });
  }

  document.querySelector('style[data-c]')?.remove();

  const toggleAll = (expand) => {
    ulMap.forEach((ul, btn) => {
      const ulId = btn.getAttribute('aria-controls');
      btn.ariaExpanded = String(expand);
      ul.classList.toggle('f', !expand);
      profileManager.updateExpanded(ulId, expand);
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

});