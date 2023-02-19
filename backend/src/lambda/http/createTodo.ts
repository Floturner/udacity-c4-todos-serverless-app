import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'source-map-support/register';
import middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { createLogger } from '@utils/logger';
import { CreateTodoRequest } from '@requests/CreateTodoRequest';
import { getUserId } from '@lambda/utils';
import { createTodo } from '@helpers/todos';

const logger = createLogger('createTodo');

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        logger.info('Processing createTodo event', { event });

        const newTodo: CreateTodoRequest = JSON.parse(event.body);
        const userId = getUserId(event);

        const newItem = await createTodo(userId, newTodo);

        return {
            statusCode: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                item: newItem,
            }),
        };
    }
);

handler.use(httpErrorHandler()).use(
    cors({
        credentials: true,
    })
);
