#!/usr/bin/env node

/**
 * App Configuration Script
 * Dynamically configures the app for different environments
 */

const fs = require('fs');
const path = require('path');

// Configuration templates for different environments
const CONFIGURATIONS = {
    development: {
        app: {
            expo: {
                name: "Diet Tracker (Dev)",
                slug: "diet-tracker-dev",
                scheme: "diettracker-dev",
                version: "1.0.0",
                orientation: "portrait",
                icon: "./assets/images/icon.png",
                userInterfaceStyle: "automatic",
                newArchEnabled: true,
                jsEngine: "hermes",
                splash: {
                    image: "./assets/images/splash-icon.png",
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                },
                ios: {
                    supportsTablet: true,
                    bundleIdentifier: "com.diettracker.dev",
                    buildNumber: "1.0.0",
                    config: {
                        usesNonExemptEncryption: false
                    }
                },
                android: {
                    adaptiveIcon: {
                        foregroundImage: "./assets/images/adaptive-icon.png",
                        backgroundColor: "#ffffff"
                    },
                    package: "com.diettracker.dev",
                    versionCode: 1
                },
                web: {
                    bundler: "metro",
                    output: "static",
                    favicon: "./assets/images/favicon.png"
                },
                plugins: [
                    "expo-router",
                    [
                        "expo-splash-screen",
                        {
                            image: "./assets/images/splash-icon.png",
                            imageWidth: 200,
                            resizeMode: "contain",
                            backgroundColor: "#ffffff"
                        }
                    ]
                ],
                experiments: {
                    typedRoutes: true
                },
                extra: {
                    apiUrl: "https://dev-api.diettracker.app",
                    environment: "development",
                    analyticsEnabled: false,
                    logLevel: "debug"
                }
            }
        },
        env: {
            APP_ENV: "development",
            API_URL: "https://dev-api.diettracker.app",
            ANALYTICS_ENABLED: "false",
            LOG_LEVEL: "debug"
        }
    },

    staging: {
        app: {
            expo: {
                name: "Diet Tracker (Staging)",
                slug: "diet-tracker-staging",
                scheme: "diettracker-staging",
                version: "1.0.0",
                orientation: "portrait",
                icon: "./assets/images/icon.png",
                userInterfaceStyle: "automatic",
                newArchEnabled: true,
                jsEngine: "hermes",
                splash: {
                    image: "./assets/images/splash-icon.png",
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                },
                ios: {
                    supportsTablet: true,
                    bundleIdentifier: "com.diettracker.staging",
                    buildNumber: "1.0.0",
                    config: {
                        usesNonExemptEncryption: false
                    }
                },
                android: {
                    adaptiveIcon: {
                        foregroundImage: "./assets/images/adaptive-icon.png",
                        backgroundColor: "#ffffff"
                    },
                    package: "com.diettracker.staging",
                    versionCode: 1
                },
                web: {
                    bundler: "metro",
                    output: "static",
                    favicon: "./assets/images/favicon.png"
                },
                plugins: [
                    "expo-router",
                    [
                        "expo-splash-screen",
                        {
                            image: "./assets/images/splash-icon.png",
                            imageWidth: 200,
                            resizeMode: "contain",
                            backgroundColor: "#ffffff"
                        }
                    ]
                ],
                experiments: {
                    typedRoutes: true
                },
                extra: {
                    apiUrl: "https://staging-api.diettracker.app",
                    environment: "staging",
                    analyticsEnabled: true,
                    logLevel: "info"
                }
            }
        },
        env: {
            APP_ENV: "staging",
            API_URL: "https://staging-api.diettracker.app",
            ANALYTICS_ENABLED: "true",
            LOG_LEVEL: "info"
        }
    },

    production: {
        app: {
            expo: {
                name: "Diet Tracker",
                slug: "diet-tracker",
                scheme: "diettracker",
                version: "1.0.0",
                orientation: "portrait",
                icon: "./assets/images/icon.png",
                userInterfaceStyle: "automatic",
                newArchEnabled: true,
                jsEngine: "hermes",
                enableDangerousExperimentalLeanBuilds: true,
                splash: {
                    image: "./assets/images/splash-icon.png",
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                },
                ios: {
                    supportsTablet: true,
                    bundleIdentifier: "com.diettracker.app",
                    buildNumber: "1.0.0",
                    config: {
                        usesNonExemptEncryption: false
                    }
                },
                android: {
                    adaptiveIcon: {
                        foregroundImage: "./assets/images/adaptive-icon.png",
                        backgroundColor: "#ffffff"
                    },
                    package: "com.diettracker.app",
                    versionCode: 1
                },
                web: {
                    bundler: "metro",
                    output: "static",
                    favicon: "./assets/images/favicon.png"
                },
                plugins: [
                    "expo-router",
                    [
                        "expo-splash-screen",
                        {
                            image: "./assets/images/splash-icon.png",
                            imageWidth: 200,
                            resizeMode: "contain",
                            backgroundColor: "#ffffff"
                        }
                    ]
                ],
                experiments: {
                    typedRoutes: true
                },
                updates: {
                    enabled: true,
                    checkAutomatically: "ON_LOAD",
                    fallbackToCacheTimeout: 0
                },
                extra: {
                    apiUrl: "https://api.diettracker.app",
                    environment: "production",
                    analyticsEnabled: true,
                    logLevel: "error"
                }
            }
        },
        env: {
            APP_ENV: "production",
            API_URL: "https://api.diettracker.app",
            ANALYTICS_ENABLED: "true",
            LOG_LEVEL: "error"
        }
    }
};

class AppConfigurator {
    constructor() {
        this.environment = process.env.APP_ENV || 'development';
        this.projectRoot = process.cwd();
    }

    /**
     * Configure the app for the specified environment
     */
    async configure() {
        try {
            console.log(`🔧 Configuring app for ${this.environment} environment...`);

            // Validate environment
            if (!CONFIGURATIONS[this.environment]) {
                throw new Error(`Invalid environment: ${this.environment}`);
            }

            const config = CONFIGURATIONS[this.environment];

            // Update app.json
            await this.updateAppConfig(config.app);

            // Create/update environment file
            await this.updateEnvironmentFile(config.env);

            // Update package.json version if needed
            await this.updatePackageVersion();

            // Validate configuration
            await this.validateConfiguration();

            console.log(`✅ App configured successfully for ${this.environment}`);

            return true;
        } catch (error) {
            console.error(`❌ Configuration failed:`, error.message);
            return false;
        }
    }

    /**
     * Update app.json configuration
     */
    async updateAppConfig(appConfig) {
        const appJsonPath = path.join(this.projectRoot, 'app.json');

        try {
            // Read existing app.json
            let existingConfig = {};
            if (fs.existsSync(appJsonPath)) {
                const content = fs.readFileSync(appJsonPath, 'utf8');
                existingConfig = JSON.parse(content);
            }

            // Merge configurations
            const updatedConfig = this.deepMerge(existingConfig, appConfig);

            // Write updated configuration
            fs.writeFileSync(appJsonPath, JSON.stringify(updatedConfig, null, 2));
            console.log(`✓ Updated app.json for ${this.environment}`);

        } catch (error) {
            throw new Error(`Failed to update app.json: ${error.message}`);
        }
    }

    /**
     * Create/update environment file
     */
    async updateEnvironmentFile(envConfig) {
        const envFileName = `.env.${this.environment}`;
        const envFilePath = path.join(this.projectRoot, envFileName);

        try {
            // Create environment file content
            const envContent = Object.entries(envConfig)
                .map(([key, value]) => `${key}=${value}`)
                .join('\n');

            // Write environment file
            fs.writeFileSync(envFilePath, envContent);
            console.log(`✓ Created/updated ${envFileName}`);

            // Create .env symlink for current environment
            const envLink = path.join(this.projectRoot, '.env');
            if (fs.existsSync(envLink)) {
                fs.unlinkSync(envLink);
            }

            // Copy content to .env (Windows-compatible)
            fs.writeFileSync(envLink, envContent);
            console.log(`✓ Updated .env for current environment`);

        } catch (error) {
            throw new Error(`Failed to update environment file: ${error.message}`);
        }
    }

    /**
     * Update package.json version if needed
     */
    async updatePackageVersion() {
        const packageJsonPath = path.join(this.projectRoot, 'package.json');

        try {
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

                // You can implement version bumping logic here if needed
                // For now, just ensure consistency
                console.log(`✓ Package version: ${packageJson.version}`);
            }
        } catch (error) {
            console.warn(`⚠️  Could not update package version: ${error.message}`);
        }
    }

    /**
     * Validate the configuration
     */
    async validateConfiguration() {
        const requiredFiles = ['app.json', '.env'];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Validate app.json structure
        const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
        if (!appJson.expo || !appJson.expo.name || !appJson.expo.slug) {
            throw new Error('Invalid app.json structure');
        }

        console.log(`✓ Configuration validation passed`);
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Print configuration summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log(`📱 APP CONFIGURATION SUMMARY`);
        console.log('='.repeat(50));
        console.log(`Environment: ${this.environment}`);

        try {
            const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
            console.log(`App Name: ${appJson.expo.name}`);
            console.log(`Bundle ID: ${appJson.expo.ios?.bundleIdentifier || appJson.expo.android?.package}`);
            console.log(`Version: ${appJson.expo.version}`);
            console.log(`API URL: ${appJson.expo.extra?.apiUrl || 'Not configured'}`);
            console.log(`Analytics: ${appJson.expo.extra?.analyticsEnabled ? 'Enabled' : 'Disabled'}`);
        } catch (error) {
            console.log('Could not read app configuration');
        }

        console.log('='.repeat(50) + '\n');
    }
}

// CLI execution
if (require.main === module) {
    const configurator = new AppConfigurator();

    configurator.configure()
        .then(success => {
            if (success) {
                configurator.printSummary();
                process.exit(0);
            } else {
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('Configuration script failed:', error.message);
            process.exit(1);
        });
}

module.exports = AppConfigurator;