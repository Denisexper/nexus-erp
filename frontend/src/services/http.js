const API_URL = "http://localhost:4000/api";
export const SERVER_URL = API_URL.replace(/\/api$/, "");

class HttpClient {
  constructor() {
    this.baseURL = API_URL;
  }

  getToken() {
    return localStorage.getItem("token");
  }

  setToken(token) {
    localStorage.setItem("token", token);
  }

  removeToken() {
    localStorage.removeItem("token");
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msj || "Error en la petición");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Para subir archivos (FormData): no fijamos Content-Type, el browser
  // arma el boundary del multipart solo.
  async upload(endpoint, formData, options = {}) {
    const token = this.getToken();

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        body: formData,
        ...options,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msj || "Error al subir el archivo");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Para descargas (Excel, PDF, etc.), la respuesta no es JSON.
  async requestBlob(endpoint, options = {}) {
    const token = this.getToken();

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error("Error al generar el archivo");
    }

    return response.blob();
  }
}

export const http = new HttpClient();
