// 予約確定処理 - Salone Ponte

// 確認画面読み込み
function loadConfirmation() {
  // 予約サマリー更新
  document.getElementById('summaryMenu').textContent = selectedMenu.name;
  document.getElementById('summaryStaff').textContent = selectedStaff.name;
  document.getElementById('summaryDatetime').textContent = 
    selectedTime.toLocaleDateString('ja-JP', { 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    }) + ' ' + 
    selectedTime.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  document.getElementById('summaryPrice').textContent = `¥${selectedMenu.price.toLocaleString()}`;
  
  // 顧客フォーム表示制御
  if (isExistingCustomer) {
    document.getElementById('customerForm').style.display = 'none';
    document.getElementById('existingCustomerNote').style.display = 'block';
  } else {
    document.getElementById('customerForm').style.display = 'block';
    document.getElementById('existingCustomerNote').style.display = 'none';
    // LINE名を初期値に設定
    document.getElementById('customerName').value = userName || '';
  }
}

// 予約確定処理
async function submitBooking() {
  try {
    // 入力値検証
    if (!selectedMenu || !selectedStaff || !selectedTime) {
      showError('予約情報が不完全です。最初からやり直してください。');
      return;
    }

    // 顧客情報取得
    let customerName, customerPhone, customerNote;
    
    if (isExistingCustomer) {
      // 既存顧客の場合
      try {
        const customerDoc = await db.collection("customers").doc(userId).get();
        const customerData = customerDoc.data();
        customerName = customerData.name || userName;
        customerPhone = customerData.phone || '';
      } catch (error) {
        customerName = userName;
        customerPhone = '';
      }
      customerNote = document.getElementById('returnCustomerNote').value.trim();
    } else {
      // 新規顧客の場合
      customerName = document.getElementById('customerName').value.trim();
      customerPhone = document.getElementById('customerPhone').value.trim();
      customerNote = document.getElementById('customerNote').value.trim();
      
      if (!customerName || !customerPhone) {
        showError('お名前と電話番号は必須です。');
        return;
      }
    }

    // 予約データ作成
    const reservationData = {
      customerId: userId,
      name: customerName,
      phone: customerPhone,
      menuId: selectedMenu.id,
      menuName: selectedMenu.name,
      menuPrice: selectedMenu.price,
      menuDuration: selectedMenu.duration,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      datetime: selectedTime.toISOString(),
      note: customerNote,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      lineUserId: userId,
      userId: userId
    };

    // Firebase に保存
    try {
      const docRef = await db.collection('reservations').add(reservationData);
      reservationData.id = docRef.id;
      
      // 顧客データ更新 or 新規作成
      await updateCustomerData(reservationData);
      
      // Google Calendar 連携
      await syncToGoogleCalendar(reservationData);
      
      // 予約完了メッセージを自動送信
      await sendReservationConfirmationMessage(reservationData);
      
      // リマインダーシステムのスケジュール設定
      if (typeof reminderSystem !== 'undefined') {
        await reminderSystem.scheduleReminders(reservationData);
      }
      
    } catch (firebaseError) {
      console.log('Firebase保存エラー:', firebaseError);
      // Firebaseエラーでも続行（管理システム連携は実行）
      
      // エラーでもメッセージ送信は試行
      try {
        await sendReservationConfirmationMessage(reservationData);
      } catch (messageError) {
        console.log('メッセージ送信もエラー:', messageError);
      }
    }

    // 管理システムへの自動連携
    const managementData = {
      id: reservationData.id || 'temp_' + Date.now(),
      customerId: userId,
      name: customerName,
      phone: customerPhone,
      menuId: selectedMenu.id,
      menuName: selectedMenu.name,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      datetime: selectedTime.toISOString(),
      price: selectedMenu.price,
      duration: selectedMenu.duration,
      note: customerNote
    };

    // 管理システムに連携
    try {
      if (window.opener && window.opener.salonSystem) {
        window.opener.salonSystem.processNewReservation(managementData);
      } else if (window.parent && window.parent.salonSystem) {
        window.parent.salonSystem.processNewReservation(managementData);
      } else {
        // LocalStorageに一時保存
        const pendingReservations = JSON.parse(localStorage.getItem('pendingReservations') || '[]');
        pendingReservations.push(managementData);
        localStorage.setItem('pendingReservations', JSON.stringify(pendingReservations));
      }
    } catch (error) {
      console.log('管理システムへの連携に失敗:', error);
    }

    // 成功処理
    updateProgress(UI_CONFIG.PROGRESS_STEPS.COMPLETE.percent);
    showSuccess('予約が完了しました！確認メッセージをお送りしました。');
    
    // LIFF終了
    setTimeout(() => {
      try {
        if (liff && liff.isLoggedIn()) {
          liff.closeWindow();
        } else {
          showCompletionScreen(reservationData);
        }
      } catch (error) {
        showCompletionScreen(reservationData);
      }
    }, 2000);

  } catch (error) {
    console.error('予約エラー:', error);
    showError('予約の保存に失敗しました。もう一度お試しください。');
  }
}

// 顧客データ更新
async function updateCustomerData(reservationData) {
  try {
    if (isExistingCustomer) {
      // 既存顧客の予約履歴に追加
      const customerRef = db.collection('customers').doc(userId);
      const customerDoc = await customerRef.get();
      
      if (customerDoc.exists) {
        const customerData = customerDoc.data();
        const reservations = customerData.reservations || [];
        reservations.push({
          id: reservationData.id,
          datetime: selectedTime.toISOString(),
          menu: selectedMenu.name,
          staff: selectedStaff.name,
          price: selectedMenu.price,
          note: reservationData.note
        });
        
        await customerRef.update({
          reservations: reservations,
          lastReservation: selectedTime.toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } else {
      // 新規顧客データ作成
      const customerData = {
        name: reservationData.name,
        phone: reservationData.phone,
        lineUserId: userId,
        reservations: [{
          id: reservationData.id,
          datetime: selectedTime.toISOString(),
          menu: selectedMenu.name,
          staff: selectedStaff.name,
          price: selectedMenu.price,
          note: reservationData.note
        }],
        createdAt: new Date().toISOString(),
        lastReservation: selectedTime.toISOString()
      };
      
      await db.collection('customers').doc(userId).set(customerData);
    }
  } catch (error) {
    console.error('顧客データ更新エラー:', error);
  }
}

// 予約完了メッセージ自動送信（Firebase Cloud Functions経由）
async function sendReservationConfirmationMessage(reservationData) {
  try {
    console.log('📤 予約完了メッセージを送信中...');
    
    // Firebase Cloud Functions経由でLINEメッセージ送信
    const response = await fetch('https://us-central1-salone-ponte-fceca.cloudfunctions.net/sendLineMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineUserId: userId,
        type: 'flex',
        message: createReservationConfirmationFlexMessage(reservationData)
      })
    });

    if (response.ok) {
      console.log('✅ 予約完了メッセージ送信成功');
      
      // メッセージログをFirestoreに保存
      await saveMessageLog(reservationData, 'reservation_confirmation');
      
    } else {
      console.warn('⚠️ メッセージ送信APIエラー:', response.status);
      
      // フォールバック: シンプルなテキストメッセージを送信
      await sendFallbackMessage(reservationData);
    }
    
  } catch (error) {
    console.error('❌ 予約完了メッセージ送信エラー:', error);
    
    // フォールバック処理
    await sendFallbackMessage(reservationData);
  }
}

// Flex Message形式の予約確認メッセージ作成
function createReservationConfirmationFlexMessage(reservationData) {
  const dateTime = new Date(reservationData.datetime);
  const dateStr = dateTime.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const timeStr = dateTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return {
    altText: '【予約確定】ご予約ありがとうございます',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '予約確定',
            weight: 'bold',
            color: '#ffffff',
            size: 'lg',
            align: 'center'
          },
          {
            type: 'text',
            text: 'ご予約ありがとうございます！',
            color: '#ffffff',
            size: 'sm',
            align: 'center',
            margin: 'md'
          }
        ],
        backgroundColor: '#28a745',
        paddingAll: 'lg'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${reservationData.name}様`,
            weight: 'bold',
            size: 'lg',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '日時', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: `${dateStr}`, flex: 3, weight: 'bold', size: 'sm', wrap: true }
                ],
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '時間', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: timeStr, flex: 3, weight: 'bold', size: 'lg', color: '#007bff' }
                ],
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'メニュー', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: reservationData.menuName, flex: 3, weight: 'bold', size: 'sm', wrap: true }
                ],
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '担当', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: reservationData.staffName, flex: 3, weight: 'bold', size: 'sm' }
                ],
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '料金', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: `¥${reservationData.menuPrice.toLocaleString()}`, flex: 3, weight: 'bold', size: 'sm', color: '#28a745' }
                ],
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: '所要時間', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: `約${reservationData.menuDuration}分`, flex: 3, size: 'sm' }
                ],
                margin: 'sm'
              }
            ],
            margin: 'lg'
          },
          ...(reservationData.note ? [{
            type: 'separator',
            margin: 'lg'
          }, {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'ご要望・備考',
                color: '#666666',
                size: 'sm',
                margin: 'md'
              },
              {
                type: 'text',
                text: reservationData.note,
                size: 'sm',
                wrap: true,
                margin: 'sm'
              }
            ]
          }] : []),
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'text',
            text: '当日はお待ちしております。\nご不明な点がございましたらお気軽にお声かけください。',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'lg'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '予約を変更・キャンセル',
              uri: `https://salone-ponte-fceca.web.app/reservation-management.html?id=${reservationData.id}`
            },
            style: 'secondary',
            margin: 'sm'
          },
          {
            type: 'text',
            text: 'Salone Ponte',
            size: 'xs',
            color: '#999999',
            align: 'center',
            margin: 'lg'
          }
        ]
      }
    }
  };
}

// フォールバック用シンプルメッセージ送信
async function sendFallbackMessage(reservationData) {
  try {
    const dateTime = new Date(reservationData.datetime);
    const fallbackMessage = `【予約確定】Salone Ponte

${reservationData.name}様

ご予約ありがとうございます！

■ 予約内容
日時：${dateTime.toLocaleDateString('ja-JP')} ${dateTime.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}
メニュー：${reservationData.menuName}
担当：${reservationData.staffName}
料金：¥${reservationData.menuPrice.toLocaleString()}
所要時間：約${reservationData.menuDuration}分

${reservationData.note ? `備考：${reservationData.note}\n\n` : ''}当日お待ちしております。
ご不明な点がございましたらお気軽にお声かけください。

Salone Ponte`;

    const response = await fetch('https://us-central1-salone-ponte-fceca.cloudfunctions.net/sendLineMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineUserId: userId,
        type: 'text',
        message: fallbackMessage
      })
    });

    if (response.ok) {
      console.log('✅ フォールバックメッセージ送信成功');
    } else {
      console.warn('⚠️ フォールバックメッセージも失敗');
    }

  } catch (error) {
    console.error('❌ フォールバックメッセージ送信エラー:', error);
  }
}

// メッセージログをFirestoreに保存
async function saveMessageLog(reservationData, messageType) {
  try {
    const messageLogData = {
      customerId: userId,
      reservationId: reservationData.id,
      messageType: messageType,
      sentAt: new Date(),
      status: 'sent',
      recipient: {
        lineUserId: userId,
        name: reservationData.name
      },
      content: {
        type: 'reservation_confirmation',
        reservationDate: reservationData.datetime,
        menuName: reservationData.menuName,
        staffName: reservationData.staffName
      }
    };

    await db.collection('message_logs').add(messageLogData);
    console.log('✅ メッセージログ保存完了');

  } catch (error) {
    console.error('❌ メッセージログ保存エラー:', error);
  }
}

// 予約確認メッセージ送信（従来関数 - 互換性維持）
async function sendConfirmationMessage(reservationData) {
  try {
    const message = `【予約確認】Salone Ponte

${reservationData.name} 様

ご予約ありがとうございます。

■ 予約内容
日時：${selectedTime.toLocaleDateString('ja-JP')} ${selectedTime.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}
メニュー：${reservationData.menuName}
担当：${reservationData.staffName}
料金：¥${reservationData.menuPrice.toLocaleString()}
所要時間：約${reservationData.menuDuration}分

${reservationData.note ? `備考：${reservationData.note}` : ''}

当日お待ちしております。
ご不明な点がございましたらお気軽にお声かけください。

Salone Ponte`;

    // LINEメッセージ送信（LIFF環境の場合）
    if (liff && liff.isLoggedIn()) {
      try {
        await liff.sendMessages([{
          type: 'text',
          text: message
        }]);
      } catch (error) {
        console.log('LINEメッセージ送信エラー:', error);
      }
    }

    // Firebase メッセージ履歴に保存
    const messageData = {
      customerId: userId,
      content: message,
      sender: 'salon',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'reservation_confirmation'
    };

    try {
      await db.collection('messages').add(messageData);
    } catch (error) {
      console.log('メッセージ履歴保存エラー:', error);
    }

  } catch (error) {
    console.error('確認メッセージ送信エラー:', error);
  }
}

/**
 * Google Calendar に予約を同期
 */
async function syncToGoogleCalendar(reservationData) {
  try {
    // Google Calendar API が利用可能かチェック
    if (typeof window.GoogleCalendarAPI === 'undefined') {
      console.log('ℹ️ Google Calendar API が利用できません');
      return;
    }
    
    console.log('📅 Google Calendar に予約を同期中...');
    
    // 予約イベントを作成
    const event = await window.GoogleCalendarAPI.createEvent(reservationData);
    
    if (event && event.id) {
      // Google Event ID を予約データに保存
      await db.collection('reservations').doc(reservationData.id).update({
        googleEventId: event.id,
        googleSyncedAt: new Date()
      });
      
      console.log('✅ Google Calendar 同期完了:', event.id);
    }
    
  } catch (error) {
    console.error('❌ Google Calendar 同期エラー:', error);
    // 同期エラーは予約確定を妨げない
  }
}

/**
 * 予約キャンセル時のGoogle Calendar同期
 */
async function syncReservationCancellation(reservationId) {
  try {
    if (typeof window.GoogleCalendarAPI === 'undefined') {
      console.log('ℹ️ Google Calendar API が利用できません');
      return;
    }
    
    // 予約データを取得してGoogle Event IDを確認
    const reservationDoc = await db.collection('reservations').doc(reservationId).get();
    const reservationData = reservationDoc.data();
    
    if (reservationData && reservationData.googleEventId) {
      console.log('📅 Google Calendar イベントを削除中...');
      await window.GoogleCalendarAPI.syncCancellation(reservationId, reservationData.googleEventId);
      console.log('✅ Google Calendar キャンセル同期完了');
    }
    
  } catch (error) {
    console.error('❌ Google Calendar キャンセル同期エラー:', error);
  }
}

/**
 * 予約変更時のGoogle Calendar同期
 */
async function syncReservationUpdate(reservationData) {
  try {
    if (typeof window.GoogleCalendarAPI === 'undefined') {
      console.log('ℹ️ Google Calendar API が利用できません');
      return;
    }
    
    if (reservationData.googleEventId) {
      console.log('📅 Google Calendar イベントを更新中...');
      const updatedEvent = await window.GoogleCalendarAPI.updateEvent(reservationData, reservationData.googleEventId);
      
      if (updatedEvent) {
        // 同期時刻を更新
        await db.collection('reservations').doc(reservationData.id).update({
          googleSyncedAt: new Date()
        });
        console.log('✅ Google Calendar 更新同期完了:', updatedEvent.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Google Calendar 更新同期エラー:', error);
  }
}