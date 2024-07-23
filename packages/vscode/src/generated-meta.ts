// This file is generated by `vscode-ext-gen`. Do not modify manually.
// @see https://github.com/antfu/vscode-ext-gen

// Meta info
export const publisher = 'zcf0508';
export const name = 'vue-hook-optimizer-ext';
export const version = '0.0.61';
export const displayName = 'vue-hook-optimizer';
export const description = undefined;
export const extensionId = `${publisher}.${name}`;

/**
 * Type union of all commands
 */
export type CommandKey =
  | 'vho.action.analyze';

/**
 * Commands map registed by `zcf0508.vue-hook-optimizer-ext`
 */
export const commands = {
  /**
   * Analyze your `vue` file
   * @value `vho.action.analyze`
   */
  vhoActionAnalyze: 'vho.action.analyze',
} satisfies Record<string, CommandKey>;

/**
 * Type union of all configs
 */
export type ConfigKey =
  | 'vho.theme'
  | 'vho.language';

export interface ConfigKeyTypeMap {
  'vho.theme': ('auto' | 'light' | 'dark')
  'vho.language': ('vue' | 'react')
}

export interface ConfigShorthandMap {
  vhoTheme: 'vho.theme'
  vhoLanguage: 'vho.language'
}

export interface ConfigItem<T extends keyof ConfigKeyTypeMap> {
  key: T
  default: ConfigKeyTypeMap[T]
}

/**
 * Configs map registed by `zcf0508.vue-hook-optimizer-ext`
 */
export const configs = {
  /**
   * Choose settings that are suitable for the current theme.
   * @key `vho.theme`
   * @default `"auto"`
   * @type `string`
   */
  vhoTheme: {
    key: 'vho.theme',
    default: 'auto',
  } as ConfigItem<'vho.theme'>,
  /**
   * Choose the language used by components. It is recommended that differentiated settings be made according to the workspace.
   * @key `vho.language`
   * @default `"vue"`
   * @type `string`
   */
  vhoLanguage: {
    key: 'vho.language',
    default: 'vue',
  } as ConfigItem<'vho.language'>,
};
