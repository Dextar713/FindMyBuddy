import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// 1. Create the base instance
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 2. Request Interceptor: Automatically inject credentials (like Bearer tokens)
// apiClient.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
//     if (token && config.headers) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// 3. Response Interceptor: Global Error Handling
// apiClient.interceptors.response.use(
//   (response) => response.data, // Simplify: return only the data, hiding axios wrappers
//   (error: AxiosError) => {
//     const message = (error.response?.data as any)?.message || 'An unexpected error occurred';
    
//     // Logic for specific status codes (e.g., redirect to login on 401)
//     if (error.response?.status === 401) {
//       console.error('Unauthorized! Redirecting...');
//       // window.location.href = '/login'; 
//     }

//     return Promise.reject(message); // Pass only the string message to your component
//   }
// );

export default apiClient;