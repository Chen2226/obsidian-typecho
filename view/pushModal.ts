import { App, Modal, Notice } from "obsidian";
import { HttpUtils } from "../utils/request";

export class PushModal extends Modal {
	constructor(app: App) {
		super(app);
	}
	notice: Notice;
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
				const selectedCategories: string[] = [];
				this.createCategoryCheckboxes(
					categories,
					categoriesContainer,
					selectedCategories
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
				const tagsCategories: string[] = [];
				this.createTagCheckboxes(
					tags,
					tagsContainer,
					tagsCategories
				);
				this.notice.hide();
			}
		} catch (error) {
			new Notice("获取失败，请检查网络或 API 配置");
			console.error("获取失败:", error);
		}

		// 文件选择部分
		const files = this.app.vault.getFiles();
		const activeFile = this.app.workspace.getActiveFile();
		const activeFilePath = activeFile?.path || "";

		const selectEl = contentEl.createEl("select", {
			attr: { style: "width: 100%; padding: 5px;" },
		});

		for (const file of files) {
			const option = selectEl.createEl("option", {
				text: file.path,
				value: file.path,
			});

			if (file.path === activeFilePath) {
				option.selected = true;
			}
		}

		// 监听用户选择文件
		selectEl.addEventListener("change", (event) => {
			const selectedFilePath = (event.target as HTMLSelectElement).value;
			if (selectedFilePath) {
				new Notice(`你选择了文件: ${selectedFilePath}`);
			} else {
				new Notice("未选择任何文件");
			}
		});
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
				style: "border: 1px solid #ddd; padding: 10px; border-radius: 5px;",
			},
		});

		// 添加标题
		groupContainer.createEl("h4", {
			text: "分类(可选)",
			attr: { style: "margin: 0 0 10px 0; font-weight: bold;" },
		});

		// 填充复选框
		categories.forEach((item: any) => {
			// 每个分类项的容器
			const categoryWrapper = groupContainer.createDiv({
				attr: {
					style: "display: flex; align-items: center; margin: 5px 0; padding: 5px; border-radius: 3px;",
				},
			});

			// 创建复选框
			const checkbox = categoryWrapper.createEl("input", {
				type: "checkbox",
				value: item.mid,
			});

			// 创建分类名称
			categoryWrapper.createEl("label", {
				text: item.name,
				attr: { style: "margin-left: 10px; font-size: 14px;" },
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
				style: "border: 1px solid #ddd; padding: 10px; border-radius: 5px;",
			},
		});

		// 添加标题
		groupContainer.createEl("h4", {
			text: "标签(可选)",
			attr: { style: "margin: 0 0 10px 0; font-weight: bold;" },
		});
		tags.forEach((item: any) => {
			const categoryWrapper = groupContainer.createDiv({
				attr: {
					style: "display: flex; align-items: center; margin: 5px 0; padding: 5px; border-radius: 3px;",
				},
			});
			const checkbox = categoryWrapper.createEl("input", {
				type: "checkbox",
				value: item.mid,
			});
			categoryWrapper.createEl("label", {
				text: item.name,
				attr: { style: "margin-left: 10px; font-size: 14px;" },
			});
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
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
