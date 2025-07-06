// 定数・設定値 - Salone Ponte

// LIFF設定 - 環境変数対応
let LIFF_CONFIG;

try {
  // 環境設定の初期化
  const envConfig = typeof getEnvConfig !== 'undefined' ? getEnvConfig() : null;
  
  if (envConfig) {
    // 環境変数からLIFF設定を取得
    LIFF_CONFIG = envConfig.getLIFFConfig();
    console.log('✅ LIFF設定を環境変数から読み込みました');
  } else {
    // フォールバック設定
    console.warn('⚠️ 環境設定が利用できません。フォールバックLIFF設定を使用します。');
    LIFF_CONFIG = {
      LIFF_ID: "2007345180-oVA2L6dw"
    };
  }
  
  // LIFF ID検証
  if (!LIFF_CONFIG.LIFF_ID) {
    throw new Error('LIFF IDが設定されていません');
  }
  
} catch (error) {
  console.error('❌ LIFF設定エラー:', error.message);
  
  // デフォルト設定
  LIFF_CONFIG = {
    LIFF_ID: "2007345180-oVA2L6dw"
  };
}

// 営業時間設定
const BUSINESS_HOURS = [
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

// サンプルデータ
const SAMPLE_MENUS = [
  {id: 'menu1', name: 'カット', price: 4000, duration: 60, description: 'シャンプー・ブロー込み'},
  {id: 'menu2', name: 'カット＋カラー', price: 8000, duration: 120, description: 'カット＋カラー＋トリートメント'},
  {id: 'menu3', name: 'カット＋パーマ', price: 12000, duration: 180, description: 'カット＋デジタルパーマ'}
];

const SAMPLE_STAFF = [
  {id: 'staff1', name: '山田 さくら', role: 'トップスタイリスト', specialty: 'カラーリング、ヘアケア'},
  {id: 'staff2', name: '田中 健太', role: 'スタイリスト', specialty: 'カット、パーマ'},
  {id: 'staff3', name: '佐々木 美香', role: 'アシスタント', specialty: 'シャンプー、ブロー'}
];

// UI設定
const UI_CONFIG = {
  PROGRESS_STEPS: {
    MENU: { percent: 20, step: 1 },
    STAFF: { percent: 40, step: 2 },
    DATETIME: { percent: 60, step: 3 },
    CONFIRM: { percent: 80, step: 4 },
    COMPLETE: { percent: 100, step: 5 }
  }
};