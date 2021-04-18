import fs                                        from 'fs'
import path                                      from 'path'
import { CompilerOptions, CompilerConfig }       from './compiler';
import { once, strictExtend }                    from './utils';

export type Plugin = Pick<CompilerOptions, 'directives' | 'mappers'>

/**
 * Detects available plugins and loads them
 *
 * @export
 * @returns {Plugin[]}
 */
export const autoDetectPlugins = once(() : Plugin[] => {
  const filePath = __dirname;
  const nodeModulesIdx = filePath.lastIndexOf('node_modules');

  const traverse = (folder: string) => fs
    .readdirSync(folder)
    .filter(name => /kyoml-plugin-/.test(name))
    .map((plugin) => require(path.join(folder, plugin)));

  if (nodeModulesIdx >= 0) {
    const nodeModulesPath = path.join(filePath.slice(0, nodeModulesIdx), 'node_modules');
    return traverse(nodeModulesPath);
  }

  const projectFolder = require?.main?.path;

  if (!projectFolder) {
    return [];
  }

  const nodeModulesPath = path.join(projectFolder, 'node_modules');

  if (fs.existsSync(nodeModulesPath)) {
    return traverse(nodeModulesPath);
  }

  return [];
})

/**
 * Merges all the plugins in to one
 *
 * @export
 * @param {CompilerConfig} config
 * @returns {Plugin}
 */
export function resolvePlugins(config: CompilerConfig) : Plugin {
  if (config.plugins === false) {
    return { directives: {}, mappers: {} };
  }

  const plugins = config.plugins === true ? autoDetectPlugins() : config.plugins;
  const composite : Plugin = {
    directives: {},
    mappers: {}
  }

  console.log(plugins)

  for (const plugin of plugins) {
    strictExtend(composite.directives, plugin.directives);
    strictExtend(composite.mappers, plugin.mappers);
  }

  return composite;
}
