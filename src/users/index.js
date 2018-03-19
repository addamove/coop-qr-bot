const config = require('../config');
const DB = require('../rethinkDB');
const GQL = require('../GraphQL');

async function initUser(peer, bot) {
  try {
    const query = DB.filterByPeer({
      id: peer.id,
      key: `u${peer.id}`,
      type: 'user',
    });
    // console.log(`${JSON.stringify(query)} HIALL ${JSON.stringify(peer)}`);
    if (typeof query[0] === 'undefined') {
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
        const result = await GQL.getUserPhone(peer.id);
        config.users[peer.id].phone = result;
        DB.insertUser(config.users[peer.id]);
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
      } catch (err) {
        console.error(err);
        await bot.sendTextMessage(
          peer,
          'К сожалению, наши сервера не ответили вам взаимностью.  Мы работаем над этим и вскоре исправим ситуацию.',
        );
      }
    } else {
      config.users[peer.id] = query[0];

      // первое сообщение
      bot.sendInteractiveMessage(
        peer,
        'Здравствуйте! Я чатбот, который поможет сформировать цифровую визитку в виде QR-кода. Многие современные телефоны могут отсканировать ее при помощи встроенной камеры. Это позволяет быстро обменяться контактами и не вводить данные в записную книгу телефона вручную. Для генерации электронной визитки все информационные поля вашего профиля должны быть заполнены.\n ',
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
  } catch (err) {
    bot.sendTextMessage(
      peer,
      'К сожалению у нас пробелмы с базами данных, в скором времени решим и обязательн осообщим вам об этом!',
    );
    console.log(err);
  }
}

async function makeNick(state, message, bot, peer) {
  if (typeof state[peer.id] === 'undefined') {
    state[peer.id] = {
      nicknameCheck: true,
    };
  }

  if (message.content.text.match(/^[a-zA-Z0-9_.]{5,20}$/i) && !state[peer.id].nicknameCheck) {
    if (message.content.text.length < 5 && message.content.text.length >= 20) {
      await bot.sendTextMessage(peer, 'Попробуйте другой ник, к сожалению этот не подходит.');
    } else {
      try {
        await config.setNickname(peer.id, message.content.text);
        await bot.sendTextMessage(
          peer,
          `Успешно! Теперь ваш никнейм: *${
            message.content.text
          }*.  Напишите мне далее, чтобы продолжить.`,
        );
      } catch (error) {
        console.error(error);
        await bot.sendTextMessage(
          peer,
          'Что-то пошло не так. Возможно ваш никнейм уже занят, попробуйте другой.\n\n',
        );
        await bot.sendTextMessage(peer, 'Введите никнейм:');
      }
    }
  }

  if (!message.content.text.match(/^[a-zA-Z0-9_.]{5,20}$/i) && !state[peer.id].nicknameCheck) {
    await bot.sendTextMessage(peer, 'Попробуйте другой ник, к сожалению этот не подходит.');
  }

  if (state[peer.id].nicknameCheck) {
    await bot.sendTextMessage(
      peer,
      'Здравствуйте! Я чатбот, который поможет сформировать цифровую визитку в виде QR-кода. Многие современные телефоны могут отсканировать ее при помощи встроенной камеры. Это позволяет быстро обменяться контактами и не вводить данные в записную книгу телефона вручную.\nДля начала работы придумайте короткое имя(никнейм). В никнейме должно быть не менее 5 символов, использовать можно только латинские буквы, цифры.',
    );
    await bot.sendTextMessage(peer, 'Введите никнейм:');
    state[peer.id].nicknameCheck = false;
  }
}

module.exports = {
  initUser,
  makeNick,
};
