// main.ts
import { ItemView, setIcon, Modal, App, Notice } from "obsidian";
import i18n from "../utils/i18n";
import { getSettings } from "../main";
import { HttpUtils } from "../utils/request";
import { Util } from "../utils/util";
import { BrowseArticles } from "./browse_articles";

// 图片预览模态框
class ImageModal extends Modal {
	file: any;

	constructor(app: App, file: any) {
		super(app);
		this.file = file;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("image-preview-modal");

		// 创建图片容器
		const imageContainer = contentEl.createDiv({
			cls: "image-preview-container",
		});

		// 创建图片标题
		imageContainer.createEl("h2", {
			text: this.file.title,
			cls: "image-preview-title",
		});

		// 创建图片信息
		const infoContainer = imageContainer.createDiv({
			cls: "image-preview-info",
		});
		infoContainer.createEl("span", {
			text: `类型: ${this.file.type.toUpperCase()}`,
			cls: "image-info-item",
		});
		infoContainer.createEl("span", {
			text: `大小: ${this.formatFileSize(this.file.size)}`,
			cls: "image-info-item",
		});
		infoContainer.createEl("span", {
			text: `时间: ${this.file.createdAt}`,
			cls: "image-info-item",
		});

		// 创建图片元素
		const img = imageContainer.createEl("img", {
			cls: "image-preview-img",
			attr: { src: this.file.url.trim() },
		});
	}

	// 格式化文件大小
	formatFileSize(size: number): string {
		if (size < 1024) {
			return size + " B";
		} else if (size < 1024 * 1024) {
			return (size / 1024).toFixed(2) + " KB";
		} else {
			return (size / (1024 * 1024)).toFixed(2) + " MB";
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

const VIEW_TYPE = "article-view";

class CategoryView extends ItemView {
	pageSize = 15; // 默认每页显示15条

	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return i18n.t("field.category");
	}

	getIcon(): string {
		return "typecho";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		// 创建选项卡导航
		const tabContainer = container.createDiv({ cls: "tab-container" });
		const tabs = [
			{ key: "all", label: i18n.t("field.allArticle") },
			{ key: "category", label: i18n.t("field.category") },
			{ key: "tag", label: i18n.t("field.tag") },
			{ key: "file", label: i18n.t("field.file") },
		];
		// 初始化加载第一个 tab
		this.currentTab = "category";

		tabs.forEach((tab) => {
			const tabEl = tabContainer.createEl("span", {
				text: tab.label,
				cls:
					"tab-span " +
					(tab.key === this.currentTab ? "selected" : ""),
			});
			tabEl.addEventListener("click", async () => {
				if (tab.key == "all") {
					new BrowseArticles(
						this.app,
						{ name: i18n.t("field.allArticle") },
						"all"
					).open();
					return;
				}
				this.switchTab(tab.key, tabContainer, tabEl);
			});
		});

		// 内容容器
		this.contentContainer = container.createDiv({ cls: "tab-content" });

		// 刷新按钮
		const refreshButton = tabContainer.createEl("button", {
			cls: "refresh-button",
		});
		setIcon(refreshButton, "rotate-ccw");
		refreshButton.addEventListener("click", () => {
			this.loadData(this.currentTab, this.contentContainer);
		});

		this.loadData("category", this.contentContainer);
	}

	switchTab(tabKey: string, tabContainer: HTMLElement, tabEl: HTMLElement) {
		const selectedTabs =
			tabContainer.querySelectorAll(".tab-span.selected");
		selectedTabs.forEach((tab: HTMLElement) => {
			tab.classList.remove("selected");
		});
		tabEl.classList.add("selected");
		this.currentTab = tabKey;
		this.contentContainer.empty();
		this.loadData(tabKey, this.contentContainer);
	}

	currentTab: string;
	contentContainer: HTMLElement;

	async loadData(tabKey: string, container: Element) {
		container.empty();

		if (!getSettings().User) {
			container.createEl("p", {
				text: i18n.t("error.noTypechoUser"),
			});
			return;
		}

		let data: any[] = [];

		if (tabKey === "category") {
			const response = await HttpUtils.get("/categories", {});
			data = Util.treeUtil.generateTreeData(
				response.data,
				"mid",
				"parent"
			);
			const treeContainer = container.createDiv({
				cls: "tree-container",
			});
			this.renderTree(treeContainer, data);
		} else if (tabKey === "tag") {
			const response = await HttpUtils.get("/tags", {});
			data = Util.treeUtil.generateTreeData(
				response.data,
				"mid",
				"parent"
			);
			const treeContainer = container.createDiv({
				cls: "tree-container",
			});
			this.renderTree(treeContainer, data);
		} else if (tabKey === "file") {
			await this.loadFileList(container, 1);
		}
	}

	async loadFileList(container: Element, page = 1) {
		container.empty();

		// 创建上传按钮和分页设置区域
		const uploadContainer = container.createDiv({
			cls: "upload-container",
		});
		
		// 创建分页设置区域
		const pageSizeContainer = uploadContainer.createDiv({
			cls: "page-size-container",
		});
		
		// 添加分页大小标签
		pageSizeContainer.createEl("span", {
			text: i18n.t("file.itemsPerPage") + ": ",
			cls: "page-size-label",
		});
		
		// 创建分页大小选择器
		const pageSizeSelect = pageSizeContainer.createEl("select", {
			cls: "page-size-select",
		});
		
		// 添加选项
		[10, 15, 20, 30, 50].forEach(size => {
			const option = pageSizeSelect.createEl("option", {
				text: size.toString(),
				value: size.toString(),
			});
			
			if (size === this.pageSize) {
				option.selected = true;
			}
		});
		
		// 添加选择事件
		pageSizeSelect.addEventListener("change", () => {
			this.pageSize = parseInt(pageSizeSelect.value);
			this.loadFileList(container, 1); // 重新加载第一页
		});

		// 上传按钮
		const uploadButton = uploadContainer.createEl("button", {
			text: i18n.t("file.uploadFile"),
			cls: "upload-button",
		});
		setIcon(uploadButton, "upload");

		// 上传按钮点击事件
		uploadButton.addEventListener("click", () => {
			this.uploadFile(container, page);
		});

		const response = await HttpUtils.get(
			`/fileList?page=${page}&pageSize=${this.pageSize}`,
			{}
		);
		const fileData = response.data;

		if (!fileData || !fileData.dataSet || fileData.dataSet.length === 0) {
			container.createEl("p", {
				text: i18n.t("error.noFiles"),
			});
			return;
		}

		// 创建文件列表容器
		const fileListContainer = container.createDiv({
			cls: "file-list-container",
		});

		// 创建文件列表
		const fileList = fileListContainer.createEl("ul", { cls: "file-list" });

		// 添加文件项
		fileData.dataSet.forEach((file: any) => {
			const fileItem = fileList.createEl("li", { cls: "file-item" });

			// 创建左侧信息区域
			const infoContainer = fileItem.createDiv({
				cls: "file-info-container",
			});

			// 如果是图片类型，添加缩略图预览
			if (file.mime && file.mime.startsWith("image/")) {
				const previewContainer = infoContainer.createDiv({
					cls: "file-preview-container",
				});
				const previewImg = previewContainer.createEl("img", {
					cls: "file-preview-img",
					attr: { src: file.url.trim() },
				});

				// 点击图片弹出大屏预览
				previewImg.addEventListener("click", (e) => {
					e.stopPropagation();
					this.showImageModal(file);
				});
			}

			// 创建文件信息区域
			const textContainer = infoContainer.createDiv({
				cls: "file-text-container",
			});

			// 文件标题
			textContainer.createEl("div", {
				text: file.title,
				cls: "file-title",
			});

			// 文件类型
			textContainer.createEl("div", {
				text: file.type ? file.type.toUpperCase() : "",
				cls: "file-type",
			});

			// 创建右侧信息区域
			const metaContainer = fileItem.createDiv({
				cls: "file-meta-container",
			});

			// 文件时间
			metaContainer.createEl("div", {
				text: file.createdAt || "",
				cls: "file-time",
			});

			// 操作按钮容器
			const actionContainer = metaContainer.createDiv({
				cls: "file-action-container",
			});
			
			// 复制URL按钮
			const copyButton = actionContainer.createEl("button", {
				cls: "file-action-button copy-button",
				attr: { title: i18n.t("file.copyUrl") },
			});
			setIcon(copyButton, "link");
			
			// 复制URL按钮点击事件
			copyButton.addEventListener("click", (e) => {
				e.stopPropagation();
				this.copyToClipboard(file.url, file.title);
			});

			// 删除按钮
			const deleteButton = actionContainer.createEl("button", {
				cls: "file-action-button delete-button",
				attr: { title: i18n.t("file.deleteFile") },
			});
			setIcon(deleteButton, "trash");

			// 删除按钮点击事件
			deleteButton.addEventListener("click", async (e) => {
				e.stopPropagation();
				if (confirm(`确定要删除文件 "${file.title}" 吗？`)) {
					await this.deleteFile(file.cid);
					this.loadFileList(container, page);
				}
			});
		});

		// 添加分页控件
		if (fileData.pages > 1) {
			const paginationContainer = container.createDiv({
				cls: "pagination-container",
			});

			// 上一页按钮
			if (fileData.page > 1) {
				const prevButton = paginationContainer.createEl("button", {
					text: "上一页",
					cls: "pagination-button",
				});
				prevButton.addEventListener("click", () => {
					this.loadFileList(container, fileData.page - 1);
				});
			}

			// 页码信息
			paginationContainer.createEl("span", {
				text: `${fileData.page}/${fileData.pages}`,
				cls: "pagination-info",
			});

			// 下一页按钮
			if (fileData.page < fileData.pages) {
				const nextButton = paginationContainer.createEl("button", {
					text: "下一页",
					cls: "pagination-button",
				});
				nextButton.addEventListener("click", () => {
					this.loadFileList(container, fileData.page + 1);
				});
			}
		}
	}

	renderTree(container: Element, nodes: any[], depth = 0) {
		const ul = container.createEl("ul", { cls: "tree-node-list" });

		for (const node of nodes) {
			const li = ul.createEl("li");
			const wrapper = li.createDiv({ cls: "tree-node-wrapper" });

			const indent = wrapper.createSpan({ cls: "tree-indent" });
			indent.style.paddingLeft = `${depth * 16}px`;

			if (node.children && node.children.length > 0) {
				const toggleIcon = wrapper.createEl("span", {
					text: node.isExpanded ? "▼" : "▶",
					cls: "tree-toggle-icon",
				});

				toggleIcon.addEventListener("click", (e) => {
					e.stopPropagation();
					node.isExpanded = !node.isExpanded;
					toggleIcon.setText(node.isExpanded ? "▼" : "▶");

					if (node.isExpanded) {
						const childContainer =
							li.querySelector(".tree-children") ||
							li.createEl("div", { cls: "tree-children" });
						childContainer.empty();
						this.renderTree(
							childContainer,
							node.children,
							depth + 1
						);
					} else {
						const childContainer =
							li.querySelector(".tree-children");
						if (childContainer) childContainer.remove();
					}
				});
			}

			wrapper.createEl("span", {
				text: node.name,
				cls: "tree-node-label",
			});

			if (node.count && node.count > 0) {
				const articleIcon = wrapper.createEl("span", {
					cls: "tree-article-icon",
				});
				setIcon(articleIcon, "newspaper");

				articleIcon.addEventListener("click", (e) => {
					e.stopPropagation();
					new BrowseArticles(this.app, node, this.currentTab).open();
				});
			}

			if (node.children && node.children.length > 0 && node.isExpanded) {
				const childContainer = li.createEl("div", {
					cls: "tree-children",
				});
				this.renderTree(childContainer, node.children, depth + 1);
			}
		}
	}

	// 显示图片大屏预览
	showImageModal(file: any) {
		const modal = new ImageModal(this.app, file);
		modal.open();
	}

	// 删除文件
	async deleteFile(cid: number) {
		try {
			const response = await HttpUtils.post("/deleteFile", { cid });
			if (response) {
				new Notice(i18n.t("file.deleteSuccess"));
				return true;
			}
			return false;
		} catch (error) {
			console.error(i18n.t("file.deleteError") + ":", error);
			new Notice(i18n.t("file.deleteError"));
			return false;
		}
	}
	
	// 复制URL到剪贴板
	copyToClipboard(url: string, fileName: string) {
		if (!url) {
			new Notice(i18n.t("file.copyFailed"));
			return;
		}
		
		// 创建临时文本区域
		const textarea = document.createElement('textarea');
		textarea.value = url;
		textarea.style.position = 'absolute';
		textarea.style.left = '-9999px';
		document.body.appendChild(textarea);
		
		// 选择并复制
		textarea.select();
		document.execCommand('copy');
		
		// 移除临时元素
		document.body.removeChild(textarea);
		
		// 显示成功提示
		new Notice(i18n.t("file.copySuccess", { fileName: fileName }));
	}

	// 上传文件
	uploadFile(container: Element, page: number) {
		// 创建隐藏的文件输入框
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.style.display = "none";
		document.body.appendChild(fileInput);

		// 监听文件选择事件
		fileInput.addEventListener("change", async () => {
			if (fileInput.files && fileInput.files.length > 0) {
				const file = fileInput.files[0];
				const buffer = await Util.file.fileToUint8Array(file);
				try {
					// 显示上传中提示
					new Notice(i18n.t("file.uploadingFile"));

					// 发送上传请求
					const response = await HttpUtils.post(
						"/upload?authorId=" + getSettings().User.uid,
						{
							file: buffer,
							fileName: file.name,
						}
					);

					if (response) {
						new Notice(i18n.t("file.uploadSuccess"));
						// 刷新文件列表
						this.loadFileList(container, page);
					}
				} catch (error) {
					new Notice(i18n.t("file.uploadError"));
				}
			}

			// 移除文件输入框
			document.body.removeChild(fileInput);
		});

		// 触发文件选择对话框
		fileInput.click();
	}

	async onClose() {
		// 清理资源
	}
}

export { CategoryView, VIEW_TYPE };
