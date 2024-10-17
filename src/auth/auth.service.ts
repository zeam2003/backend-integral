
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
        const url = `${this.apiUrl}/initSession`;

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

    // Nuevo método para obtener la información del perfil sesion con Bearer Token
    async getUserInfo(sessionToken: string): Promise<AxiosResponse> {
        
        const url = `${this.apiUrl}/getMyProfiles`; // Endpoint de GLPI para obtener la información del usuario
        
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
     //console.log(response.data['glpiID']);
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

    //const ticketData =await {...createTicketDto};
    //const ticketData = JSON.parse(JSON.stringify(createTicketDto));
    const ticketData = Object.assign({}, createTicketDto);
    
  
     // Construir el payload

    const payload = {
      "input": [
        {
          "name": ticketData.name ,                            // Título del ticket
          "content": ticketData.content,                      // Descripción
          "status": ticketData.status,                        // Estado
          "type": ticketData.type,                            // Tipo
          "urgency": ticketData.urgency,                      // Urgencia
          "impact": ticketData.impact,                        // Impacto
          "priority": ticketData.priority,                    // Prioridad
          "requesttypes_id": ticketData.requesttypes_id,      // Origen de las solicitudes
          "itilcategories_id": ticketData.itilcategories_id,  // Categoría
          "_users_id_requester": ticketData._users_id_requester ?? [79], // Solicitante
          "_groups_id_assign": ticketData._groups_id_assign ?? [1],  // Grupo asignado
          "_users_id_assign": ticketData._users_id_assign ?? [79],    // Técnico asignado
          "entities_id": ticketData.entities_id,              // Entidad de GLPI
          "locations_id": ticketData.locations_id,            // Ubicación
          "slas_id_ttr": ticketData.slas_id_ttr               // SLA (Tiempo para resolver)
        }
      ]
    };
    
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, createTicketDto, {
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
