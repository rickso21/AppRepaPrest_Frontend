const { withAppBuildGradle } = require("@expo/config-plugins");

const SPLITS_BLOCK = `
    splits {
        abi {
            enable true
            reset()
            include 'arm64-v8a', 'armeabi-v7a', 'x86_64' 
            universalApk false
        }
    }
`;

module.exports = function withAbiSplits(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withAbiSplits solo soporta Groovy (build.gradle)");
    }

    let contents = config.modResults.contents;

    // Evitar duplicar el bloque si ya existe
    if (contents.includes("universalApk false")) {
      return config;
    }

    // Insertar el bloque splits justo después del cierre de defaultConfig { ... }
    // Buscamos el patrón: "}\n    signingConfigs {" para colocar el splits en medio.
    const anchor = /(\n\s*}\s*\n\s*signingConfigs\s*\{)/;
    if (anchor.test(contents)) {
      contents = contents.replace(anchor, `\n${SPLITS_BLOCK}$1`);
    } else {
      // Fallback: insertar antes del cierre del bloque android
      const closeAndroid = /\n(\s*}\s*\n\s*\/\/ Apply static values)/;
      contents = contents.replace(closeAndroid, `\n${SPLITS_BLOCK}\n$1`);
    }

    config.modResults.contents = contents;
    return config;
  });
};
