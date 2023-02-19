/**
 * Get a query parameter or return "undefined"
 *
 * @param {Object} event HTTP event passed to a Lambda function
 * @param {string} name a name of a query parameter to return
 *
 * @returns {string} a value of a query parameter value or "undefined" if a parameter is not defined
 */
export function getQueryParameter(event: any, name: string) {
    const queryParams = event.queryStringParameters;
    if (!queryParams) {
        return undefined;
    }

    return queryParams[name];
}
