<?php

if (!isset($_GET['rebuild']) || $_GET['rebuild'] == 'true') {
	// get css/html/js files
	$bookmarkletFile = 'watchlr_bookmarklet.html';

    // convert css files to variables
    $content = file_get_contents($bookmarkletFile);
    $content = str_replace("\n", "", $content);
    $content = str_replace("\r", "", $content);
    $content = str_replace("\t", "", $content);
    $content = str_replace("    ", "", $content);

    $servers = array("dev" => "http://dev.watchlr.com/",
                     "local" => "http://local.watchlr.com",
                     "prod" => "http://www.watchlr.com/");

    $server = $servers["prod"];
    if(count($argv) > 1) {
        if(array_key_exists($argv[1], $servers)) {
            $server = $servers[$argv[1]];
        }
    }

    $content = str_replace("http://www.watchlr.com", $server, $content);
    file_put_contents('watchlr_bookmarklet-0.1.min.html', $content);
}

?>
