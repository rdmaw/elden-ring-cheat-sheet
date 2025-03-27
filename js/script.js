// Cache root and declare defaults
const root = document.documentElement;
const theme = document.getElementById('theme');
const PROFILE_KEY = 'er_profiles';
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
  // Handle theme switching
  if (theme) {
    theme.value = localStorage.theme || 'light';

    theme.addEventListener('change', () => {
      const dark = theme.value === 'dark';
      root.classList.toggle('dark', dark);
      localStorage.theme = theme.value;
    });
  }

  restoreCheckboxes();

  // Open links in new tab, loop through all links
  const links = document.querySelectorAll('a[href^="http"]');
  const len = links.length;

  for (let i = 0; i < len; i++) {
    const link = links[i];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
});