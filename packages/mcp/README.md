# Vue Hook Optimizer MCP Server

Node.js server implementing Model Context Protocol (MCP) for analyzing and optimizing Vue component hooks.

## Features

- Generate Mermaid diagrams for analyze Vue component hooks and their relationships
- Provide optimization suggestions
- Support for `vue` and `react`

## API

### Tools

- **analyze**
  - Analyze Vue component hooks and provide optimization suggestions
  - Input:
    - `filepath` (string): Path to component file
    - `framework` (string): `vue` or `react`
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

## Using the Refactor Skill

- File: `packages/mcp/SKILL.md`
- The file includes valid Skill YAML frontmatter (`name`, `description`, `when_to_use`) and a decision framework for refactoring.
- Setup (choose one):
  - Personal Skills: copy to `~/.claude/skills/vho-refactor/SKILL.md`
  - Project Skills: copy to `.claude/skills/vho-refactor/SKILL.md` within your project
- Workflow:
  - Ensure the `vue-hook-optimizer` MCP server is connected (as above)
  - Invoke the Skill; it will instruct the agent to call the MCP tool `analyze`:
    - Input:
      - `absolutePath`: absolute path to the component file
      - `framework`: `vue` or `react` (default `vue`)
    - Output:
      - `mermaid` diagram (dependency graph)
      - Optimization suggestions (articulation points, isolated groups, chain calls, cycles)
      - Variable communities
  - Follow the Skill's decision framework to refactor
  - Re-run `analyze` after changes to validate

## Add MCP to Claude Code (CLI)

- macOS/Linux:
  - Add server:
    - `claude mcp add --transport stdio vho -- npx -y mcp-server-vue-hook-optimizer`
  - Verify:
    - `claude mcp list`
  - Remove:
    - `claude mcp remove vho`
- Windows (native, not WSL):
  - Use `cmd /c` wrapper:
    - `claude mcp add --transport stdio vho -- cmd /c npx -y mcp-server-vue-hook-optimizer`
  - Then verify/remove as above

## License

MIT
