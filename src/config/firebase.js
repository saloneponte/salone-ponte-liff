// Firebase設定 - Salone Ponte
// 環境変数を使用したセキュアな設定

// 環境設定を読み込み
let firebaseConfig;
let db;

try {
  // 環境設定の初期化
  const envConfig = typeof getEnvConfig !== 'undefined' ? getEnvConfig() : null;
  
  if (envConfig) {
    // 環境変数からFirebase設定を取得
    firebaseConfig = envConfig.getFirebaseConfig();
    
    // 設定の検証
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Firebase設定が不完全です');
    }
    
    console.log('✅ Firebase設定を環境変数から読み込みました');
  } else {
    // フォールバック: 従来の設定（開発環境のみ）
    console.warn('⚠️ 環境設定が利用できません。フォールバック設定を使用します。');
    
    firebaseConfig = {
      apiKey: "AIzaSyAK14FMyp7VGYZPakGDmLdgHsvvxT-b0TM",
      authDomain: "salone-ponte-fceca.firebaseapp.com",
      projectId: "salone-ponte-fceca",
      storageBucket: "salone-ponte-fceca.appspot.com",
      messagingSenderId: "463711728652",
      appId: "1:463711728652:web:59c749e11d201b26b86a29",
      measurementId: "G-MPWGTB6R7C"
    };
  }

  // Firebase初期化
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  
  console.log('🔥 Firebase初期化完了');
  
} catch (error) {
  console.error('❌ Firebase初期化エラー:', error.message);
  
  // エラー時のフォールバック処理
  if (typeof window !== 'undefined') {
    window.firebaseError = error;
  }
  
  throw error;
}