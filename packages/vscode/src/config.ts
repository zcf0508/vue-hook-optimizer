import * as vscode from 'vscode';
import * as meta from './generated-meta';
import { dark, light } from './themes';

export function getVisConfigByTheme() {
  const config = vscode.workspace.getConfiguration();
  const theme = config.get(meta.configs.vhoTheme.key, meta.configs.vhoTheme.default);

  if (theme === 'auto') {
    const themeKind = vscode.window.activeColorTheme.kind;
    if (themeKind === 2 || themeKind === 3) {
      return dark;
    }
    else if (themeKind === 1 || themeKind === 4) {
      return light;
    }
    else {
      return light;
    }
  }
  else if (theme === 'light') {
    return light;
  }
  else if (theme === 'dark') {
    return dark;
  }
}

export function getHighlightConfig() {
  const config = vscode.workspace.getConfiguration();
  return config.get(meta.configs.vhoHighlight.key, meta.configs.vhoHighlight.default);
}

export function getLauguageConfig() {
  const config = vscode.workspace.getConfiguration();
  return config.get(meta.configs.vhoLanguage.key, meta.configs.vhoLanguage.default) || 'vue';
}
