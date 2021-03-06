import configBuilder from './helpers/configHelper';
import pathHelper from './helpers/pathHelper';

interface Config {
    port: number,
    isDevLocal: boolean,
    appVersion: string,
    rootUrl?: string,
    email?: any,
    auth?: any,
    db?: {
        username: string,
        password: string,
        host: string,
        port: number,
        name: string,
        timeout: number,
        seedOnStart?: boolean
    }
}

let logConfig = true;
let config: Config = {
    port: 5000,
    isDevLocal: process.env.NODE_ENV !== 'production',
    appVersion: '0.0.1',
    rootUrl: 'http://localhost:3000',
    auth: {
        jwtKey: '',
        expiry: 60 * 60 * 2
    },
    db: {
        host: 'localhost',
        port: 27017,
        name: 'reducer',
        username: '',
        password: '',
        timeout: 5000,
        seedOnStart: false
    },
    email: {
        useStubs: false,
        sendGridKey: '',
        auth: {
            user: '',
            password: ''
        },
        fromNoReply: 'noreply@buildapp.com'
    }
};

//define ENV VARs which override all other values if defined
const envVars = {
    rootUrl: 'ROOT_URL',
    auth: {
        jwtKey: 'JWT_KEY'
    },
    db: {
        host: 'DB_HOST',
        port: 'DB_PORT',
        name: 'DB_NAME',
        username: 'DB_USER',
        password: 'DB_PASSWORD',
        seedOnStart: 'DB_SEED_ON_START'
    },
    email: {
        sendGridKey: 'SENDGRID_KEY'
    }
};

configBuilder.addJsonFile(config, pathHelper.getDataRelative('config.json'), true);

configBuilder.addJsonFile(config, pathHelper.getLocalRelative('config.local.json'));

configBuilder.loadEnvVars(config, envVars);

if (config.isDevLocal) {
    configBuilder.printConfig(config);
}

export default config;
