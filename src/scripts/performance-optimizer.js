// Performance Optimizer - Salone Ponte
// パフォーマンス最適化機能

// ===== パフォーマンス監視クラス =====

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkRequests: 0,
      errors: 0
    };
    
    this.observers = {
      performance: null,
      intersection: null,
      mutation: null
    };
    
    this.init();
  }
  
  init() {
    this.measureLoadTime();
    this.setupPerformanceObserver();
    this.setupIntersectionObserver();
    this.setupMutationObserver();
    this.monitorMemoryUsage();
    this.optimizeImages();
    this.implementVirtualScrolling();
    
    console.log('✅ Performance optimization initialized');
  }
  
  // ===== 読み込み時間測定 =====
  
  measureLoadTime() {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.metrics.loadTime = loadTime;
      
      if (loadTime > 3000) {
        console.warn(`⚠️ Page load time is slow: ${loadTime}ms`);
        this.optimizeLoadTime();
      }
    }
    
    // Web Vitals の測定
    this.measureWebVitals();
  }
  
  measureWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry.startTime > 2500) {
        console.warn(`⚠️ LCP is slow: ${lastEntry.startTime}ms`);
        this.optimizeLCP();
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.processingStart - entry.startTime > 100) {
          console.warn(`⚠️ FID is slow: ${entry.processingStart - entry.startTime}ms`);
          this.optimizeFID();
        }
      });
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      if (clsValue > 0.1) {
        console.warn(`⚠️ CLS is high: ${clsValue}`);
        this.optimizeCLS();
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  // ===== パフォーマンス最適化 =====
  
  optimizeLoadTime() {
    // 重要でないスクリプトの遅延読み込み
    this.deferNonCriticalScripts();
    
    // CSS の最適化
    this.optimizeCSS();
    
    // フォントの最適化
    this.optimizeFonts();
  }
  
  deferNonCriticalScripts() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      if (!script.hasAttribute('defer') && !script.hasAttribute('async')) {
        // Chart.js などの重要でないスクリプトは遅延読み込み
        if (script.src.includes('chart.js') || script.src.includes('analytics')) {
          script.defer = true;
        }
      }
    });
  }
  
  optimizeCSS() {
    // 未使用のCSSクラスをチェック
    const usedClasses = new Set();
    document.querySelectorAll('*').forEach(element => {
      element.className.split(' ').forEach(className => {
        if (className) usedClasses.add(className);
      });
    });
    
    // 使用されていないクラスの警告（開発環境のみ）
    if (process?.env?.NODE_ENV === 'development') {
      console.log(`🎨 Used CSS classes: ${usedClasses.size}`);
    }
  }
  
  optimizeFonts() {
    // フォントの事前読み込み
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    fontLink.as = 'style';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }
  
  optimizeLCP() {
    // 重要な画像の事前読み込み
    const criticalImages = document.querySelectorAll('img[data-critical]');
    criticalImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = img.src;
      link.as = 'image';
      document.head.appendChild(link);
    });
  }
  
  optimizeFID() {
    // 重いタスクを分割
    this.scheduleIdleWork();
    
    // Event delegation の使用
    this.optimizeEventListeners();
  }
  
  optimizeCLS() {
    // 画像にサイズ属性を設定
    const images = document.querySelectorAll('img:not([width]):not([height])');
    images.forEach(img => {
      img.addEventListener('load', () => {
        if (!img.width || !img.height) {
          console.warn('⚠️ Image without dimensions detected:', img.src);
        }
      });
    });
    
    // フォント読み込み時のレイアウトシフト防止
    document.fonts.ready.then(() => {
      document.body.classList.add('fonts-loaded');
    });
  }
  
  // ===== 画像最適化 =====
  
  optimizeImages() {
    // 遅延読み込みの実装
    this.implementLazyLoading();
    
    // WebP対応チェック
    this.checkWebPSupport();
    
    // 画像圧縮の確認
    this.checkImageCompression();
  }
  
  implementLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // フォールバック: すべての画像を即座に読み込み
      images.forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }
  
  checkWebPSupport() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    if (webpSupported) {
      document.documentElement.classList.add('webp-supported');
      console.log('✅ WebP format supported');
    } else {
      console.log('ℹ️ WebP format not supported, using fallback images');
    }
  }
  
  checkImageCompression() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', () => {
        const fileSize = this.estimateImageSize(img);
        if (fileSize > 500000) { // 500KB
          console.warn(`⚠️ Large image detected: ${img.src} (~${Math.round(fileSize/1024)}KB)`);
        }
      });
    });
  }
  
  estimateImageSize(img) {
    // 画像サイズの概算（実際のファイルサイズではない）
    return img.naturalWidth * img.naturalHeight * 3; // RGB想定
  }
  
  // ===== 仮想スクロールの実装 =====
  
  implementVirtualScrolling() {
    const longLists = document.querySelectorAll('[data-virtual-scroll]');
    
    longLists.forEach(list => {
      this.setupVirtualScrolling(list);
    });
  }
  
  setupVirtualScrolling(container) {
    const itemHeight = parseInt(container.dataset.itemHeight) || 60;
    const buffer = parseInt(container.dataset.buffer) || 5;
    const items = Array.from(container.children);
    
    if (items.length < 20) return; // 少ないアイテムでは仮想化しない
    
    const virtualList = new VirtualScrollList(container, items, itemHeight, buffer);
    virtualList.init();
  }
  
  // ===== メモリ監視 =====
  
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // メモリ使用量が多い場合の警告
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
          console.warn('⚠️ High memory usage detected');
          this.performGarbageCollection();
        }
      }, 30000); // 30秒ごと
    }
  }
  
  performGarbageCollection() {
    // 不要なデータのクリーンアップ
    this.cleanupChartData();
    this.cleanupEventListeners();
    this.cleanupDOMReferences();
  }
  
  cleanupChartData() {
    // Chart.jsインスタンスのクリーンアップ
    if (window.charts) {
      Object.values(window.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          // 古いデータを削除
          if (chart.data && chart.data.datasets) {
            chart.data.datasets.forEach(dataset => {
              if (dataset.data.length > 100) {
                dataset.data = dataset.data.slice(-50); // 最新50件のみ保持
              }
            });
          }
        }
      });
    }
  }
  
  cleanupEventListeners() {
    // 重複したイベントリスナーの除去
    const elements = document.querySelectorAll('[data-cleanup-listeners]');
    elements.forEach(element => {
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
    });
  }
  
  cleanupDOMReferences() {
    // 不要なDOM参照のクリア
    window.temporaryRefs = null;
    window.cachedElements = null;
  }
  
  // ===== アイドル処理 =====
  
  scheduleIdleWork() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.performIdleOptimizations();
      });
    } else {
      // フォールバック
      setTimeout(() => {
        this.performIdleOptimizations();
      }, 1000);
    }
  }
  
  performIdleOptimizations() {
    // 非重要なデータの事前読み込み
    this.preloadNonCriticalData();
    
    // キャッシュの最適化
    this.optimizeCache();
    
    // インデックスの構築
    this.buildSearchIndex();
  }
  
  preloadNonCriticalData() {
    // 分析データなどの事前読み込み
    if (typeof loadAnalyticsData === 'function') {
      loadAnalyticsData();
    }
  }
  
  optimizeCache() {
    // LocalStorageのクリーンアップ
    try {
      const cacheKeys = Object.keys(localStorage);
      cacheKeys.forEach(key => {
        if (key.startsWith('cache_')) {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.expires && item.expires < Date.now()) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }
  
  buildSearchIndex() {
    // 検索インデックスの構築（バックグラウンド）
    if (window.dashboardData) {
      const searchableData = [
        ...window.dashboardData.customers,
        ...window.dashboardData.reservations,
        ...window.dashboardData.menus
      ];
      
      window.searchIndex = this.createSearchIndex(searchableData);
    }
  }
  
  createSearchIndex(data) {
    const index = {};
    
    data.forEach((item, idx) => {
      const searchableText = Object.values(item)
        .filter(value => typeof value === 'string')
        .join(' ')
        .toLowerCase();
      
      searchableText.split(/\s+/).forEach(word => {
        if (word.length > 2) {
          if (!index[word]) index[word] = [];
          index[word].push(idx);
        }
      });
    });
    
    return index;
  }
  
  // ===== イベント最適化 =====
  
  optimizeEventListeners() {
    // Event delegation の実装
    this.implementEventDelegation();
    
    // Passive event listeners
    this.addPassiveEventListeners();
    
    // Throttle/Debounce の適用
    this.applyThrottleDebounce();
  }
  
  implementEventDelegation() {
    // ボタンクリックの委譲
    document.body.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (button) {
        const action = button.dataset.action;
        this.handleDelegatedAction(action, button);
      }
    });
  }
  
  handleDelegatedAction(action, element) {
    switch (action) {
      case 'refresh-stats':
        this.refreshStats();
        break;
      case 'toggle-sidebar':
        this.toggleSidebar();
        break;
      case 'export-data':
        this.exportData();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
  
  addPassiveEventListeners() {
    // スクロールイベントをパッシブに
    document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    document.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
  }
  
  handleScroll() {
    // スクロール処理（軽量）
  }
  
  handleWheel() {
    // ホイール処理（軽量）
  }
  
  handleTouchStart() {
    // タッチ処理（軽量）
  }
  
  applyThrottleDebounce() {
    // リサイズイベントの最適化
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }
  
  handleResize() {
    // リサイズ処理
    if (window.charts) {
      Object.values(window.charts).forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    }
  }
  
  // ===== パフォーマンス報告 =====
  
  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      browserInfo: {
        userAgent: navigator.userAgent,
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : 'Not available',
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink
        } : 'Not available'
      },
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }
  
  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.loadTime > 3000) {
      recommendations.push('ページ読み込み時間が長いです。画像やスクリプトの最適化を検討してください。');
    }
    
    if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
      recommendations.push('メモリ使用量が多いです。データのクリーンアップを検討してください。');
    }
    
    return recommendations;
  }
}

// ===== 仮想スクロールクラス =====

class VirtualScrollList {
  constructor(container, items, itemHeight, buffer) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.containerHeight = container.clientHeight;
    this.visibleStart = 0;
    this.visibleEnd = 0;
  }
  
  init() {
    this.setupContainer();
    this.calculateVisible();
    this.renderVisible();
    this.bindEvents();
  }
  
  setupContainer() {
    this.container.style.overflowY = 'auto';
    this.container.style.height = this.containerHeight + 'px';
    
    // 全体の高さを設定
    const totalHeight = this.items.length * this.itemHeight;
    this.container.style.position = 'relative';
    
    // スクロール用の空div
    this.scrollArea = document.createElement('div');
    this.scrollArea.style.height = totalHeight + 'px';
    this.scrollArea.style.width = '100%';
    this.container.appendChild(this.scrollArea);
  }
  
  calculateVisible() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    
    this.visibleStart = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    this.visibleEnd = Math.min(
      this.items.length - 1,
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.buffer
    );
  }
  
  renderVisible() {
    // 既存の表示アイテムをクリア
    const existingItems = this.container.querySelectorAll('.virtual-item');
    existingItems.forEach(item => item.remove());
    
    // 表示範囲のアイテムを描画
    for (let i = this.visibleStart; i <= this.visibleEnd; i++) {
      const item = this.items[i].cloneNode(true);
      item.classList.add('virtual-item');
      item.style.position = 'absolute';
      item.style.top = (i * this.itemHeight) + 'px';
      item.style.left = '0';
      item.style.right = '0';
      item.style.height = this.itemHeight + 'px';
      
      this.container.appendChild(item);
    }
  }
  
  bindEvents() {
    this.container.addEventListener('scroll', () => {
      this.calculateVisible();
      this.renderVisible();
    });
  }
}

// ===== 初期化 =====

document.addEventListener('DOMContentLoaded', function() {
  window.performanceMonitor = new PerformanceMonitor();
  
  // パフォーマンス報告（開発環境のみ）
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('dev')) {
    setTimeout(() => {
      const report = window.performanceMonitor.generatePerformanceReport();
      console.log('📊 Performance Report:', report);
    }, 5000);
  }
});

// ===== グローバル関数 =====

window.getPerformanceReport = function() {
  return window.performanceMonitor ? window.performanceMonitor.generatePerformanceReport() : null;
};

window.optimizePerformance = function() {
  if (window.performanceMonitor) {
    window.performanceMonitor.performGarbageCollection();
    window.performanceMonitor.scheduleIdleWork();
  }
};

console.log('✅ Performance optimizer loaded');