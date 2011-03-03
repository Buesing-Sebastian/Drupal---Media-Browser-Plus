(function ($) {
  Drupal.behaviors.media_browser_library = {
    attach: function (context) {
      //Drupal.media.browser.selectedMedia = [];
      $('#proceed_with_select').bind('click', function( event ) {
        // getting selected media objects
        $('#media-basket-list li').each(function (index) {
          // grab id
          var id = $(this).attr('id');
          id = id.slice(18, id.length);
          // find object
          var media = Drupal.behaviors.media_browser_folders.loadedMedia;
          for(var i = 0; i < media.length; i++) {
            if(media[i].fid == id) {
              Drupal.media.browser.selectedMedia.push(media[i]);
              break;
            }
          }
        });
        Drupal.media.browser.submit();
        return false;
      });
    }
  };
})(jQuery);