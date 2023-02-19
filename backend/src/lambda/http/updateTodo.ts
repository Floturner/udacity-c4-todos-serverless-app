import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { createLogger } from '@utils/logger';
import { UpdateTodoRequest } from '@requests/UpdateTodoRequest';
import { getUserId } from '@lambda/utils';
import { updateTodo } from '@helpers/todos';

const logger = createLogger('updateTodo');

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        logger.info('Processing updateTodo event', { event });

        const todoId = event.pathParameters.todoId;
        const updatedTodo: UpdateTodoRequest = JSON.parse(event.body);
        const userId = getUserId(event);

        await updateTodo(userId, todoId, updatedTodo);

        return {
            statusCode: 200,
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
