var profilesKey = "er_profiles";

(function ($) {
  var defaultProfiles = {
    current: "Default",
  };

  defaultProfiles[profilesKey] = {
    "Default": {
      checklistData: {},
      collapsed: {},
      isDefault: true,
      lastActiveTab: '#tabPlaythrough',
      activeFilter: 'all',
    },
  };

  const themes = ['notebook', 'light', 'dark'];
  const icons = {
    'notebook': 'bi-journal-bookmark-fill',
    'light': 'bi-sun-fill',
    'dark': 'bi-moon-stars-fill'
  };

  var profiles = $.jStorage.get(profilesKey, defaultProfiles);

  if (!profiles[profilesKey]["Default"]) {
    profiles[profilesKey]["Default"] = {
      checklistData: {},
      collapsed: {},
      isDefault: true
    };
    $.jStorage.set(profilesKey, profiles);
  }

  function initializeUI() {
    if ($("ul li[data-id]").length === 0) {
      return;
    }

    const lastTab = profiles[profilesKey][profiles.current].lastActiveTab || '#tabPlaythrough';
    const activeFilter = profiles[profilesKey][profiles.current].activeFilter || 'all';

    if (!profiles[profilesKey][profiles.current].collapsed) {
      profiles[profilesKey][profiles.current].collapsed = {};
    }

    $('.collapse').each(function () {
      const collapseId = $(this).attr('id');
      const isCollapsed = profiles[profilesKey][profiles.current].collapsed[collapseId];

      if (isCollapsed) {
        $(this).removeClass('show');
        $(this).prev().find('.btn-collapse').addClass('collapsed');
      } else {
        $(this).addClass('show');
        $(this).prev().find('.btn-collapse').removeClass('collapsed');
      }
    });

    $('.btn-primary').removeClass('active');
    $(`.btn-primary[data-filter="${activeFilter}"]`).addClass('active');
    applyFilter(activeFilter);

    $('.nav-link').removeClass('active');
    $('.tab-pane').removeClass('show active');
    $(`a[href="${lastTab}"]`).addClass('active');
    $(lastTab).addClass('show active');

    if ($(`a[href="${lastTab}"]`).data('show-buttons')) {
      $('#collapseButtons').show();
    } else {
      $('#collapseButtons').hide();
    }

    $("ul li[data-id]").each(function () {
      addCheckbox(this);
    });
    populateProfiles();
    calculateTotals();
  }

  function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);

    const icon = icons[themeName];
    $('#themeToggleCollapsed i, #themeToggleExpanded i').attr('class', `bi ${icon}`);
  }

  $(document).ready(function () {
    initializeUI();
    calculateTotals();

    const savedTheme = localStorage.getItem('theme') || 'notebook';
    setTheme(savedTheme);

    $('#themeToggleCollapsed, #themeToggleExpanded').click(function () {
      const currentTheme = localStorage.getItem('theme') || 'notebook';
      const nextThemeIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
      setTheme(themes[nextThemeIndex]);
    });

    $("a[href^='http']").attr("target", "_blank");

    $(".nav-link").on("click", function (e) {
      e.preventDefault();

      $(".nav-link").removeClass("active");
      $(".tab-pane").removeClass("show active");
      $(this).addClass("active");
      const targetTab = $(this).attr("href");

      profiles[profilesKey][profiles.current].lastActiveTab = targetTab;
      $.jStorage.set(profilesKey, profiles);

      $(targetTab).addClass("show active");

      if ($(this).data('show-buttons')) {
        $('#collapseButtons').show();
      } else {
        $('#collapseButtons').hide();
      }
    });

    $(document).on('click', 'input[type="checkbox"]', function () {
      var id = $(this).attr('id');
      var isChecked = $(this).prop('checked');

      profiles[profilesKey][profiles.current].checklistData[id] = isChecked;

      var $label = $(this).closest('.checkbox').find('label');
      if (isChecked) {
        $label.addClass('completed');
      } else {
        $label.removeClass('completed');
      }
      $.jStorage.set(profilesKey, profiles);
      calculateTotals();
    });

    $('#profiles').on('change', function () {
      switchProfile($(this).val());
    });

    $('#addProfile').on('click', function () {
      var profile_name = prompt("Enter new profile name:");
      if (profile_name) {
        if (profiles[profilesKey][profile_name]) {
          alert("Profile " + profile_name + " already exists!");
          return;
        }

        clearUI();

        profiles[profilesKey][profile_name] = {
          checklistData: {},
          collapsed: {},
          isDefault: false,
          lastActiveTab: '#tabPlaythrough',
          activeFilter: 'all'
        };

        profiles.current = profile_name;
        $.jStorage.set(profilesKey, profiles);

        $('.btn-primary[data-filter]').removeClass('active');
        $('.btn-primary[data-filter="all"]').addClass('active');

        $('[id^="playthrough_totals_"], [id^="playthrough_nav_totals_"]').each(function () {
          $(this).removeClass('done in_progress');
          $(this).html('0/0');
        });

        $('.collapse').each(function () {
          $(this).collapse('show');
          $(this).prev().find('.btn-collapse').removeClass('collapsed');
        });
        populateProfiles();
        restoreState(profile_name);
        applyFilter('all');
        calculateTotals();
      }
    });

    $('#editProfile').on('click', function () {
      var oldName = profiles.current;

      if (profiles[profilesKey][oldName].isDefault) {
        alert("Can't edit the default profile");
        return;
      }

      var newName = prompt("Enter new name for profile:", oldName);
      if (newName && newName !== oldName) {
        profiles[profilesKey][newName] = {
          ...profiles[profilesKey][oldName],
          isDefault: false
        };

        delete profiles[profilesKey][oldName];
        profiles.current = newName;
        $.jStorage.set(profilesKey, profiles);
        populateProfiles();
      }
    });

    $('#deleteProfile').on('click', function () {
      var currentProfile = profiles.current;

      if (profiles[profilesKey][currentProfile].isDefault) {
        if (confirm("Reset all progress for the default profile?")) {
          const activeFilter = profiles[profilesKey][currentProfile].activeFilter;

          profiles[profilesKey][currentProfile] = {
            checklistData: {},
            collapsed: {},
            isDefault: true,
            lastActiveTab: '#tabPlaythrough',
            activeFilter: activeFilter
          };
          $.jStorage.set(profilesKey, profiles);

          $('.collapse').each(function () {
            $(this).collapse('show');
          });

          $('[id^="playthrough_totals_"]').each(function () {
            $(this).removeClass('done in_progress');
            $(this).html('0/0');
          });

          $('[id^="playthrough_nav_totals_"]').each(function () {
            $(this).removeClass('done in_progress');
            $(this).html('0/0');
          });
          restoreState(currentProfile);
          populateChecklists();
          applyFilter(activeFilter);
          calculateTotals();
        }
      } else {
        if (confirm(`Are you sure you want to delete "${currentProfile}"?`)) {
          if (deleteProfile(currentProfile)) {
            switchProfile(profiles.current);
            restoreState(profiles.current);
            populateProfiles();
            calculateTotals();
          }
        }
      }
    });

    $('.collapse').each(function () {
      var collapseId = $(this).attr('id');

      if (typeof profiles[profilesKey][profiles.current].collapsed === 'undefined') {
        profiles[profilesKey][profiles.current].collapsed = {};
      }

      if (typeof profiles[profilesKey][profiles.current].collapsed[collapseId] === 'undefined') {
        profiles[profilesKey][profiles.current].collapsed[collapseId] = !$(this).hasClass('show');
      }
    });

    $('.collapse').on('shown.bs.collapse hidden.bs.collapse', function () {
      const collapseId = $(this).attr('id');
      const isCollapsed = !$(this).hasClass('show');

      profiles[profilesKey][profiles.current].collapsed[collapseId] = isCollapsed;
      $.jStorage.set(profilesKey, profiles);
    });

    $('#collapseAll').on('click', function () {
      var $collapseElements = $('.playthrough-wrapper .collapse');

      $collapseElements.each(function () {
        $(this).collapse('hide');
        $(this).prev().find('.btn-collapse').addClass('collapsed');
      });

      setTimeout(function () {
        var collapseStates = {};
        $collapseElements.each(function () {
          collapseStates[$(this).attr('id')] = true;
        });

        profiles[profilesKey][profiles.current].collapsed = collapseStates;
        $.jStorage.set(profilesKey, profiles);
      }, 350);
    });

    $('#expandAll').on('click', function () {
      var $collapseElements = $('.playthrough-wrapper .collapse');

      $collapseElements.each(function () {
        $(this).collapse('show');
        $(this).prev().find('.btn-collapse').removeClass('collapsed');
      });

      setTimeout(function () {
        var collapseStates = {};
        $collapseElements.each(function () {
          collapseStates[$(this).attr('id')] = false;
        });

        profiles[profilesKey][profiles.current].collapsed = collapseStates;
        $.jStorage.set(profilesKey, profiles);
      }, 350);
    });

    $(window).scroll(function () {
      if ($(this).scrollTop() > 300) {
        $('#backToTop').addClass('show');
      } else {
        $('#backToTop').removeClass('show');
      }
    });

    $('#backToTop').click(function () {
      window.scrollTo({
        top: 0,
        behavior: 'auto'
      });
      return false;
    });

    $('.btn-primary[data-filter]').click(function () {
      const filter = $(this).data('filter');

      $('.btn-primary[data-filter]').removeClass('active');
      $(this).addClass('active');

      profiles[profilesKey][profiles.current].activeFilter = filter;
      $.jStorage.set(profilesKey, profiles);

      applyFilter(filter);
      calculateTotals();
    });
    calculateTotals();
  });

  function addCheckbox(el) {
    var $el = $(el);
    var content = $el.contents().not($el.children('ul')).detach();
    var sublists = $el.children('ul').detach();
    var checkboxId = $el.attr('data-id');

    var template = `
      <div class="checkbox">
        <input type="checkbox" id="${checkboxId}">
        <label for="${checkboxId}">
          <span class="checkbox-custom"></span>
          <span class="item_content"></span>
        </label>
      </div>
    `;

    $el.html(template);
    $el.find('.item_content').append(content);
    $el.append(sublists);

    var storedState = profiles[profilesKey][profiles.current].checklistData[checkboxId];
    if (storedState) {
      $("#" + checkboxId).prop("checked", true);
      $el.find('label').addClass("completed");
    }
  }

  function populateProfiles() {
    var profileSelect = $('#profiles');
    profileSelect.empty();

    $.each(profiles[profilesKey], function (name) {
      profileSelect.append($('<option>', {
        value: name,
        text: name,
        selected: name === profiles.current
      }));
    });
  }

  function populateChecklists() {
    $('input[type="checkbox"]').prop("checked", false);

    $.each(
      profiles[profilesKey][profiles.current].checklistData,
      function (index, value) {
        $("#" + index).prop("checked", value);
      }
    );
    calculateTotals();
  }

  function calculateTotals() {
    $('[id$="_overall_total"]').each(function () {
      var type = this.id.match(/(.*)_overall_total/)[1];
      var overallCount = 0,
        overallChecked = 0;

      $('[id^="' + type + '_totals_"]').each(function () {
        var regex = new RegExp(type + "_totals_(.*)");
        var i = parseInt(this.id.match(regex)[1]);
        var count = 0,
          checked = 0;
        var activeFilter = profiles[profilesKey][profiles.current].activeFilter;

        for (var j = 1; ; j++) {
          var checkbox = $("#" + type + "_" + i + "_" + j);
          if (checkbox.length == 0) break;

          var checkboxLi = checkbox.closest('li');
          if (activeFilter !== 'all') {
            if (!checkboxLi.find('a').hasClass(activeFilter)) {
              continue;
            }
          }

          count++;
          overallCount++;
          if (checkbox.prop("checked")) {
            checked++;
            overallChecked++;
          }
        }

        if (count > 0) {
          var span = $("#" + type + "_totals_" + i);
          span.html(checked + "/" + count);

          if (checked === count) {
            span.removeClass('in_progress').addClass('done');
          } else if (checked > 0) {
            span.removeClass('done').addClass('in_progress');
          } else {
            span.removeClass('done in_progress');
          }
        }

        if (checked === count) {
          this.innerHTML = $("#" + type + "_nav_totals_" + i)[0].innerHTML =
            "DONE";
          $(this).removeClass("in_progress").addClass("done");
          $($("#" + type + "_nav_totals_" + i)[0])
            .removeClass("in_progress")
            .addClass("done");
        } else {
          this.innerHTML = $("#" + type + "_nav_totals_" + i)[0].innerHTML =
            checked + "/" + count;
          $(this).removeClass("done").addClass("in_progress");
          $($("#" + type + "_nav_totals_" + i)[0])
            .removeClass("done")
            .addClass("in_progress");
        }
      });

      if (overallChecked === overallCount) {
        this.innerHTML = "DONE";
        $(this).removeClass("in_progress").addClass("done");
      } else {
        this.innerHTML = overallChecked + "/" + overallCount;
        $(this).removeClass("done").addClass("in_progress");
      }
    });
  }

  function clearUI() {
    $('.checkbox input[type="checkbox"]').prop('checked', false);
    $('.checkbox label').removeClass('completed');
    $('.collapse').addClass('show');
    $('.btn-collapse').removeClass('collapsed');

    $('[id^="playthrough_totals_"], [id^="playthrough_nav_totals_"]')
      .removeClass('done in_progress')
      .html('0/0');
  }

  function applyFilter(filter) {

    if (filter === 'all') {
      $('.playthrough-wrapper li').show();
    } else {
      $('.playthrough-wrapper li').hide();
      $(`.playthrough-wrapper li a.${filter}`).closest('li').show();
    }
    $('.playthrough-wrapper h3').show();

    profiles[profilesKey][profiles.current].activeFilter = filter;
    $.jStorage.set(profilesKey, profiles);
    calculateTotals();
  }

  function switchProfile(profile_name) {
    clearUI();

    profiles.current = profile_name;

    if (!profiles[profilesKey][profile_name]) {
      profiles[profilesKey][profile_name] = {
        checklistData: {},
        collapsed: {},
        isDefault: false,
        lastActiveTab: '#tabPlaythrough',
        activeFilter: 'all'
      };
    }
    $.jStorage.set(profilesKey, profiles);

    $('.collapse').each(function () {
      const collapseId = $(this).attr('id');
      const isCollapsed = profiles[profilesKey][profile_name].collapsed[collapseId];

      if (isCollapsed) {
        $(this).removeClass('show');
        $(this).prev().find('.btn-collapse').addClass('collapsed');
      } else {
        $(this).addClass('show');
        $(this).prev().find('.btn-collapse').removeClass('collapsed');
      }
    });

    const lastTab = profiles[profilesKey][profile_name].lastActiveTab || '#tabPlaythrough';
    const activeFilter = profiles[profilesKey][profile_name].activeFilter || 'all';

    $('.nav-link').removeClass('active');
    $('.tab-pane').removeClass('show active');
    $(`a[href="${lastTab}"]`).addClass('active');
    $(lastTab).addClass('show active');

    $('.btn-primary').removeClass('active');
    $(`.btn-primary[data-filter="${activeFilter}"]`).addClass('active');

    restoreState(profile_name);
    applyFilter(activeFilter);
    calculateTotals();
  }

  function deleteProfile(profileName) {
    if (profiles[profilesKey][profileName].isDefault) {
      const defaultProfile = {
        checklistData: {},
        collapsed: {},
        isDefault: true,
        lastActiveTab: '#tabPlaythrough',
        activeFilter: profiles[profilesKey][profileName].activeFilter || 'all'
      };

      profiles[profilesKey][profileName] = defaultProfile;
      $.jStorage.set(profilesKey, profiles);

      clearUI();
      restoreState(profileName);
      calculateTotals();
      return true;
    }

    if (!profiles[profilesKey][profileName] ||
      Object.keys(profiles[profilesKey]).length <= 1) {
      return false;
    }

    let defaultProfileKey = Object.keys(profiles[profilesKey])
      .find(key => profiles[profilesKey][key].isDefault);

    delete profiles[profilesKey][profileName];
    profiles.current = defaultProfileKey;
    $.jStorage.set(profilesKey, profiles);
    clearUI();
    restoreState(defaultProfileKey);
    return true;
  }

  function restoreState(profile_name) {

    const activeFilter = profiles[profilesKey][profile_name].activeFilter || 'all';
    $('.btn-primary[data-filter]').removeClass('active');
    $(`.btn-primary[data-filter="${activeFilter}"]`).addClass('active');
    applyFilter(activeFilter);

    $.each(profiles[profilesKey][profile_name].checklistData, function (id, isChecked) {
      const checkbox = $("#" + id);
      if (checkbox.length > 0) {
        checkbox.prop("checked", isChecked);

        const label = checkbox.closest('.checkbox').find('label');
        if (isChecked) {
          label.addClass('completed');
        } else {
          label.removeClass('completed');
        }
      }
    });

    if (profiles[profilesKey][profile_name].collapsed) {
      $.each(profiles[profilesKey][profile_name].collapsed, function (id, isCollapsed) {
        const collapseElement = $('#' + id);
        if (collapseElement.length > 0) {
          if (isCollapsed) {
            collapseElement.removeClass('show');
          } else {
            collapseElement.addClass('show');
          }
          updateCollapseIcon(id, isCollapsed);
        }
      });
    }
  }

  function updateCollapseIcon(collapseId, isCollapsed) {
    var button = $('a[href="#' + collapseId + '"]');
    if (isCollapsed) {
      button.addClass('collapsed');
    } else {
      button.removeClass('collapsed');
    }
  }
})(jQuery);
