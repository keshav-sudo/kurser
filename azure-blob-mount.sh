#!/bin/bash

# Script to mount Azure Blob Storage container to local filesystem
# This allows Nginx to serve files directly from Azure Blob

echo "🔧 Azure Blob Storage Mount Setup"
echo "=================================="

# Check if blobfuse2 is installed
if ! command -v blobfuse2 &> /dev/null; then
    echo "❌ blobfuse2 not found. Installing..."
    
    # Install blobfuse2 (Ubuntu/Debian)
    wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    sudo apt-get update
    sudo apt-get install -y blobfuse2
    
    echo "✅ blobfuse2 installed"
fi

# Configuration
STORAGE_ACCOUNT_NAME="${AZURE_STORAGE_ACCOUNT_NAME:-yourstorageaccount}"
STORAGE_ACCOUNT_KEY="${AZURE_STORAGE_ACCOUNT_KEY:-your-key-here}"
CONTAINER_NAME="deployments"
MOUNT_POINT="/mnt/azure-blob/deployments"
TEMP_PATH="/mnt/blobfusetmp"

# Create mount point and temp directory
echo "📁 Creating directories..."
sudo mkdir -p "$MOUNT_POINT"
sudo mkdir -p "$TEMP_PATH"
sudo chmod 755 "$MOUNT_POINT"
sudo chmod 755 "$TEMP_PATH"

# Create blobfuse2 config file
CONFIG_FILE="/etc/blobfuse2.yaml"
echo "📝 Creating config file: $CONFIG_FILE"

sudo tee "$CONFIG_FILE" > /dev/null <<EOF
# Blobfuse2 configuration for multi-deploy system
allow-other: true

logging:
  type: syslog
  level: log_warning

components:
  - libfuse
  - file_cache
  - attr_cache
  - azstorage

libfuse:
  attribute-expiration-sec: 120
  entry-expiration-sec: 120
  negative-entry-expiration-sec: 240

file_cache:
  path: $TEMP_PATH
  timeout-sec: 120
  max-size-mb: 10240

attr_cache:
  timeout-sec: 7200

azstorage:
  type: block
  account-name: $STORAGE_ACCOUNT_NAME
  account-key: $STORAGE_ACCOUNT_KEY
  endpoint: https://$STORAGE_ACCOUNT_NAME.blob.core.windows.net
  mode: key
  container: $CONTAINER_NAME
EOF

echo "✅ Config file created"

# Mount the blob container
echo "🔗 Mounting Azure Blob container..."
sudo blobfuse2 mount "$MOUNT_POINT" --config-file="$CONFIG_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Azure Blob mounted successfully at: $MOUNT_POINT"
    
    # Test the mount
    echo ""
    echo "📂 Testing mount..."
    ls -la "$MOUNT_POINT"
    
    echo ""
    echo "✅ Mount successful! Files are accessible at: $MOUNT_POINT"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Update Nginx config with correct mount path"
    echo "   2. Deploy your first project"
    echo "   3. Create symlink for 'latest' deployment"
else
    echo "❌ Mount failed. Please check:"
    echo "   - Storage account name and key are correct"
    echo "   - Container '$CONTAINER_NAME' exists"
    echo "   - Network connectivity to Azure"
fi

# Add to fstab for automatic mounting on boot
echo ""
echo "🔄 To mount automatically on boot, add to /etc/fstab:"
echo "blobfuse2 $MOUNT_POINT fuse _netdev,allow_other,config_file=$CONFIG_FILE 0 0"
