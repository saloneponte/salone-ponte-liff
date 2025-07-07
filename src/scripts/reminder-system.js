// 予約リマインダーシステム - Salone Ponte
// 予約前日・当日の自動リマインダー機能

class ReservationReminderSystem {
  constructor() {
    this.reminders = {
      dayBefore: true,    // 前日リマインダー
      hourBefore: true,   // 1時間前リマインダー
      confirmArrival: true // 到着確認
    };
  }

  // 予約完了時にリマインダースケジュールを設定
  async scheduleReminders(reservationData) {
    try {
      console.log('📅 リマインダースケジュール設定中...');
      
      const reservationDate = new Date(reservationData.datetime);
      const now = new Date();
      
      // 前日リマインダー（前日の19時）
      const dayBeforeReminder = new Date(reservationDate);
      dayBeforeReminder.setDate(dayBeforeReminder.getDate() - 1);
      dayBeforeReminder.setHours(19, 0, 0, 0);
      
      // 1時間前リマインダー
      const hourBeforeReminder = new Date(reservationDate);
      hourBeforeReminder.setHours(hourBeforeReminder.getHours() - 1);
      
      // リマインダーデータをFirestoreに保存
      const reminderData = {
        reservationId: reservationData.id,
        customerId: reservationData.customerId,
        lineUserId: reservationData.lineUserId,
        customerName: reservationData.name,
        reservation: {
          datetime: reservationData.datetime,
          menuName: reservationData.menuName,
          staffName: reservationData.staffName,
          price: reservationData.menuPrice,
          duration: reservationData.menuDuration
        },
        reminders: {
          dayBefore: {
            scheduledTime: dayBeforeReminder.toISOString(),
            sent: false,
            enabled: dayBeforeReminder > now
          },
          hourBefore: {
            scheduledTime: hourBeforeReminder.toISOString(),
            sent: false,
            enabled: hourBeforeReminder > now
          }
        },
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };
      
      await db.collection('reminder_schedule').add(reminderData);
      console.log('✅ リマインダースケジュール設定完了');
      
    } catch (error) {
      console.error('❌ リマインダースケジュール設定エラー:', error);
    }
  }

  // 前日リマインダーメッセージ作成
  createDayBeforeReminderMessage(reservationData) {
    const dateTime = new Date(reservationData.datetime);
    const dateStr = dateTime.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const timeStr = dateTime.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      altText: '【リマインダー】明日のご予約について',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '明日のご予約',
              weight: 'bold',
              color: '#ffffff',
              size: 'lg',
              align: 'center'
            }
          ],
          backgroundColor: '#ffc107',
          paddingAll: 'lg'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${reservationData.customerName}様`,
              weight: 'bold',
              size: 'lg'
            },
            {
              type: 'text',
              text: '明日のご予約をお忘れなく！',
              margin: 'md',
              size: 'md'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '日時', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: dateStr, flex: 3, weight: 'bold', size: 'sm' }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '時間', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: timeStr, flex: 3, weight: 'bold', size: 'xl', color: '#dc3545' }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: 'メニュー', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: reservationData.menuName, flex: 3, weight: 'bold', size: 'sm', wrap: true }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '担当', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: reservationData.staffName, flex: 3, weight: 'bold', size: 'sm' }
                  ],
                  margin: 'sm'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'text',
              text: '※変更・キャンセルは前日までにお願いします',
              size: 'xs',
              color: '#999999',
              margin: 'lg'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '予約の確認・変更',
                uri: `https://salone-ponte-fceca.web.app/reservation-management.html?id=${reservationData.reservationId}`
              },
              style: 'secondary'
            }
          ]
        }
      }
    };
  }

  // 1時間前リマインダーメッセージ作成
  createHourBeforeReminderMessage(reservationData) {
    const dateTime = new Date(reservationData.datetime);
    const timeStr = dateTime.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      altText: '【リマインダー】1時間後にご予約があります',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'もうすぐご予約時間です',
              weight: 'bold',
              color: '#ffffff',
              size: 'lg',
              align: 'center'
            }
          ],
          backgroundColor: '#17a2b8',
          paddingAll: 'lg'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${reservationData.customerName}様`,
              weight: 'bold',
              size: 'lg'
            },
            {
              type: 'text',
              text: '1時間後にご予約があります',
              margin: 'md',
              size: 'md',
              color: '#17a2b8',
              weight: 'bold'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: 'ご予約時間', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: timeStr, flex: 2, weight: 'bold', size: 'xxl', color: '#dc3545' }
                  ],
                  margin: 'md'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: 'メニュー', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: reservationData.menuName, flex: 2, weight: 'bold', size: 'sm', wrap: true }
                  ],
                  margin: 'sm'
                },
                {
                  type: 'box',
                  layout: 'horizontal',
                  contents: [
                    { type: 'text', text: '担当', flex: 1, color: '#666666', size: 'sm' },
                    { type: 'text', text: reservationData.staffName, flex: 2, weight: 'bold', size: 'sm' }
                  ],
                  margin: 'sm'
                }
              ],
              margin: 'lg'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'text',
              text: 'お忙しい中恐れ入りますが、お時間に余裕をもってお越しください。',
              size: 'sm',
              color: '#666666',
              wrap: true,
              margin: 'lg'
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: 'サロンまでの道順',
                uri: 'https://maps.app.goo.gl/salon-ponte-location'
              },
              style: 'primary'
            },
            {
              type: 'text',
              text: '何かご不明な点がございましたらお気軽にお声かけください',
              size: 'xs',
              color: '#999999',
              align: 'center',
              margin: 'md',
              wrap: true
            }
          ]
        }
      }
    };
  }
}

// 到着確認システム
class ArrivalConfirmationSystem {
  constructor() {
    this.checkInWindow = 15; // 予約時間の15分前から確認可能
  }

  // 到着確認メッセージ作成
  createArrivalConfirmationMessage(reservationData) {
    return {
      altText: 'ご来店の確認をお願いします',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'ご来店確認',
              weight: 'bold',
              color: '#ffffff',
              size: 'lg',
              align: 'center'
            }
          ],
          backgroundColor: '#6f42c1',
          paddingAll: 'lg'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${reservationData.customerName}様`,
              weight: 'bold',
              size: 'lg'
            },
            {
              type: 'text',
              text: 'お疲れ様です！ご来店をお待ちしております。',
              margin: 'md',
              wrap: true
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'text',
              text: 'ご到着されましたら下のボタンを押してください。',
              size: 'sm',
              color: '#666666',
              margin: 'lg',
              wrap: true
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '到着しました',
                data: `action=check_in&reservation_id=${reservationData.reservationId}`
              },
              style: 'primary',
              color: '#6f42c1'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '少し遅れます（5-10分）',
                data: `action=delay_short&reservation_id=${reservationData.reservationId}`
              },
              style: 'secondary',
              margin: 'sm'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '大幅に遅れます（要相談）',
                data: `action=delay_long&reservation_id=${reservationData.reservationId}`
              },
              style: 'secondary',
              margin: 'sm'
            }
          ]
        }
      }
    };
  }
}

// フォローアップメッセージシステム
class FollowUpMessageSystem {
  constructor() {
    this.followUpDelay = 24; // 24時間後にフォローアップ
  }

  // アフターケアメッセージ作成
  createFollowUpMessage(reservationData) {
    return {
      altText: 'ご来店ありがとうございました',
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: 'ご来店ありがとうございました',
              weight: 'bold',
              color: '#ffffff',
              size: 'lg',
              align: 'center'
            }
          ],
          backgroundColor: '#e91e63',
          paddingAll: 'lg'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `${reservationData.customerName}様`,
              weight: 'bold',
              size: 'lg'
            },
            {
              type: 'text',
              text: '昨日はご来店いただき、ありがとうございました！',
              margin: 'md',
              wrap: true
            },
            {
              type: 'text',
              text: '仕上がりはいかがでしょうか？',
              margin: 'md',
              size: 'md'
            },
            {
              type: 'separator',
              margin: 'lg'
            },
            {
              type: 'text',
              text: 'ご感想やご要望などございましたら、お気軽にお聞かせください。',
              size: 'sm',
              color: '#666666',
              margin: 'lg',
              wrap: true
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '次回のご予約はこちら',
                uri: 'https://salone-ponte-fceca.web.app/src/pages/index.html'
              },
              style: 'primary',
              color: '#e91e63'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: 'ご感想を送る',
                data: `action=feedback&reservation_id=${reservationData.reservationId}`
              },
              style: 'secondary',
              margin: 'sm'
            }
          ]
        }
      }
    };
  }
}

// グローバル初期化
let reminderSystem, arrivalSystem, followUpSystem;

document.addEventListener('DOMContentLoaded', function() {
  reminderSystem = new ReservationReminderSystem();
  arrivalSystem = new ArrivalConfirmationSystem();
  followUpSystem = new FollowUpMessageSystem();
});

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ReservationReminderSystem,
    ArrivalConfirmationSystem,
    FollowUpMessageSystem
  };
}