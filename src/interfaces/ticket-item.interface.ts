import { TicketItemDto } from "src/dto/ticket-item.dto";

export interface TicketItemResponse {
    items: TicketItemDto[];
    total: number;
}