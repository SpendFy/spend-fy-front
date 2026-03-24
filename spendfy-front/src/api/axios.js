import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
});

api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('@SpendFy:user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

export default api;
