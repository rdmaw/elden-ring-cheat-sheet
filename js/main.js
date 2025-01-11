(function ($) {
  var defaultProfiles = {
    current: "Default",
    defaultProfileName: "Default",
  };

  defaultProfiles[profilesKey] = {
    "Default": {
      checklistData: {},
      collapsed: {},
      isDefault: true
    },
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

  window.onload = function () {
    restoreState(profiles.current);
    initializeUI();
  };

  function initializeUI() {
    if ($("ul li[data-id]").length === 0) {
      return;
    }

    if (profiles.current && profiles[profilesKey][profiles.current]) {
      restoreState(profiles.current);
    }

    populateChecklists();

    $("ul li[data-id]").each(function () {
      addCheckbox(this);
    });

    populateProfiles();
    calculateTotals();
  }

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

  $(document).ready(function () {
    restoreState(profiles.current);
    calculateTotals();

    $("a[href^='http']").attr("target", "_blank");

    $(".nav-link").on("click", function (e) {
      e.preventDefault();
      $(".nav-link").removeClass("active");
      $(".tab-pane").removeClass("show active");
      $(this).addClass("active");
      const targetTab = $(this).attr("href");
      $(targetTab).addClass("show active");
    });

    $('input[type="checkbox"]').click(function () {
      var id = $(this).attr("id");
      var isChecked = (profiles[profilesKey][profiles.current].checklistData[
        id
      ] = $(this).prop("checked"));
      if (isChecked === true) {
        $('[data-id="' + id + '"] label').addClass("completed");
      } else {
        $('[data-id="' + id + '"] label').removeClass("completed");
      }
      $(this)
        .parent()
        .parent()
        .find('li > label > input[type="checkbox"]')
        .each(function () {
          var id = $(this).attr("id");
          profiles[profilesKey][profiles.current].checklistData[id] = isChecked;
          $(this).prop("checked", isChecked);
        });
      $.jStorage.set(profilesKey, profiles);
      calculateTotals();
    });

    $('.checkbox input[type="checkbox"]').click(function () {
      var id = $(this).attr('id');
      var isChecked = profiles[profilesKey][profiles.current].checklistData[id] = $(this).prop('checked');

      if (isChecked === true) {
        $(this).closest('.checkbox').find('label').addClass('completed');
      } else {
        $(this).closest('.checkbox').find('label').removeClass('completed');
      }

      $.jStorage.set(profilesKey, profiles);
      calculateTotals();
    });

    $("#profiles").change(function (event) {
      profiles.current = $(this).val();
      $.jStorage.set(profilesKey, profiles);

      populateChecklists();
    });

    $('#profiles').on('change', function () {
      switchProfile($(this).val());
    });

    $('#addProfile').on('click', function () {
      var profileName = prompt("Enter new profile name:");

      if (profileName && !profiles[profilesKey][profileName]) {
        if (addProfile(profileName)) {
          switchProfile(profileName);
          populateProfiles();
          calculateTotals();
        }
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
        alert("Can't delete the default profile.");
        return;
      }

      if (confirm('Are you sure you want to delete this profile?')) {
        if (deleteProfile(currentProfile)) {
          switchProfile(profiles.current);
          restoreState(profiles.current);
          populateProfiles();
          calculateTotals();
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
      var collapseId = $(this).attr('id');
      var isCollapsed = !$(this).hasClass('show');

      profiles[profilesKey][profiles.current].collapsed[collapseId] = isCollapsed;
      $.jStorage.set(profilesKey, profiles);
    });

    $(document).on("change", "input[type='checkbox']", function () {
      var id = $(this).attr('id');
      var isChecked = $(this).prop('checked');

      profiles[profilesKey][profiles.current].checklistData[id] = isChecked;

      if (isChecked) {
        $(this).closest('.checkbox').find('label').addClass('completed');
      } else {
        $(this).closest('.checkbox').find('label').removeClass('completed');
      }
      $.jStorage.set(profilesKey, profiles);

      calculateTotals();
    });
    calculateTotals();
  });

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
    var overallCount = 0;
    var overallChecked = 0;

    $("input[type='checkbox']").each(function () {
      overallCount++;
      if ($(this).is(":checked")) {
        overallChecked++;
      }
    });

    $(".totals").each(function () {
      if (overallChecked === overallCount) {
        this.innerHTML = "DONE";
        $(this).removeClass("in_progress").addClass("done");
      } else {
        this.innerHTML = overallChecked + "/" + overallCount;
        $(this).removeClass("done").addClass("in_progress");
      }
    });
  }

  function calculateTotals() {
    $('[id$="_overall_total"]').each(function (index) {
      var type = this.id.match(/(.*)_overall_total/)[1];
      var overallCount = 0,
        overallChecked = 0;

      $('[id^="' + type + '_totals_"]').each(function (index) {
        var regex = new RegExp(type + "_totals_(.*)");
        var regexFilter = new RegExp("^playthrough_(.*)");
        var i = parseInt(this.id.match(regex)[1]);
        var count = 0,
          checked = 0;

        for (var j = 1; ; j++) {
          var checkbox = $("#" + type + "_" + i + "_" + j);
          if (checkbox.length == 0) {
            break;
          }
          if (
            checkbox.is(":hidden") &&
            checkbox.prop("id").match(regexFilter) &&
            canFilter(checkbox.closest("li"))
          ) {
            continue;
          }
          count++;
          overallCount++;
          if (checkbox.prop("checked")) {
            checked++;
            overallChecked++;
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
  }

  function addProfile(profileName) {
    if (!profiles[profilesKey][profileName]) {
      clearUI();
      profiles[profilesKey][profileName] = {
        checklistData: {},
        collapsed: {},
        isDefault: false
      };
      $.jStorage.set(profilesKey, profiles);
      return true;
    }
    return false;
  }

  function switchProfile(profileName) {
    if (profiles[profilesKey][profileName]) {
      clearUI();
      profiles.current = profileName;
      $.jStorage.set(profilesKey, profiles);
      restoreState(profileName);
      calculateTotals();
    }
  }

  function deleteProfile(profileName) {
    if (!profiles[profilesKey][profileName] ||
      profiles[profilesKey][profileName].isDefault) {
      return false;
    }

    if (Object.keys(profiles[profilesKey]).length <= 1) {
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

  function canFilter(entry) {
    if (!entry.attr("class")) {
      return false;
    }

    var classList = entry.attr("class").split(/\s+/);
    var foundMatch = 0;

    for (var i = 0; i < classList.length; i++) {
      if (!classList[i].match(/^f_(.*)/)) {
        continue;
      }

      if (
        classList[i] in
        profiles[profilesKey][profiles.current].hidden_categories
      ) {
        if (
          !profiles[profilesKey][profiles.current].hidden_categories[
          classList[i]
          ]
        ) {
          return false;
        }
        foundMatch = 1;
      }
    }

    if (foundMatch === 0) {
      return false;
    }
    return true;
  }

  function restoreState(profile_name) {
    console.log("Restoring state for profile:", profile_name);

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
