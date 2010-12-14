(function ($) {
  Drupal.behaviors.media_browser_folders = {
    attach: function () {
      var gallery = $('.media-list-thumbnails');
      // Let the gallery items be draggable
      $( "li", gallery ).draggable({
        cancel: "a.ui-icon", // clicking an icon won't initiate dragging
        revert: "invalid", // when not dropped, the item will revert back to its initial position
        containment: "document", // stick to table
        helper: "clone",
        cursor: "move"
      });
      
      // Load active folder
      Drupal.behaviors.media_browser_folders.loadFolderContents($("div.folder_load:first"), 1);
      $("div.folder_load:first").addClass('selectedFolder');

      // Bind click handlers.
      // toggle the display of subfolders
      $( "div.fparent" ).bind('click', Drupal.behaviors.media_browser_folders.toggleSubfolders);

      // folder content loading:
      $('div.folder_load').bind('click', function( event ) {
        // grab item
        var $item = $(this);
        // and load contents
        Drupal.behaviors.media_browser_folders.loadFolderContents($item, 1);
        return false;
      });

      $("div.folder_load" ).not('#folder_load_0').droppable({
        accept: ".media-list-thumbnails > li",
        drop: Drupal.behaviors.media_browser_folders.moveImage,
        over: function (event, ui) {
          $(this).toggleClass('dragOverDrop');
        },
        out: function (event, ui) {
          $(this).toggleClass('dragOverDrop');
        }
      });
    },
    // function which moves an image into a new folder
    moveImage : function (event , ui) {
      var folder = $(this);
      if (folder.hasClass('selectedFolder')) {
        return;
      }
      var item = ui.draggable;
      // every image has an hidden input with its id inside its <li> tag
      var id = item.attr('fid');
      // remove the hover media over folder class
      folder.removeClass('dragOverDrop');
      // send the change media folder request
      // @TODO: think about some success/error UI Feedback
      $.post(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/change_category", {media: id, folder: folder.attr('id')});
      // remove item from gallery
      item.fadeOut();
    },
    loadFolderContents: function ($item, $page) {
      // check against double loading of the same folder
      if($item.hasClass('selectedFolder')) {
        return;
      }

      $('.selectedFolder').removeClass('selectedFolder');
      // Set folder as new active folder.
      $item.addClass('selectedFolder');
      // Remove old pictures.
      $(".media-list-thumbnails > li").remove();
      // @TODO: add some kind of loading UI and failure handling here
      // and load in new ones
      $.post(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/thumbnailsJSON", {folder: $item.attr('id')}, Drupal.behaviors.media_browser_folders.folderContentsLoaded);
    },
    folderContentsLoaded: function (data) {
      jQuery(data).each(function(index){
      // grab item
      var $item = $(this);
      // append it to the gallery and do a fadein
      if($item.attr('id') == 'resultCount') {
        $('#media_browser_plus_pages').html('Results: ' + $item.html())
      } else {
        $item.prependTo('.media-list-thumbnails');
        // make it draggable
        $item.draggable({
          cancel: "a.ui-icon", // clicking an icon won't initiate dragging
          revert: "invalid", // when not dropped, the item will revert back to its initial position
          containment: "document", // stick to demo-frame if present
          helper: "clone",
          cursor: "move"
        });
      }
      });
    },
    toggleSubfolders: function (event) {
      // Grab folder.
      var $item = $(this);
      // Toggle the display of its <ul> elements.
      $item.parent().children('ul').toggleClass('hidden');
      return false;
    }
  };
})(jQuery);