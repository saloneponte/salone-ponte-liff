// カレンダー表示とリアルタイム更新機能 - Salone Ponte

// グローバル変数
let currentDate = new Date();
let selectedDate = null;
let selectedAppointment = null;
let isRealTimeEnabled = true;
let updateInterval = null;

// 営業時間設定
const BUSINESS_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

/**
 * カレンダーの初期化
 */
async function initializeCalendarDisplay() {
  try {
    console.log('📅 カレンダー表示を初期化中...');
    
    // 初期表示
    await renderCalendarView();
    await updateStatistics();
    
    // リアルタイム更新を開始
    startRealTimeUpdates();
    
    // イベントリスナーを設定
    setupEventListeners();
    
    console.log('✅ カレンダー表示初期化完了');
    
  } catch (error) {
    console.error('❌ カレンダー初期化エラー:', error);
  }
}

/**
 * カレンダービューのレンダリング
 */
async function renderCalendarView() {
  try {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 月表示を更新
    document.getElementById('currentMonth').textContent = 
      `${year}年${month + 1}月`;
    
    // カレンダーグリッドをクリア
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // 今月の予約データを取得
    const reservations = await getMonthReservations(year, month);
    
    // カレンダーを生成
    await generateCalendarGrid(year, month, reservations);
    
  } catch (error) {
    console.error('❌ カレンダービューレンダリングエラー:', error);
  }
}

/**
 * カレンダーグリッドの生成
 */
async function generateCalendarGrid(year, month, reservations) {
  const grid = document.getElementById('calendarGrid');
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 日付ごとの予約をグループ化
  const dailyReservations = groupReservationsByDate(reservations);
  
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.dataset.date = date.toISOString().split('T')[0];
    
    // 日付表示
    const dateNumber = document.createElement('div');
    dateNumber.className = 'date-number';
    dateNumber.textContent = date.getDate();
    cell.appendChild(dateNumber);
    
    // セルのクラス設定
    if (date.getMonth() !== month) {
      cell.classList.add('other-month');
    }
    
    if (date.getTime() === today.getTime()) {
      cell.classList.add('today');
    }
    
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      cell.classList.add('selected');
    }
    
    // その日の予約を表示
    const dateKey = date.toISOString().split('T')[0];
    const dayReservations = dailyReservations[dateKey] || [];
    
    // 予約アイテムを追加
    dayReservations.forEach(reservation => {
      const appointmentItem = createAppointmentItem(reservation);
      cell.appendChild(appointmentItem);
    });
    
    // 空き状況インジケーター
    const availability = calculateDayAvailability(dayReservations, date);
    const indicator = createAvailabilityIndicator(availability);
    cell.appendChild(indicator);
    
    // クリックイベント
    cell.addEventListener('click', () => selectDate(date));
    
    grid.appendChild(cell);
  }
}

/**
 * 予約アイテムの作成
 */
function createAppointmentItem(reservation) {
  const item = document.createElement('div');
  item.className = 'appointment';
  
  // ステータスに応じてクラスを追加
  if (reservation.status === 'cancelled') {
    item.classList.add('cancelled');
  } else if (reservation.status === 'pending') {
    item.classList.add('pending');
  }
  
  const time = new Date(reservation.datetime);
  const timeStr = time.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  item.innerHTML = `
    <div class="appointment-time">${timeStr}</div>
    <div class="appointment-info">${reservation.name}</div>
  `;
  
  // クリックで詳細表示
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    showAppointmentDetails(reservation);
  });
  
  return item;
}

/**
 * 空き状況インジケーターの作成
 */
function createAvailabilityIndicator(availability) {
  const indicator = document.createElement('div');
  indicator.className = `availability-indicator ${availability.status}`;
  
  let symbol = '';
  let title = '';
  
  switch (availability.status) {
    case 'available':
      symbol = '○';
      title = '空きあり';
      break;
    case 'limited':
      symbol = '△';
      title = '残りわずか';
      break;
    case 'busy':
      symbol = '×';
      title = '予約満了';
      break;
  }
  
  indicator.textContent = symbol;
  indicator.title = title;
  
  return indicator;
}

/**
 * 日付選択
 */
function selectDate(date) {
  // 前の選択をクリア
  document.querySelectorAll('.calendar-cell.selected').forEach(cell => {
    cell.classList.remove('selected');
  });
  
  // 新しい選択を設定
  selectedDate = date;
  const dateKey = date.toISOString().split('T')[0];
  const cell = document.querySelector(`[data-date="${dateKey}"]`);
  if (cell) {
    cell.classList.add('selected');
  }
  
  // 詳細情報を更新
  updateSelectedDateInfo(date);
  loadTimeSlots(date);
  loadDayAppointments(date);
}

/**
 * 選択日情報の更新
 */
function updateSelectedDateInfo(date) {
  const infoElement = document.getElementById('selectedDateInfo');
  const dateStr = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  
  infoElement.innerHTML = `
    <h3 class="text-lg font-semibold text-gray-800">${dateStr}</h3>
    <p class="text-gray-600">予約状況と空き時間を確認できます</p>
  `;
}

/**
 * 時間枠の読み込み
 */
async function loadTimeSlots(date) {
  try {
    const timeSlotsContainer = document.getElementById('timeSlots');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    
    timeSlotsContainer.classList.remove('hidden');
    timeSlotsGrid.innerHTML = '';
    
    // その日の予約済み時間を取得
    const reservedSlots = await getReservedTimeSlots(date);
    const now = new Date();
    
    BUSINESS_HOURS.forEach(timeStr => {
      const slotElement = document.createElement('div');
      slotElement.className = 'time-slot';
      slotElement.textContent = timeStr;
      
      const slotTime = new Date(date);
      const [hours, minutes] = timeStr.split(':');
      slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // 予約状況の判定
      if (reservedSlots.includes(slotTime.toISOString())) {
        slotElement.classList.add('booked');
      } else if (slotTime <= now) {
        slotElement.classList.add('past');
      } else {
        slotElement.classList.add('available');
        slotElement.addEventListener('click', () => {
          // 新規予約作成（実装は他のファイルに委譲）
          if (typeof openNewAppointmentModal === 'function') {
            openNewAppointmentModal(slotTime);
          }
        });
      }
      
      timeSlotsGrid.appendChild(slotElement);
    });
    
  } catch (error) {
    console.error('❌ 時間枠読み込みエラー:', error);
  }
}

/**
 * その日の予約リストの読み込み
 */
async function loadDayAppointments(date) {
  try {
    const appointmentsContainer = document.getElementById('dayAppointments');
    const appointmentsList = document.getElementById('appointmentsList');
    
    appointmentsContainer.classList.remove('hidden');
    appointmentsList.innerHTML = '';
    
    // その日の予約を取得
    const appointments = await getDayReservations(date);
    
    if (appointments.length === 0) {
      appointmentsList.innerHTML = `
        <div class="text-center py-4 text-gray-500">
          この日の予約はありません
        </div>
      `;
      return;
    }
    
    appointments.forEach(appointment => {
      const appointmentItem = createAppointmentDetailItem(appointment);
      appointmentsList.appendChild(appointmentItem);
    });
    
  } catch (error) {
    console.error('❌ 日別予約読み込みエラー:', error);
  }
}

/**
 * 予約詳細アイテムの作成
 */
function createAppointmentDetailItem(appointment) {
  const item = document.createElement('div');
  item.className = 'appointment-detail-item bg-gray-50 p-3 rounded border';
  
  const time = new Date(appointment.datetime);
  const timeStr = time.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  let statusBadge = '';
  switch (appointment.status) {
    case 'confirmed':
      statusBadge = '<span class="badge bg-green-100 text-green-800">確定</span>';
      break;
    case 'pending':
      statusBadge = '<span class="badge bg-yellow-100 text-yellow-800">保留</span>';
      break;
    case 'cancelled':
      statusBadge = '<span class="badge bg-red-100 text-red-800">キャンセル</span>';
      break;
  }
  
  item.innerHTML = `
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-lg">${timeStr}</span>
          ${statusBadge}
          ${appointment.googleEventId ? '<span class="text-blue-500 text-sm">📅 Google同期済み</span>' : ''}
        </div>
        <div class="text-gray-700 mt-1">
          ${appointment.name} 様 - ${appointment.menuName}
        </div>
        <div class="text-sm text-gray-500">
          担当: ${appointment.staffName || '未指定'}
        </div>
      </div>
      <button onclick="showAppointmentDetails('${appointment.id}')" 
              class="text-blue-500 hover:text-blue-700 text-sm">
        詳細
      </button>
    </div>
  `;
  
  return item;
}

/**
 * 統計情報の更新
 */
async function updateStatistics() {
  try {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 今月の予約数
    const monthlyReservations = await getMonthReservations(year, month);
    document.getElementById('monthlyCount').textContent = monthlyReservations.length;
    
    // 今日の予約数
    const todayReservations = await getDayReservations(today);
    document.getElementById('todayCount').textContent = todayReservations.length;
    
    // 今日の空き時間数
    const reservedSlots = await getReservedTimeSlots(today);
    const availableSlots = BUSINESS_HOURS.length - reservedSlots.length;
    document.getElementById('availableSlots').textContent = Math.max(0, availableSlots);
    
  } catch (error) {
    console.error('❌ 統計情報更新エラー:', error);
  }
}

/**
 * リアルタイム更新の開始
 */
function startRealTimeUpdates() {
  if (!isRealTimeEnabled) return;
  
  // 30秒ごとに更新
  updateInterval = setInterval(async () => {
    try {
      await renderCalendarView();
      await updateStatistics();
      
      // 選択日がある場合は詳細も更新
      if (selectedDate) {
        await loadDayAppointments(selectedDate);
      }
      
    } catch (error) {
      console.error('❌ リアルタイム更新エラー:', error);
    }
  }, 30000);
  
  console.log('🔄 リアルタイム更新開始 (30秒間隔)');
}

/**
 * リアルタイム更新の停止
 */
function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('⏹️ リアルタイム更新停止');
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // 月の切り替え
  document.getElementById('prevMonth')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendarView();
  });
  
  document.getElementById('nextMonth')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendarView();
  });
  
  // カレンダー出力
  document.getElementById('exportCalendarBtn')?.addEventListener('click', exportCalendar);
  
  // 外部カレンダー取り込み
  document.getElementById('importCalendarBtn')?.addEventListener('click', importExternalCalendar);
  
  // 予約追加ボタン
  document.getElementById('addAppointmentBtn')?.addEventListener('click', () => {
    if (typeof openNewAppointmentModal === 'function') {
      openNewAppointmentModal();
    }
  });
}

// ユーティリティ関数

/**
 * 月の予約データを取得
 */
async function getMonthReservations(year, month) {
  try {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    const snapshot = await db.collection('reservations')
      .where('datetime', '>=', startOfMonth)
      .where('datetime', '<=', endOfMonth)
      .orderBy('datetime')
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
    console.error('❌ 月別予約取得エラー:', error);
    return [];
  }
}

/**
 * 日別予約データを取得
 */
async function getDayReservations(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection('reservations')
      .where('datetime', '>=', startOfDay)
      .where('datetime', '<=', endOfDay)
      .orderBy('datetime')
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
    console.error('❌ 日別予約取得エラー:', error);
    return [];
  }
}

/**
 * 予約済み時間枠を取得
 */
async function getReservedTimeSlots(date) {
  try {
    const reservations = await getDayReservations(date);
    return reservations
      .filter(r => r.status !== 'cancelled')
      .map(r => new Date(r.datetime).toISOString());
    
  } catch (error) {
    console.error('❌ 予約済み時間枠取得エラー:', error);
    return [];
  }
}

/**
 * 予約を日付でグループ化
 */
function groupReservationsByDate(reservations) {
  const grouped = {};
  
  reservations.forEach(reservation => {
    const date = new Date(reservation.datetime);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(reservation);
  });
  
  return grouped;
}

/**
 * 日の空き状況を計算
 */
function calculateDayAvailability(dayReservations, date) {
  const totalSlots = BUSINESS_HOURS.length;
  const bookedSlots = dayReservations.filter(r => r.status !== 'cancelled').length;
  const availableSlots = totalSlots - bookedSlots;
  
  let status = 'available';
  if (bookedSlots >= totalSlots) {
    status = 'busy';
  } else if (availableSlots <= totalSlots * 0.3) {
    status = 'limited';
  }
  
  return {
    status,
    total: totalSlots,
    booked: bookedSlots,
    available: availableSlots
  };
}

/**
 * カレンダーをエクスポート
 */
async function exportCalendar() {
  try {
    console.log('📤 カレンダーをエクスポート中...');
    
    // CSVフォーマットで予約データをエクスポート
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const reservations = await getMonthReservations(year, month);
    
    const csvContent = generateCSVContent(reservations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `salon_calendar_${year}${String(month + 1).padStart(2, '0')}.csv`;
    link.click();
    
    console.log('✅ カレンダーエクスポート完了');
    
  } catch (error) {
    console.error('❌ カレンダーエクスポートエラー:', error);
    alert('エクスポートに失敗しました: ' + error.message);
  }
}

/**
 * CSV内容の生成
 */
function generateCSVContent(reservations) {
  const headers = ['日時', '顧客名', 'メニュー', 'スタッフ', '料金', 'ステータス', '備考'];
  const rows = [headers];
  
  reservations.forEach(reservation => {
    const datetime = new Date(reservation.datetime).toLocaleString('ja-JP');
    const row = [
      datetime,
      reservation.name || '',
      reservation.menuName || '',
      reservation.staffName || '',
      reservation.menuPrice || '',
      reservation.status || '',
      reservation.note || ''
    ];
    rows.push(row);
  });
  
  return rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

/**
 * 外部カレンダーを取り込み
 */
async function importExternalCalendar() {
  try {
    if (typeof window.GoogleCalendarAPI !== 'undefined') {
      const result = await window.GoogleCalendarAPI.bidirectionalSync();
      alert('外部カレンダー取り込み完了');
    } else {
      alert('Google Calendar連携が設定されていません');
    }
    
  } catch (error) {
    console.error('❌ 外部カレンダー取り込みエラー:', error);
    alert('取り込みに失敗しました: ' + error.message);
  }
}

/**
 * 予約詳細を表示
 */
function showAppointmentDetails(appointmentId) {
  selectedAppointment = appointmentId;
  
  // モーダル表示の実装（他のファイルに委譲）
  if (typeof openAppointmentDetailsModal === 'function') {
    openAppointmentDetailsModal(appointmentId);
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  // Firebase接続確認後に初期化
  if (typeof db !== 'undefined') {
    initializeCalendarDisplay();
  } else {
    // Firebase初期化完了まで待機
    const checkFirebase = setInterval(() => {
      if (typeof db !== 'undefined') {
        clearInterval(checkFirebase);
        initializeCalendarDisplay();
      }
    }, 100);
  }
});

// ページ離脱時にリアルタイム更新を停止
window.addEventListener('beforeunload', () => {
  stopRealTimeUpdates();
});

// エクスポート
if (typeof window !== 'undefined') {
  window.CalendarDisplay = {
    initialize: initializeCalendarDisplay,
    render: renderCalendarView,
    selectDate: selectDate,
    updateStatistics: updateStatistics,
    startRealTime: startRealTimeUpdates,
    stopRealTime: stopRealTimeUpdates
  };
}