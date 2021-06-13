import { mergeAdvanced, } from 'object-merge-advanced';
import * as Babel from '@babel/core';
import * as t from '@babel/types';
import * as chalk from 'chalk';

import {
  handleIdentifier,
  handlePathRemoval,
  handleSpread,
  handleVar,
} from '@haaretz/theme/shared';

import type {
  Identifier,
  ObjectExpression,
  ObjectProperty,
} from '@babel/types';

type NodePath = Babel.NodePath;
type Visitor = Babel.Visitor;

type Args = {
  nodePath: Babel.NodePath;
  babel: typeof Babel;
};

type MergeItemType =
  | 'array'
  | 'bigint'
  | 'boolean'
  | 'date'
  | 'date'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'string'
  | 'symbol'
  | 'undefined';

interface InfoObj {
  path: string | undefined;
  key: string | null;
  type: [MergeItemType, MergeItemType];
}

const mergeOpts = { cb: astMerger, };

const unsuportedTypes = [
  'NullLiteral',
  'CallExpression',
  'Function',
].join('|');

const nestedIdentifierVisitor: Visitor = {
  Identifier(path) {
    handleIdentifier(path);
  },
};

const visitor: Visitor = {
  [ unsuportedTypes ](path: NodePath) {
    handlePathRemoval(path);
  },
  SpreadElement(path) {
    path.traverse(nestedIdentifierVisitor);
    handleSpread(path);
  },
  Identifier(path) {
    handleIdentifier(path);
  },
};

export default function merge({ nodePath, }: Args): void {
  const callPath = nodePath.parentPath;
  const spread = callPath.parentPath;
  let args = callPath.get('arguments');
  args = Array.isArray(args) ? args : [ args, ];

  for (const arg of args) {
    arg.traverse(visitor);
    if (t.isIdentifier(arg) && t.isIdentifier(arg.node)) {
      if (arg.node.name === 'undefined') continue;
      handleVar(arg);
    }
    if (arg.isSpreadElement()) {
      arg.replaceWith(arg.node.argument);
      // handleSpread(arg);
    }
    if (!arg.isNullLiteral() && !arg.isObjectExpression() && !arg.isIdentifier()) {
      throw arg.buildCodeFrameError(
        '\nArguments to "merge.macro" must only be "ObjcetExpression"s.\n'
        + chalk.red(`You passed a "${arg.type}".\n`)
      );
    }
  }

  const propsAst = args
    .map(arg => arg.node)
    .filter((x): x is ObjectExpression => t.isObjectExpression(x))
    .flatMap(x => x.properties)
    .filter((x): x is ObjectProperty => t.isObjectProperty(x))
    .map(prop => {
      const key = prop.key as Identifier;
      return { [key.name]: prop.value, };
    });

  const mergedPropsAst = Object.entries(
    propsAst.reduce((node1, node2) => mergeAdvanced(node1, node2, mergeOpts))
  );
  const propsArray = mergedPropsAst.map(([ key, value, ]) => {
    return t.objectProperty(t.identifier(key), value);
  });

  spread.replaceWithMultiple(propsArray);
}


///////////////
//  HELPERS  //
///////////////

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function astMerger(input1: any, input2: any, result: any, infoObj?: InfoObj): any {
  if (infoObj && infoObj.key) {
    // first level
    return mergeAdvanced(input1, input2, mergeOpts);
  }

  if (t.isObjectProperty(input1) && t.isObjectProperty(input2)) {
    const mergedValue = mergeAdvanced(input1.value, input2.value, mergeOpts);
    return {
      ...input2,
      value: mergedValue,
    };
  }

  // Both Objects
  if (t.isObjectExpression(input1) && t.isObjectExpression(input2)) {
    const mergedProps = [];

    // Get all keys
    const keys = [ input1, input2, ].flatMap(node =>
      node.properties
        // TODO: handle spread elements
        .filter((prop): prop is ObjectProperty => t.isObjectProperty(prop))
        .map(prop => {
          const { name, } = prop.key as Identifier;
          return name;
        })
    );
    const uniqueKeys = [ ...new Set(keys), ];

    for (const key of uniqueKeys) {
      const mergedProp = _merger(input1, input2, key);
      mergedProps.push(mergedProp);
    }

    return { ...input1, ...{ properties: mergedProps, }, };
  }

  // Non-mergable
  return result;
}

function _merger(node1: ObjectExpression, node2: ObjectExpression, key: string) {
  const fromNode1 = node1.properties.find((prop): prop is ObjectProperty => {
    if (!t.isObjectMethod(prop) && !t.isSpreadElement(prop)) {
      const propKey = prop.key as Identifier;
      return propKey.name === key;
    }
    return false;
  });
  const fromNode2 = node2.properties.find((prop): prop is ObjectProperty => {
    if (!t.isObjectMethod(prop) && !t.isSpreadElement(prop)) {
      const propKey = prop.key as Identifier;
      return propKey.name === key;
    }
    return false;
  });

  // ### no conflict ### //
  if (!fromNode2) return fromNode1;
  if (!fromNode1) return fromNode2;

  // ### Handle conflicts ### //
  // Override if merge isn't possible
  if (!(t.isObjectExpression(fromNode2.value) && t.isObjectExpression(fromNode2.value)))
    return fromNode2;

  return mergeAdvanced(fromNode1, fromNode2, mergeOpts);
}
