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
 * 2. fmt consteval. Apple clang in Xcode 26 enforces `consteval` strictly, so
 *    the fmt 11.0.2 bundled with RN 0.79 (via RCT-Folly) fails to compile
 *    ("call to consteval function ... is not a constant expression"). fmt
 *    11.0.x sets FMT_USE_CONSTEVAL itself in base.h and ignores a
 *    -DFMT_USE_CONSTEVAL=0 compiler flag (the override hook arrived in 11.1),
 *    so the header is rewritten after pods install. Format strings are then
 *    checked at runtime instead of compile time. Remove once React Native
 *    ships a fixed fmt. See fmtlib/fmt#4740, expo/expo#44229.
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
const FMT_MARKER = 'fmt_base_h';
const FMT_INJECTION =
  `    # Xcode 26: turn off fmt's consteval format-string checking by patching\n` +
  `    # the header. fmt 11.0.x ignores -DFMT_USE_CONSTEVAL=0.\n` +
  `    ${FMT_MARKER} = File.join(installer.sandbox.root, 'fmt', 'include', 'fmt', 'base.h')\n` +
  `    if File.exist?(${FMT_MARKER})\n` +
  `      fmt_src = File.read(${FMT_MARKER})\n` +
  `      fmt_patched = fmt_src.gsub(/#(\\s*)define FMT_USE_CONSTEVAL 1/) { "##{$1}define FMT_USE_CONSTEVAL 0" }\n` +
  `      if fmt_patched != fmt_src\n` +
  `        File.chmod(0644, ${FMT_MARKER})\n` +
  `        File.write(${FMT_MARKER}, fmt_patched)\n` +
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
        !contents.includes(FMT_MARKER)
      ) {
        contents = contents.replace(FMT_ANCHOR, FMT_INJECTION);
      }

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
