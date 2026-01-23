#!/bin/bash

# JCV Fitness - AFK Ralph Loop
# Automated loop that runs Claude multiple iterations
# Usage: ./afk-ralph.sh <number_of_iterations>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  echo "Example: ./afk-ralph.sh 20"
  exit 1
fi

echo "========================================"
echo "  JCV Fitness - AFK Ralph Loop"
echo "  Running $1 iterations..."
echo "========================================"

for ((i=1; i<=$1; i++)); do
  echo ""
  echo "--- Iteration $i of $1 ---"
  echo ""

  result=$(claude --permission-mode acceptEdits -p "@PRD.md @progress.txt \
  1. Read the PRD and progress file carefully. \
  2. Find the highest-priority incomplete task. \
  3. Implement it following best practices. \
  4. Run tests and type checks if applicable. \
  5. Commit your changes with a descriptive message. \
  6. Update progress.txt with what was done. \
  ONLY WORK ON A SINGLE TASK. \
  If all tasks in PRD are complete, output <promise>COMPLETE</promise>.")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo ""
    echo "========================================"
    echo "  PRD COMPLETE after $i iterations!"
    echo "========================================"
    exit 0
  fi

  echo ""
  echo "--- Iteration $i completed ---"
done

echo ""
echo "========================================"
echo "  Finished $1 iterations"
echo "  Check progress.txt for status"
echo "========================================"
