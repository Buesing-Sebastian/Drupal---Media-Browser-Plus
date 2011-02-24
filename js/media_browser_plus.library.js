(function ($) {
  Drupal.behaviors.media_browser_library = {
    attach: function (context) {
      //
      $('#proceed_with_select').bind('click', function( event ) {
        // @TODO: call Drupal media browser submit
        alert("not yet implemented");
        return false;
      });
      
    }
  };
})(jQuery);