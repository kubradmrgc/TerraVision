import { API_ROUTES } from '@terravision/shared';
import axios from 'axios';
import { apiClient } from './apiClient';

export type SiteFeedbackKind = 'websiteIssue' | 'support' | 'contact';

export type SiteContactChannel = {
  channelKey: string;
  label: string;
  email: string;
};

export type SiteSupportFooter = {
  channels: SiteContactChannel[];
  userStoryHint: string;
};

export type SiteContactChannelAdmin = SiteContactChannel & {
  id: number;
  sortOrder: number;
  isActive: boolean;
};

export type SiteFeedbackSubmission = {
  id: number;
  email: string;
  userStory: string;
  kind: number;
  status: number;
  pageUrl: string | null;
  userId: number | null;
  createdDate: string;
};

export type SiteSupportAdminOverview = {
  channels: SiteContactChannelAdmin[];
  submissions: SiteFeedbackSubmission[];
  newSubmissionCount: number;
  totalSubmissionCount: number;
};

const KIND_TO_API: Record<SiteFeedbackKind, number> = {
  websiteIssue: 0,
  support: 1,
  contact: 2
};

function mapFooter(data: {
  channels: SiteContactChannel[];
  userStoryHint: string;
}): SiteSupportFooter {
  return {
    channels: data.channels ?? [],
    userStoryHint: data.userStoryHint ?? ''
  };
}

export const siteSupportService = {
  async getFooter(): Promise<SiteSupportFooter> {
    const { data } = await axios.get<{
      channels: SiteContactChannel[];
      userStoryHint: string;
    }>(API_ROUTES.siteSupportFooter, { baseURL: apiClient.defaults.baseURL });
    return mapFooter(data);
  },

  async submitFeedback(payload: {
    email: string;
    userStory: string;
    kind: SiteFeedbackKind;
    pageUrl?: string;
  }): Promise<SiteFeedbackSubmission> {
    const { data } = await axios.post<SiteFeedbackSubmission>(API_ROUTES.siteSupportFeedback, {
      email: payload.email,
      userStory: payload.userStory,
      kind: KIND_TO_API[payload.kind],
      pageUrl: payload.pageUrl
    }, { baseURL: apiClient.defaults.baseURL });
    return data;
  },

  async getSubmissionsForAdmin(take = 100): Promise<SiteFeedbackSubmission[]> {
    const overview = await this.getAdminOverview(take);
    return overview.submissions;
  },

  async getAdminOverview(take = 200): Promise<SiteSupportAdminOverview> {
    const { data } = await apiClient.get<SiteSupportAdminOverview>(API_ROUTES.siteSupportAdmin, {
      params: { take }
    });
    return data;
  },

  async markSubmissionReviewed(id: number): Promise<SiteFeedbackSubmission> {
    const { data } = await apiClient.patch<SiteFeedbackSubmission>(
      API_ROUTES.siteSupportFeedbackStatus(id),
      { status: 1 }
    );
    return data;
  }
};

export function channelByKey(channels: SiteContactChannel[], key: string): SiteContactChannel | undefined {
  return channels.find((c) => c.channelKey === key);
}

const KIND_LABELS: Record<number, string> = {
  0: 'Site sorunu',
  1: 'Destek',
  2: 'İletişim'
};

export function feedbackKindLabel(kind: number): string {
  return KIND_LABELS[kind] ?? 'Diğer';
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Yeni',
  1: 'İncelendi'
};

export function feedbackStatusLabel(status: number): string {
  return STATUS_LABELS[status] ?? 'Bilinmiyor';
}

const CHANNEL_KEY_LABELS: Record<string, string> = {
  support: 'Destek',
  contact: 'İletişim',
  info: 'Kurumsal'
};

export function channelKeyLabel(key: string): string {
  return CHANNEL_KEY_LABELS[key] ?? key;
}
