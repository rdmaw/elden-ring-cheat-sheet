// Declare profile and store the data using localStorage
const PROFILE_KEY = 'eldenring_profiles';
const DEFAULT_PROFILE_NAME = 'Default';

function initializeProfiles() {
  let profiles;
  try {
    profiles = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    profiles = {};
  }

  if (!profiles[DEFAULT_PROFILE_NAME]?.checklistData) {
    profiles[DEFAULT_PROFILE_NAME] = {
      checklistData: {},
      // ? Keep in case of future use
      // collapsed: {},
      // isDefault: true,
      // lastActiveTab: '#tabPlaythrough',
      // activeFilter: 'all'
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  }

  return profiles;
}

const profileManager = {
  getCurrentProfile() {
    const profiles = initializeProfiles();
    return profiles[DEFAULT_PROFILE_NAME];
  },

  updateChecklistState(dataId, checked) {
    if (!dataId) return;

    const profiles = initializeProfiles();
    const profile = profiles[DEFAULT_PROFILE_NAME];

    if (checked) {
      profile.checklistData[dataId] = true;
    } else {
      delete profile.checklistData[dataId];
    }

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
  }
};

// Generate checkboxes for each <li> with a data-id attribute
function generateCheckboxes() {
  const listItems = document.querySelectorAll('li[data-id]');

  listItems.forEach(li => {
    const dataId = li.getAttribute('data-id');

    if (!li.querySelector('.checkbox')) {
      const container = document.createElement('div');
      container.className = 'checklist';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'checkbox';
      checkbox.id = `check_${dataId}`;

      const label = document.createElement('label');
      label.htmlFor = checkbox.id;

      const content = li.cloneNode(true);
      const sublists = Array.from(content.querySelectorAll('ul'));
      sublists.forEach(ul => ul.remove());

      label.append(...content.childNodes);
      container.append(checkbox, label);

      const originalSublists = Array.from(li.querySelectorAll('ul'));
      originalSublists.forEach(ul => container.append(ul));

      li.textContent = '';
      li.append(container);
    }
  });
}

// Update storage when checkbox state updates
document.addEventListener('change', e => {
  if (e.target.matches('.checkbox')) {
    const checkbox = e.target;
    const dataId = checkbox.id.replace('check_', '');
    profileManager.updateChecklistState(dataId, checkbox.checked);
  }
});

// Handle checked state when restoring checkboxes
function restoreCheckboxes() {
  const { checklistData } = profileManager.getCurrentProfile();
  const checkboxes = document.querySelectorAll('.checkbox');

  const updates = [];
  checkboxes.forEach(checkbox => {
    const dataId = checkbox.id.replace('check_', '');
    updates.push({ checkbox, state: !!checklistData[dataId] });
  });

  updates.forEach(({ checkbox, state }) => {
    checkbox.checked = state;
  });
}

// Run code on pageshow instead of after DOM load
window.addEventListener('pageshow', () => {
  initializeProfiles();
  generateCheckboxes();
  restoreCheckboxes();
});

document.addEventListener('DOMContentLoaded', () => {
  // Loop for better _blank handling, added noopener
  const links = document.querySelectorAll('a[href^="http"]');
  const len = links.length;

  for (let i = 0; i < len; i++) {
    const link = links[i];
    if (link.href.startsWith('http')) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
  }
});