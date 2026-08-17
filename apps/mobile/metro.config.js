const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Monorepo: observa todo workspace + resolve em node_modules do root e do app
config.watchFolders = [workspaceRoot];
// Nota: serverRoot deixado no default (workspaceRoot) para dev start no Expo Go/dev client.
// Para build APK release, exportar EXPO_USE_METRO_WORKSPACE_ROOT=1 ou usar Metro padrao.
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Mapeia imports relativos terminando em ".js" para arquivos ".ts/.tsx" reais.
// shared-types e shared-schemas usam ".js" explicito por causa do padrao TS+NodeNext da API,
// mas o Metro precisa achar o ".ts" correspondente.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName.endsWith('.js') && (moduleName.startsWith('./') || moduleName.startsWith('../'))) {
        const withoutExt = moduleName.replace(/\.js$/, '');
        try {
            return context.resolveRequest(context, withoutExt, platform);
        } catch {
            // se nao resolver, deixa o fluxo padrao seguir
        }
    }
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
