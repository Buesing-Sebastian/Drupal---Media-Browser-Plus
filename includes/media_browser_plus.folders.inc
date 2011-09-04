<?php
/**
 * @file
 * Folder manipulation functions
 */

/**
 * Enter description here ...
 * @param $form
 * @param $form_state
 */
function media_browser_plus_folder_list($form, &$form_state) {
  $destination = drupal_get_destination();
  $form['action-links'] = array(
    '#type' => 'markup',
    '#markup' => '<ul class="action-links"><li>' .
       l(t('Add new folder'), 'admin/content/media/add_folder', array('query' => $destination)) .
       '</li></ul>',
   );
  // table header
  $header = array(
    'name' => array(
      'data' => t('Name'),
      'width' => '55%',
    ),
    'weight' => array(
      'data' => t('Weight'),
      'width' => '15%',
    ),
    'description' => array(
      'data' => t('Description'),
      'width' => '30%',
    ),
    'operations' => array(
      'data' => t('Operations'),
      'colspan' => 2,
    ),
  );
  drupal_add_tabledrag('folder-overview', 'match', 'parent', 'folder-pid', 'folder-pid', 'folder-folder_id', TRUE);
  drupal_add_tabledrag('folder-overview', 'order', 'sibling', 'folder-weight');
  // get table rows
  $rows = media_browser_plus_folder_admin_list();
  // check for emptyness
  if (empty($rows)) {
    $rows[] = array(array('data' => t('No folders created yet.'), 'colspan' => '5'));
  }
  $output = theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'folder-overview')));
  $form['admin'] = array(
    '#type' => 'markup',
    '#markup' => $output,
  );
  $form['actions'] = array('#type' => 'actions');
  $form['actions']['submit'] = array('#type' => 'submit', '#value' => t('Save Changes'));
  $form['actions']['cancel'] = array(
    '#type' => 'submit',
    '#value' => t('Cancel'),
    '#submit' => array('media_browser_plus_folder_admin_list_cancel'),
  );
  return $form;
}

function media_browser_plus_folder_list_submit($form, &$form_state) {
  foreach ($form_state['input'] as $key => $value) {
    if (strstr($key, "folder_id")) {
      $folder = media_browser_plus_folder_load((int) $value['folder_id']);
      $source = media_browser_plus_construct_dir_path($folder);
      $folder->parent = (int) $value['pid'];
      $folder->weight = (int) $value['weight'];
      taxonomy_term_save($folder);
      $destination = media_browser_plus_construct_dir_path($folder);
      if ($source != $destination) {
        // update physical folder structure
        media_browser_plus_move_physical_folder($source, $destination);
      }
    }
  }
  drupal_set_message(t('Changes saved successfully'));
  $form_state['redirect'] = 'admin/content/media/thumbnails';
}

function media_browser_plus_folder_admin_list_cancel($form, &$form_state) {
  $form_state['redirect'] = 'admin/content/media/thumbnails';
}
/**
 * Enter description here ...
 * @param unknown_type $mode
 * @param unknown_type $form
 * @param unknown_type $form_state
 * @param unknown_type $filter
 */
function media_browser_plus_folder_admin_list() {
  $vocabulary = taxonomy_vocabulary_machine_name_load('media_folders');
  $categories = array();
  $result = taxonomy_get_tree($vocabulary->vid);
  $destination = drupal_get_destination();
  $rows = array();
  foreach ($result as $key => $item) {
    $element['plid']['#attributes']['class'] = array('menu-plid');
    $element['mlid']['#attributes']['class'] = array('menu-mlid');
    $element['weight']['#attributes']['class'] = array('menu-weight');
    // create row
    $row = array();
    $row[] = theme('indentation', array('size' => $item->depth)) . $item->name;
    $row[] = media_browser_plus_folder_theme_folder_weight_column($item->weight, $item->tid, $item->parents[0]);
    $row[] = $item->description;
    $row[] = l(t('edit'), 'admin/content/media/folder/' . $item->tid . '/edit', array('query' => $destination));
    $row[] = l(t('delete'), 'admin/content/media/folder/' . $item->tid . '/delete', array('query' => $destination));
    // change formate of row
    $row = array('data' => $row);
    $row['class'][] = 'draggable';
    $rows[] = $row;
  }
  return $rows;
}

function media_browser_plus_folder_add($form, &$form_state) {
  $form['new_folder'] = array(
    '#type' => 'fieldset',
    '#title' => t('New Folder'),
    'name' => array(
      '#type' => 'textfield',
      '#title' => t('Name'),
      '#description' => t('Please enter a folder name'),
      '#maxlength' => 125,
      '#required' => TRUE,
    ),
    'description' => array(
      '#type' => 'textfield',
      '#title' => t('Description'),
      '#description' => t('You may enter a brief description'),
      '#maxlength' => 255,
    ),
    'pid' => array(
      '#type' => 'select',
      '#title' => t('Parent Category'),
      '#options' => media_browser_plus_folder_get_folders(),
      '#description' => t('Sets one parent folder for the new folder'),
    ),
  );
  $form['actions'] = array(
    '#type' => 'actions',
    'submit' => array(
      '#type' => 'submit',
      '#value' => t('Save'),
      '#submit' => array('media_browser_plus_folder_add_submit'),
    ),
    'continue' => array(
      '#type' => 'submit',
      '#value' => t('Save & Continue'),
      '#submit' => array('media_browser_plus_folder_add_submit_continue'),
    ),
    'cancel' => array(
      '#type' => 'submit',
      '#value' => t('Cancel'),
      '#limit_validation_errors' => array(),
      '#submit' => array('media_browser_plus_folder_add_cancel'),
    ),
  );
  return $form;
}

function media_browser_plus_folder_add_submit($form, &$form_state) {
  // save folder
  media_browser_plus_folder_save_folder($form_state);
  // and go back
  $destination = drupal_get_destination();
  $form_state['redirect'] = $destination['destination'];
}

function media_browser_plus_folder_add_submit_continue($form, &$form_state) {
  media_browser_plus_folder_save_folder($form_state);
  $destination = array();
  if (isset($_GET['destination'])) {
    $destination = drupal_get_destination();
    unset($_GET['destination']);
  }
  $form_state['redirect'] = array('admin/content/media/add_folder', array('query' => $destination));
}

function media_browser_plus_folder_edit($form, &$form_state, $folder) {
  $parents = taxonomy_get_parents($folder->tid);
  $form['folder'] = array(
    '#type' => 'fieldset',
    '#title' => t('New Folder'),
    'folder_id' => array(
      '#type' => 'hidden',
      '#value' => $folder->tid,
    ),
    'name' => array(
      '#type' => 'textfield',
      '#title' => t('Name'),
      '#description' => t('Please enter a folder name'),
      '#maxlength' => 125,
      '#default_value' => $folder->name,
      '#required' => TRUE,
    ),
    'description' => array(
      '#type' => 'textfield',
      '#title' => t('Description'),
      '#description' => t('You may enter a brief description'),
      '#default_value' => $folder->description,
      '#maxlength' => 255,
    ),
    'pid' => array(
      '#type' => 'select',
      '#title' => t('Parent Category'),
      '#options' => media_browser_plus_folder_get_folders(),
      '#default_value' => count($parents) ? array_pop(array_keys($parents)) : 0,
      '#description' => t('Sets one parent folder for the new folder'),
    ),
  );
  $form['actions'] = array(
    '#type' => 'actions',
    'submit' => array(
      '#type' => 'submit',
      '#value' => t('Save'),
      '#submit' => array('media_browser_plus_folder_edit_submit'),
    ),
    'delete' => array(
      '#type' => 'submit',
      '#value' => t('Delete'),
      '#submit' => array('media_browser_plus_folder_edit_delete'),
    ),
    'cancel' => array(
      '#type' => 'submit',
      '#value' => t('Cancel'),
      '#limit_validation_errors' => array(),
      '#submit' => array('media_browser_plus_folder_add_cancel'),
    ),
  );
  return $form;
}

function media_browser_plus_folder_edit_submit($form, &$form_state) {
  // save folder
  media_browser_plus_folder_save_folder($form_state);
  // and go back
  $destination = drupal_get_destination();
  $form_state['redirect'] = $destination['destination'];
}

function media_browser_plus_folder_edit_delete($form, &$form_state) {
  if (isset($form_state['values']['folder_id'])) {
    $destination = array();
    if (isset($_GET['destination'])) {
      $destination = drupal_get_destination();
      unset($_GET['destination']);
    }
    $form_state['redirect'] = array('admin/content/media/folder/' . (int)$form_state['values']['folder_id'] . '/delete', array('query' => $destination));
  }
}

function media_browser_plus_folder_delete($form, &$form_state, $folder) {
  // check if folder not empty and has no subfolders
  $voc = taxonomy_vocabulary_machine_name_load('media_folders');
  $children = taxonomy_get_tree($voc->vid, $folder->tid);
  if (!_media_browser_plus_folder_empty($folder->tid) && count($children) == 0) {
    $form['intro'] = array(
      '#type' => 'item',
      '#markup' => t('Do you really want to delete the following folder:'),
    );
    $form['item'] = array(
      '#type' => 'item',
      '#markup' => $folder->name,
      '#prefix' => '<ul><li>',
      '#suffix' => '</ul></li>'
    );
    $form['note'] = array(
      '#type' => 'item',
      '#markup' => t('This action cannot be undone.'),
    );
    $form['folder_id'] = array(
      '#type' => 'hidden',
      '#value' => $folder->tid
    );
    $form['actions'] = array(
      '#type' => 'actions',
      'delete' => array(
        '#type' => 'submit',
        '#value' => t('Delete'),
        '#submit' => array('media_browser_plus_folder_delete_submit'),
      ),
      'cancel' => array(
        '#type' => 'submit',
        '#value' => t('Cancel'),
        '#limit_validation_errors' => array(),
        '#submit' => array('media_browser_plus_folder_add_cancel'),
      ),
    );
    return $form;
  }
  else {
    if (count($children) != 0)
      drupal_set_message(t('Folder %folder_name has subfolders and cannot be deleted', array('%folder_name' => $folder->name)), 'error');
    if (_media_browser_plus_folder_empty($folder->tid))
      drupal_set_message(t('Folder %folder_name is not empty and cannot be deleted', array('%folder_name' => $folder->name)), 'error');
    $destination = drupal_get_destination();
    drupal_goto($destination['destination']);
  }
}

function media_browser_plus_folder_delete_submit($form, &$form_state) {
  // load folder, delete and return
  $folder = media_browser_plus_folder_load((int)$form_state['values']['folder_id']);
  $physical_folder = media_browser_plus_construct_dir_path($folder);
  if (taxonomy_term_delete($folder->tid) && drupal_rmdir($physical_folder)) {
    drupal_set_message(t('Folder %folder_name deleted successfully', array('%folder_name' => $folder->name)));
  }
  else {
    drupal_set_message(t('Error deleting folder %folder_name', array('%folder_name' => $folder->name)), 'error');
  }
  $destination = drupal_get_destination();
  $form_state['redirect'] = $destination['destination'];
}

function media_browser_plus_folder_save_folder($form_state) {
  // parse values
  $vocabulary = taxonomy_vocabulary_machine_name_load('media_folders');
  $term = new stdClass();
  $term->name = check_plain($form_state['values']['name']);

  // if update
  if (isset($form_state['values']['folder_id'])) {
    $term->tid = (int) $form_state['values']['folder_id'];
    $source = media_browser_plus_construct_dir_path($term);
  }

  $term->description = check_plain($form_state['values']['description']);
  $term->parent = (int) $form_state['values']['pid'];
  $term->vid = $vocabulary->vid;
  // save (folder) term
  switch (taxonomy_term_save($term)) {
    case (SAVED_NEW):
      // create physical folder
      $dir = media_browser_plus_construct_dir_path($term);
      if (file_prepare_directory($dir, FILE_CREATE_DIRECTORY)) {
        drupal_set_message(t('Folder %term_name created successfully', array('%term_name' => $term->name)));
      }
      else {
        drupal_set_message(t('Folder %term_name created successfully as term but failed to create as physical folder.Please do it manually', array('%term_name' => $term->name)), 'warning');
      }
    break;
    case (SAVED_UPDATED):
      // update physical folder
      $destination = media_browser_plus_construct_dir_path($term);
      media_browser_plus_move_physical_folder($source, $destination);
      drupal_set_message(t('Folder %term_name updated successfully', array('%term_name' => $term->name)));
    break;
    case (FALSE):
      drupal_set_message(t('Error saving folder %term_name', array('%term_name' => $term->name)), 'error');
    break;
  }
}

function media_browser_plus_folder_get_folders() {
  $vocabulary = taxonomy_vocabulary_machine_name_load('media_folders');
  $folders = array(0 => '> ' . t('No Parent') . ' <');
  foreach (taxonomy_get_tree($vocabulary->vid) as $key => $value) {
    $folders[$value->tid] = str_pad("", $value->depth, "-") . $value->name;
  }
  return $folders;
}

/**
 * simple form cancel redirect
 * @param unknown_type $form
 * @param unknown_type $form_state
 */
function media_browser_plus_folder_add_cancel($form, &$form_state) {
  $destination = drupal_get_destination();
  $form_state['redirect'] = $destination['destination'];
}

/**
 * Enter description here ...
 * @param unknown_type $weight
 * @param unknown_type $folder_id
 * @param unknown_type $pid
 */
function media_browser_plus_folder_theme_folder_weight_column($weight, $folder_id, $pid) {
  // create the necessary div & select form
  $output = '<div class="form-item form-type-select form-item-folder_id:' . $folder_id . '-weight">
    <select name="folder_id:' . $folder_id . '[weight]" class="folder-weight form-select" id="edit-folder_id' . $folder_id . '-weight" >';
  $options = range(-50, 50);
  foreach ($options as $option) {
    $output .= '<option ' . ($option == $weight ? 'selected="selected"' : '') . ' value="' . $option . '">' . $option . '</option>';
  }
  $output .= '</select></div>';
  $output .= '<input type="hidden" id="edit-folder_id' . $folder_id . '-pid" class="folder-pid" value="' . $pid . '" name="folder_id:' . $folder_id . '[pid]" />';
  $output .= '<input type="hidden" id="edit-folder_id' . $folder_id . '-folder_id" class="folder-folder_id" value="' . $folder_id . '" name="folder_id:' . $folder_id . '[folder_id]" />';
  // add return
  return $output;
}
