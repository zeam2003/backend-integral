import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
    private readonly apiUrl = process.env.API_URL; // URL de la API de GLPI
    private readonly appToken = process.env.GLPI_APP_TOKEN; //App Token del GLPI Services

    constructor(private readonly httpService: HttpService) {}

    // Autenticar usuario

    async login(username: string, password: string): Promise<AxiosResponse>{
        const url = `${this.apiUrl}initSession`;

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    url,
                    {},
                    {
                        headers: {
                            'App-Token': this.appToken,
                            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
                            "Content-Type" : "application/json"
                        }
                    }
                )
            );
            
            return response.data;
        } catch (error) {
            throw new HttpException('Login Failed', HttpStatus.UNAUTHORIZED);
        }
    }

    // Nuevo método para obtener la información de la sesion con Bearer Token
    async getUserInfo(sessionToken: string): Promise<AxiosResponse> {
        
        const url = `${this.apiUrl}getMyProfiles`; // Endpoint de GLPI para obtener la información del usuario
        
        try {
          const response = await firstValueFrom(
            this.httpService.get(url, {
              headers: {
                'App-Token': this.appToken,
                //'Authorization': `Bearer ${sessionToken}`, // Usar Bearer Token en lugar de Session-Token
                'Session-Token': sessionToken,
                
              },
            }),
          );
          return response.data; // Retornar la información del usuario
        } catch (error) {
          console.error('Error fetching user info:', error.response ? error.response.data : error.message); // Log del error
          throw new HttpException('Failed to fetch user info', HttpStatus.UNAUTHORIZED);
        }
      
    
    }


   // Método para obtener información completa de la sesión
  async getFullSession(sessionToken: string): Promise<AxiosResponse> {
    const url = `${this.apiUrl}/getFullSession`; // Endpoint para obtener la sesión completa

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'App-Token': this.appToken,
            //'Authorization': `Bearer ${sessionToken}`, // Usar el Bearer Token
            'Session-Token': sessionToken,
          },
        }),
      );
      return response.data; // Retornar la información del usuario logueado
    } catch (error) {
      console.error('Error fetching full session info:', error.response ? error.response.data : error.message);
      throw new HttpException('Failed to fetch session info', HttpStatus.UNAUTHORIZED);
    }
  }


   // Método para crear un ticket
   async createTicket(sessionToken: string, createTicketDto: any): Promise<AxiosResponse> {
    const url = `${this.apiUrl}/Ticket`;
    

   
    console.log('campos DTO', createTicketDto);
    
    console.log(createTicketDto._users_id_assign);
     // Construir el payload
    const payload = {
      "input": [
        {
          name: createTicketDto.name,                            // Título del ticket
          content: createTicketDto.content,                      // Descripción
          status: createTicketDto.status,                        // Estado
          type: createTicketDto.type,                            // Tipo
          urgency: createTicketDto.urgency,                      // Urgencia
          impact: createTicketDto.impact,                        // Impacto
          priority: createTicketDto.priority,                    // Prioridad
          requesttypes_id: createTicketDto.requesttypes_id,      // Origen de las solicitudes
          itilcategories_id: createTicketDto.itilcategories_id,  // Categoría
          _users_id_requester: createTicketDto._users_id_requester, // Solicitante
          _groups_id_assign: createTicketDto._groups_id_assign,  // Grupo asignado
          _users_id_assign: createTicketDto._users_id_assign,    // Técnico asignado
          entities_id: createTicketDto.entities_id,              // Entidad de GLPI
          locations_id: createTicketDto.locations_id,            // Ubicación
          slas_id_ttr: createTicketDto.slas_id_ttr               // SLA (Tiempo para resolver)
        }
      ]
    };

    console.log('payload', payload);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'App-Token': this.appToken,
            //'Authorization': `Bearer ${sessionToken}`,
            'Session-Token': sessionToken,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data; // Retornar la respuesta de la API de GLPI
    } catch (error) {
      console.error('Error creating ticket:', error.response ? error.response.data : error.message);
      throw new HttpException('Failed to create ticket', HttpStatus.BAD_REQUEST);
    }
  }

}
