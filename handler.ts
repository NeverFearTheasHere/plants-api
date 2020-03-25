import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { Expo } from 'expo-server-sdk';
import { getAllUsersAsync, addOrUpdateUserAsync, User, getUserAsync } from './database';
import { plants } from './plants';

const expo = new Expo();

export const registerPushToken: APIGatewayProxyHandler = async (event, _context) => {
  const { body } = event
  const bodyJson = JSON.parse(body);

  const user: User = {
    pushToken: bodyJson.pushToken,
    name: bodyJson.name,
  };

  await addOrUpdateUserAsync(user);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Registered push token ${user.pushToken} for ${user.name}`,
    }),
  };
}

export const getUser: APIGatewayProxyHandler = async (event, _context) => {
  const { pathParameters: { pushToken } } = event;

  let user = await getUserAsync(decodeURI(pushToken));

  return {
    statusCode: user == null ? 404 : 200,
    body: JSON.stringify(user),
  };
}

export const sendNotification: APIGatewayProxyHandler = async () => {
  const allUsers = await getAllUsersAsync();
  const allPushTokens = allUsers.map(user => user.pushToken);

  let messages = [];
  for (let pushToken of allPushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    const plant = GetRandomPlant();

    messages.push({
      to: pushToken,
      sound: 'default',
      body: `Don't forget to water your ${plant.displayName}`,
      data: { plantId: plant.id },
    })
  }

  let chunks = expo.chunkPushNotifications(messages);

  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error(error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Sent ${messages.length} notifications`,
      messages: messages,
    }),
  };
}

const GetRandomPlant = () => plants[Math.floor(Math.random() * plants.length)];

