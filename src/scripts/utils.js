// 共通ユーティリティ関数 - Salone Ponte

// プログレスバー更新
function updateProgress(percent) {
  document.getElementById('progressBar').style.width = percent + '%';
}

// エラー表示
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
}

// 成功メッセージ表示
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #10B981;
    color: white;
    padding: 20px 30px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 1000;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    max-width: 90%;
  `;
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 5000);
}

// 完了画面表示（通常ブラウザ用）
function showCompletionScreen(reservationData) {
  document.body.innerHTML = `
    <div style="max-width: 600px; margin: 50px auto; padding: 30px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
      <div style="color: #10B981; font-size: 60px; margin-bottom: 20px;">✅</div>
      <h1 style="color: #1F2937; margin-bottom: 30px;">予約完了</h1>
      <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin-bottom: 30px; text-align: left;">
        <h2 style="margin-bottom: 15px; text-align: center;">予約内容</h2>
        <p><strong>お名前:</strong> ${reservationData.name}</p>
        <p><strong>メニュー:</strong> ${reservationData.menuName}</p>
        <p><strong>担当:</strong> ${reservationData.staffName}</p>
        <p><strong>日時:</strong> ${new Date(reservationData.datetime).toLocaleString('ja-JP')}</p>
        <p><strong>料金:</strong> ¥${reservationData.menuPrice.toLocaleString()}</p>
        ${reservationData.note ? `<p><strong>備考:</strong> ${reservationData.note}</p>` : ''}
      </div>
      <p style="color: #6B7280; margin-bottom: 30px;">
        予約確認のメッセージをLINEにお送りしました。<br>
        当日お待ちしております。
      </p>
      <button onclick="location.reload()" style="background: #3B82F6; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer;">
        新しい予約をする
      </button>
    </div>
  `;
}