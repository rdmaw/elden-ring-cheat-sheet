(function () {
  const c = document.querySelectorAll('input[type="checkbox"]');
  for (let i = 0, l = c.length; i < l; i++) c[i].autocomplete = 'off';
})();

// Cache root and declare defaults
const root = document.documentElement;
const theme = document.getElementById('theme');
const cb = document.getElementById('cb');
const PROFILE_KEY = 'er';
const DEFAULT_PROFILE = 'default';

// Initialize default profile with checks if doesn't exist
function initializeProfiles() {
  const defaultProfile = {
    [DEFAULT_PROFILE]: {
      data: {}
      // TODO: Future data to be stored
    }
  };

  try {
    const profiles = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (!profiles) return defaultProfile;

    if (profiles[DEFAULT_PROFILE]?.data &&
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
  }
};

// Handle storage updates when checkbox is interacted with
document.addEventListener('change', e => {
  if (e.target.matches('input[type="checkbox"]')) {
    profileManager.updateChecklistState(e.target.id, e.target.checked);
  }
});

// Handle checkbox checked state restoration
function restoreCheckboxes() {
  const { data } = profileManager.getCurrentProfile();
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach(checkbox => {
    checkbox.checked = !!data[checkbox.id];
  });
}

document.addEventListener('DOMContentLoaded', () => {
  restoreCheckboxes();

  // Handle theme switching - t = theme, d = dark, l = light
  if (theme) {
    theme.value = localStorage.getItem('t') || 'l';

    theme.addEventListener('change', () => {
      const dark = theme.value === 'd';
      root.classList.toggle('dark', dark);
      localStorage.setItem('t', theme.value);
    });
  }

  // Handle color blindness
  if (cb) {
    const cbRemove = ['pro', 'deu', 'tri', 'ach'];

    const cbUpdate = () => {
      const value = cb.value;
      root.classList.remove(...cbRemove);
      if (value !== '0') {
        root.classList.add(value);
      }
      localStorage.setItem('cb', value);
    };

    cb.value = localStorage.getItem('cb') || '0';
    cbUpdate();
    cb.addEventListener('change', cbUpdate);
  }

  // Open links in new tab, loop through all links
  const links = document.querySelectorAll('a[href^="http"]');

  for (let i = 0, len = links.length; i < len; i++) {
    const link = links[i];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
});

const menu = document.getElementById('menu');
const sidebar = document.getElementById('sidebar');
const close = sidebar.querySelector('.close');

function toggleSidebar() {
  const hidden = sidebar.getAttribute('aria-hidden') === 'true';

  if (hidden) {
    sidebar.setAttribute('aria-hidden', 'false');
    menu.setAttribute('aria-expanded', 'true');
    sidebar.removeAttribute('inert');
  } else {
    menu.focus({ preventScroll: true });
    sidebar.setAttribute('aria-hidden', 'true');
    menu.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('inert', '');
  }
}

menu.addEventListener('click', toggleSidebar);
close.addEventListener('click', toggleSidebar);

document.addEventListener('keydown', (e) => {
  // Close sidebar with Esc
  if (e.key === 'Escape' && sidebar.getAttribute('aria-hidden') === 'false') {
    toggleSidebar();
  }

  // Toggle sidebar with 'q'
  if (e.key.toLowerCase() === 'q' && !e.ctrlKey && !e.metaKey) {
    const active = document.activeElement;
    const isFormControl = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT';

    if (!isFormControl) {
      e.preventDefault();
      toggleSidebar();
    }
  }
});

const up = document.getElementById('up');

window.addEventListener('scroll', () => {
  if (window.scrollY < 500) {
    up.classList.remove('show');
  } else {
    up.classList.add('show');
  }
}, { passive: true });

up.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })

  // TODO: Monitor focus with full playthrough page
  setTimeout(() => {
    if (menu) {
      menu.focus();
    }
  }, 1000);
});