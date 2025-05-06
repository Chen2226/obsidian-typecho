import { App, Modal, htmlToMarkdown, setIcon } from "obsidian";
import { HttpUtils } from "../utils/request";
import i18n from "../utils/i18n";
import { ArticlePreview } from "./article_preview";

export class BrowseArticles extends Modal {
	data: any;
	currentPage = 1;
	totalPages = 1;
	contentContainer: HTMLElement;
	type: string;

	constructor(app: App, data: any,type: string) {
		super(app);
		this.data = data;
		this.type = type;
		this.modalEl.addClass("browse-articles-modal");
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		const header = contentEl.createEl("div", { cls: "modal-header" });
		header.createEl("h2", {
			text: `${this.data.name}-${i18n.t("field.article")}`,
		});

		// 创建内容容器
		this.contentContainer = contentEl.createEl("div", {
			cls: "modal-content",
		});

		await this.loadPage(this.currentPage);
	}

	async loadPage(page: number) {
		this.contentContainer.empty();
		const loadingEl = this.contentContainer.createEl("div", {
			text: i18n.t("common.loading"),
		});
		try {
			const params = {
				page: page.toString(),
				pageSize: "10",
				filterType: this.type ?? '',
				filterSlug: this.data.slug ?? '',
			};

			let url = "/posts?";
			for (const key in params) {
				url += `${key}=${params[key as keyof typeof params]}&`;
			}

			const response = await HttpUtils.get(url);

			if (
				response.status === "success" &&
				response.data?.dataSet?.length > 0
			) {
				loadingEl.setText("");
				this.totalPages = response.data.pages;
				this.currentPage = page;
				response.data.dataSet.forEach((post: any) => {
					const postEl = this.contentContainer.createEl("div", {
						cls: "browse-article-item",
					});
					// 标题部分
					const titleEl = postEl.createEl("div", {
						cls: "article-title",
					});
					titleEl.createEl("a", {
						text: post.title,
						href: post.permalink,
						attr: { target: "_blank" },
					});

					// 日期部分
					postEl.createEl("div", {
						cls: "article-date",
						text: `${post.year}-${post.month}-${post.day}`,
					});

					// 保存本地
					const downloadIcon = titleEl.createEl("span", {
						cls: "download-icon",
					});
					setIcon(downloadIcon, "hard-drive-download");
					downloadIcon.addEventListener("click", async (e) => {
						const content = htmlToMarkdown(post.digest).toString();
						// 保存本地根目录
						const rootPath = this.app.vault.getRoot().path;
						const fileName = `${post.title}.md`;
						const filePath = `${rootPath}${fileName}`;

						let file = this.app.vault.getFileByPath(fileName);
						if (file) {
							await this.app.vault.modify(file, content);
						} else {
							await this.app.vault
								.create(filePath, content)
								.then((newfile) => {
									file = newfile;
								});
						}

						// 打开窗口浏览文件
						if (file) {
							this.app.workspace.openLinkText(
								file.path,
								"",
								true
							);
						}
						this.close();
					});

					// 点击预览内容
					postEl.addEventListener("click", (e) => {
						const target = e.target as HTMLElement;
						if (target.closest("a") || target.closest("svg")) {
							return;
						}
						e.stopPropagation();
						e.preventDefault();
						new ArticlePreview(this.app, post.digest).open();
					});
				});

				// 清除旧的分页控件再重新渲染
				this.paginationEl?.remove();
				this.renderPagination();
			} else {
				this.contentContainer.createEl("p", {
					cls: "no-articles",
					text: i18n.t("field.no_articles_found"),
				});
			}
		} catch (error) {
			loadingEl.setText("");
			this.contentContainer.createEl("p", {
				text: i18n.t("common.error_occurred"),
			});
			console.error("Failed to fetch articles:", error);
		}
	}

	private paginationEl: HTMLElement | null = null;
	renderPagination() {
		// 先清除旧的分页控件
		this.paginationEl?.remove();

		// 创建新的分页控件并保存引用
		this.paginationEl = this.contentContainer.createEl("div", {
			cls: "pagination",
		});

		const prevBtn = this.paginationEl.createEl("button", {
			text: "上一页",
		});
		prevBtn.disabled = this.currentPage <= 1;
		prevBtn.addEventListener("click", () => {
			if (this.currentPage > 1) {
				this.loadPage(this.currentPage - 1);
			}
		});

		this.paginationEl.createEl("span", {
			text: `第 ${this.currentPage} 页 / 共 ${this.totalPages} 页`,
		});

		const nextBtn = this.paginationEl.createEl("button", {
			text: "下一页",
		});
		nextBtn.disabled = this.currentPage >= this.totalPages;
		nextBtn.addEventListener("click", () => {
			if (this.currentPage < this.totalPages) {
				this.loadPage(this.currentPage + 1);
			}
		});
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
