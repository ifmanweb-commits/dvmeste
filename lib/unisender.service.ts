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
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // В разработке — только лог
    if (isDevelopment) {
      console.log('📧 [Unisender dev] Would subscribe:', {
        email: options.email,
        name: options.name,
        tags: options.tags,
        listId: process.env.UNISENDER_LIST_ID || '1'
      });
      return { success: true, message: 'Dev mode' };
    }

    if (!this.apiKey) {
      console.error('Unisender API key not configured');
      return { success: false, error: 'API key not configured' };
    }

    const listId = process.env.UNISENDER_LIST_ID;
    if (!listId) {
      console.error('UNISENDER_LIST_ID not configured');
      return { success: false, error: 'List ID not configured' };
    }

    const params = new URLSearchParams({
      format: 'json',
      api_key: this.apiKey,
      list_ids: listId,
      fields: JSON.stringify({
        email: options.email,
        Name: options.name || '',
        // Добавляем тег для кандидатов
        email_list_ids: listId,
        tags: options.tags ? options.tags.join(',') : 'psychologist_candidate'
      }),
      double_optin: '3', // 3 = без подтверждения (мы уже подтвердили email)
    });

    try {
      const response = await fetch(`${this.apiUrl}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Unisender API error:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Unisender subscribe success:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unisender subscribe failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const unisenderService = new UnisenderService();