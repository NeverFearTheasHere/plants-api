import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();
const allPushTokens = ['ExponentPushToken[XVbCnmL44cuKw9CUG-_5La]'];

export const registerPushToken: APIGatewayProxyHandler = async (event, _context) => {
  const { body } = event
  let pushToken;

  const bodyJson = JSON.parse(body);
  pushToken = bodyJson.pushToken;

  allPushTokens.push(pushToken);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Registered push token: ${pushToken}`,
    }),
  };
}

export const sendNotification: APIGatewayProxyHandler = async () => {
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
      body: `Don't forget to water your ${plant.displayName.toLowerCase()}`,
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

type Plant = {
  id: number,
  displayName: string,
};

const plants: Array<Plant> = [
  {
    id: 1,
    displayName: 'Redcurrant',
  },
  {
    id: 2,
    displayName: 'Clematis',
  },
  {
    id: 3,
    displayName: 'New Zealand Myrtle',
  },
  {
    id: 4,
    displayName: 'Three-coloured Nasturtium',
  },
  {
    id: 5,
    displayName: `Kale 'Redbor'`,
  },
];

const GetRandomPlant = () => plants[Math.floor(Math.random() * plants.length)];

