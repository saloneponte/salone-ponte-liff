// Accessibility Enhancements - Salone Ponte
// アクセシビリティ向上機能

// ===== アクセシビリティマネージャー =====

class AccessibilityManager {
  constructor() {
    this.focusedElement = null;
    this.announcements = [];
    this.keyboardNavigation = true;
    
    this.init();
  }
  
  init() {
    this.setupFocusManagement();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupColorContrastToggle();
    this.setupReducedMotionSupport();
    this.setupFontSizeControls();
    
    console.log('✅ Accessibility enhancements initialized');
  }
  
  // ===== フォーカス管理 =====
  
  setupFocusManagement() {
    // フォーカス可能要素の管理
    this.focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(',');
    
    // フォーカストラップの設定
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
    
    // フォーカス表示の強化
    document.addEventListener('focusin', (e) => {
      this.enhanceFocusVisibility(e.target);
    });
    
    document.addEventListener('focusout', (e) => {
      this.removeFocusEnhancement(e.target);
    });
  }
  
  handleTabNavigation(e) {
    const activeModal = document.querySelector('.modal-backdrop.flex');
    if (activeModal) {
      this.trapFocusInModal(e, activeModal);
    }
  }
  
  trapFocusInModal(e, modal) {
    const focusableElements = modal.querySelectorAll(this.focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
  
  enhanceFocusVisibility(element) {
    if (!element.classList.contains('focus-enhanced')) {
      element.classList.add('focus-enhanced');
      element.style.outline = '3px solid #3b82f6';
      element.style.outlineOffset = '2px';
    }
  }
  
  removeFocusEnhancement(element) {
    element.classList.remove('focus-enhanced');
    element.style.outline = '';
    element.style.outlineOffset = '';
  }
  
  // ===== キーボードナビゲーション =====
  
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      this.handleGlobalKeyboardShortcuts(e);
    });
    
    // Escキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.handleEscapeKey();
      }
    });
    
    // Enterキーでボタンを活性化
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('[role="button"]')) {
        e.target.click();
      }
    });
  }
  
  handleGlobalKeyboardShortcuts(e) {
    // Alt + M: メインコンテンツにスキップ
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      this.skipToMainContent();
    }
    
    // Alt + N: ナビゲーションにスキップ
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      this.skipToNavigation();
    }
    
    // Alt + S: 検索にスキップ
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      this.skipToSearch();
    }
    
    // Alt + H: ヘルプを表示
    if (e.altKey && e.key === 'h') {
      e.preventDefault();
      this.showAccessibilityHelp();
    }
  }
  
  skipToMainContent() {
    const mainContent = document.getElementById('mainContent') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      this.announce('メインコンテンツにスキップしました');
    }
  }
  
  skipToNavigation() {
    const navigation = document.getElementById('sideNav') || document.querySelector('nav');
    if (navigation) {
      const firstLink = navigation.querySelector('a, button');
      if (firstLink) {
        firstLink.focus();
        this.announce('ナビゲーションにスキップしました');
      }
    }
  }
  
  skipToSearch() {
    const searchInput = document.querySelector('input[type="search"], input[name="search"]');
    if (searchInput) {
      searchInput.focus();
      this.announce('検索にスキップしました');
    }
  }
  
  handleEscapeKey() {
    const activeModal = document.querySelector('.modal-backdrop.flex');
    if (activeModal && window.notificationManager) {
      // モーダルを閉じる
      const closeButton = activeModal.querySelector('.modal-close');
      if (closeButton) {
        closeButton.click();
      }
    }
  }
  
  // ===== スクリーンリーダーサポート =====
  
  setupScreenReaderSupport() {
    // ARIA live region の作成
    this.createAriaLiveRegion();
    
    // 動的コンテンツの更新を通知
    this.setupContentChangeAnnouncements();
    
    // ランドマークの設定
    this.setupLandmarks();
    
    // 状態の説明
    this.setupStateDescriptions();
  }
  
  createAriaLiveRegion() {
    if (document.getElementById('aria-live-region')) return;
    
    const liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
  }
  
  announce(message, priority = 'polite') {
    const liveRegion = document.getElementById('aria-live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // 複数のアナウンスが連続する場合の対応
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
  
  setupContentChangeAnnouncements() {
    // 統計データの更新を監視
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.handleContentChange(mutation.target);
        }
      });
    });
    
    // 統計要素を監視
    const statsElements = document.querySelectorAll('.stat-card, #todayReservations, #todaySales');
    statsElements.forEach(element => {
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }
  
  handleContentChange(element) {
    if (element.classList && element.classList.contains('stat-card')) {
      const label = element.querySelector('.text-gray-600')?.textContent;
      const value = element.querySelector('.text-3xl')?.textContent;
      if (label && value) {
        this.announce(`${label}が${value}に更新されました`);
      }
    }
  }
  
  setupLandmarks() {
    // ランドマークロールの追加
    const nav = document.querySelector('#sideNav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'メインナビゲーション');
    }
    
    const main = document.querySelector('#mainContent');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', 'メインコンテンツ');
    }
  }
  
  setupStateDescriptions() {
    // ボタンの状態説明
    document.querySelectorAll('button').forEach(button => {
      if (button.disabled) {
        button.setAttribute('aria-disabled', 'true');
      }
    });
    
    // 選択状態の説明
    document.querySelectorAll('.nav-item.active').forEach(item => {
      item.setAttribute('aria-current', 'page');
    });
  }
  
  // ===== カラーコントラスト =====
  
  setupColorContrastToggle() {
    this.createContrastToggle();
  }
  
  createContrastToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'contrast-toggle';
    toggle.className = 'fixed bottom-4 left-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors';
    toggle.innerHTML = '<span class="material-icons">contrast</span>';
    toggle.setAttribute('aria-label', 'コントラストを切り替える');
    toggle.setAttribute('data-tooltip', 'コントラスト切り替え');
    
    toggle.addEventListener('click', () => {
      this.toggleHighContrast();
    });
    
    document.body.appendChild(toggle);
  }
  
  toggleHighContrast() {
    const isHighContrast = document.body.classList.contains('high-contrast');
    
    if (isHighContrast) {
      document.body.classList.remove('high-contrast');
      this.announce('通常のコントラストに戻しました');
    } else {
      document.body.classList.add('high-contrast');
      this.announce('高コントラストモードを有効にしました');
    }
    
    // 設定を保存
    localStorage.setItem('high-contrast', !isHighContrast);
  }
  
  // ===== モーション制御 =====
  
  setupReducedMotionSupport() {
    // ユーザーの設定を確認
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const savedPreference = localStorage.getItem('reduced-motion');
    
    if (prefersReducedMotion || savedPreference === 'true') {
      this.enableReducedMotion();
    }
    
    this.createMotionToggle();
  }
  
  createMotionToggle() {
    const toggle = document.createElement('button');
    toggle.id = 'motion-toggle';
    toggle.className = 'fixed bottom-4 left-20 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors';
    toggle.innerHTML = '<span class="material-icons">motion_photos_off</span>';
    toggle.setAttribute('aria-label', 'アニメーションを切り替える');
    toggle.setAttribute('data-tooltip', 'アニメーション切り替え');
    
    toggle.addEventListener('click', () => {
      this.toggleReducedMotion();
    });
    
    document.body.appendChild(toggle);
  }
  
  enableReducedMotion() {
    document.body.classList.add('reduced-motion');
    
    // CSS で定義されたアニメーションを無効化
    const style = document.createElement('style');
    style.textContent = `
      .reduced-motion *,
      .reduced-motion *:before,
      .reduced-motion *:after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  toggleReducedMotion() {
    const isReduced = document.body.classList.contains('reduced-motion');
    
    if (isReduced) {
      document.body.classList.remove('reduced-motion');
      this.announce('アニメーションを有効にしました');
    } else {
      this.enableReducedMotion();
      this.announce('アニメーションを無効にしました');
    }
    
    localStorage.setItem('reduced-motion', !isReduced);
  }
  
  // ===== フォントサイズ制御 =====
  
  setupFontSizeControls() {
    this.createFontSizeControls();
    this.loadSavedFontSize();
  }
  
  createFontSizeControls() {
    const container = document.createElement('div');
    container.id = 'font-size-controls';
    container.className = 'fixed bottom-4 left-36 z-50 bg-gray-800 text-white rounded-lg shadow-lg overflow-hidden';
    
    container.innerHTML = `
      <button id="font-size-decrease" class="p-3 hover:bg-gray-700 transition-colors" aria-label="文字サイズを小さくする">
        <span class="material-icons">remove</span>
      </button>
      <button id="font-size-reset" class="p-3 hover:bg-gray-700 transition-colors border-x border-gray-600" aria-label="文字サイズをリセット">
        <span class="material-icons">text_fields</span>
      </button>
      <button id="font-size-increase" class="p-3 hover:bg-gray-700 transition-colors" aria-label="文字サイズを大きくする">
        <span class="material-icons">add</span>
      </button>
    `;
    
    document.body.appendChild(container);
    
    document.getElementById('font-size-decrease').addEventListener('click', () => {
      this.changeFontSize(-0.1);
    });
    
    document.getElementById('font-size-reset').addEventListener('click', () => {
      this.resetFontSize();
    });
    
    document.getElementById('font-size-increase').addEventListener('click', () => {
      this.changeFontSize(0.1);
    });
  }
  
  changeFontSize(delta) {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const newSize = Math.max(12, Math.min(24, currentSize + (delta * 16)));
    
    document.documentElement.style.fontSize = `${newSize}px`;
    localStorage.setItem('font-size', newSize);
    
    this.announce(`文字サイズを${newSize}ピクセルに変更しました`);
  }
  
  resetFontSize() {
    document.documentElement.style.fontSize = '';
    localStorage.removeItem('font-size');
    this.announce('文字サイズをリセットしました');
  }
  
  loadSavedFontSize() {
    const savedSize = localStorage.getItem('font-size');
    if (savedSize) {
      document.documentElement.style.fontSize = `${savedSize}px`;
    }
  }
  
  // ===== ヘルプ機能 =====
  
  showAccessibilityHelp() {
    const helpContent = `
      <div class="space-y-4">
        <h4 class="font-semibold text-lg mb-3">キーボードショートカット</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="font-medium">Alt + M</span>
            <span>メインコンテンツにスキップ</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Alt + N</span>
            <span>ナビゲーションにスキップ</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Alt + S</span>
            <span>検索にスキップ</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Esc</span>
            <span>モーダルを閉じる</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Tab / Shift+Tab</span>
            <span>要素間を移動</span>
          </div>
        </div>
        
        <h4 class="font-semibold text-lg mb-3 mt-6">アクセシビリティ機能</h4>
        <div class="space-y-2 text-sm">
          <p>• 画面左下のボタンでコントラストを調整できます</p>
          <p>• アニメーション効果の有無を切り替えられます</p>
          <p>• 文字サイズを調整できます</p>
          <p>• スクリーンリーダーに対応しています</p>
        </div>
        
        <h4 class="font-semibold text-lg mb-3 mt-6">サポート</h4>
        <p class="text-sm">アクセシビリティに関するご質問やサポートが必要な場合は、管理者にお問い合わせください。</p>
      </div>
    `;
    
    if (window.createModal) {
      const modal = window.createModal({
        title: 'アクセシビリティヘルプ',
        content: helpContent,
        size: 'large'
      });
      modal.show();
    }
  }
  
  // ===== 設定の読み込み =====
  
  loadSavedSettings() {
    // コントラスト設定
    if (localStorage.getItem('high-contrast') === 'true') {
      document.body.classList.add('high-contrast');
    }
    
    // モーション設定
    if (localStorage.getItem('reduced-motion') === 'true') {
      this.enableReducedMotion();
    }
    
    // フォントサイズ設定
    this.loadSavedFontSize();
  }
}

// ===== スキップリンクの追加 =====

function addSkipLinks() {
  const skipLinks = document.createElement('div');
  skipLinks.className = 'skip-links';
  skipLinks.innerHTML = `
    <a href="#mainContent" class="skip-link">メインコンテンツにスキップ</a>
    <a href="#sideNav" class="skip-link">ナビゲーションにスキップ</a>
  `;
  
  // スキップリンクのスタイル
  const style = document.createElement('style');
  style.textContent = `
    .skip-links {
      position: absolute;
      top: -100px;
      left: 0;
      z-index: 1000;
    }
    
    .skip-link {
      position: absolute;
      top: 0;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 0 0 4px 0;
      font-weight: bold;
      transform: translateY(-100%);
      transition: transform 0.2s;
    }
    
    .skip-link:focus {
      transform: translateY(0);
    }
  `;
  
  document.head.appendChild(style);
  document.body.insertAdjacentElement('afterbegin', skipLinks);
}

// ===== 初期化 =====

document.addEventListener('DOMContentLoaded', function() {
  // スキップリンクを追加
  addSkipLinks();
  
  // アクセシビリティマネージャーを初期化
  window.accessibilityManager = new AccessibilityManager();
  
  // 保存された設定を読み込み
  window.accessibilityManager.loadSavedSettings();
  
  console.log('✅ Accessibility enhancements ready');
});

// ===== グローバル関数 =====

// アナウンス用のヘルパー関数
window.announceToScreenReader = function(message, priority = 'polite') {
  if (window.accessibilityManager) {
    window.accessibilityManager.announce(message, priority);
  }
};

// フォーカス管理のヘルパー関数
window.manageFocus = function(element) {
  if (element && typeof element.focus === 'function') {
    element.focus();
    if (window.accessibilityManager) {
      window.accessibilityManager.enhanceFocusVisibility(element);
    }
  }
};