import { APIGatewayTokenAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda';
import 'source-map-support/register';

import { verify, decode } from 'jsonwebtoken';
import Axios from 'axios';
import { createLogger } from '@utils/logger';
import { Jwt } from '@auth/Jwt';
import { JwtPayload } from '@auth/JwtPayload';
import { JwksKey } from '@auth/JwksKey';

const logger = createLogger('auth');

const jwksUrl = 'https://dev-jco03cd1o8wxse1z.us.auth0.com/.well-known/jwks.json';

export const handler = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
    logger.info('Authorizing a user', event.authorizationToken);
    try {
        const jwtToken = await verifyToken(event.authorizationToken);
        logger.info('User was authorized', jwtToken);

        return {
            principalId: jwtToken.sub,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Allow',
                        Resource: '*',
                    },
                ],
            },
        };
    } catch (e) {
        logger.error('User not authorized', { error: e.message });

        return {
            principalId: 'user',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: '*',
                    },
                ],
            },
        };
    }
};

async function verifyToken(authHeader: string): Promise<JwtPayload> {
    const token = getToken(authHeader);
    const jwt: Jwt = decode(token, { complete: true }) as Jwt;

    const signingKey = await getSigningKey(jwt.header.kid);
    const cert = getCertFromSigningKey(signingKey);
    return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload;
}

function getToken(authHeader: string): string {
    if (!authHeader) throw new Error('No authentication header');

    if (!authHeader.toLowerCase().startsWith('bearer '))
        throw new Error('Invalid authentication header');

    const split = authHeader.split(' ');
    const token = split[1];

    return token;
}

async function getSigningKey(kid: string): Promise<JwksKey> {
    logger.info(`Getting cert from signing key that matches '${kid}'`);

    // Get JWKS
    const response = await Axios.get(jwksUrl);
    const keys: [JwksKey] = response.data.keys;

    if (!keys || !keys.length) {
        throw new Error('The JWKS endpoint did not contain any keys');
    }

    // Get signing keys from JWKS
    const signingKeys = keys.filter(isSigningKey);

    if (!signingKeys.length) {
        throw new Error('The JWKS endpoint did not contain any signature verification keys');
    }

    // Get signing key that matches kid
    const signingKey = keys.find((key) => key.kid === kid);

    if (!signingKey) {
        throw new Error(`Unable to find a signing key that matches '${kid}'`);
    }

    return signingKey;
}

function getCertFromSigningKey(key: JwksKey): string {
    return `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
}

function isSigningKey(key: JwksKey) {
    return (
        key.use === 'sig' &&
        key.kty === 'RSA' &&
        key.kid &&
        ((key.x5c && key.x5c.length) || (key.n && key.e))
    );
}
