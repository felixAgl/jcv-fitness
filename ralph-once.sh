#!/bin/bash

# JCV Fitness - Ralph Once (Human-in-the-loop)
# Run this script to execute ONE task at a time
# Watch what Claude does, check the commit, then run again

claude --permission-mode acceptEdits "@PRD.md @progress.txt \
1. Read the PRD and progress file. \
2. Find the next incomplete task and implement it. \
3. Run tests/type checks if applicable. \
4. Commit your changes with a descriptive message. \
5. Update progress.txt with what you did. \
ONLY DO ONE TASK AT A TIME. \
Focus on quality over speed."
