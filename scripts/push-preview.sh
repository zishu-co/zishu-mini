#!/bin/bash
# 用法: ./scripts/push-preview.sh '提交描述'
set -e
BRANCH=$(git rev-parse --abbrev-ref HEAD)
MSG="${1:-更新小程序}"
cd /root/zishu-mini
git checkout preview 2>/dev/null || git checkout -b preview
git merge "$BRANCH" -m "merge: $MSG"
git push origin preview
git checkout "$BRANCH"
echo "done - https://github.com/zishu-co/zishu-mini/actions"
