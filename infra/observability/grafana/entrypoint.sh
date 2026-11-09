#!/bin/sh
set -eu

chat_id="${TELEGRAM_CHAT_ID:-0}"
case "$chat_id" in
  -*) digits=${chat_id#-} ;;
  *) digits=$chat_id ;;
esac

case "$digits" in
  ''|*[!0-9]*)
    echo "TELEGRAM_CHAT_ID must be a numeric Telegram chat ID" >&2
    exit 1
    ;;
esac

source_dir=/etc/grafana/provisioning-source
target_dir=/tmp/homescope-provisioning
rm -rf "$target_dir"
mkdir -p "$target_dir"
cp -R "$source_dir"/. "$target_dir"/

contact_points="$target_dir/alerting/contact-points.yml"
sed "s/__HOMESCOPE_TELEGRAM_CHAT_ID__/$chat_id/g" "$contact_points" > "$contact_points.tmp"
mv "$contact_points.tmp" "$contact_points"

exec /run.sh
