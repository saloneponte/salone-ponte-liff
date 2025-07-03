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
  // タブ切り替え
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', (e) => {
      const tab = e.target.getAttribute('data-tab');
      switchTab(tab);
    });
  });
  
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
    content.style.display = 'none';
  });
  document.getElementById(tab + 'Tab').style.display = 'block';
  
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
      break;
    // 他のタブも必要に応じて追加
  }
}

// ダッシュボード読み込み
function loadDashboard() {
  updateTodayReservations();
  updateRecentActivity();
  updateDashboardStats();
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
  const salesElement = document.getElementById('todaySales');
  const reservationsElement = document.getElementById('monthlyReservations');
  
  if (salesElement) salesElement.textContent = `¥${todaySales.toLocaleString()}`;
  if (reservationsElement) reservationsElement.textContent = thisMonth;
}

// 顧客一覧読み込み
function loadCustomers() {
  const container = document.getElementById('customersList');
  if (!container) return;
  
  if (customersData.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">顧客データがありません</p>';
    return;
  }
  
  container.innerHTML = customersData.map(customer => `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-gray-900">${customer.name}</h4>
          <p class="text-sm text-gray-600">${customer.phone}</p>
          <div class="flex space-x-2 mt-2">
            ${customer.tags.map(tag => `<span class="tag tag-regular">${tag}</span>`).join('')}
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">来店${customer.totalVisits}回</p>
          <p class="text-sm text-green-600">¥${customer.totalSpent.toLocaleString()}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// 予約一覧読み込み
function loadReservations() {
  const container = document.getElementById('reservationsList');
  if (!container) return;
  
  if (reservationsData.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center py-8">予約データがありません</p>';
    return;
  }
  
  container.innerHTML = reservationsData.map(reservation => `
    <div class="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold text-gray-900">${reservation.name}</h4>
          <p class="text-sm text-gray-600">${reservation.menuName}</p>
          <p class="text-sm text-gray-500">担当: ${reservation.staffName}</p>
        </div>
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">
            ${new Date(reservation.datetime).toLocaleDateString('ja-JP')}
            ${new Date(reservation.datetime).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}
          </p>
          <p class="text-sm text-green-600">¥${reservation.menuPrice.toLocaleString()}</p>
          <span class="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            ${reservation.status === 'confirmed' ? '確定' : reservation.status}
          </span>
        </div>
      </div>
      ${reservation.note ? `<p class="text-sm text-gray-500 mt-2">${reservation.note}</p>` : ''}
    </div>
  `).join('');
}