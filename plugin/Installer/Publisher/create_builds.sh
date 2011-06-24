#!/bin/sh

# This script creates all the builds for kikin video.

# Variables
plugin_base_dir=$(pwd)/../..
echo Plugin Base dir: ${plugin_base_dir}

build_tools_dir=${plugin_base_dir}/BuildUtils/
echo Build tools dir: ${build_tools_dir}

version_properties_file=${plugin_base_dir}/Version.ver
echo Version file: ${version_properties_file}

output_dir=${plugin_base_dir}/Builds/
echo Output dir: ${output_dir}

chrome_files_dir=${plugin_base_dir}/Chrome
echo Chrome files dir: ${chrome_files_dir}

installer_files_dir=${plugin_base_dir}/Installer
echo Installer files dir: ${installer_files_dir}

chrome_installer_files_dir=${installer_files_dir}/Installer.CRX/
echo Chrome Installer files dir: ${chrome_installer_files_dir}

chrome_installer_build_tool=${chrome_installer_files_dir}/create_crx.sh
echo Chrome Installer build tool: ${chrome_installer_build_tool}

# Build Chrome installer
echo Building Chrome installer...
pushd `dirname $chrome_installer_files_dir` > /dev/null
if [ $($chrome_installer_build_tool $build_tools_dir $version_properties_file $output_dir $chrome_files_dir $chrome_installer_files_dir > /dev/null) ]
then
    popd > /dev/null
	echo Error creating Chrome installer. ERROR LEVEL = $?, aborting
	exit 1
fi
popd > /dev/null

echo Success $0
exit 0
