jQuery(document).ready(function($) {

  $("a[href^='http']").each(function() {
    $(this).attr('target', '_blank');
  });
});
