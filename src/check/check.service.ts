import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Check } from '../database/schemas/check.schema';
import { CheckDetail } from '../database/schemas/check-detail.schema';
import { CreateCheckDto } from '../dto/create_check.dto';
import { CreateCheckDetailDto } from '../dto/create_check_detail.dto';
import { ImageService } from '../utils/image.service';
import { Express } from 'express';

@Injectable()
export class CheckService {
    constructor(
        @InjectModel(Check.name) private checkModel: Model<Check>,
        @InjectModel(CheckDetail.name) private checkDetailModel: Model<CheckDetail>,
        private imageService: ImageService
    ) {}

    async createCheck(createCheckDto: CreateCheckDto, userId: number) {
        const createdCheck = new this.checkModel({
            ...createCheckDto,
            createdBy: userId,
            modifiedBy: userId
        });
        return await createdCheck.save();
    }

    async addCheckDetails(checkId: string, createCheckDetailsDto: CreateCheckDetailDto[]) {
        const details = await Promise.all(
            createCheckDetailsDto.map(detail => {
                const createdDetail = new this.checkDetailModel({
                    checkId: Number(checkId),  // Convertir a número
                    ...detail
                });
                return createdDetail.save();
            })
        );
        return details;
    }

    async addCheckDetailsWithImages(checkId: string, createCheckDetailsDto: CreateCheckDetailDto[], files: Express.Multer.File[]) {
        const details = await Promise.all(
            createCheckDetailsDto.map(async (detail, index) => {
                // Tomamos la imagen en el mismo orden que los detalles
                const file = files[index];
                let imageData = {};
                
                if (file) {
                    try {
                        imageData = await this.imageService.saveImage(file);
                        console.log(`Imagen procesada para ${detail.componentType}:`, imageData);
                    } catch (error) {
                        console.error(`Error procesando imagen para ${detail.componentType}:`, error);
                    }
                }
    
                const createdDetail = new this.checkDetailModel({
                    checkId: Number(checkId),
                    ...detail,
                    ...imageData
                });
                return createdDetail.save();
            })
        );
        return details;
    }

    async getCheckById(checkId: string) {
        const check = await this.checkModel.findOne({ checkId: Number(checkId) });
        if (!check) {
            throw new HttpException('Check not found', HttpStatus.NOT_FOUND);
        }
        const details = await this.checkDetailModel.find({ checkId: Number(checkId) });
        return { 
            check,
            details 
        };
    }

    async getChecksByTicketId(ticketId: number) {
        const checks = await this.checkModel.find({ ticketId });
        const checksWithDetails = await Promise.all(
            checks.map(async (check) => {
                const details = await this.checkDetailModel.find({ checkId: check.checkId });
                return {
                    check,
                    details
                };
            })
        );
        return checksWithDetails;
    }

    async getChecksByCreatedBy(userId: number) {
        const checks = await this.checkModel.find({ createdBy: userId });
        const checksWithDetails = await Promise.all(
            checks.map(async (check) => {
                const details = await this.checkDetailModel.find({ checkId: check.checkId });
                return {
                    check,
                    details
                };
            })
        );
        return checksWithDetails;
    }

    async updateCheckStatus(checkId: string, status: string, userId: number) {
        return await this.checkModel.findOneAndUpdate(
            { checkId: Number(checkId) },
            { 
                status,
                modifiedBy: userId
            },
            { new: true }
        );
    }

    async updateCheckDetail(checkId: number, componentType: string, updateData: Partial<CreateCheckDetailDto>) {
        const detail = await this.checkDetailModel.findOneAndUpdate(
            { 
                checkId,
                componentType 
            },
            { 
                ...updateData
            },
            { new: true }
        );
    
        if (!detail) {
            throw new HttpException('Check detail not found', HttpStatus.NOT_FOUND);
        }
    
        return detail;
    }

    async updateMultipleCheckDetails(checkId: number, updateDetailsDto: CreateCheckDetailDto[]) {
        const updatedDetails = await Promise.all(
            updateDetailsDto.map(async (detail) => {
                const updated = await this.checkDetailModel.findOneAndUpdate(
                    { 
                        checkId,
                        componentType: detail.componentType 
                    },
                    { 
                        status: detail.status,
                        comments: detail.comments
                    },
                    { new: true }
                );
    
                if (!updated) {
                    throw new HttpException(`Detail not found for component: ${detail.componentType}`, HttpStatus.NOT_FOUND);
                }
    
                return updated;
            })
        );
    
        return updatedDetails;
    }

    async updateCheckDetailImage(checkId: number, componentType: string, file: Express.Multer.File) {
        const { imageName, imageUrl } = await this.imageService.saveImage(file);
        
        const updatedDetail = await this.checkDetailModel.findOneAndUpdate(
            { 
                checkId,
                componentType 
            },
            { 
                imageUrl,
                imageName
            },
            { new: true }
        );
    
        if (!updatedDetail) {
            throw new HttpException('Check detail not found', HttpStatus.NOT_FOUND);
        }
    
        return updatedDetail;
    }
}