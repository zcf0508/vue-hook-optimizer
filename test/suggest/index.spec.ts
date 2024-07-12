import { readFileSync } from 'node:fs';
import { analyzeSetupScript, analyzeStyle, analyzeTemplate, gen, parse } from '@/index';

const testFile = './fixtures/vue/setup-block.vue';

describe('suggest gen', () => {
  const source = readFileSync(testFile, 'utf-8');
  const sfc = parse(source);
  it('base', () => {
    const graph = analyzeSetupScript(
      sfc.descriptor.scriptSetup?.content || '',
      (sfc.descriptor.scriptSetup?.loc.start.line || 1) - 1,
    );

    const nodesUsedInStyle = analyzeStyle(sfc.descriptor.styles || []);

    const nodesUsedInTemplate = sfc.descriptor.template?.content
      ? analyzeTemplate(sfc.descriptor.template!.content)
      : new Set<string>();

    expect(gen(graph, nodesUsedInTemplate, nodesUsedInStyle)).toMatchInlineSnapshot(`
      [
        {
          "message": "Nodes [eee5,ddd4] are not used, perhaps you can remove them.",
          "nodeInfo": [
            {
              "info": {
                "column": 6,
                "line": 89,
              },
              "label": "eee5",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "line": 88,
              },
              "label": "ddd4",
              "type": "var",
            },
          ],
          "type": "info",
        },
        {
          "message": "Nodes [route,path,lmsg] are isolated, perhaps you can refactor them to an isolated file.",
          "nodeInfo": [
            {
              "info": {
                "column": 6,
                "comment": "route",
                "line": 9,
              },
              "label": "route",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "comment": "path",
                "line": 11,
                "used": Set {
                  "watch",
                },
              },
              "label": "path",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "line": 13,
                "used": Set {
                  "watch",
                },
              },
              "label": "lmsg",
              "type": "var",
            },
          ],
          "type": "info",
        },
        {
          "message": "Nodes [add2222,add1111,add333,add4444] are isolated, perhaps you can refactor them to an isolated file.",
          "nodeInfo": [
            {
              "info": {
                "column": 9,
                "line": 93,
              },
              "label": "add2222",
              "type": "fun",
            },
            {
              "info": {
                "column": 6,
                "line": 91,
              },
              "label": "add1111",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "line": 97,
              },
              "label": "add333",
              "type": "fun",
            },
            {
              "info": {
                "column": 6,
                "line": 101,
              },
              "label": "add4444",
              "type": "fun",
            },
          ],
          "type": "info",
        },
        {
          "message": "Nodes [varB2,varB,funA,ddd,varE,funC,bbb2,aaa1,cc333,updateBBB...(11)] are isolated, perhaps you can refactor them to an isolated file.",
          "nodeInfo": [
            {
              "info": {
                "column": 6,
                "line": 47,
              },
              "label": "varB2",
              "type": "var",
            },
            {
              "info": {
                "column": 8,
                "line": 45,
              },
              "label": "varB",
              "type": "var",
            },
            {
              "info": {
                "column": 9,
                "line": 38,
              },
              "label": "funA",
              "type": "fun",
            },
            {
              "info": {
                "column": 6,
                "line": 49,
              },
              "label": "ddd",
              "type": "var",
            },
            {
              "info": {
                "column": 14,
                "line": 61,
              },
              "label": "varE",
              "type": "var",
            },
            {
              "info": {
                "column": 9,
                "comment": "这是注释",
                "line": 54,
                "used": Set {
                  "onMounted",
                  "provide",
                },
              },
              "label": "funC",
              "type": "fun",
            },
            {
              "info": {
                "column": 6,
                "line": 78,
              },
              "label": "bbb2",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "line": 76,
              },
              "label": "aaa1",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "line": 80,
              },
              "label": "cc333",
              "type": "var",
            },
            {
              "info": {
                "column": 6,
                "line": 82,
              },
              "label": "updateBBB",
              "type": "fun",
            },
            {
              "info": {
                "column": 8,
                "line": 61,
              },
              "label": "varD",
              "type": "var",
            },
          ],
          "type": "info",
        },
        {
          "message": "There is a loop call in nodes [funC], perhaps you can refactor it.",
          "nodeInfo": [
            {
              "info": {
                "column": 9,
                "comment": "这是注释",
                "line": 54,
                "used": Set {
                  "onMounted",
                  "provide",
                },
              },
              "label": "funC",
              "type": "fun",
            },
          ],
          "type": "error",
        },
        {
          "message": "Nodes [varB2,varB] are have function chain calls, perhaps you can refactor it.",
          "nodeInfo": [
            {
              "info": {
                "column": 6,
                "line": 47,
              },
              "label": "varB2",
              "type": "var",
            },
            {
              "info": {
                "column": 8,
                "line": 45,
              },
              "label": "varB",
              "type": "var",
            },
          ],
          "type": "warning",
        },
        {
          "message": "Node [restArr] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 10,
              "line": 27,
            },
            "label": "restArr",
            "type": "var",
          },
          "type": "info",
        },
        {
          "message": "Node [restObj] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 11,
              "line": 28,
            },
            "label": "restObj",
            "type": "var",
          },
          "type": "info",
        },
        {
          "message": "Node [varB2] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 6,
              "line": 47,
            },
            "label": "varB2",
            "type": "var",
          },
          "type": "info",
        },
        {
          "message": "Node [varD] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 8,
              "line": 61,
            },
            "label": "varD",
            "type": "var",
          },
          "type": "info",
        },
        {
          "message": "Node [varE] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 14,
              "line": 61,
            },
            "label": "varE",
            "type": "var",
          },
          "type": "info",
        },
        {
          "message": "Node [setUserinfo] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 17,
              "line": 73,
            },
            "label": "setUserinfo",
            "type": "var",
          },
          "type": "info",
        },
        {
          "message": "Node [updateBBB] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 6,
              "line": 82,
            },
            "label": "updateBBB",
            "type": "fun",
          },
          "type": "info",
        },
        {
          "message": "Node [eee5] is not used, perhaps you can remove it.",
          "nodeInfo": {
            "info": {
              "column": 6,
              "line": 89,
            },
            "label": "eee5",
            "type": "var",
          },
          "type": "info",
        },
      ]
    `);
  });
});
