import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// Definir los enums
export enum ComponentType {
    PANTALLA = 'pantalla',
    TECLADO = 'teclado',
    BATERIA = 'bateria',
    WIFI = 'wifi',
    ETHERNET = 'ethernet',
    TOUCHPAD = 'touchpad',
    DETALLES_FISICOS = 'detalles_fisicos',
    FUNCIONAMIENTO_GENERAL = 'funcionamiento_general'
}

export enum ComponentStatus {
    BUENO = 'bueno',
    REGULAR = 'regular',
    MALO = 'malo'
}

@Schema({ timestamps: true })
export class CheckDetail {
    @Prop({ type: Number, required: true })
    checkId: number;

    @Prop({ 
        type: String, 
        enum: ComponentType,
        required: true 
    })
    componentType: ComponentType;

    @Prop({ 
        type: String, 
        enum: ComponentStatus,
        required: true 
    })
    status: ComponentStatus;

    @Prop()
    comments: string;

    @Prop()
    imageUrl?: string;

    @Prop()
    imageName?: string;
}

export const CheckDetailSchema = SchemaFactory.createForClass(CheckDetail);