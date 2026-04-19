import axios, { InternalAxiosRequestConfig } from "axios";

const tmdb = axios.create({
  baseURL: "https://api.themoviedb.org/3/",
  timeout: 5000,
});

tmdb.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers.Authorization = `Bearer ${process.env.TMDB_API_READ_ACCESS_TOKEN}`;
  return config;
});

export default tmdb;
