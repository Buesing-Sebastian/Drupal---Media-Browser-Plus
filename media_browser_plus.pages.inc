<?php
/**
 * @file
 * Common pages for the media browser plus module.
 */

/**
 * Create a form to edit multiple fiel entities.
 * @param $fids Array with file id's.
 */
function media_browser_plus_edit_multiple_form($fids) {
  // load media
  $ids = explode(' ', $fids);
  $variables = array('ids' => $ids, 'paging' => false, 'apply_filter' => false);
  $media_items = media_browser_plus_load_multiple($variables)->results;
  // produce form via multiform
  module_load_include('inc', 'media', 'includes/media.pages');
  $form = media_page_multiedit($media_items);
  // @TODO: change to normale redirect once this works with multiform
  if (isset($_POST['op'])) {
    if (isset($_GET['destination'])) {
      $destination = drupal_get_destination();
      unset($_GET['destination']);
    }
    $destination = isset($destination['destination']) ? $destination['destination'] : 'admin/content/media';
    if($_POST['op'] === 'Save' && !form_get_errors()) {
      if($_POST['op'] === 'Save' && !form_get_errors())
        drupal_set_message(t('Media items changed successfully'));
      drupal_goto($destination);
    }
    if($_POST['op'] === 'Cancel') {
      drupal_goto($destination);
    }
  }
  return $form;
}

/**
 * Provide a form to confirm the deletion of multiple file entites.
 *
 * @param $form
 * @param $form_state
 * @param $fids
 */
function media_browser_plus_delete_multiple_form($form, &$form_state, $fids) {
  // media_multiple_delete_confirm($form, &$form_state, $files
  $files = array();
  foreach(explode(" ", $fids) as $key => $value) {
    $files[$value] = $value;
  }
  module_load_include('inc', 'media', 'includes/media.pages');
  $form = media_multiple_delete_confirm($form, $form_state, $files);
  return $form;
}

/**
 * Provide a preview matching to the available resolution of the screen.
 *
 * @param $form
 * @param $form_state
 * @param $media
 */
function media_browser_plus_media_preview($form, &$form_state, $media) {
  if($media->type == 'image') {
    $maxWidth = (int)$_POST['maxWidth'];
    $maxHeight = (int)$_POST['maxHeight'];
    //echo drupal_render($form['preview']);
    list($sx, $sy) = getimagesize(drupal_realpath($media->uri));
    if($sx > $maxWidth){
      $ratio = bcdiv($maxWidth, $sx, 5);
      $sx = $maxWidth;
      $sy = bcmul($sy, $ratio, 0);
    }
    if($sy > $maxHeight){
      $ratio = bcdiv($maxHeight, $sy, 5);
      $sy = $maxHeight;
      $sx = bcmul($sx, $ratio, 0);
    }
    $base_url = "http://" . $_SERVER['HTTP_HOST'] . base_path();
    $uri = "";
    if(strstr($media->uri, "private://")) {
      $stream = new DrupalPrivateStreamWrapper();
    } else {
      $stream = new DrupalPublicStreamWrapper();
    }
    $stream->setUri($media->uri);
    $uri = $stream->getExternalUrl($media->uri);
    // output
    echo '<div class="preview-metadata" title="'.$media->filename.'">' .
      '<img width="'.$sx.'" height="'.$sy.'" src="'.$uri.'" /></div>';
  } else {
    $form['preview'] = media_get_thumbnail_preview(media_load($media->fid), TRUE);
    echo drupal_render($form['preview']);
  }
  die();
}

/**
 * Simply redirect the user to the thumbnailview.
 * @param $form
 * @param $form_state
 */
function media_browser_plus_media_preview_submit($form, &$form_state) {
  $form_state['redirect'] = 'admin/content/media/thumbnails';
}

/**
 * Enter description
 */
function media_browser_plus_media_filter(){
  $form = array();
  $path = drupal_get_path('module', 'media_browser_plus');
  $form['#attached']['js'][] = $path . '/js/media_browser_plus.filter.js';
  $form['#attached']['css'][] = $path . '/css/media_browser_plus.filter.css';
  // getting the media folders for filter selection
  $folders = _media_browser_plus_folder_list();
  // setting default filter selections - will be overwritten when a filter is active
  $selected_types = array_keys(media_type_get_types());
  $selected_folders = array_keys($folders);
  // apply filter settings
  if(isset($_SESSION['media-filter'])){
    if(count($_SESSION['media-filter']['type'])){
      $selected_types = explode("," ,$_SESSION['media-filter']['type']);
    }
    if(count($_SESSION['media-filter']['field_folder'])){
      $selected_folders = $_SESSION['media-filter']['field_folder'];
    }
  }
  // check for tags
  $field_tags = "";
  if(isset($_SESSION['media-filter']['field_tags']) && count($_SESSION['media-filter']['field_tags'])){
    // use name buffer array...
    $names = array();
    foreach($_SESSION['media-filter']['field_tags'] as $tid){
      $term = taxonomy_term_load($tid);
      $names[] = $term->name;
    }
    // .. to be able to nicely implode with clean comma seperation
    $field_tags = implode(", ", $names);
  }
  // get media types
  $types = media_type_get_types();
  $media_types = array();
  // user labels as display and value for backend
  foreach($types as $value=>$type) {
    $access = true;
    foreach (module_implements('media_type_access') as $module) {
      $access = module_invoke($module, 'media_type_access', $type);
      if($access === FALSE) {
        break;
      } else {
        $access = true;
      }
    }
    if($access)
      $media_types[$value] = $type->label;
  }
  $close = isset($_SESSION['media-filter-autoclose']) ?
    (int)$_SESSION['media-filter-autoclose'] : 0;
  $settings['media_browser_plus'] = array('autoclose' => $close);
  // reset otherwise it always auto closes
  unset($_SESSION['media-filter-autoclose']);
  // attach settings
  $form['#attached']['js'][] = array(
    'type' => 'setting',
    'data' => $settings,
  );
  $form['filter'] = array(
    '#type' => 'fieldset',
    '#title' => isset($_SESSION['media-filter']) ? t('Show only items where') : t('Create Filter'),
    '#collapsible' => FALSE,
    '#collapsed' => FALSE,
    '#weight' => -10,
    '#prefix' => '<div id="media-preview-wrapper">',
    '#suffix' => '</div>',
    '#attributes' => array('id' => 'media-filter'),
    'column_one' => array(
      '#type' => 'container',
      '#prefix' => '<div style="float:left; padding-right: 20px;">',
      '#suffix' => '</div>',
      '#attributes' => array(),
      'filename' => array(
        '#type' => 'textfield',
        '#title' => t('Title'),
        '#maxlength' => 125,
        '#size' => 40,
        '#value' => (isset($_SESSION['media-filter']['filename']) ? $_SESSION['media-filter']['filename'] : ""),
        '#required' => FALSE),
      'field_tags' => array(
        '#attributes' => array('id' => 'media-field-tags-filter'),
        '#type' => 'textfield',
        '#value' => $field_tags,
        '#field_name' => 'field_tags',
        '#columns' => array('tid'),
        '#title' => 'Tags',
        '#size' => 40,
        '#description' => 'Enter a comma-separated list of words to filter your media.',
        '#required' => FALSE,
        '#delta' => 0,
        '#language' => LANGUAGE_NONE,
        '#type' => 'textfield',
        '#autocomplete_path' => 'taxonomy/autocomplete/field_tags',
        '#element_validate' => array('media_browser_plus_prepare_taxonomy_autocomplete_validate', 'taxonomy_autocomplete_validate')),
      'prevent_autoclose' => array(
        '#type' => 'checkbox',
        '#weight' => 10,
        '#attributes' => array('id' => array('media-filter-autoclose')),
        '#title' => t('prevent window from closing after form submit'),
        '#default_value' => (isset($_SESSION['media-filter']['prevent_autoclose']) ?
                     (int)$_SESSION['media-filter']['prevent_autoclose'] : 0))
    ),
    'column_two' => array(
      '#type' => 'container',
      '#prefix' => '<div style="float:left; padding-right: 20px;">',
      '#suffix' => '</div>',
      '#attributes' => array(),
      'criterias' => array(
        '#type' => 'container',
        '#attributes' => array(),
        'media_type' => array(
          '#type' => 'select',
          '#title' => t('Media Type'),
          '#multiple' => TRUE,
          '#options' => $media_types,
          '#default_value' => $selected_types,
          '#weight' => 5,
          '#required' => FALSE,
          '#attributes' => array('class' => array('media-filter-select')),
          '#prefix' => '<div style="float:left; padding-right: 20px;">',
          '#suffix' => '</div>'),
        'field_folder' => array(
          '#type' => 'select',
          '#title' => t('Media Folder'),
          '#multiple' => TRUE,
          '#required' => FALSE,
          '#options' => $folders,
          '#default_value' => $selected_folders,
          '#weight' => 6,
          '#attributes' => array('class' => array('media-filter-select')),
          '#prefix' => '<div style="float:left; padding-right: 20px;">',
          '#suffix' => '</div>'),
        'include_subfolders' => array(
          '#type' => 'checkbox',
          '#weight' => 10,
          '#attributes' => array('class' => array('media-filter')),
          '#title' => t('include subfolders of selected folders'),
          '#default_value' => (isset($_SESSION['media-filter']['include_subfolders']) ?
                     $_SESSION['media-filter']['include_subfolders'] : 0))
    )),
    'column_three' => array(
      '#type' => 'container',
      '#prefix' => '<div style="float:left; padding-right: 20px;">',
      '#suffix' => '</div>',
      '#attributes' => array(),
      'submit' => array(
        '#type' => 'submit',
        '#value' => isset($_SESSION['media-filter']) ? t('Update Filter') : t('Create Filter'),
        '#submit' => array('media_browser_plus_media_filter_submit'),
        '#limit_validation_errors' => array(),
        '#validate' => array('media_browser_plus_media_filter_validate'),
        '#prefix' => '<div>',
        '#suffix' => '</div>')
    )
  );
  if(isset($_SESSION['media-filter'])){
    $form['filter']['column_three']['clear'] = array(
        '#type' => 'submit',
        '#value' => t('Reset Filter'),
        '#submit' => array('media_browser_plus_media_filter_clear'),
        '#limit_validation_errors' => array(),
        '#validate' => array('media_browser_plus_media_filter_validate'),
        '#prefix' => '<div>',
        '#suffix' => '</div>'
    );
  }
  return $form;
}

/**
 * Called when the filter form is submitted.
 * Adds filter to session and redirects back to callee
 * @param $argument
 */
function media_browser_plus_media_filter_submit($form, &$form_state) {
  // process filter
  $_SESSION['media-filter']['filename'] = check_plain($form_state['input']['filename']);
  $_SESSION['media-filter']['type'] = count($form_state['input']['media_type']) > 0 ?
    implode(",", $form_state['input']['media_type']) :
    implode(",", array_keys(media_type_get_types()));
  $_SESSION['media-filter']['include_subfolders'] = $form_state['input']['include_subfolders'];
  //
  $tags = check_plain($form_state['input']['field_tags']);
  $tags = explode(",", $tags);
  $vocabulary = taxonomy_vocabulary_machine_name_load('tags');
  // process tags filter entry
  $_SESSION['media-filter']['field_tags'] = array();
  foreach($tags as $tag){
    // check if tag exists
    $result = db_query('SELECT tid FROM {taxonomy_term_data} ttd WHERE ttd.name = :name AND ttd.vid = :vocabulary',
      array('name' => trim($tag), 'vocabulary' => $vocabulary->vid));
    foreach($result as $item){
      $_SESSION['media-filter']['field_tags'][] = $item->tid;
    }
  }
  $temp = array();
  $vocabulary = taxonomy_vocabulary_machine_name_load('media_folders');
  // check field_folder
  if(count($form_state['input']['field_folder']) == 0){
    $all = taxonomy_get_tree($vocabulary->vid);
    //
    foreach($all as $key=>$term){
      $temp[$term->tid] = $term->tid;
    }
  }
  else {
    foreach($form_state['input']['field_folder'] as $key=>$value){
      $tid = $value;
      $temp[$tid] = $tid;
      //
      if($form_state['input']['include_subfolders']){
        $children = taxonomy_get_tree($vocabulary->vid, $tid);
        //
        foreach($children as $key=>$term){
          $temp[$term->tid] = $term->tid;
        }
      }
    }
  }
  $_SESSION['media-filter']['field_folder'] = array_keys($temp);
  //
  // go back to media overview
  //$form_state['redirect'] = array('admin/content/media');
}

/**
 * Validates the filter form
 *
 * @param unknown_type $form
 * @param unknown_type $form_state
 */
function media_browser_plus_media_filter_validate($form, &$form_state) {
  // @todo: implement filter minimum check
  // set auto close
  $_SESSION['media-filter-autoclose'] = (int)$form_state['input']['prevent_autoclose'] == 1 ? 0 : 1;
}

/**
 * Called when the filter form is submitted.
 * Adds filter to session and redirects back to callee
 *
 * @param $argument
 */
function media_browser_plus_media_filter_clear($form, &$form_state) {
  // remove filter
  unset($_SESSION['media-filter']);
  // go back to media overview
  //$form_state['redirect'] = array('admin/content/media');
}
