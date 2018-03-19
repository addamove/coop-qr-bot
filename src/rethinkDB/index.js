const r = require('rethinkdbdash')({ db: 'qrtestDB' });
const config = require('../config');

async function insertUser(user) {
  try {
    await r
      .table('state')
      .insert(user)
      .run();
  } catch (error) {
    console.log('insertUser');
    console.log(error);
  }
}

async function filterByPeer(peer) {
  try {
    const res = await r
      .table('state')
      .filter({
        peer,
      })
      .run();
    return res;
  } catch (error) {
    console.log('filterByPeer');
    console.log(error);
  }
  return 'undefined';
}

async function replace(peer) {
  try {
    const res = await r
      .table('state')
      .filter({
        peer,
      })
      .replace(config.users[peer.id])
      .run();
    return res;
  } catch (error) {
    console.log('replace');
    console.log(error);
  }
  return 'undefined';
}

module.exports = {
  replace,
  filterByPeer,
  insertUser,
};
