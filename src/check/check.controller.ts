import { Controller, Post, Get, Put, Body, Param, Headers, HttpException, HttpStatus, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { CheckService } from './check.service';
import { CreateCheckDto } from '../dto/create_check.dto';
import { CreateCheckDetailDto } from '../dto/create_check_detail.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('checks')
@Controller('checks')
export class CheckController {
    constructor(private readonly checkService: CheckService) {}

    @Post()
    @ApiOperation({ summary: 'Crear nuevo check' })
    @ApiResponse({ status: 201, description: 'Check creado exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 409, description: 'El check ya existe' })
    @ApiBearerAuth()
    async createCheck(
        @Headers('Authorization') authHeader: string,
        @Body() createCheckDto: CreateCheckDto
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        try {
            console.log('DTO recibido:', createCheckDto);
            const check = await this.checkService.createCheck(createCheckDto, createCheckDto.glpiID);
            return {
                message: 'Check creado exitosamente',
                data: check
            };
        } catch (error) {
            console.error('Error detallado:', error);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                `Error al crear el check: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post(':checkId/details')
    @ApiOperation({ summary: 'Agregar múltiples detalles a un check' })
    @ApiResponse({ status: 201, description: 'Detalles agregados exitosamente' })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 404, description: 'Check no encontrado' })
    @ApiBearerAuth()
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'images', maxCount: 10 }
    ]))
    async addCheckDetails(
        @Headers('Authorization') authHeader: string,
        @Param('checkId') checkId: string,
        @Body('details') details: string,
        @UploadedFiles() files: { images?: Express.Multer.File[] }
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        try {
            const createCheckDetailsDto = JSON.parse(details);
            const savedDetails = await this.checkService.addCheckDetailsWithImages(
                checkId, 
                createCheckDetailsDto, 
                files?.images || []
            );
            return {
                message: 'Detalles agregados exitosamente',
                data: savedDetails
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            if (error instanceof SyntaxError) {
                throw new HttpException('Formato JSON inválido', HttpStatus.BAD_REQUEST);
            }
            throw new HttpException(
                'Error al agregar detalles al check',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('ticket/:ticketId')
    @ApiOperation({ summary: 'Obtener checks por ID de ticket' })
    @ApiBearerAuth()
    async getChecksByTicketId(
        @Headers('Authorization') authHeader: string,
        @Param('ticketId') ticketId: number
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        return await this.checkService.getChecksByTicketId(ticketId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener check por ID' })
    @ApiBearerAuth()
    async getCheckById(
        @Headers('Authorization') authHeader: string,
        @Param('id') checkId: string
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        return await this.checkService.getCheckById(checkId);
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Actualizar estado del check' })
    @ApiResponse({ status: 200, description: 'Estado del check actualizado exitosamente' })
    @ApiResponse({ status: 400, description: 'Estado inválido' })
    @ApiResponse({ status: 404, description: 'Check no encontrado' })
    @ApiBearerAuth()
    async updateCheckStatus(
        @Headers('Authorization') authHeader: string,
        @Param('id') checkId: string,
        @Body('status') status: string,
        @Body('userId') userId: number
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }

        // Validar que el estado sea válido
        const validStates = ['en_curso', 'en_espera', 'finalizado'];
        if (!validStates.includes(status)) {
            throw new HttpException(
                `Estado inválido. Los estados válidos son: ${validStates.join(', ')}`,
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            const updatedCheck = await this.checkService.updateCheckStatus(checkId, status, userId);
            if (!updatedCheck) {
                throw new HttpException('Check no encontrado', HttpStatus.NOT_FOUND);
            }
            return {
                message: 'Estado del check actualizado exitosamente',
                data: updatedCheck
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                'Error al actualizar el estado del check',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':checkId/details/:componentType')
    @ApiOperation({ summary: 'Actualizar detalle específico de un check' })
    @ApiBearerAuth()
    async updateCheckDetail(
        @Headers('Authorization') authHeader: string,
        @Param('checkId') checkId: string,
        @Param('componentType') componentType: string,
        @Body() updateData: CreateCheckDetailDto
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        return await this.checkService.updateCheckDetail(Number(checkId), componentType, updateData);
    }

    @Put(':checkId/details')
    @ApiOperation({ summary: 'Actualizar múltiples detalles de un check' })
    @ApiBearerAuth()
    async updateMultipleCheckDetails(
        @Headers('Authorization') authHeader: string,
        @Param('checkId') checkId: string,
        @Body() updateDetailsDto: CreateCheckDetailDto[]
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        return await this.checkService.updateMultipleCheckDetails(Number(checkId), updateDetailsDto);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Obtener checks por ID del usuario que los creó' })
    @ApiBearerAuth()
    async getChecksByCreatedBy(
        @Headers('Authorization') authHeader: string,
        @Param('userId') userId: number
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        return await this.checkService.getChecksByCreatedBy(userId);
    }

    @Put(':checkId/details/:componentType/image')
    @ApiOperation({ summary: 'Agregar o actualizar imagen de un detalle' })
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image'))
    async updateCheckDetailImage(
        @Headers('Authorization') authHeader: string,
        @Param('checkId') checkId: string,
        @Param('componentType') componentType: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        return await this.checkService.updateCheckDetailImage(Number(checkId), componentType, file);
    }
}