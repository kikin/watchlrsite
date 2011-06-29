#!/bin/sh

# This script zips the content of the Chrome folder to create the CRX.

# The script assumes X arguments have been passed
# $1 is assumed to be the path of the build tools directory
# $2 is assumed to be the path to Version.ver.
# $3 is assumed to be the path where output is going to be copied.
# $4 is assumed to be the path where background.html and content_script.js are located
# $5 is assumed to be the path where chrome_extension.pem (private key) and manifest.json.m4 are located

# Variables
build_tools_dir=$1
echo Build tools dir: ${build_tools_dir}
crxmake_tool=${build_tools_dir}/crxmake/crxmake

version_properties_file=$2
echo Version file: ${version_properties_file}

echo Retrieving version numbers...
major=$(echo include\($version_properties_file\)__K_MAJOR_VERSION__| m4)
minor=$(echo include\($version_properties_file\)__K_MINOR_VERSION__| m4)
build=$(echo include\($version_properties_file\)__K_BUILD_NUMBER__| m4)
kikin_plugin_version=$major.$minor.$build
echo Using version string $kikin_plugin_version

output_dir=$3
echo Output will be located at $output_dir
output_file=$output_dir/watchlr_installer_${kikin_plugin_version}.crx

chrome_files_dir=$4
echo Using background.html, content_script.js, and images from $chrome_files_dir

installer_files_dir=$5
echo Using chrome_extension.pem from $installer_files_dir
chrome_extension_pem_file=$installer_files_dir/chrome_extension.pem
manifest_json_m4_file=$installer_files_dir/manifest.json.m4
manifest_json_filename=manifest.json

echo …

# If manifest.json exists delete it
if [ -e ${chrome_files_dir}/${manifest_json_filename} ]
then
	if [ $(rm ${chrome_files_dir}/${manifest_json_filename} > /dev/null) ]
    then
        echo Error deleting ${chrome_files_dir}/${manifest_json_filename}. ERROR LEVEL = $?, aborting
        exit 1
    fi
fi

# Updating manifest.json
m4 ${version_properties_file} ${manifest_json_m4_file} > ${chrome_files_dir}/${manifest_json_filename}
if test $? -gt 0
then
	echo Error generating $manifest_json_filename. ERROR LEVEL = $?, aborting
	exit 1
fi

# If output directory does not exist, create it
if [ ! -e $output_dir ]
then
	if [ $(mkdir -p $output_dir > /dev/null) ]
	then
		echo Error creating $output_dir. ERROR LEVEL = $?, aborting.
		exit 1
	fi 
fi

# Delete output file if it exists
if [ -e $output_file ]
then
	if [ $(rm $output_file > /dev/null) ]
    then
        echo Error deleting $output_file. ERROR LEVEL = $?, aborting
        exit 1
    fi
fi

# Create crx file
pushd `dirname $crxmake_tool` > /dev/null
if [ $($crxmake_tool --pack-extension=$chrome_files_dir --extension-output=$output_file --pack-extension-key=$chrome_extension_pem_file > /dev/null) ]
then
    popd > /dev/null
	echo Error creating $output_file. ERROR LEVEL = $?, aborting
	exit 1
fi
popd > /dev/null

echo Success $0
exit 0
