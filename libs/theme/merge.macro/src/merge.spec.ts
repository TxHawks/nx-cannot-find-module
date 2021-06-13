// import path from 'path';
import { createTestsFactory, } from '@haaretz/theme/shared';
const createTests = createTestsFactory(__filename)

createTests('merge', [
  // TODO: test merging Objects
  // TODO: test overwriting
  // {
  //   title: 'test',
  //
  //   code: `
  //   import merge from './macro';
  //
  //     const obj = {
  //       a: 'aaa',
  //       ...merge(
  //         {
  //           foo: {
  //             bar: 'bar',
  //             baz: {
  //               a: 'a',
  //             },
  //           },
  //           boo: 'a',
  //         },
  //         {
  //           foo: {
  //             bar: 'sar',
  //             baz: {
  //               b: 'b',
  //             },
  //           },
  //           boo: 'c'
  //         },
  //       ),
  //     };
  //   `,
  //   output: `
  //   const obj = {
  //     a: 'aaa',
  //     foo: {
  //       bar: 'sar',
  //       baz: {
  //         a: 'a',
  //         b: 'b',
  //       },
  //     },
  //     boo: 'c',
  //   };
  //   `,
  // },
  {
    title: 'Remove methods',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        { b() { return 'a'; }, },
        { c: 't', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      c: 't',
    };
    `,
  },
  {
    title: 'Remove call expressions',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        { b: 't', },
        { c: 'dlfkj', },
        { c: Object.key({ a: 'b' }), },
        { b: Object.keys({ a: 'aaa', }), },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      b: 't',
      c: 'dlfkj',
    };
    `,
  },
  {
    title: 'Remove arrow functions',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        { m: { b: () => {} , zz: 'z', }, },
        { c: 't', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      m: {
        zz: 'z',
      },
      c: 't',
    };
    `,
  },
  {
    title: 'Remove functions',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        { m: { b: function b() {} , zz: 'z', }, },
        { c: 't', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      m: {
        zz: 'z',
      },
      c: 't',
    };
    `,
  },
  {
    title: 'remove undefined',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        undefined,
        { m: { b: null, zz: 'z', }, },
        { c: 't', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      m: {
        zz: 'z',
      },
      c: 't',
    };
    `,
  },
  {
    title: 'remove nulls',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        null,
        { m: { b: null, zz: 'z', }, },
        { c: 't', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      m: {
        zz: 'z',
      },
      c: 't',
    };
    `,
  },
  {
    title: 'Remove undefined',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        { m: { b: undefined, a: [ 1, undefined, ], zz: 'z', }, },
        { c: 't', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      m: {
        a: [1],
        zz: 'z',
      },
      c: 't',
    };
    `,
  },
  {
    title: 'merge flat objects',
    code: `
    import merge from './macro';

    const obj = {
      a: 'aaa',
      ...merge(
        { b: 'bbbb', },
        { c: 'cccc', },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      b: 'bbbb',
      c: 'cccc',
    };
    `,
  },
  {
    title: 'override primitive values',
    code: `
    import merge from './macro';
    const obj = {
      ...merge(
        { a: '1st', b: 1, },
        { b: 2, c: 3, d: 'd', },
        { a: '2nd', c: 'three'},
      )
    }
    `,
    output: `
    const obj = {
      a: '2nd',
      b: 2,
      c: 'three',
      d: 'd',
    };
    `,
  },
  {
    title: 'override arrays',
    code: `
    import merge from './macro';
    const obj = {
      ...merge(
        { a: [ 1, 2, 3, ], },
        { a: [ 4, 5, 6, ], },
      )
    }
    `,
    output: `
    const obj = {
      a: [4, 5, 6],
    };
    `,
  },
  {
    title: 'extract inline content of spread',
    code: `
    import merge from './macro';

      const obj = {
        a: 'aaa',
        ...merge(
          { c: 'cccc', ...{ c: 'this one', z: 'zzzz'}, },
        ),
      };
    `,
    output: `
    const obj = {
      a: 'aaa',
      c: 'this one',
      z: 'zzzz',
    };
    `,
  },
  {
    title: 'inline variables that resolve to primitives',
    code: `
    import merge from './macro';

    const  var1  = 'sss';
    const var2 = var1;

    const obj = {
      a: 'aaa',
      ...merge(
        { b: var2, }
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      b: 'sss',
    };
    `,
  },
  {
    title: 'inline variables that resolve to objects',
    code: `
    import merge from './macro';

    const  var1  = { b: 'rrr', };
    const var2 = var1;

    const obj = {
      a: 'aaa',
      ...merge(
        var2,
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      b: 'rrr',
    };
    `,
  },
  {
    title: 'inline variable values inside array spread',
    code: `
    import merge from './macro';

    const  var1  = [ { b: 'rrr', }, {xz: 'z'}];
    const var2 = var1;

    const obj = {
      ...merge(
        { a: 'aaa', },
        {
          b: [
            ...var2,
            { zz: 'x', },
          ],
        },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      b: [
        {
          b: 'rrr',
        },
        {
          xz: 'z',
        },
        {
          zz: 'x',
        },
      ],
    };
    `,
  },
  {
    title: 'inline variable values inside object spread',
    code: `
    import merge from './macro';

    const  var1  = { b: 'rrr', };
    const var2 = var1;

    const obj = {
      ...merge(
        { a: 'aaa', },
        { ...var2 },
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      b: 'rrr',
    };
    `,
  },
  {
    title: 'inline spread values of array',
    code: `
    import merge from './macro';

    const var1 = [1, 2]
    const var2 = var1;

    const obj = {
      a: 'aaa',
      ...merge(
        {
          foo: [
          ...var2
        ]
        }
      ),
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      foo: [1, 2],
    };
    `,
  },
  {
    title: 'throw error when passing modified value',
    error: true,
    code: `
    import merge from './macro';

    let var1 = { b: 'rrr', }
    var1.z = 'zzz';
    var1 = { t: 'xxx' }

    const obj = {
      a: 'aaa',
      ...merge(
        var1,
      ),
    };
    `,
  },
  {
    title: 'throw when arg isn\'t an object',
    error: true,
    code: `
    import merge from './macro';

    const obj = {
      ...merge(
        'string',
        { a: 'b', },
      ),
    };
    `,
  },
  {
    title: 'throw when arg is a reference to a var that isn\'t an object',
    error: true,
    code: `
    import merge from './macro';
    // const string = 'string'
    const string = 'string';

    const obj = {
      ...merge(
        string,
        { a: 'b', },
      ),
    };
    `,
  },
  {
    title: 'Remove bound var when referenced more than once',
    code: `
    import merge from './macro';

    const var1 = { b: 'rrr', }
    const var2 = { c: 'this one', }

    const obj = {
      a: 'aaa',
      ...merge(
        { c: 'cccc', ...var2, },
        var1,
      ),
      ...merge(
        { sss: var2, }
      )
    };
    `,
    output: `
    const obj = {
      a: 'aaa',
      c: 'this one',
      b: 'rrr',
      sss: {
        c: 'this one',
      },
    };
    `,
  },
]);

// function fixture(...args: string[]) {
//   return path.join(__dirname, '__fixtures__', ...args);
// }
