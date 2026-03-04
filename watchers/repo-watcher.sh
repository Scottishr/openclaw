#!/usr/bin/env bash
# Repo watcher for Scottishr/openclaw
# Checks for new commits every 10 minutes and sends Telegram alerts.
# Requires env vars: GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
# Uses GitHub API to fetch latest commit SHA on default branch.

REPO_OWNER="Scottishr"
REPO_NAME="openclaw"
API_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits"
STATE_FILE="${HOME}/.claw_repo_watcher_state"

# Ensure required env vars are set
if [[ -z "$GITHUB_TOKEN" || -z "$TELEGRAM_BOT_TOKEN" || -z "$TELEGRAM_CHAT_ID" ]]; then
  echo "Missing required environment variables."
  exit 1
fi

# Function to send Telegram message
send_telegram() {
  local text="$1"
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d chat_id="$TELEGRAM_CHAT_ID" \
    -d "text=${text}" \
    -d parse_mode="Markdown"
}

while true; do
  # Fetch latest commit SHA
  latest_sha=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" "${API_URL}?per_page=1" | grep -m1 '"sha":' | head -1 | awk -F'"' '{print $4}')

  if [[ -z "$latest_sha" ]]; then
    echo "Failed to fetch latest commit SHA. Retrying..."
    sleep 60
    continue
  fi

  # Load previous SHA
  if [[ -f "$STATE_FILE" ]]; then
    prev_sha=$(cat "$STATE_FILE")
  else
    prev_sha=""
  fi

  if [[ "$latest_sha" != "$prev_sha" ]]; then
    # New commit detected
    if [[ -n "$prev_sha" ]]; then
      # Get commit details for message
      commit_info=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" "${API_URL}/${latest_sha}")
      author=$(echo "$commit_info" | grep -m1 '"name":' | awk -F'"' '{print $4}')
      message=$(echo "$commit_info" | grep -A1 '"message":' | tail -1 | sed 's/[\"\n]//g' | xargs)
      url=$(echo "$commit_info" | grep -m1 '"html_url":' | awk -F'"' '{print $4}')
      send_telegram "🚀 *New commit* in \`${REPO_OWNER}/${REPO_NAME}\`\n*Author:* ${author}\n*Message:* ${message}\n[View Commit](${url})"
    else
      # First run, just note initial state
      send_telegram "👀 Watching \`${REPO_OWNER}/${REPO_NAME}\`. Initial commit SHA recorded."
    fi
    # Update stored SHA
    echo "$latest_sha" > "$STATE_FILE"
  fi

  # Sleep 10 minutes
  sleep 600
done
