const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Client } = require('@line/bot-sdk');

admin.initializeApp();
const db = admin.firestore();

// LINE Bot設定
const config = {
  channelAccessToken: functions.config().line.channel_access_token,
  channelSecret: functions.config().line.channel_secret,
};
const client = new Client(config);

// ===== 予約確定時の通知 =====
exports.sendReservationConfirmation = functions.firestore
  .document('reservations/{reservationId}')
  .onCreate(async (snap, context) => {
    try {
      const reservation = snap.data();
      const { userId, name, menuName, staffName, datetime, price } = reservation;

      // 日時フォーマット
      const reservationDate = new Date(datetime);
      const dateStr = reservationDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      const timeStr = reservationDate.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // 顧客向けメッセージ
      const customerMessage = {
        type: 'flex',
        altText: '予約確定のお知らせ',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '予約確定',
                weight: 'bold',
                color: '#ffffff',
                size: 'lg'
              }
            ],
            backgroundColor: '#28a745',
            paddingAll: 'lg'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: `${name}様`,
                weight: 'bold',
                size: 'lg',
                margin: 'md'
              },
              {
                type: 'text',
                text: 'ご予約ありがとうございます！',
                margin: 'md'
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
                      { type: 'text', text: '日時', flex: 1, color: '#666666' },
                      { type: 'text', text: `${dateStr} ${timeStr}`, flex: 2, weight: 'bold' }
                    ],
                    margin: 'md'
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: 'メニュー', flex: 1, color: '#666666' },
                      { type: 'text', text: menuName, flex: 2, weight: 'bold' }
                    ],
                    margin: 'sm'
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: '担当', flex: 1, color: '#666666' },
                      { type: 'text', text: staffName, flex: 2, weight: 'bold' }
                    ],
                    margin: 'sm'
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      { type: 'text', text: '料金', flex: 1, color: '#666666' },
                      { type: 'text', text: `¥${price.toLocaleString()}`, flex: 2, weight: 'bold', color: '#007bff' }
                    ],
                    margin: 'sm'
                  }
                ],
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
                  label: '予約を変更・キャンセル',
                  uri: `https://your-domain.com/reservation/${snap.id}`
                },
                style: 'secondary'
              },
              {
                type: 'text',
                text: 'ご来店をお待ちしております！',
                size: 'sm',
                color: '#666666',
                margin: 'md',
                align: 'center'
              }
            ]
          }
        }
      };

      // 顧客に通知送信
      await client.pushMessage(userId, customerMessage);

      // スタッフ通知用のデータを取得
      const staffDoc = await db.collection('staffs').doc(reservation.staffId).get();
      const staffData = staffDoc.data();
      
      if (staffData && staffData.lineUserId) {
        // スタッフ向けメッセージ
        const staffMessage = {
          type: 'flex',
          altText: '新しい予約が入りました',
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '新規予約',
                  weight: 'bold',
                  color: '#ffffff',
                  size: 'lg'
                }
              ],
              backgroundColor: '#007bff',
              paddingAll: 'lg'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `${staffName}さん`,
                  weight: 'bold',
                  size: 'lg'
                },
                {
                  type: 'text',
                  text: '新しい予約が入りました',
                  margin: 'md'
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
                        { type: 'text', text: 'お客様', flex: 1, color: '#666666' },
                        { type: 'text', text: name, flex: 2, weight: 'bold' }
                      ],
                      margin: 'md'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: '日時', flex: 1, color: '#666666' },
                        { type: 'text', text: `${dateStr} ${timeStr}`, flex: 2, weight: 'bold' }
                      ],
                      margin: 'sm'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'メニュー', flex: 1, color: '#666666' },
                        { type: 'text', text: menuName, flex: 2, weight: 'bold' }
                      ],
                      margin: 'sm'
                    }
                  ],
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
                    label: 'ダッシュボードで確認',
                    uri: 'https://your-domain.com/dashboard.html'
                  },
                  style: 'primary'
                }
              ]
            }
          }
        };

        await client.pushMessage(staffData.lineUserId, staffMessage);
      }

      console.log('予約確定通知を送信しました:', snap.id);
    } catch (error) {
      console.error('予約確定通知エラー:', error);
    }
  });

// ===== 予約リマインダー（前日通知） =====
exports.sendReservationReminder = functions.pubsub
  .schedule('0 18 * * *') // 毎日18時に実行
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);

      // 明日の予約を取得
      const snapshot = await db.collection('reservations')
        .where('datetime', '>=', tomorrowStart.toISOString())
        .where('datetime', '<', tomorrowEnd.toISOString())
        .where('status', '==', 'confirmed')
        .get();

      const reminderPromises = [];

      snapshot.forEach(doc => {
        const reservation = doc.data();
        const { userId, name, menuName, staffName, datetime } = reservation;

        const reservationDate = new Date(datetime);
        const timeStr = reservationDate.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const reminderMessage = {
          type: 'flex',
          altText: '明日のご予約のお知らせ',
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
                  size: 'lg'
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
                  text: `${name}様`,
                  weight: 'bold',
                  size: 'lg'
                },
                {
                  type: 'text',
                  text: '明日のご予約をお忘れなく！',
                  margin: 'md'
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
                        { type: 'text', text: '時間', flex: 1, color: '#666666' },
                        { type: 'text', text: timeStr, flex: 2, weight: 'bold', size: 'xl', color: '#dc3545' }
                      ],
                      margin: 'md'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'メニュー', flex: 1, color: '#666666' },
                        { type: 'text', text: menuName, flex: 2, weight: 'bold' }
                      ],
                      margin: 'sm'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: '担当', flex: 1, color: '#666666' },
                        { type: 'text', text: staffName, flex: 2, weight: 'bold' }
                      ],
                      margin: 'sm'
                    }
                  ],
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
            }
          }
        };

        reminderPromises.push(client.pushMessage(userId, reminderMessage));
      });

      await Promise.all(reminderPromises);
      console.log(`${reminderPromises.length}件の予約リマインダーを送信しました`);
    } catch (error) {
      console.error('予約リマインダーエラー:', error);
    }
  });

// ===== 誕生日メッセージ =====
exports.sendBirthdayMessages = functions.pubsub
  .schedule('0 9 * * *') // 毎日9時に実行
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // 今日が誕生日の顧客を取得
      const snapshot = await db.collection('customers')
        .where('birthday', '==', todayMD)
        .get();

      const birthdayPromises = [];

      snapshot.forEach(doc => {
        const customer = doc.data();
        const { userId, name } = customer;

        const birthdayMessage = {
          type: 'flex',
          altText: 'お誕生日おめでとうございます！',
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '🎉 Happy Birthday! 🎉',
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
                  text: `${name}様`,
                  weight: 'bold',
                  size: 'xl',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: 'お誕生日おめでとうございます！',
                  align: 'center',
                  margin: 'md'
                },
                {
                  type: 'separator',
                  margin: 'lg'
                },
                {
                  type: 'text',
                  text: '特別な日をより美しく✨',
                  align: 'center',
                  margin: 'lg'
                },
                {
                  type: 'text',
                  text: 'バースデー特典として、今月末まで全メニュー10%OFFでご利用いただけます！',
                  size: 'sm',
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
                    label: '特典を使って予約する',
                    uri: 'https://your-domain.com/index.html'
                  },
                  style: 'primary',
                  color: '#e91e63'
                }
              ]
            }
          }
        };

        birthdayPromises.push(client.pushMessage(userId, birthdayMessage));
      });

      await Promise.all(birthdayPromises);
      console.log(`${birthdayPromises.length}件の誕生日メッセージを送信しました`);
    } catch (error) {
      console.error('誕生日メッセージエラー:', error);
    }
  });

// ===== 離反防止メッセージ =====
exports.sendRetentionMessages = functions.pubsub
  .schedule('0 10 * * 1') // 毎週月曜日10時に実行
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      // 2ヶ月以上来店していない顧客を取得
      const snapshot = await db.collection('customers').get();
      const retentionPromises = [];

      snapshot.forEach(doc => {
        const customer = doc.data();
        const { userId, name, reservations } = customer;

        if (!reservations || reservations.length === 0) return;

        // 最後の来店日を確認
        const lastVisit = reservations.reduce((latest, reservation) => {
          const resDate = new Date(reservation.datetime);
          return resDate > latest ? resDate : latest;
        }, new Date(0));

        if (lastVisit < twoMonthsAgo) {
          const retentionMessage = {
            type: 'flex',
            altText: 'お久しぶりです！特別オファーをご用意しました',
            contents: {
              type: 'bubble',
              header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: 'お久しぶりです！',
                    weight: 'bold',
                    color: '#ffffff',
                    size: 'lg'
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
                    text: `${name}様`,
                    weight: 'bold',
                    size: 'lg'
                  },
                  {
                    type: 'text',
                    text: 'お元気でしょうか？しばらくお会いできておりませんが、いかがお過ごしですか？',
                    margin: 'md',
                    wrap: true
                  },
                  {
                    type: 'separator',
                    margin: 'lg'
                  },
                  {
                    type: 'text',
                    text: '📢 カムバック特典',
                    weight: 'bold',
                    margin: 'lg'
                  },
                  {
                    type: 'text',
                    text: 'お久しぶりのお客様限定で、次回ご来店時に使える20%OFFクーポンをプレゼント！',
                    size: 'sm',
                    margin: 'md',
                    wrap: true
                  },
                  {
                    type: 'text',
                    text: '※今月末まで有効',
                    size: 'xs',
                    color: '#999999',
                    margin: 'sm'
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
                      label: '特典を使って予約する',
                      uri: 'https://your-domain.com/index.html'
                    },
                    style: 'primary',
                    color: '#6f42c1'
                  }
                ]
              }
            }
          };

          retentionPromises.push(client.pushMessage(userId, retentionMessage));
        }
      });

      await Promise.all(retentionPromises);
      console.log(`${retentionPromises.length}件の離反防止メッセージを送信しました`);
    } catch (error) {
      console.error('離反防止メッセージエラー:', error);
    }
  });

// ===== 季節限定メニュー告知 =====
exports.sendSeasonalMenuAnnouncement = functions.pubsub
  .schedule('0 11 1 * *') // 毎月1日11時に実行
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      
      // 季節メニューの設定
      const seasonalMenus = {
        3: { season: '春', menu: 'さくらカラー', description: '春らしいピンクカラーで新しい季節を迎えませんか？' },
        6: { season: '夏', menu: 'クールカット', description: '暑い夏を涼しく過ごせるスッキリスタイル' },
        9: { season: '秋', menu: 'オータムカラー', description: '深みのあるカラーで大人っぽく' },
        12: { season: '冬', menu: 'ウィンターパーマ', description: '乾燥に負けない潤いパーマ' }
      };

      const currentSeason = seasonalMenus[currentMonth];
      if (!currentSeason) return;

      // 全顧客に季節メニューを告知
      const snapshot = await db.collection('customers').get();
      const announcementPromises = [];

      snapshot.forEach(doc => {
        const customer = doc.data();
        const { userId, name } = customer;

        const seasonalMessage = {
          type: 'flex',
          altText: `${currentSeason.season}の限定メニューのご案内`,
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `${currentSeason.season}限定メニュー`,
                  weight: 'bold',
                  color: '#ffffff',
                  size: 'lg'
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
                  text: `${name}様`,
                  weight: 'bold',
                  size: 'lg'
                },
                {
                  type: 'text',
                  text: `${currentSeason.season}の新メニューをご紹介！`,
                  margin: 'md'
                },
                {
                  type: 'separator',
                  margin: 'lg'
                },
                {
                  type: 'text',
                  text: currentSeason.menu,
                  weight: 'bold',
                  size: 'xl',
                  margin: 'lg',
                  align: 'center'
                },
                {
                  type: 'text',
                  text: currentSeason.description,
                  margin: 'md',
                  wrap: true
                },
                {
                  type: 'text',
                  text: '期間限定の特別価格でご提供中です✨',
                  size: 'sm',
                  margin: 'lg',
                  color: '#dc3545'
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
                    label: '詳細を見る・予約する',
                    uri: 'https://your-domain.com/index.html'
                  },
                  style: 'primary',
                  color: '#17a2b8'
                }
              ]
            }
          }
        };

        announcementPromises.push(client.pushMessage(userId, seasonalMessage));
      });

      await Promise.all(announcementPromises);
      console.log(`${announcementPromises.length}件の季節メニュー告知を送信しました`);
    } catch (error) {
      console.error('季節メニュー告知エラー:', error);
    }
  });

// ===== 予約キャンセル時の通知 =====
exports.sendCancellationNotification = functions.firestore
  .document('reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // ステータスがキャンセルに変更された場合
      if (before.status !== 'cancelled' && after.status === 'cancelled') {
        const { userId, name, menuName, staffName, datetime } = after;

        const reservationDate = new Date(datetime);
        const dateStr = reservationDate.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        const timeStr = reservationDate.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit'
        });

        const cancellationMessage = {
          type: 'flex',
          altText: '予約キャンセルのお知らせ',
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: '予約キャンセル',
                  weight: 'bold',
                  color: '#ffffff',
                  size: 'lg'
                }
              ],
              backgroundColor: '#dc3545',
              paddingAll: 'lg'
            },
            body: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'text',
                  text: `${name}様`,
                  weight: 'bold',
                  size: 'lg'
                },
                {
                  type: 'text',
                  text: '以下の予約をキャンセルいたしました。',
                  margin: 'md'
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
                        { type: 'text', text: '日時', flex: 1, color: '#666666' },
                        { type: 'text', text: `${dateStr} ${timeStr}`, flex: 2 }
                      ],
                      margin: 'md'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: 'メニュー', flex: 1, color: '#666666' },
                        { type: 'text', text: menuName, flex: 2 }
                      ],
                      margin: 'sm'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        { type: 'text', text: '担当', flex: 1, color: '#666666' },
                        { type: 'text', text: staffName, flex: 2 }
                      ],
                      margin: 'sm'
                    }
                  ],
                  margin: 'lg'
                },
                {
                  type: 'text',
                  text: 'またのご予約をお待ちしております。',
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
                    label: '新しい予約をする',
                    uri: 'https://your-domain.com/index.html'
                  },
                  style: 'primary'
                }
              ]
            }
          }
        };

        await client.pushMessage(userId, cancellationMessage);
        console.log('予約キャンセル通知を送信しました:', context.params.reservationId);
      }
    } catch (error) {
      console.error('予約キャンセル通知エラー:', error);
    }
  });