jQuery(document).ready(function() {
  //
  jQuery(function() {
    // define our base variables to work with
    var $gallery = jQuery( "#media-admin-gallery" ),
      $folder = jQuery( "#folder" ),
      $activeFolder = jQuery( "div.folder_load:first");
    // let the gallery items be draggable
    jQuery( "li", $gallery ).draggable({
        cancel: "a.ui-icon", // clicking an icon won't initiate dragging
        revert: "invalid", // when not dropped, the item will revert back to its initial position
        containment: "document", // stick to table
        helper: "clone",
        cursor: "move"
    });
    // load active folder
    if($activeFolder){
      $activeFolder = null;
      loadFolderContents(jQuery( "div.folder_load:first"));
    }
    	
      
    // function which moves an image into a new folder
    function moveImage( $item , $folder) {
        // every image has an hidden input with its id inside its <li> tag
        var $id = $item.find("input").attr('value');
        // remove the hover media over folder class
        $folder.removeClass('dragOverDrop');
        // send the change media folder request
        // @TODO: think about some success/error UI Feedback
        jQuery.post("/?q=admin/content/media/change_category", { media: $id, folder: $folder.attr('id') },
          function(data){
            // which would be applied here
         });	
        // remove item from gallery
        $item.fadeOut();
    }
    //
    function loadFolderContents($item){
      // check against double loading of the same folder
      if($activeFolder == $item)
       return;
       // remove selection from last selected folder
      if($activeFolder)
        $activeFolder.removeClass('selectedFolder');
      // set folder as new active folder
      $activeFolder = $item;
      $activeFolder.addClass('selectedFolder');
      // remove old pictures 
      jQuery("#media-admin-gallery > li").each(function(index)
      {
        jQuery(this).fadeOut().remove();
      });
      // @TODO: add some kind of loading UI and failure handling here
      // and load in new ones
      jQuery.post("/drupal7a/?q=admin/content/media/thumbnailsJSON", { folder: $item.attr('id') },
        function(data){
          // for each loaded item...
          jQuery(data).each(function(index){
          // grab item
          var $item = jQuery(this);
          // append it to the gallery and do a fadein
          $item.appendTo( $gallery ).fadeIn();
          // make it draggable 
            $item.draggable({
              cancel: "a.ui-icon", // clicking an icon won't initiate dragging
              revert: "invalid", // when not dropped, the item will revert back to its initial position
              containment: "document", // stick to demo-frame if present
              helper: "clone",
              cursor: "move"
            });
         });
      });
    }
    
    // toggle the display of subfolders
    jQuery( "div.fparent" ).click(function( event ) {
      // grab folder
      var $item = jQuery( this );
      // iterate through its <ul> elements	
      $item.parent().children('ul').each(function(index) {
        // and toggle their display
        jQuery(this).toggleClass('hidden');
      });
      return false;
    });
  
    // folder content loading:
  jQuery( "div.folder_load" ).click(function( event ) {
    // grab item
    var $item = jQuery( this );
    // and load contents
    loadFolderContents($item);
    return false;
  });
  
  jQuery( "div.folder_load" ).each(function(index) {
    // grabbing item
    var $item = jQuery(this);
    // make each on droppable
    if($item.attr('id') != 'folder_load_0'){
      $item.droppable({
        accept: "#media-admin-gallery > li",
        activeClass: "ui-state-highlight",
        drop: function( event, ui ) {
          moveImage( ui.draggable , $item);
        },
        over: function(event, ui) { 
          $item.toggleClass('dragOverDrop');
        },
        out: function(event, ui) { 
          $item.toggleClass('dragOverDrop');
        }
      });
    }
  });
  });
});
