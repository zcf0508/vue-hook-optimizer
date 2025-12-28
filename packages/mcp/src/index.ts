#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { version } from '../package.json';
import { analyze } from './analyze';

const server = new McpServer(
  {
    name: 'vue-hook-optimizer',
    version,
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.registerTool(
  'analyze',
  {
    title: 'Analyze',
    description: 'Analyze your component to assist in refactoring and optimizing hook abstractions. Requires 2 parameters: `absolutePath` (the file\'s absolute path) and `framework` (the project\'s framework, with optional values vue / react default vue).',
    inputSchema: {
      absolutePath: z.string(),
      framework: z.enum(['vue', 'react']).optional().default('vue'),
    },
  },
  async ({ absolutePath, framework }) => {
    try {
      const code = await readFile(absolutePath, 'utf-8');
      const res = await analyze(code, framework);

      const communitySection = res.communities.length > 0
        ? [
            '',
            '## Variable Communities',
            'The following groups of variables are tightly coupled and can potentially be extracted together:',
            '',
            ...res.communities.map((c) => {
              const memberList = c.members
                .map(m => `  - \`${m.name}\` (${m.type === 'fun' ? 'function' : 'variable'}${m.line !== undefined ? `, line ${m.line + 1}` : ''})`)
                .join('\n');
              return `### Community ${c.id + 1} (${c.size} members)\n${memberList}`;
            }),
            '',
          ]
        : [];

      return {
        content: [{
          type: 'text',
          text: [
            '## Dependency Graph',
            '```mermaid',
            res.mermaid,
            '```',
            '',
            '## Suggestions',
            ...res.suggests.map(s => `- ${s.message}`),
            ...communitySection,
          ].join('\n'),
        }],
      };
    }
    catch (error: unknown) {
      const errorMessage = (error as Error)?.message ?? 'Get error message failed.';
      console.error('Something went wrong:', errorMessage);
      return {
        content: [{
          type: 'text',
          text: `Error analyzing file: ${errorMessage}`,
        }],
      };
    }
  },
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
