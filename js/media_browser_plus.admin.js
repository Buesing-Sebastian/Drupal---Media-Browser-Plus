(function ($) {
  Drupal.behaviors.media_browser_folders = {
    attach: function (context) {
      var gallery = $('#media-thumb-list');
      var selectedPreviewIndex = 0;
      var selectedPreviewItems = new Array();
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
        drop: Drupal.behaviors.media_browser_folders.dropSelectedMedia,
        over: function (event, ui) {
          $(this).toggleClass('dragOverDrop');
        },
        out: function (event, ui) {
          $(this).toggleClass('dragOverDrop');
        }
      }); 
      $('#media-filter-launch').bind('click', function( event ) {
        $.colorbox({iframe:true, href:Drupal.settings.media_browser_plus.url +
          "?q=admin/content/media/filter", width:"90%", height:"90%", onClosed: Drupal.behaviors.media_browser_folders.reloadData});
        return false;
      });
      $('#media_buttons_view').bind('click', function( event ) {
          $media = $("div.selected:first", $('#media-thumb-list'));
          if($media.html() != null)
            window.open(Drupal.settings.media_browser_plus.url +
              "?q=media/" + $media.parent().attr('fid') + "/view");
          return false;
        });
      $('#media_buttons_preview').bind('click', function( event ) {
        // reset selectionArray
        selectedPreviewItems = new Array();
        selectedPreviewIndex = 0;
        $("div.selected", $('#media-thumb-list')).each(function(index) {
          var $media = $(this);
          // check for double adding
          selectedPreviewItems.push($media.parent().attr('fid'));
        });
        if(selectedPreviewItems.length > 0) {
          // open an empty colorbox to show activity
          $.colorbox({initialWidth:"300px", initialHeight:"200px"});
          Drupal.behaviors.media_browser_folders.loadPreview(selectedPreviewItems[selectedPreviewIndex]);
        }
      return false;
      });
      $('#media_basket_remove_all').bind('click', function( event ) {
        $('li', $('#media-basket-list')).each(function(index){
          var $media = $(this);
          $media.remove();
        });
        return false;
      });
      $('#previous_preview_item').bind('click', function( event ) {
        selectedPreviewIndex--;
        if(selectedPreviewIndex < 0)
          selectedPreviewIndex = selectedPreviewItems.length - 1;
        Drupal.behaviors.media_browser_folders.loadPreview(selectedPreviewItems[selectedPreviewIndex]);
        return false;
      }); 
      $('#select_preview_item').bind('click', function( event ) {
        $media = $('div.media-item', $('li[fid="' + selectedPreviewItems[selectedPreviewIndex] + '"]', $('#media-thumb-list')));
        Drupal.behaviors.media_browser_folders.selectMedia($media);
        return false;
      });
      $('#next_preview_item').bind('click', function( event ) {
        selectedPreviewIndex++;
        if(selectedPreviewIndex > (selectedPreviewItems.length -1))
          selectedPreviewIndex = 0;
        Drupal.behaviors.media_browser_folders.loadPreview(selectedPreviewItems[selectedPreviewIndex]);
        return false;
      });
      $('#media_main_view_select_all').bind('click', function( event ) {
          $('div.media-item', $('#media-thumb-list')).each(function(index){
            var $media = $(this);
            var $input = $('input', $media.parent());
            //
            $media.addClass('selected');
            $input.attr('checked', true);
          });
      });
      $('#media_main_view_deselect_all').bind('click', function( event ) {
          $('div.media-item', $('#media-thumb-list')).each(function(index){
            var $media = $(this);
            var $input = $('input', $media.parent());
            //
            $media.removeClass('selected');
            $input.attr('checked', false);
          });
      });
      $('#media_buttons_select').bind('click', function( event ) {
        Drupal.behaviors.media_browser_folders.selectMediaItems();
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
      if($('#media-thumb-list > li:not(.movedImage)').length - 2 <= 0){
          var oldFolder = $('div.selectedFolder');
          oldFolder.addClass('emptyFolder');
          if(folder.parent().children(":first-child").hasClass("emptyParent")){
            oldFolder.parent().children(":first-child").addClass("emptyParent");
          } else {
            oldFolder.parent().children(":first-child").addClass("empty");
          }
        }
    },
    selectMediaItems : function (data) {
      $('div.selected', $('#media-thumb-list')).each(function(index){
        // put single select check here to otherwise 
        // you get a whole lot of alerts in some cases
        if(!Drupal.settings.media_browser_plus.multiselect) {
          if($('li', $('#media-basket-list')).html() != null) {
            alert(Drupal.settings.media_browser_plus.messages.only_one_selection_allowed);
            return false;
          }
        }
        // grab item
        var $media = $(this);
        Drupal.behaviors.media_browser_folders.selectMedia($media);
      });
    },
    selectMedia: function (data) {
      // check for double adding
      $media = $(data);
      Drupal.behaviors.media_browser_folders.performMediaBasketSelection($media.parent());
    },
    dropSelectedMedia : function (event , ui) {
      $clone = $(ui.draggable);
      $media = $('li[fid="'+$clone.attr('fid')+'"]', $('#media-thumb-list'));
      Drupal.behaviors.media_browser_folders.performMediaBasketSelection($media);
      if(Drupal.settings.media_browser_plus.multiselect)
        Drupal.behaviors.media_browser_folders.selectMediaItems();
    },
    performMediaBasketSelection : function ($media) {
      $id = $media.attr('fid');
      // check if single-section mode is set
      if(!Drupal.settings.media_browser_plus.multiselect) {
        if($('li', $('#media-basket-list')).html() != null) {
          alert(Drupal.settings.media_browser_plus.messages.only_one_selection_allowed);
          return false;
        }
      }
      // check for double adding
      $item_dup = $('li[fid="'+$id+'"]', $('#media-basket-list'));
      if($item_dup.html() == null) {
        var item = '<li fid="' + $id + '">' + $media.html() + '</li>';
        $item = $(item).clone();
        $item.removeClass('selected');
        $('.media-item', $item).append('<input type="hidden" name="selected_media['+$id+']" value="1">');
        $item.bind('click', function( event ) {
          $(this).remove();
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
        $item.draggable({
          cancel: "a.ui-icon", // clicking an icon won't initiate dragging
          revert: "invalid", // when not dropped, the item will revert back to its initial position
          containment: "document", // stick to demo-frame if present
          helper: "clone",
          cursor: "move"
        });
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
    },
    loadPreview: function (id) {
      if(id > 0) {
        $('#media-preview-label').html('...');
        var myWidth = 0, myHeight = 0;
        if( typeof( window.innerWidth ) == 'number' ) {
          //Non-IE
          myWidth = window.innerWidth;
          myHeight = window.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
          //IE 6+ in 'standards compliant mode'
          myWidth = document.documentElement.clientWidth;
          myHeight = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
          //IE 4 compatible
          myWidth = document.body.clientWidth;
          myHeight = document.body.clientHeight;
        }
        $maxWidth = myWidth - 50;
        $maxHeight = myHeight - 150;
        $.post(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/" + id +"/preview", { maxWidth: $maxWidth, maxHeight: $maxHeight}, Drupal.behaviors.media_browser_folders.displayLoadedPreview);
        $('#media_browser_plus_preview_content').html('<img src="'+Drupal.settings.media_browser_plus.images_url+'loading.gif" />');
      }
    },
    displayLoadedPreview: function (data) {
      var $item = $(this);
      $('#media_browser_plus_preview_content').html(data);
      $meta = $('.preview-metadata', $('#media_browser_plus_preview_content'));
      $.colorbox({inline:true, href:"#media-preview-table"});
      $('#media-preview-label').html($meta.attr('title'));
    },
    reloadData: function (data) {
      window.location.reload();
    }
  };
})(jQuery);