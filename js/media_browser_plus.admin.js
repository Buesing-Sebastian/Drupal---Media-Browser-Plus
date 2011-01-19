(function ($) {
  Drupal.behaviors.media_browser_folders = {
    attach: function (context) {
      var gallery = $('#media-thumb-list');
      // Load active folder
      Drupal.behaviors.media_browser_folders.loadFolderContents($("div.folder_load:first"), 0);
      $("div.folder_load:first").addClass('selectedFolder');
      // Bind click handlers.
      // toggle the display of subfolders
      $( "div.folder-children-toggle" ).bind('click', Drupal.behaviors.media_browser_folders.toggleSubfolders);
      // remove old select assets
      $('div.media-thumbnails-select').remove();
      // folder content loading:
      $('div.folder_load').bind('click', function( event ) {
        // grab item
        var $item = $(this);
        // and load contents
        Drupal.behaviors.media_browser_folders.loadFolderContents($item, 0);
        return false;
      });
      if(Drupal.settings.media_browser_plus.folder_dnd_enabled) {
        $("div.folder_load").droppable({
          accept: "#media-thumb-list > li",
          drop: Drupal.behaviors.media_browser_folders.moveImage,
          over: function (event, ui) {
            $(this).toggleClass('dragOverDrop');
          },
          out: function (event, ui) {
            $(this).toggleClass('dragOverDrop');
          }
        });
        
      }
      $("#media-basket-list").droppable({
          accept: "#media-thumb-list > li",
          drop: Drupal.behaviors.media_browser_folders.dropSelectImage,
          over: function (event, ui) {
            $(this).toggleClass('dragOverDrop');
          },
          out: function (event, ui) {
            $(this).toggleClass('dragOverDrop');
          }
        });
      $('#media_buttons_view').bind('click', function( event ) {
          alert('not yet implemented');
        return false;
      });
      $('#media_main_view_select_all').bind('click', function( event ) {
          $('div.media-item', $('#media-thumb-list')).each(function(index){
            var $media = $(this);
            $media.addClass('selected');
          });
      });
      $('#media_main_view_deselect_all').bind('click', function( event ) {
          $('div.media-item', $('#media-thumb-list')).each(function(index){
            var $media = $(this);
            $media.removeClass('selected');
          });
      });
      $('#media_buttons_select').bind('click', function( event ) {
          $('div.selected', $('#media-thumb-list')).each(function(index){
            // grab item
            var $media = $(this);
            // check for double adding
            $item_dup = $('li[fid="'+$media.parent().attr('fid')+'"]', $('#media-basket-list'));
            if($item_dup.html() == null) {
            var item = '<li fid="' + $media.parent().attr('fid') + '">' + $media.parent().html() + '</li>';
            item += '<input type="hidden" name="selected_media['+$media.parent().attr('fid')+']" value="1">';
            $item = $(item);
            $item.bind('click', function( event ) {
              // grab item
              $item_b = $('li[fid="'+$media.parent().attr('fid')+'"]', $('#media-basket-list'));
              $item_b.remove();
              return true;
              });
            $item.appendTo('#media-basket-list');
            }
          });
        return false;
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
      folder.removeClass('emptyFolder');
      folder.parent().children(":first-child").removeClass("emptyParent");
      folder.parent().children(":first-child").removeClass("empty");
      // look if old folder is now empty
      // send the change media folder request
      // @TODO: think about some success/error UI Feedback
      $.post(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/change_folder", {media: id, folder: folder.attr('id')});
      // remove item from gallery
      item.addClass("movedImage");
      item.fadeOut();
      if($('#media-thumb-list > li:not(.movedImage)').length - 1 == 0){
          var oldFolder = $('div.selectedFolder');
          oldFolder.addClass('emptyFolder');
          if(folder.parent().children(":first-child").hasClass("emptyParent")){
            oldFolder.parent().children(":first-child").addClass("emptyParent");
          } else {
            oldFolder.parent().children(":first-child").addClass("empty");
          }
        }
    },
    dropSelectImage : function (event , ui) {
      $clone = $(ui.draggable);
      $media = $('li[fid="'+$clone.attr('fid')+'"]', $('#media-thumb-list'));
      $id = $media.attr('fid');
      // check for double adding
      $item_dup = $('li[fid="'+$id+'"]', $('#media-basket-list'));
      if($item_dup.html() == null) {
        var item = '<li fid="' + $id + '">' + $media.html() + '</li>';
        item += '<input type="hidden" name="selected_media['+$id+']" value="1">';
        $item = $(item);
        $item.bind('click', function( event ) {
          // grab item
          $item_b = $('li[fid="'+$id+'"]', $('#media-basket-list'));
          $item_b.remove();
          return true;
          });
        $item.appendTo('#media-basket-list');
      }
    },
    loadFolderContents: function ($item, $page) {
      // check against double loading of the same folder
      if($item.hasClass('selectedFolder') && $page == Drupal.settings.media_browser_plus.page) {
        return;
      }
      $('.selectedFolder').removeClass('selectedFolder');
      // Set folder as new active folder and set new page
      $item.addClass('selectedFolder');
      // Remove old pictures.
      $("#media-thumb-list > li").remove();
      var loading = '<li id="loading_media"><img src="'+Drupal.settings.media_browser_plus.images_url+'loading.gif" /><li>';
      $loading = $(loading);
      $loading.appendTo('#media-thumb-list');
      // @TODO: add some kind of loading UI and failure handling here
      // and load in new ones
      $.post(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/thumbnailsJSON", {folder: $item.attr('id'), page : $page}, Drupal.behaviors.media_browser_folders.folderContentsLoaded);
      // redo the pages menu
      Drupal.settings.media_browser_plus.page = $page;
    },
    addPageItem: function ($folder, $page, $title) {
      $page_item = '<div class="media_paging_page';
      if(Drupal.settings.media_browser_plus.page == $page)
        $page_item += " active_page";
      $page_item += '">' + $title + '</div>';
      $page_item = $($page_item);
      $page_item.bind('click', function( event ) {
        // load the selected page
        Drupal.behaviors.media_browser_folders.loadFolderContents($folder, $page);
        return false;
      });
      // append the item
      $('#media_browser_plus_pages').append($page_item);
    },
    folderContentsLoaded: function (data) {
      var $results_count = 0;
      var $overall_count = 0;
      var $folder = "";
      $('#loading_media').remove();
      jQuery(data).each(function(index){
      // grab item
      var $item = $(this);
      // append it to the gallery and do a fadein
      if($item.attr('id') == 'result_count') {
        $results_count = $item.html();
      } else if($item.attr('id') == 'overall_count') {
        $overall_count = $item.html();
      } else if($item.attr('id') == 'folder_loaded') {
        $folder = $("#" + $item.html());
      } else {
        var $temp = $('.media-thumbnail', $item);
        var $link = $('a', $temp);
        var $label = $('.label-wrapper', $temp);
        $link.parent().html($link.html() + '<div class="label-wrapper">' + $label.html() + '</div>');
        //alert($item.html());
        //alert($temp.parent(':nth-child(1)'));
        //$item.html($temp.parent(':nth-child(1)').html() + $temp.parent(':nth-child(2)').html());
        $item.appendTo('#media-thumb-list');
        // make it draggable
        $('div.media-item', $item).bind('click', function( event ) {
          // grab item
          var $media = $(this);
          var $input = $('input', $media.parent());
          //
          $media.toggleClass('selected');
          $input.attr('checked', $input.attr('checked') == false);
          return true;
        });
        if(Drupal.settings.media_browser_plus.folder_dnd_enabled) {
          $item.draggable({
            cancel: "a.ui-icon", // clicking an icon won't initiate dragging
            revert: "invalid", // when not dropped, the item will revert back to its initial position
            containment: "document", // stick to demo-frame if present
            helper: "clone",
            cursor: "move"
          });
        }
      }
      });
      // handle paging menu:
      $('#media_browser_plus_pages').html('');
      var $pages = Math.ceil($overall_count / Drupal.settings.media_browser_plus.per_page);
      var $i = $pages;
      var $start = Math.max(0, Drupal.settings.media_browser_plus.page - Math.ceil(Drupal.settings.media_browser_plus.page_items_per_page / 2));
      var $end = Math.min($pages, $start + Drupal.settings.media_browser_plus.page_items_per_page);
      if($start > 0){
        Drupal.behaviors.media_browser_folders.addPageItem($folder, $start-1, "...");
      }
      // create numbers
      if($pages > 1)
        for($i = $start; $i < $end; $i++){
          Drupal.behaviors.media_browser_folders.addPageItem($folder, $i, $i + 1);
        }
      // append one extra to show that there are more pages
      if($pages > $i){
        Drupal.behaviors.media_browser_folders.addPageItem($folder, $i, "...");
      }
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