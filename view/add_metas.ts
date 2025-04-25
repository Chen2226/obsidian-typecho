import { App, Modal, Notice } from "obsidian";
import { HttpUtils } from "../utils/request";

export class addMetas extends Modal {
	notice: Notice;
	type: string;
	type_name: string;
	name: string;
	fun: () => Promise<void>;
	constructor(app: App, type: string, fun: () => Promise<void>) {
		super(app);
		this.type = type; // 0: tag, 1: category
		this.type_name = type === "tag" ? "标签" : "分类";
        this.fun = fun;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: `添加${this.type_name}` });

		const titleInput = contentEl.createEl("input", {
			attr: {
				type: "text",
				placeholder: `请输入${this.type_name}（按回车添加）`,
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
					new Notice(`${this.type_name}不能为空`);
					return;
				}
				this.notice = new Notice("添加中...");
				try {
					const data = {
						name: this.name,
						type: this.type,
					};
					const response = await HttpUtils.post("/addMetas", data);
					if (response.status === "success") {
						new Notice(`${this.type_name}添加成功`);
                        await this.fun();
						this.close();
					}
				} catch (error) {
					new Notice(
						`${this.type_name}添加失败，请检查网络或 API 配置`
					);
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
