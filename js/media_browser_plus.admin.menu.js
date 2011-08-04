(function ($) {
  Drupal.behaviors.media_browser_menu = {
    attach: function (context) {
      // append links
      if($('ul.action-links').html() == null) {
        $('#media-admin').prepend('<div><ul class="action-links"></ul></div>');
      }
      var $filterLink = "";
      if(Drupal.settings.media_browser_plus.filter_active && Drupal.settings.media_browser_plus.filter_allowed)
        $filterLink = $('<a id="media-filter-launch" href="' + Drupal.settings.media_browser_plus.url + '?q=admin/content/media/filter"></a>').html('Change <b>(active)</b> Filter');
      else
        $filterLink = $('<a id="media-filter-launch" href="' + Drupal.settings.media_browser_plus.url + '?q=admin/content/media/filter"></a>').html('Apply Filter');
      $('ul.action-links', context).append($('<li></li>').append($filterLink));
      if(Drupal.settings.media_browser_plus.manage_folders) {
        var $foldersLink = $('<a href="' + Drupal.settings.media_browser_plus.folder_management_url + '"></a>').html('Folder Management');
        $('ul.action-links', context).append($('<li></li>').append($foldersLink));
      }
      if(!Drupal.settings.media_browser_plus.add_files) {
        $('.media-launcher').remove();
      }
    }
  }
})(jQuery);