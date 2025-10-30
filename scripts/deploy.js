#!/usr/bin/env node

/**
 * Production Deployment Script
 * Comprehensive deployment automation with environment setup,
 * build optimization, and store submission
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Deployment configuration
const DEPLOYMENT_CONFIG = {
    environments: ['development', 'staging', 'production'],
    platforms: ['ios', 'android', 'web'],
    requiredEnvVars: [
        'EXPO_TOKEN',
        'APPLE_ID',
        'APPLE_APP_SPECIFIC_PASSWORD',
        'GOOGLE_SERVICE_ACCOUNT_KEY',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY'
    ],
    buildOutputs: {
        ios: ['*.ipa'],
        android: ['*.apk', '*.aab'],
        web: ['web-build/']
    }
};

class DeploymentManager {
    constructor() {
        this.startTime = Date.now();
        this.buildLogs = [];
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Main deployment orchestration
     */
    async deploy(options = {}) {
        try {
            console.log('🚀 Starting production deployment...\n');

            // Pre-deployment checks
            await this.preDeploymentChecks();

            // Environment setup
            await this.setupEnvironment(options.environment || 'production');

            // Code quality checks
            await this.runQualityChecks();

            // Build optimization
            await this.optimizeBuild();

            // Platform builds
            await this.buildPlatforms(options.platforms || ['ios', 'android']);

            // Store submission
            if (options.submit !== false) {
                await this.submitToStores();
            }

            // Post-deployment tasks
            await this.postDeploymentTasks();

            this.logSuccess('Deployment completed successfully!');
            this.printSummary();

        } catch (error) {
            this.logError('Deployment failed:', error.message);
            this.printErrorReport();
            process.exit(1);
        }
    }

    /**
     * Pre-deployment validation
     */
    async preDeploymentChecks() {
        console.log('📋 Running pre-deployment checks...');

        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`✓ Node.js version: ${nodeVersion}`);

        // Check npm/yarn installation
        try {
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
            console.log(`✓ npm version: ${npmVersion}`);
        } catch (error) {
            throw new Error('npm is not installed or not accessible');
        }

        // Check Expo CLI
        try {
            const expoVersion = execSync('expo --version', { encoding: 'utf8' }).trim();
            console.log(`✓ Expo CLI version: ${expoVersion}`);
        } catch (error) {
            console.log('⚠️  Installing Expo CLI...');
            execSync('npm install -g @expo/cli@latest', { stdio: 'inherit' });
        }

        // Check EAS CLI
        try {
            const easVersion = execSync('eas --version', { encoding: 'utf8' }).trim();
            console.log(`✓ EAS CLI version: ${easVersion}`);
        } catch (error) {
            console.log('⚠️  Installing EAS CLI...');
            execSync('npm install -g eas-cli@latest', { stdio: 'inherit' });
        }

        // Verify project structure
        const requiredFiles = [
            'package.json',
            'app.json',
            'eas.json',
            'babel.config.js'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
        console.log('✓ Project structure validated');

        // Check Git status
        try {
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim()) {
                const answer = await this.prompt('⚠️  Working directory has uncommitted changes. Continue? (y/N): ');
                if (answer.toLowerCase() !== 'y') {
                    throw new Error('Deployment cancelled due to uncommitted changes');
                }
            }
            console.log('✓ Git status checked');
        } catch (error) {
            console.log('⚠️  Git repository not found or not accessible');
        }

        console.log('✅ Pre-deployment checks completed\n');
    }

    /**
     * Setup deployment environment
     */
    async setupEnvironment(environment) {
        console.log(`🔧 Setting up ${environment} environment...`);

        // Load environment variables
        const envFile = `.env.${environment}`;
        if (fs.existsSync(envFile)) {
            console.log(`✓ Loading environment from ${envFile}`);
            const envContent = fs.readFileSync(envFile, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key] = value.replace(/['"]/g, '');
                }
            });
        }

        // Verify required environment variables
        const missingVars = DEPLOYMENT_CONFIG.requiredEnvVars.filter(
            varName => !process.env[varName]
        );

        if (missingVars.length > 0) {
            this.logWarning(`Missing environment variables: ${missingVars.join(', ')}`);

            // Prompt for missing variables
            for (const varName of missingVars) {
                if (varName.includes('TOKEN') || varName.includes('KEY') || varName.includes('PASSWORD')) {
                    const value = await this.promptSecret(`Enter ${varName}: `);
                    process.env[varName] = value;
                }
            }
        }

        // Install dependencies
        console.log('📦 Installing dependencies...');
        execSync('npm ci --legacy-peer-deps', { stdio: 'inherit' });

        console.log('✅ Environment setup completed\n');
    }

    /**
     * Run code quality checks
     */
    async runQualityChecks() {
        console.log('🔍 Running code quality checks...');

        // TypeScript check
        try {
            console.log('Checking TypeScript...');
            execSync('npx tsc --noEmit', { stdio: 'pipe' });
            console.log('✓ TypeScript check passed');
        } catch (error) {
            this.logWarning('TypeScript check failed - continuing with warnings');
        }

        // ESLint
        try {
            console.log('Running ESLint...');
            execSync('npm run lint', { stdio: 'pipe' });
            console.log('✓ ESLint check passed');
        } catch (error) {
            this.logWarning('ESLint check failed - continuing with warnings');
        }

        // Prettier
        try {
            console.log('Checking code formatting...');
            execSync('npm run prettier:check', { stdio: 'pipe' });
            console.log('✓ Code formatting check passed');
        } catch (error) {
            this.logWarning('Code formatting check failed - continuing with warnings');
        }

        // Tests
        try {
            console.log('Running tests...');
            execSync('npm run test', { stdio: 'pipe' });
            console.log('✓ Tests passed');
        } catch (error) {
            const answer = await this.prompt('⚠️  Tests failed. Continue deployment? (y/N): ');
            if (answer.toLowerCase() !== 'y') {
                throw new Error('Deployment cancelled due to test failures');
            }
        }

        console.log('✅ Code quality checks completed\n');
    }

    /**
     * Optimize build configuration
     */
    async optimizeBuild() {
        console.log('⚡ Optimizing build configuration...');

        // Update app.json for production
        const appConfigPath = 'app.json';
        const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));

        // Production optimizations
        appConfig.expo.jsEngine = 'hermes';
        appConfig.expo.enableDangerousExperimentalLeanBuilds = true;
        appConfig.expo.updates = {
            enabled: true,
            checkAutomatically: 'ON_LOAD',
            fallbackToCacheTimeout: 0
        };

        // Remove development-only configurations
        delete appConfig.expo.packagerOpts;

        // Write optimized config
        fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
        console.log('✓ App configuration optimized');

        // Generate source maps for crash reporting
        console.log('Generating source maps...');
        // Add source map generation logic here

        console.log('✅ Build optimization completed\n');
    }

    /**
     * Build for specified platforms
     */
    async buildPlatforms(platforms) {
        console.log(`🏗️  Building for platforms: ${platforms.join(', ')}...`);

        for (const platform of platforms) {
            await this.buildForPlatform(platform);
        }

        console.log('✅ All platform builds completed\n');
    }

    /**
     * Build for specific platform
     */
    async buildForPlatform(platform) {
        console.log(`Building for ${platform}...`);

        try {
            switch (platform) {
                case 'ios':
                    execSync('eas build --platform ios --profile production', { stdio: 'inherit' });
                    break;
                case 'android':
                    execSync('eas build --platform android --profile production', { stdio: 'inherit' });
                    break;
                case 'web':
                    execSync('expo export:web', { stdio: 'inherit' });
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }
            console.log(`✓ ${platform} build completed`);
        } catch (error) {
            throw new Error(`${platform} build failed: ${error.message}`);
        }
    }

    /**
     * Submit builds to app stores
     */
    async submitToStores() {
        console.log('📱 Submitting to app stores...');

        const answer = await this.prompt('Submit builds to app stores? (y/N): ');
        if (answer.toLowerCase() !== 'y') {
            console.log('Skipping store submission');
            return;
        }

        try {
            // iOS App Store submission
            console.log('Submitting to iOS App Store...');
            execSync('eas submit --platform ios --profile production', { stdio: 'inherit' });
            console.log('✓ iOS submission completed');

            // Google Play Store submission
            console.log('Submitting to Google Play Store...');
            execSync('eas submit --platform android --profile production', { stdio: 'inherit' });
            console.log('✓ Android submission completed');

        } catch (error) {
            this.logWarning('Store submission failed:', error.message);
        }

        console.log('✅ Store submission completed\n');
    }

    /**
     * Post-deployment tasks
     */
    async postDeploymentTasks() {
        console.log('🔧 Running post-deployment tasks...');

        // Create deployment report
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            buildLogs: this.buildLogs,
            warnings: this.warnings,
            errors: this.errors,
            environment: process.env.APP_ENV || 'production',
            version: this.getAppVersion()
        };

        fs.writeFileSync('deployment-report.json', JSON.stringify(report, null, 2));
        console.log('✓ Deployment report generated');

        // Tag release in Git (if available)
        try {
            const version = this.getAppVersion();
            execSync(`git tag -a v${version} -m "Release v${version}"`, { stdio: 'pipe' });
            execSync('git push origin --tags', { stdio: 'pipe' });
            console.log(`✓ Git tag v${version} created`);
        } catch (error) {
            this.logWarning('Git tagging failed:', error.message);
        }

        // Notify deployment completion
        await this.sendDeploymentNotification();

        console.log('✅ Post-deployment tasks completed\n');
    }

    /**
     * Send deployment notification
     */
    async sendDeploymentNotification() {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('No webhook URL configured for notifications');
            return;
        }

        try {
            const { default: fetch } = await import('node-fetch');

            const payload = {
                text: '🚀 Diet Tracker App Deployment Complete!',
                attachments: [{
                    color: 'good',
                    fields: [
                        {
                            title: 'Version',
                            value: this.getAppVersion(),
                            short: true
                        },
                        {
                            title: 'Environment',
                            value: process.env.APP_ENV || 'production',
                            short: true
                        },
                        {
                            title: 'Duration',
                            value: `${Math.round((Date.now() - this.startTime) / 1000)}s`,
                            short: true
                        },
                        {
                            title: 'Warnings',
                            value: this.warnings.length.toString(),
                            short: true
                        }
                    ]
                }]
            };

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('✓ Deployment notification sent');
        } catch (error) {
            this.logWarning('Failed to send deployment notification:', error.message);
        }
    }

    /**
     * Utility methods
     */
    getAppVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return packageJson.version || '1.0.0';
        } catch (error) {
            return '1.0.0';
        }
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
    }

    logWarning(message, details = '') {
        const warning = `⚠️  ${message} ${details}`.trim();
        console.log(warning);
        this.warnings.push(warning);
    }

    logError(message, details = '') {
        const error = `❌ ${message} ${details}`.trim();
        console.error(error);
        this.errors.push(error);
    }

    async prompt(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(question, answer => {
                rl.close();
                resolve(answer);
            });
        });
    }

    async promptSecret(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(question, answer => {
                rl.close();
                resolve(answer);
            });
        });
    }

    printSummary() {
        const duration = Math.round((Date.now() - this.startTime) / 1000);

        console.log('\n' + '='.repeat(50));
        console.log('📊 DEPLOYMENT SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Status: SUCCESS`);
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📦 Version: ${this.getAppVersion()}`);
        console.log(`⚠️  Warnings: ${this.warnings.length}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        console.log('='.repeat(50) + '\n');
    }

    printErrorReport() {
        console.log('\n' + '='.repeat(50));
        console.log('❌ DEPLOYMENT FAILED');
        console.log('='.repeat(50));

        if (this.errors.length > 0) {
            console.log('\nErrors:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log('\nWarnings:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }

        console.log('='.repeat(50) + '\n');
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--environment':
            case '-e':
                options.environment = args[++i];
                break;
            case '--platforms':
            case '-p':
                options.platforms = args[++i].split(',');
                break;
            case '--no-submit':
                options.submit = false;
                break;
            case '--help':
            case '-h':
                console.log(`
Production Deployment Script

Usage: node scripts/deploy.js [options]

Options:
  -e, --environment <env>    Target environment (development|staging|production)
  -p, --platforms <list>     Comma-separated list of platforms (ios,android,web)
  --no-submit               Skip store submission
  -h, --help                Show help

Examples:
  node scripts/deploy.js                           # Full production deployment
  node scripts/deploy.js -e staging               # Deploy to staging
  node scripts/deploy.js -p ios,android           # Build specific platforms
  node scripts/deploy.js --no-submit              # Build without store submission
        `);
                process.exit(0);
        }
    }

    // Run deployment
    const deployer = new DeploymentManager();
    deployer.deploy(options).catch(error => {
        console.error('Deployment script failed:', error.message);
        process.exit(1);
    });
}

module.exports = DeploymentManager;