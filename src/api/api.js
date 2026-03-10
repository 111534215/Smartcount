import axios from 'axios';

// 後端 API 的基礎路徑
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 加入 Token 到請求標頭
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const appointmentApi = {
  // 建立預約
  create: (data) => api.post('/appointments/', data),
  
  // 取得所有預約
  getAll: () => api.get('/appointments/'),
  
  // 取得單一預約
  getById: (id) => api.get(`/appointments/${id}`),
  
  // 搜尋預約 (姓名或電話)
  search: (query) => api.get('/appointments/search', { params: { query } }),
  
  // 取得 QR Code URL
  getQrCodeUrl: (id) => `${API_BASE_URL}/appointments/${id}/qrcode`,
  
  // 簽到 (上傳照片)
  checkin: (id, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    return api.post(`/appointments/${id}/checkin`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // 簽退
  checkout: (id) => api.post(`/appointments/${id}/checkout`),
};

export const userApi = {
  login: (data) => api.post('/users/login', data),
  create: (data) => api.post('/users/', data),
  getAll: () => api.get('/users/'),
  bulkCreate: (data) => api.post('/users/bulk', data),
};

export default api;
