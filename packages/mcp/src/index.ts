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

server.tool(
  'analyze',
  'Analyze your component to help you refactor and optimize hook abstractions.',
  {
    filepath: z.string(),
    framework: z.enum(['vue', 'react']).optional().default('vue'),
  },
  async ({ filepath, framework }) => {
    const code = await readFile(filepath, 'utf-8');
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
