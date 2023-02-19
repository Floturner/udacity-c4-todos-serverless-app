import * as uuid from 'uuid';
import * as createError from 'http-errors';
import { TodosAccess } from './todosAcess';
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '@models/TodoItem';
import { CreateTodoRequest } from '@requests/CreateTodoRequest';
import { UpdateTodoRequest } from '@requests/UpdateTodoRequest';
import { GetTodosResponse } from '@responses/GetTodosResponse';
import { createLogger } from '@utils/logger';

const logger = createLogger('Todos');

const todosAccess = new TodosAccess();
const attachmentUtils = new AttachmentUtils();

export async function getAllTodos(
    userId: string,
    nextKey: JSON,
    limit: number
): Promise<GetTodosResponse> {
    try {
        return todosAccess.getAllTodos(userId, nextKey, limit);
    } catch (e) {
        logger.error('getAllTodos', { error: e.message });
        throw createError[500](e.message);
    }
}

export async function createTodo(
    userId: string,
    createTodoRequest: CreateTodoRequest
): Promise<TodoItem> {
    const todoId = uuid.v4();

    try {
        return await todosAccess.createTodo({
            userId,
            todoId,
            createdAt: new Date().toISOString(),
            done: false,
            ...createTodoRequest,
            attachmentUrl: null,
        });
    } catch (e) {
        logger.error('createTodo', { error: e.message });
        throw createError[500](e.message);
    }
}

export async function updateTodo(
    userId: string,
    todoId: string,
    updateTodoRequest: UpdateTodoRequest
): Promise<void> {
    try {
        const todo = await todosAccess.getTodoById(userId, todoId);

        if (!todo) {
            throw createError[404](
                `Todo with id '${todoId}' not found for user with id '${userId}'`
            );
        }

        await todosAccess.updateTodo(userId, todoId, updateTodoRequest);
    } catch (e) {
        logger.error('updateTodo', { error: e.message });
        throw createError[500](e.message);
    }
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    try {
        const todo = await todosAccess.getTodoById(userId, todoId);

        if (!todo) {
            throw createError[404](
                `Todo with id '${todoId}' not found for user with id '${userId}'`
            );
        }

        await todosAccess.deleteTodo(userId, todoId);

        await attachmentUtils.removeAttachment(todoId);
    } catch (e) {
        logger.error('deleteTodo', { error: e.message });
        throw createError[500](e.message);
    }
}

export async function updateTodoAttachmentUrl(userId: string, todoId: string): Promise<void> {
    try {
        const todo = await todosAccess.getTodoById(userId, todoId);

        if (!todo) {
            throw createError[404](
                `Todo with id '${todoId}' not found for user with id '${userId}'`
            );
        }

        const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId);

        await todosAccess.updateTodoAttachmentUrl(userId, todoId, attachmentUrl);
    } catch (e) {
        logger.error('updateTodoAttachmentUrl', { error: e.message });
        throw createError[500](e.message);
    }
}

export async function generateUploadUrl(todoId: string): Promise<string> {
    try {
        return await attachmentUtils.generateUploadUrl(todoId);
    } catch (e) {
        logger.error('generateUploadUrl', { error: e.message });
        throw createError[500](e.message);
    }
}
