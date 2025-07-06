# Salone Ponte - LINE LIFF予約システム

## 📋 プロジェクト概要

### SaaSサービスとしての将来展望
- **最終目標**: 美容室・サロン向けの統合予約管理SaaSプラットフォーム
- **コアバリュー**: LINE経由での簡単予約 + 店舗管理の効率化
- **収益モデル**: 店舗数課金 + 機能別オプション課金
- **市場ポジション**: 中小規模サロン向けの使いやすいオールインワンソリューション

### 複数店舗対応の設計思想
- **テナント設計**: 各店舗を独立したテナントとして管理
- **データ分離**: 店舗間でのデータ完全分離を保証
- **権限管理**: 店舗オーナー・スタッフ・本部管理者の階層的権限システム
- **統合管理**: マルチテナント対応の統合管理画面

### 現在の技術選択理由
- **フェーズ1**: 単一店舗でのMVP検証 → 市場ニーズの確認
- **フェーズ2**: 複数店舗対応への拡張 → SaaS化の準備
- **フェーズ3**: 本格的なSaaSサービス展開

## 🏗️ 技術アーキテクチャ

### Vanilla JS選択の利点
- **シンプルさ**: フレームワーク学習コストなし、メンテナンス性が高い
- **軽量性**: 高速な読み込みとパフォーマンス（特にモバイル）
- **安定性**: フレームワーク依存によるブレイキングチェンジなし
- **デバッグ容易性**: ブラウザ標準ツールで完結したデバッグ
- **PWA対応**: Service Workerとの親和性が高い

### 将来のモダン化計画
```
Phase 1 (現在): Vanilla JS + Firebase
├── 基本機能実装
├── エラーハンドリング強化
└── セキュリティ対策

Phase 2 (6-12ヶ月): 段階的モダン化
├── TypeScript導入
├── ビルドツール導入（Vite/Webpack）
├── コンポーネント設計の導入
└── テストフレームワーク導入

Phase 3 (1-2年): フルモダン化
├── React/Vue.jsへの移行
├── マイクロサービス化
├── GraphQL API
└── モバイルアプリ化
```

### スケーラビリティの考慮
- **水平スケーリング**: Firebase Firestoreの自動スケーリング活用
- **マイクロサービス化準備**: 機能別モジュール設計
- **CDN活用**: 静的アセットの高速配信
- **キャッシュ戦略**: Service Workerを活用したオフライン対応

## 🛡️ セキュリティ・認証情報管理

### 環境変数による認証情報の安全な管理

#### 基本方針
- **本番環境では全ての認証情報を環境変数で管理**
- **開発環境ではフォールバック設定を提供**
- **機密情報のソースコードへのハードコーディングを禁止**
- **ログへの機密情報出力を防止**

#### 環境変数設定手順

1. **環境変数ファイルの作成**
```bash
# .env.example をコピーして .env を作成
cp .env.example .env

# 各項目を実際の値で設定
vim .env
```

2. **主要な環境変数**
```bash
# LIFF関連（LINE Developers要確認）
LIFF_ID=your_liff_id_here

# LINE Messaging API
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token

# Firebase設定
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com

# セキュリティ設定
SECURE_MODE=true  # 本番環境では必須
LOG_LEVEL=info    # 本番環境では debug 以外
```

3. **本番環境での設定**
- Vercelの環境変数設定画面で全ての値を設定
- GitHub Secretsに機密情報を保存
- ローカル開発環境の .env は絶対にプッシュしない

#### セキュリティ機能

**自動バリデーション**
- 必須項目の存在チェック
- 本番環境での追加要件チェック
- 認証情報の形式検証

**安全な読み込み**
```javascript
// 環境設定の安全な取得
const envConfig = getEnvConfig();
const firebaseConfig = envConfig.getFirebaseConfig();
const liffConfig = envConfig.getLIFFConfig();
```

**ログセキュリティ**
- 機密情報（SECRET, TOKEN, KEY）のログ出力を自動的に防止
- デバッグ情報は開発環境のみ出力
- 本番環境では最小限のログレベル

#### 環境別設定

**開発環境**
- フォールバック設定を提供
- 詳細なデバッグ情報
- 設定状態の可視化

**本番環境**
- 環境変数必須
- セキュアモード強制
- 最小限のログ出力

#### セキュリティチェックリスト

**コード側**
- [ ] ハードコードされた認証情報がない
- [ ] 環境変数を適切に読み込んでいる
- [ ] エラー時のフォールバック処理が適切
- [ ] ログに機密情報が含まれていない

**デプロイ側**
- [ ] .env ファイルが .gitignore に含まれている
- [ ] 本番環境の環境変数が設定済み
- [ ] LINE DevelopersでLIFF IDを確認済み
- [ ] Firebase設定が最新

**運用側**
- [ ] 定期的な認証情報のローテーション
- [ ] アクセスログの監視
- [ ] 不要な権限の削除
- [ ] セキュリティアップデートの適用

### セキュリティベストプラクティス

**認証情報管理**
- 最小権限の原則
- 定期的なローテーション
- 用途別の権限分離
- 監査ログの確保

**アクセス制御**
- Firebase Security Rulesの適切な設定
- 不正アクセスの検知・ブロック
- ユーザー認証の強化

**データ保護**
- 個人情報の暗号化
- データベースアクセスの制限
- バックアップデータの保護

## 🛡️ 安定性・セキュリティ重視の開発方針

### エラーハンドリングのベストプラクティス
```javascript
// すべての非同期処理でのエラーハンドリング
async function safeAsyncOperation() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in safeAsyncOperation:', error);
    showUserFriendlyError('操作に失敗しました。再度お試しください。');
    return { success: false, error: error.message };
  }
}

// Firebase操作のエラーハンドリング
function handleFirebaseError(error) {
  const errorMessages = {
    'permission-denied': 'アクセス権限がありません',
    'not-found': 'データが見つかりません',
    'network-request-failed': 'ネットワークエラーです'
  };
  
  return errorMessages[error.code] || 'システムエラーが発生しました';
}
```

### 基本セキュリティチェックリスト
- [ ] **APIキー管理**: 環境変数での管理（現在要改善）
- [ ] **入力値検証**: すべてのフォーム入力にバリデーション
- [ ] **XSS対策**: innerHTML使用時のサニタイズ
- [ ] **認証・認可**: Firebase Authenticationの適切な実装
- [ ] **データ検証**: Firestore Security Rulesの設定
- [ ] **HTTPS通信**: 本番環境での強制HTTPS

### Firebase設定のセキュリティ要件
```javascript
// 現在のFirebase設定（要改善）
// ❌ 危険: APIキーがソースコードに直接記述
const firebaseConfig = {
  apiKey: "AIzaSyAK14FMyp7VGYZPakGDmLdgHsvvxT-b0TM",
  // ...
};

// ✅ 推奨: 環境変数での管理
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ...
};
```

## 📱 LINE機能活用計画

### 現在実装済み機能
- **LIFF予約システム**: 3ステップでの簡単予約
- **Flex Messageによる予約確認通知**: リッチなメッセージ表示
- **LINE Bot SDK**: Cloud Functionsでのメッセージ送信

### リッチメニュー実装検討事項
```javascript
// リッチメニューの設計案
const richMenuTemplate = {
  size: { width: 2500, height: 1686 },
  selected: false,
  name: "サロンメニュー",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: "uri", uri: "https://liff.line.me/xxx/booking" }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: "uri", uri: "https://liff.line.me/xxx/history" }
    },
    // 予約、履歴、クーポン、お知らせ等の配置
  ]
};
```

### Flex Message活用アイデア
- **予約確認**: 詳細な予約情報表示
- **メニューカタログ**: 画像付きサービス紹介
- **スタッフ紹介**: プロフィール付きスタッフ選択
- **キャンペーン告知**: 期間限定オファー

## 🏪 多店舗対応の設計指針

### データ構造の設計方針
```javascript
// 単一店舗（現在）
/reservations/{reservationId}
/customers/{customerId}
/menus/{menuId}

// 多店舗対応（将来）
/tenants/{tenantId}/reservations/{reservationId}
/tenants/{tenantId}/customers/{customerId}
/tenants/{tenantId}/menus/{menuId}
/tenants/{tenantId}/settings/{settingId}
```

### 店舗管理機能の要件
- **店舗プロフィール**: 基本情報、営業時間、画像
- **権限管理**: オーナー・マネージャー・スタッフの階層
- **ブランディング**: 独自ロゴ、カラー設定
- **決済設定**: 各店舗独自の決済方法

### スケーラビリティの考慮点
- **データベース設計**: テナント分離によるパフォーマンス維持
- **認証システム**: Firebase Auth + Custom Claims
- **キャッシュ戦略**: 店舗別データの効率的キャッシュ

## ⚡ 開発優先順位（安定性重視）

### Phase 1: エラー処理・基本セキュリティ（1-2ヶ月）
- [ ] **エラーハンドリング強化**: 全モジュールでの統一的エラー処理
- [ ] **Firebase Security Rules**: 適切なデータアクセス制御
- [ ] **入力値検証**: フォーム・APIでの包括的バリデーション
- [ ] **APIキー管理**: 環境変数化とセキュリティ強化
- [ ] **ログ機能**: エラートラッキングと分析

### Phase 2: 多店舗対応基盤（2-3ヶ月）
- [ ] **マルチテナント設計**: データベース構造の変更
- [ ] **認証システム拡張**: 店舗別権限管理
- [ ] **管理画面リニューアル**: 店舗管理機能の追加
- [ ] **データマイグレーション**: 既存データの移行仕組み

### Phase 3: LINE機能拡張（1-2ヶ月）
- [ ] **リッチメニュー**: 視覚的で使いやすいメニュー
- [ ] **Flex Message強化**: より豊富なメッセージテンプレート
- [ ] **プッシュ通知**: 予約リマインダー・キャンペーン通知
- [ ] **チャットサポート**: 簡単な問い合わせ機能

## 👤 個人開発向けのワークフロー

### 効率的な開発手順
1. **機能設計**: 1機能につき1つのブランチ
2. **プロトタイプ**: 最小限の動作確認
3. **エラーハンドリング**: 例外ケースの対応
4. **テスト**: 手動テスト + 自動テスト
5. **デプロイ**: ステージング → 本番環境

### テスト・検証方法
```bash
# 開発環境でのテスト
npm run dev
# → http://localhost:3000 でメイン画面
# → http://localhost:3001 でLIFF画面

# 本番環境でのテスト
npm run build
npm run preview
```

### デプロイ・運用方針
- **ステージング環境**: Firebase Hosting Preview
- **本番環境**: Firebase Hosting
- **監視**: Firebase Analytics + Performance
- **バックアップ**: Firestore Export の定期実行

## 🔧 開発コマンド

### 基本コマンド
```bash
# 開発サーバー起動
npm run dev          # メイン画面（ポート3000）
npm run dev:liff     # LIFF画面（ポート3001）
npm run dev:dashboard # 管理画面（ポート3002）

# ビルド
npm run build        # プロダクションビルド
npm run preview      # ビルド結果のプレビュー

# Firebase関連
firebase deploy      # 本番デプロイ
firebase serve       # ローカルプレビュー
```

## 📊 成功指標

### 技術指標
- **エラー率**: < 1%
- **ページロード時間**: < 3秒
- **PWAスコア**: > 90点
- **アクセシビリティ**: AA準拠

### ビジネス指標
- **予約完了率**: > 80%
- **リピート率**: > 60%
- **システム稼働率**: > 99.9%
- **サポート問い合わせ**: 予約10件につき1件未満

---

## 📝 更新履歴

- **2025-01-XX**: 初版作成
- **将来**: 各フェーズ完了時に更新予定

---

**注意**: このドキュメントは開発の進捗に応じて定期的に更新してください。