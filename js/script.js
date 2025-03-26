// Set root and theme toggle
const root = document.documentElement;
const themeToggle = document.getElementById('toggle-theme');

// Declare profile key and default
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

    // Replaced true with 1 for smaller storage
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
  // Handle color theme while updating ARIA
  themeToggle?.addEventListener('click', () => {
    const dark = root.classList.toggle('dark');
    localStorage.theme = dark ? 'dark' : 'light';

    themeToggle.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
  });

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