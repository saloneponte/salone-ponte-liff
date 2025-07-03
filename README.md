# Salone Ponte - LIFF予約システム

## 概要
LINE LIFF（LINE Front-end Framework）を使用したサロン予約システムです。

## プロジェクト構造
```
salone-ponte-liff/
├── index.html                  # プロジェクトナビゲーション
├── package.json               # Node.js設定
├── README.md                  # このファイル
├── firebase.json              # Firebase設定
├── src/
│   ├── pages/                 # HTMLページ
│   │   ├── index.html         # LIFF予約システム
│   │   ├── dashboard.html     # 管理ダッシュボード
│   │   ├── customer-management.html
│   │   ├── menu.html
│   │   ├── staff.html
│   │   └── confirm.html
│   ├── components/            # 再利用可能なコンポーネント
│   ├── styles/                # CSSファイル
│   ├── utils/                 # ユーティリティ関数
│   ├── assets/                # 画像・静的ファイル
│   ├── sw.js                  # Service Worker
│   └── manifest.json          # PWA設定
└── functions/                 # Firebase Cloud Functions
    ├── index.js
    ├── package.json
    └── node_modules/
```

## セットアップ

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動

#### プロジェクトナビゲーション（推奨）
```bash
npm run dev
# http://localhost:3000 でアクセス
```

#### LIFF予約システム単体
```bash
npm run dev:liff
# http://localhost:3001 でアクセス
```

#### 管理ダッシュボード単体
```bash
npm run dev:dashboard
# http://localhost:3002 でアクセス
```

## 利用可能なスクリプト

| スクリプト | 説明 |
|-----------|------|
| `npm run dev` | プロジェクトナビゲーション開発サーバー起動 |
| `npm run dev:liff` | LIFF予約システム開発サーバー起動 |
| `npm run dev:dashboard` | 管理ダッシュボード開発サーバー起動 |
| `npm run build` | 本番用ビルド |
| `npm run preview` | ビルド済みファイルのプレビュー |
| `npm run clean` | ビルドファイルの削除 |

## 技術スタック
- **フロントエンド**: HTML, CSS, JavaScript
- **バックエンド**: Firebase Firestore
- **認証**: LINE LIFF
- **ホスティング**: Firebase Hosting
- **開発ツール**: npm, serve

## 機能
- LINE経由での予約受付
- メニュー選択
- スタッフ選択
- 日時選択
- 顧客管理
- 予約管理
- 売上分析

## 開発環境
- Node.js >= 16.0.0
- npm >= 8.0.0

## Firebase設定
Firebase Console で以下を設定してください：
1. Firestore Database
2. Authentication (LINE Provider)
3. Hosting

## LIFF設定
LINE Developers Console で LIFF アプリを作成し、
`src/pages/index.html` の `liffId` を更新してください。

## ライセンス
MIT License