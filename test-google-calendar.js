// Google Calendar統合テストスクリプト
// このファイルはGoogle Calendar APIの動作確認用です

const admin = require('firebase-admin');
const { google } = require('googleapis');

// Firebase初期化（テスト用）
if (!admin.apps.length) {
  admin.initializeApp();
}

// テスト用設定（実際の値に置き換えてください）
const testConfig = {
  // サービスアカウントのJSONファイルパス
  serviceAccountPath: './service-account-key.json',
  
  // または環境変数から取得
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  
  // テスト用予約データ
  testReservation: {
    id: 'test-' + Date.now(),
    name: 'テスト太郎',
    phone: '090-1234-5678',
    email: 'test@example.com',
    datetime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 明日
    menuName: 'カット + シャンプー',
    menuPrice: 5000,
    menuDuration: 90,
    staffName: 'スタイリスト山田',
    customerId: 'test-customer-123'
  }
};

// Google Auth設定
function getGoogleAuth() {
  // サービスアカウント認証（推奨）
  if (testConfig.serviceAccountPath) {
    try {
      const serviceAccount = require(testConfig.serviceAccountPath);
      return new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });
    } catch (error) {
      console.log('サービスアカウントファイルが見つかりません:', error.message);
    }
  }
  
  // OAuth2認証（バックアップ）
  if (testConfig.clientId && testConfig.clientSecret) {
    const auth = new google.auth.OAuth2(
      testConfig.clientId,
      testConfig.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    // アクセストークンが必要（手動設定）
    // auth.setCredentials({
    //   access_token: 'YOUR_ACCESS_TOKEN',
    //   refresh_token: 'YOUR_REFRESH_TOKEN'
    // });
    
    return auth;
  }
  
  throw new Error('Google認証設定が不完全です');
}

// Google Calendar API クライアント
function getGoogleCalendar() {
  const auth = getGoogleAuth();
  return google.calendar({ version: 'v3', auth });
}

// ===== テスト関数群 =====

/**
 * 1. Google Calendar API接続テスト
 */
async function testCalendarConnection() {
  console.log('\n🔍 Google Calendar API接続テスト...');
  
  try {
    const calendar = getGoogleCalendar();
    const response = await calendar.calendars.get({
      calendarId: testConfig.calendarId
    });
    
    console.log('✅ 接続成功!');
    console.log(`カレンダー名: ${response.data.summary}`);
    console.log(`タイムゾーン: ${response.data.timeZone}`);
    return true;
    
  } catch (error) {
    console.error('❌ 接続失敗:', error.message);
    console.error('詳細:', error.response?.data?.error || error);
    return false;
  }
}

/**
 * 2. イベント作成テスト
 */
async function testCreateEvent() {
  console.log('\n📅 イベント作成テスト...');
  
  try {
    const calendar = getGoogleCalendar();
    const reservation = testConfig.testReservation;
    
    const startTime = new Date(reservation.datetime);
    const endTime = new Date(startTime.getTime() + reservation.menuDuration * 60000);
    
    const event = {
      summary: `【サロンポンテ】${reservation.name} - ${reservation.menuName}`,
      description: `
顧客: ${reservation.name}
メニュー: ${reservation.menuName}
スタッフ: ${reservation.staffName}
料金: ¥${reservation.menuPrice}
電話: ${reservation.phone}

※ テスト用イベント
予約ID: ${reservation.id}
      `.trim(),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 15 }
        ]
      },
      extendedProperties: {
        private: {
          salonePonte: 'true',
          reservationId: reservation.id,
          customerId: reservation.customerId,
          testEvent: 'true'
        }
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: testConfig.calendarId,
      resource: event
    });
    
    console.log('✅ イベント作成成功!');
    console.log(`イベントID: ${response.data.id}`);
    console.log(`開始時間: ${response.data.start.dateTime}`);
    console.log(`カレンダーURL: ${response.data.htmlLink}`);
    
    return response.data.id;
    
  } catch (error) {
    console.error('❌ イベント作成失敗:', error.message);
    console.error('詳細:', error.response?.data?.error || error);
    return null;
  }
}

/**
 * 3. イベント更新テスト
 */
async function testUpdateEvent(eventId) {
  console.log('\n📝 イベント更新テスト...');
  
  if (!eventId) {
    console.log('⚠️ 更新するイベントIDがありません');
    return false;
  }
  
  try {
    const calendar = getGoogleCalendar();
    const reservation = testConfig.testReservation;
    
    // 時間を30分後ろにずらす
    const startTime = new Date(reservation.datetime.getTime() + 30 * 60000);
    const endTime = new Date(startTime.getTime() + reservation.menuDuration * 60000);
    
    const updatedEvent = {
      summary: `【サロンポンテ】${reservation.name} - ${reservation.menuName} (更新済み)`,
      description: `
顧客: ${reservation.name}
メニュー: ${reservation.menuName}
スタッフ: ${reservation.staffName}
料金: ¥${reservation.menuPrice}
電話: ${reservation.phone}

※ テスト用イベント（更新済み）
予約ID: ${reservation.id}
更新日時: ${new Date().toISOString()}
      `.trim(),
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Tokyo'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Tokyo'
      }
    };
    
    const response = await calendar.events.update({
      calendarId: testConfig.calendarId,
      eventId: eventId,
      resource: updatedEvent
    });
    
    console.log('✅ イベント更新成功!');
    console.log(`更新後の開始時間: ${response.data.start.dateTime}`);
    return true;
    
  } catch (error) {
    console.error('❌ イベント更新失敗:', error.message);
    console.error('詳細:', error.response?.data?.error || error);
    return false;
  }
}

/**
 * 4. イベント取得テスト
 */
async function testGetEvent(eventId) {
  console.log('\n🔍 イベント取得テスト...');
  
  if (!eventId) {
    console.log('⚠️ 取得するイベントIDがありません');
    return false;
  }
  
  try {
    const calendar = getGoogleCalendar();
    
    const response = await calendar.events.get({
      calendarId: testConfig.calendarId,
      eventId: eventId
    });
    
    console.log('✅ イベント取得成功!');
    console.log(`タイトル: ${response.data.summary}`);
    console.log(`開始時間: ${response.data.start.dateTime}`);
    console.log(`終了時間: ${response.data.end.dateTime}`);
    console.log(`予約ID: ${response.data.extendedProperties?.private?.reservationId}`);
    
    return response.data;
    
  } catch (error) {
    console.error('❌ イベント取得失敗:', error.message);
    return null;
  }
}

/**
 * 5. イベント削除テスト
 */
async function testDeleteEvent(eventId) {
  console.log('\n🗑️ イベント削除テスト...');
  
  if (!eventId) {
    console.log('⚠️ 削除するイベントIDがありません');
    return false;
  }
  
  try {
    const calendar = getGoogleCalendar();
    
    await calendar.events.delete({
      calendarId: testConfig.calendarId,
      eventId: eventId
    });
    
    console.log('✅ イベント削除成功!');
    return true;
    
  } catch (error) {
    console.error('❌ イベント削除失敗:', error.message);
    return false;
  }
}

/**
 * 6. エラーハンドリングテスト
 */
async function testErrorHandling() {
  console.log('\n🚨 エラーハンドリングテスト...');
  
  try {
    const calendar = getGoogleCalendar();
    
    // 存在しないイベントIDで削除を試行
    await calendar.events.delete({
      calendarId: testConfig.calendarId,
      eventId: 'nonexistent-event-id'
    });
    
    console.log('⚠️ エラーが発生しませんでした（予期しない結果）');
    
  } catch (error) {
    if (error.code === 404) {
      console.log('✅ 適切なエラーハンドリング: 404 Not Found');
    } else {
      console.log(`✅ エラーキャッチ成功: ${error.message}`);
    }
  }
}

// ===== メイン実行関数 =====

async function runAllTests() {
  console.log('🧪 Google Calendar統合テスト開始');
  console.log('=====================================');
  
  // 設定確認
  console.log('\n📋 設定確認:');
  console.log(`Calendar ID: ${testConfig.calendarId}`);
  console.log(`Service Account: ${testConfig.serviceAccountPath ? '設定済み' : '未設定'}`);
  console.log(`OAuth2: ${testConfig.clientId ? '設定済み' : '未設定'}`);
  
  let testEventId = null;
  
  try {
    // 1. 接続テスト
    const isConnected = await testCalendarConnection();
    if (!isConnected) {
      console.log('\n❌ 接続テストに失敗しました。設定を確認してください。');
      return;
    }
    
    // 2. イベント作成テスト
    testEventId = await testCreateEvent();
    
    if (testEventId) {
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. イベント取得テスト
      await testGetEvent(testEventId);
      
      // 4. イベント更新テスト
      await testUpdateEvent(testEventId);
      
      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. イベント削除テスト
      await testDeleteEvent(testEventId);
    }
    
    // 6. エラーハンドリングテスト
    await testErrorHandling();
    
    console.log('\n✅ 全テスト完了!');
    
  } catch (error) {
    console.error('\n❌ テスト実行中にエラーが発生:', error);
    
    // クリーンアップ: テストイベントが残っている場合は削除
    if (testEventId) {
      console.log('\n🧹 クリーンアップ中...');
      await testDeleteEvent(testEventId);
    }
  }
}

// スクリプト実行
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCalendarConnection,
  testCreateEvent,
  testUpdateEvent,
  testGetEvent,
  testDeleteEvent,
  testErrorHandling,
  runAllTests
};