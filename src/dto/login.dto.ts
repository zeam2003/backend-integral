import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: 'jperez',
    description: 'nombre de usuario',
    format: 'text',
  })
  username: string;
  @ApiProperty({
    example: '*******',
    description: 'Contraseña del usuario',
    format: 'password',
  })
  password: string;
  
}