// カレンダー・日時選択機能 - Salone Ponte

// カレンダー表示（今日基準に修正）
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  // 曜日ヘッダーを保持
  const headers = grid.querySelectorAll('.date-header');
  grid.innerHTML = '';
  headers.forEach(header => grid.appendChild(header));

  const year = currentDisplayMonth.getFullYear();
  const month = currentDisplayMonth.getMonth();
  
  // 月表示更新
  document.getElementById('currentMonth').textContent = 
    `${year}年${month + 1}月`;

  // カレンダー生成
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // 今日の日付（時間を0にリセット）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dateItem = document.createElement('div');
    dateItem.className = 'date-item';
    dateItem.textContent = date.getDate();
    
    // 他月の日付
    if (date.getMonth() !== month) {
      dateItem.classList.add('other-month');
    }
    
    // 過去の日付を無効化（今日より前）
    if (date < today) {
      dateItem.classList.add('disabled');
    }
    
    // 今日の日付をハイライト
    if (date.getTime() === today.getTime()) {
      dateItem.classList.add('today');
    }
    
    // 選択された日付
    if (selectedDate && date.getTime() === selectedDate.getTime()) {
      dateItem.classList.add('selected');
    }
    
    // クリックイベント（有効な日付のみ）
    if (!dateItem.classList.contains('disabled') && !dateItem.classList.contains('other-month')) {
      dateItem.onclick = () => selectDate(date, dateItem);
    }
    
    grid.appendChild(dateItem);
  }
}

// 日付選択
function selectDate(date, element) {
  document.querySelectorAll('.date-item').forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');
  
  selectedDate = date;
  loadTimeSlots();
}

// 時間枠読み込み
async function loadTimeSlots() {
  const timePicker = document.getElementById('timePicker');
  const timeGrid = document.getElementById('timeGrid');
  
  timePicker.style.display = 'block';
  timeGrid.innerHTML = '';

  // 予約済み時間取得
  const reservedSlots = await getReservedSlots(selectedDate);
  const now = new Date();

  BUSINESS_HOURS.forEach(timeStr => {
    const timeItem = document.createElement('div');
    timeItem.className = 'time-slot';
    timeItem.textContent = timeStr;
    
    const slotTime = new Date(selectedDate);
    const [hours, minutes] = timeStr.split(':');
    slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // 過去の時間または予約済みの時間を無効化
    if (reservedSlots.includes(slotTime.toISOString()) || slotTime <= now) {
      timeItem.classList.add('disabled');
    } else {
      timeItem.onclick = () => selectTime(slotTime, timeItem);
    }
    
    timeGrid.appendChild(timeItem);
  });
}

// 予約済み時間枠取得
async function getReservedSlots(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const snapshot = await db.collection("reservations")
      .where("staffId", "==", selectedStaff.id)
      .where("datetime", ">=", startOfDay.toISOString())
      .where("datetime", "<=", endOfDay.toISOString())
      .get();
    
    const reserved = [];
    snapshot.forEach(doc => {
      reserved.push(doc.data().datetime);
    });
    
    return reserved;
  } catch (error) {
    console.error("予約確認エラー:", error);
    return [];
  }
}

// 時間選択
function selectTime(time, element) {
  document.querySelectorAll('.time-slot').forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');
  
  selectedTime = time;
  document.getElementById('datetimeNextBtn').style.display = 'block';
  document.getElementById('datetimeNextBtn').disabled = false;
}