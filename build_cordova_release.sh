#!/bin/bash
echo "You *MUST* update versionCode in AndroidManifest.xml first to currently deployed version."
echo "You *MUST* update version in app/cordova/config.xml first to currently deployed version."
echo "Only run this *immediately* after a grunt deploy"
read
cd cordova
echo "Copying files"
grunt cordova_release

echo "Preparing"
cordova -d prepare

echo "Signing"
ant release -f "./platforms/android/build.xml"
cd ..
