
#!/usr/bin/env bash

# Kill any process listening on the specified ports.
kill_port_processes() {
    local port="$1"
    local pids

    pids=$(netstat -ano 2>/dev/null |
        awk -v port=":$port" '$2 ~ port"$" && $4 == "LISTENING" { print $5 }' |
        sort -u)

    if [[ -z "$pids" ]]; then
        echo "No process listening on port $port."
        return 0
    fi

    while IFS= read -r pid; do
        [[ "$pid" =~ ^[0-9]+$ ]] || continue

        echo "Killing PID $pid on port $port..."
        taskkill //PID "$pid" //F
    done <<< "$pids"
}

for port in 3001 3000; do
    kill_port_processes "$port"
done
