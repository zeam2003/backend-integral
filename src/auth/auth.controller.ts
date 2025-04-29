import { Body, Controller, Get, Post, Headers, HttpException, HttpStatus, UsePipes, ValidationPipe, Param, Query, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AddTicketNoteDto } from 'src/dto/add_ticket_note.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from 'src/dto/login.dto';

@ApiTags('authenticación')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {};

    // login
    //Para Swagger
    @ApiOperation({
        summary: 'Iniciar sesión',})
    @ApiResponse({
        status: 201,
        description: 'Inicio de sesión exitoso',
        type: String,
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciales inválidas',
    })
    @Post('login')
        async login(@Body() loginDto: LoginDto ){
            return await this.authService.login(loginDto.username, loginDto.password);
        }
    
    //Userinfo
    @Get('user-info')
    async getUserInfo(@Headers('Authorization') authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
         throw new HttpException('Authorization header missing or invalid', HttpStatus.UNAUTHORIZED);
    }

        const token = authHeader.split(' ')[1]; // Extraer el token
        return await this.authService.getUserInfo(token); // Aquí 'token' es el Bearer Token
    }

    // Endpoint para obtener información completa del usuario logueado
    @Get('user-details')
    async getUserDetails(@Headers('Authorization') authHeader: string) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException('Authorization header missing or invalid', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1]; // Extraer el token
        const userDetails =  await this.authService.getFullSession(token); // Llamar a getFullSession

        console.log(userDetails.data);
        return userDetails;
    }

    // Endpoint para traer la info de un usuario por su ID, nos sirve para traer la imagen de perfil
    @Get('user-by-id')
    async getUserById(
        @Headers('Authorization') sessionToken: string,
        @Query('id') id: string,
        ) {
        if(!sessionToken) {
            throw new HttpException('Session Token is missing or invalid', HttpStatus.UNAUTHORIZED);
        }
        console.log(sessionToken)
       
        
        const userId = await this.authService.getUserById(Number(id), sessionToken);
       
        return {userId};
    }


     // Endpoint para crear un nuevo ticket
    @Post('create-ticket')
    @UsePipes(new ValidationPipe({ transform: true}))
    async createTicket(
        @Headers('Authorization') authHeader: string,
        @Body() createTicketDto: {
            name: string;                      // Título del ticket
            content: string;                   // Descripción del ticket
            status: number;                    // Estado del ticket
            type: number;                      // Tipo de ticket (incidente, solicitud)
            urgency: number;                   // Urgencia
            impact: number;                    // Impacto
            priority: number;                  // Prioridad
            requesttypes_id: number;           // Origen de las solicitudes
            itilcategories_id: number;         // Categoría del ticket
            _users_id_requester: [number];     // En un arreglo especificar el solicitante
            _groups_id_assign: [number];       // En un arreglo especificar los grupos asignados
            _users_id_assign: [number];        // En un arreglo especificar los técnicos asignados
            entities_id: number;               // Entidad de GLPI
            locations_id: number;              // Ubicación
            slas_id_ttr: number;               // SLA (Tiempo en minutos u horas)
        }
        
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpException('Authorization header missing or invalid', HttpStatus.UNAUTHORIZED);
        }
        console.log('Datos validados y transformados:', JSON.stringify(createTicketDto));  // Verifica que los datos están validados y transformados correctamente
        const token = authHeader.split(' ')[1]; // Extraer el token de sesión
        
        return await this.authService.createTicket(token, createTicketDto); // Llamar al servicio para crear el ticket
    }

    // Obtenes todos los tickets de un usuario
    @Get('my-tickets')
    async getMyTickets(
        @Headers('Authorization')
        authHeader: string,
        @Query('userId') userId: number,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
    ) {
        if (!authHeader ||!authHeader.startsWith('Bearer ')) {
            throw new HttpException('Authorization header missing or invalid', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        return await this.authService.getMyTickets(token, userId, page, limit, startDate, endDate);
    }

    //Obtenes un ticket por el ID

    @Get('tickets/:id')
    async getTicketById(
        @Headers('Authorization') authHeader: string,
        @Param('id') ticketId: number,
    ) {
        if (!authHeader ||!authHeader.startsWith('Bearer ')) {
            throw new HttpException('Authorization header missing or invalid', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        console.log(ticketId);
        return await this.authService.getTicketById(token, ticketId);
    }    

    //Actualizar ticket y subir imagen optativo
    @Post('tickets/:id/note')
    @UseInterceptors(FilesInterceptor('files', 10, {  // Cambiado a FilesInterceptor, máximo 10 archivos
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB por archivo
        },
        fileFilter: (req, file, cb) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
                cb(null, true);
            } else {
                cb(new HttpException('Formato de archivo no soportado', HttpStatus.BAD_REQUEST), false);
            }
        }
    }))
    async addTiketNote(
        @Headers('Authorization') authHeader: string,
        @Param('id') ticketId: number,
        @Body() noteData: AddTicketNoteDto,
        @UploadedFiles() files?: Express.Multer.File[],  // Cambiado a UploadedFiles
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Authorization header missing or invalid', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        return await this.authService.addTicketNote(token, ticketId, noteData, files);
    }

    // Verificar si un ticket existe
    @ApiOperation({
        summary: 'Verificar existencia de ticket',
        description: 'Verifica si un ticket existe en el sistema'
    })
    @ApiResponse({
        status: 200,
        description: 'Retorna si el ticket existe o no',
        schema: {
            type: 'object',
            properties: {
                existe: {
                    type: 'boolean',
                    example: true,
                    description: 'Indica si el ticket existe'
                }
            }
        }
    })
    @ApiResponse({
        status: 401,
        description: 'No autorizado - Token inválido o faltante'
    })
    @ApiBearerAuth() // Agregamos esta decoración para indicar que requiere autenticación
    @Get('tickets/verificar/:id')
    async verificarTicket(
        @Headers('Authorization') authHeader: string,
        @Param('id') ticketId: number
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }

        const token = authHeader.split(' ')[1];
        return await this.authService.verificarTicket(token, ticketId);
    }

    @Get('activo/buscar')
    @ApiOperation({ summary: 'Buscar activo por número de inventario' })
    @ApiResponse({
        status: 200,
        description: 'Activo encontrado exitosamente'
    })
    @ApiResponse({
        status: 404,
        description: 'Activo no encontrado'
    })
    @ApiBearerAuth()
    async buscarActivoPorInventario(
        @Headers('Authorization') authHeader: string,
        @Query('numeroInventario') numeroInventario: string
    ) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new HttpException('Token de autorización faltante o inválido', HttpStatus.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        return await this.authService.buscarActivoPorInventario(token, numeroInventario);
    }
}
