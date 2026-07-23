import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const authenticatedRequest = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
});

export const executeQuery = async (query, database = "mysql") => {
  const response = await API.post("/query", {
    query,
    database,
  }, authenticatedRequest());

  return response.data;
};

export const analyzeQuery = async (query, database = "mysql") => {
  const response = await API.post("/analyze", {
    query,
    database,
  }, authenticatedRequest());

  return response.data;
};