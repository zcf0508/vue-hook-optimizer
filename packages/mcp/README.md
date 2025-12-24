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

## Using the Refactor Skills

- Files:
  - `packages/mcp/refactor_prompt_zh.md` (Chinese Skill)
  - `packages/mcp/refactor_prompt_en.md` (English Skill)
- Both files already include valid Skill YAML frontmatter (`name`, `description`) and detailed instructions.
- Setup (choose one):
  - Personal Skills: copy each file’s content to `~/.claude/skills/<skill-name>/SKILL.md`
  - Project Skills: copy to `.claude/skills/<skill-name>/SKILL.md` within your project
  - Example:
    - `~/.claude/skills/vho-refactor-zh/SKILL.md` → content from `refactor_prompt_zh.md`
    - `~/.claude/skills/vho-refactor-en/SKILL.md` → content from `refactor_prompt_en.md`
- Workflow:
  - Ensure the `vue-hook-optimizer` MCP server is connected (as above)
  - Invoke the Skill; it will instruct the agent to call the MCP tool `analyze`:
    - Input:
      - `absolutePath`: absolute path to the component file
      - `framework`: `vue` or `react` (default `vue`)
    - Output:
      - `mermaid` diagram (dependency graph)
      - Optimization suggestions (articulation points, isolated groups, chain calls, cycles)
  - Follow the Skill’s decision framework to refactor
  - Re-run `analyze` after changes to validate (structure/design/quality/business checks)

## License

MIT
