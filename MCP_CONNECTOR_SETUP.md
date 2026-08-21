# PrioryxAI Model Context Protocol (MCP) Connector Setup

PrioryxAI exposes a fully compliant **Model Context Protocol (MCP) JSON-RPC 2.0 endpoint** that allows external AI assistants (such as Claude Desktop, Cursor, or custom agents) to query student profiles, run multi-agent career reasoning, generate ATS-ready resumes, fetch GitHub analytics, and more.

---

## 1. Authentication & Generating an API Token

To connect to PrioryxAI from an external client:

1. Log into PrioryxAI in your browser.
2. Send an authenticated request to `/api/mcp/token` to generate your personal MCP access token:

```bash
curl -X POST https://your-domain.com/api/mcp/token \
  -H "Cookie: <your-session-cookie>"
```

**Response:**
```json
{
  "token": "pryx_abcdef1234567890...",
  "created_at": "2026-08-21T06:00:00.000Z"
}
```

> **Security Note**: Keep your `pryx_` token secret. All actions executed through this token run under your user permissions.

---

## 2. Configuring Claude Desktop or External MCP Clients

Add PrioryxAI as a custom HTTP/SSE server in your MCP client configuration (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "prioryx-ai": {
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer pryx_your_token_here",
        "Content-Type": "application/json"
      }
    }
  }
}
```

---

## 3. Protocol Specification & API Usage

PrioryxAI supports standard JSON-RPC 2.0 over HTTP `POST /api/mcp`.

### A. Discover Available Tools (`tools/list`)

**Request:**
```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Authorization: Bearer pryx_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "resume.autodraftFromProfile",
        "description": "Draft ATS-optimised resume bullets and portfolio summary from user profile data",
        "inputSchema": { "type": "object", "properties": {} }
      },
      {
        "name": "github.analyzeRepositoryCommits",
        "description": "Analyzes the latest commits of a specific repository to determine quality, strengths, weaknesses, and priority actions.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "repo_name": { "type": "string" },
            "github_username": { "type": "string" }
          },
          "required": ["repo_name", "github_username"]
        }
      },
      {
        "name": "ai.conductMockInterview",
        "description": "Conduct a dynamic mock technical interview",
        "inputSchema": { ... }
      },
      {
        "name": "research.fetchLeetCodeProfile",
        "description": "Fetch real-time LeetCode problem breakdown and rating",
        "inputSchema": { ... }
      }
    ]
  }
}
```

---

### B. Execute a Tool (`tools/call`)

**Request:**
```bash
curl -X POST https://your-domain.com/api/mcp \
  -H "Authorization: Bearer pryx_your_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "resume.autodraftFromProfile",
      "arguments": {}
    }
  }'
```

---

## 4. Revoking Tokens

To revoke your active token at any time:

```bash
curl -X DELETE https://your-domain.com/api/mcp/token \
  -H "Cookie: <your-session-cookie>"
```
