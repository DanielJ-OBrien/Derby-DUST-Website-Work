<?php
$folder = $_GET['folder']; // Get the folder parameter from the URL

$imageExtensions = array('jpg', 'png');

$fileNames = array();
$files = scandir($folder);
foreach ($files as $file) {
  $extension = pathinfo($file, PATHINFO_EXTENSION);
  if (in_array(strtolower($extension), $imageExtensions)) {
    $fileNames[] = $file;
  }
}

echo json_encode($fileNames);
?>
