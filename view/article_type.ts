// main.ts
import { ItemView, setIcon } from "obsidian";
import i18n from "../utils/i18n";
import { getSettings } from "../main";
import { HttpUtils } from "../utils/request";
import { Util } from "../utils/util";
import { BrowseArticles } from "./browse_articles";

const VIEW_TYPE = "article-view";

class CategoryView extends ItemView {
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
			tabEl.addEventListener("click", () => {
				if (tab.key == "all") {
					new BrowseArticles(
						this.app,
						{ name: i18n.t("field.allArticle") },
						'all'
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
		} else if (tabKey === "tag") {
			const response = await HttpUtils.get("/tags", {});
			data = Util.treeUtil.generateTreeData(
				response.data,
				"mid",
				"parent"
			);
		}

		const treeContainer = container.createDiv({ cls: "tree-container" });
		this.renderTree(treeContainer, data);
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

	async onClose() {
		// 清理资源
	}
}

export { CategoryView, VIEW_TYPE };
