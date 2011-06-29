<?php

function getAllFiles($directory, $extension) {
	$ret = array();
	if ($handle = opendir($directory)) {
    	while (false !== ($file = readdir($handle))) {
    		if ($file == '.' || $file == '..') {
    			continue;
    		} else if (substr($file, -1*strlen($extension)) == $extension) {
    		    array_push($ret, $directory.'/'.$file);
    		} else if (!is_file($directory.'/'.$file)) {
    			$result = getAllFiles($directory.'/'.$file, $extension);
    			$ret = array_merge($ret, $result);
    		}
	    }
	    closedir($handle);
	} else {
		die("could not find directory $directory");
	}
	return $ret;
}

function jsPrioritiesCmp($a, $b) {
	$priorities = array(
		'src/main/com/jquery/jquery.js' => 50,
		'src/main/com/jquery/jquery.class.js' => 49,
        'src/main/com/watchlr/system/runtime/main.js' => 48,
        'src/main/com/watchlr/util/Error.js' => 40,
        'src/main/com/watchlr/util/Styles.js' => 39,
        'src/main/com/watchlr/util/Url.js' => 38,
        'src/main/com/watchlr/config/Locale.js' => 37,
        'src/main/com/watchlr/system/Config.js' => 30,
        'src/main/com/watchlr/system/Service.js' => 29,
        'src/main/com/watchlr/system/ServiceDaemon.js' => 28,
        'src/main/com/watchlr/system/WatchlrRequests.js' => 27,
        'src/main/com/watchlr/ui/modalwin/WatchlrIframeWindow.js' => 26,
        'src/main/com/watchlr/ui/modalwin/AlertWindow.js' => 25,
        'src/main/com/watchlr/ui/modalwin/FacebookConnectWindow.js' => 24,
        'src/main/com/watchlr/ui/modalwin/VideoSavedWindow.js' => 23,
        'src/main/com/watchlr/ui/modalwin/FirstVideoLikedWindow.js' => 22,
        'src/main/com/watchlr/config/HostsConfig.js' => 21,
        'src/main/com/watchlr/hosts/Host.js' => 20,
        'src/main/com/watchlr/hosts/HostController.js' => 19,
        'src/main/com/watchlr/hosts/adapters/KikinSiteAdapter.js' => 18,
        'src/main/com/watchlr/hosts/adapters/KikinVideoAdapter.js' => 17,
        'src/main/com/watchlr/hosts/adapters/InSituVideoAdapter.js' => 17,
        'src/main/com/watchlr/hosts/defaultEngine/KikinSiteAdapter.js' => 15,
        'src/main/com/watchlr/hosts/defaultEngine/KikinVideoAdapter.js' => 14,
		'src/main/com/watchlr/system/runtime/Bootstrap.js' => -1
	);

	$aPriority = 0;
	$bPriority = 0;

	if (array_key_exists($a, $priorities)) $aPriority = $priorities[$a];
	if (array_key_exists($b, $priorities)) $bPriority = $priorities[$b];

    return $aPriority < $bPriority;
}

function getJavascriptTree($files) {
	$tree = array();

	// create the tree
	for ($i=0; $i<count($files); $i++) {
		$file = $files[$i];
		$name = substr($file, 0, strrpos($file, '/'));

		$cur = &$tree;
		$packages = explode('/', $name);
		for ($j=0; $j<count($packages); $j++) {
			$package = $packages[$j];
			if (!$cur[$package]) {
				// create package
				$cur[$package] = array();
			}
			$cur = &$cur[$package];
		}
	}
	return $tree;
}

function createTreeString($tree, $level = 0) {
	$ret = '';

	if ($level == 0) $ret .= 'var ';
	foreach ($tree as $key => $value) {
		if ($ret != '' && $level != 0) $ret .= ',';
		$ret .= $key.($level==0?'=':':').'{';
		$ret .= createTreeString($value, $level+1);
		$ret .= '}';
	}
	if ($level == 0) $ret .= ';';

	return $ret;
}

function getJavascriptTreeString($files) {
	//TODO: fix this
	return '';

	// get the tree
	$tree = getJavascriptTree($files);

	// make the output
	return createTreeString($tree);
}

if (!isset($_GET['rebuild']) || $_GET['rebuild'] == 'true') {
	$result = '';

	// get css/html/js files
	$cssFiles = getAllFiles('src/main', '.css');
	$htmlFiles = getAllFiles('src/main', '.html');
	$jsFiles = getAllFiles('src/main', '.js');

    // just concat javascript files
	$temp = usort($jsFiles, "jsPrioritiesCmp");
	for ($i=0; $i<count($jsFiles); $i++) {
		$result .= file_get_contents($jsFiles[$i]);
	}

    // Add CSS files
	if(count($cssFiles)){
        $result .= "\ncom.watchlr.system.css = {};";
		// convert css files to variables
		$result .= getJavascriptTreeString($cssFiles)."\n";
		for ($i=0; $i<count($cssFiles); $i++) {
			$content = file_get_contents($cssFiles[$i]);
			$content = str_replace("'", "\\'", $content);
			$content = str_replace("\n", "", $content);
			$content = str_replace("\r", "", $content);
			$content = str_replace("\t", "", $content);

			$name = basename($cssFiles[$i], ".css");

			$result .= "com.watchlr.system.css['$name']='$content';\n";
		}
	}

    // Add HTML files
	if(count($htmlFiles)){
        $result .= "\ncom.watchlr.system.html = {};";
		// convert css files to variables
		$result .= getJavascriptTreeString($htmlFiles)."\n";
		for ($i=0; $i<count($htmlFiles); $i++) {
			$content = file_get_contents($htmlFiles[$i]);
			$content = str_replace("'", "\\'", $content);
			$content = str_replace("\n", "", $content);
			$content = str_replace("\r", "", $content);
			$content = str_replace("\t", "", $content);

			$name = basename($htmlFiles[$i], ".html");

			$result .= "com.watchlr.system.html['$name']='$content';\n";
		}
	}

  $servers = array("dev" => "http://dev.watchlr.com/", "prod" => "http://www.watchlr.com/");
  $server = $servers["prod"];
  if(count($argv) > 1){
      if(array_key_exists($argv[1], $servers)){
          $server = $servers[$argv[1]];
      }
  }

  $result .= "var bootstrap = new com.watchlr.system.runtime.Bootstrap(); bootstrap.run();";
  $result = str_replace("http://www.watchlr.com", $server, $result);

  $result1 = "(function() {";
  $result1 .= $result;
  $result1 .= "})();";

	// optionnal: using a template
	//$template = file_get_contents('src/main/javascript/template.js');
	//$result = str_replace('{javascript}', $result, $template);

  $static_path = $server . "static/img/";
  $result1 = str_replace("http://local.watchlr.com/watchlr/img/", $static_path, $result1);

	file_put_contents('watchlr.min.js', $result1);

	//header("Access-Control-Allow-Origin: *");
	// die($result);
}

?>
