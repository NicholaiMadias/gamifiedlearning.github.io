name: Dual-Domain Health & Agent Sync

on:
  push:
    branches: [ "main" ]
  schedule:
    - cron: '0 * * * *' # Automated health check every hour
  workflow_dispatch: # Allows you to manually trigger a sync

jobs:
  health-and-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. Sync Agent Instructions to the Central Governance Dashboard
      - name: Sync Agent Rules
        run: |
          curl -X POST https://your-railway-app.up.railway.app/update-agent-logic \
          -H "Authorization: Bearer ${{ secrets.GOVERNANCE_TOKEN }}" \
          -F "instructions=@Agent.Instructions.pdf"

      # 2. Check the Arcade (GitHub Pages)
      - name: Arcade Health Check
        run: |
          status_code=$(curl -o /dev/null -s -w "%{http_code}" https://nicholai.org)
          if [ $status_code -ne 200 ]; then
            echo "Arcade (nicholai.org) is down! Status: $status_code"
            curl -X POST https://your-railway-app.up.railway.app/alert \
            -d '{"domain": "nicholai.org", "status": "down", "contact": "nicholaimadias@gmail.com"}'
            exit 1
          fi

      # 3. Check the Listings (Netlify)
      - name: Listings Health Check
        run: |
          status_code=$(curl -o /dev/null -s -w "%{http_code}" https://amazinggracehomeliving.com)
          if [ $status_code -ne 200 ]; then
            echo "Listings (Amazing Grace) is down! Status: $status_code"
            curl -X POST https://your-railway-app.up.railway.app/alert \
            -d '{"domain": "amazinggracehomeliving.com", "status": "down", "contact": "nicholaimadias@gmail.com"}'
            exit 1
          fi
