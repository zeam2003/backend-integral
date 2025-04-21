import { IsNumber, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum CheckStatus {
  EN_CURSO = 'en_curso',
  EN_ESPERA = 'en_espera',
  FINALIZADO = 'finalizado'
}

export class CreateCheckDto {
  @ApiProperty({
    example: 123,
    description: 'ID del ticket asociado',
  })
  @IsNumber()
  ticketId: number;

  @ApiProperty({
    example: 1,
    description: 'Etapa del check (1 o 2)',
  })
  @IsNumber()
  @Min(1)
  @Max(2)
  stage: number;

  @ApiProperty({
    example: 'en_curso',
    description: 'Estado del check',
    enum: CheckStatus,
    default: CheckStatus.EN_CURSO
  })
  @IsEnum(CheckStatus)
  @IsOptional()
  status?: CheckStatus;
}