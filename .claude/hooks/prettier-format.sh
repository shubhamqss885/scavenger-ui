#!/bin/bash
# Runs prettier on files after Write/Edit tool calls

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format files prettier understands
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md|*.html)
    npx prettier --write --plugin prettier-plugin-tailwindcss "$FILE_PATH" 2>/dev/null
    ;;
esac

exit 0
