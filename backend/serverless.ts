// @ts-nocheck
import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
    org: 'floturner',
    app: 'serverless-todo-app',
    service: 'serverless-todo-app',
    frameworkVersion: '3',
    plugins: [
        'serverless-esbuild',
        'serverless-iam-roles-per-function',
        'serverless-plugin-tracing',
        'serverless-aws-documentation',
    ],
    package: { individually: true },
    provider: {
        name: 'aws',
        runtime: 'nodejs14.x',
        lambdaHashingVersion: '20201221',
        apiGateway: {
            minimumCompressionSize: 1024,
            shouldStartNameWithService: true,
        },
        stage: "${opt:stage, 'dev'}",
        region: 'us-east-1',
        tracing: {
            lambda: true,
            apiGateway: true,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
            TODOS_TABLE: 'Todos-${self:provider.stage}',
            TODOS_CREATED_AT_INDEX: 'CreatedAtIndex',
            ATTACHMENT_S3_BUCKET: 'serverless-c4-todo-images-floalx-${self:provider.stage}',
            SIGNED_URL_EXPIRATION: '300',
        },
        logs: {
            restApi: true,
        },
        iam: {
            role: {
                statements: [
                    {
                        Effect: 'Allow',
                        Action: ['xray:PutTelemetryRecords', 'xray:PutTraceSegments'],
                        Resource: '*',
                    },
                ],
            },
        },
    },
    functions: {
        Auth: {
            handler: 'src/lambda/auth/auth0Authorizer.handler',
        },
        GetTodos: {
            handler: 'src/lambda/http/getTodos.handler',
            events: [
                {
                    http: {
                        method: 'get',
                        path: 'todos',
                        cors: true,
                        authorizer: 'Auth',
                    },
                },
            ],
            iamRoleStatementsInherit: true,
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:Query'],
                    Resource:
                        'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}',
                },
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:Query'],
                    Resource:
                        'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}/index/${self:provider.environment.TODOS_CREATED_AT_INDEX}',
                },
            ],
        },
        CreateTodo: {
            handler: 'src/lambda/http/createTodo.handler',
            events: [
                {
                    http: {
                        method: 'post',
                        path: 'todos',
                        cors: true,
                        authorizer: 'Auth',
                        request: {
                            schemas: {
                                'application/json': '${file(models/create-todo-model.json)}',
                            },
                        },
                    },
                },
            ],
            iamRoleStatementsInherit: true,
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:PutItem'],
                    Resource:
                        'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}',
                },
            ],
        },
        UpdateTodo: {
            handler: 'src/lambda/http/updateTodo.handler',
            events: [
                {
                    http: {
                        method: 'patch',
                        path: 'todos/{todoId}',
                        cors: true,
                        authorizer: 'Auth',
                        request: {
                            schemas: {
                                'application/json': '${file(models/update-todo-model.json)}',
                            },
                        },
                    },
                },
            ],
            iamRoleStatementsInherit: true,
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
                    Resource:
                        'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}',
                },
            ],
        },
        DeleteTodo: {
            handler: 'src/lambda/http/deleteTodo.handler',
            events: [
                {
                    http: {
                        method: 'delete',
                        path: 'todos/{todoId}',
                        cors: true,
                        authorizer: 'Auth',
                    },
                },
            ],
            iamRoleStatementsInherit: true,
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:GetItem', 'dynamodb:DeleteItem'],
                    Resource:
                        'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}',
                },
                {
                    Effect: 'Allow',
                    Action: ['s3:DeleteObject'],
                    Resource: 'arn:aws:s3:::${self:provider.environment.ATTACHMENT_S3_BUCKET}/*',
                },
            ],
        },
        GenerateUploadUrl: {
            handler: 'src/lambda/http/generateUploadUrl.handler',
            events: [
                {
                    http: {
                        method: 'post',
                        path: 'todos/{todoId}/attachment',
                        cors: true,
                        authorizer: 'Auth',
                    },
                },
            ],
            iamRoleStatementsInherit: true,
            iamRoleStatements: [
                {
                    Effect: 'Allow',
                    Action: ['dynamodb:GetItem', 'dynamodb:UpdateItem'],
                    Resource:
                        'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.TODOS_TABLE}',
                },
                {
                    Effect: 'Allow',
                    Action: ['s3:PutObject'],
                    Resource: 'arn:aws:s3:::${self:provider.environment.ATTACHMENT_S3_BUCKET}/*',
                },
            ],
        },
    },
    custom: {
        documentation: {
            api: {
                info: {
                    version: 'v1.0.0',
                    title: 'Todo API',
                    descritpion: 'Serverless TODO image application',
                },
            },
            models: [
                {
                    name: 'CreateTodoRequest',
                    description: 'Model for creating a TODO item',
                    contentType: 'application/json',
                    schema: '${file(models/create-todo-model.json)}',
                },
                {
                    name: 'UpdateTodoRequest',
                    description: 'Model for updating a TODO item',
                    contentType: 'application/json',
                    schema: '${file(models/update-todo-model.json)}',
                },
            ],
        },
        esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ['aws-sdk'],
            target: 'node14',
            define: { 'require.resolve': undefined },
            platform: 'node',
            concurrency: 10,
        },
    },
    resources: {
        Resources: {
            GatewayResponseDefault4XX: {
                Type: 'AWS::ApiGateway::GatewayResponse',
                Properties: {
                    ResponseParameters: {
                        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
                        'gatewayresponse.header.Access-Control-Allow-Headers':
                            "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                        'gatewayresponse.header.Access-Control-Allow-Methods': "'GET,OPTIONS,POST'",
                    },
                    ResponseType: 'DEFAULT_4XX',
                    RestApiId: { Ref: 'ApiGatewayRestApi' },
                },
            },
            TodosTable: {
                Type: 'AWS::DynamoDB::Table',
                Properties: {
                    TableName: '${self:provider.environment.TODOS_TABLE}',
                    AttributeDefinitions: [
                        {
                            AttributeName: 'userId',
                            AttributeType: 'S',
                        },
                        {
                            AttributeName: 'todoId',
                            AttributeType: 'S',
                        },
                        {
                            AttributeName: 'createdAt',
                            AttributeType: 'S',
                        },
                    ],
                    KeySchema: [
                        {
                            AttributeName: 'userId',
                            KeyType: 'HASH',
                        },
                        {
                            AttributeName: 'todoId',
                            KeyType: 'RANGE',
                        },
                    ],
                    BillingMode: 'PAY_PER_REQUEST',
                    StreamSpecification: {
                        StreamViewType: 'NEW_IMAGE',
                    },
                    LocalSecondaryIndexes: [
                        {
                            IndexName: '${self:provider.environment.TODOS_CREATED_AT_INDEX}',
                            KeySchema: [
                                {
                                    AttributeName: 'userId',
                                    KeyType: 'HASH',
                                },
                                {
                                    AttributeName: 'createdAt',
                                    KeyType: 'RANGE',
                                },
                            ],
                            Projection: {
                                ProjectionType: 'ALL',
                            },
                        },
                    ],
                },
            },
            AttachmentsBucket: {
                Type: 'AWS::S3::Bucket',
                Properties: {
                    BucketName: '${self:provider.environment.ATTACHMENT_S3_BUCKET}',
                    CorsConfiguration: {
                        CorsRules: [
                            {
                                AllowedOrigins: ['*'],
                                AllowedHeaders: ['*'],
                                AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                                MaxAge: 3000,
                            },
                        ],
                    },
                },
            },
            BucketPolicy: {
                Type: 'AWS::S3::BucketPolicy',
                Properties: {
                    PolicyDocument: {
                        Id: 'MyPolicy',
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Sid: 'PublicReadForGetBucketObjects',
                                Effect: 'Allow',
                                Principal: '*',
                                Action: 's3:GetObject',
                                Resource:
                                    'arn:aws:s3:::${self:provider.environment.ATTACHMENT_S3_BUCKET}/*',
                            },
                        ],
                    },
                    Bucket: { Ref: 'AttachmentsBucket' },
                },
            },
        },
    },
};

module.exports = serverlessConfiguration;
