// セキュリティ設定 - Salone Ponte
// 認証情報の保護とセキュリティ強化

/**
 * セキュリティ設定クラス
 */
class SecurityManager {
  constructor() {
    this.secureMode = false;
    this.logLevel = 'info';
    this.sensitiveKeys = ['SECRET', 'TOKEN', 'KEY', 'PASSWORD', 'PRIVATE'];
    this.initialize();
  }

  /**
   * セキュリティ設定の初期化
   */
  initialize() {
    try {
      // 環境設定からセキュリティ設定を取得
      const envConfig = typeof getEnvConfig !== 'undefined' ? getEnvConfig() : null;
      
      if (envConfig) {
        this.secureMode = envConfig.get('SECURE_MODE') === 'true';
        this.logLevel = envConfig.get('LOG_LEVEL', 'info');
      }

      // 本番環境の自動検出
      if (this.isProductionEnvironment()) {
        this.secureMode = true;
        this.logLevel = this.logLevel === 'debug' ? 'info' : this.logLevel;
      }

      this.setupSecurityHeaders();
      this.setupCSP();
      
    } catch (error) {
      console.warn('セキュリティ設定の初期化で警告:', error.message);
    }
  }

  /**
   * 本番環境の判定
   * @returns {boolean} 本番環境かどうか
   */
  isProductionEnvironment() {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return hostname.includes('vercel.app') || 
             hostname.includes('salone-ponte') || 
             (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'));
    }
    return process.env.NODE_ENV === 'production';
  }

  /**
   * セキュリティヘッダーの設定
   */
  setupSecurityHeaders() {
    if (typeof document !== 'undefined' && this.secureMode) {
      // CSRFトークンの設定
      const csrfMeta = document.createElement('meta');
      csrfMeta.name = 'csrf-token';
      csrfMeta.content = this.generateCSRFToken();
      document.head.appendChild(csrfMeta);
    }
  }

  /**
   * Content Security Policy の設定
   */
  setupCSP() {
    if (typeof document !== 'undefined' && this.secureMode) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = this.generateCSPPolicy();
      document.head.appendChild(cspMeta);
    }
  }

  /**
   * CSP ポリシーの生成
   * @returns {string} CSP ポリシー
   */
  generateCSPPolicy() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://static.line-scdn.net https://www.gstatic.com https://cdn.jsdelivr.net https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdn.tailwindcss.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.line.me",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ');
  }

  /**
   * CSRF トークンの生成
   * @returns {string} CSRF トークン
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 安全なログ出力
   * @param {string} level - ログレベル
   * @param {string} message - メッセージ
   * @param {*} data - データ
   */
  secureLog(level, message, data = null) {
    // ログレベルのチェック
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel] || 1;
    const messageLevel = levels[level] || 1;

    if (messageLevel < currentLevel) {
      return; // ログレベルが低い場合は出力しない
    }

    // 機密情報のサニタイズ
    const sanitizedData = data ? this.sanitizeData(data) : null;
    
    switch (level) {
      case 'debug':
        console.debug(`[DEBUG] ${message}`, sanitizedData);
        break;
      case 'info':
        console.info(`[INFO] ${message}`, sanitizedData);
        break;
      case 'warn':
        console.warn(`[WARN] ${message}`, sanitizedData);
        break;
      case 'error':
        console.error(`[ERROR] ${message}`, sanitizedData);
        break;
      default:
        console.log(`[LOG] ${message}`, sanitizedData);
    }
  }

  /**
   * データのサニタイズ（機密情報の除去）
   * @param {*} data - サニタイズするデータ
   * @returns {*} サニタイズされたデータ
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      // 機密情報キーの検出
      const isSensitive = this.sensitiveKeys.some(sensitive => 
        key.toUpperCase().includes(sensitive)
      );

      if (isSensitive) {
        sanitized[key] = this.maskSensitiveValue(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 機密情報値のマスク
   * @param {*} value - マスクする値
   * @returns {string} マスクされた値
   */
  maskSensitiveValue(value) {
    if (typeof value !== 'string') {
      return '[HIDDEN]';
    }

    if (value.length <= 4) {
      return '****';
    }

    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = '*'.repeat(Math.max(4, value.length - 4));
    
    return `${start}${middle}${end}`;
  }

  /**
   * 入力値のバリデーション
   * @param {string} input - 入力値
   * @param {string} type - バリデーションタイプ
   * @returns {boolean} バリデーション結果
   */
  validateInput(input, type) {
    if (!input || typeof input !== 'string') {
      return false;
    }

    switch (type) {
      case 'liff_id':
        return /^\d+-\w+$/.test(input);
      case 'firebase_api_key':
        return input.startsWith('AIza') && input.length > 20;
      case 'line_token':
        return input.length > 50 && /^[A-Za-z0-9+/=]+$/.test(input);
      case 'firebase_project_id':
        return /^[a-z0-9-]+$/.test(input) && input.length > 3;
      default:
        return input.length > 0;
    }
  }

  /**
   * セキュリティ状態の取得
   * @returns {object} セキュリティ状態
   */
  getSecurityStatus() {
    return {
      secureMode: this.secureMode,
      logLevel: this.logLevel,
      isProduction: this.isProductionEnvironment(),
      cspEnabled: this.secureMode,
      sensitiveDataProtection: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * セキュリティ違反の報告
   * @param {string} type - 違反タイプ
   * @param {string} details - 詳細
   */
  reportSecurityViolation(type, details) {
    const violation = {
      type,
      details,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };

    this.secureLog('error', `セキュリティ違反検出: ${type}`, violation);

    // 本番環境では外部監視サービスに送信（実装時）
    if (this.secureMode) {
      // TODO: 外部セキュリティ監視サービスへの送信
      console.error('🚨 セキュリティ違反が検出されました:', violation);
    }
  }
}

// グローバルインスタンス
let securityManager = null;

/**
 * セキュリティマネージャーのインスタンスを取得
 * @returns {SecurityManager} セキュリティマネージャー
 */
function getSecurityManager() {
  if (!securityManager) {
    securityManager = new SecurityManager();
  }
  return securityManager;
}

// グローバル関数のエクスポート
if (typeof window !== 'undefined') {
  window.SecurityManager = SecurityManager;
  window.getSecurityManager = getSecurityManager;
  
  // 安全なログ関数をグローバルに公開
  window.secureLog = (level, message, data) => {
    getSecurityManager().secureLog(level, message, data);
  };
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SecurityManager,
    getSecurityManager
  };
}