import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Check, CheckStatus, CheckType } from '../database/schemas/check.schema';
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
        try {
            // Validar que el tipo sea válido
            if (!Object.values(CheckType).includes(createCheckDto.type as CheckType)) {
                throw new HttpException(
                    `Tipo de check inválido: ${createCheckDto.type}. Tipos válidos: ${Object.values(CheckType).join(', ')}`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const existingCheck = await this.checkModel.findOne({ 
                ticketId: createCheckDto.ticketId,
                stage: createCheckDto.stage 
            });

            if (existingCheck) {
                throw new HttpException(
                    `Ya existe un check para el ticket ${createCheckDto.ticketId} en la etapa ${createCheckDto.stage}`,
                    HttpStatus.CONFLICT
                );
            }

            // Obtener el último checkId
            const lastCheck = await this.checkModel.findOne().sort({ checkId: -1 });
            const nextCheckId = lastCheck ? lastCheck.checkId + 1 : 1;

            const createdCheck = new this.checkModel({
                ...createCheckDto,
                checkId: nextCheckId,
                createdBy: userId,
                modifiedBy: userId,
                status: createCheckDto.status || CheckStatus.EN_CURSO
            });

            const savedCheck = await createdCheck.save();
            console.log('Check creado exitosamente:', savedCheck);
            return savedCheck;
        } catch (error) {
            console.error('Error detallado al crear check:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                `Error al crear el check: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async addCheckDetailsWithImages(checkId: string, createCheckDetailsDto: CreateCheckDetailDto[], files: Express.Multer.File[]) {
        try {
            const check = await this.checkModel.findOne({ checkId: Number(checkId) });
            if (!check) {
                throw new HttpException('Check no encontrado', HttpStatus.NOT_FOUND);
            }

            const details = await Promise.all(
                createCheckDetailsDto.map(async (detail, index) => {
                    const existingDetail = await this.checkDetailModel.findOne({
                        checkId: Number(checkId),
                        componentType: detail.componentType
                    });

                    if (existingDetail) {
                        throw new HttpException(
                            `Ya existe un detalle para el componente ${detail.componentType}`,
                            HttpStatus.CONFLICT
                        );
                    }

                    const file = files[index];
                    let imageData = {};
                    
                    if (file) {
                        try {
                            imageData = await this.imageService.saveImage(file);
                        } catch (error) {
                            console.error(`Error al procesar imagen para ${detail.componentType}:`, error);
                            throw new HttpException(
                                `Error al procesar la imagen para ${detail.componentType}`,
                                HttpStatus.INTERNAL_SERVER_ERROR
                            );
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
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                'Error al agregar detalles al check',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
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