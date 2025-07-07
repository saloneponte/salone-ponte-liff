// Enhanced UI Components - Salone Ponte
// 改善されたUIコンポーネントライブラリ

// ===== モーダルコンポーネント =====

class Modal {
  constructor(options = {}) {
    this.options = {
      title: options.title || '',
      content: options.content || '',
      size: options.size || 'medium', // small, medium, large, full
      showCloseButton: options.showCloseButton !== false,
      backdrop: options.backdrop !== false,
      keyboard: options.keyboard !== false,
      animate: options.animate !== false,
      className: options.className || '',
      onShow: options.onShow || null,
      onHide: options.onHide || null,
      ...options
    };
    
    this.id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.element = null;
    this.isVisible = false;
  }
  
  create() {
    const sizeClasses = {
      small: 'max-w-sm',
      medium: 'max-w-md',
      large: 'max-w-2xl',
      full: 'max-w-full mx-4'
    };
    
    const modalHTML = `
      <div id="${this.id}" class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 ${this.options.animate ? 'transition-opacity duration-300' : ''}" role="dialog" aria-modal="true" aria-labelledby="${this.id}-title">
        <div class="modal-content bg-white rounded-lg ${sizeClasses[this.options.size]} w-full ${this.options.className} ${this.options.animate ? 'transform transition-transform duration-300 scale-95' : ''}" role="document">
          ${this.options.title ? `
            <div class="modal-header flex items-center justify-between p-6 border-b border-gray-200">
              <h3 id="${this.id}-title" class="text-lg font-semibold text-gray-900">${this.options.title}</h3>
              ${this.options.showCloseButton ? `
                <button type="button" class="modal-close text-gray-400 hover:text-gray-600 transition-colors" aria-label="閉じる">
                  <span class="material-icons">close</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
          <div class="modal-body p-6">
            ${this.options.content}
          </div>
          ${this.options.footer ? `
            <div class="modal-footer p-6 border-t border-gray-200">
              ${this.options.footer}
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.element = document.getElementById(this.id);
    this.setupEventListeners();
    
    return this;
  }
  
  setupEventListeners() {
    // 閉じるボタン
    const closeButton = this.element.querySelector('.modal-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }
    
    // 背景クリック
    if (this.options.backdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
    }
    
    // ESCキー
    if (this.options.keyboard) {
      this.keydownHandler = (e) => {
        if (e.key === 'Escape' && this.isVisible) {
          this.hide();
        }
      };
      document.addEventListener('keydown', this.keydownHandler);
    }
  }
  
  show() {
    if (!this.element) {
      this.create();
    }
    
    this.isVisible = true;
    this.element.classList.remove('hidden');
    this.element.classList.add('flex');
    
    if (this.options.animate) {
      setTimeout(() => {
        this.element.classList.remove('opacity-0');
        this.element.querySelector('.modal-content').classList.remove('scale-95');
        this.element.querySelector('.modal-content').classList.add('scale-100');
      }, 10);
    }
    
    // フォーカス管理
    const focusableElements = this.element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    // bodyのスクロールを無効化
    document.body.style.overflow = 'hidden';
    
    if (this.options.onShow) {
      this.options.onShow.call(this);
    }
    
    return this;
  }
  
  hide() {
    if (!this.isVisible) return this;
    
    this.isVisible = false;
    
    if (this.options.animate) {
      this.element.classList.add('opacity-0');
      this.element.querySelector('.modal-content').classList.remove('scale-100');
      this.element.querySelector('.modal-content').classList.add('scale-95');
      
      setTimeout(() => {
        this.element.classList.remove('flex');
        this.element.classList.add('hidden');
      }, 300);
    } else {
      this.element.classList.remove('flex');
      this.element.classList.add('hidden');
    }
    
    // bodyのスクロールを復元
    document.body.style.overflow = '';
    
    if (this.options.onHide) {
      this.options.onHide.call(this);
    }
    
    return this;
  }
  
  destroy() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
    }
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    
    this.isVisible = false;
    document.body.style.overflow = '';
    
    return this;
  }
  
  updateContent(content) {
    if (this.element) {
      const bodyElement = this.element.querySelector('.modal-body');
      if (bodyElement) {
        bodyElement.innerHTML = content;
      }
    }
    return this;
  }
}

// ===== 通知コンポーネント =====

class NotificationManager {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.position = 'top-right';
    this.maxNotifications = 5;
    this.defaultDuration = 5000;
    
    this.init();
  }
  
  init() {
    this.createContainer();
  }
  
  createContainer() {
    if (this.container) return;
    
    const positionClasses = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = `fixed ${positionClasses[this.position]} z-50 space-y-2 pointer-events-none`;
    
    document.body.appendChild(this.container);
  }
  
  show(message, options = {}) {
    const config = {
      type: options.type || 'info',
      duration: options.duration || this.defaultDuration,
      persistent: options.persistent || false,
      actions: options.actions || [],
      icon: options.icon || null,
      ...options
    };
    
    const notification = this.createNotification(message, config);
    this.addNotification(notification);
    
    if (!config.persistent && config.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, config.duration);
    }
    
    return notification.id;
  }
  
  createNotification(message, config) {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const typeStyles = {
      success: {
        bg: 'bg-green-500',
        icon: config.icon || 'check_circle',
        textColor: 'text-white'
      },
      error: {
        bg: 'bg-red-500',
        icon: config.icon || 'error',
        textColor: 'text-white'
      },
      warning: {
        bg: 'bg-yellow-500',
        icon: config.icon || 'warning',
        textColor: 'text-white'
      },
      info: {
        bg: 'bg-blue-500',
        icon: config.icon || 'info',
        textColor: 'text-white'
      }
    };
    
    const style = typeStyles[config.type] || typeStyles.info;
    
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `${style.bg} ${style.textColor} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-slide-in-right max-w-sm pointer-events-auto`;
    
    notification.innerHTML = `
      <span class="material-icons text-sm flex-shrink-0">${style.icon}</span>
      <div class="flex-1">
        <p class="text-sm font-medium">${message}</p>
        ${config.actions.length > 0 ? `
          <div class="mt-2 space-x-2">
            ${config.actions.map(action => `
              <button onclick="${action.callback}" class="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors">
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${!config.persistent ? `
        <button onclick="notificationManager.remove('${id}')" class="text-white hover:text-gray-200 flex-shrink-0">
          <span class="material-icons text-sm">close</span>
        </button>
      ` : ''}
    `;
    
    return { id, element: notification, config };
  }
  
  addNotification(notification) {
    // 最大数チェック
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = this.notifications.keys().next().value;
      this.remove(oldestId);
    }
    
    this.notifications.set(notification.id, notification);
    this.container.appendChild(notification.element);
    
    // アニメーション
    setTimeout(() => {
      notification.element.classList.add('transform', 'translate-x-0');
    }, 10);
  }
  
  remove(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    notification.element.style.transform = 'translateX(100%)';
    notification.element.style.opacity = '0';
    
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications.delete(id);
    }, 300);
  }
  
  clear() {
    this.notifications.forEach((notification, id) => {
      this.remove(id);
    });
  }
  
  setPosition(position) {
    this.position = position;
    if (this.container) {
      this.container.remove();
      this.container = null;
      this.createContainer();
    }
  }
}

// ===== ツールチップコンポーネント =====

class Tooltip {
  constructor() {
    this.tooltip = null;
    this.currentTarget = null;
    this.showTimeout = null;
    this.hideTimeout = null;
    
    this.init();
  }
  
  init() {
    this.createTooltip();
    this.bindEvents();
  }
  
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200';
    this.tooltip.style.visibility = 'hidden';
    document.body.appendChild(this.tooltip);
  }
  
  bindEvents() {
    document.addEventListener('mouseenter', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.show(target, target.getAttribute('data-tooltip'));
      }
    }, true);
    
    document.addEventListener('mouseleave', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.hide();
      }
    }, true);
  }
  
  show(target, text) {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    
    this.currentTarget = target;
    this.tooltip.textContent = text;
    
    this.showTimeout = setTimeout(() => {
      this.position(target);
      this.tooltip.style.visibility = 'visible';
      this.tooltip.classList.remove('opacity-0');
      this.tooltip.classList.add('opacity-100');
    }, 500);
  }
  
  hide() {
    if (this.showTimeout) clearTimeout(this.showTimeout);
    
    this.hideTimeout = setTimeout(() => {
      this.tooltip.classList.remove('opacity-100');
      this.tooltip.classList.add('opacity-0');
      setTimeout(() => {
        this.tooltip.style.visibility = 'hidden';
      }, 200);
    }, 100);
  }
  
  position(target) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    
    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    
    // 画面外チェック
    if (top < 0) {
      top = rect.bottom + 8;
    }
    
    if (left < 0) {
      left = 8;
    } else if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 8;
    }
    
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }
}

// ===== ローディングコンポーネント =====

class LoadingManager {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
  }
  
  show(message = 'データを読み込み中...') {
    if (this.isVisible) return;
    
    this.createOverlay(message);
    this.isVisible = true;
    
    document.body.style.overflow = 'hidden';
    this.overlay.classList.remove('hidden');
    
    setTimeout(() => {
      this.overlay.classList.remove('opacity-0');
    }, 10);
  }
  
  hide() {
    if (!this.isVisible || !this.overlay) return;
    
    this.isVisible = false;
    this.overlay.classList.add('opacity-0');
    
    setTimeout(() => {
      this.overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }
  
  createOverlay(message) {
    if (this.overlay) {
      this.updateMessage(message);
      return;
    }
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0';
    
    this.overlay.innerHTML = `
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600 font-medium" id="loading-message">${message}</p>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
  }
  
  updateMessage(message) {
    if (this.overlay) {
      const messageElement = this.overlay.querySelector('#loading-message');
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  }
  
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.isVisible = false;
    document.body.style.overflow = '';
  }
}

// ===== プログレスバーコンポーネント =====

class ProgressBar {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.options = {
      min: options.min || 0,
      max: options.max || 100,
      value: options.value || 0,
      showLabel: options.showLabel !== false,
      animated: options.animated !== false,
      color: options.color || 'blue',
      height: options.height || 'h-2',
      ...options
    };
    
    this.create();
  }
  
  create() {
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      indigo: 'bg-indigo-500'
    };
    
    const progressHTML = `
      <div class="progress-container">
        ${this.options.showLabel ? `
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700">${this.options.label || ''}</span>
            <span class="text-sm text-gray-500" id="progress-percentage">0%</span>
          </div>
        ` : ''}
        <div class="w-full bg-gray-200 rounded-full ${this.options.height}">
          <div class="progress-fill ${colorClasses[this.options.color]} ${this.options.height} rounded-full transition-all duration-500 ease-out ${this.options.animated ? 'progress-animated' : ''}" style="width: 0%"></div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = progressHTML;
    this.progressFill = this.container.querySelector('.progress-fill');
    this.percentageLabel = this.container.querySelector('#progress-percentage');
    
    if (this.options.value > 0) {
      this.setValue(this.options.value);
    }
  }
  
  setValue(value) {
    const clampedValue = Math.max(this.options.min, Math.min(this.options.max, value));
    const percentage = ((clampedValue - this.options.min) / (this.options.max - this.options.min)) * 100;
    
    this.progressFill.style.width = `${percentage}%`;
    
    if (this.percentageLabel) {
      this.percentageLabel.textContent = `${Math.round(percentage)}%`;
    }
    
    this.options.value = clampedValue;
    
    return this;
  }
  
  increment(amount = 1) {
    return this.setValue(this.options.value + amount);
  }
  
  decrement(amount = 1) {
    return this.setValue(this.options.value - amount);
  }
  
  reset() {
    return this.setValue(this.options.min);
  }
  
  complete() {
    return this.setValue(this.options.max);
  }
}

// ===== タブコンポーネント =====

class TabManager {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    this.options = {
      activeClass: options.activeClass || 'tab-active',
      contentSelector: options.contentSelector || '.tab-content',
      onTabChange: options.onTabChange || null,
      ...options
    };
    
    this.activeTab = null;
    this.init();
  }
  
  init() {
    this.bindEvents();
    
    // 初期タブの設定
    const firstTab = this.container.querySelector('[data-tab]');
    if (firstTab) {
      this.showTab(firstTab.getAttribute('data-tab'));
    }
  }
  
  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab]');
      if (tabButton) {
        e.preventDefault();
        this.showTab(tabButton.getAttribute('data-tab'));
      }
    });
  }
  
  showTab(tabId) {
    // タブボタンの状態更新
    this.container.querySelectorAll('[data-tab]').forEach(button => {
      button.classList.remove(this.options.activeClass);
    });
    
    const activeButton = this.container.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.add(this.options.activeClass);
    }
    
    // タブコンテンツの切り替え
    document.querySelectorAll(this.options.contentSelector).forEach(content => {
      content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`${tabId}Tab`) || document.getElementById(tabId);
    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
    
    this.activeTab = tabId;
    
    // コールバック実行
    if (this.options.onTabChange) {
      this.options.onTabChange(tabId, activeContent);
    }
  }
  
  getActiveTab() {
    return this.activeTab;
  }
}

// ===== グローバルインスタンス作成 =====

// 通知マネージャー
window.notificationManager = new NotificationManager();

// ツールチップ
window.tooltip = new Tooltip();

// ローディングマネージャー
window.loadingManager = new LoadingManager();

// ===== ユーティリティ関数 =====

// モーダル作成ヘルパー
window.createModal = function(options) {
  return new Modal(options);
};

// 通知表示ヘルパー
window.showNotification = function(message, type = 'info', options = {}) {
  return notificationManager.show(message, { type, ...options });
};

// ローディング表示ヘルパー
window.showLoading = function(message) {
  loadingManager.show(message);
};

window.hideLoading = function() {
  loadingManager.hide();
};

// プログレスバー作成ヘルパー
window.createProgressBar = function(container, options) {
  return new ProgressBar(container, options);
};

// タブマネージャー作成ヘルパー
window.createTabManager = function(container, options) {
  return new TabManager(container, options);
};

// 確認ダイアログ
window.confirmDialog = function(message, callback) {
  const modal = new Modal({
    title: '確認',
    content: `<p class="text-gray-700">${message}</p>`,
    footer: `
      <div class="flex space-x-3 justify-end">
        <button onclick="this.closest('.modal-backdrop').dispatchEvent(new CustomEvent('cancel'))" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          キャンセル
        </button>
        <button onclick="this.closest('.modal-backdrop').dispatchEvent(new CustomEvent('confirm'))" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          確認
        </button>
      </div>
    `,
    size: 'small'
  });
  
  modal.create().show();
  
  modal.element.addEventListener('confirm', () => {
    modal.destroy();
    if (callback) callback(true);
  });
  
  modal.element.addEventListener('cancel', () => {
    modal.destroy();
    if (callback) callback(false);
  });
};

// アラートダイアログ
window.alertDialog = function(message, type = 'info') {
  const typeStyles = {
    success: { color: 'text-green-600', icon: 'check_circle' },
    error: { color: 'text-red-600', icon: 'error' },
    warning: { color: 'text-yellow-600', icon: 'warning' },
    info: { color: 'text-blue-600', icon: 'info' }
  };
  
  const style = typeStyles[type] || typeStyles.info;
  
  const modal = new Modal({
    title: '',
    content: `
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <span class="material-icons ${style.color}">${style.icon}</span>
        </div>
        <p class="text-gray-700">${message}</p>
      </div>
    `,
    footer: `
      <div class="flex justify-center">
        <button onclick="this.closest('.modal-backdrop').dispatchEvent(new CustomEvent('close'))" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          OK
        </button>
      </div>
    `,
    size: 'small'
  });
  
  modal.create().show();
  
  modal.element.addEventListener('close', () => {
    modal.destroy();
  });
};

console.log('✅ UI Components loaded successfully');