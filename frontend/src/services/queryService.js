import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const executeQuery = async (query) => {
  const response = await API.post("/query", {
    query,
  });

  return response.data;
};

export const analyzeQuery = async (query) => {
  const response = await API.post("/analyze", {
    query,
  });

  return response.data;
};