import { requestUrl, RequestUrlResponse, Notice } from "obsidian";
import { getSettings } from "../main";
import { ResponseType } from "./response_type";

export class HttpUtils {
	private static getHeaders() {
		return {
			"Content-Type": "application/json",
			token: getSettings().Token,
		};
	}
	private static getHost() {
		return getSettings().Host;
	}

	/**
	 * 发起 GET 请求
	 * @param url 请求的 URL
	 * @param headers 自定义请求头（可选）
	 * @returns 返回响应数据
	 */
	public static async get(
		url: string,
		headers?: Record<string, string>
	): Promise<ResponseType> {
		return this.request("GET", url, null, headers);
	}

	/**
	 * 发起 POST 请求
	 * @param url 请求的 URL
	 * @param body 请求体（可以是字符串、对象或FormData）
	 * @param headers 自定义请求头（可选）
	 * @returns 返回响应数据
	 */
	public static async post(
		url: string,
		body: any,
		headers?: Record<string, string>
	): Promise<ResponseType> {
		return this.request("POST", url, body, headers);
	}

	/**
	 * 发起通用 HTTP 请求
	 * @param method 请求方法（如 GET、POST 等）
	 * @param url 请求的 URL
	 * @param body 请求体（可选）
	 * @param headers 自定义请求头（可选）
	 * @returns 返回响应数据
	 */
	private static async request(
		method: string,
		url: string,
		body?: any,
		headers?: Record<string, string>,
	): Promise<ResponseType> {
		headers = {
			...this.getHeaders(),
			...headers,
		};

		const requestOptions = {
			method: method,
			url: this.getHost() + url,
			headers: headers || {},
			body: JSON.stringify(body),
		};
		try {
			const response: RequestUrlResponse = await requestUrl(
				requestOptions
			);
			const res: ResponseType = response.json;
			if (res.status === "success") {
				return res;
			} else {
				new Notice(res.message);
				throw new Error(`HTTP Error: - ${response.json.message}`);
			}
		} catch (error) {
			console.error(`Request failed: ${url}`, error);
			new Notice(error);
			throw error;
		}
	}
}
