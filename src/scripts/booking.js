// 予約システムメイン - Salone Ponte

// グローバル変数
let selectedMenu = null;
let selectedStaff = null;
let selectedDate = null;
let selectedTime = null;
let currentStep = 1;
let userId = "";
let userName = "";
let isExistingCustomer = false;
let currentDisplayMonth = new Date(); // 今日を基準にする

// データ
let menusData = [];
let staffsData = [];

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await initializeLIFF();
  await loadMenus();
  setupEventListeners();
});

// LIFF初期化
async function initializeLIFF() {
  try {
    await liff.init({ liffId: LIFF_CONFIG.LIFF_ID });
    if (!liff.isLoggedIn()) {
      await liff.login();
      return;
    }
    const profile = await liff.getProfile();
    userId = profile.userId;
    userName = profile.displayName;
    
    // 既存顧客チェック
    const customerDoc = await db.collection("customers").doc(userId).get();
    isExistingCustomer = customerDoc.exists;
    
  } catch (error) {
    console.log("LIFF初期化エラー:", error);
    // LIFF環境でない場合はデモモード
    userId = "demo_user_" + Date.now();
    userName = "デモユーザー";
    isExistingCustomer = false;
  }
}

// イベントリスナー設定
function setupEventListeners() {
  // ナビゲーションボタン
  document.getElementById('menuNextBtn').onclick = () => goToStep(2);
  document.getElementById('staffNextBtn').onclick = () => goToStep(3);
  document.getElementById('datetimeNextBtn').onclick = () => goToStep(4);
  
  document.getElementById('staffBackBtn').onclick = () => goToStep(1);
  document.getElementById('datetimeBackBtn').onclick = () => goToStep(2);
  document.getElementById('confirmBackBtn').onclick = () => goToStep(3);
  
  // カレンダーナビゲーション
  document.getElementById('prevMonthBtn').onclick = () => {
    currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() - 1);
    renderCalendar();
  };
  document.getElementById('nextMonthBtn').onclick = () => {
    currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() + 1);
    renderCalendar();
  };
  
  // 予約確定
  document.getElementById('bookingSubmitBtn').onclick = submitBooking;
}

// ステップ移動
function goToStep(step) {
  // 現在のステップを完了マークに
  if (currentStep < step) {
    document.getElementById(`step${currentStep}`).classList.add('completed');
    document.getElementById(`step${currentStep}`).classList.remove('active');
  }
  
  // 新しいステップをアクティブに
  document.getElementById(`step${step}`).classList.add('active');
  document.getElementById(`step${step}`).classList.remove('completed');
  
  // セクション切り替え
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  
  const progressConfig = UI_CONFIG.PROGRESS_STEPS;
  
  if (step === 1) {
    document.getElementById('menuSection').classList.add('active');
    updateProgress(progressConfig.MENU.percent);
  } else if (step === 2) {
    document.getElementById('staffSection').classList.add('active');
    loadStaffs();
    updateProgress(progressConfig.STAFF.percent);
  } else if (step === 3) {
    document.getElementById('datetimeSection').classList.add('active');
    renderCalendar();
    updateProgress(progressConfig.DATETIME.percent);
  } else if (step === 4) {
    document.getElementById('confirmSection').classList.add('active');
    loadConfirmation();
    updateProgress(progressConfig.CONFIRM.percent);
  }
  
  currentStep = step;
}

// メニュー読み込み
async function loadMenus() {
  try {
    const snapshot = await db.collection("menus").get();
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
    
    renderMenus();
  } catch (error) {
    console.error("メニュー読み込みエラー:", error);
    // サンプルデータで続行
    menusData = SAMPLE_MENUS;
    renderMenus();
  }
}

// メニュー表示
function renderMenus() {
  const grid = document.getElementById('menuGrid');
  const loading = document.getElementById('menuLoading');
  
  loading.style.display = 'none';
  grid.style.display = 'block';
  grid.innerHTML = '';

  menusData.forEach(menu => {
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.innerHTML = `
      <div class="menu-header">
        <img src="${menu.photoURL || 'https://via.placeholder.com/60'}" 
             alt="${menu.name}" class="menu-image">
        <div class="menu-info">
          <h3>${menu.name}</h3>
          <div class="menu-price">¥${menu.price.toLocaleString()}</div>
        </div>
      </div>
      <div class="menu-duration">所要時間: ${menu.duration}分</div>
      <div class="menu-description">${menu.description || ''}</div>
    `;
    
    item.onclick = () => selectMenu(menu, item);
    grid.appendChild(item);
  });
}

// メニュー選択
function selectMenu(menu, element) {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');
  
  selectedMenu = menu;
  document.getElementById('menuNextBtn').style.display = 'block';
  document.getElementById('menuNextBtn').disabled = false;
}

// スタッフ読み込み
async function loadStaffs() {
  try {
    const snapshot = await db.collection("staffs").get();
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
    
    renderStaffs();
  } catch (error) {
    console.error("スタッフ読み込みエラー:", error);
    // サンプルデータで続行
    staffsData = SAMPLE_STAFF;
    renderStaffs();
  }
}

// スタッフ表示
function renderStaffs() {
  const grid = document.getElementById('staffGrid');
  grid.innerHTML = '';

  staffsData.forEach(staff => {
    const item = document.createElement('div');
    item.className = 'staff-item';
    item.innerHTML = `
      <div class="staff-header">
        <img src="${staff.photoURL || 'https://via.placeholder.com/60'}" 
             alt="${staff.name}" class="staff-image">
        <div class="staff-info">
          <h3>${staff.name}</h3>
          <div class="staff-role">${staff.role || 'スタイリスト'}</div>
        </div>
      </div>
      <div class="staff-specialty">${staff.specialty || ''}</div>
    `;
    
    item.onclick = () => selectStaff(staff, item);
    grid.appendChild(item);
  });
}

// スタッフ選択
function selectStaff(staff, element) {
  document.querySelectorAll('.staff-item').forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');
  
  selectedStaff = staff;
  document.getElementById('staffNextBtn').style.display = 'block';
  document.getElementById('staffNextBtn').disabled = false;
}