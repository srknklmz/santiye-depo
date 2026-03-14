#!/bin/bash
set -e

PROJECT_ID="shintea-dc091"
DIST_DIR="./dist"

echo "🚀 Firebase Hosting'e deploy ediliyor..."
echo "Project: $PROJECT_ID"
echo "---"

# Eğer firebase CLI varsa onu kullan
if command -v firebase &> /dev/null; then
    echo "Firebase CLI bulundu, kullanılıyor..."
    firebase deploy --project "$PROJECT_ID" --only hosting
elif [ -f "node_modules/.bin/firebase" ]; then
    echo "Local firebase-tools bulundu, kullanılıyor..."
    node_modules/.bin/firebase deploy --project "$PROJECT_ID" --only hosting
else
    echo "❌ Firebase CLI bulunamadı!"
    echo "Lütfen şunu çalıştır:"
    echo "  npm install -g firebase-tools"
    echo "  firebase login"
    echo "  firebase deploy --project $PROJECT_ID"
    exit 1
fi

echo "✓ Deploy tamamlandı!"
echo "Site: https://$PROJECT_ID.web.app"
