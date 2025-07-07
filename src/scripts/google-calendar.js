// Google Calendar API 連携 - Salone Ponte
// Googleカレンダーとの同期機能

// Google API設定
let googleConfig = null;
let googleAuth = null;
let calendarAPI = null;

// 認証状態
let isGoogleAuthenticated = false;

/**
 * Google Calendar APIの初期化
 */
async function initializeGoogleCalendar() {
  try {
    console.log('🔄 Google Calendar API初期化中...');
    
    // 環境設定の取得
    const envConfig = getEnvConfig();
    googleConfig = envConfig.getGoogleCalendarConfig();
    
    // Google API設定の検証
    if (!googleConfig.clientId || googleConfig.clientId === 'your_google_client_id_here') {
      console.warn('⚠️ Google Calendar API設定が未完了です');
      updateSyncStatus('disconnected', 'API設定が必要');
      return false;
    }
    
    // Google API の読み込み完了を待機
    await waitForGoogleAPI();
    
    // Google API Client の初期化
    await gapi.load('auth2:client', async () => {
      await gapi.client.init({
        apiKey: googleConfig.apiKey,
        clientId: googleConfig.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });
      
      googleAuth = gapi.auth2.getAuthInstance();
      
      // 認証状態の確認
      if (googleAuth.isSignedIn.get()) {
        isGoogleAuthenticated = true;
        updateSyncStatus('connected', '同期済み');
        console.log('✅ Google Calendar 認証済み');
      } else {
        updateSyncStatus('disconnected', '未認証');
        console.log('ℹ️ Google Calendar 未認証');
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Google Calendar API初期化エラー:', error);
    updateSyncStatus('disconnected', 'エラー');
    return false;
  }
}

/**
 * Google APIの読み込み完了を待機
 */
function waitForGoogleAPI() {
  return new Promise((resolve) => {
    if (typeof gapi !== 'undefined') {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (typeof gapi !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

/**
 * Google認証の実行
 */
async function authenticateGoogle() {
  try {
    console.log('🔐 Google認証を開始...');
    showSyncSpinner(true);
    
    if (!googleAuth) {
      throw new Error('Google Auth が初期化されていません');
    }
    
    // サインイン実行
    const authResult = await googleAuth.signIn();
    
    if (authResult && googleAuth.isSignedIn.get()) {
      isGoogleAuthenticated = true;
      updateSyncStatus('connected', '認証完了');
      
      // 認証後の初回同期
      await syncWithGoogleCalendar();
      
      console.log('✅ Google認証成功');
      showSuccess('Googleカレンダーとの連携が完了しました');
      
    } else {
      throw new Error('認証に失敗しました');
    }
    
  } catch (error) {
    console.error('❌ Google認証エラー:', error);
    updateSyncStatus('disconnected', '認証失敗');
    showError('Google認証に失敗しました: ' + error.message);
    
  } finally {
    showSyncSpinner(false);
  }
}

/**
 * Googleカレンダーとの同期
 */
async function syncWithGoogleCalendar() {
  if (!isGoogleAuthenticated) {
    console.warn('⚠️ Google未認証のため同期をスキップ');
    return;
  }
  
  try {
    console.log('🔄 Googleカレンダーと同期中...');
    showSyncSpinner(true);
    updateSyncStatus('connected', '同期中...');
    
    // 予約データの取得（過去1ヶ月〜未来3ヶ月）
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    // Firestoreから予約データを取得
    const reservations = await getReservationsFromFirestore(startDate, endDate);
    
    // Googleカレンダーから既存イベントを取得
    const existingEvents = await getGoogleCalendarEvents(startDate, endDate);
    
    // 同期処理
    await syncReservationsWithGoogle(reservations, existingEvents);
    
    updateSyncStatus('connected', '同期完了');
    updateLastSyncTime();
    
    console.log('✅ Googleカレンダー同期完了');
    
  } catch (error) {
    console.error('❌ Googleカレンダー同期エラー:', error);
    updateSyncStatus('connected', '同期エラー');
    showError('同期に失敗しました: ' + error.message);
    
  } finally {
    showSyncSpinner(false);
  }
}

/**
 * Firestoreから予約データを取得
 */
async function getReservationsFromFirestore(startDate, endDate) {
  try {
    const snapshot = await db.collection('reservations')
      .where('datetime', '>=', startDate)
      .where('datetime', '<=', endDate)
      .get();
    
    const reservations = [];
    snapshot.forEach(doc => {
      reservations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return reservations;
    
  } catch (error) {
    console.error('❌ 予約データ取得エラー:', error);
    return [];
  }
}

/**
 * Googleカレンダーからイベントを取得
 */
async function getGoogleCalendarEvents(startDate, endDate) {
  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: googleConfig.calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    return response.result.items || [];
    
  } catch (error) {
    console.error('❌ Googleカレンダーイベント取得エラー:', error);
    return [];
  }
}

/**
 * 予約データとGoogleカレンダーを同期
 */
async function syncReservationsWithGoogle(reservations, existingEvents) {
  const syncResults = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: 0
  };
  
  // 予約データをGoogleカレンダーに反映
  for (const reservation of reservations) {
    try {
      const existingEvent = findMatchingEvent(reservation, existingEvents);
      
      if (!existingEvent) {
        // 新規イベント作成
        await createGoogleCalendarEvent(reservation);
        syncResults.created++;
        
      } else if (isEventUpdateNeeded(reservation, existingEvent)) {
        // 既存イベント更新
        await updateGoogleCalendarEvent(reservation, existingEvent);
        syncResults.updated++;
      }
      
    } catch (error) {
      console.error(`予約 ${reservation.id} の同期エラー:`, error);
      syncResults.errors++;
    }
  }
  
  console.log('🔄 同期結果:', syncResults);
  return syncResults;
}

/**
 * Googleカレンダーイベントを作成
 */
async function createGoogleCalendarEvent(reservation) {
  const event = createEventFromReservation(reservation);
  
  const response = await gapi.client.calendar.events.insert({
    calendarId: googleConfig.calendarId,
    resource: event
  });
  
  // 予約データにGoogleイベントIDを保存
  await db.collection('reservations').doc(reservation.id).update({
    googleEventId: response.result.id,
    googleSyncedAt: new Date()
  });
  
  console.log(`✅ Googleイベント作成: ${reservation.id}`);
  return response.result;
}

/**
 * Googleカレンダーイベントを更新
 */
async function updateGoogleCalendarEvent(reservation, existingEvent) {
  const updatedEvent = createEventFromReservation(reservation);
  
  const response = await gapi.client.calendar.events.update({
    calendarId: googleConfig.calendarId,
    eventId: existingEvent.id,
    resource: updatedEvent
  });
  
  // 同期時刻を更新
  await db.collection('reservations').doc(reservation.id).update({
    googleSyncedAt: new Date()
  });
  
  console.log(`✅ Googleイベント更新: ${reservation.id}`);
  return response.result;
}

/**
 * 予約データからGoogleイベントを作成
 */
function createEventFromReservation(reservation) {
  const startTime = new Date(reservation.datetime);
  const endTime = new Date(startTime.getTime() + (reservation.duration || 60) * 60000);
  
  return {
    summary: `【サロンポンテ】${reservation.name} - ${reservation.menuName}`,
    description: `
顧客: ${reservation.name}
メニュー: ${reservation.menuName}
スタッフ: ${reservation.staffName}
料金: ¥${reservation.menuPrice || 0}
電話: ${reservation.phone || ''}

※ Salone Ponte 予約システムより自動作成
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
    attendees: reservation.email ? [{ email: reservation.email }] : [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },  // 1時間前
        { method: 'popup', minutes: 15 }   // 15分前
      ]
    },
    extendedProperties: {
      private: {
        salonePonte: 'true',
        reservationId: reservation.id,
        customerId: reservation.customerId || ''
      }
    }
  };
}

/**
 * 対応するGoogleイベントを検索
 */
function findMatchingEvent(reservation, events) {
  return events.find(event => {
    // 予約IDでの完全一致
    if (event.extendedProperties?.private?.reservationId === reservation.id) {
      return true;
    }
    
    // 時刻と内容での近似一致
    const eventStart = new Date(event.start.dateTime || event.start.date);
    const reservationStart = new Date(reservation.datetime);
    const timeDiff = Math.abs(eventStart.getTime() - reservationStart.getTime());
    
    if (timeDiff < 30 * 60 * 1000 && // 30分以内
        event.summary?.includes(reservation.name)) {
      return true;
    }
    
    return false;
  });
}

/**
 * イベント更新が必要かチェック
 */
function isEventUpdateNeeded(reservation, event) {
  const reservationStart = new Date(reservation.datetime);
  const eventStart = new Date(event.start.dateTime || event.start.date);
  
  // 時刻の変更チェック
  if (Math.abs(reservationStart.getTime() - eventStart.getTime()) > 60000) {
    return true;
  }
  
  // 内容の変更チェック
  const expectedSummary = `【サロンポンテ】${reservation.name} - ${reservation.menuName}`;
  if (event.summary !== expectedSummary) {
    return true;
  }
  
  return false;
}

/**
 * Googleイベントを削除
 */
async function deleteGoogleCalendarEvent(eventId) {
  try {
    await gapi.client.calendar.events.delete({
      calendarId: googleConfig.calendarId,
      eventId: eventId
    });
    
    console.log(`✅ Googleイベント削除: ${eventId}`);
    
  } catch (error) {
    console.error(`❌ Googleイベント削除エラー: ${eventId}`, error);
    throw error;
  }
}

/**
 * 予約キャンセル時のGoogle同期
 */
async function syncReservationCancellation(reservationId, googleEventId) {
  if (!isGoogleAuthenticated || !googleEventId) {
    return;
  }
  
  try {
    await deleteGoogleCalendarEvent(googleEventId);
    
    // 予約データのGoogle関連情報をクリア
    await db.collection('reservations').doc(reservationId).update({
      googleEventId: null,
      googleSyncedAt: new Date()
    });
    
  } catch (error) {
    console.error('❌ 予約キャンセル同期エラー:', error);
  }
}

// UI更新関数

/**
 * 同期ステータスの更新
 */
function updateSyncStatus(status, message) {
  const statusElement = document.getElementById('googleSyncStatus');
  const textElement = document.getElementById('syncStatusText');
  
  if (statusElement && textElement) {
    statusElement.className = `google-sync-status ${status}`;
    textElement.textContent = message;
    
    // 同期ボタンの有効/無効
    const syncBtn = document.getElementById('syncCalendarBtn');
    if (syncBtn) {
      syncBtn.disabled = status !== 'connected';
    }
  }
}

/**
 * 同期スピナーの表示/非表示
 */
function showSyncSpinner(show) {
  const spinner = document.getElementById('syncSpinner');
  if (spinner) {
    spinner.classList.toggle('hidden', !show);
  }
}

/**
 * 最終同期時刻の更新
 */
function updateLastSyncTime() {
  const element = document.getElementById('lastSyncTime');
  if (element) {
    const now = new Date();
    element.textContent = now.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// ユーティリティ関数

/**
 * エラーメッセージの表示
 */
function showError(message) {
  alert('エラー: ' + message);
}

/**
 * 成功メッセージの表示
 */
function showSuccess(message) {
  alert('成功: ' + message);
}

// モーダル制御

/**
 * Google認証モーダルを開く
 */
function openGoogleAuthModal() {
  document.getElementById('googleAuthModal').classList.add('active');
}

/**
 * Google認証モーダルを閉じる
 */
function closeGoogleAuthModal() {
  document.getElementById('googleAuthModal').classList.remove('active');
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', function() {
  // Google認証ボタン
  document.getElementById('googleAuthBtn')?.addEventListener('click', openGoogleAuthModal);
  
  // 認証実行ボタン
  document.getElementById('authenticateGoogleBtn')?.addEventListener('click', async () => {
    closeGoogleAuthModal();
    await authenticateGoogle();
  });
  
  // 同期ボタン
  document.getElementById('syncCalendarBtn')?.addEventListener('click', syncWithGoogleCalendar);
  
  // Googleカレンダー取込ボタン
  document.getElementById('importCalendarBtn')?.addEventListener('click', async () => {
    try {
      if (!isGoogleAuthenticated) {
        alert('最初にGoogle認証を行ってください');
        return;
      }
      
      const startDate = new Date();
      const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3ヶ月後まで
      
      const result = await importReservationsFromGoogle(startDate, endDate);
      alert(`取り込み完了\nインポート: ${result.imported}件\nスキップ: ${result.skipped}件`);
      
      // カレンダー表示を更新
      if (typeof window.CalendarDisplay !== 'undefined') {
        await window.CalendarDisplay.render();
      }
      
    } catch (error) {
      alert('取り込みに失敗しました: ' + error.message);
    }
  });
  
  // 双方向同期ボタン
  document.getElementById('bidirectionalSyncBtn')?.addEventListener('click', async () => {
    try {
      if (!isGoogleAuthenticated) {
        alert('最初にGoogle認証を行ってください');
        return;
      }
      
      await performBidirectionalSync();
      
      // カレンダー表示を更新
      if (typeof window.CalendarDisplay !== 'undefined') {
        await window.CalendarDisplay.render();
      }
      
    } catch (error) {
      alert('双方向同期に失敗しました: ' + error.message);
    }
  });
  
  // 初期化
  initializeGoogleCalendar();
});

/**
 * Google Calendar イベントから予約データを生成
 */
function createReservationFromEvent(event) {
  // Salone Ponte 関連のイベントかチェック
  if (!event.extendedProperties?.private?.salonePonte) {
    return null;
  }
  
  const startTime = new Date(event.start.dateTime || event.start.date);
  const endTime = new Date(event.end.dateTime || event.end.date);
  const duration = Math.round((endTime - startTime) / (1000 * 60)); // 分
  
  // イベントタイトルから顧客名とメニューを抽出
  const titleMatch = event.summary?.match(/【サロンポンテ】(.+?) - (.+)/);
  if (!titleMatch) {
    return null;
  }
  
  const [, customerName, menuName] = titleMatch;
  
  return {
    id: event.extendedProperties.private.reservationId || `google_${event.id}`,
    googleEventId: event.id,
    name: customerName,
    menuName: menuName,
    datetime: startTime.toISOString(),
    duration: duration,
    description: event.description || '',
    status: 'confirmed',
    source: 'google_calendar',
    googleSyncedAt: new Date()
  };
}

/**
 * Google Calendar から予約情報をインポート
 */
async function importReservationsFromGoogle(startDate, endDate) {
  if (!isGoogleAuthenticated) {
    throw new Error('Google認証が必要です');
  }
  
  try {
    console.log('📥 Google Calendar から予約データをインポート中...');
    
    // Google Calendar からイベントを取得
    const events = await getGoogleCalendarEvents(startDate, endDate);
    
    const importResults = {
      total: events.length,
      imported: 0,
      skipped: 0,
      errors: 0
    };
    
    // 各イベントを処理
    for (const event of events) {
      try {
        const reservationData = createReservationFromEvent(event);
        
        if (!reservationData) {
          importResults.skipped++;
          continue;
        }
        
        // 既存の予約かチェック
        const existingReservation = await db.collection('reservations')
          .where('googleEventId', '==', event.id)
          .get();
        
        if (!existingReservation.empty) {
          importResults.skipped++;
          continue;
        }
        
        // 新規予約として保存
        await db.collection('reservations').add(reservationData);
        importResults.imported++;
        
        console.log(`✅ インポート完了: ${reservationData.name} - ${reservationData.menuName}`);
        
      } catch (error) {
        console.error('イベントインポートエラー:', error);
        importResults.errors++;
      }
    }
    
    console.log('📥 インポート結果:', importResults);
    return importResults;
    
  } catch (error) {
    console.error('❌ Google Calendar インポートエラー:', error);
    throw error;
  }
}

/**
 * 予約データとGoogle Calendar の双方向同期
 */
async function performBidirectionalSync() {
  if (!isGoogleAuthenticated) {
    throw new Error('Google認証が必要です');
  }
  
  try {
    console.log('🔄 双方向同期を開始...');
    showSyncSpinner(true);
    updateSyncStatus('connected', '双方向同期中...');
    
    const now = new Date();
    const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3ヶ月後まで
    
    // 1. Firestore → Google Calendar 同期
    await syncWithGoogleCalendar();
    
    // 2. Google Calendar → Firestore 同期（インポート）
    const importResults = await importReservationsFromGoogle(now, endDate);
    
    // 3. 結果表示
    updateSyncStatus('connected', '双方向同期完了');
    updateLastSyncTime();
    
    const message = `双方向同期完了\n` +
      `インポート: ${importResults.imported}件\n` +
      `スキップ: ${importResults.skipped}件\n` +
      `エラー: ${importResults.errors}件`;
    
    showSuccess(message);
    console.log('✅ 双方向同期完了');
    
  } catch (error) {
    console.error('❌ 双方向同期エラー:', error);
    updateSyncStatus('connected', '同期エラー');
    showError('双方向同期に失敗しました: ' + error.message);
    
  } finally {
    showSyncSpinner(false);
  }
}

// エクスポート
if (typeof window !== 'undefined') {
  window.GoogleCalendarAPI = {
    initialize: initializeGoogleCalendar,
    authenticate: authenticateGoogle,
    sync: syncWithGoogleCalendar,
    createEvent: createGoogleCalendarEvent,
    updateEvent: updateGoogleCalendarEvent,
    deleteEvent: deleteGoogleCalendarEvent,
    syncCancellation: syncReservationCancellation,
    importReservations: importReservationsFromGoogle,
    bidirectionalSync: performBidirectionalSync
  };
}