import { App, Modal, Notice, Setting } from "obsidian";
import { getSettings, saveSettings } from "../main";
import { addMetas } from "./add_metasl";
import { HttpUtils } from "../utils/request";
import i18n from "../utils/i18n";
import { Util } from "../utils/util";
export class PushModal extends Modal {
	constructor(app: App) {
		super(app);
	}
	notice: Notice;
	baseFileName = "";
	title = "";
	slug = "";
	slugInput: HTMLInputElement;
	content = "";
	selectedTags: string[] = [];
	selectedCategories: string[] = [];
	categoriesDom: HTMLElement;
	tagsDom: HTMLElement;
	activeFilePath: string;

	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: i18n.t("sync.title") });

		await this.getCategories(contentEl);
		await this.getTags(contentEl);

		// 标题部分
		const titleInput = contentEl.createEl("input", {
			attr: {
				type: "text",
				placeholder: `${i18n.t("common.input")} ${i18n.t(
					"field.title"
				)}`,
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
			if (!file.path.endsWith(".md")) continue;
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
				this.setTitleFromFileName(selectedFilePath, titleInput);
			} else {
				new Notice(i18n.t("error.noFileSelected"));
			}
		});

		// 高级选项部分 (Slug)
		const advancedDetails = contentEl.createEl("details", {
			attr: {
				style: "margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 10px;",
			},
		});
		advancedDetails.createEl("summary", {
			text: i18n.t("sync.advancedOptions"),
			attr: {
				style: "cursor: pointer; color: var(--text-muted); font-size: 0.9em;",
			},
		});

		const slugContainer = advancedDetails.createDiv({
			attr: { style: "margin-top: 10px;" },
		});
		slugContainer.createEl("label", {
			text: i18n.t("sync.alias"),
			attr: {
				style: "display: block; font-size: 0.8em; color: var(--text-muted); margin-bottom: 5px;",
			},
		});

		this.slugInput = slugContainer.createEl("input", {
			attr: {
				type: "text",
				placeholder: "Slug",
				style: "width: 100%; border: 1px solid var(--background-modifier-border); border-radius: 4px; color: var(--text-normal);",
			},
		});
		this.slugInput.value = this.slug; // 使用 setTitleFromFileName 中已经设置好的值
		this.slugInput.addEventListener("input", (event) => {
			this.slug = (event.target as HTMLInputElement).value;
		});

		// 发布按钮
		const button = contentEl.createEl("button", {
			text: i18n.t("sync.publish"),
			attr: {
				style: "margin-top: 15px; padding: 8px 16px; border: none; border-radius: 4px;  color: var(--text-normal); cursor: pointer;",
			},
		});
		button.addEventListener("click", async () => {
			if (this.title === "" || this.content === "") {
				new Notice(i18n.t("error.titleOrContentCannotBeEmpty"));
				return;
			}
			this.notice = new Notice(`${i18n.t("sync.publish")}...`);
			try {
				const mid = [...this.selectedCategories, ...this.selectedTags];

				let finalContent = this.content;
				// 如果开启了去除元数据
				if (getSettings().removeMetadata) {
					// 匹配开头的 --- ... ---
					const yamlRegex = /^---\s*[\s\S]*?---\s*/;
					finalContent = finalContent.replace(yamlRegex, "");
				}

				const data = {
					title: this.title,
					text: "<!--markdown-->" + finalContent,
					authorId: getSettings().User?.uid,
					mid: mid.join(","),
					slug: this.slug,
				};
				const response = await HttpUtils.post("/postArticle", data);
				if (response.status === "success") {
					// 保存 slug 映射
					if (this.baseFileName) {
						getSettings().slugMapping[this.baseFileName] =
							this.slug;
						await saveSettings();
					}
					new Notice(
						`${i18n.t("sync.publish")} ${i18n.t("common.success")}`
					);
					this.close();
				}
			} catch (error) {
				new Notice(
					`${i18n.t("sync.publish")} ${i18n.t("common.failed")}`
				);
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
			new Notice(i18n.t("error.readFileError"));
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
			new Notice(i18n.t("error.readFileError"));
			return;
		}
		this.baseFileName = file.basename;
		this.title = file.basename;
		titleInput.value = this.title;

		// 设置 Slug
		const savedSlug = getSettings().slugMapping[this.baseFileName];
		if (savedSlug) {
			this.slug = savedSlug;
		} else {
			this.slug = "obsidian-" + Util.hash.simpleHash(this.baseFileName);
		}
		if (this.slugInput) {
			this.slugInput.value = this.slug;
		}
	}

	/**
	 * 获取分类
	 */
	async getCategories(contentEl: HTMLElement) {
		if (this.categoriesDom) {
			while (this.categoriesDom.firstChild) {
				this.categoriesDom.removeChild(this.categoriesDom.firstChild);
			}
		} else {
			this.categoriesDom = contentEl.createDiv({
				attr: { style: "margin-bottom: 15px;" },
			});
		}

		this.selectedCategories = [];
		this.notice = new Notice(
			`${i18n.t("common.get")}${i18n.t("field.category")}...`
		);
		const categoriesResponse = await HttpUtils.get("/categories");
		const categories = categoriesResponse.data || [];

		if (categories.length > 0) {
			requestAnimationFrame(() => {
				this.createCategoryCheckboxes(categories);
			});
			this.notice.hide();
		}
	}

	async getTags(contentEl: HTMLElement) {
		if (this.tagsDom) {
			while (this.tagsDom.firstChild) {
				this.tagsDom.removeChild(this.tagsDom.firstChild);
			}
		} else {
			this.tagsDom = contentEl.createDiv({
				attr: { style: "margin-bottom: 15px;" },
			});
		}

		this.selectedTags = [];
		this.notice = new Notice(
			`${i18n.t("common.get")}${i18n.t("field.tag")}...`
		);
		const tagsResponse = await HttpUtils.get("/tags");
		const tags = tagsResponse.data || [];

		if (tags.length > 0) {
			requestAnimationFrame(() => {
				this.createTagCheckboxes(tags);
			});
			this.notice.hide();
		}
	}

	/**
	 * 创建分类复选框
	 * @param categories 分类数据数组
	 * @param container 容器元素
	 * @param selectedCategories 存储选中的分类 ID 的数组
	 */
	private createCategoryCheckboxes(categories: []) {
		// 创建一个分组容器
		const groupContainer = this.categoriesDom.createDiv({
			attr: {
				style: "border: 1px solid var(--background-modifier-border); padding: 10px; border-radius: 5px; display: flex; flex-wrap: wrap;",
			},
		});

		// 添加标题
		groupContainer.createEl("h4", {
			text: i18n.t("field.category"),
			attr: {
				style: "margin: 0 0 10px 0; font-weight: bold; color: var(--text-normal);",
			},
		});

		this.addMetasBtn(groupContainer, "category");

		groupContainer.createEl("span", {
			attr: {
				style: "width: 100%;height: 1px",
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
				value: item.mid,
				attr: {
					id: `category-${item.mid}`,
					style: "margin-right: 5px; accent-color: var(--interactive-accent);",
				},
			});

			// 创建标签，并关联复选框
			const label = categoryWrapper.createEl("label", {
				text: item.name,
				attr: {
					for: `category-${item.mid}`, // 关联复选框
					style: "cursor: pointer; font-size: 14px; color: var(--text-normal);",
				},
			});

			// 监听复选框变化
			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.selectedCategories.push(item.mid); // 添加到选中列表
				} else {
					const index = this.selectedCategories.indexOf(item.mid);
					if (index > -1) {
						this.selectedCategories.splice(index, 1); // 从选中列表移除
					}
				}
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
	private createTagCheckboxes(tags: any[]) {
		const groupContainer = this.tagsDom.createDiv({
			attr: {
				style: "border: 1px solid var(--background-modifier-border); padding: 10px; border-radius: 5px; display: flex; flex-wrap: wrap;",
			},
		});

		groupContainer.createEl("h4", {
			text: i18n.t("field.tag"),
			attr: {
				style: "margin: 0 0 10px 0; font-weight: bold; color: var(--text-normal);",
			},
		});

		this.addMetasBtn(groupContainer, "tag");
		groupContainer.createEl("span", {
			attr: {
				style: "width: 100%;height: 1px",
			},
		});

		tags.forEach((item: any) => {
			const tagWrapper = groupContainer.createDiv({
				attr: {
					style: "display: flex; align-items: center; margin: 5px 10px 5px 0; padding: 5px 10px; border-radius: 3px; color: var(--text-normal); cursor: pointer;",
				},
			});

			const checkbox = tagWrapper.createEl("input", {
				type: "checkbox",
				value: item.mid,
				attr: {
					id: `tag-${item.mid}`,
					style: "margin-right: 5px; accent-color: var(--interactive-accent);",
				},
			});

			const label = tagWrapper.createEl("label", {
				text: item.name,
				attr: {
					for: `tag-${item.mid}`,
					style: "cursor: pointer; font-size: 14px; color: var(--text-normal);",
				},
			});

			checkbox.addEventListener("change", () => {
				if (checkbox.checked) {
					this.selectedTags.push(item.mid);
				} else {
					const index = this.selectedTags.indexOf(item.mid);
					if (index > -1) {
						this.selectedTags.splice(index, 1);
					}
				}
			});

			label.addEventListener("click", (e) => {
				checkbox.click();
			});
		});
	}

	/**
	 * 添加分类或标签按钮
	 * @param contentEl 容器元素
	 * @param type 类型，"category" 或 "tag"
	 */
	private addMetasBtn(contentEl: HTMLElement, type: string) {
		const button = contentEl.createEl("button", {
			text: i18n.t("common.add"),
			attr: {
				style: "cursor: pointer; margin-left: 10px; background-color: var(--interactive-normal); color: var(--text-normal);",
			},
		});
		const fun = async () => {
			type === "tag"
				? this.getTags(contentEl)
				: this.getCategories(contentEl);
		};
		button.addEventListener("click", async () => {
			new addMetas(this.app, type, fun).open();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
