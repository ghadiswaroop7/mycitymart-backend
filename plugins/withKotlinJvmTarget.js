const { withProjectBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to enforce Kotlin JVM Target to Java 17 across all subprojects/modules.
 * 
 * Solves:
 * "Inconsistent JVM-target compatibility detected for tasks 'compileReleaseJavaWithJavac' (17) and 'compileReleaseKotlin' (11)"
 */
const withKotlinJvmTarget = (config, jvmTarget = '17') => {
  return withProjectBuildGradle(config, (projectConfig) => {
    if (projectConfig.modResults.language === 'groovy') {
      const kotlinTargetBlock = `
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            jvmTarget = "${jvmTarget}"
        }
    }
}
`;
      if (!projectConfig.modResults.contents.includes('org.jetbrains.kotlin.gradle.tasks.KotlinCompile')) {
        projectConfig.modResults.contents += kotlinTargetBlock;
      }
    }
    return projectConfig;
  });
};

module.exports = createRunOncePlugin(withKotlinJvmTarget, 'withKotlinJvmTarget', '1.0.0');
