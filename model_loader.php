<?php
$folder = $_GET['folder']; // Get the folder parameter from the URL

$modelExtensions = array('gltf');

$fileNames = array();
$files = scandir($folder);
foreach ($files as $file) {
  $extension = pathinfo($file, PATHINFO_EXTENSION);
  if (in_array(strtolower($extension), $modelExtensions)) {
    $fileNames[] = $file;
  }
}

header('Content-Type: application/json'); // Set the response content type to JSON
echo json_encode($fileNames);
?>