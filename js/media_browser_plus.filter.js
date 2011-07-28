(function ($) {
  Drupal.behaviors.media_browser_filter = {
    attach: function (context) {
      // append links
      $('#page').attr('style', 'margin-top:0px; position: absolute; top: 0px; left:0px;');
      $('body').html($('#page'));
      //
      if(Drupal.settings.media_browser_plus.autoclose)
        parent.jQuery.fn.colorbox.close();
    }
  };
})(jQuery);