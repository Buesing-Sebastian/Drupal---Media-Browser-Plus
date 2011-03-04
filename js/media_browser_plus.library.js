(function ($) {
  Drupal.behaviors.media_browser_library = {
    attach: function (context) {
      //Drupal.media.browser.selectedMedia = [];
      $('#proceed_with_select').bind('click', function( event ) {
        // checking for selection mode
        if(!Drupal.settings.media_browser_plus.multiselect) {
          var id = $('div.media-item.selected:first', $('#media-thumb-list')).parent().attr('id');
          // grab id - remove the "media-item-" part
          id = Drupal.behaviors.media_browser_folders.getId(id, 11);
          // add object
          Drupal.behaviors.media_browser_library.selectMedia(id);
        } else {
          // getting selected media objects
          $('#media-basket-list li').each(function (index) {
            // grab id - remove the "basket-media-item-" part
            var id = Drupal.behaviors.media_browser_folders.getId($(this).attr('id'), 18);
            // add object
            Drupal.behaviors.media_browser_library.selectMedia(id);
          });
        }
        Drupal.media.browser.submit();
        return false;
      });
      // resize the media browser
      if(typeof (parent.frames[0].innerWidth) == 'number'){
        width = parent.frames[0].innerWidth - 50;
        $('#mediaBrowser', top.document).css('width', width+'px');
        $('.ui-dialog.media-wrapper', top.document).css('top', '25px');
        $('.ui-dialog.media-wrapper', top.document).css('left', '50px');
        $('#mediaBrowser', top.document).attr('width', width);
        $('.ui-dialog.media-wrapper', top.document).css('width', (width+10)+'px');
      }
    },
    selectMedia : function (id) {
      var media = Drupal.behaviors.media_browser_folders.loadedMedia;
      for(var i = 0; i < media.length; i++) {
        if(media[i].fid == id) {
          Drupal.media.browser.selectedMedia.push(media[i]);
          break;
        }
      }
    }
  };
})(jQuery);