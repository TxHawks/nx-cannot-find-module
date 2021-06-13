import * as Babel from '@babel/core';
import * as t from '@babel/types';
import { Binding, } from '@babel/traverse';
import * as chalk from 'chalk';

import type {
  NodePath,
} from '@babel/core';

import type {
  Expression,
  Identifier,
  Node,
  SpreadElement,
} from '@babel/types';

export function handleSpread(path: NodePath): void {
  if (path.isArrayExpression()) {
    handleArray(path, path.node.elements);
  }
  else if (path.isSpreadElement()) {
    const { argument, } = path.node;
    if (t.isObjectExpression(argument)) {
      path.replaceWithMultiple(argument.properties);
    }
    if (t.isArrayExpression(argument)) {
      handleArray(path, argument.elements);
    }
  }
}

export function handleArray(
  path: NodePath,
  elems: Array<SpreadElement | Expression| null>
): void {
  if (t.isArrayExpression(path.parentPath)) {
    for (const element of elems) {
      if (element && 'elements' in path.parent) {
        const parentElements = path.parent.elements;
        // @ts-ignore
        const pathIdx = parentElements.indexOf(path.node);
        parentElements.splice(pathIdx, 0, element);
      }
    }
    path.remove();
  }
}

export function handleIdentifier(path: Babel.NodePath<Identifier>): void {
  const { name, } = path.node;
  if (name === 'undefined') {
    handlePathRemoval(path);
    return;
  }
  const binding = path.scope.bindings[path.node.name];
  if (binding && binding.referenced) handleVar(path);
}

export function handlePathRemoval(path: NodePath): void {
  const { parentPath, } = path;

  if (t.isObjectProperty(parentPath)) parentPath.remove();
  else path.remove();
}

export function handleVar(path: NodePath): Node | NodePath {
  if (!t.isIdentifier(path) || !t.isIdentifier(path.node)) return path;

  const { name, } = path.node;
  const binding = path.scope.bindings[ name ];
  const {
    constant = true,
    referencePaths = [],
    constantViolations = [],
  } = binding || {};
  const isModified = !constant || referencePaths.some(findAssignmentParent);

  // Throw if value has been modified
  if (isModified) {
    const modifiers = referencePaths.filter(findAssignmentParent);
    throw path.buildCodeFrameError(
      '\nVariables passed to the merge macro must not be modified after declaration.\n'
      + `${chalk.red(name)} is modified at the following places:${chalk.red([
        ...constantViolations,
        ...modifiers,
      ].map(({ node, }) => {
        const { loc, } = node;
        if (loc) return ` ${loc.start.line}:${loc.start.column}`;
      }).reverse())}.\n`
    );
  }

  const initialValue = getValue(binding, path);
  let initialValueNode;
  if ('node' in initialValue) initialValueNode = initialValue.node;
  else initialValueNode = initialValue;

  if (t.isSpreadElement(path.parentPath)) {
    if (
      path.parentPath.parentPath.isObjectExpression()
        && t.isObjectExpression(initialValueNode)
    ) {
      path.parentPath.replaceWithMultiple(initialValueNode.properties);
    }
    else path.parentPath.replaceWith(initialValue);
  }
  else path.replaceWith(initialValue);

  // remove bound variable if no more referencePaths
  removeIfUnreferenced(binding, path);

  return initialValue;
}

export function getValue(binding: Binding, path: NodePath): NodePath | Node {
  const declarationNode = binding.path.node;
  if ('init' in declarationNode && declarationNode.init) {
    const { init, } = declarationNode;

    // Nested variable
    if (t.isIdentifier(init)) {
      // if (isIdentifier(binding.path.node) || isIdentifier(init)) {
      const { name, } = init;
      const topLevelBinding = binding.scope.bindings[name];

      if (topLevelBinding) {
        let initPath = topLevelBinding.path.get('init');
        initPath = Array.isArray(initPath) ? initPath[ 0 ] : initPath;

        removeIfUnreferenced(topLevelBinding, path);
        const ret = handleVar(initPath);
        return ret;
      }
    }

    return init;
  }

  return binding.path;
}

export function findAssignmentParent(path: NodePath): (NodePath | null) {
  return path.findParent(t.isAssignmentExpression);
}

export function removeIfUnreferenced(binding: Binding, refPath: NodePath): void {
  const refPaths = binding.referencePaths;
  const refIdx = refPaths.indexOf(refPath);
  refPaths.splice(refIdx, 1);

  if (!binding.referencePaths.length) {
    // remove bound variable if no more referencePaths
    binding.path.remove();
  }
}
