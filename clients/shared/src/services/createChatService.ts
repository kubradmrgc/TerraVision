import { API_ROUTES } from '../apiContract';
import type { ApiHttpClient } from '../http/apiHttp';
import type {
  ChatConsultantDto,
  ChatMessageDto,
  ConsultationSessionDto,
  CreateConsultationSessionRequest,
  SendChatMessageRequest,
  SendProposalRequest
} from '../types/chat';

export function createChatService(client: ApiHttpClient) {
  return {
    async getConsultants(): Promise<ChatConsultantDto[]> {
      const { data } = await client.get<ChatConsultantDto[]>(API_ROUTES.CHAT.consultants);
      return data;
    },

    async getMySessions(): Promise<ConsultationSessionDto[]> {
      const { data } = await client.get<ConsultationSessionDto[]>(API_ROUTES.CHAT.sessions);
      return data;
    },

    async createSession(request: CreateConsultationSessionRequest): Promise<ConsultationSessionDto> {
      const { data } = await client.post<ConsultationSessionDto>(API_ROUTES.CHAT.sessions, request);
      return data;
    },

    async getSession(sessionId: number): Promise<ConsultationSessionDto> {
      const { data } = await client.get<ConsultationSessionDto>(API_ROUTES.CHAT.sessionById(sessionId));
      return data;
    },

    async getMessages(sessionId: number): Promise<ChatMessageDto[]> {
      const { data } = await client.get<ChatMessageDto[]>(API_ROUTES.CHAT.sessionMessages(sessionId));
      return data;
    },

    async sendMessage(sessionId: number, request: SendChatMessageRequest): Promise<ChatMessageDto> {
      const { data } = await client.post<ChatMessageDto>(
        API_ROUTES.CHAT.sessionMessages(sessionId),
        request
      );
      return data;
    },

    async sendProposal(sessionId: number, request: SendProposalRequest): Promise<ChatMessageDto> {
      const { data } = await client.post<ChatMessageDto>(
        API_ROUTES.CHAT.sessionProposals(sessionId),
        request
      );
      return data;
    }
  };
}

export type ChatService = ReturnType<typeof createChatService>;
