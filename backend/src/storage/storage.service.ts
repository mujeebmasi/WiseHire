import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import type { Readable } from 'stream';

// Everything that touches a stored file goes through this one service, so the
// rest of the app never needs to know where resumes actually live.
//
// "S3" here means the protocol, not the company. Amazon published the API and
// other providers implemented it, so the same client works against Amazon S3,
// Backblaze B2, Cloudflare R2 and others. That is why these settings are named
// S3_* rather than after whichever provider is behind them today.
@Injectable()
export class StorageService {
  private bucket = process.env.S3_BUCKET as string;

  private client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_KEY_ID as string,
      secretAccessKey: process.env.S3_KEY_SECRET as string,
    },
    // Amazon S3 is the default. Other providers (Backblaze B2, Cloudflare R2)
    // speak the same API at a different address, so setting S3_ENDPOINT is all
    // it takes to point this at one of them instead.
    //
    // forcePathStyle puts the bucket in the path (endpoint/bucket/key) rather
    // than in the hostname (bucket.endpoint/key), which those providers expect.
    ...(process.env.S3_ENDPOINT
      ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
  });

  // Uploads the file and returns the "key" we store in the database.
  // The key is just the file's address inside the bucket.
  async saveResume(userId: string, file: Express.Multer.File) {
    // A random name means one user cannot overwrite another user's file, and
    // nobody can guess a filename. The user id keeps files grouped per person.
    const key = `resumes/${userId}/${randomUUID()}.pdf`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  // Opens a stored file for reading. The controller pipes this to the browser,
  // but only after checking the person is allowed to see it - the bucket
  // itself is private and never served directly to anyone.
  async readResume(key: string) {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    return result.Body as Readable;
  }
}
