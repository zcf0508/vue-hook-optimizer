#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
  'Analyze your Vue component to help you refactor and optimize hook abstractions.',
  {
    filepath: z.string().regex(/\.vue$/),
  },
  async ({ filepath }) => {
    const code = await readFile(filepath, 'utf-8');
    const res = await analyze(code, 'vue');

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
