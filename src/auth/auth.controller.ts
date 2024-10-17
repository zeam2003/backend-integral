import { Body, Controller, Get, Post, Headers, HttpException, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {};

    // login
    @Post('login')
        async login(@Body('username') username: string, @Body('password') password: string){
            return await this.authService.login(username, password);
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

    
}
