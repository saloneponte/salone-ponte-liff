// メッセージ配信機能 - Salone Ponte
// LINEトーク風インターフェースでのメッセージ送信

// グローバル変数
let customers = [];
let selectedCustomer = null;
let messageHistory = {};

// DOM要素
const customerListElement = document.getElementById('customerList');
const chatAreaElement = document.getElementById('chatArea');
const messageInputElement = document.getElementById('messageInput');
const sendBtnElement = document.getElementById('sendBtn');
const chatHeaderElement = document.getElementById('chatHeader');
const messageInputAreaElement = document.getElementById('messageInputArea');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  initializeMessageBroadcast();
  setupEventListeners();
});

/**
 * メッセージ配信機能の初期化
 */
async function initializeMessageBroadcast() {
  try {
    console.log('🚀 メッセージ配信機能を初期化中...');
    
    // 顧客データの読み込み
    await loadCustomers();
    
    // メッセージ履歴の読み込み
    await loadMessageHistory();
    
    console.log('✅ メッセージ配信機能の初期化完了');
  } catch (error) {
    console.error('❌ メッセージ配信機能の初期化エラー:', error);
    showError('メッセージ配信機能の初期化に失敗しました');
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // メッセージ入力のイベント
  messageInputElement.addEventListener('input', handleMessageInput);
  messageInputElement.addEventListener('keypress', handleKeyPress);
  
  // 送信ボタン
  sendBtnElement.addEventListener('click', sendMessage);
  
  // 顧客検索
  const customerSearchElement = document.getElementById('customerSearch');
  customerSearchElement.addEventListener('input', filterCustomers);
  
  // クイック返信ボタン
  document.querySelectorAll('.quick-reply').forEach(btn => {
    btn.addEventListener('click', function() {
      messageInputElement.value = this.textContent;
      handleMessageInput();
      messageInputElement.focus();
    });
  });
  
  // テンプレートボタン
  document.getElementById('templateBtn').addEventListener('click', openTemplateModal);
  
  // 一斉配信ボタン
  document.getElementById('broadcastBtn').addEventListener('click', openBroadcastModal);
  
  // テンプレート選択
  document.querySelectorAll('.template-bubble').forEach(template => {
    template.addEventListener('click', function() {
      const templateName = this.dataset.template;
      const templateType = this.dataset.type;
      selectTemplate(templateName, templateType);
    });
  });
}

/**
 * 顧客データの読み込み
 */
async function loadCustomers() {
  try {
    console.log('📊 顧客データを読み込み中...');
    
    // Firestoreから顧客データを取得
    const snapshot = await db.collection('customers')
      .orderBy('lastVisit', 'desc')
      .get();
    
    customers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      customers.push({
        id: doc.id,
        ...data,
        // LINE関連情報の確保
        lineUserId: data.lineUserId || data.lineId || null,
        profileImage: data.profileImage || null,
        lastMessage: data.lastMessage || '未送信',
        lastMessageTime: data.lastMessageTime || new Date(),
        unreadCount: data.unreadCount || 0
      });
    });
    
    console.log(`✅ ${customers.length}件の顧客データを読み込みました`);
    renderCustomerList();
    
  } catch (error) {
    console.error('❌ 顧客データの読み込みエラー:', error);
    
    // サンプルデータを表示（開発用）
    customers = generateSampleCustomers();
    renderCustomerList();
  }
}

/**
 * サンプル顧客データの生成（開発用）
 */
function generateSampleCustomers() {
  return [
    {
      id: 'customer1',
      name: '山田 花子',
      lineUserId: 'U1234567890abcdef1234567890abcdef',
      phone: '090-1234-5678',
      tags: ['VIP'],
      lastMessage: 'ありがとうございました！',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30分前
      unreadCount: 2
    },
    {
      id: 'customer2',
      name: '田中 太郎',
      lineUserId: 'U2345678901bcdef2345678901bcdef1',
      phone: '090-2345-6789',
      tags: ['常連'],
      lastMessage: '明日の予約は大丈夫です',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2時間前
      unreadCount: 0
    },
    {
      id: 'customer3',
      name: '佐藤 美香',
      lineUserId: 'U3456789012cdef3456789012cdef12',
      phone: '090-3456-7890',
      tags: ['新規'],
      lastMessage: 'よろしくお願いします',
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1日前
      unreadCount: 1
    }
  ];
}

/**
 * 顧客リストの表示
 */
function renderCustomerList(filteredCustomers = null) {
  const customersToShow = filteredCustomers || customers;
  
  customerListElement.innerHTML = customersToShow.map(customer => {
    const initial = customer.name.charAt(0);
    const timeAgo = getTimeAgo(customer.lastMessageTime);
    const tagClass = getTagClass(customer.tags);
    
    return `
      <div class="customer-list-item p-4 border-b cursor-pointer" 
           onclick="selectCustomer('${customer.id}')">
        <div class="flex items-center">
          <div class="customer-avatar mr-3">
            ${customer.profileImage 
              ? `<img src="${customer.profileImage}" alt="${customer.name}" class="w-full h-full object-cover rounded-full">` 
              : `<span>${initial}</span>`
            }
            ${customer.lineUserId ? '<div class="online-indicator"></div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center">
              <h4 class="font-medium text-gray-900 truncate">${customer.name}</h4>
              ${customer.unreadCount > 0 
                ? `<span class="unread-badge ml-2">${customer.unreadCount}</span>` 
                : `<span class="text-xs text-gray-500">${timeAgo}</span>`
              }
            </div>
            <p class="last-message">${customer.lastMessage}</p>
            ${customer.tags && customer.tags.length > 0 
              ? `<div class="mt-1">
                   ${customer.tags.map(tag => `<span class="tag ${tagClass}">${tag}</span>`).join(' ')}
                 </div>` 
              : ''
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 顧客を選択
 */
async function selectCustomer(customerId) {
  try {
    selectedCustomer = customers.find(c => c.id === customerId);
    if (!selectedCustomer) return;
    
    console.log('👤 顧客を選択:', selectedCustomer.name);
    
    // UIの更新
    updateCustomerSelection();
    updateChatHeader();
    await loadChatHistory();
    showChatInterface();
    
  } catch (error) {
    console.error('❌ 顧客選択エラー:', error);
    showError('顧客の選択に失敗しました');
  }
}

/**
 * 顧客選択状態の更新
 */
function updateCustomerSelection() {
  // すべての顧客リスト項目から active クラスを削除
  document.querySelectorAll('.customer-list-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 選択された顧客に active クラスを追加
  const selectedItem = document.querySelector(`[onclick="selectCustomer('${selectedCustomer.id}')"]`);
  if (selectedItem) {
    selectedItem.classList.add('active');
  }
}

/**
 * チャットヘッダーの更新
 */
function updateChatHeader() {
  const initial = selectedCustomer.name.charAt(0);
  
  document.getElementById('selectedCustomerInitial').textContent = initial;
  document.getElementById('selectedCustomerName').textContent = selectedCustomer.name;
  document.getElementById('selectedCustomerStatus').textContent = 
    selectedCustomer.lineUserId ? 'オンライン' : 'オフライン';
}

/**
 * チャット履歴の読み込み
 */
async function loadChatHistory() {
  try {
    console.log('💬 チャット履歴を読み込み中...');
    
    // Firestoreからメッセージ履歴を取得
    const snapshot = await db.collection('messages')
      .where('customerId', '==', selectedCustomer.id)
      .orderBy('timestamp', 'asc')
      .limit(50)
      .get();
    
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    messageHistory[selectedCustomer.id] = messages;
    renderChatMessages(messages);
    
    console.log(`✅ ${messages.length}件のメッセージを読み込みました`);
    
  } catch (error) {
    console.error('❌ チャット履歴の読み込みエラー:', error);
    
    // サンプルメッセージを表示
    const sampleMessages = generateSampleMessages();
    messageHistory[selectedCustomer.id] = sampleMessages;
    renderChatMessages(sampleMessages);
  }
}

/**
 * サンプルメッセージの生成
 */
function generateSampleMessages() {
  return [
    {
      id: 'msg1',
      text: 'いつもサロンポンテをご利用いただき、ありがとうございます。',
      sender: 'salon',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      type: 'text'
    },
    {
      id: 'msg2',
      text: 'ありがとうございます！次回もよろしくお願いします。',
      sender: 'customer',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text'
    }
  ];
}

/**
 * チャットメッセージの表示
 */
function renderChatMessages(messages) {
  const messagesHtml = messages.map(message => {
    const isSent = message.sender === 'salon';
    const bubbleClass = isSent ? 'message-sent' : 'message-received';
    const timeStr = formatMessageTime(message.timestamp);
    
    return `
      <div class="flex ${isSent ? 'justify-end' : 'justify-start'} mb-4">
        <div class="message-bubble ${bubbleClass}">
          <p>${escapeHtml(message.text)}</p>
          <div class="message-timestamp ${isSent ? 'text-blue-100' : 'text-gray-500'}">
            ${timeStr}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  chatAreaElement.innerHTML = messagesHtml;
  
  // 最新メッセージまでスクロール
  chatAreaElement.scrollTop = chatAreaElement.scrollHeight;
}

/**
 * チャットインターフェースの表示
 */
function showChatInterface() {
  chatHeaderElement.classList.remove('hidden');
  messageInputAreaElement.classList.remove('hidden');
  
  // 空状態メッセージを非表示
  const emptyState = chatAreaElement.querySelector('.text-center');
  if (emptyState) {
    emptyState.style.display = 'none';
  }
}

/**
 * メッセージ入力の処理
 */
function handleMessageInput() {
  const message = messageInputElement.value.trim();
  sendBtnElement.disabled = message.length === 0;
  
  // テキストエリアの高さを自動調整
  messageInputElement.style.height = 'auto';
  messageInputElement.style.height = messageInputElement.scrollHeight + 'px';
}

/**
 * キープレスの処理
 */
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    if (!sendBtnElement.disabled) {
      sendMessage();
    }
  }
}

/**
 * メッセージ送信
 */
async function sendMessage() {
  if (!selectedCustomer) {
    showError('顧客を選択してください');
    return;
  }
  
  const messageText = messageInputElement.value.trim();
  if (!messageText) return;
  
  try {
    console.log('📤 メッセージを送信中...', messageText);
    
    // Flex Messageかどうかを確認
    const flexTemplate = messageInputElement.dataset.flexTemplate;
    const isFlexMessage = flexTemplate && messageText.startsWith('[Flex Message:');
    
    let messageData, displayText;
    
    if (isFlexMessage) {
      // Flex Message送信の場合
      displayText = `[リッチメッセージ: ${flexTemplate}]`;
      
      // 顧客データでテンプレートを埋める
      const templateData = generateTemplateData(selectedCustomer, flexTemplate);
      const flexMessage = flexTemplateManager.populateTemplate(flexTemplate, templateData);
      
      messageData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        lineUserId: selectedCustomer.lineUserId,
        text: displayText,
        flexContent: flexMessage,
        sender: 'salon',
        timestamp: new Date(),
        type: 'flex',
        status: 'sent'
      };
      
      // UIに表示
      addMessageToChat(displayText, 'salon');
      
      // LINE Messaging APIでFlex Message送信
      if (selectedCustomer.lineUserId) {
        await sendLineFlexMessage(selectedCustomer.lineUserId, flexMessage, displayText);
      }
      
    } else {
      // 通常のテキストメッセージ
      displayText = messageText;
      
      messageData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        lineUserId: selectedCustomer.lineUserId,
        text: messageText,
        sender: 'salon',
        timestamp: new Date(),
        type: 'text',
        status: 'sent'
      };
      
      // UIに表示
      addMessageToChat(messageText, 'salon');
      
      // LINE Messaging APIでテキスト送信
      if (selectedCustomer.lineUserId) {
        await sendLineMessage(selectedCustomer.lineUserId, messageText);
      }
    }
    
    // 入力フィールドをクリア
    messageInputElement.value = '';
    delete messageInputElement.dataset.flexTemplate;
    handleMessageInput();
    
    // メッセージをFirestoreに保存
    const docRef = await db.collection('messages').add(messageData);
    console.log('✅ メッセージをFirestoreに保存:', docRef.id);
    
    // 顧客の最終メッセージ情報を更新
    await updateCustomerLastMessage(selectedCustomer.id, displayText, 'salon');
    
    console.log('✅ メッセージ送信完了');
    
  } catch (error) {
    console.error('❌ メッセージ送信エラー:', error);
    showError('メッセージの送信に失敗しました');
  }
}

/**
 * チャットにメッセージを追加
 */
function addMessageToChat(text, sender) {
  const isSent = sender === 'salon';
  const bubbleClass = isSent ? 'message-sent' : 'message-received';
  const timeStr = formatMessageTime(new Date());
  
  const messageHtml = `
    <div class="flex ${isSent ? 'justify-end' : 'justify-start'} mb-4">
      <div class="message-bubble ${bubbleClass}">
        <p>${escapeHtml(text)}</p>
        <div class="message-timestamp ${isSent ? 'text-blue-100' : 'text-gray-500'}">
          ${timeStr}
        </div>
      </div>
    </div>
  `;
  
  chatAreaElement.insertAdjacentHTML('beforeend', messageHtml);
  chatAreaElement.scrollTop = chatAreaElement.scrollHeight;
  
  // メッセージ履歴に追加
  if (!messageHistory[selectedCustomer.id]) {
    messageHistory[selectedCustomer.id] = [];
  }
  messageHistory[selectedCustomer.id].push({
    text,
    sender,
    timestamp: new Date(),
    type: 'text'
  });
}

/**
 * LINE Messaging APIでメッセージ送信
 */
async function sendLineMessage(lineUserId, messageText) {
  try {
    // 環境設定から Firebase プロジェクト ID を取得
    const envConfig = getEnvConfig();
    const projectId = envConfig.get('FIREBASE_PROJECT_ID');
    
    // Cloud Functionsのエンドポイント
    const functionUrl = `https://sendlinemessage-${projectId.toLowerCase()}.cloudfunctions.net/sendLineMessage`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lineUserId,
        message: messageText,
        type: 'text'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'LINEメッセージ送信APIエラー');
    }
    
    const result = await response.json();
    console.log('✅ LINEメッセージ送信完了:', result);
    
  } catch (error) {
    console.error('❌ LINEメッセージ送信エラー:', error);
    // LINEメッセージ送信に失敗してもチャット内での送信は成功とする
    // 開発環境では失敗を許容
    if (error.message.includes('fetch')) {
      console.warn('⚠️ 開発環境: LINEメッセージ送信をスキップ');
    }
  }
}

/**
 * 顧客の最終メッセージ情報を更新
 */
async function updateCustomerLastMessage(customerId, message, sender) {
  try {
    await db.collection('customers').doc(customerId).update({
      lastMessage: message,
      lastMessageTime: new Date(),
      lastMessageSender: sender
    });
    
    // ローカルの顧客データも更新
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      customer.lastMessage = message;
      customer.lastMessageTime = new Date();
    }
    
    // 顧客リストを再描画
    renderCustomerList();
    
  } catch (error) {
    console.error('❌ 顧客情報更新エラー:', error);
  }
}

/**
 * 顧客のフィルタリング
 */
function filterCustomers() {
  const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );
  
  renderCustomerList(filteredCustomers);
}

/**
 * メッセージ履歴の読み込み
 */
async function loadMessageHistory() {
  try {
    console.log('📝 メッセージ履歴を読み込み中...');
    // 実装予定: Firestoreからの履歴読み込み
    
  } catch (error) {
    console.error('❌ メッセージ履歴読み込みエラー:', error);
  }
}

/**
 * テンプレートモーダルを開く
 */
function openTemplateModal() {
  document.getElementById('templateModal').classList.add('active');
}

/**
 * テンプレートモーダルを閉じる
 */
function closeTemplateModal() {
  document.getElementById('templateModal').classList.remove('active');
}

/**
 * テンプレートを選択
 */
function selectTemplate(templateName, templateType = 'text') {
  try {
    if (templateType === 'text') {
      // テキストメッセージテンプレート
      const textTemplates = {
        greeting: 'いつもサロンポンテをご利用いただき、ありがとうございます。今後ともよろしくお願いいたします。',
        'simple-appointment': 'ご予約の確認をさせていただきます。お時間に変更はございませんでしょうか？',
        'thankyou-simple': '本日はご来店いただき、ありがとうございました。またのご利用をお待ちしております。'
      };
      
      messageInputElement.value = textTemplates[templateName] || '';
      handleMessageInput();
      
    } else if (templateType === 'flex') {
      // Flex Messageテンプレートの場合
      if (typeof flexTemplateManager === 'undefined') {
        throw new Error('Flex Templateマネージャーが読み込まれていません');
      }
      
      // プレビューを表示してから送信するかどうか確認
      showFlexTemplatePreview(templateName);
      return; // モーダルは閉じない
    }
    
    closeTemplateModal();
    messageInputElement.focus();
    
  } catch (error) {
    console.error('❌ テンプレート選択エラー:', error);
    showError('テンプレートの選択に失敗しました');
  }
}

/**
 * Flex Messageテンプレートのプレビューを表示
 */
function showFlexTemplatePreview(templateName) {
  try {
    // サンプルデータでテンプレートを生成
    const preview = flexTemplateManager.getTemplatePreview(templateName);
    
    // プレビューモーダルを作成・表示
    const previewHtml = `
      <div id="flexPreviewModal" class="modal active">
        <div class="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">Flex Messageプレビュー</h3>
          
          <div class="flex-message-preview mb-4">
            <div class="text-sm text-gray-600 mb-2">※ 実際のLINEトークでの表示イメージ</div>
            <div class="bg-gray-100 p-4 rounded-lg">
              <div class="text-xs text-gray-500 mb-2">Flex Message</div>
              <div class="bg-white rounded-lg p-3 shadow-sm">
                <pre class="text-xs overflow-x-auto whitespace-pre-wrap">${JSON.stringify(preview, null, 2)}</pre>
              </div>
            </div>
          </div>
          
          <div class="text-sm text-gray-600 mb-4">
            このテンプレートを使用しますか？実際の送信時には顧客情報に応じてデータが挿入されます。
          </div>
          
          <div class="flex justify-end space-x-3">
            <button onclick="closeFlexPreviewModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              キャンセル
            </button>
            <button onclick="useFlexTemplate('${templateName}')" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              このテンプレートを使用
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', previewHtml);
    
  } catch (error) {
    console.error('❌ プレビュー生成エラー:', error);
    showError('プレビューの生成に失敗しました');
  }
}

/**
 * Flex Messageテンプレートを使用
 */
function useFlexTemplate(templateName) {
  try {
    // 選択されたテンプレート名を記録（送信時に使用）
    messageInputElement.dataset.flexTemplate = templateName;
    messageInputElement.value = `[Flex Message: ${templateName}]`;
    
    closeFlexPreviewModal();
    closeTemplateModal();
    handleMessageInput();
    messageInputElement.focus();
    
  } catch (error) {
    console.error('❌ Flexテンプレート設定エラー:', error);
    showError('テンプレートの設定に失敗しました');
  }
}

/**
 * Flex Messageプレビューモーダルを閉じる
 */
function closeFlexPreviewModal() {
  const modal = document.getElementById('flexPreviewModal');
  if (modal) {
    modal.remove();
  }
}

/**
 * 一斉配信モーダルを開く
 */
function openBroadcastModal() {
  document.getElementById('broadcastModal').classList.add('active');
}

/**
 * 一斉配信モーダルを閉じる
 */
function closeBroadcastModal() {
  document.getElementById('broadcastModal').classList.remove('active');
}

/**
 * 一斉配信実行
 */
async function sendBroadcast() {
  const target = document.getElementById('broadcastTarget').value;
  const message = document.getElementById('broadcastMessage').value.trim();
  
  if (!message) {
    showError('メッセージを入力してください');
    return;
  }
  
  try {
    console.log('📢 一斉配信を開始:', target, message);
    
    // 配信対象の顧客を選択
    let targetCustomers = customers;
    switch (target) {
      case 'vip':
        targetCustomers = customers.filter(c => c.tags && c.tags.includes('VIP'));
        break;
      case 'regular':
        targetCustomers = customers.filter(c => c.tags && c.tags.includes('常連'));
        break;
      case 'new':
        targetCustomers = customers.filter(c => c.tags && c.tags.includes('新規'));
        break;
    }
    
    // 配信確認
    const confirmMessage = `${targetCustomers.length}人の顧客に一斉配信します。よろしいですか？`;
    if (!confirm(confirmMessage)) return;
    
    // 一斉配信API呼び出し
    const lineUserIds = targetCustomers
      .filter(c => c.lineUserId)
      .map(c => c.lineUserId);
    
    if (lineUserIds.length === 0) {
      showError('LINE連携済みの顧客が見つかりません');
      return;
    }
    
    try {
      const envConfig = getEnvConfig();
      const projectId = envConfig.get('FIREBASE_PROJECT_ID');
      const functionUrl = `https://sendbroadcastmessage-${projectId.toLowerCase()}.cloudfunctions.net/sendBroadcastMessage`;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: lineUserIds,
          message: message,
          type: 'text'
        })
      });
      
      if (!response.ok) {
        throw new Error('一斉配信APIエラー');
      }
      
      const result = await response.json();
      const successCount = result.totalSent || 0;
      
      // 各顧客の最終メッセージ情報を更新
      for (const customer of targetCustomers) {
        if (customer.lineUserId) {
          await updateCustomerLastMessage(customer.id, message, 'salon');
        }
      }
      
    } catch (error) {
      console.error('❌ 一斉配信APIエラー:', error);
      
      // フォールバック: 個別送信
      let successCount = 0;
      for (const customer of targetCustomers) {
        try {
          if (customer.lineUserId) {
            await sendLineMessage(customer.lineUserId, message);
            await updateCustomerLastMessage(customer.id, message, 'salon');
            successCount++;
          }
        } catch (error) {
          console.error(`顧客 ${customer.name} への送信エラー:`, error);
        }
      }
    }
    
    showSuccess(`${successCount}人の顧客に一斉配信しました`);
    closeBroadcastModal();
    
  } catch (error) {
    console.error('❌ 一斉配信エラー:', error);
    showError('一斉配信に失敗しました');
  }
}

// ユーティリティ関数

/**
 * 時間の経過を表示
 */
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return '今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  
  return new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
}

/**
 * メッセージの時刻をフォーマット
 */
function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * タグのCSSクラスを取得
 */
function getTagClass(tags) {
  if (!tags || tags.length === 0) return 'tag-custom';
  
  const tag = tags[0].toLowerCase();
  if (tag.includes('vip')) return 'tag-vip';
  if (tag.includes('常連')) return 'tag-regular';
  if (tag.includes('新規')) return 'tag-new';
  return 'tag-custom';
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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

/**
 * LINE Flex Messageを送信
 */
async function sendLineFlexMessage(lineUserId, flexMessage, altText) {
  try {
    const envConfig = getEnvConfig();
    const projectId = envConfig.get('FIREBASE_PROJECT_ID');
    const functionUrl = `https://sendlinemessage-${projectId.toLowerCase()}.cloudfunctions.net/sendLineMessage`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lineUserId,
        message: {
          altText: altText || 'リッチメッセージ',
          contents: flexMessage
        },
        type: 'flex'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'LINE Flex Message送信APIエラー');
    }
    
    const result = await response.json();
    console.log('✅ LINE Flex Message送信完了:', result);
    
  } catch (error) {
    console.error('❌ LINE Flex Message送信エラー:', error);
    if (error.message.includes('fetch')) {
      console.warn('⚠️ 開発環境: LINE Flex Message送信をスキップ');
    }
  }
}

/**
 * テンプレート用のデータを生成
 */
function generateTemplateData(customer, templateName) {
  const baseUrl = window.location.origin;
  const bookingUrl = `${baseUrl}/`;
  
  // 基本的な顧客データ
  const baseData = {
    customerName: customer.name,
    bookingUrl: bookingUrl,
    salonLogo: `${baseUrl}/assets/logo.png` // ロゴファイルがある場合
  };
  
  // テンプレート別の追加データ
  switch (templateName) {
    case 'appointment':
      return {
        ...baseData,
        datetime: '2025年1月10日 (金) 14:00', // 実際の予約データから取得
        menuName: 'カット + カラー',
        staffName: '田中 美香'
      };
      
    case 'promotion':
      return {
        ...baseData,
        promotionTitle: '新春キャンペーン',
        promotionDescription: '新年を美しく迎えませんか？人気のカラーメニューが特別価格でご利用いただけます。',
        promotionPeriod: '1月1日〜1月31日',
        discount: '通常価格より30%OFF',
        promotionImage: `${baseUrl}/assets/campaign.jpg`
      };
      
    case 'menu':
      return {
        ...baseData,
        menuName1: 'カット',
        menuDescription1: 'トレンドを取り入れたスタイリッシュなカット',
        menuPrice1: '4,000',
        menuImage1: `${baseUrl}/assets/menu-cut.jpg`,
        bookingUrl1: bookingUrl,
        menuName2: 'カラー',
        menuDescription2: 'お客様に似合う美しいカラーリング',
        menuPrice2: '6,000',
        menuImage2: `${baseUrl}/assets/menu-color.jpg`,
        bookingUrl2: bookingUrl
      };
      
    case 'staff':
      return {
        ...baseData,
        staffName: '田中 美香',
        staffRole: 'トップスタイリスト',
        staffExperience: '経験年数: 8年',
        staffIntroduction: 'お客様一人ひとりのライフスタイルに合わせたヘアスタイルをご提案いたします。',
        staffSkills: 'カラーリング、パーマ、ヘアケア',
        staffImage: `${baseUrl}/assets/staff-tanaka.jpg`
      };
      
    case 'thankyou':
      return {
        ...baseData,
        todayMenu: 'カット + トリートメント',
        thankYouMessage: 'お忙しい中お時間をいただき、ありがとうございました。次回のご来店もお待ちしております。',
        reviewUrl: 'https://example.com/review'
      };
      
    case 'reminder':
      return {
        ...baseData,
        datetime: '2025年1月10日 (金) 14:00',
        menuName: 'カット + カラー',
        staffName: '田中 美香',
        reservationId: 'res123'
      };
      
    default:
      return baseData;
  }
}