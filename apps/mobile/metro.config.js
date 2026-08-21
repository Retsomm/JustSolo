const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Let Metro see files outside apps/mobile (packages/shared, root node_modules) —
// required for a yarn workspaces monorepo, see apps/mobile/AGENTS.md.
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// yarn classic hoists most deps to the workspace root; without this Metro can
// resolve a stray nested copy of a dependency (e.g. react) that differs from
// the hoisted one, causing "Invalid hook call" / duplicate-React bugs.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
