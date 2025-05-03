import { App, Modal } from "obsidian";

export class ArticlePreview extends Modal {
	private animationTimeout: number | null = null;
    private htmlContent: string;

	constructor(app: App, htmlContent: string) {
		super(app);
		this.htmlContent = htmlContent;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("article-preview-modal");

		// 初始状态：透明 + 缩小
		contentEl.addClass("fade-enter");
		contentEl.innerHTML = this.htmlContent;

		// 延迟触发进入动画，确保浏览器能识别初始状态
		requestAnimationFrame(() => {
			contentEl.removeClass("fade-enter");
			contentEl.addClass("fade-enter-active");
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.addClass("fade-exit");
		contentEl.removeClass("fade-enter-active");

		// 设置动画持续时间，确保动画完成后再清空内容
		this.animationTimeout = window.setTimeout(() => {
			contentEl.empty();
		}, 300); // 与 CSS 中的 transition 时间匹配
	}
}
