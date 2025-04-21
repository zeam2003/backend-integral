import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum CheckStatus {
  EN_CURSO = 'en_curso',
  EN_ESPERA = 'en_espera',
  FINALIZADO = 'finalizado'
}

@Schema({ timestamps: true })
export class Check extends Document {
  @Prop({ unique: true })
  checkId: number;

  @Prop({ required: true })
  ticketId: number;

  @Prop({ required: true })
  createdBy: number;

  @Prop()
  modifiedBy: number;

  @Prop({ 
    type: String, 
    enum: CheckStatus,
    default: CheckStatus.EN_CURSO 
  })
  status: CheckStatus;

  @Prop({ required: true, min: 1, max: 2 })
  stage: number;
}

export const CheckSchema = SchemaFactory.createForClass(Check);

// Agregar middleware pre-save para manejar el autoincremento
CheckSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Model = this.constructor as any;
    const lastCheck = await Model.findOne().sort({ checkId: -1 });
    this.checkId = lastCheck ? lastCheck.checkId + 1 : 1;
  }
  next();
});