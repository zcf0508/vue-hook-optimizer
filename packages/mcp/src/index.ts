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
    }
  },
  async ({ absolutePath, framework }) => {
    try {
      const code = await readFile(absolutePath, 'utf-8');
      const res = await analyze(code, framework);
  
      return {
        content: [{
          type: 'text',
          text: [
            '```mermaid',
            res.mermaid,
            '```',
            ...res.suggests.map(s => s.message),
          ].join('\n'),
        }],
      };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Something went wrong:', error.message);
      return {
        content: [{
          type: 'text',
          text: 'Error analyzing file',
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
