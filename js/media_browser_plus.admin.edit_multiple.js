(function ($) {
  Drupal.behaviors.media_browser_edit_multiple = {
    attach: function (context) {
      // append links media-item
      var $activeItem = $('#edit-item-' + Drupal.settings.media_browser_plus.current_edit_item);
      var $activeTab = $('#media-select-' + Drupal.settings.media_browser_plus.current_edit_item);
      // fade in active one
      $activeTab.toggleClass('selected');
      $activeItem.fadeIn();
      //$('#edit-select').jScrollPane({showArrows: true});
      // add menu action to all thumbs
      $('div.media-select', $('#edit-select')).bind('click', function( event ) {
        // grab item
        var $item = $(this);
        // and load contents
        $item.toggleClass('selected');
        // look up id of tab
        $newItem = $('#' + $item.attr('id').replace("media-select", "edit-item"));
        if($item.hasClass('selected'))
          $newItem.fadeIn();
        else
          $newItem.fadeOut();
        return false;
      });
      // change names of input fields to allow multiple items
      $('fieldset', $('#edit-items')).each(function (index) {
        // grab item
        var $item = $(this);
        // and look for all inputs
        $('input', $item).each(function (index) {
          var $input = $(this);
          var $name = $input.attr('name');
          if($name){
            $arr = $name.split("[");
            if($arr.length > 1){
              $input.attr('name', $item.attr('id') + '[' + $arr[0]  + '][' + $arr[1]);
            }else{
              $input.attr('name', $item.attr('id') + '[' + $input.attr('name')  + ']');
            }
          }
        });
        $('textarea', $item).each(function (index) {
            var $input = $(this);
            var $name = $input.attr('name');
            if($name){
              $arr = $name.split("[");
              if($arr.length > 1){
                $input.attr('name', $item.attr('id') + '[' + $arr[0]  + '][' + $arr[1]);
              }else{
                $input.attr('name', $item.attr('id') + '[' + $input.attr('name')  + ']');
              }
            }
        });
        $('select', $item).each(function (index) {
            var $input = $(this);
            var $name = $input.attr('name');
            if($name){
              $arr = $name.split("[");
              if($arr.length > 1){
                $input.attr('name', $item.attr('id') + '[' + $arr[0]  + '][' + $arr[1]);
              }else{
                $input.attr('name', $item.attr('id') + '[' + $input.attr('name')  + ']');
              }
            }
          });
      });
    }
  }
})(jQuery);