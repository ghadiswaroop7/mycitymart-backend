const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const path = require('path');
const config = getDefaultConfig(__dirname);

// Anchor blockList exclusions to the project root to avoid blocking 'dist' or other folders inside node_modules
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, '.git')) + '([/\\\\].*)?$'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, '.expo')) + '([/\\\\].*)?$'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, 'android')) + '([/\\\\].*)?$'),
  new RegExp('^' + escapeRegExp(path.resolve(__dirname, 'dist')) + '([/\\\\].*)?$'),
];

config.maxWorkers = 1;

module.exports = withNativeWind(config, { input: "./global.css" });
