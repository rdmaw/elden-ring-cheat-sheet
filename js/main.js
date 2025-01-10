jQuery(document).ready(function($) {

  // Open links with new tab
  $("a[href^='http']").each(function() {
    $(this).attr('target', '_blank');
  });

});