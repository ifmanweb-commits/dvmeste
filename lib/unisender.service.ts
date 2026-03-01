interface SubscribeOptions {
  email: string;
  name?: string;
  tags?: string[];
}

class UnisenderService {
  private apiKey: string;
  private apiUrl = 'https://api.unisender.com/ru/api';

  constructor() {
    const apiKey = process.env.UNISENDER_API_KEY;
    if (!apiKey) {
      console.warn('UNISENDER_API_KEY not configured');
    }
    this.apiKey = apiKey || '';
  }

  async subscribe(options: SubscribeOptions) {
    // В разработке — только лог
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [Unisender dev] Would subscribe:', options);
      return { success: true, message: 'Dev mode' };
    }

    if (!this.apiKey) {
      throw new Error('Unisender API key not configured');
    }

    const params = new URLSearchParams({
      format: 'json',
      api_key: this.apiKey,
      list_ids: process.env.UNISENDER_LIST_ID || '1',
      fields: JSON.stringify({
        email: options.email,
        Name: options.name || '',
        phone: '',
        email_status: 'active'
      }),
      tags: options.tags ? options.tags.join(',') : '',
      double_optin: '0', // 0 — сразу подписываем (после подтверждения email)
    });

    try {
      const response = await fetch(`${this.apiUrl}/subscribe?${params}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log('✅ Unisender subscribe success:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unisender subscribe failed:', error);
      return { success: false, error };
    }
  }
}

export const unisenderService = new UnisenderService();