// main.ts
import { ItemView, setIcon } from "obsidian";
import i18n from "../utils/i18n";
import { getSettings } from "../main";
import { HttpUtils } from "../utils/request";
import { Util } from "../utils/util";
import { BrowseArticles } from "./browse_articles";

const VIEW_TYPE = "category-view";
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

		// 标题
		container.createEl("h4", { text: i18n.t("field.category") });

		const refreshButton = container.createEl("button", {
			cls: "refresh-button",
		});
		setIcon(refreshButton, "rotate-ccw");
		refreshButton.addEventListener("click", () => {
			this.initCategory(container);
		});

		this.initCategory(container);
	}

	async initCategory(container: Element) {
		for (let i = 0; i < container.children.length; i++) {
			if (i != 0 && i != 1) {
				container.children[i].remove();
			}
		}

		// 校验是否选择操作用户
		if (!getSettings().User) {
			container.createEl("p", {
				text: i18n.t("error.noTypechoUser"),
			});
		} else {
			const response = await HttpUtils.get("/categories", {});
			const data = Util.treeUtil.generateTreeData(
				response.data,
				"mid",
				"parent"
			);
			// 渲染树结构
			const treeContainer = container.createDiv({
				cls: "tree-container",
			});
			this.renderTree(treeContainer, data);
		}
	}
	renderTree(container: Element, nodes: any[], depth = 0) {
		const ul = container.createEl("ul", { cls: "tree-node-list" });

		for (const node of nodes) {
			const li = ul.createEl("li");
			const wrapper = li.createDiv({ cls: "tree-node-wrapper" });

			// 缩进
			const indent = wrapper.createSpan({ cls: "tree-indent" });
			indent.style.paddingLeft = `${depth * 16}px`;

			// 判断并添加展开/折叠图标
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

			const linkIcon = wrapper.createEl("span", {
				cls: "tree-link-icon",
			});
			setIcon(linkIcon, "link");
			linkIcon.addEventListener("click", (e) => {
				e.stopPropagation();
				window.open(node.url);
			});
			// 显示节点标签
			wrapper.createEl("span", {
				text: node.name,
				cls: "tree-node-label",
			});

			// 判断并添加文件图标（仅当 count > 0）
			if (node.count && node.count > 0) {
				const articleIcon = wrapper.createEl("span", {
					cls: "tree-article-icon",
				});
				setIcon(articleIcon, "newspaper");

				articleIcon.addEventListener("click", (e) => {
					new BrowseArticles(this.app, node).open();
				});
			}

			// 初始展开
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
