<?php
$file_path = 'bg.hdr'; // Set the path to your HDR file

// Set the correct content type and transfer encoding
header('Content-Type: application/octet-stream');
header('Content-Transfer-Encoding: binary');
header('Content-Disposition: attachment; filename="bg.hdr"');

// Send the file
readfile($file_path);
?>