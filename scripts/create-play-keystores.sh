#!/usr/bin/env bash
# Generate Play upload keystores for parent + driver apps.
# Back up android/upload-keystore.jks AND android/upload-keystore-credentials.txt
# If you lose them, you cannot update the Play listing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VALIDITY_DAYS=10000
DNAME="CN=SchoolMove, OU=Mobile, O=SchoolMove, L=Bengaluru, ST=Karnataka, C=IN"

create_for() {
  local app_dir="$1"
  local android="$ROOT/$app_dir/android"
  local jks="$android/upload-keystore.jks"
  local creds="$android/upload-keystore-credentials.txt"
  local keyprops="$android/key.properties"

  mkdir -p "$android"
  if [[ -f "$jks" ]]; then
    echo "Skip $app_dir — keystore already exists: $jks"
    return
  fi

  local pass
  pass="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"

  keytool -genkeypair -v \
    -keystore "$jks" \
    -storetype JKS \
    -keyalg RSA \
    -keysize 2048 \
    -validity "$VALIDITY_DAYS" \
    -alias upload \
    -storepass "$pass" \
    -keypass "$pass" \
    -dname "$DNAME"

  {
    echo "IMPORTANT: Keep this file and upload-keystore.jks in a secure backup."
    echo "If lost, you cannot publish updates to this Play app."
    echo
    echo "storeFile=upload-keystore.jks"
    echo "storePassword=$pass"
    echo "keyAlias=upload"
    echo "keyPassword=$pass"
    echo
    echo "SHA-1 (add to Google Maps Android key restriction):"
    keytool -list -v -keystore "$jks" -alias upload -storepass "$pass" | grep SHA1
  } > "$creds"

  if [[ -f "$keyprops" ]]; then
    grep -q '^storeFile=' "$keyprops" || {
      echo "" >> "$keyprops"
      echo "storeFile=upload-keystore.jks" >> "$keyprops"
      echo "storePassword=$pass" >> "$keyprops"
      echo "keyAlias=upload" >> "$keyprops"
      echo "keyPassword=$pass" >> "$keyprops"
    }
  else
    cat > "$keyprops" <<EOF
storeFile=upload-keystore.jks
storePassword=$pass
keyAlias=upload
keyPassword=$pass
EOF
  fi

  echo "Created $jks"
  echo "Credentials: $creds"
}

create_for parent_app
create_for driver_app
echo "Done. Back up both .jks files and upload-keystore-credentials.txt now."
