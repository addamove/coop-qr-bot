/*
TODO
Прикрутить ДБ

*/

const { Bot } = require('@dlghq/dialog-bot-sdk');
const config = require('./config');
const QR = require('./QR');
const users = require('./users');
const survey = require('./survey');

const bot = new Bot(config.bot);

const state = {};

bot.onMessage(async (peer, message) => {
  const user = await bot.getUser(peer.id);
  if (peer.type !== 'group') {
    if (!user.nick) {
      // если нету никнейма у юзера
      users.makeNick(state, message, bot, peer);
    } else if (typeof config.users[peer.id] === 'undefined' && peer.id !== config.admins[0].id) {
      // инициализируем нового юзера
      users.initUser(peer, bot);
    }

    if (config.users[peer.id]) {
      // задаем вопросы
      if (config.users[peer.id].verification && peer !== config.admins[0]) {
        survey.AskQuestions(bot, peer, message);
      }

      // если пользовaтель редактирует ответы

      if (config.users[peer.id].edit) {
        survey.edit(peer, message, bot);
      }

      // Переделываем QRкод если пользователь написал визитка или моя визитка
      if (
        (config.users[peer.id].verified === true &&
          message.content.text.toUpperCase() === 'ВИЗИТКА') ||
        (config.users[peer.id].verified === true &&
          message.content.text.toUpperCase() === 'МОЯ ВИЗИТКА') ||
        (config.users[peer.id].verified === true &&
          message.content.text.toUpperCase() === '"МОЯ ВИЗИТКА"') ||
        (config.users[peer.id].verified === true &&
          message.content.text.toUpperCase() === '"ВИЗИТКА"')
      ) {
        QR.remakeQR(bot, peer, user);
      }

      // help section
      if (
        message.content.text.toLowerCase() === 'отзыв' ||
        config.users[peer.id].needHelp === true
      ) {
        if (config.users[peer.id].needHelp) {
          bot.sendTextMessage(peer, 'Отзыв отправлен. Всего вам доброго!');

          bot.sendTextMessage(config.admins[0], message.content.text);
          config.users[peer.id].needHelp = false;
        } else {
          bot.sendTextMessage(peer, 'Напишите отзыв');
          config.users[peer.id].needHelp = true;
        }
      }
    }

    // x - английская
    if (message.content.text.toLowerCase() === '/дебаx') {
      bot.sendTextMessage(peer, JSON.stringify(config.users));
    }

    // пользователь уже загруженный в дб хочет заново пройти тест
    if (
      (message.content.text.toLowerCase() === 'пройти тест' ||
        message.content.text.toLowerCase() === 'ghjqnb ntcn') &&
      config.users[peer.id].i > 0
    ) {
      survey.newSurvey(peer, bot);
    }
  }
});

bot.onInteractiveEvent(async (event) => {
  if (event.value === 'start' && config.users[event.peer.id].i >= 7) {
    bot.sendTextMessage(
      event.peer,
      'Похоже что раньше вы уже делали визитку. Если вы хотите увидеть свой куар код напишите мне "визитка" или "моя визитка" и немного подождите.\n Если же вы хотите пройти тест еще раз,то напишите команду "пройти тест". Команды пишутся без кавычек.',
    );
  }

  if (event.value === 'start' && config.users[event.peer.id].i === 0) {
    bot.sendTextMessage(event.peer, config.questions[0]);
    // начинаем верифицировать пользователя т е теперь он при отправке сообщения попадет в секцию где задаются вопросы
    config.users[String(event.peer.id)].verification = true;
    config.users[event.peer.id].i++;
  }

  if (event.value === 'complete' && config.users[event.peer.id].verification == true) {
    survey.sendVerificationInfoToadmin(bot, event.peer);
    // больше не попадем в секцию где задаются вопросы и отключаем возможность многократно отправить админу информацию о себе
    config.users[event.peer.id].verification = false;
  } //  работает

  // ответ на селект редактирования
  if (
    event.value == 'fio_0' ||
    event.value == 'birth_1' ||
    event.value == 'region_2' ||
    event.value == 'vacation_4' ||
    event.value == 'status_5' ||
    event.value == 'company_3'
  ) {
    const UserSelect = event.value.split('_'); // array[fio,0]
    bot.sendTextMessage(event.peer, `Вы хотите изменить: ${config.questions[UserSelect[1]]}`); // отсылаем вопрос под номером кнопки

    config.users[event.peer.id].edit = true; // посылаем в секцию редактирования
    config.users[event.peer.id].editValue = UserSelect[0]; // какой пункт надо изменить
  }

  // потверждение верификациN админом
  if (event.value.split('_')[0] === 'ver') {
    survey.adminVerification(bot, event);
  }
});
