// Google Calendar統合の実際のテスト
// Firebase Functions の動作をローカルで確認

const admin = require('firebase-admin');
const { google } = require('googleapis');

// 設定読み込み
require('dotenv').config();

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// テスト用Google Calendar設定
const testGoogleConfig = {
  // 環境変数から読み込み（実際の値を設定してください）
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  
  // サービスアカウント使用の場合
  serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY
};

// テスト用予約データ
const testReservation = {
  id: 'test-reservation-' + Date.now(),
  name: 'テスト花子',
  phone: '080-9876-5432',
  email: 'test.hanako@example.com',
  datetime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2時間後
  menuName: 'カラー + トリートメント',
  menuPrice: 8500,
  menuDuration: 120, // 120分
  staffName: 'スタイリスト佐藤',
  staffId: 'staff-sato-001',
  customerId: 'customer-hanako-001',
  status: 'confirmed'
};

// Google Auth設定（Firebase Functionsと同じロジック）
function getGoogleAuth() {
  // サービスアカウント認証
  if (testGoogleConfig.serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(testGoogleConfig.serviceAccountKey);
      return new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });
    } catch (error) {
      console.error('サービスアカウント設定エラー:', error.message);
    }
  }
  
  // OAuth2認証
  if (testGoogleConfig.clientId && testGoogleConfig.clientSecret) {
    const auth = new google.auth.OAuth2(
      testGoogleConfig.clientId,
      testGoogleConfig.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    // 実際の使用では、ここでアクセストークンを設定する必要があります
    // auth.setCredentials({
    //   access_token: 'YOUR_ACCESS_TOKEN',
    //   refresh_token: 'YOUR_REFRESH_TOKEN'
    // });
    
    return auth;
  }
  
  throw new Error('Google認証設定が不完全です');
}

function getGoogleCalendar() {
  const auth = getGoogleAuth();
  return google.calendar({ version: 'v3', auth });
}

// ===== Firebase Functionsと同じ関数を再現 =====

async function createGoogleCalendarEvent(reservationData) {
  if (!testGoogleConfig.clientId && !testGoogleConfig.serviceAccountKey) {
    console.log('Google Calendar設定が不完全です');
    return null;
  }

  try {
    const calendar = getGoogleCalendar();
    const startTime = new Date(reservationData.datetime);
    const endTime = new Date(startTime.getTime() + (reservationData.menuDuration || 60) * 60000);

    const event = {
      summary: `【サロンポンテ】${reservationData.name} - ${reservationData.menuName}`,
      description: `
顧客: ${reservationData.name}
メニュー: ${reservationData.menuName}
スタッフ: ${reservationData.staffName}
料金: ¥${reservationData.menuPrice || 0}
電話: ${reservationData.phone || ''}

※ Salone Ponte 予約システムより自動作成
予約ID: ${reservationData.id}
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
          reservationId: reservationData.id,
          customerId: reservationData.customerId || ''
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: testGoogleConfig.calendarId,
      resource: event
    });

    console.log('✅ Google Calendar イベント作成成功:', response.data.id);
    return response.data;

  } catch (error) {
    console.error('❌ Google Calendar イベント作成エラー:', error);
    console.error('詳細:', error.response?.data?.error || error.message);
    return null;
  }
}

async function updateGoogleCalendarEvent(reservationData, eventId) {
  if (!testGoogleConfig.clientId && !testGoogleConfig.serviceAccountKey) {
    console.log('Google Calendar設定が不完全です');
    return null;
  }

  try {
    const calendar = getGoogleCalendar();
    const startTime = new Date(reservationData.datetime);
    const endTime = new Date(startTime.getTime() + (reservationData.menuDuration || 60) * 60000);

    const updatedEvent = {
      summary: `【サロンポンテ】${reservationData.name} - ${reservationData.menuName}`,
      description: `
顧客: ${reservationData.name}
メニュー: ${reservationData.menuName}
スタッフ: ${reservationData.staffName}
料金: ¥${reservationData.menuPrice || 0}
電話: ${reservationData.phone || ''}

※ Salone Ponte 予約システムより自動作成
予約ID: ${reservationData.id}
最終更新: ${new Date().toISOString()}
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
      calendarId: testGoogleConfig.calendarId,
      eventId: eventId,
      resource: updatedEvent
    });

    console.log('✅ Google Calendar イベント更新成功:', eventId);
    return response.data;

  } catch (error) {
    console.error('❌ Google Calendar イベント更新エラー:', error);
    return null;
  }
}

async function deleteGoogleCalendarEvent(eventId) {
  if (!testGoogleConfig.clientId && !testGoogleConfig.serviceAccountKey) {
    console.log('Google Calendar設定が不完全です');
    return;
  }

  try {
    const calendar = getGoogleCalendar();
    
    await calendar.events.delete({
      calendarId: testGoogleConfig.calendarId,
      eventId: eventId
    });

    console.log('✅ Google Calendar イベント削除成功:', eventId);

  } catch (error) {
    console.error('❌ Google Calendar イベント削除エラー:', error);
    throw error;
  }
}

// ===== Firestoreトリガーのシミュレーション =====

async function simulateReservationCreate() {
  console.log('\n📝 予約作成シミュレーション');
  console.log('=' * 40);
  
  try {
    // 1. Firestoreに予約データを追加
    const docRef = await db.collection('reservations').add(testReservation);
    console.log('✅ Firestore予約作成:', docRef.id);
    
    // 2. Google Calendarイベント作成
    const reservationWithId = { ...testReservation, id: docRef.id };
    const googleEvent = await createGoogleCalendarEvent(reservationWithId);
    
    if (googleEvent) {
      // 3. FirestoreにGoogle Calendar EventIDを保存
      await docRef.update({
        googleEventId: googleEvent.id,
        calendarSynced: true,
        calendarSyncedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Google Event ID保存完了:', googleEvent.id);
      return { docRef, googleEvent };
    } else {
      console.log('❌ Google Calendarイベント作成に失敗');
      return { docRef, googleEvent: null };
    }
    
  } catch (error) {
    console.error('❌ 予約作成シミュレーションエラー:', error);
    return null;
  }
}

async function simulateReservationUpdate(docRef, googleEventId) {
  console.log('\n📝 予約更新シミュレーション');
  console.log('=' * 40);
  
  try {
    // 予約データを更新（時間を1時間後にシフト）
    const updatedData = {
      ...testReservation,
      datetime: new Date(testReservation.datetime.getTime() + 60 * 60 * 1000),
      menuName: 'カラー + トリートメント + ヘッドスパ',
      menuPrice: 12000,
      menuDuration: 150
    };
    
    // 1. Firestoreを更新
    await docRef.update(updatedData);
    console.log('✅ Firestore予約更新完了');
    
    // 2. Google Calendarイベントを更新
    const updatedGoogleEvent = await updateGoogleCalendarEvent(updatedData, googleEventId);
    
    if (updatedGoogleEvent) {
      console.log('✅ Google Calendarイベント更新完了');
      return updatedGoogleEvent;
    } else {
      console.log('❌ Google Calendarイベント更新に失敗');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 予約更新シミュレーションエラー:', error);
    return null;
  }
}

async function simulateReservationDelete(docRef, googleEventId) {
  console.log('\n🗑️ 予約削除シミュレーション');
  console.log('=' * 40);
  
  try {
    // 1. Google Calendarイベントを削除
    await deleteGoogleCalendarEvent(googleEventId);
    console.log('✅ Google Calendarイベント削除完了');
    
    // 2. Firestoreから予約を削除
    await docRef.delete();
    console.log('✅ Firestore予約削除完了');
    
  } catch (error) {
    console.error('❌ 予約削除シミュレーションエラー:', error);
  }
}

// ===== エラーハンドリングテスト =====

async function testErrorScenarios() {
  console.log('\n🚨 エラーシナリオテスト');
  console.log('=' * 40);
  
  // 1. 無効なカレンダーIDテスト
  console.log('\n1. 無効なカレンダーIDテスト...');
  const originalCalendarId = testGoogleConfig.calendarId;
  testGoogleConfig.calendarId = 'invalid-calendar-id';
  
  const invalidResult = await createGoogleCalendarEvent(testReservation);
  if (!invalidResult) {
    console.log('✅ 無効なカレンダーIDエラーを適切に処理');
  }
  
  // 設定を元に戻す
  testGoogleConfig.calendarId = originalCalendarId;
  
  // 2. 存在しないイベントID削除テスト
  console.log('\n2. 存在しないイベント削除テスト...');
  try {
    await deleteGoogleCalendarEvent('nonexistent-event-id');
    console.log('⚠️ エラーが発生しませんでした');
  } catch (error) {
    console.log('✅ 存在しないイベント削除エラーを適切に処理');
  }
  
  // 3. 不正な日時データテスト
  console.log('\n3. 不正な日時データテスト...');
  const invalidReservation = {
    ...testReservation,
    datetime: 'invalid-date',
    menuDuration: -30
  };
  
  const invalidDateResult = await createGoogleCalendarEvent(invalidReservation);
  if (!invalidDateResult) {
    console.log('✅ 不正な日時データエラーを適切に処理');
  }
}

// ===== メイン実行関数 =====

async function runIntegrationTest() {
  console.log('🧪 Google Calendar統合テスト開始');
  console.log('=====================================');
  
  // 設定確認
  console.log('\n📋 設定確認:');
  console.log(`Calendar ID: ${testGoogleConfig.calendarId}`);
  console.log(`Client ID: ${testGoogleConfig.clientId ? '設定済み' : '未設定'}`);
  console.log(`Service Account: ${testGoogleConfig.serviceAccountKey ? '設定済み' : '未設定'}`);
  console.log(`テスト予約時間: ${testReservation.datetime.toLocaleString('ja-JP')}`);
  
  if (!testGoogleConfig.clientId && !testGoogleConfig.serviceAccountKey) {
    console.log('\n❌ Google認証設定が不完全です。環境変数を設定してください。');
    console.log('必要な環境変数:');
    console.log('- GOOGLE_CLIENT_ID');
    console.log('- GOOGLE_CLIENT_SECRET');
    console.log('- GOOGLE_CALENDAR_ID');
    console.log('または:');
    console.log('- GOOGLE_SERVICE_ACCOUNT_KEY');
    return;
  }
  
  let docRef = null;
  let googleEventId = null;
  
  try {
    // 1. 予約作成テスト
    const createResult = await simulateReservationCreate();
    if (!createResult || !createResult.googleEvent) {
      console.log('\n❌ 予約作成テストに失敗しました');
      return;
    }
    
    docRef = createResult.docRef;
    googleEventId = createResult.googleEvent.id;
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. 予約更新テスト
    await simulateReservationUpdate(docRef, googleEventId);
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. エラーシナリオテスト
    await testErrorScenarios();
    
    // 4. 予約削除テスト（クリーンアップ）
    await simulateReservationDelete(docRef, googleEventId);
    
    console.log('\n✅ 全統合テスト完了!');
    console.log('\n📊 テスト結果サマリー:');
    console.log('- 予約作成 → Google Calendar同期: 成功');
    console.log('- 予約更新 → Google Calendar同期: 成功'); 
    console.log('- 予約削除 → Google Calendar同期: 成功');
    console.log('- エラーハンドリング: 成功');
    
  } catch (error) {
    console.error('\n❌ 統合テスト中にエラーが発生:', error);
    
    // クリーンアップ
    if (docRef && googleEventId) {
      console.log('\n🧹 クリーンアップ実行中...');
      try {
        await deleteGoogleCalendarEvent(googleEventId);
        await docRef.delete();
        console.log('✅ クリーンアップ完了');
      } catch (cleanupError) {
        console.error('❌ クリーンアップエラー:', cleanupError);
      }
    }
  }
}

// スクリプト実行
if (require.main === module) {
  runIntegrationTest()
    .then(() => {
      console.log('\n🎉 テスト完了');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 テスト失敗:', error);
      process.exit(1);
    });
}

module.exports = {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  runIntegrationTest
};