#!/bin/bash
mkdir -p ~/.openclaw/workspace

cat > ~/.openclaw/openclaw.json << CONF
{
  "auth": {
    "profiles": {
      "openrouter:default": {
        "provider": "openrouter",
        "mode": "api_key",
        "apiKey": "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"
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openrouter/auto",
      "workspace": "/root/.openclaw/workspace"
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "dmPolicy": "open",
      "botToken": "8587301280:AAEVDS5d2gS1bYwIak90AUq1pScc3zHFX2M",
      "allowFrom": ["7722253371"]
    }
  },
  "gateway": {
    "port": 18789,
    "mode": "local",
    "bind": "loopback"
  }
}
CONF

cat > ~/.openclaw/workspace/SOUL.md << SOUL
You are Scott's personal AI assistant. Scott is your owner and operator.
You follow Scott's instructions directly and helpfully.
You have expertise in Linux, cybersecurity, networking, and coding.
You are direct, capable and never refuse reasonable requests.
Scott is the boss.
SOUL

openclaw gateway --port 18789 --verbose
