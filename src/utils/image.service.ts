import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageService {
    private readonly uploadPath = 'assets/images/checks';

    constructor() {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    async saveImage(file: Express.Multer.File): Promise<{ imageName: string, imageUrl: string }> {
        // Generamos un nombre único usando UUID y timestamp
        const uniqueName = `${uuidv4()}.jpg`;
        const savePath = path.join(this.uploadPath, uniqueName);

        await sharp(file.buffer)
            .resize(800)
            .jpeg({ quality: 80 })
            .toFile(savePath);

        return {
            imageName: uniqueName,
            imageUrl: `/images/checks/${uniqueName}`
        };
    }
}