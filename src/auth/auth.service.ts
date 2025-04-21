
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from './interfaces/auth.interface';
import * as sharp from 'sharp';
import {PDFDocument} from 'pdf-lib';
import { AddTicketNoteDto } from 'src/dto/add_ticket_note.dto';

@Injectable()
export class AuthService {
    private readonly apiUrl = process.env.API_URL; // URL de la API de GLPI
    private readonly appToken = process.env.GLPI_APP_TOKEN; //App Token del GLPI Services

    constructor(private readonly httpService: HttpService) {}

    // Autenticar usuario

    async login(username: string, password: string): Promise<AxiosResponse>{
      console.log('recibiendo login', password, username);
        const url = `${this.apiUrl}/initSession`;

        try {
            const loginResponse = await firstValueFrom(
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
            
            //console.log(response.data['session_token']);
            //const papirulo = await this.getFullSession(response.data['session_token'])
            //console.log(papirulo.data['glpifriendlyname']);
            const sessionToken = loginResponse.data['session_token'];
            const userInfo  = await this.getFullSession(sessionToken);
           
           
            const fullResponse = {
              session_token: sessionToken,
              ...userInfo
            }
            console.log('respuesta completa: ', fullResponse);
            return fullResponse;
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
    async getFullSession(sessionToken: string): Promise<any> {
      const url = `${this.apiUrl}/getFullSession`; // Endpoint para obtener la sesión completa

      try {
        const response: AxiosResponse<ApiResponse> = await firstValueFrom(
          this.httpService.get(url, {
            headers: {
              'App-Token': this.appToken,
              'Session-Token': sessionToken,
            }
          })
        )
        
      const {
        valid_id,
        glpi_currenttime,
        glpi_use_mode,
        glpiID,
        glpifriendlyname,
        glpiname,
        glpirealname,
        glpifirstname,
        glpiactiveprofile
              
      } = response.data.session;

        const {name} = glpiactiveprofile;
        
        
        return{
          valid_id,
          glpi_currenttime,
          glpi_use_mode,
          glpiID,
          glpifriendlyname,
          glpiname,
          glpirealname,
          glpifirstname,
          glpiactiveprofile: {
            name
          },
          name
          
        }
        
      } catch (error) {
        console.log(error);
        //console.error('Error fetching full session info:', error.response ? error.response.data : error.message);
        throw new HttpException('Failed to fetch session info', HttpStatus.UNAUTHORIZED);
      }
    }


    // Metodo para traer la url de la imagen 
    async getUserById(userId: number, sessionToken:string): Promise<any> {
      const url = `${this.apiUrl}User/${userId}`;
      console.log(sessionToken)
      try {
        const response: AxiosResponse<any> = await firstValueFrom(
          this.httpService.get(url, {
            headers: {
              'App-Token': this.appToken,
              'Session-Token': sessionToken,
              //'Authorization': `Bearer ${sessionToken}`,
            },
            
          }),
        );
        return response.data;
      } catch (error) {
        console.error('Error al obtener usuario:', error);
        throw new Error('No se pudo obtener la información del usuario.');
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

  // Traemos todos los tickets
  async getMyTickets(
      sessionToken: string, 
      userId: number, 
      page:number, 
      limit: number = 10, 
      startDate?: string, 
      endDate?: string): Promise<any>{
    const url = `${this.apiUrl}/Ticket`;
    const start = Math.floor(Math.max(0, (page - 1) * limit));
    const end = Math.floor(start + limit - 1);
    console.log(`${startDate} ${endDate}`)
    try {

      // Get total count first
      const countResponse = await firstValueFrom(
        this.httpService.get(`${url}`, {  // Changed from ${url}/count
          headers: {
            'App-Token': this.appToken,
            'Session-Token': sessionToken,
            'Content-Type': 'application/json',
          },
          params: {
            'is_deleted': 0,
            'criteria[0][link]': 'AND',
            'criteria[0][field]': '_users_id_assign',
            'criteria[0][searchtype]': 'equals',
            'criteria[0][value]': userId,
            ...(startDate && {
              'criteria[1][link]': 'AND',
              'criteria[1][field]': 'date_mod',
              'criteria[1][searchtype]': 'greater',
              'criteria[1][value]': `${startDate} 00:00:00`
            }),
            ...(endDate && {
              'criteria[2][link]': 'AND',
              'criteria[2][field]': 'date_mod',
              'criteria[2][searchtype]': 'less',
              'criteria[2][value]': `${endDate} 23:59:59`
            }),
            'only_count': true  // Added to get only the count
          }
        })
      );


     
      // Get tickets with pagination
      const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'App-Token': this.appToken,
          'Session-Token': sessionToken,
          'Content-Type': 'application/json',
          'Range': `${start}-${end}`,
        },
        params: {
          'is_deleted': 0,
          'criteria[0][link]': 'AND',
          'criteria[0][field]': '_users_id_assign',
          'criteria[0][searchtype]': 'equals',
          'criteria[0][value]': userId,
          ...(startDate && {
            'criteria[1][link]': 'AND',
            'criteria[1][field]': 'date_mod',
            'criteria[1][searchtype]': 'greater',
            'criteria[1][value]': `${startDate} 00:00:00`
          }),
          ...(endDate && {
            'criteria[2][link]': 'AND',
            'criteria[2][field]': 'date_mod',
            'criteria[2][searchtype]': 'less',
            'criteria[2][value]': `${endDate} 23:59:59`
          }),
          'sort': 'date_mod',
          'order': 'DESC',
          'expand_dropdowns': true,
          'get_hateoas': false
        }
      }),
    );

    return {
      tickets: response.data,
      paginacion: {
        paginaActual: parseInt(page.toString()) || 1,  // Removed Number() conversion
        elementosPorPagina: parseInt(limit.toString()),  // Removed Number() conversion
        total: Array.isArray(countResponse.data) ? countResponse.data.length : 0  // Changed how we get the count
      }
    };
    } catch (error) {
      console.error('Error al obtener tickets:', error.response?.data || error);
      throw new HttpException('Error al obtener tickets', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //Obetener ticket por ID
  
  async getTicketById(sessionToken: string, ticketId: number): Promise<any>
  {
    const url = `${this.apiUrl}/Ticket/${ticketId}`;
    console.log(ticketId);
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'App-Token': this.appToken,
            'Session-Token': sessionToken,
            'Content-Type': 'application/json',
          },
          params: {
            'expand_dropdowns': true,
            'with_problems': true,
            'with_tickets': true,
            'with_items': true,
            'with_documents': true
          }
        }),
      );
      return response.data;
    } catch (error) {
      
      console.error('Error al obtener el ticket:', error.response?.data || error);
      throw new HttpException(
          'Error al obtener el ticket', 
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }async compressFile(file: Express.Multer.File): Promise<Buffer> {
    try {
        if (file.mimetype.startsWith('image/')) {
            return await sharp(file.buffer)
                .resize(1024, 1024, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();
        }
        
        if (file.mimetype === 'application/pdf') {
          const pdfDoc = await PDFDocument.load(file.buffer);
          const pdfBytes = await pdfDoc.save({
              useObjectStreams: true,
              objectsPerTick: 20,
          });
          return Buffer.from(pdfBytes);
      }
      
      return file.buffer;
    } catch (error) {
        console.error('Error comprimiendo archivo:', error);
        return file.buffer;
    }
}

// Modificar el método addTicketNote
async addTicketNote(
    sessionToken: string, 
    ticketId: number, 
    noteData: AddTicketNoteDto, 
    files?: Express.Multer.File[]
): Promise<any> {
    const url = `${this.apiUrl}/Ticket/${ticketId}/TicketTask`;
    
    try {
        const taskResponse = await firstValueFrom(
            this.httpService.post(url, {
                input: [{
                    tickets_id: ticketId,
                    content: noteData.content,
                    is_private: 0,
                    actiontime: 0,
                    users_id_tech: 0,
                    groups_id_tech: 0
                }]
            }, {
                headers: {
                    'App-Token': this.appToken,
                    'Session-Token': sessionToken,
                    'Content-Type': 'application/json',
                }
            })
        );

        if (files && files.length > 0) {
            const documentUrl = `${this.apiUrl}/Document`;
            
            // Procesar todos los archivos en paralelo
            await Promise.all(files.map(async (file) => {
                const compressedBuffer = await this.compressFile(file);
                const formData = new FormData();
                formData.append('uploadManifest', JSON.stringify({
                    input: {
                        name: file.originalname,
                        items_id: taskResponse.data[0].id,
                        itemtype: 'TicketTask'
                    }
                }));
                
                const blob = new Blob([compressedBuffer], { type: file.mimetype });
                formData.append('uploadFile', blob, file.originalname);

                return firstValueFrom(
                    this.httpService.post(documentUrl, formData, {
                        headers: {
                            'App-Token': this.appToken,
                            'Session-Token': sessionToken,
                            'Content-Type': 'multipart/form-data'
                        }
                    })
                );
            }));
        }

        return taskResponse.data;
    } catch (error) {
        console.error('Error al agregar tarea al ticket:', error.response?.data || error);
        throw new HttpException(
            'Error al agregar tarea al ticket',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
async verificarTicket(token: string, ticketId: number): Promise<{ existe: boolean }> {
  try {
      const response = await firstValueFrom(
          this.httpService.get(`${process.env.API_URL}Ticket/${ticketId}`, {
              headers: {
                  'App-Token': process.env.GLPI_APP_TOKEN,
                  'Session-Token': token
              }
          })
      );
      return { existe: true };
  } catch (error) {
      if (error.response && error.response.status === 404) {
          return { existe: false };
      }
      throw new HttpException('Error al verificar el ticket', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

}

   