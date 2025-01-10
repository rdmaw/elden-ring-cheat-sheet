jQuery(document).ready(function ($) {
  // Open links with new tab
  $("a[href^='http']").each(function () {
    $(this).attr("target", "_blank");
  });

  // Handle tab switching
  $(document).ready(function () {
    $(".nav-link").on("click", function (e) {
      e.preventDefault();

      $(".nav-link").removeClass("active");
      $(".tab-pane").removeClass("show active");

      $(this).addClass("active");

      const targetTab = $(this).attr("href");
      $(targetTab).addClass("show active");
    });
  });
});
