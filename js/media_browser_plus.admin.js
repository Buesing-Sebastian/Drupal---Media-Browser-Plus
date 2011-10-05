(function ($) {
  Drupal.behaviors.media_browser_folders = {
    attach: function (context) {
      // Show hided links from media module
      $('.action-links li').show();
      var gallery = $('#media-thumb-list');
      var selectedPreviewIndex = 0;
      var selectedPreviewItems = new Array();
      Drupal.behaviors.media_browser_folders.loadedMedia = new Array();
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
      $('input#media-field-tags-filter, input#media-filename-filter').bind('blur', function() {
        if ($(this).val()) {
          Drupal.behaviors.media_browser_folders.filterMedia($(this));
        }
        return false;
      });
      $('input#media-clear-filter').bind('click',function() {
        Drupal.behaviors.media_browser_folders.filterMedia($(this));
        $('input#media-field-tags-filter, input#media-filename-filter').val('');
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
              "?q=media/" +Drupal.behaviors.media_browser_folders.getId($media.parent().attr('id'), 11) + "/view");
          return false;
        });
      $('#media_buttons_preview').bind('click', function( event ) {
        // reset selectionArray
        selectedPreviewItems = new Array();
        selectedPreviewIndex = 0;
        $("div.media-item.selected", $('#media-thumb-list')).each(function(index) {
          var $media = $(this);
          // check for double adding
          selectedPreviewItems.push(Drupal.behaviors.media_browser_folders.getId($media.parent().attr('id'), 11));
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
        $media = $('div.media-item', $('#media-item-' + selectedPreviewItems[selectedPreviewIndex], $('#media-thumb-list')));
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
      var id = Drupal.behaviors.media_browser_folders.getId(item.attr('id'), 11);
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
    clickFolder: function (id) {
      $('#folder_load_' + id).click();
    },
    dropSelectedMedia : function (event , ui) {
      $clone = $(ui.draggable);
      $media = $('li[id="'+$clone.attr('id')+'"]', $('#media-thumb-list'));
      Drupal.behaviors.media_browser_folders.performMediaBasketSelection($media);
      if(Drupal.settings.media_browser_plus.multiselect)
        Drupal.behaviors.media_browser_folders.selectMediaItems();
    },
    performMediaBasketSelection : function ($media) {
      var id = $media.attr('id');
      id = id.slice(11, id.length);
      // check if single-section mode is set
      if(!Drupal.settings.media_browser_plus.multiselect) {
        if($('li', $('#media-basket-list')).html() != null) {
          alert(Drupal.settings.media_browser_plus.messages.only_one_selection_allowed);
          return false;
        }
      }
      // check for double adding
      $item_dup = $('li[id="basket-media-item-'+id+'"]', $('#media-basket-list'));
      if($item_dup.html() == null) {
        var item = '<li id="basket-media-item-' + id + '">' + $media.html() + '</li>';
        $item = $(item).clone();
        $item.removeClass('selected');
        $('.media-item', $item).append('<input type="hidden" name="selected_media['+id+']" value="1">');
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
      $filter = Drupal.settings.media_browser_plus.filter;
      $.getJSON(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/thumbnailsJSON", {folder: $item.attr('id'), page : $page, filter : $filter}, Drupal.behaviors.media_browser_folders.folderContentsLoaded);
      // redo the pages menu
      Drupal.settings.media_browser_plus.page = $page;
    },
    filterMedia: function ($item) {
      $("#media-thumb-list > li").remove();
      var loading = '<li id="loading_media"><img src="'+Drupal.settings.media_browser_plus.images_url+'loading.gif" /><li>';
      $loading = $(loading);
      $loading.appendTo('#media-thumb-list');
      $.getJSON(Drupal.settings.media_browser_plus.url + "?q=admin/content/media/filterJSON", {filter: $item.attr('id'), text: $item.val()}, Drupal.behaviors.media_browser_folders.mediaFiltered);
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
      var results_count = data['media'].length;
      var overall_count = data['overall_count'];
      var folder = $('#'+data['folder_loaded']);
      var newMedia = data['media'];
      Drupal.behaviors.media_browser_folders.loadedMedia = Drupal.behaviors.media_browser_folders.loadedMedia.concat(newMedia);
      // remove loading indicator
      $('#loading_media').remove();
      jQuery(data['media']).each(function(index){
        // grab item
        var item = this;
        // create checkbox for form actions
        var checkbox = '<input class="form-checkbox hidden" id="edit-files-' + item.fid + '" name="files[' + item.fid + ']" value="1" type="checkbox">';
        // append item
        var listItem = $('<li></li>').appendTo('#media-thumb-list')
          .attr('id', 'media-item-' + item.fid)
          .html(checkbox + item.preview)
          .bind('click', function( event ) {
            // grab item
            var media = $(this);
            var input = $('input', media);
            // toggle selection
            $('.media-item', media).toggleClass('selected');
            input.attr('checked', input.attr('checked') == false);
            // check for single-selection
            if(!Drupal.settings.media_browser_plus.multiselect) {
              // and remove all other selections
            }
            return true;
          })
          .dblclick( function(event) {
            $('input', $(this)).attr('checked', true);
            $('#media_buttons_edit').click();
          });
        $item = $(item);
        if(Drupal.settings.media_browser_plus.multiselect || Drupal.settings.media_browser_plus.folder_dnd_enabled)
          listItem.draggable({
            cancel: "a.ui-icon", // clicking an icon won't initiate dragging
            revert: "invalid", // when not dropped, the item will revert back to its initial position
            containment: "document", // stick to demo-frame if present
            helper: "clone",
            cursor: "move"
          });
      });
      // handle paging menu:
      $('#media_browser_plus_pages').html('');
      var $pages = Math.ceil(overall_count / Drupal.settings.media_browser_plus.per_page);
      var $i = $pages;
      var $start = Math.max(0, Drupal.settings.media_browser_plus.page - Math.ceil(Drupal.settings.media_browser_plus.page_items_per_page / 2));
      var $end = Math.min($pages, $start + Drupal.settings.media_browser_plus.page_items_per_page);
      if($start > 0){
        Drupal.behaviors.media_browser_folders.addPageItem(folder, $start-1, "...");
      }
      // create numbers
      if($pages > 1)
        for($i = $start; $i < $end; $i++){
          Drupal.behaviors.media_browser_folders.addPageItem(folder, $i, $i + 1);
        }
      // append one extra to show that there are more pages
      if($pages > $i){
        Drupal.behaviors.media_browser_folders.addPageItem(folder, $i, "...");
      }
    },
    mediaFiltered: function (data) {
      var first = '';
      $(data).each(function(){
        $.each(this, function(index, value) {
          if (value) {
            $('#folder_load_' + index).addClass(value);
            $('.tid_' + index).addClass('empty');
          }
          else {
            $('#folder_load_' + index).removeClass('emptyFolder');
            $('.tid_' + index).removeClass('empty');
            // Keep the first folder id with contents so we get user there
            if (!first) {
              Drupal.behaviors.media_browser_folders.clickFolder(index);
            }
          }
        });
      });
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
          myWidth = window.parent.innerWidth;
          myHeight = window.parent.innerHeight;
        } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
          //IE 6+ in 'standards compliant mode'
          myWidth = document.documentElement.clientWidth;
          myHeight = document.documentElement.clientHeight;
        } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
          //IE 4 compatible
          myWidth = document.body.clientWidth;
          myHeight = document.body.clientHeight;
        }
        $maxWidth = myWidth - 100;
        $maxHeight = myHeight - 250;
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
    },
    getWindowSize: function () {
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
      return new Array(myWidth, myHeight);
    },
    getId : function (idString, idStart) {
      return idString.slice(idStart, idString.length);
    }
  };
})(jQuery);
