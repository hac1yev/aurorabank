import type { AxiosInstance, AxiosRequestConfig, AxiosStatic } from "axios";
import axios from "axios";

class HttpClient {
    private client: AxiosInstance;

    constructor(axiosStatic: AxiosStatic) {
        this.client = axiosStatic.create({
            baseURL: "http://localhost:3000",
            headers: {
                'Content-Type': 'application/json',
            }
        })
    }

    public get = (url: string, config?: AxiosRequestConfig) => this.client.get(url, config);

    public post = (url: string, data?: any, config?: AxiosRequestConfig) => this.client.post(url, data, config);

    public put = (url: string, data?: any, config?: AxiosRequestConfig) => this.client.put(url, data, config);
    
    public delete = (url: string, config?: AxiosRequestConfig) => this.client.delete(url, config);

    public patch = (url: string, data?: any, config?: AxiosRequestConfig) => this.client.patch(url, data, config);
}

export const httpClient = new HttpClient(axios);