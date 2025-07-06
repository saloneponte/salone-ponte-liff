// ダッシュボード管理機能 - Salone Ponte

// ===== グローバル変数 =====
let currentTab = 'dashboard';
let customersData = [];
let menusData = [];
let staffsData = [];
let reservationsData = [];
let messagesData = [];
let currentCustomer = null;
let currentMenu = null;
let currentStaff = null;
let selectedChatCustomer = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', function() {
  initializeFirebaseData();
  setupEventListeners();
  loadDashboard();
});

// Firebase からリアルタイムデータ取得
async function initializeFirebaseData() {
  try {
    // 予約データ取得
    await loadReservationsFromFirebase();
    
    // 顧客データ取得
    await loadCustomersFromFirebase();
    
    // メニューデータ取得
    await loadMenusFromFirebase();
    
    // スタッフデータ取得
    await loadStaffsFromFirebase();
    
    console.log('Firebase データ読み込み完了');
  } catch (error) {
    console.error('Firebase データ読み込みエラー:', error);
    // フォールバック: デモデータを使用
    initializeDemoData();
  }
}

// 予約データをFirebaseから取得
async function loadReservationsFromFirebase() {
  try {
    const snapshot = await db.collection('reservations').orderBy('datetime', 'desc').get();
    reservationsData = [];
    snapshot.forEach(doc => {
      reservationsData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Firebase予約データ: ${reservationsData.length}件`);
  } catch (error) {
    console.error('予約データ取得エラー:', error);
    reservationsData = [];
  }
}

// 顧客データをFirebaseから取得
async function loadCustomersFromFirebase() {
  try {
    const snapshot = await db.collection('customers').get();
    customersData = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      customersData.push({
        id: doc.id,
        name: data.name || '',
        phone: data.phone || '',
        totalVisits: data.reservations ? data.reservations.length : 0,
        totalSpent: data.reservations ? data.reservations.reduce((sum, r) => sum + (r.price || 0), 0) : 0,
        lastVisit: data.lastReservation ? new Date(data.lastReservation) : null,
        daysSinceLastVisit: data.lastReservation ? 
          Math.floor((new Date() - new Date(data.lastReservation)) / (1000 * 60 * 60 * 24)) : null,
        tags: data.tags || ['新規顧客'],
        birthday: data.birthday || '',
        counseling: data.counseling || {},
        reservations: data.reservations || [],
        lineUserId: data.lineUserId || '',
        createdAt: data.createdAt || ''
      });
    });
    
    console.log(`Firebase顧客データ: ${customersData.length}件`);
  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    customersData = [];
  }
}

// メニューデータをFirebaseから取得
async function loadMenusFromFirebase() {
  try {
    const snapshot = await db.collection('menus').get();
    menusData = [];
    snapshot.forEach(doc => {
      menusData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // データがない場合はサンプルデータ
    if (menusData.length === 0) {
      menusData = SAMPLE_MENUS;
    }
    
    console.log(`Firebaseメニューデータ: ${menusData.length}件`);
  } catch (error) {
    console.error('メニューデータ取得エラー:', error);
    menusData = SAMPLE_MENUS;
  }
}

// スタッフデータをFirebaseから取得
async function loadStaffsFromFirebase() {
  try {
    const snapshot = await db.collection('staffs').get();
    staffsData = [];
    snapshot.forEach(doc => {
      staffsData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // データがない場合はサンプルデータ
    if (staffsData.length === 0) {
      staffsData = SAMPLE_STAFF;
    }
    
    console.log(`Firebaseスタッフデータ: ${staffsData.length}件`);
  } catch (error) {
    console.error('スタッフデータ取得エラー:', error);
    staffsData = SAMPLE_STAFF;
  }
}

// デモデータ初期化（フォールバック）
function initializeDemoData() {
  console.log('デモモードでデータ初期化');
  
  customersData = [
    {
      id: 'customer1',
      name: '田中 花子',
      phone: '090-1234-5678',
      totalVisits: 5,
      totalSpent: 25000,
      lastVisit: new Date('2024-11-15'),
      daysSinceLastVisit: 38,
      tags: ['常連顧客'],
      birthday: '1990-03-15',
      counseling: {
        hairType: 'ウェーブ',
        hairVolume: '普通',
        concerns: ['パサつき', 'うねり'],
        desiredStyle: 'ナチュラルなボブスタイル',
        completedAt: '2024-10-01'
      },
      reservations: [
        { datetime: '2024-11-15T14:00:00', menu: 'カット＋カラー', staff: '山田', price: 8000 },
        { datetime: '2024-09-10T15:30:00', menu: 'カット', staff: '田中', price: 5000 }
      ]
    }
  ];
  
  menusData = SAMPLE_MENUS;
  staffsData = SAMPLE_STAFF;
  reservationsData = [];
}

// リアルタイム予約更新監視
function setupRealtimeUpdates() {
  // 新規予約の監視
  db.collection('reservations').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const newReservation = {
          id: change.doc.id,
          ...change.doc.data()
        };
        
        // 新規予約をデータに追加
        reservationsData.unshift(newReservation);
        
        // ダッシュボードの表示を更新
        if (currentTab === 'dashboard') {
          updateTodayReservations();
          updateRecentActivity();
        }
        
        // 通知表示
        showNotification(`新しい予約: ${newReservation.name}様 - ${newReservation.menuName}`);
      }
    });
  });
}

// 通知表示
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10B981;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-size: 14px;
    max-width: 300px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// 今日の予約一覧更新
function updateTodayReservations() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayReservations = reservationsData.filter(reservation => {
    const reservationDate = new Date(reservation.datetime);
    return reservationDate >= today && reservationDate < tomorrow;
  });
  
  const container = document.getElementById('todayReservations');
  if (!container) return;
  
  if (todayReservations.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">今日の予約はありません</p>';
    return;
  }
  
  container.innerHTML = todayReservations.map(reservation => `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-gray-900">${reservation.name}</h4>
          <p class="text-sm text-gray-600">${reservation.menuName}</p>
          <p class="text-sm text-gray-500">担当: ${reservation.staffName}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">
            ${new Date(reservation.datetime).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}
          </p>
          <p class="text-sm text-green-600">¥${reservation.menuPrice.toLocaleString()}</p>
        </div>
      </div>
      ${reservation.note ? `<p class="text-sm text-gray-500 mt-2">${reservation.note}</p>` : ''}
    </div>
  `).join('');
}

// 最新活動履歴更新
function updateRecentActivity() {
  const recentReservations = reservationsData
    .sort((a, b) => new Date(b.createdAt || b.datetime) - new Date(a.createdAt || a.datetime))
    .slice(0, 5);
  
  const container = document.getElementById('recentActivity');
  if (!container) return;
  
  if (recentReservations.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-4">まだ予約がありません</p>';
    return;
  }
  
  container.innerHTML = recentReservations.map(reservation => {
    const time = new Date(reservation.createdAt || reservation.datetime);
    return `
      <div class="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
        <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span class="text-green-600 text-sm">📅</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">${reservation.name}様が予約</p>
          <p class="text-xs text-gray-500">${reservation.menuName} - ${time.toLocaleDateString('ja-JP')}</p>
        </div>
      </div>
    `;
  }).join('');
}

// イベントリスナー設定
function setupEventListeners() {
  // サイドナビトグル
  const menuToggle = document.getElementById('menuToggle');
  const sideNav = document.getElementById('sideNav');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (menuToggle && sideNav) {
    menuToggle.addEventListener('click', () => {
      sideNav.classList.toggle('active');
      if (menuOverlay) menuOverlay.classList.toggle('active');
    });
  }
  
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => {
      sideNav.classList.remove('active');
      menuOverlay.classList.remove('active');
    });
  }
}

// タブ切り替え
function switchTab(tab) {
  currentTab = tab;
  
  // タブボタンの状態更新
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.classList.remove('tab-active');
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add('tab-active');
  
  // タブコンテンツの表示切り替え
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // タブ名をIDに変換
  let tabId = tab + 'Tab';
  if (tab === 'menu-staff') tabId = 'menuStaffTab';
  
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.remove('hidden');
  }
  
  // タブ固有の処理
  switch(tab) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'customers':
      loadCustomers();
      break;
    case 'reservations':
      loadReservations();
      populateReservationFilters();
      break;
    case 'menu-staff':
      loadMenuStaffTab();
      break;
    case 'counseling':
      loadCounselingTab();
      break;
    case 'messaging':
      loadMessagingTab();
      break;
    case 'analytics':
      loadAnalyticsTab();
      break;
  }
}

// ダッシュボード読み込み
function loadDashboard() {
  updateTodayReservations();
  updateRecentActivity();
  updateDashboardStats();
  setupRealtimeUpdates();
}

// ダッシュボード統計更新
function updateDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 今日の売上
  const todaySales = reservationsData
    .filter(r => new Date(r.datetime) >= today)
    .reduce((sum, r) => sum + (r.menuPrice || 0), 0);
  
  // 今月の予約数
  const thisMonth = reservationsData.filter(r => {
    const date = new Date(r.datetime);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;
  
  // 統計表示更新
  const totalCustomersElement = document.getElementById('totalCustomers');
  const monthlyReservationsElement = document.getElementById('monthlyReservations');
  const monthlyRevenueElement = document.getElementById('monthlyRevenue');
  const needFollowUpElement = document.getElementById('needFollowUp');
  
  if (totalCustomersElement) totalCustomersElement.textContent = customersData.length;
  if (monthlyReservationsElement) monthlyReservationsElement.textContent = thisMonth;
  
  // 今月の売上
  const monthlyRevenue = reservationsData
    .filter(r => {
      const date = new Date(r.datetime);
      return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    })
    .reduce((sum, r) => sum + (r.menuPrice || 0), 0);
  
  if (monthlyRevenueElement) monthlyRevenueElement.textContent = `¥${monthlyRevenue.toLocaleString()}`;
  
  // フォローアップが必要な顧客（60日以上来店なし）
  const needFollowUp = customersData.filter(c => c.daysSinceLastVisit && c.daysSinceLastVisit >= 60).length;
  if (needFollowUpElement) needFollowUpElement.textContent = needFollowUp;
  
  // 最近の予約も更新
  updateRecentReservationsTable();
}

// 顧客一覧読み込み（テーブル形式）
function loadCustomers() {
  const tableBody = document.getElementById('customersTable');
  if (!tableBody) return;
  
  if (customersData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">顧客データがありません</td></tr>';
    return;
  }
  
  tableBody.innerHTML = customersData.map(customer => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div>
          <div class="text-sm font-medium text-gray-900">${customer.name}</div>
          <div class="text-sm text-gray-500">${customer.phone}</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex flex-wrap gap-1">
          ${customer.tags.map(tag => `
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTagClass(tag)}">
              ${tag}
            </span>
          `).join('')}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${customer.totalVisits}回</div>
        <div class="text-sm text-gray-500">
          ${customer.daysSinceLastVisit ? `${customer.daysSinceLastVisit}日前` : ''}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">¥${customer.totalSpent.toLocaleString()}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('ja-JP') : '未来店'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="viewCustomerDetail('${customer.id}')" class="text-blue-600 hover:text-blue-900 mr-2">詳細</button>
        <button onclick="editCustomer('${customer.id}')" class="text-indigo-600 hover:text-indigo-900">編集</button>
      </td>
    </tr>
  `).join('');
}

// タグのCSSクラスを取得
function getTagClass(tag) {
  switch(tag) {
    case 'VIP顧客': return 'bg-purple-100 text-purple-800';
    case '常連顧客': return 'bg-green-100 text-green-800';
    case '新規顧客': return 'bg-blue-100 text-blue-800';
    case '離反リスク': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// 予約一覧読み込み（テーブル形式）
function loadReservations() {
  const tableBody = document.getElementById('reservationsTable');
  if (!tableBody) return;
  
  if (reservationsData.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">予約データがありません</td></tr>';
    return;
  }
  
  tableBody.innerHTML = reservationsData.map(reservation => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div>
          <div class="text-sm font-medium text-gray-900">${reservation.name}</div>
          <div class="text-sm text-gray-500">${reservation.phone || ''}</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${reservation.menuName}</div>
        <div class="text-sm text-gray-500">担当: ${reservation.staffName}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${new Date(reservation.datetime).toLocaleDateString('ja-JP')}</div>
        <div class="text-sm text-gray-500">${new Date(reservation.datetime).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">¥${reservation.menuPrice.toLocaleString()}</div>
        <div class="text-sm text-gray-500">${reservation.menuDuration}分</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(reservation.status)}">
          ${getStatusText(reservation.status)}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="viewReservationDetail('${reservation.id}')" class="text-blue-600 hover:text-blue-900 mr-2">詳細</button>
        <button onclick="editReservation('${reservation.id}')" class="text-indigo-600 hover:text-indigo-900">編集</button>
      </td>
    </tr>
  `).join('');
}

// ステータスのCSSクラスを取得
function getStatusClass(status) {
  switch(status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// ステータスのテキストを取得
function getStatusText(status) {
  switch(status) {
    case 'confirmed': return '確定';
    case 'pending': return '保留';
    case 'cancelled': return 'キャンセル';
    case 'completed': return '完了';
    default: return status;
  }
}

// 最近の予約テーブル更新
function updateRecentReservationsTable() {
  const recentReservations = reservationsData
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
    .slice(0, 10);
  
  const tableBody = document.getElementById('recentReservations');
  if (!tableBody) return;
  
  if (recentReservations.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">予約データがありません</td></tr>';
    return;
  }
  
  tableBody.innerHTML = recentReservations.map(reservation => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${new Date(reservation.datetime).toLocaleDateString('ja-JP')} 
        ${new Date(reservation.datetime).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${reservation.name}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reservation.menuName}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${reservation.staffName}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">¥${reservation.menuPrice.toLocaleString()}</td>
    </tr>
  `).join('');
}

// 予約フィルター用のスタッフリストを設定
function populateReservationFilters() {
  const staffFilter = document.getElementById('reservationStaffFilter');
  if (!staffFilter) return;
  
  // 既存オプションをクリア（最初のオプション以外）
  while (staffFilter.children.length > 1) {
    staffFilter.removeChild(staffFilter.lastChild);
  }
  
  // スタッフデータからオプションを追加
  const uniqueStaff = [...new Set(reservationsData.map(r => r.staffName).filter(Boolean))];
  uniqueStaff.forEach(staffName => {
    const option = document.createElement('option');
    option.value = staffName;
    option.textContent = staffName;
    staffFilter.appendChild(option);
  });
}

// ===== 顧客詳細・編集関数 =====

// 顧客詳細表示
function viewCustomerDetail(customerId) {
  const customer = customersData.find(c => c.id === customerId);
  if (!customer) {
    alert('顧客データが見つかりません');
    return;
  }
  
  // モーダルで顧客詳細を表示
  const modalHTML = `
    <div class="modal active" id="customerDetailModal">
      <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">顧客詳細 - ${customer.name}</h3>
            <button onclick="closeModal('customerDetailModal')" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-3">基本情報</h4>
              <div class="space-y-2 text-sm">
                <p><strong>名前:</strong> ${customer.name}</p>
                <p><strong>電話番号:</strong> ${customer.phone}</p>
                <p><strong>登録日:</strong> ${customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ja-JP') : '-'}</p>
                <p><strong>誕生日:</strong> ${customer.birthday || '-'}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                  ${customer.tags.map(tag => `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTagClass(tag)}">${tag}</span>`).join('')}
                </div>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium mb-3">来店実績</h4>
              <div class="space-y-2 text-sm">
                <p><strong>総来店回数:</strong> ${customer.totalVisits}回</p>
                <p><strong>累計金額:</strong> ¥${customer.totalSpent.toLocaleString()}</p>
                <p><strong>最終来店:</strong> ${customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('ja-JP') : '未来店'}</p>
                <p><strong>最終来店からの日数:</strong> ${customer.daysSinceLastVisit ? customer.daysSinceLastVisit + '日前' : '-'}</p>
              </div>
            </div>
          </div>
          
          ${customer.counseling && Object.keys(customer.counseling).length > 0 ? `
            <div class="mt-6">
              <h4 class="font-medium mb-3">カウンセリング情報</h4>
              <div class="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <p><strong>髪質:</strong> ${customer.counseling.hairType || '-'}</p>
                <p><strong>髪量:</strong> ${customer.counseling.hairVolume || '-'}</p>
                <p><strong>お悩み:</strong> ${customer.counseling.concerns ? customer.counseling.concerns.join(', ') : '-'}</p>
                <p><strong>理想のスタイル:</strong> ${customer.counseling.desiredStyle || '-'}</p>
              </div>
            </div>
          ` : ''}
          
          <div class="mt-6">
            <h4 class="font-medium mb-3">予約履歴</h4>
            <div class="max-h-64 overflow-y-auto">
              ${customer.reservations && customer.reservations.length > 0 ? 
                customer.reservations.map(reservation => `
                  <div class="border border-gray-200 rounded-lg p-3 mb-2">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="font-medium">${reservation.menu}</p>
                        <p class="text-sm text-gray-600">担当: ${reservation.staff}</p>
                        <p class="text-sm text-gray-500">${new Date(reservation.datetime).toLocaleDateString('ja-JP')}</p>
                      </div>
                      <p class="text-sm font-medium">¥${reservation.price.toLocaleString()}</p>
                    </div>
                    ${reservation.note ? `<p class="text-sm text-gray-500 mt-2">${reservation.note}</p>` : ''}
                  </div>
                `).join('') : 
                '<p class="text-gray-500 text-center py-4">予約履歴がありません</p>'
              }
            </div>
          </div>
          
          <div class="mt-6 flex space-x-3">
            <button onclick="editCustomer('${customerId}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              編集
            </button>
            <button onclick="closeModal('customerDetailModal')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 顧客編集
function editCustomer(customerId) {
  const customer = customersData.find(c => c.id === customerId);
  if (!customer) {
    alert('顧客データが見つかりません');
    return;
  }
  
  // 既存のモーダルを閉じる
  closeModal('customerDetailModal');
  
  // 編集モーダルを表示
  const modalHTML = `
    <div class="modal active" id="customerEditModal">
      <div class="bg-white rounded-lg max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">顧客編集 - ${customer.name}</h3>
            <button onclick="closeModal('customerEditModal')" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form onsubmit="saveCustomerEdit('${customerId}', event)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">名前</label>
                <input type="text" id="editCustomerName" value="${customer.name}" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input type="tel" id="editCustomerPhone" value="${customer.phone}" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">誕生日</label>
                <input type="date" id="editCustomerBirthday" value="${customer.birthday}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">タグ</label>
                <div class="flex flex-wrap gap-2">
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" value="VIP顧客" ${customer.tags.includes('VIP顧客') ? 'checked' : ''}>
                    <span class="text-sm">VIP顧客</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" value="常連顧客" ${customer.tags.includes('常連顧客') ? 'checked' : ''}>
                    <span class="text-sm">常連顧客</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" value="新規顧客" ${customer.tags.includes('新規顧客') ? 'checked' : ''}>
                    <span class="text-sm">新規顧客</span>
                  </label>
                  <label class="flex items-center space-x-2">
                    <input type="checkbox" value="離反リスク" ${customer.tags.includes('離反リスク') ? 'checked' : ''}>
                    <span class="text-sm">離反リスク</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="mt-6 flex space-x-3">
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                保存
              </button>
              <button type="button" onclick="closeModal('customerEditModal')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 顧客編集保存
function saveCustomerEdit(customerId, event) {
  event.preventDefault();
  
  const name = document.getElementById('editCustomerName').value.trim();
  const phone = document.getElementById('editCustomerPhone').value.trim();
  const birthday = document.getElementById('editCustomerBirthday').value;
  
  const checkboxes = document.querySelectorAll('#customerEditModal input[type="checkbox"]:checked');
  const tags = Array.from(checkboxes).map(cb => cb.value);
  
  if (!name || !phone) {
    alert('名前と電話番号は必須です');
    return;
  }
  
  // データを更新
  const customerIndex = customersData.findIndex(c => c.id === customerId);
  if (customerIndex !== -1) {
    customersData[customerIndex] = {
      ...customersData[customerIndex],
      name,
      phone,
      birthday,
      tags: tags.length > 0 ? tags : ['新規顧客'],
      updatedAt: new Date().toISOString()
    };
    
    // Firebaseに保存
    try {
      db.collection('customers').doc(customerId).update({
        name,
        phone,
        birthday,
        tags: tags.length > 0 ? tags : ['新規顧客'],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.log('顧客更新エラー:', error);
    }
    
    // 表示を更新
    loadCustomers();
    closeModal('customerEditModal');
    showNotification('顧客情報を更新しました');
  }
}

// ===== 予約詳細・編集関数 =====

// 予約詳細表示
function viewReservationDetail(reservationId) {
  const reservation = reservationsData.find(r => r.id === reservationId);
  if (!reservation) {
    alert('予約データが見つかりません');
    return;
  }
  
  const modalHTML = `
    <div class="modal active" id="reservationDetailModal">
      <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">予約詳細</h3>
            <button onclick="closeModal('reservationDetailModal')" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium mb-3">予約情報</h4>
              <div class="space-y-2 text-sm">
                <p><strong>顧客名:</strong> ${reservation.name}</p>
                <p><strong>電話番号:</strong> ${reservation.phone || '-'}</p>
                <p><strong>日時:</strong> ${new Date(reservation.datetime).toLocaleDateString('ja-JP')} ${new Date(reservation.datetime).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}</p>
                <p><strong>ステータス:</strong> <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(reservation.status)}">${getStatusText(reservation.status)}</span></p>
              </div>
            </div>
            
            <div>
              <h4 class="font-medium mb-3">サービス詳細</h4>
              <div class="space-y-2 text-sm">
                <p><strong>メニュー:</strong> ${reservation.menuName}</p>
                <p><strong>担当スタッフ:</strong> ${reservation.staffName}</p>
                <p><strong>料金:</strong> ¥${reservation.menuPrice.toLocaleString()}</p>
                <p><strong>所要時間:</strong> ${reservation.menuDuration}分</p>
              </div>
            </div>
          </div>
          
          ${reservation.note ? `
            <div class="mt-6">
              <h4 class="font-medium mb-3">備考・要望</h4>
              <div class="bg-gray-50 p-4 rounded-lg">
                <p class="text-sm">${reservation.note}</p>
              </div>
            </div>
          ` : ''}
          
          <div class="mt-6 flex space-x-3">
            <button onclick="editReservation('${reservationId}')" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              編集
            </button>
            <button onclick="closeModal('reservationDetailModal')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 予約編集
function editReservation(reservationId) {
  const reservation = reservationsData.find(r => r.id === reservationId);
  if (!reservation) {
    alert('予約データが見つかりません');
    return;
  }
  
  // 既存のモーダルを閉じる
  closeModal('reservationDetailModal');
  
  const reservationDate = new Date(reservation.datetime);
  const dateStr = reservationDate.toISOString().split('T')[0];
  const timeStr = reservationDate.toTimeString().slice(0, 5);
  
  const modalHTML = `
    <div class="modal active" id="reservationEditModal">
      <div class="bg-white rounded-lg max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">予約編集</h3>
            <button onclick="closeModal('reservationEditModal')" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form onsubmit="saveReservationEdit('${reservationId}', event)">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">日付</label>
                <input type="date" id="editReservationDate" value="${dateStr}" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">時間</label>
                <input type="time" id="editReservationTime" value="${timeStr}" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select id="editReservationStatus" class="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                  <option value="confirmed" ${reservation.status === 'confirmed' ? 'selected' : ''}>確定</option>
                  <option value="pending" ${reservation.status === 'pending' ? 'selected' : ''}>保留</option>
                  <option value="completed" ${reservation.status === 'completed' ? 'selected' : ''}>完了</option>
                  <option value="cancelled" ${reservation.status === 'cancelled' ? 'selected' : ''}>キャンセル</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea id="editReservationNote" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3">${reservation.note || ''}</textarea>
              </div>
            </div>
            
            <div class="mt-6 flex space-x-3">
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                保存
              </button>
              <button type="button" onclick="closeModal('reservationEditModal')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 予約編集保存
function saveReservationEdit(reservationId, event) {
  event.preventDefault();
  
  const date = document.getElementById('editReservationDate').value;
  const time = document.getElementById('editReservationTime').value;
  const status = document.getElementById('editReservationStatus').value;
  const note = document.getElementById('editReservationNote').value.trim();
  
  if (!date || !time || !status) {
    alert('日付、時間、ステータスは必須です');
    return;
  }
  
  const datetime = new Date(`${date}T${time}:00`).toISOString();
  
  // データを更新
  const reservationIndex = reservationsData.findIndex(r => r.id === reservationId);
  if (reservationIndex !== -1) {
    reservationsData[reservationIndex] = {
      ...reservationsData[reservationIndex],
      datetime,
      status,
      note,
      updatedAt: new Date().toISOString()
    };
    
    // Firebaseに保存
    try {
      db.collection('reservations').doc(reservationId).update({
        datetime,
        status,
        note,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.log('予約更新エラー:', error);
    }
    
    // 表示を更新
    loadReservations();
    if (currentTab === 'dashboard') {
      loadDashboard();
    }
    closeModal('reservationEditModal');
    showNotification('予約情報を更新しました');
  }
}

// ===== フィルター関数 =====

// 顧客フィルター適用
function applyCustomerFilters() {
  const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
  const tagFilter = document.getElementById('customerTagFilter').value;
  const visitFilter = document.getElementById('customerVisitFilter').value;
  
  let filteredCustomers = customersData;
  
  // 検索フィルター
  if (searchTerm) {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm) || 
      customer.phone.includes(searchTerm)
    );
  }
  
  // タグフィルター
  if (tagFilter) {
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.tags.includes(tagFilter)
    );
  }
  
  // 来店期間フィルター
  if (visitFilter) {
    const days = parseInt(visitFilter);
    if (days === 180) {
      // 180日以上来店していない
      filteredCustomers = filteredCustomers.filter(customer => 
        !customer.daysSinceLastVisit || customer.daysSinceLastVisit >= 180
      );
    } else {
      // 指定日数以内に来店
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.daysSinceLastVisit && customer.daysSinceLastVisit <= days
      );
    }
  }
  
  // フィルター結果を表示
  displayFilteredCustomers(filteredCustomers);
}

// フィルターされた顧客を表示
function displayFilteredCustomers(customers) {
  const tableBody = document.getElementById('customersTable');
  if (!tableBody) return;
  
  if (customers.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">該当する顧客が見つかりません</td></tr>';
    return;
  }
  
  tableBody.innerHTML = customers.map(customer => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div>
          <div class="text-sm font-medium text-gray-900">${customer.name}</div>
          <div class="text-sm text-gray-500">${customer.phone}</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex flex-wrap gap-1">
          ${customer.tags.map(tag => `
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTagClass(tag)}">
              ${tag}
            </span>
          `).join('')}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${customer.totalVisits}回</div>
        <div class="text-sm text-gray-500">
          ${customer.daysSinceLastVisit ? `${customer.daysSinceLastVisit}日前` : ''}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">¥${customer.totalSpent.toLocaleString()}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('ja-JP') : '未来店'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="viewCustomerDetail('${customer.id}')" class="text-blue-600 hover:text-blue-900 mr-2">詳細</button>
        <button onclick="editCustomer('${customer.id}')" class="text-indigo-600 hover:text-indigo-900">編集</button>
      </td>
    </tr>
  `).join('');
}

// 顧客フィルターリセット
function resetCustomerFilters() {
  document.getElementById('customerSearch').value = '';
  document.getElementById('customerTagFilter').value = '';
  document.getElementById('customerVisitFilter').value = '';
  loadCustomers();
}

// 予約フィルター適用
function applyReservationFilters() {
  const dateFilter = document.getElementById('reservationDateFilter').value;
  const staffFilter = document.getElementById('reservationStaffFilter').value;
  const statusFilter = document.getElementById('reservationStatusFilter').value;
  
  let filteredReservations = reservationsData;
  
  // 日付フィルター
  if (dateFilter) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    filteredReservations = filteredReservations.filter(reservation => {
      const reservationDate = new Date(reservation.datetime);
      reservationDate.setHours(0, 0, 0, 0);
      
      switch(dateFilter) {
        case 'today':
          return reservationDate.getTime() === today.getTime();
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return reservationDate.getTime() === tomorrow.getTime();
        case 'week':
          const weekEnd = new Date(today);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return reservationDate >= today && reservationDate < weekEnd;
        case 'month':
          return reservationDate.getMonth() === today.getMonth() && 
                 reservationDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    });
  }
  
  // スタッフフィルター
  if (staffFilter) {
    filteredReservations = filteredReservations.filter(reservation => 
      reservation.staffName === staffFilter
    );
  }
  
  // ステータスフィルター
  if (statusFilter) {
    filteredReservations = filteredReservations.filter(reservation => 
      reservation.status === statusFilter
    );
  }
  
  // フィルター結果を表示
  displayFilteredReservations(filteredReservations);
}

// フィルターされた予約を表示
function displayFilteredReservations(reservations) {
  const tableBody = document.getElementById('reservationsTable');
  if (!tableBody) return;
  
  if (reservations.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">該当する予約が見つかりません</td></tr>';
    return;
  }
  
  tableBody.innerHTML = reservations.map(reservation => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${new Date(reservation.datetime).toLocaleDateString('ja-JP')}</div>
        <div class="text-sm text-gray-500">${new Date(reservation.datetime).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div>
          <div class="text-sm font-medium text-gray-900">${reservation.name}</div>
          <div class="text-sm text-gray-500">${reservation.phone || ''}</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${reservation.menuName}</div>
        <div class="text-sm text-gray-500">担当: ${reservation.staffName}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">¥${reservation.menuPrice.toLocaleString()}</div>
        <div class="text-sm text-gray-500">${reservation.menuDuration}分</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(reservation.status)}">
          ${getStatusText(reservation.status)}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="viewReservationDetail('${reservation.id}')" class="text-blue-600 hover:text-blue-900 mr-2">詳細</button>
        <button onclick="editReservation('${reservation.id}')" class="text-indigo-600 hover:text-indigo-900">編集</button>
      </td>
    </tr>
  `).join('');
}

// ===== 他のタブ読み込み関数 =====

// メニュー・スタッフ管理タブ読み込み
function loadMenuStaffTab() {
  loadMenuList();
  loadStaffList();
}

// メニューリスト読み込み
function loadMenuList() {
  const menuList = document.getElementById('menuList');
  if (!menuList) return;
  
  if (menusData.length === 0) {
    menuList.innerHTML = '<p class="text-gray-500 text-center py-4">メニューデータがありません</p>';
    return;
  }
  
  menuList.innerHTML = menusData.map(menu => `
    <div class="border border-gray-200 rounded-lg p-4">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-medium text-gray-900">${menu.name}</h4>
          <p class="text-sm text-gray-600">${menu.description || ''}</p>
          <p class="text-sm text-gray-500 mt-1">所要時間: ${menu.duration}分</p>
        </div>
        <div class="text-right">
          <p class="font-medium text-gray-900">¥${menu.price.toLocaleString()}</p>
          <div class="mt-2 space-x-2">
            <button onclick="editMenu('${menu.id}')" class="text-blue-600 hover:text-blue-900 text-sm">編集</button>
            <button onclick="deleteMenu('${menu.id}')" class="text-red-600 hover:text-red-900 text-sm">削除</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// スタッフリスト読み込み
function loadStaffList() {
  const staffList = document.getElementById('staffList');
  if (!staffList) return;
  
  if (staffsData.length === 0) {
    staffList.innerHTML = '<p class="text-gray-500 text-center py-4">スタッフデータがありません</p>';
    return;
  }
  
  staffList.innerHTML = staffsData.map(staff => `
    <div class="border border-gray-200 rounded-lg p-4">
      <div class="flex justify-between items-start">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            <span class="text-gray-600 font-medium">${staff.name.charAt(0)}</span>
          </div>
          <div>
            <h4 class="font-medium text-gray-900">${staff.name}</h4>
            <p class="text-sm text-gray-600">${staff.role || 'スタイリスト'}</p>
            <p class="text-sm text-gray-500">${staff.experience || ''}年の経験</p>
          </div>
        </div>
        <div class="space-x-2">
          <button onclick="editStaff('${staff.id}')" class="text-blue-600 hover:text-blue-900 text-sm">編集</button>
          <button onclick="deleteStaff('${staff.id}')" class="text-red-600 hover:text-red-900 text-sm">削除</button>
        </div>
      </div>
    </div>
  `).join('');
}

// カウンセリングタブ読み込み
function loadCounselingTab() {
  // 実装予定
  console.log('カウンセリングタブ読み込み');
}

// メッセージタブ読み込み
function loadMessagingTab() {
  // 実装予定
  console.log('メッセージタブ読み込み');
}

// 分析タブ読み込み
function loadAnalyticsTab() {
  // 実装予定
  console.log('分析タブ読み込み');
}

// ===== モーダル・ユーティリティ関数 =====

// モーダルを閉じる
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}

// 予約画面を開く
function openBookingPage() {
  window.open('/src/pages/index.html', '_blank');
}

// サイドナビトグル（モバイル用）
function toggleSideNav() {
  const sideNav = document.getElementById('sideNav');
  const menuOverlay = document.getElementById('menuOverlay');
  
  if (sideNav) {
    sideNav.classList.toggle('active');
  }
  if (menuOverlay) {
    menuOverlay.classList.toggle('active');
  }
}

// プレースホルダー関数（今後実装予定）
function openMenuModal() { alert('メニュー追加機能は実装予定です'); }
function openStaffModal() { alert('スタッフ追加機能は実装予定です'); }
function editMenu(id) { alert('メニュー編集機能は実装予定です'); }
function deleteMenu(id) { alert('メニュー削除機能は実装予定です'); }
function editStaff(id) { alert('スタッフ編集機能は実装予定です'); }
function deleteStaff(id) { alert('スタッフ削除機能は実装予定です'); }
function saveBusinessSettings() { alert('営業設定保存機能は実装予定です'); }
function createCounselingTemplate() { alert('カウンセリングテンプレート作成機能は実装予定です'); }