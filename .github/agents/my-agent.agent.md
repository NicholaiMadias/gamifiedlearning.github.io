---
# Fill in the fields below to create a basic custom agent for your repository.
# The Copilot CLI can be used for local testing: https://gh.io/customagents/cli
# To make this agent available, merge this file into the default repository branch.
# For format details, see: https://gh.io/customagents/config

name: Validator 
description:.github/workflows/cname-validation.yml

---

# My Agent

name: CNAME Validation (Auto‑PR Missing Cases)

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  validate-cname:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Determine expected CNAME
        id: cname
        run: |
          REPO="${{ github.repository }}"
          EXPECTED=""

          case "$REPO" in
            "NicholaiMadias/gamifiedlearning.github.io")
              EXPECTED="gamifiedlearning.org"
              ;;
            "NicholaiMadias/amazinggracehomeliving.github.io")
              EXPECTED="amazinggracehomeliving.com"
              ;;
            *)
              echo "No case arm exists for repo: $REPO"
              echo "EXPECTED=" >> $GITHUB_OUTPUT
              exit 0   # Skip validation instead of failing
              ;;
          esac

          echo "EXPECTED=$EXPECTED" >> $GITHUB_OUTPUT

      - name: Skip validation if EXPECTED is empty
        if: ${{ steps.cname.outputs.EXPECTED == '' }}
        run: |
          echo "Skipping validation because no EXPECTED CNAME is configured."
          echo "A PR will be created to add the missing case arm."

      - name: Validate CNAME file
        if: ${{ steps.cname.outputs.EXPECTED != '' }}
        run: |
          EXPECTED="${{ steps.cname.outputs.EXPECTED }}"

          if [ ! -f CNAME ]; then
            echo "CNAME file missing — skipping validation."
            exit 0
          fi

          ACTUAL=$(cat CNAME | tr -d '\n\r')

          if [ "$ACTUAL" != "$EXPECTED" ]; then
            echo "CNAME mismatch."
            echo "Expected: $EXPECTED"
            echo "Actual:   $ACTUAL"
            exit 1
          fi

          echo "CNAME validation passed."

      - name: Auto‑PR missing case arm
        if: ${{ steps.cname.outputs.EXPECTED == '' }}
        run: |
          BRANCH="add-cname-case-${{ github.run_id }}"
          FILE=".github/workflows/cname-validation.yml"

          git checkout -b "$BRANCH"

          # Insert new case arm automatically
          sed -i "/case \"\\\$REPO\" in/a \ \ \ \ \"${{ github.repository }}\")\n \ \ \ \ \ \ EXPECTED=\"$(cat CNAME 2>/dev/null || echo 'ADD_DOMAIN_HERE')\"\n \ \ \ \ \ \ ;;\n" "$FILE"

          git config user.name "github-actions"
          git config user.email "github-actions@github.com"

          git add "$FILE"
          git commit -m "Add missing CNAME case arm for ${{ github.repository }}"
          git push origin "$BRANCH"

          gh pr create \
            --title "Add missing CNAME case arm for ${{ github.repository }}" \
            --body "This PR was automatically generated because no case arm existed for this repository in the CNAME validation workflow." \
            --base main \
            --head "$BRANCH"

Describe what your agent does here.
