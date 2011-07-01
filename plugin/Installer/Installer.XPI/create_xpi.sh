#!/bin/sh

# This script copies all XPI files into an XPI folder and then
# zips the content of the folder to create the XPI.

# The script assumes X arguments have been passed
# $1 is assumed to be the path of the build tools directory
# $2 is assumed to be the path of the version file Version.ver
# $3 is assumed to be the path where output is going to be copied.
# $4 is assumed to be the path where firefox files are located
# $5 is assumed to be the path where install.rdf.m4 are located

# Variables
build_tools_dir=$1
echo Build tools dir: ${build_tools_dir}
zip_tool=${build_tools_dir}/7za

version_properties_file=$2
echo Build properties file: ${version_properties_file}

echo Retrieving version numbers...
major=$(echo include\($version_properties_file\)__K_MAJOR_VERSION__| m4)
minor=$(echo include\($version_properties_file\)__K_MINOR_VERSION__| m4)
build=$(echo include\($version_properties_file\)__K_BUILD_NUMBER__| m4)
kikin_plugin_version=$major.$minor.$build
echo Using version string $kikin_plugin_version

output_dir=$3
echo Output will be located at $output_dir
output_file=$output_dir/watchlr_installer_${kikin_plugin_version}.xpi

firefox_files_dir=$4
echo Generating XPI structure at $build_dir

installer_files_dir=$5
echo Using rdf from $installer_files_dir
install_rdf_m4_file=$installer_files_dir/install.rdf.m4
install_rdf_filename=install.rdf

echo ...

# If install.rdf exists delete it
if [ -e ${firefox_files_dir}/${install_rdf_filename} ]
then
	if [ $(rm ${firefox_files_dir}/${install_rdf_filename} > /dev/null) ]
    then
        echo Error deleting ${firefox_files_dir}/${install_rdf_filename}. ERROR LEVEL = $?, aborting
        exit 1
    fi
fi

# Updating install.rdf
m4 ${version_properties_file} ${install_rdf_m4_file} > ${firefox_files_dir}/${install_rdf_filename}
if test $? -gt 0
then
	echo Error generating $install_rdf_filename. ERROR LEVEL = $?, aborting
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

# Create xpi file
cd $firefox_files_dir
if test $? -gt 0
then
	echo Error in $0. ERROR LEVEL = $?, aborting
	exit 1
fi

if [ $($zip_tool a -tzip $output_file * > /dev/null) ]
then
	echo Error zipping XPI dir into $output_file. ERROR LEVEL = $?, aborting
	exit 1
fi

# Change the file permissions of XPI to read and execute for everyone
chmod 755 $output_file

echo Success $0
exit 0
