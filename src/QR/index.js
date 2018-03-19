const QRCode = require('qrcode');
const vCard = require('vcards-js');
const config = require('../config');
const DB = require('../rethinkDB');
const path = require('path');

async function makeQR(nickname, persona, peer, bot) {
  const schema = {
    fullName: persona.anwsers.fio,
    birthday: persona.anwsers.birth,
    region: persona.anwsers.region,
    company: persona.anwsers.company,
    position: persona.anwsers.vacation,
    status: persona.anwsers.status,
  };

  // заносим результаты в дб
  DB.replace({
    id: peer.id,
    key: `u${peer.id}`,
    type: 'user',
  });

  // апдейтиим профиль
  try {
    await config.updateCustomProfile(peer.id, schema);
  } catch (error) {
    console.error(error);
    await bot.sendTextMessage(
      peer,
      'К сожалению, наши сервера не ответили вам взаимностью и ваш кастомный профиль не обновился. Мы работаем над этим и вскоре исправим ситуацию.',
    );
  }

  const qrCard = vCard();
  qrCard.workPhone = persona.phone.replace(/['"«»]/g, '') || 0;
  qrCard.firstName = persona.anwsers.fio;
  qrCard.role = persona.anwsers.vacation;
  qrCard.organization = persona.anwsers.company;
  qrCard.url = `https://global.coop/@/${nickname}`;

  await new Promise((resolve, reject) => {
    QRCode.toFile(
      `./src/${peer.id}_invintation.png`,
      qrCard.getFormattedString(),
      {
        color: {
          dark: '#000000',
          light: '#F0F8FF',
        },
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

async function remakeQR(bot, peer, user) {
  try {
    bot.sendTextMessage(peer, 'Обрабатываем запрос');
    await makeQR(user.nick, config.users[peer.id], peer, bot);
    bot.sendImageMessage(peer, path.join(__dirname, `./${peer.id}_invintation.png`));
  } catch (err) {
    await bot.sendTextMessage(
      peer,
      'К сожалению, наши сервера не ответили вам взаимностью.  Мы работаем над этим и вскоре исправим ситуацию.',
    );
    console.log(err);
  }
}

module.exports = {
  makeQR,
  remakeQR,
};
