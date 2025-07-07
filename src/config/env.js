// 環境変数管理 - Salone Ponte
// セキュアな認証情報の読み込みとバリデーション

/**
 * 環境変数のバリデーション設定
 */
const ENV_VALIDATION = {
  // 必須項目
  required: [
    'LIFF_ID',
    'FIREBASE_API_KEY',
    'FIREBASE_PROJECT_ID'
  ],
  // 本番環境で必須の項目
  productionRequired: [
    'LINE_CHANNEL_SECRET',
    'LINE_CHANNEL_ACCESS_TOKEN',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ]
};

/**
 * 環境変数の読み込みと検証
 */
class EnvironmentConfig {
  constructor() {
    this.config = {};
    this.isProduction = this.getEnvironment() === 'production';
    this.loadConfig();
    this.validateConfig();
  }

  /**
   * 現在の実行環境を取得
   * @returns {string} 'development' | 'production' | 'test'
   */
  getEnvironment() {
    // ブラウザ環境での判定
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      if (hostname.includes('vercel.app') || hostname.includes('salone-ponte')) {
        return 'production';
      }
    }
    
    // Node.js環境での判定
    return process.env.NODE_ENV || 'development';
  }

  /**
   * 環境変数を安全に読み込み
   */
  loadConfig() {
    try {
      // ブラウザ環境では window.ENV から読み込み
      if (typeof window !== 'undefined' && window.ENV) {
        this.config = { ...window.ENV };
      } 
      // Node.js環境では process.env から読み込み
      else if (typeof process !== 'undefined' && process.env) {
        this.config = {
          LIFF_ID: process.env.LIFF_ID,
          LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
          LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
          FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
          FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
          FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
          FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
          FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
          GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
          GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
          NODE_ENV: process.env.NODE_ENV,
          APP_URL: process.env.APP_URL,
          SECURE_MODE: process.env.SECURE_MODE,
          LOG_LEVEL: process.env.LOG_LEVEL
        };
      }
      // フォールバック: デフォルト設定を使用
      else {
        this.loadFallbackConfig();
      }
    } catch (error) {
      console.warn('環境変数の読み込みに失敗しました。フォールバック設定を使用します。');
      this.loadFallbackConfig();
    }
  }

  /**
   * フォールバック設定の読み込み
   * 開発環境でのみ使用される安全な設定
   */
  loadFallbackConfig() {
    if (this.isProduction) {
      throw new Error('本番環境では環境変数の設定が必須です');
    }

    console.warn('⚠️ フォールバック設定を使用中: 本番環境では環境変数を設定してください');
    
    this.config = {
      LIFF_ID: '2007345180-oVA2L6dw', // 開発用
      FIREBASE_API_KEY: 'AIzaSyAK14FMyp7VGYZPakGDmLdgHsvvxT-b0TM',
      FIREBASE_AUTH_DOMAIN: 'salone-ponte-fceca.firebaseapp.com',
      FIREBASE_PROJECT_ID: 'salone-ponte-fceca',
      FIREBASE_STORAGE_BUCKET: 'salone-ponte-fceca.appspot.com',
      FIREBASE_MESSAGING_SENDER_ID: '463711728652',
      FIREBASE_APP_ID: '1:463711728652:web:59c749e11d201b26b86a29',
      FIREBASE_MEASUREMENT_ID: 'G-MPWGTB6R7C',
      GOOGLE_CLIENT_ID: 'your_google_client_id_here', // 開発用ダミー
      GOOGLE_CLIENT_SECRET: 'your_google_client_secret_here',
      GOOGLE_API_KEY: 'your_google_api_key_here',
      GOOGLE_CALENDAR_ID: 'primary',
      NODE_ENV: 'development',
      APP_URL: 'http://localhost:3000',
      SECURE_MODE: 'false',
      LOG_LEVEL: 'debug'
    };
  }

  /**
   * 設定値のバリデーション
   */
  validateConfig() {
    const missingRequired = [];
    const missingProduction = [];

    // 必須項目のチェック
    ENV_VALIDATION.required.forEach(key => {
      if (!this.config[key]) {
        missingRequired.push(key);
      }
    });

    // 本番環境必須項目のチェック
    if (this.isProduction) {
      ENV_VALIDATION.productionRequired.forEach(key => {
        if (!this.config[key]) {
          missingProduction.push(key);
        }
      });
    }

    // エラーハンドリング
    if (missingRequired.length > 0) {
      throw new Error(`必須の環境変数が設定されていません: ${missingRequired.join(', ')}`);
    }

    if (missingProduction.length > 0) {
      throw new Error(`本番環境で必須の環境変数が設定されていません: ${missingProduction.join(', ')}`);
    }

    // セキュリティチェック
    this.validateSecurity();
  }

  /**
   * セキュリティ設定の検証
   */
  validateSecurity() {
    // LIFF IDの形式チェック
    if (this.config.LIFF_ID && !this.config.LIFF_ID.match(/^\d+-\w+$/)) {
      console.warn('⚠️ LIFF IDの形式が正しくない可能性があります');
    }

    // APIキーの形式チェック
    if (this.config.FIREBASE_API_KEY && !this.config.FIREBASE_API_KEY.startsWith('AIza')) {
      console.warn('⚠️ Firebase API キーの形式が正しくない可能性があります');
    }

    // 本番環境でのセキュリティチェック
    if (this.isProduction) {
      if (this.config.LOG_LEVEL === 'debug') {
        console.warn('⚠️ 本番環境でデバッグログが有効になっています');
      }

      if (this.config.SECURE_MODE !== 'true') {
        console.warn('⚠️ 本番環境でセキュアモードが無効になっています');
      }
    }
  }

  /**
   * 設定値を安全に取得
   * @param {string} key - 設定キー
   * @param {*} defaultValue - デフォルト値
   * @returns {*} 設定値
   */
  get(key, defaultValue = null) {
    const value = this.config[key];
    
    // 機密情報のログ出力を防止
    const sensitiveKeys = ['SECRET', 'TOKEN', 'KEY', 'PASSWORD'];
    const isSensitive = sensitiveKeys.some(sensitive => key.includes(sensitive));
    
    if (value === undefined || value === null) {
      if (!isSensitive) {
        console.debug(`設定値が見つかりません: ${key}, デフォルト値を使用: ${defaultValue}`);
      }
      return defaultValue;
    }

    return value;
  }

  /**
   * Firebase設定オブジェクトを取得
   * @returns {object} Firebase設定
   */
  getFirebaseConfig() {
    return {
      apiKey: this.get('FIREBASE_API_KEY'),
      authDomain: this.get('FIREBASE_AUTH_DOMAIN'),
      projectId: this.get('FIREBASE_PROJECT_ID'),
      storageBucket: this.get('FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: this.get('FIREBASE_MESSAGING_SENDER_ID'),
      appId: this.get('FIREBASE_APP_ID'),
      measurementId: this.get('FIREBASE_MEASUREMENT_ID')
    };
  }

  /**
   * LIFF設定オブジェクトを取得
   * @returns {object} LIFF設定
   */
  getLIFFConfig() {
    return {
      LIFF_ID: this.get('LIFF_ID')
    };
  }

  /**
   * LINE Messaging API設定を取得
   * @returns {object} LINE API設定
   */
  getLineConfig() {
    return {
      channelSecret: this.get('LINE_CHANNEL_SECRET'),
      channelAccessToken: this.get('LINE_CHANNEL_ACCESS_TOKEN')
    };
  }

  /**
   * Google Calendar API設定を取得
   * @returns {object} Google Calendar API設定
   */
  getGoogleCalendarConfig() {
    return {
      clientId: this.get('GOOGLE_CLIENT_ID'),
      clientSecret: this.get('GOOGLE_CLIENT_SECRET'),
      apiKey: this.get('GOOGLE_API_KEY'),
      calendarId: this.get('GOOGLE_CALENDAR_ID', 'primary')
    };
  }

  /**
   * 現在の設定状態を取得（機密情報を除く）
   * @returns {object} 設定状態
   */
  getStatus() {
    return {
      environment: this.getEnvironment(),
      isProduction: this.isProduction,
      configLoaded: Object.keys(this.config).length > 0,
      hasLIFF: !!this.config.LIFF_ID,
      hasFirebase: !!this.config.FIREBASE_API_KEY,
      hasLineAPI: !!(this.config.LINE_CHANNEL_SECRET && this.config.LINE_CHANNEL_ACCESS_TOKEN),
      hasGoogleCalendar: !!(this.config.GOOGLE_CLIENT_ID && this.config.GOOGLE_API_KEY),
      secureMode: this.config.SECURE_MODE === 'true',
      logLevel: this.config.LOG_LEVEL || 'info'
    };
  }
}

// シングルトンインスタンスを作成
let envConfig = null;

/**
 * 環境設定インスタンスを取得
 * @returns {EnvironmentConfig} 環境設定インスタンス
 */
function getEnvConfig() {
  if (!envConfig) {
    try {
      envConfig = new EnvironmentConfig();
      
      // 設定状態をログ出力（開発環境のみ）
      if (!envConfig.isProduction) {
        console.log('📋 環境設定ステータス:', envConfig.getStatus());
      }
    } catch (error) {
      console.error('❌ 環境設定の初期化に失敗:', error.message);
      throw error;
    }
  }
  return envConfig;
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  // Node.js環境
  module.exports = {
    getEnvConfig,
    EnvironmentConfig
  };
} else {
  // ブラウザ環境
  window.EnvConfig = {
    getEnvConfig,
    EnvironmentConfig
  };
}