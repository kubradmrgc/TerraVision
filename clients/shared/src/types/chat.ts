export enum ConsultationSessionStatus {
  Open = 1,
  Closed = 2
}

export enum ChatMessageKind {
  Text = 1,
  Proposal = 2
}

export type ProposalLineDto = {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ProposalDto = {
  title: string;
  notes?: string | null;
  lines: ProposalLineDto[];
  totalAmount: number;
};

export type ChatMessageDto = {
  id: number;
  sessionId: number;
  senderId: number;
  senderName: string;
  content: string;
  kind: ChatMessageKind;
  proposal?: ProposalDto | null;
  createdDate: string;
};

export type ChatConsultantDto = {
  id: number;
  displayName: string;
  email: string;
};

export type ConsultationSessionDto = {
  id: number;
  customerId: number;
  customerName: string;
  consultantId: number;
  consultantName: string;
  title: string;
  status: ConsultationSessionStatus;
  appointmentId?: number | null;
  createdDate: string;
  lastMessageAt?: string | null;
};

export type CreateConsultationSessionRequest = {
  consultantId: number;
  title: string;
  appointmentId?: number | null;
};

export type SendChatMessageRequest = {
  content: string;
};

export type ProposalLineRequest = {
  productId: number;
  quantity: number;
};

export type SendProposalRequest = {
  title: string;
  notes?: string | null;
  lines: ProposalLineRequest[];
};

export type ChatMessageReceivedEvent = {
  message: ChatMessageDto;
  occurredAtUtc: string;
};
