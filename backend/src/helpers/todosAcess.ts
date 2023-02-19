import * as AWS from 'aws-sdk';
// @ts-ignore
import * as AWSXRay from 'aws-xray-sdk';
import type { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createLogger } from '@utils/logger';
import { TodoItem } from '@models/TodoItem';
import { TodoUpdate } from '@models/TodoUpdate';
import { GetTodosResponse } from '@responses/GetTodosResponse';
import { encodeNextKey } from '@utils/pagination';

const XAWS = AWSXRay.captureAWS(AWS);

const logger = createLogger('TodosAccess');

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX
    ) {}

    async getAllTodos(userId: string, nextKey: JSON, limit: number): Promise<GetTodosResponse> {
        logger.info(`Getting all todos for user with id '${userId}'`);

        // Query operation parameters
        const queryParams = {
            TableName: this.todosTable,
            IndexName: this.todosCreatedAtIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
            Limit: limit,
            ExclusiveStartKey: nextKey,
        };

        const result = await this.docClient.query(queryParams).promise();
        const items = result.Items as TodoItem[];

        return {
            items: items,
            nextKey: encodeNextKey(result.LastEvaluatedKey),
        };
    }

    async getTodoById(userId: string, todoId: string): Promise<TodoItem> {
        logger.info(`Getting todo with id '${todoId}' for user with id ${userId}`);

        const result = await this.docClient
            .get({
                TableName: this.todosTable,
                Key: {
                    todoId,
                    userId,
                },
            })
            .promise();

        const todo = result.Item as TodoItem;

        return todo;
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info('Creating a todo');

        await this.docClient
            .put({
                TableName: this.todosTable,
                Item: todo,
            })
            .promise();

        return todo;
    }

    async updateTodo(userId: string, todoId: string, todo: TodoUpdate): Promise<void> {
        logger.info(`Updating todo with id '${todoId}' for user with id ${userId}`);

        await this.docClient
            .update({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
                UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
                ExpressionAttributeNames: {
                    '#name': 'name',
                },
                ExpressionAttributeValues: {
                    ':name': todo.name,
                    ':dueDate': todo.dueDate,
                    ':done': todo.done,
                },
            })
            .promise();
    }

    async updateTodoAttachmentUrl(
        userId: string,
        todoId: string,
        attachmentUrl: string
    ): Promise<void> {
        logger.info(`Updating todo with id ${todoId} attachment URL for user with id ${userId}`);

        await this.docClient
            .update({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
                UpdateExpression: 'set attachmentUrl = :attachmentUrl',
                ExpressionAttributeValues: {
                    ':attachmentUrl': attachmentUrl,
                },
            })
            .promise();
    }

    async deleteTodo(userId: string, todoId: string): Promise<void> {
        logger.info(`Deleting todo with ${todoId} for user with id ${userId}`);

        await this.docClient
            .delete({
                TableName: this.todosTable,
                Key: {
                    userId,
                    todoId,
                },
            })
            .promise();
    }
}
