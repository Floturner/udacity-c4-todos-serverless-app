import { TodoItem } from '@models/TodoItem';
/**
 * Fields in a response to get all TODO items with pagination.
 */
export interface GetTodosResponse {
    items: TodoItem[];
    nextKey: string;
}
