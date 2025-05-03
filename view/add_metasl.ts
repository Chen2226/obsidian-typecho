import { App, Modal, Notice } from "obsidian";
import { HttpUtils } from "../utils/request";
import i18n from "../utils/i18n";
export class addMetas extends Modal {
	notice: Notice;
	type: string;
	type_name: string;
	name: string;
	fun: () => Promise<void>;
	constructor(app: App, type: string, fun: () => Promise<void>) {
		super(app);
		this.type = type; // 0: tag, 1: category
		this.type_name = type === "tag" ? i18n.t("field.tag") : i18n.t("field.category");
		this.fun = fun;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", {
			text: i18n.t("common.add") + ` ${this.type_name}`,
		});

		const titleInput = contentEl.createEl("input", {
			attr: {
				type: "text",
				placeholder:
					i18n.t("common.input") + `${this.type_name} ` + i18n.t("common.enter"),
				style: "width: 100%; margin-top: 15px; margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px; color: var(--text-normal);",
			},
		});
		titleInput.addEventListener("input", (event) => {
			const inputValue = (event.target as HTMLInputElement).value;
			this.name = inputValue;
		});

		titleInput.addEventListener("keydown", async (event) => {
			if (event.key === "Enter") {
				if (this.name === "") {
					new Notice(`${this.type_name}` + i18n.t("common.empty"));
					return;
				}
				this.notice = new Notice(i18n.t("sync.adding") + "...");
				try {
					// 获取csrfToken
					const token = await HttpUtils.get(
						"/getCsrfToken?key=" + this.name
					);
					const data = {
						name: this.name,
						type: this.type,
						token: token.data.csrfToken
					};
					const response = await HttpUtils.post("/addMetas", data);
					if (response.status === "success") {
						new Notice(`${this.type_name}` + i18n.t("sync.addSuccess"));
						await this.fun();
						this.close();
					}
				} catch (error) {
					new Notice(`${this.type_name} ` + i18n.t("error.requestFailed"));
					console.error("获取失败:", error);
				}
			}
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
