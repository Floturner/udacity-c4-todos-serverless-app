import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';

import { createLogger } from '@utils/logger';
import { getUserId } from '@lambda/utils';
import { generateUploadUrl, updateTodoAttachmentUrl } from '@helpers/todos';

const logger = createLogger('generateUploadUrl');

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        logger.info('Processing generateUploadUrl event', { event });

        const todoId = event.pathParameters.todoId;
        const userId = getUserId(event);

        const uploadUrl = await generateUploadUrl(todoId);

        await updateTodoAttachmentUrl(userId, todoId);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({
                uploadUrl,
            }),
        };
    }
);

handler.use(httpErrorHandler()).use(
    cors({
        credentials: true,
    })
);
