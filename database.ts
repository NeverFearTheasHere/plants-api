import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();

const USERS_TABLE_NAME = 'users';

export type User = {
  pushToken: string,
  name: string,
};

export const getAllUsersAsync = async (): Promise<Array<User>> => {
  const params = {
    TableName: USERS_TABLE_NAME,
    AttributesToGet: ['pushToken', 'name']
  };

  const data = await dynamoDb.scan(params).promise();
  return data.Items as Array<User>;
};

export const addOrUpdateUserAsync = async (user: User): Promise<void> => {
  const params = {
    TableName: USERS_TABLE_NAME,
    Item: {
      pushToken: user.pushToken,
      name: user.name,
    }
  };

  await dynamoDb.put(params).promise();
};

export const getUserAsync = async (pushToken: string): Promise<User | null> => {
  const params = {
    TableName: USERS_TABLE_NAME,
    Key: {
      pushToken
    },
  };

  console.log(`Getting user with pushToken ${pushToken}`);

  const data = await dynamoDb.get(params).promise();

  console.log(`got data: ${JSON.stringify(data)}`);

  if (data.Item == null){
    return null;
  }

  return data.Item as User;
}