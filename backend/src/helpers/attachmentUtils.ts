import * as AWS from 'aws-sdk';
// @ts-ignore
import * as AWSXRay from 'aws-xray-sdk';
import { createLogger } from '@utils/logger';

const logger = createLogger('AttachmentUtils');

const XAWS = AWSXRay.captureAWS(AWS);

export class AttachmentUtils {
    constructor(
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION)
    ) {}

    getAttachmentUrl(todoId: string): string {
        logger.info(`Getting attachement URL for Todo with id '${todoId}'`);
        return `https://${this.bucketName}.s3.amazonaws.com/${todoId}`;
    }

    async generateUploadUrl(todoId: string): Promise<string> {
        logger.info(`Generating upload URL for Todo with id '${todoId}'`);
        return this.s3.getSignedUrl('putObject', {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: this.urlExpiration,
        });
    }

    async removeAttachment(todoId: string) {
        logger.info(`Removing attachement image for Todo with id '${todoId}'`);
        return this.s3.deleteObject({
            Bucket: this.bucketName,
            Key: todoId,
        });
    }
}
