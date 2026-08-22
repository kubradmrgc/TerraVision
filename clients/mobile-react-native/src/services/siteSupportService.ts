import { API_ROUTES } from '@terravision/shared';
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
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

const KIND_TO_API: Record<SiteFeedbackKind, number> = {
  websiteIssue: 0,
  support: 1,
  contact: 2
};

export const siteSupportService = {
  async getFooter(): Promise<SiteSupportFooter> {
    const { data } = await axios.get<SiteSupportFooter>(API_ROUTES.siteSupportFooter, {
      baseURL: API_BASE_URL
    });
    return {
      channels: data.channels ?? [],
      userStoryHint: data.userStoryHint ?? ''
    };
  },

  async submitFeedback(payload: {
    email: string;
    userStory: string;
    kind?: SiteFeedbackKind;
    pageUrl?: string;
  }): Promise<void> {
    await apiClient.post(API_ROUTES.siteSupportFeedback, {
      email: payload.email,
      userStory: payload.userStory,
      kind: KIND_TO_API[payload.kind ?? 'websiteIssue'],
      pageUrl: payload.pageUrl
    });
  }
};

export function channelByKey(
  channels: SiteContactChannel[],
  key: string
): SiteContactChannel | undefined {
  return channels.find((c) => c.channelKey === key);
}
