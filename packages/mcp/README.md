# Vue Hook Optimizer MCP Server

Node.js server implementing Model Context Protocol (MCP) for analyzing and optimizing Vue component hooks.

## Features

- Generate Mermaid diagrams for analyze Vue component hooks and their relationships
- Provide optimization suggestions
- Support for `.vue` files

## API

### Tools

- **analyze**
  - Analyze Vue component hooks and provide optimization suggestions
  - Input:
    - `filepath` (string): Path to `.vue` file
  - Returns:
    - Mermaid diagram showing hook relationships
    - List of optimization suggestions

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vho": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-vue-hook-optimizer"
      ]
    }
  }
}
```

## License

MIT
