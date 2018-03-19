const config = require('../config');
const { GraphQLClient } = require('@dlghq/dialog-api-utils');

const gql = new GraphQLClient(config.graphql);

async function getUserPhone(uid) {
  const phone = await gql.graphql({
    query: `
    query($uid: ID!) {
      users_item(user_id: $uid ) { phones } 
    }
  `,
    variables: { uid },
  });
  return JSON.stringify(phone.users_item.phones[0]);
}

async function setNickname(uid, nickname) {
  await gql.graphql({
    query: `
    mutation ($uid: ID!, $nickname: String!) {
      users_update(user_id: $uid, nickname: $nickname) {
        id
      }
    }
  `,
    variables: { uid, nickname },
  });
}

async function updateCustomProfile(uid, profile) {
  await gql.graphql({
    query: `
    mutation ($uid: ID!, $profile: String) {
      users_update(user_id: $uid, custom_profile: $profile) {
        id
      }
    }
  `,
    variables: {
      uid,
      profile: profile ? JSON.stringify(profile) : null,
    },
  });
}

module.exports = {
  getUserPhone,
  updateCustomProfile,
  setNickname,
};
