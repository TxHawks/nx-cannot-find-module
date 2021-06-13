import { default as pluginTester, TestObject, } from 'babel-plugin-tester';
import * as plugin from 'babel-plugin-macros';

type Tests = Array<TestObject | string> | Record<string, TestObject | string>;

export function createTestsFactory(basePath: string) {
  return function createTests(title: string, tests: Tests): void {
    return pluginTester({
      plugin,
      snapshot: false,
      title,
      babelOptions: { filename: basePath, },
      tests,
    });
  }
}
