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
      
    } catch (firebaseError) {
      console.log('Firebase保存エラー:', firebaseError);
      // Firebaseエラーでも続行（管理システム連携は実行）
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

    // 予約完了メッセージをLINEに送信（Firebase Cloud Functionsで自動実行）
    // sendReservationConfirmation関数が新しい予約作成時に自動で実行される

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

// 予約確認メッセージ送信
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