import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // URL de ton backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT aux requêtes protégées
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) =>
  api.post('/login', { email, password });

export const register = (name, email, password) =>
  api.post('/register', { name, email, password });

export const getUser = () => api.get('/user');
export const logout = () => api.post('/logout');

// Articles
export const getArticles = () => api.get('/articles');
export const createArticle = (article) => api.post('/articles', article);
export const getArticle = (id) => api.get(`/articles/${id}`);
export const updateArticle = (id, article) => api.put(`/articles/${id}`, article);
export const deleteArticle = (id) => api.delete(`/articles/${id}`);

// Amis
export const getAmis = () => api.get('/amis');
export const sendAmiRequest = (receveur_id) => api.post('/amis/demande', { receveur_id });
export const updateAmi = (id, etat) => api.put(`/amis/${id}`, { etat });
export const getAmiArticles = (ami_id) => api.get(`/amis/${ami_id}/articles`);
export const deleteAmi = (id) => api.delete(`/amis/${id}`);
export const getAllAmisArticles = () => api.get('/amis/articles');
export const bloquerAmi = (id) => api.put(`/amis/bloquer/${id}`);
export const getUsers = () => api.get('/users');
export const getDemandesEnAttente = () => api.get('/demandes-en-attente');

// Commentaires
export const getComments = (articleId) => api.get(`/comments/${articleId}`);
export const createComment = (comment) => api.post('/comments', comment);

// bloquer un ami
export const blockAmi = (receveur_id) => api.post(`/amis/block/${receveur_id}`);
export default api;