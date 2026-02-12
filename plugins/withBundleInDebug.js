/**
 * Expo Config Plugin to enable bundleInDebug for Android builds.
 * 
 * This plugin modifies the Android app's build.gradle to bundle JavaScript
 * in debug builds, allowing the APK to run without a Metro server.
 */

const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Adds bundleInDebug configuration to the project.ext.react block in build.gradle
 */
const withBundleInDebug = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Check if project.ext.react block exists
    const projectExtReactPattern = /project\.ext\.react\s*=\s*\[[\s\S]*?\]/;
    
    if (projectExtReactPattern.test(contents)) {
      // If project.ext.react exists, check if bundleInDebug is already present
      const bundleInDebugPattern = /bundleInDebug\s*:/;
      
      if (!bundleInDebugPattern.test(contents)) {
        // Add bundleInDebug to existing project.ext.react block
        contents = contents.replace(
          /project\.ext\.react\s*=\s*\[/,
          'project.ext.react = [\n    bundleInDebug: true,'
        );
      } else {
        // Update existing bundleInDebug value to true
        contents = contents.replace(
          /bundleInDebug\s*:\s*false/g,
          'bundleInDebug: true'
        );
      }
    } else {
      // If project.ext.react doesn't exist, add it before apply plugin
      const applyPluginPattern = /apply plugin:\s*["']com\.android\.application["']/;
      
      if (applyPluginPattern.test(contents)) {
        contents = contents.replace(
          applyPluginPattern,
          `apply plugin: "com.android.application"

project.ext.react = [
    bundleInDebug: true,
    devDisabledInDebug: false
]`
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withBundleInDebug;
