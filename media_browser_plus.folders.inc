<?php
// $Id$ 

/**
 * @file
 * Adds folder management to the media UI
 */

function media_browser_plus_folder_list(&$form, &$form_state){
  //
  $destination = drupal_get_destination();
  
  $form['action-links'] = array(
    '#type' => 'markup',
    '#markup' => "<ul class=\"action-links\"><li>" .
       l(t('Add new folder'), 'admin/content/media/folders/add', array('query' => $destination)) .
       "</li></ul>");
  
  $options = array(); //folder_admin_list('table', $form, $form_state);
  $folder_hierarchy = array(); //folder_admin_list('hierarchy_list', $form, $form_state);
    
  $header = array(
    'name' => array(
      'data' => t('Name'),
      'width' => '40%'),
    'weight' => array(
      'data' => t('Weight'),
      'width' => '15%'),
    'description' => array(
      'data' => t('Description'),
      'width' => '30%'),
    'operations' => array(
      'data' => t('Operations'),
      'colspan' => 2
    )
  );
  drupal_add_tabledrag('folder-overview', 'match', 'parent', 'folder-pid', 'folder-pid', 'folder-folder_id', TRUE);
  drupal_add_tabledrag('folder-overview', 'order', 'sibling', 'folder-weight');
  
  $output = '';
  $vocabulary = taxonomy_vocabulary_machine_name_load('media_folders');
  $folders = taxonomy_get_tree($vocabulary->vid);
  $rows = theme_folders_hierarchy_table_rows($folders);// $folder_hierarchy = folder_admin_list('hierarchy_table', $form, $form_state);
  
  if (empty($rows)) {
    $rows[] = array(array('data' => t('No folders created yet.'), 'colspan' => '4'));
  }
  $output .= theme('table', array('header' => $header, 'rows' => $rows, 'attributes' => array('id' => 'folder-overview')));
  
  $form['admin'] = array(
      '#type' => 'markup',
      '#markup' => $output);
  
  $form['submit'] = array('#type' => 'submit', '#value' => t('Save'));
  
  return $form;
}

function media_browser_plus_folder_list_submit(&$form, &$form_state){
  //
  print_r($form_state['values']);
  die();
}
function theme_folders_hierarchy_table_rows($folders)
{
  //$folders = $variables['folders'];
  //
  $rows = array();
  $destination = drupal_get_destination();
  //
  foreach($folders as $id=>$item)
  {
    //
    $row = array();
    $row[] = theme('indentation', array('size' => $folders[$id]->depth)) . $folders[$id]->name;
    $row[] = _theme_folder_weight_column($folders[$id]->weight, $id, $folders[$id]->parents[0]);
    $row[] = $folders[$id]->description;
    $row[] = l(t('edit'), 'admin/content/media/folders/' . $item->tid . '/edit', array('query' => $destination));
    $row[] = l(t('delete'), 'admin/content/media/folders/' . $item->tid . '/delete', array('query' => $destination));
    //
    $row = array('data' => $row);
           
    $row['class'][] = 'draggable';
    $rows[] = $row;
  }
  //
  return $rows;
}


function _theme_folder_weight_column($weight, $folder_id, $pid)
{
  //
  $output = "<div class=\"form-item form-type-select form-item-folder_id:236-weight\">
             <select name=\"folder_id:236[weight]\" class=\"folder-weight form-select\" id=\"edit-folder_id236-weight\" >";
  // 
  $options = range(-50, 50);
  //
  foreach($options as $option)
  {
    $output .= "<option ".($option == $weight ? 'selected="selected"' : '')." value=\"".$option."\">".$option."</option>";
  }
  //
  $output .= "</select></div>";
  //
  $output .= "<input type=\"hidden\" id=\"edit-folder_id".$folder_id."-pid\" class=\"folder-pid\" value=\"".$pid."\" name=\"folder_id:".$folder_id."[pid]\" />";
  $output .= "<input type=\"hidden\" id=\"edit-folder_id".$folder_id."-folder_id\" class=\"folder-folder_id\" value=\"".$folder_id."\" name=\"folder_id:".$folder_id."[folder_id]\" />";
  //
  return $output;
}

/**
 * Allows to add a new media folder
 */
function media_browser_plus_folder_admin_add(&$form, &$form_state){
  //
  $folders = array_merge(array('0' => t('No Parent')), _media_browser_plus_folder_list());
  $form['new_folder'] = array(
    '#type' => 'fieldset',
    '#title' => t('New media folder'),
  
  'folder_name' => array(
      '#type' => 'textfield',
      '#title' => t('Name'),
      '#description' => t('Please enter a folder name'),
      '#maxlength' => 125,
      '#required' => TRUE),
  
  'folder_short_description' => array(
    '#type' => 'textfield',
    '#title' => t('Description'),
    '#description' => t('You may enter a brief description'),
    '#maxlength' => 255),
  
  'pid' => array(
    '#type' => 'select',
    '#title' => t('Parent folder'),
    '#default_value' => variable_get('feed_item_length','teaser'),
    '#options' => $folders,
    '#required' => TRUE,
    '#description' => t('Sets one parent folder for the new folder')),
  
  'submit' => array(
    '#type' => 'submit',
    '#value' => t('Create media folder'))
    
  );
  //
  return $form;
}

/**
 * saves new media folder
 */
function media_browser_plus_folder_admin_add_submit(&$form, &$form_state){
  $vocabulary = taxonomy_vocabulary_machine_name_load('media_folders');
  $folder = new stdClass();
  $folder->name = check_plain($form_state['values']['folder_name']);
  $folder->description = check_plain($form_state['values']['folder_short_description']);
  $folder->parent = array((int)$form_state['values']['pid']);
  $folder->vid = $vocabulary->vid;
  // save (default folder) term  
  if(taxonomy_term_save($folder))
    drupal_set_message(t('New media folder has been created'));
  else
    drupal_set_message(t('New media folder could not be created', 'error'));
}

/**
 * 
 * Enter description here ...
 * @param $folder
 */
function media_browser_plus_folder_admin_edit($folder){
  drupal_set_title(t('Edit media folder') . ": " . $folder->name, PASS_THROUGH);
  return drupal_get_form('media_browser_plus_folder_admin_edit_form', $folder);
}

function media_browser_plus_folder_admin_delete($folder){
  
}

function media_browser_plus_folder_admin_edit_form(&$form, &$form_state, $folder){
  $form['edit_folder'] = array(
    '#type' => 'fieldset',
    '#title' => t('Edit folder'),

    'folder_name' => array(
      '#type' => 'textfield',
      '#title' => t('Name'),
      '#value' => $folder->name,
      '#description' => t('Alter the folder name'),
      '#maxlength' => 125,
      '#required' => TRUE),
  
    'folder_short_description' => array(
      '#type' => 'textfield',
      '#title' => t('Description'),
      '#value' => $folder->description,
      '#description' => t('Alter the brief description'),
      '#maxlength' => 255),
  
    'pid' => array(
      '#type' => 'select',
      '#title' => t('Parent folder'),
      '#default_value' => '_' . $folder->pid,
      '#options' => array(),
      '#description' => t('Sets one parent folder for the new folder')),
  
    'tid' => array(
      '#type' => 'hidden',
      '#value' => $folder->tid),
                        
    'submit' => array(
      'submit' => array(
        '#type' => 'submit',
        '#value' => t('Save'),
        '#weight' => 5,
        '#submit' => array('media_browser_plus_folder_admin_edit_submit')),
      'delete' => array(
        '#type' => 'submit',
        '#value' => t('Delete'),
        '#weight' => 10,
        '#submit' => array('media_browser_plus_folder_admin_edit_delete_submit')))                 
    
  );
  //
  return $form;
}
?>