# LINE通知機能 セットアップガイド

## 📱 実装完了機能

### 1. 予約完了通知
- **トリガー**: 新しい予約がFirestoreに保存されたとき
- **送信先**: 予約したお客様 + 担当スタッフ
- **形式**: リッチなFlex Message

### 2. 予約リマインダー
- **スケジュール**: 毎日18時実行
- **対象**: 翌日に予約があるお客様
- **内容**: 時間・メニュー・担当者の確認

### 3. 誕生日メッセージ
- **スケジュール**: 毎日9時実行
- **特典**: 全メニュー10%OFF（今月末まで）

### 4. 離反防止メッセージ
- **スケジュール**: 毎週月曜日10時実行
- **対象**: 2ヶ月以上来店していない顧客
- **特典**: 20%OFFクーポン

### 5. 季節限定メニュー告知
- **スケジュール**: 毎月1日11時実行
- **内容**: 春夏秋冬の季節メニュー紹介

### 6. 予約キャンセル通知
- **トリガー**: 予約ステータスが「cancelled」に変更されたとき
- **内容**: キャンセル確認 + 再予約への案内

## 🔧 セットアップ状況

### Firebase Cloud Functions
```bash
# デプロイ済み関数
- sendReservationConfirmation    # 予約完了通知
- sendReservationReminder        # 予約リマインダー  
- sendBirthdayMessages           # 誕生日メッセージ
- sendRetentionMessages          # 離反防止メッセージ
- sendSeasonalMenuAnnouncement   # 季節メニュー告知
- sendCancellationNotification   # キャンセル通知
```

### LINE Bot設定
```javascript
// 環境変数設定済み
firebase functions:config:set line.channel_access_token="YOUR_TOKEN"
firebase functions:config:set line.channel_secret="YOUR_SECRET"
```

## 📋 動作確認方法

### 1. 予約完了通知のテスト
```javascript
// テスト用予約データをFirestoreに追加
const testReservation = {
  lineUserId: "U123456789abcdef",  // LINEユーザーID
  name: "テスト太郎",
  menuName: "カット",
  menuPrice: 4000,
  staffName: "山田さくら", 
  staffId: "staff1",
  datetime: new Date().toISOString(),
  status: "confirmed"
};

// Firestoreの reservations コレクションに追加
db.collection('reservations').add(testReservation);
```

### 2. 手動でのメッセージ送信テスト
```bash
# Firebase Functionsのログ確認
firebase functions:log --only sendReservationConfirmation

# エミュレーターでのローカルテスト
firebase emulators:start --only functions
```

## ⚠️ 注意事項

### 1. LINE Bot設定
- LINE Developers Consoleでの設定が必要
- Webhook URLの設定: `https://us-central1-salone-ponte-fceca.cloudfunctions.net/sendReservationConfirmation`

### 2. 権限設定
- Firebase Functionsに必要な権限:
  - Firestore読み書き
  - LINE Messaging API送信

### 3. 本番運用前の確認事項
- [ ] LINE Bot Channel Access Token設定
- [ ] LINE Bot Channel Secret設定  
- [ ] Firestore Security Rules設定
- [ ] 各関数のテスト実行
- [ ] エラーハンドリングの確認

## 🔄 メッセージフロー

```
予約完了 → Firestore保存 → Cloud Function自動実行 → LINE通知送信
    ↓
お客様とスタッフ両方にリッチなメッセージ送信
```

## 📊 監視・運用

### ログ確認
```bash
# 全体のログ
firebase functions:log

# 特定の関数
firebase functions:log --only sendReservationConfirmation
```

### エラー対応
- Cloud Functionのエラーログを定期確認
- LINE API制限（月1000通まで無料）の監視
- Firestore読み書き制限の監視

---

**✅ 実装完了**: 予約完了後に自動でLINE通知が送信される仕組みが完成しました。