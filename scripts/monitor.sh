#!/bin/bash

# System Monitor Script
# Author: Claw (via Scott's instruction)
# Date: 2026-03-04

TELEGRAM_BOT_TOKEN="8587301280:AAEVDS5d2gS1bYwIak90AUq1pScc3zHFX2M"
TELEGRAM_CHAT_ID="7722253371"
CPU_THRESHOLD=80
INTERVAL_SEC=300 # 5 minutes

ALERT_LOG="/tmp/monitor_alerts.log"

# Function to send Telegram alert
send_telegram_alert() {
    local message="$1"
    curl -s --max-time 10 --retry 5 --data "chat_id=${TELEGRAM_CHAT_ID}&text=${message}" "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" > /dev/null
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Alert sent: ${message}" >> "$ALERT_LOG"
}

echo "System monitor started. Checking CPU and Memory every ${INTERVAL_SEC} seconds."
echo "$(date '+%Y-%m-%d %H:%M:%S') - Monitor started." >> "$ALERT_LOG"

while true; do
    # Get CPU usage
    # Extracts idle percentage and calculates usage
    CPU_IDLE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/")
    CPU_USAGE=$(echo "100 - $CPU_IDLE" | bc -l)

    # Get Memory usage
    # Extracts total, used, and free memory, calculates usage percentage
    MEM_INFO=$(free -m | grep Mem:)
    MEM_TOTAL=$(echo "$MEM_INFO" | awk '{print $2}')
    MEM_USED=$(echo "$MEM_INFO" | awk '{print $3}')
    MEM_USAGE=$(echo "( $MEM_USED * 100 ) / $MEM_TOTAL" | bc -l)

    # Check CPU threshold
    if (( $(echo "$CPU_USAGE > $CPU_THRESHOLD" | bc -l) )); then
        ALERT_MESSAGE="High CPU Alert: CPU usage is $(printf "%.2f" "$CPU_USAGE")% (Threshold: ${CPU_THRESHOLD}%). Memory usage is $(printf "%.2f" "$MEM_USAGE")%."
        send_telegram_alert "$ALERT_MESSAGE"
    fi

    # Optional: Check memory threshold here if needed
    # example: MEM_THRESHOLD=80
    # if (( $(echo "$MEM_USAGE > $MEM_THRESHOLD" | bc -l) )); then
    #     ALERT_MESSAGE="High Memory Alert: Memory usage is $(printf "%.2f" "$MEM_USAGE")% (Threshold: ${MEM_THRESHOLD}%). CPU usage is $(printf "%.2f" "$CPU_USAGE")%."
    #     send_telegram_alert "$ALERT_MESSAGE"
    # fi

    sleep $INTERVAL_SEC
done