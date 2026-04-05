#!/bin/bash
export PATH="/Users/serkankalmaz/.nvm/versions/node/v22.22.0/bin:$PATH"
cd /Users/serkankalmaz/Desktop/santiye-depo
node import-cikis.cjs > /tmp/import-result.txt 2>&1
echo "EXIT: $?" >> /tmp/import-result.txt
