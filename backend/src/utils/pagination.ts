import { getQueryParameter } from './request';

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @returns {number} parsed "limit" parameter
 */
export function parseLimitParameter(event: any) {
    const limitStr = getQueryParameter(event, 'limit');
    if (!limitStr) {
        return undefined;
    }

    const limit = parseInt(limitStr, 10);
    if (limit <= 0) {
        throw new Error('Limit should be positive');
    }

    return limit;
}

/**
 * Get value of the limit parameter.
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @returns {Object} parsed "nextKey" parameter
 */
export function parseNextKeyParameter(event: any) {
    const nextKeyStr = getQueryParameter(event, 'nextKey');
    if (!nextKeyStr) {
        return undefined;
    }

    const uriDecoded = decodeURIComponent(nextKeyStr);
    return JSON.parse(uriDecoded);
}

/**
 * Encode last evaluated key using
 *
 * @param {Object} lastEvaluatedKey a JS object that represents last evaluated key
 * @return {string} URI encoded last evaluated key
 */
export function encodeNextKey(lastEvaluatedKey: any) {
    if (!lastEvaluatedKey) {
        return null;
    }

    return encodeURIComponent(JSON.stringify(lastEvaluatedKey));
}
