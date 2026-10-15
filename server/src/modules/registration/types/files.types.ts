export interface UploadedFileLike {
  size: number;
  originalname?: string;
  mimetype?: string;
  buffer?: Buffer;
  data?: string | Buffer;
}
