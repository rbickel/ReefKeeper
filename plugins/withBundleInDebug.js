/**
 * Expo Config Plugin to enable bundleInDebug for Android builds.
 * 
 * This plugin modifies the Android app's build.gradle to bundle JavaScript
 * in debug builds, allowing the APK to run without a Metro server.
 * 
 * It configures the new React Native Gradle Plugin's react {} block to
 * set debuggableVariants to an empty list, ensuring debug builds are bundled.
 */

const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Adds debuggableVariants configuration to the react {} block in build.gradle
 * to ensure debug builds include bundled JavaScript
 */
const withBundleInDebug = (config) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;

    // Find the react {} configuration block
    const reactBlockPattern = /react\s*\{[\s\S]*?\n\}/;
    
    if (reactBlockPattern.test(contents)) {
      // Check if debuggableVariants is already uncommented
      const debuggableVariantsPattern = /^\s*debuggableVariants\s*=/m;
      
      if (!debuggableVariantsPattern.test(contents)) {
        // Find the commented debuggableVariants line and uncomment it with empty array
        contents = contents.replace(
          /\/\/\s*debuggableVariants\s*=\s*\[["']liteDebug["'],\s*["']prodDebug["']\]/,
          'debuggableVariants = [] // Bundle JS in all variants including debug'
        );
      } else {
        // Update existing debuggableVariants to empty array
        contents = contents.replace(
          /debuggableVariants\s*=\s*\[[^\]]*\]/,
          'debuggableVariants = [] // Bundle JS in all variants including debug'
        );
      }
    }

    // Also add legacy project.ext.react for older React Native versions
    // This ensures compatibility with both old and new Gradle plugins
    const projectExtReactPattern = /project\.ext\.react\s*=\s*\[[\s\S]*?\]/;
    
    if (!projectExtReactPattern.test(contents)) {
      // Add it before apply plugin
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

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
};

module.exports = withBundleInDebug;
