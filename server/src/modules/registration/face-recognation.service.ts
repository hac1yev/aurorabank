import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';

import * as faceapi from '@vladmandic/face-api';
import * as canvas from 'canvas';
import { join } from 'path';

@Injectable()
export class FaceRecognationService implements OnModuleInit {
  async onModuleInit() {
    faceapi.env.monkeyPatch({
      Canvas: canvas.Canvas as unknown as typeof HTMLCanvasElement,
      Image: canvas.Image as unknown as typeof HTMLImageElement,
      ImageData: canvas.ImageData as unknown as typeof ImageData,
    });

    const modelPath = join(process.cwd(), 'models');

    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
  }

  async compareFaces(
    passportBuffer: Buffer,
    selfieBuffer: Buffer,
  ): Promise<{ distance: number; matched: boolean }> {
    const passportImage = await canvas.loadImage(passportBuffer);
    const selfieImage = await canvas.loadImage(selfieBuffer);

    const options = new faceapi.SsdMobilenetv1Options({
      minConfidence: 0.5,
    });

    const passportResult = await faceapi
      .detectSingleFace(passportImage as unknown as HTMLImageElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const selfieResult = await faceapi
      .detectSingleFace(selfieImage as unknown as HTMLImageElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!passportResult || !selfieResult) {
      throw new InternalServerErrorException(
        'Could not detect a face in both images',
      );
    }

    const distance = faceapi.euclideanDistance(
      passportResult.descriptor,
      selfieResult.descriptor,
    );

    console.log({
      distance,
      passportDetectionScore: passportResult.detection.score,
      selfieDetectionScore: selfieResult.detection.score,
      passportImageSize: {
        width: passportImage.width,
        height: passportImage.height,
      },
      selfieImageSize: {
        width: selfieImage.width,
        height: selfieImage.height,
      },
    });

    return {
      distance,
      matched: distance < 0.6,
    };
  }
}
