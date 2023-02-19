import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from 'middy';
import { cors, httpErrorHandler } from 'middy/middlewares';
import * as createError from 'http-errors';

import { createLogger } from '@utils/logger';
import { getUserId } from '@lambda/utils';
import { getAllTodos } from '@helpers/todos';
import { parseLimitParameter, parseNextKeyParameter } from '@utils/pagination';

const logger = createLogger('getTodos');

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        logger.info('Processing getTodos event', { event });

        let nextKey: JSON;
        let limit: number;

        try {
            nextKey = parseNextKeyParameter(event);
            limit = parseLimitParameter(event) || 20;
        } catch (e) {
            logger.error('Failed to parse query parameters', { error: e.message });
            throw createError[400]('Invalid parameters');
        }

        const userId = getUserId(event);
        const todosResponse = await getAllTodos(userId, nextKey, limit);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(todosResponse),
        };
    }
);

handler.use(httpErrorHandler()).use(
    cors({
        credentials: true,
    })
);
