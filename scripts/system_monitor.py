
import psutil
import requests
import time
import os
import json
from datetime import datetime

# --- Configuration ---
CPU_THRESHOLD = 80.0  # Percentage
MEM_THRESHOLD = 90.0  # Percentage
CHECK_INTERVAL_SECONDS = 300 # 5 minutes
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID')
REPO_OWNER = os.environ.get('GITHUB_REPO_OWNER', 'Scottishr') # Default to Scottishr
REPO_NAME = os.environ.get('GITHUB_REPO_NAME', 'openclaw')     # Default to openclaw

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.monitor_state.json')
ERROR_LOG_FILE = os.path.expanduser('~/.openclaw/error-memory.json') # As per self-improvement rules

# --- Helper Functions ---
def send_telegram_alert(message):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("Telegram token or chat ID not set. Skipping alert.")
        return
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': TELEGRAM_CHAT_ID,
        'text': message,
        'parse_mode': 'Markdown'
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        print(f"Telegram alert sent successfully: {message[:50]}...")
    except requests.exceptions.RequestException as e:
        print(f"Error sending Telegram alert: {e}")
        log_error(e, 'telegram_alert', 'send_failed')


def log_error(error, context, error_type):
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'error': str(error),
        'context': context,
        'type': error_type,
        'details': os.environ.get('HOSTNAME', 'unknown_host') # Add hostname or other relevant context
    }
    try:
        if os.path.exists(ERROR_LOG_FILE):
            with open(ERROR_LOG_FILE, 'r') as f:
                log_data = json.load(f)
        else:
            log_data = []
        log_data.append(log_entry)
        # Keep log size manageable, e.g., last 100 errors
        log_data = log_data[-100:]
        with open(ERROR_LOG_FILE, 'w') as f:
            json.dump(log_data, f, indent=2)
    except Exception as e:
        print(f"Failed to write to error log: {e}")

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error decoding JSON from {STATE_FILE}. Resetting state.")
            return {'last_cpu': None, 'last_mem': None}
    return {'last_cpu': None, 'last_mem': None}

def save_state(state):
    try:
        with open(STATE_FILE, 'w') as f:
            json.dump(state, f, indent=2)
    except Exception as e:
        print(f"Error saving state: {e}")
        log_error(e, 'state_management', 'save_failed')

def check_system_load():
    try:
        cpu_usage = psutil.cpu_percent(interval=1) # Blocking call for 1 sec to get accurate reading
        mem_usage = psutil.virtual_memory().percent

        state = load_state()
        last_cpu = state.get('last_cpu')
        last_mem = state.get('last_mem')

        alerts = []
        if cpu_usage > CPU_THRESHOLD:
            alert_msg = f"🚨 *High CPU Usage* on Codespace: {cpu_usage:.1f}% (Threshold: {CPU_THRESHOLD}%)"
            alerts.append(alert_msg)
            print(alert_msg.replace('*', '')) # Also log to console
        if mem_usage > MEM_THRESHOLD:
            alert_msg = f"🚨 *High Memory Usage* on Codespace: {mem_usage:.1f}% (Threshold: {MEM_THRESHOLD}%)"
            alerts.append(alert_msg)
            print(alert_msg.replace('*', ''))

        if alerts:
            full_message = "\n".join(alerts)
            send_telegram_alert(full_message)
        
        state['last_cpu'] = cpu_usage
        state['last_mem'] = mem_usage
        save_state(state)

    except psutil.AccessDenied:
        error_msg = "Permission denied accessing process info. Ensure script has necessary permissions."
        print(error_msg)
        send_telegram_alert(f"🚨 *System Monitor Error*:\n{error_msg}")
        log_error(error_msg, 'system_load', 'access_denied')
        # Exit or retry after a delay if permissions are the issue
        return False # Indicate failure to proceed gracefully
    except Exception as e:
        error_msg = f"An error occurred during system check: {e}"
        print(error_msg)
        send_telegram_alert(f"🚨 *System Monitor Error*:\n{error_msg}")
        log_error(e, 'system_load', 'runtime_error')
        return False # Indicate failure
    return True # Indicate success

def monitor_github_activity():
    # This is a placeholder. A real implementation would poll GitHub API for changes.
    # For simplicity, this version focuses only on system load.
    # To implement GitHub monitoring, we'd need to: 
    # 1. Fetch last commit SHA from GH API (using GITHUB_TOKEN).
    # 2. Compare with a stored SHA from previous check.
    # 3. Alert if different.
    # Additional checks for PRs, CI status would require more complex API calls.
    print("GitHub activity monitoring is a placeholder. Focusing on system load.")
    # send_telegram_alert(f"*GitHub Activity Check:* (Placeholder - no changes detected or check skipped)")
    pass

# --- Main Loop ---
def main():
    print(f"System monitor started. Checking every {CHECK_INTERVAL_SECONDS} seconds.")
    print(f"CPU Threshold: {CPU_THRESHOLD}%, Memory Threshold: {MEM_THRESHOLD}%")
    print(f"Targets: GitHub ({REPO_OWNER}/{REPO_NAME}), Telegram alerted on threshold breaches.")

    while True:
        if not check_system_load():
            # If system check failed critically (e.g., permissions), stop or wait longer
            print("Critical error in system load check. Pausing for 10 minutes before retry.")
            time.sleep(600) # Wait longer before retrying critical failure
            continue
        
        # Placeholder call for GitHub monitoring - uncomment and implement fully if needed.
        # monitor_github_activity()

        print(f"Waiting {CHECK_INTERVAL_SECONDS} seconds until next check...")
        time.sleep(CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSystem monitor stopped by user.")
    except Exception as e:
        print(f"Fatal error in main loop: {e}")
        log_error(e, 'main_loop', 'fatal_error')
        sys.exit(1)
