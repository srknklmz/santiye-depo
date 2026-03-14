#!/bin/bash

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT="shintea-dc091"
DIST_DIR="./dist"

echo -e "${BLUE}🚀 Firebase Hosting Deploy Başlatılıyor...${NC}"
echo -e "${BLUE}Proje: ${PROJECT}${NC}\n"

# 1. Dependencies kontrol
echo -e "${YELLOW}1️⃣ Dependencies kontrol ediliyor...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   npm install çalıştırılıyor...${NC}"
    npm install
fi

# 2. Build
echo -e "\n${YELLOW}2️⃣ Build yapılıyor...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build başarısız!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build tamamlandı${NC}"

# 3. Deploy
echo -e "\n${YELLOW}3️⃣ Firebase'e deploy ediliyor...${NC}"

# Firebase CLI'ı bul
if command -v firebase &> /dev/null; then
    FIREBASE_CMD="firebase"
elif [ -f "node_modules/.bin/firebase" ]; then
    FIREBASE_CMD="./node_modules/.bin/firebase"
else
    echo -e "${RED}❌ Firebase CLI bulunamadı!${NC}"
    echo -e "${YELLOW}   npm install -g firebase-tools${NC}"
    exit 1
fi

# Deploy et
$FIREBASE_CMD deploy --project $PROJECT --only hosting

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Deploy başarılı!${NC}"
    echo -e "${GREEN}🌐 Site: https://${PROJECT}.web.app${NC}\n"
else
    echo -e "\n${RED}❌ Deploy başarısız!${NC}"
    echo -e "${YELLOW}Firebase CLI'ya giriş yap:${NC}"
    echo -e "${YELLOW}   firebase login${NC}"
    exit 1
fi
