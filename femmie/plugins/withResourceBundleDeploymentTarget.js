/**
 * Config plugin: patch the generated iOS Podfile for Xcode 26 compatibility.
 *
 * Two independent Xcode 26 problems, both patched into the Podfile post_install:
 *
 * 1. Deployment target. Xcode 26 rejects the build when any target's
 *    IPHONEOS_DEPLOYMENT_TARGET is below 15.0. `react_native_post_install`
 *    bumps normal pod targets to the Podfile platform (15.1), but the
 *    resource-bundle targets CocoaPods generates for pods shipping assets
 *    (e.g. RNCAsyncStorage_resources, RNSVGFilters) keep their own podspec
 *    minimum (12.4 / 13.4). The Podfile already loops over those resource
 *    bundles to disable code signing; we extend that loop to set the target.
 *
 * 2. fmt consteval. Apple clang 21 (Xcode 26) enforces `consteval` strictly, so
 *    the `fmt` library bundled with RN 0.79 (via RCT-Folly) fails to compile
 *    ("call to consteval function ... is not a constant expression"). The fix
 *    is to define FMT_USE_CONSTEVAL=0 for every pod that consumes fmt, so its
 *    format-string checks run at runtime instead of compile time. Remove once
 *    React Native ships fmt >= 12.1.0. See fmtlib/fmt#4740, expo/expo#44229.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DEPLOYMENT_TARGET = '15.1';

const DEPLOY_ANCHOR = "config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'";
const DEPLOY_INJECTION =
  `config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'\n` +
  `          ${DEPLOY_ANCHOR}`;

// Inserted just before the resource-bundle comment block inside post_install.
const FMT_ANCHOR = '    # This is necessary for Xcode 14';
const FMT_INJECTION =
  `    # Xcode 26 / Apple clang 21: disable fmt's consteval format-string\n` +
  `    # checking so RN 0.79's bundled fmt compiles. Drop once RN ships fmt 12.1+.\n` +
  `    installer.pods_project.targets.each do |target|\n` +
  `      target.build_configurations.each do |config|\n` +
  `        defs = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']\n` +
  `        defs = [defs] unless defs.is_a?(Array)\n` +
  `        defs << 'FMT_USE_CONSTEVAL=0' unless defs.include?('FMT_USE_CONSTEVAL=0')\n` +
  `        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = defs\n` +
  `      end\n` +
  `    end\n\n` +
  FMT_ANCHOR;

module.exports = function withResourceBundleDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (
        contents.includes(DEPLOY_ANCHOR) &&
        !contents.includes("['IPHONEOS_DEPLOYMENT_TARGET'] = '" + DEPLOYMENT_TARGET + "'")
      ) {
        contents = contents.replace(DEPLOY_ANCHOR, DEPLOY_INJECTION);
      }

      if (
        contents.includes(FMT_ANCHOR) &&
        !contents.includes('FMT_USE_CONSTEVAL=0')
      ) {
        contents = contents.replace(FMT_ANCHOR, FMT_INJECTION);
      }

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
