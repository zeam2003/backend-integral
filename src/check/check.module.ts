import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckController } from './check.controller';
import { CheckService } from './check.service';
import { Check, CheckSchema } from '../database/schemas/check.schema';
import { CheckDetail, CheckDetailSchema } from '../database/schemas/check-detail.schema';
import { ImageService } from '../utils/image.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Check.name, schema: CheckSchema },
            { name: CheckDetail.name, schema: CheckDetailSchema }
        ])
    ],
    controllers: [CheckController],
    providers: [CheckService, ImageService]
})
export class CheckModule {}