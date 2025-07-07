// Enhanced Dashboard - Salone Ponte
// 改善されたダッシュボード機能

// ===== グローバル変数 =====
let dashboardData = {
  reservations: [],
  customers: [],
  menus: [],
  staff: [],
  analytics: {},
  realTimeStats: {}
};

let charts = {
  sales: null,
  reservations: null
};

let refreshInterval = null;
let isRealTimeEnabled = true;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async function() {
  try {
    showLoadingOverlay();
    await initializeDashboard();
    setupEventListeners();
    startRealTimeUpdates();
    hideLoadingOverlay();
    
    showNotification('ダッシュボードが正常に読み込まれました', 'success');
  } catch (error) {
    console.error('ダッシュボード初期化エラー:', error);
    hideLoadingOverlay();
    showNotification('データの読み込みに失敗しました', 'error');
  }
});

// ===== ダッシュボード初期化 =====
async function initializeDashboard() {
  try {
    // データの並行読み込み
    await Promise.all([
      loadReservationsData(),
      loadCustomersData(),
      loadMenusData(),
      loadStaffData()
    ]);
    
    // UI更新
    updateAllStats();
    updateTodaySchedule();
    updateRecentActivity();
    updateStaffStatus();
    updatePopularMenus();
    initializeCharts();
    
    console.log('✅ ダッシュボード初期化完了');
  } catch (error) {
    console.error('❌ ダッシュボード初期化エラー:', error);
    throw error;
  }
}

// ===== データ読み込み関数 =====

async function loadReservationsData() {
  try {
    if (typeof db === 'undefined') {
      // デモデータを使用
      dashboardData.reservations = generateDemoReservations();
      return;
    }
    
    const snapshot = await db.collection('reservations')
      .orderBy('datetime', 'desc')
      .limit(100)
      .get();
    
    dashboardData.reservations = [];
    snapshot.forEach(doc => {
      dashboardData.reservations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`予約データ: ${dashboardData.reservations.length}件`);
  } catch (error) {
    console.error('予約データ読み込みエラー:', error);
    dashboardData.reservations = generateDemoReservations();
  }
}

async function loadCustomersData() {
  try {
    if (typeof db === 'undefined') {
      dashboardData.customers = generateDemoCustomers();
      return;
    }
    
    const snapshot = await db.collection('customers').get();
    dashboardData.customers = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      dashboardData.customers.push({
        id: doc.id,
        name: data.name || '',
        phone: data.phone || '',
        totalVisits: data.reservations ? data.reservations.length : 0,
        totalSpent: data.reservations ? data.reservations.reduce((sum, r) => sum + (r.price || 0), 0) : 0,
        lastVisit: data.lastReservation ? new Date(data.lastReservation) : null,
        tags: data.tags || ['新規顧客'],
        createdAt: data.createdAt || new Date().toISOString(),
        lineUserId: data.lineUserId || ''
      });
    });
    
    console.log(`顧客データ: ${dashboardData.customers.length}件`);
  } catch (error) {
    console.error('顧客データ読み込みエラー:', error);
    dashboardData.customers = generateDemoCustomers();
  }
}

async function loadMenusData() {
  try {
    if (typeof db === 'undefined') {
      dashboardData.menus = generateDemoMenus();
      return;
    }
    
    const snapshot = await db.collection('menus').get();
    dashboardData.menus = [];
    snapshot.forEach(doc => {
      dashboardData.menus.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    if (dashboardData.menus.length === 0) {
      dashboardData.menus = generateDemoMenus();
    }
    
    console.log(`メニューデータ: ${dashboardData.menus.length}件`);
  } catch (error) {
    console.error('メニューデータ読み込みエラー:', error);
    dashboardData.menus = generateDemoMenus();
  }
}

async function loadStaffData() {
  try {
    if (typeof db === 'undefined') {
      dashboardData.staff = generateDemoStaff();
      return;
    }
    
    const snapshot = await db.collection('staffs').get();
    dashboardData.staff = [];
    snapshot.forEach(doc => {
      dashboardData.staff.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    if (dashboardData.staff.length === 0) {
      dashboardData.staff = generateDemoStaff();
    }
    
    console.log(`スタッフデータ: ${dashboardData.staff.length}件`);
  } catch (error) {
    console.error('スタッフデータ読み込みエラー:', error);
    dashboardData.staff = generateDemoStaff();
  }
}

// ===== 統計更新関数 =====

function updateAllStats() {
  updateBasicStats();
  updateNavCounts();
  updateReservationStats();
}

function updateBasicStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // 今日の予約数
  const todayReservations = dashboardData.reservations.filter(r => {
    const resDate = new Date(r.datetime);
    return resDate >= today && resDate < tomorrow && r.status !== 'cancelled';
  });
  
  // 今日の売上
  const todaySales = todayReservations.reduce((sum, r) => sum + (r.menuPrice || 0), 0);
  
  // 今月の新規顧客
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  const newCustomers = dashboardData.customers.filter(c => {
    const createdDate = new Date(c.createdAt);
    return createdDate >= thisMonth;
  });
  
  // DOM更新
  updateElement('todayReservations', todayReservations.length);
  updateElement('todaySales', `¥${todaySales.toLocaleString()}`);
  updateElement('newCustomers', newCustomers.length);
  
  // 今日の日付表示
  updateElement('todayDate', today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }));
}

function updateNavCounts() {
  updateElement('customerCount', dashboardData.customers.length);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayReservationCount = dashboardData.reservations.filter(r => {
    const resDate = new Date(r.datetime);
    return resDate >= today && resDate < tomorrow && r.status !== 'cancelled';
  }).length;
  
  updateElement('todayReservationCount', todayReservationCount);
}

function updateReservationStats() {
  const confirmedCount = dashboardData.reservations.filter(r => r.status === 'confirmed').length;
  const pendingCount = dashboardData.reservations.filter(r => r.status === 'pending').length;
  const completedCount = dashboardData.reservations.filter(r => r.status === 'completed').length;
  
  updateElement('confirmedCount', confirmedCount);
  updateElement('pendingCount', pendingCount);
  updateElement('completedCount', completedCount);
}

// ===== 今日のスケジュール更新 =====

function updateTodaySchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayReservations = dashboardData.reservations
    .filter(r => {
      const resDate = new Date(r.datetime);
      return resDate >= today && resDate < tomorrow && r.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  
  const container = document.getElementById('todaySchedule');
  if (!container) return;
  
  if (todayReservations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <span class="material-icons text-4xl mb-2 block">event_available</span>
        <p>今日の予約はありません</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = todayReservations.map(reservation => {
    const time = new Date(reservation.datetime);
    const timeStr = time.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const statusClass = getStatusClass(reservation.status);
    const statusText = getStatusText(reservation.status);
    
    return `
      <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer animate-slide-in-up">
        <div class="flex-shrink-0 w-16 text-center">
          <div class="text-lg font-bold text-gray-900">${timeStr}</div>
          <div class="text-xs text-gray-500">${reservation.menuDuration || 60}分</div>
        </div>
        <div class="flex-1 ml-4">
          <div class="flex items-center justify-between">
            <h4 class="font-medium text-gray-900">${reservation.name}様</h4>
            <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
              ${statusText}
            </span>
          </div>
          <p class="text-sm text-gray-600">${reservation.menuName}</p>
          <p class="text-sm text-gray-500">担当: ${reservation.staffName}</p>
        </div>
        <div class="flex-shrink-0 ml-4 text-right">
          <div class="text-sm font-medium text-gray-900">¥${reservation.menuPrice.toLocaleString()}</div>
          <button onclick="viewReservationDetail('${reservation.id}')" class="text-xs text-blue-600 hover:text-blue-800">
            詳細
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== 最近の活動更新 =====

function updateRecentActivity() {
  const recentActivities = generateRecentActivities();
  const container = document.getElementById('recentActivity');
  if (!container) return;
  
  container.innerHTML = recentActivities.map((activity, index) => `
    <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors animate-slide-in-up" style="animation-delay: ${index * 0.1}s">
      <div class="flex-shrink-0 w-10 h-10 ${activity.iconBg} rounded-full flex items-center justify-center">
        <span class="material-icons text-sm ${activity.iconColor}">${activity.icon}</span>
      </div>
      <div class="flex-1 ml-3">
        <p class="text-sm font-medium text-gray-900">${activity.title}</p>
        <p class="text-xs text-gray-500">${activity.description}</p>
      </div>
      <div class="flex-shrink-0 text-xs text-gray-400">
        ${activity.time}
      </div>
    </div>
  `).join('');
}

// ===== スタッフステータス更新 =====

function updateStaffStatus() {
  const container = document.getElementById('staffStatus');
  if (!container) return;
  
  const staffStatuses = dashboardData.staff.map(staff => {
    const today = new Date();
    const todayReservations = dashboardData.reservations.filter(r => {
      const resDate = new Date(r.datetime);
      return resDate.toDateString() === today.toDateString() && 
             r.staffId === staff.id && 
             r.status !== 'cancelled';
    });
    
    let status = 'available';
    let statusText = '空き';
    let statusClass = 'status-online';
    
    if (todayReservations.length >= 6) {
      status = 'busy';
      statusText = '満員';
      statusClass = 'status-busy';
    } else if (todayReservations.length >= 3) {
      status = 'busy';
      statusText = '忙しい';
      statusClass = 'status-busy';
    }
    
    return {
      ...staff,
      todayReservations: todayReservations.length,
      status,
      statusText,
      statusClass
    };
  });
  
  container.innerHTML = staffStatuses.map(staff => `
    <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div class="flex-shrink-0 relative">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
          ${staff.name.charAt(0)}
        </div>
        <div class="absolute -bottom-1 -right-1 w-4 h-4 ${staff.statusClass} border-2 border-white rounded-full"></div>
      </div>
      <div class="flex-1 ml-4">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900">${staff.name}</h4>
          <span class="px-2 py-1 text-xs font-semibold rounded-full ${staff.statusClass}">
            ${staff.statusText}
          </span>
        </div>
        <p class="text-sm text-gray-600">${staff.role || 'スタイリスト'}</p>
        <p class="text-sm text-gray-500">今日の予約: ${staff.todayReservations}件</p>
      </div>
    </div>
  `).join('');
}

// ===== 人気メニュー更新 =====

function updatePopularMenus() {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  
  // 今月の予約からメニュー別集計
  const menuStats = {};
  dashboardData.reservations
    .filter(r => new Date(r.datetime) >= thisMonth && r.status !== 'cancelled')
    .forEach(r => {
      const menuId = r.menuId || r.menuName;
      if (!menuStats[menuId]) {
        menuStats[menuId] = {
          name: r.menuName,
          count: 0,
          revenue: 0
        };
      }
      menuStats[menuId].count++;
      menuStats[menuId].revenue += r.menuPrice || 0;
    });
  
  // 予約数順でソート
  const sortedMenus = Object.values(menuStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const container = document.getElementById('popularMenus');
  if (!container) return;
  
  if (sortedMenus.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-gray-500">
        <span class="material-icons text-2xl mb-2 block">trending_up</span>
        <p class="text-sm">今月の予約データがありません</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = sortedMenus.map((menu, index) => {
    const rank = index + 1;
    const rankColor = rank <= 3 ? 'text-yellow-500' : 'text-gray-400';
    
    return `
      <div class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center">
          <span class="material-icons ${rankColor}">
            ${rank === 1 ? 'workspace_premium' : rank <= 3 ? 'star' : 'circle'}
          </span>
        </div>
        <div class="flex-1 ml-3">
          <h4 class="font-medium text-gray-900">${menu.name}</h4>
          <p class="text-sm text-gray-500">¥${menu.revenue.toLocaleString()} / ${menu.count}回</p>
        </div>
        <div class="flex-shrink-0 text-right">
          <div class="text-lg font-bold text-gray-900">${rank}</div>
          <div class="text-xs text-gray-500">位</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== チャート初期化 =====

function initializeCharts() {
  initializeSalesChart();
  initializeReservationChart();
}

function initializeSalesChart() {
  const ctx = document.getElementById('salesChart');
  if (!ctx) return;
  
  // 過去7日間の売上データ生成
  const salesData = generateSalesData();
  
  if (charts.sales) {
    charts.sales.destroy();
  }
  
  charts.sales = new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesData.labels,
      datasets: [{
        label: '売上',
        data: salesData.values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `売上: ¥${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6b7280'
          }
        },
        y: {
          grid: {
            color: '#f3f4f6'
          },
          ticks: {
            color: '#6b7280',
            callback: function(value) {
              return `¥${value.toLocaleString()}`;
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

function initializeReservationChart() {
  const ctx = document.getElementById('reservationChart');
  if (!ctx) return;
  
  const confirmedCount = dashboardData.reservations.filter(r => r.status === 'confirmed').length;
  const pendingCount = dashboardData.reservations.filter(r => r.status === 'pending').length;
  const completedCount = dashboardData.reservations.filter(r => r.status === 'completed').length;
  const cancelledCount = dashboardData.reservations.filter(r => r.status === 'cancelled').length;
  
  if (charts.reservations) {
    charts.reservations.destroy();
  }
  
  charts.reservations = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['確定', '保留', '完了', 'キャンセル'],
      datasets: [{
        data: [confirmedCount, pendingCount, completedCount, cancelledCount],
        backgroundColor: [
          '#10b981',
          '#f59e0b',
          '#3b82f6',
          '#ef4444'
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          cornerRadius: 8,
          displayColors: false
        }
      },
      cutout: '60%'
    }
  });
}

// ===== リアルタイム更新 =====

function startRealTimeUpdates() {
  if (!isRealTimeEnabled) return;
  
  // 30秒ごとに更新
  refreshInterval = setInterval(async () => {
    try {
      await refreshDashboardData();
      updateAllStats();
      updateTodaySchedule();
      updateRecentActivity();
      updateCharts();
      
      console.log('🔄 ダッシュボード更新完了');
    } catch (error) {
      console.error('❌ リアルタイム更新エラー:', error);
    }
  }, 30000);
  
  console.log('🔄 リアルタイム更新開始');
}

function stopRealTimeUpdates() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
    console.log('⏹️ リアルタイム更新停止');
  }
}

async function refreshDashboardData() {
  try {
    // 新しいデータのみ取得（最適化）
    await loadReservationsData();
    await loadCustomersData();
  } catch (error) {
    console.error('データ更新エラー:', error);
  }
}

function updateCharts() {
  if (charts.sales) {
    const salesData = generateSalesData();
    charts.sales.data.labels = salesData.labels;
    charts.sales.data.datasets[0].data = salesData.values;
    charts.sales.update('none');
  }
  
  if (charts.reservations) {
    const confirmedCount = dashboardData.reservations.filter(r => r.status === 'confirmed').length;
    const pendingCount = dashboardData.reservations.filter(r => r.status === 'pending').length;
    const completedCount = dashboardData.reservations.filter(r => r.status === 'completed').length;
    const cancelledCount = dashboardData.reservations.filter(r => r.status === 'cancelled').length;
    
    charts.reservations.data.datasets[0].data = [confirmedCount, pendingCount, completedCount, cancelledCount];
    charts.reservations.update('none');
  }
}

// ===== イベントリスナー設定 =====

function setupEventListeners() {
  // サイドナビトグル
  setupSideNavigation();
  
  // ページ離脱時のクリーンアップ
  window.addEventListener('beforeunload', () => {
    stopRealTimeUpdates();
    if (charts.sales) charts.sales.destroy();
    if (charts.reservations) charts.reservations.destroy();
  });
  
  // リサイズ時のチャート調整
  window.addEventListener('resize', debounce(() => {
    if (charts.sales) charts.sales.resize();
    if (charts.reservations) charts.reservations.resize();
  }, 250));
}

function setupSideNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const sideNav = document.getElementById('sideNav');
  const menuOverlay = document.getElementById('menuOverlay');
  
  // メニュートグル
  if (menuToggle && sideNav) {
    menuToggle.addEventListener('click', () => {
      toggleSideNav();
    });
  }
  
  // オーバーレイクリック
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => {
      closeSideNav();
    });
  }
  
  // ESCキーでメニューを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideNav && sideNav.classList.contains('translate-x-0')) {
      closeSideNav();
    }
  });
}

// ===== ナビゲーション関数 =====

function toggleSideNav() {
  const sideNav = document.getElementById('sideNav');
  const menuOverlay = document.getElementById('menuOverlay');
  const mainContent = document.getElementById('mainContent');
  
  if (sideNav) {
    const isOpen = sideNav.classList.contains('translate-x-0');
    
    if (isOpen) {
      closeSideNav();
    } else {
      openSideNav();
    }
  }
}

function openSideNav() {
  const sideNav = document.getElementById('sideNav');
  const menuOverlay = document.getElementById('menuOverlay');
  const mainContent = document.getElementById('mainContent');
  
  if (sideNav) {
    sideNav.classList.remove('-translate-x-full');
    sideNav.classList.add('translate-x-0');
  }
  
  if (menuOverlay) {
    menuOverlay.classList.remove('hidden');
  }
  
  // デスクトップでのマージン調整
  if (window.innerWidth >= 1024 && mainContent) {
    mainContent.classList.add('lg:ml-64');
  }
}

function closeSideNav() {
  const sideNav = document.getElementById('sideNav');
  const menuOverlay = document.getElementById('menuOverlay');
  const mainContent = document.getElementById('mainContent');
  
  if (sideNav) {
    sideNav.classList.remove('translate-x-0');
    sideNav.classList.add('-translate-x-full');
  }
  
  if (menuOverlay) {
    menuOverlay.classList.add('hidden');
  }
  
  if (mainContent) {
    mainContent.classList.remove('lg:ml-64');
  }
}

// ===== ユーティリティ関数 =====

function updateElement(elementId, content) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = content;
  }
}

function showLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }
}

function showNotification(message, type = 'info', duration = 5000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;
  
  const notification = document.createElement('div');
  const id = `notification-${Date.now()}`;
  notification.id = id;
  
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type] || 'bg-blue-500';
  
  const icon = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }[type] || 'info';
  
  notification.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in-right max-w-sm`;
  notification.innerHTML = `
    <span class="material-icons text-sm">${icon}</span>
    <span class="flex-1 text-sm font-medium">${message}</span>
    <button onclick="removeNotification('${id}')" class="text-white hover:text-gray-200">
      <span class="material-icons text-sm">close</span>
    </button>
  `;
  
  container.appendChild(notification);
  
  // 自動削除
  setTimeout(() => {
    removeNotification(id);
  }, duration);
}

function removeNotification(id) {
  const notification = document.getElementById(id);
  if (notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getStatusClass(status) {
  const classes = {
    'confirmed': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
  const texts = {
    'confirmed': '確定',
    'pending': '保留',
    'completed': '完了',
    'cancelled': 'キャンセル'
  };
  return texts[status] || status;
}

// ===== アクション関数 =====

function openBookingPage() {
  window.open('/src/pages/index.html', '_blank');
}

function openCalendar() {
  window.location.href = 'calendar.html';
}

function viewReservationDetail(reservationId) {
  // 予約詳細表示の実装
  showNotification('予約詳細機能は実装中です', 'info');
}

function exportData() {
  try {
    const data = {
      reservations: dashboardData.reservations,
      customers: dashboardData.customers,
      menus: dashboardData.menus,
      staff: dashboardData.staff,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `salone-ponte-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('データのエクスポートが完了しました', 'success');
  } catch (error) {
    console.error('エクスポートエラー:', error);
    showNotification('エクスポートに失敗しました', 'error');
  }
}

function showDashboard() {
  // ダッシュボード表示（既に表示中）
  showNotification('ダッシュボードを表示中です', 'info');
}

function showAnalytics() {
  showNotification('分析機能は準備中です', 'info');
}

function showSettings() {
  showNotification('設定機能は準備中です', 'info');
}

// ===== デモデータ生成関数 =====

function generateDemoReservations() {
  const statuses = ['confirmed', 'pending', 'completed', 'cancelled'];
  const menus = ['カット', 'カラー', 'パーマ', 'トリートメント', 'カット+カラー'];
  const staff = ['田中', '佐藤', '山田', '鈴木'];
  const names = ['田中花子', '佐藤太郎', '山田美咲', '鈴木一郎', '高橋さくら'];
  
  const reservations = [];
  const today = new Date();
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 2) * 30);
    
    reservations.push({
      id: `demo-res-${i}`,
      name: names[Math.floor(Math.random() * names.length)],
      phone: `090-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      menuName: menus[Math.floor(Math.random() * menus.length)],
      menuPrice: (Math.floor(Math.random() * 5) + 3) * 1000,
      menuDuration: [30, 60, 90, 120][Math.floor(Math.random() * 4)],
      staffName: staff[Math.floor(Math.random() * staff.length)],
      staffId: `staff-${Math.floor(Math.random() * staff.length)}`,
      datetime: date.toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: date.toISOString()
    });
  }
  
  return reservations;
}

function generateDemoCustomers() {
  const names = ['田中花子', '佐藤太郎', '山田美咲', '鈴木一郎', '高橋さくら', '渡辺ゆり', '伊藤健太', '中村あい'];
  const tags = [['新規顧客'], ['常連顧客'], ['VIP顧客'], ['離反リスク']];
  
  return names.map((name, index) => ({
    id: `demo-customer-${index}`,
    name: name,
    phone: `090-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    totalVisits: Math.floor(Math.random() * 20) + 1,
    totalSpent: (Math.floor(Math.random() * 50) + 10) * 1000,
    lastVisit: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    tags: tags[Math.floor(Math.random() * tags.length)],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    lineUserId: `line-user-${index}`
  }));
}

function generateDemoMenus() {
  return [
    { id: 'menu-1', name: 'カット', price: 5000, duration: 60, description: 'スタイリストによるカット' },
    { id: 'menu-2', name: 'カラー', price: 8000, duration: 90, description: '髪色を変えるカラーリング' },
    { id: 'menu-3', name: 'パーマ', price: 10000, duration: 120, description: 'ウェーブやカールを作るパーマ' },
    { id: 'menu-4', name: 'トリートメント', price: 3000, duration: 30, description: '髪質改善トリートメント' },
    { id: 'menu-5', name: 'カット+カラー', price: 12000, duration: 150, description: 'カットとカラーのセット' }
  ];
}

function generateDemoStaff() {
  return [
    { id: 'staff-1', name: '田中', role: 'シニアスタイリスト', experience: 8 },
    { id: 'staff-2', name: '佐藤', role: 'スタイリスト', experience: 5 },
    { id: 'staff-3', name: '山田', role: 'アシスタント', experience: 2 },
    { id: 'staff-4', name: '鈴木', role: 'スタイリスト', experience: 6 }
  ];
}

function generateSalesData() {
  const labels = [];
  const values = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }));
    values.push(Math.floor(Math.random() * 50000) + 20000);
  }
  
  return { labels, values };
}

function generateRecentActivities() {
  const activities = [
    {
      icon: 'person_add',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      title: '新規顧客登録',
      description: '田中花子様が登録されました',
      time: '2分前'
    },
    {
      icon: 'event',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      title: '予約確定',
      description: '佐藤太郎様 - カット+カラー',
      time: '5分前'
    },
    {
      icon: 'payment',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      title: '支払い完了',
      description: '山田美咲様 - ¥8,000',
      time: '8分前'
    },
    {
      icon: 'chat',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      title: 'メッセージ送信',
      description: '明日の予約確認メッセージを送信',
      time: '12分前'
    },
    {
      icon: 'star',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600',
      title: 'レビュー投稿',
      description: '鈴木一郎様から5つ星評価',
      time: '15分前'
    }
  ];
  
  return activities;
}