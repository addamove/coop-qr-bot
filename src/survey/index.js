const config = require('../config');
const moment = require('moment');
const survey = require('../survey');
const QR = require('../QR');
const path = require('path');

async function checking(bot, peer) {
  //  возможность отправить ответ отключаю в onINteractiveMessage
  config.users[peer.id].verification = true;

  bot.sendInteractiveMessage(peer, 'Сейчас вы можете потвердить или отредактировать данные', [
    {
      actions: [
        {
          id: 's',
          widget: {
            type: 'button',
            value: 'complete',
            label: 'Потвердить',
          },
        },
      ],
    },
    {
      actions: [
        {
          id: 's',
          widget: {
            type: 'select',
            label: 'Редактировать',
            options: [
              {
                label: 'ФИО',
                value: 'fio_0',
              },
              {
                label: 'Дата рождения',
                value: 'birth_1',
              },
              {
                label: 'Регион',
                value: 'region_2',
              },
              {
                label: 'Должность',
                value: 'vacation_4',
              },
              {
                label: 'Статус',
                value: 'status_5',
              },
              {
                label: 'Компания',
                value: 'company_3',
              },
            ],
          },
        },
      ],
    },
  ]);
}

function AskQuestions(bot, peer, message) {
  const keys = Object.keys(config.users[peer.id].anwsers);
  if (config.users[peer.id].i <= config.questions.length - 1) {
    if (message.content.text.length < 99) {
      if (config.users[peer.id].i === 2) {
        if (moment(message.content.text, 'DD.MM.YYYY', true).isValid()) {
          config.users[peer.id].anwsers[keys[config.users[peer.id].i - 1]] = message.content.text;
          bot.sendTextMessage(peer, config.questions[config.users[peer.id].i]);
        } else {
          bot.sendTextMessage(
            peer,
            `Что-то пошло не так. Возможно вы неправильно ввели дату. \n${
              config.questions[config.users[peer.id].i - 1]
            }`,
          );
          config.users[peer.id].i -= 1;
        }
      } else {
        config.users[peer.id].anwsers[keys[config.users[peer.id].i - 1]] = message.content.text;
        bot.sendTextMessage(peer, config.questions[config.users[peer.id].i]);
      }
    } else {
      bot.sendTextMessage(
        peer,
        `Что-то пошло не так. Возможно слишком длинный ответ, попробуйте ответить мне покорoче. \n${
          config.questions[config.users[peer.id].i - 1]
        }`,
      );
      config.users[peer.id].i -= 1;
    }
  }
  if (config.users[peer.id].i === config.questions.length) {
    bot.sendTextMessage(peer, 'Готово!\nВаши данные :\n');
    config.users[peer.id].anwsers[keys[config.users[peer.id].i - 1]] = message.content.text;

    bot.sendTextMessage(
      peer,
      `
•Ваши ФИО - ${config.users[peer.id].anwsers.fio}
•Дата рождения - ${config.users[peer.id].anwsers.birth}
•Ваш регион - ${config.users[peer.id].anwsers.region}
•Компания - ${config.users[peer.id].anwsers.company}
•Ваша должность - ${config.users[peer.id].anwsers.vacation}
•Статус - ${config.users[peer.id].anwsers.status}`,
    );
    checking(bot, peer);
  }
  config.users[peer.id].i += 1;
}

function sendVerificationInfoToadmin(bot, peer) {
  bot.sendTextMessage(
    peer,
    'Отправили вашу информацию для потверждения, подождите пока наш администратор вас верифицирует, я вам напишу результат когда будет готово',
  );
  const adminPeer = config.admins[0];
  config.users[peer.id].edit = false; // больше не сможет изменить инфу о себе

  bot.sendInteractiveMessage(
    adminPeer,
    `ФИО - ${config.users[peer.id].anwsers.fio}\nДата рождения - ${
      config.users[peer.id].anwsers.birth
    }\nРегион - ${config.users[peer.id].anwsers.region}\nКомпания - ${
      config.users[peer.id].anwsers.company
    }\nДолжность - ${config.users[peer.id].anwsers.vacation}\nСтатус - ${
      config.users[peer.id].anwsers.status
    }\n
    Потвердите данные кооператора.`,
    [
      {
        actions: [
          {
            id: 'yes',
            widget: {
              type: 'button',
              value: `ver_true_${JSON.stringify(config.users[peer.id].peer.id)}`,
              label: 'Верифицировать',
            },
          },
          {
            id: 'no',
            widget: {
              type: 'button',
              value: `ver_false_${JSON.stringify(config.users[peer.id].peer.id)}`,
              label: 'Отказать',
            },
          },
        ],
      },
    ],
  );
}

// изменяет введеные ответы
async function edit(peer, message, bot) {
  if (config.users[peer.id].editValue === 'birth') {
    if (moment(message.content.text, 'DD.MM.YYYY', true).isValid()) {
      const oldVal = config.users[peer.id].anwsers[config.users[peer.id].editValue];
      config.users[peer.id].anwsers[config.users[peer.id].editValue] = message.content.text;
      await bot.sendTextMessage(
        peer,
        JSON.stringify(`Изменили ${
          config.questions[
            Object.keys(config.users[peer.id].anwsers).indexOf(config.users[peer.id].editValue)
          ]
        } c *${oldVal}* на *${config.users[peer.id].anwsers[config.users[peer.id].editValue]}*`),
      );
      survey.checking(bot, peer);
    } else {
      bot.sendTextMessage(peer, 'Что-то пошло не так. Возможно вы неправильно ввели дату. \n');
      survey.checking(bot, peer);
    }

    return;
  }
  const oldVal = config.users[peer.id].anwsers[config.users[peer.id].editValue];
  config.users[peer.id].anwsers[config.users[peer.id].editValue] = message.content.text;
  await bot.sendTextMessage(
    peer,
    JSON.stringify(`Изменили ${
      config.questions[
        Object.keys(config.users[peer.id].anwsers).indexOf(config.users[peer.id].editValue)
      ]
    } c ${oldVal} на ${config.users[peer.id].anwsers[config.users[peer.id].editValue]}`),
  );
  survey.checking(bot, peer);
  config.users[peer.id].edit = false;
}

async function newSurvey(peer, bot) {
  config.users[peer.id] = {
    peer,
    id: peer.id,
    i: 0,
    phone: undefined,
    verified: false,
    hello: true,
    verification: false,
    edit: false,
    editValue: '',
    needHelp: false,
    anwsers: {
      fio: '',
      birth: '',
      region: '',
      company: '',
      vacation: '',
      status: '',
    },
  };
  try {
    const res = await config.getUserPhone(peer.id);
    config.users[peer.id].phone = res;
  } catch (err) {
    console.log(err);
    await bot.sendTextMessage(
      peer,
      'К сожалению, наши сервера не ответили вам взаимностью.  Мы работаем над этим и вскоре исправим ситуацию.',
    );
  }

  bot.sendInteractiveMessage(
    peer,
    'Здравствуйте! Я чатбот, который поможет сформировать цифровую визитку в виде QR-кода. Многие современные телефоны могут отсканировать ее при помощи встроенной камеры. Это позволяет быстро обменяться контактами и не вводить данные в записную книгу телефона вручную.\n ',
    [
      {
        actions: [
          {
            id: 's',
            widget: {
              type: 'button',
              value: 'start',
              label: 'Получить визитку.',
            },
          },
        ],
      },
    ],
  );
}

async function adminVerification(bot, event) {
  const adminPeer = config.admins[0];

  //
  const val = event.value.split('_'); // пример 'ver_true_' + JSON.stringify(config.users[peer.id].peer.id)
  if (val[1] === 'true') {
    // админ потвердил
    bot.sendTextMessage(adminPeer, 'Потвреждение отправлено');
    const user = await bot.getUser(config.users[val[2]].peer.id);
    config.users[val[2]].verified = true;
    // config.users[val[2]].peer - пир того кто пишет боту adminPeer - пир админа
    bot.sendTextMessage(
      config.users[val[2]].peer,
      `Ваш аккаунт потвердили
        Чтобы вас добавили в контакты кооп конекта, достаточно отсканировать qrcode программой на смартфоне и сохранить контакт на устройстве. 
        Новый контакт в coop connect добавится автоматически.
        \n Это так просто!\n`,
    );

    if (user.nick !== 'null') {
      try {
        await QR.makeQR(user.nick, config.users[val[2]], config.users[val[2]].peer, bot);
        bot.sendImageMessage(
          config.users[val[2]].peer,
          path.join(__dirname, `../${config.users[val[2]].peer.id}_invintation.png`),
        );
      } catch (err) {
        await bot.sendTextMessage(
          config.users[val[2]].peer,
          'К сожалению, наши сервера не ответили вам взаимностью.  Мы работаем над этим и вскоре исправим ситуацию.',
        );
        console.log(err);
      }
    } else {
      bot.sendTextMessage(config.users[val[2]].peer, 'Установите никнейм в настройках');
    }
  } else {
    // сообщения с этим пиром уйдут админу

    let once = false; // onMessage only once
    bot.sendTextMessage(adminPeer, 'Напишите причину отказа');
    bot.onMessage(async (message) => {
      if (once === false) {
        bot.sendTextMessage(
          config.users[val[2]].peer,
          ` *Вам отказали по причине*: "${
            message.content.text
          }"\nОтредактируйте свои данные и отправьте повторно`,
        );
        bot.sendTextMessage(adminPeer, 'Отказ отправлен');

        survey.checking(bot, config.users[val[2]].peer);

        once = true; // костыль
      }
    });
  }
}

module.exports = {
  AskQuestions,
  sendVerificationInfoToadmin,
  checking,
  edit,
  newSurvey,
  adminVerification,
};
