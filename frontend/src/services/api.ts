const config = {
  apiUrl: process.env.REACT_APP_API_URL
};

const API_BASE_URL = config.apiUrl;

export const api = {
  // 이벤트 생성
  createEvent: async (eventData: { event_name: string; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return response.json();
  },

  // 이벤트 조회
  getEvent: async (eventCode: string) => {
    const response = await fetch(`${API_BASE_URL}/events/${eventCode}`);
    return response.json();
  },

  // 참가자 등록
  register: async (eventCode: string, userData: { name: string; phone: string; email?: string }) => {
    const response = await fetch(`${API_BASE_URL}/events/${eventCode}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  // 체크인
  checkin: async (checkinData: { phone: string; event_code: string }) => {
    const response = await fetch(`${API_BASE_URL}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkinData)
    });
    return response.json();
  },

  // 참가자 목록 조회 추가
  getParticipants: async (eventCode: string) => {
    const response = await fetch(`${API_BASE_URL}/events/${eventCode}/participants`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

export default api;