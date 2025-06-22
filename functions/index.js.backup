const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const axios = require("axios");

exports.sendLineMessage = onDocumentCreated("reservations/{reservationId}", async (event) => {
  const data = event.data.data(); // Firestoreのデータ取得

  const lineUserId = data.userId;
  const message = {
    to: lineUserId,
    messages: [
      {
        type: "text",
        text: `${data.name}様、ご予約ありがとうございます！\n日時：${new Date(data.datetime).toLocaleString()}\nメニュー：${data.menu}`
      }
    ]
  };

  try {
    await axios.post("https://api.line.me/v2/bot/message/push", message, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer LbrCl0V8R3JCeOjRaGmbwS2da42IGGuMWYfBzCRuIjD911pVaVsFPJLAJxazV7meWwvTJOYemxHC5z/5Bl/VQbdE2S/dfg+RGVoZSkFlvHMR3Pqd/sZu1suMoL0/M1TP+qaFz/EXzF89KxlSYdoAxAdB04t89/1O/w1cDnyilFU=`
      }
    });
    logger.info("LINEメッセージ送信成功");
  } catch (error) {
    logger.error("LINE送信エラー:", error);
  }
});
