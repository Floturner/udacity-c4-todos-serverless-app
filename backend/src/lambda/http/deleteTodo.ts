import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { createLogger } from '@utils/logger';
import { getUserId } from '@lambda/utils';
import { deleteTodo } from '@helpers/todos';

const logger = createLogger('deleteTodo');

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        logger.info('Processing deleteTodo event', { event });

        const todoId = event.pathParameters.todoId;
        const userId = getUserId(event);

        await deleteTodo(userId, todoId);

        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: '',
        };
    }
);

handler.use(httpErrorHandler()).use(
    cors({
        credentials: true,
    })
);
