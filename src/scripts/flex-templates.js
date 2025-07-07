// Flex Message テンプレート - Salone Ponte
// LINEリッチメッセージのテンプレート集

/**
 * Flex Messageテンプレート管理クラス
 */
class FlexTemplateManager {
  constructor() {
    this.templates = {
      appointment: this.createAppointmentTemplate(),
      promotion: this.createPromotionTemplate(),
      menu: this.createMenuTemplate(),
      staff: this.createStaffTemplate(),
      thankyou: this.createThankYouTemplate(),
      reminder: this.createReminderTemplate()
    };
  }

  /**
   * 予約確認テンプレート
   */
  createAppointmentTemplate() {
    return {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '予約確認',
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
            text: '{{customerName}}様',
            weight: 'bold',
            size: 'lg',
            margin: 'md'
          },
          {
            type: 'text',
            text: 'ご予約の確認です',
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
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '日時', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: '{{datetime}}', flex: 3, weight: 'bold', size: 'sm' }
                ],
                margin: 'md'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'メニュー', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: '{{menuName}}', flex: 3, weight: 'bold', size: 'sm' }
                ],
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'スタッフ', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: '{{staffName}}', flex: 3, weight: 'bold', size: 'sm' }
                ],
                margin: 'sm'
              }
            ]
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
              label: '予約を変更',
              uri: '{{bookingUrl}}'
            },
            style: 'primary',
            color: '#007bff'
          }
        ]
      }
    };
  }

  /**
   * キャンペーン告知テンプレート
   */
  createPromotionTemplate() {
    return {
      type: 'bubble',
      hero: {
        type: 'image',
        url: '{{promotionImage}}',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '{{promotionTitle}}',
            weight: 'bold',
            size: 'xl',
            color: '#333333'
          },
          {
            type: 'text',
            text: '{{promotionDescription}}',
            size: 'md',
            color: '#666666',
            margin: 'md',
            wrap: true
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '期間', flex: 1, color: '#aaaaaa', size: 'sm' },
                  { type: 'text', text: '{{promotionPeriod}}', flex: 3, color: '#666666', size: 'sm' }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '割引', flex: 1, color: '#aaaaaa', size: 'sm' },
                  { type: 'text', text: '{{discount}}', flex: 3, color: '#ff5551', size: 'sm', weight: 'bold' }
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
              label: '今すぐ予約',
              uri: '{{bookingUrl}}'
            },
            style: 'primary',
            color: '#ff5551'
          }
        ]
      }
    };
  }

  /**
   * メニュー紹介テンプレート
   */
  createMenuTemplate() {
    return {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          hero: {
            type: 'image',
            url: '{{menuImage1}}',
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '{{menuName1}}',
                weight: 'bold',
                size: 'lg'
              },
              {
                type: 'text',
                text: '{{menuDescription1}}',
                size: 'sm',
                color: '#666666',
                margin: 'md',
                wrap: true
              },
              {
                type: 'text',
                text: '¥{{menuPrice1}}',
                size: 'xl',
                color: '#ff5551',
                weight: 'bold',
                margin: 'md'
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
                  label: '詳細・予約',
                  uri: '{{bookingUrl1}}'
                },
                style: 'primary'
              }
            ]
          }
        },
        {
          type: 'bubble',
          hero: {
            type: 'image',
            url: '{{menuImage2}}',
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover'
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '{{menuName2}}',
                weight: 'bold',
                size: 'lg'
              },
              {
                type: 'text',
                text: '{{menuDescription2}}',
                size: 'sm',
                color: '#666666',
                margin: 'md',
                wrap: true
              },
              {
                type: 'text',
                text: '¥{{menuPrice2}}',
                size: 'xl',
                color: '#ff5551',
                weight: 'bold',
                margin: 'md'
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
                  label: '詳細・予約',
                  uri: '{{bookingUrl2}}'
                },
                style: 'primary'
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * スタッフ紹介テンプレート
   */
  createStaffTemplate() {
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'image',
                url: '{{staffImage}}',
                size: '5xl',
                aspectRatio: '1:1',
                aspectMode: 'cover',
                flex: 1
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: '{{staffName}}',
                    weight: 'bold',
                    size: 'lg',
                    color: '#333333'
                  },
                  {
                    type: 'text',
                    text: '{{staffRole}}',
                    size: 'sm',
                    color: '#666666',
                    margin: 'xs'
                  },
                  {
                    type: 'text',
                    text: '{{staffExperience}}',
                    size: 'xs',
                    color: '#aaaaaa',
                    margin: 'sm'
                  }
                ],
                flex: 2,
                paddingStart: 'md'
              }
            ]
          },
          {
            type: 'text',
            text: '{{staffIntroduction}}',
            size: 'sm',
            color: '#666666',
            margin: 'lg',
            wrap: true
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '得意メニュー',
                size: 'sm',
                color: '#333333',
                weight: 'bold'
              },
              {
                type: 'text',
                text: '{{staffSkills}}',
                size: 'xs',
                color: '#666666',
                margin: 'xs',
                wrap: true
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
              label: 'このスタッフで予約',
              uri: '{{bookingUrl}}'
            },
            style: 'primary'
          }
        ]
      }
    };
  }

  /**
   * お礼メッセージテンプレート
   */
  createThankYouTemplate() {
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: '{{salonLogo}}',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: '{{customerName}}様',
            weight: 'bold',
            size: 'lg',
            margin: 'lg',
            align: 'center'
          },
          {
            type: 'text',
            text: 'ご来店ありがとうございました',
            size: 'md',
            margin: 'md',
            align: 'center'
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
                type: 'text',
                text: '本日の施術',
                color: '#666666',
                size: 'sm'
              },
              {
                type: 'text',
                text: '{{todayMenu}}',
                weight: 'bold',
                margin: 'xs'
              }
            ],
            margin: 'lg'
          },
          {
            type: 'text',
            text: '{{thankYouMessage}}',
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
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: '次回予約',
                  uri: '{{bookingUrl}}'
                },
                style: 'primary',
                flex: 1
              },
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: 'レビュー',
                  uri: '{{reviewUrl}}'
                },
                style: 'secondary',
                flex: 1
              }
            ],
            spacing: 'sm'
          }
        ]
      }
    };
  }

  /**
   * リマインダーテンプレート
   */
  createReminderTemplate() {
    return {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '予約リマインダー',
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
            text: '{{customerName}}様',
            weight: 'bold',
            size: 'lg'
          },
          {
            type: 'text',
            text: '明日のご予約のお知らせです',
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
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '日時', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: '{{datetime}}', flex: 3, weight: 'bold', size: 'sm' }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'メニュー', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: '{{menuName}}', flex: 3, weight: 'bold', size: 'sm' }
                ],
                margin: 'sm'
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: 'スタッフ', flex: 1, color: '#666666', size: 'sm' },
                  { type: 'text', text: '{{staffName}}', flex: 3, weight: 'bold', size: 'sm' }
                ],
                margin: 'sm'
              }
            ],
            margin: 'lg'
          },
          {
            type: 'text',
            text: 'ご変更がございましたらお早めにご連絡ください',
            size: 'xs',
            color: '#666666',
            margin: 'lg',
            wrap: true
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '変更',
              data: 'action=change&reservationId={{reservationId}}'
            },
            style: 'secondary',
            flex: 1
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'キャンセル',
              data: 'action=cancel&reservationId={{reservationId}}'
            },
            style: 'secondary',
            flex: 1
          }
        ],
        spacing: 'sm'
      }
    };
  }

  /**
   * テンプレートを取得
   * @param {string} templateName - テンプレート名
   * @returns {object} Flex Messageテンプレート
   */
  getTemplate(templateName) {
    return this.templates[templateName] || null;
  }

  /**
   * テンプレートにデータを挿入
   * @param {string} templateName - テンプレート名
   * @param {object} data - 挿入データ
   * @returns {object} データが挿入されたFlex Message
   */
  populateTemplate(templateName, data) {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`テンプレート '${templateName}' が見つかりません`);
    }

    // テンプレートを文字列化してプレースホルダーを置換
    let templateStr = JSON.stringify(template);
    
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] || '';
      templateStr = templateStr.replace(new RegExp(placeholder, 'g'), value);
    });

    return JSON.parse(templateStr);
  }

  /**
   * 利用可能なテンプレート一覧を取得
   * @returns {Array} テンプレート名の配列
   */
  getAvailableTemplates() {
    return Object.keys(this.templates);
  }

  /**
   * テンプレートのプレビューを生成
   * @param {string} templateName - テンプレート名
   * @returns {object} プレビュー用のサンプルデータが入ったテンプレート
   */
  getTemplatePreview(templateName) {
    const sampleData = this.getSampleData(templateName);
    return this.populateTemplate(templateName, sampleData);
  }

  /**
   * サンプルデータを取得
   * @param {string} templateName - テンプレート名
   * @returns {object} サンプルデータ
   */
  getSampleData(templateName) {
    const samples = {
      appointment: {
        customerName: '山田 花子',
        datetime: '2025年1月10日 (金) 14:00',
        menuName: 'カット + カラー',
        staffName: '田中 美香',
        bookingUrl: 'https://salone-ponte-liff.vercel.app/'
      },
      promotion: {
        promotionTitle: '新春キャンペーン',
        promotionDescription: '新年を美しく迎えませんか？人気のカラーメニューが特別価格でご利用いただけます。',
        promotionPeriod: '1月1日〜1月31日',
        discount: '通常価格より30%OFF',
        promotionImage: 'https://via.placeholder.com/800x520/ff5551/ffffff?text=Campaign',
        bookingUrl: 'https://salone-ponte-liff.vercel.app/'
      },
      menu: {
        menuName1: 'カット',
        menuDescription1: 'トレンドを取り入れたスタイリッシュなカット',
        menuPrice1: '4,000',
        menuImage1: 'https://via.placeholder.com/800x520/007bff/ffffff?text=Cut',
        bookingUrl1: 'https://salone-ponte-liff.vercel.app/',
        menuName2: 'カラー',
        menuDescription2: 'お客様に似合う美しいカラーリング',
        menuPrice2: '6,000',
        menuImage2: 'https://via.placeholder.com/800x520/28a745/ffffff?text=Color',
        bookingUrl2: 'https://salone-ponte-liff.vercel.app/'
      },
      staff: {
        staffName: '田中 美香',
        staffRole: 'トップスタイリスト',
        staffExperience: '経験年数: 8年',
        staffIntroduction: 'お客様一人ひとりのライフスタイルに合わせたヘアスタイルをご提案いたします。',
        staffSkills: 'カラーリング、パーマ、ヘアケア',
        staffImage: 'https://via.placeholder.com/200x200/6f42c1/ffffff?text=Staff',
        bookingUrl: 'https://salone-ponte-liff.vercel.app/'
      },
      thankyou: {
        customerName: '山田 花子',
        todayMenu: 'カット + トリートメント',
        thankYouMessage: 'お忙しい中お時間をいただき、ありがとうございました。次回のご来店もお待ちしております。',
        salonLogo: 'https://via.placeholder.com/200x100/333333/ffffff?text=Salone+Ponte',
        bookingUrl: 'https://salone-ponte-liff.vercel.app/',
        reviewUrl: 'https://example.com/review'
      },
      reminder: {
        customerName: '山田 花子',
        datetime: '2025年1月10日 (金) 14:00',
        menuName: 'カット + カラー',
        staffName: '田中 美香',
        reservationId: 'res123'
      }
    };

    return samples[templateName] || {};
  }
}

// グローバルインスタンスを作成
const flexTemplateManager = new FlexTemplateManager();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FlexTemplateManager, flexTemplateManager };
} else if (typeof window !== 'undefined') {
  window.FlexTemplateManager = FlexTemplateManager;
  window.flexTemplateManager = flexTemplateManager;
}