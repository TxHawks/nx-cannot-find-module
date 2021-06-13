import { createMacro, MacroParams, } from 'babel-plugin-macros';

import merge from './merge';


function mergeMacro({ references, babel, }: MacroParams): void {
  for (const nodePath of references.default) merge({ nodePath, babel, });
}

export default createMacro(mergeMacro);

export const NAME = 'theme/merge.macro';
