import { App, Modal, Notice } from "obsidian";
import { getSettings } from "../main";
import { HttpUtils } from "../utils/request";

export class PushModal extends Modal {
	constructor(app: App) {
		super(app);
	}
	notice: Notice;
	baseFileName = "";
	title = "";
	content = "";
	selectedTags: string[] = [];
	selectedCategories: string[] = [];
	activeFilePath: string;

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "发布到 Typecho" });
		try {
			this.notice = new Notice("获取分类中...");
			const categoriesResponse = await HttpUtils.get("/categories");
			const categories = categoriesResponse.data || [];
			if (categories.length > 0) {
				const categoriesContainer = contentEl.createDiv({
					attr: { style: "margin-bottom: 15px;" },
				});
				this.createCategoryCheckboxes(
					categories,
					categoriesContainer,
					this.selectedCategories
				);
				this.notice.hide();
			}
			this.notice = new Notice("获取标签中...");
			const tagsResponse = await HttpUtils.get("/tags");
			const tags = tagsResponse.data || [];
			if (tags.length > 0) {
				const tagsContainer = contentEl.createDiv({
					attr: { style: "margin-bottom: 15px;" },
				});
				this.createTagCheckboxes(
					tags,
					tagsContainer,
					this.selectedTags
				);
				this.notice.hide();
			}
		} catch (error) {
			new Notice("获取失败，请检查网络或 API 配置");
			console.error("获取失败:", error);
		}

		// 标题部分
		const titleInput = contentEl.createEl("input", {
			attr: {
				type: "text",
				placeholder: "请输入标题",
				style: "width: 100%; margin-top: 15px; margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px; color: var(--text-normal);",
			},
		});
		titleInput.addEventListener("input", (event) => {
			const inputValue = (event.target as HTMLInputElement).value;
			this.title = inputValue;
		});

		// 文件选择部分
		const files = this.app.vault.getFiles();
		const activeFile = this.app.workspace.getActiveFile();
		this.activeFilePath = activeFile?.path || "";
		const selectEl = contentEl.createEl("select", {
			attr: {
				style: "width: 100%; margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px; color: var(--text-normal);",
			},
		});
		for (const file of files) {
			const option = selectEl.createEl("option", {
				text: file.path,
				value: file.path,
			});

			if (file.path === this.activeFilePath) {
				option.selected = true;
				this.readFileAndSetContent(this.activeFilePath);
				this.setTitleFromFileName("", titleInput);
			}
		}
		if (this.activeFilePath === "") {
			const selectedFilePath = selectEl.value;
			if (selectedFilePath) {
				this.readFileAndSetContent(selectedFilePath);
				this.setTitleFromFileName(selectedFilePath, titleInput);
			}
		}
		selectEl.addEventListener("change", (event) => {
			const selectedFilePath = (event.target as HTMLSelectElement).value;
			if (selectedFilePath) {
				this.readFileAndSetContent(selectedFilePath);
				this.setTitleFromFileName("", titleInput);
			} else {
				new Notice("未选择任何文件");
			}
		});

		// 发布按钮
		const button = contentEl.createEl("button", {
			text: "发布",
			attr: {
				style: "margin-top: 15px; padding: 8px 16px; border: none; border-radius: 4px; color: var(--text-on-accent); cursor: pointer;",
			},
		});
		button.addEventListener("click", async () => {
			if (this.title === "" || this.content === "") {
				new Notice("标题或内容不能为空");
				return;
			}
			this.notice = new Notice("发布中...");
			try {
				const mid = [...this.selectedCategories, ...this.selectedTags];
				const data = {
					title: this.title,
					text: this.content,
					authorId: getSettings().User?.uid,
					mid: mid.join(","),
					slug: "obsidian-" + this.baseFileName,
				};
				console.log(data);
				const response = await HttpUtils.post("/postArticle", data);
				if (response.status === "success") {
					new Notice("发布成功");
					this.close();
				}
			} catch (error) {
				new Notice("发布失败");
				console.error("发布失败:", error);
			}
		});
	}

	/**
	 * 读取文件，设置内容
	 * @param path 文件路径
	 */
	async readFileAndSetContent(path: string) {
		const file = this.app.vault.getFileByPath(path);
		if (!file) {
			new Notice("读取文件异常，请检查文件内容");
			return;
		}
		this.app.vault.cachedRead(file).then((res) => {
			this.content = res;
		});
	}

	/**
	 * 读取当前文件，设置标题
	 * @param path 文件路径
	 * @param titleInput 标题输入框
	 */
	async setTitleFromFileName(path = "", titleInput: HTMLInputElement) {
		const file = this.app.vault.getFileByPath(
			path != "" ? path : this.activeFilePath
		);
		if (!file) {
			new Notice("读取文件异常，请检查文件内容");
			return;
		}
		this.baseFileName = file.basename;
		this.title = file.basename;
		titleInput.value = this.title;
	}

	/**
	 * 创建分类复选框
	 * @param categories 分类数据数组
	 * @param container 容器元素
	 * @param selectedCategories 存储选中的分类 ID 的数组
	 */
	private createCategoryCheckboxes(
		categories: any[],
		container: HTMLElement,
		selectedCategories: string[]
	) {
		// 创建一个分组容器
		const groupContainer = container.createDiv({
			attr: {
				style: "border: 1px solid var(--background-modifier-border); padding: 10px; border-radius: 5px; display: flex; flex-wrap: wrap; ",
			},
		});

		// 添加标题
		groupContainer.createEl("h4", {
			text: "分类(可选)",
			attr: {
				style: "margin: 0 0 10px 0; font-weight: bold; width: 100%; color: var(--text-normal);",
			},
		});

		// 填充复选框
		categories.forEach((item: any) => {
			// 每个分类项的容器
			const categoryWrapper = groupContainer.createDiv({
				attr: {
					style: "display: flex; align-items: center; margin: 5px 10px 5px 0; padding: 5px 10px; border-radius: 3px; color: var(--text-normal); cursor: pointer;",
				},
			});

			// 创建复选框
			const checkbox = categoryWrapper.createEl("input", {
				type: "checkbox",
				id: `category-${item.mid}`, // 为复选框添加唯一 ID
				value: item.mid,
				attr: {
					style: "margin-right: 5px; accent-color: var(--interactive-accent);",
				},
			});

			// 创建标签，并关联复选框
			const label = categoryWrapper.createEl("label", {
				text: item.name,
				attr: {
					id: item.mid,
					for: `category-${item.mid}`, // 关联复选框
					style: "cursor: pointer; font-size: 14px; color: var(--text-normal);",
				},
			});

			// 监听复选框变化
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					selectedCategories.push(item.mid); // 添加到选中列表
				} else {
					const index = selectedCategories.indexOf(item.mid);
					if (index > -1) {
						selectedCategories.splice(index, 1); // 从选中列表移除
					}
				}
				console.log("当前选中的分类:", selectedCategories);
			});

			label.addEventListener("click", (e) => {
				checkbox.click();
			});
		});
	}

	/**
	 * 创建标签复选框
	 * @param tags 标签数据数组
	 * @param container 容器元素
	 * @param selectedTags 存储选中的标签 ID 的数组
	 */
	private createTagCheckboxes(
		tags: any[],
		container: HTMLElement,
		selectedTags: string[]
	) {
		// 创建一个分组容器
		const groupContainer = container.createDiv({
			attr: {
				style: "border: 1px solid var(--background-modifier-border); padding: 10px; border-radius: 5px; display: flex; flex-wrap: wrap;",
			},
		});

		// 添加标题
		groupContainer.createEl("h4", {
			text: "标签(可选)",
			attr: {
				style: "margin: 0 0 10px 0; font-weight: bold; width: 100%; color: var(--text-normal);",
			},
		});

		// 填充复选框
		tags.forEach((item: any) => {
			// 每个标签项的容器
			const tagWrapper = groupContainer.createDiv({
				attr: {
					style: "display: flex; align-items: center; margin: 5px 10px 5px 0; padding: 5px 10px; border-radius: 3px; color: var(--text-normal); cursor: pointer;",
				},
			});

			// 创建复选框
			const checkbox = tagWrapper.createEl("input", {
				type: "checkbox",
				id: `tag-${item.mid}`, // 为复选框添加唯一 ID
				value: item.mid,
				attr: {
					style: "margin-right: 5px; accent-color: var(--interactive-accent);",
				},
			});

			// 创建标签，并关联复选框
			const label = tagWrapper.createEl("label", {
				text: item.name,
				attr: {
					for: `tag-${item.mid}`, // 关联复选框
					style: "cursor: pointer; font-size: 14px; color: var(--text-normal);",
				},
			});

			// 监听复选框变化
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					selectedTags.push(item.mid); // 添加到选中列表
				} else {
					const index = selectedTags.indexOf(item.mid);
					if (index > -1) {
						selectedTags.splice(index, 1); // 从选中列表移除
					}
				}
				console.log("当前选中的标签:", selectedTags);
			});

			label.addEventListener("click", (e) => {
				checkbox.click();
			});
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
