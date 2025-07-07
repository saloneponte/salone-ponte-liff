# Google Calendar統合セットアップガイド

## 📋 事前準備

### 1. Google Cloud Platform設定

1. **Google Cloud Console**にアクセス
   - https://console.cloud.google.com/

2. **新しいプロジェクトを作成**（または既存プロジェクトを選択）

3. **Google Calendar API を有効化**
   ```
   API とサービス > ライブラリ > Google Calendar API > 有効にする
   ```

### 2. 認証方法の選択

#### 🔹 方法A: サービスアカウント認証（推奨）

**メリット**: サーバー間認証、ユーザー操作不要、セキュア

1. **サービスアカウント作成**
   ```
   IAM と管理 > サービスアカウント > サービスアカウントを作成
   ```

2. **キーファイルダウンロード**
   ```
   サービスアカウント > キー > 新しいキーを追加 > JSON
   ```

3. **カレンダー共有設定**
   - Google Calendarを開く
   - 設定 > カレンダーの設定
   - 特定のユーザーと共有 > サービスアカウントのメールアドレスを追加
   - 権限: 「予定の変更」

#### 🔹 方法B: OAuth2認証

**メリット**: ユーザーの代理でアクセス、個人カレンダー利用可能

1. **OAuth2クライアントID作成**
   ```
   API とサービス > 認証情報 > 認証情報を作成 > OAuth クライアント ID
   アプリケーションの種類: ウェブアプリケーション
   ```

2. **リダイレクトURI設定**
   ```
   承認済みのリダイレクト URI:
   - https://your-domain.com/oauth/callback
   - http://localhost:3000/oauth/callback (開発用)
   ```

## 🔧 Firebase Functions設定

### 1. 環境変数の設定

#### サービスアカウント認証の場合:
```bash
# サービスアカウントキーファイルの内容をBase64エンコード
cat service-account-key.json | base64

# Firebase Functionsに設定
firebase functions:config:set google.service_account_key="$(cat service-account-key.json | base64)"
firebase functions:config:set google.calendar_id="your-calendar-id@gmail.com"
```

#### OAuth2認証の場合:
```bash
firebase functions:config:set google.client_id="your-client-id"
firebase functions:config:set google.client_secret="your-client-secret"
firebase functions:config:set google.calendar_id="primary"
```

### 2. 設定確認
```bash
firebase functions:config:get
```

## 📦 依存関係の更新

### functions/package.json に追加
```json
{
  "dependencies": {
    "googleapis": "^110.0.0",
    "cors": "^2.8.5"
  }
}
```

### インストール実行
```bash
cd functions
npm install
```

## 🧪 テスト実行

### 1. テストファイルの準備
```bash
# Google Calendar テストを実行
node test-google-calendar.js
```

### 2. 設定ファイル作成（サービスアカウント用）
```bash
# functions/service-account-key.json にキーファイルを配置
cp ~/Downloads/your-service-account-key.json functions/service-account-key.json
```

### 3. 環境変数設定（ローカルテスト用）
```bash
# .env ファイルを作成
cat << EOF > .env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com
EOF
```

## 🚀 デプロイ

### 1. Firebase Functions デプロイ
```bash
firebase deploy --only functions
```

### 2. 動作確認
```bash
# ログ確認
firebase functions:log

# 特定の関数ログ
firebase functions:log --only syncReservationToCalendar
```

## 🔧 トラブルシューティング

### よくあるエラーと解決方法

#### 1. `Error: The caller does not have permission`
**原因**: サービスアカウントにカレンダーアクセス権限がない
**解決**: Google Calendarでサービスアカウントを共有設定に追加

#### 2. `Error: Access blocked: This app's request is invalid`
**原因**: OAuth2設定が不正
**解決**: リダイレクトURIとスコープ設定を確認

#### 3. `Error: Calendar usage limits exceeded`
**原因**: API使用量制限に達した
**解決**: Google Cloud Consoleで制限を確認・増量申請

#### 4. `Error: Invalid calendar identifier`
**原因**: カレンダーIDが間違っている
**解決**: 
```javascript
// 正しいカレンダーID取得方法
// Google Calendar設定 > カレンダーID
// または 'primary' を使用（メインカレンダー）
```

### デバッグ用コード
```javascript
// functions/index.js に追加（デバッグ用）
exports.debugGoogleCalendar = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // 設定確認
      const config = {
        clientId: functions.config().google?.client_id,
        clientSecret: functions.config().google?.client_secret,
        calendarId: functions.config().google?.calendar_id,
        serviceAccount: !!functions.config().google?.service_account_key
      };
      
      console.log('Google Calendar設定:', config);
      
      // API接続テスト
      const calendar = getGoogleCalendar();
      const calendarInfo = await calendar.calendars.get({
        calendarId: googleConfig.calendarId
      });
      
      res.json({
        success: true,
        config: config,
        calendar: {
          name: calendarInfo.data.summary,
          timeZone: calendarInfo.data.timeZone
        }
      });
      
    } catch (error) {
      console.error('デバッグエラー:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data
      });
    }
  });
});
```

## 📊 モニタリング

### 1. ログ監視
```bash
# リアルタイムログ
firebase functions:log --follow

# エラーログのみ
firebase functions:log --only-failures
```

### 2. パフォーマンス監視
```javascript
// functions/index.js に追加
const startTime = Date.now();
// Google Calendar操作
const endTime = Date.now();
console.log(`Google Calendar処理時間: ${endTime - startTime}ms`);
```

### 3. 使用量監視
- Google Cloud Console > API とサービス > 割り当て
- Calendar API の使用状況を確認

## 🔐 セキュリティ考慮事項

### 1. 認証情報の保護
- サービスアカウントキーファイルは `.gitignore` に追加
- 環境変数で管理（Firebase Functions Config）
- 定期的なキーローテーション

### 2. アクセス制御
- 最小権限の原則（必要な権限のみ付与）
- カレンダー共有範囲の制限
- IP制限の検討

### 3. データ保護
- 個人情報の適切な取り扱い
- ログに機密情報を出力しない
- データ暗号化の検討

## 📈 パフォーマンス最適化

### 1. API呼び出し最適化
```javascript
// バッチ処理の実装例
async function batchUpdateCalendarEvents(reservations) {
  const batch = reservations.map(async (reservation) => {
    try {
      return await updateGoogleCalendarEvent(reservation);
    } catch (error) {
      console.error(`予約 ${reservation.id} の更新失敗:`, error);
      return null;
    }
  });
  
  return await Promise.allSettled(batch);
}
```

### 2. エラー回復機能
```javascript
// リトライ機能付きAPI呼び出し
async function callGoogleAPIWithRetry(apiCall, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 指数バックオフ
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## ✅ チェックリスト

- [ ] Google Cloud Project作成
- [ ] Google Calendar API有効化
- [ ] 認証方法選択・設定
- [ ] Firebase Functions設定
- [ ] 依存関係インストール
- [ ] テスト実行・成功確認
- [ ] デプロイ実行
- [ ] 本番環境動作確認
- [ ] ログ・モニタリング設定
- [ ] セキュリティ設定確認