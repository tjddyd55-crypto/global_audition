import { apiClient } from './client';

type Audition = {
  id: number;
  title: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export const auditionApi = {
  async getAuditions(params?: {
    category?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Audition>> {
    const { data } = await apiClient.get('/api/v1/auditions', { params });
    return data;
  },
};
