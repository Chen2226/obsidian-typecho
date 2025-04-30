// main.ts
import { ItemView } from "obsidian";
import i18n from "../utils/i18n";
import { mockTreeData } from "./mockData";

const VIEW_TYPE = "article-view";

class ArticleView extends ItemView {
	getViewType(): string {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "我的插件面板";
	}

	getIcon(): string {
		return "typecho";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		// 标题
		container.createEl("h4", { text: i18n.t("field.article") });

		// 渲染树结构
		const treeContainer = container.createDiv({ cls: "tree-container" });
		this.renderTree(treeContainer, mockTreeData);
	}

	renderTree(container: HTMLElement, nodes: any[], depth = 0) {
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

				// 判断并添加文件图标（仅当 count > 0）
				if (node.count && node.count > 0) {
					const fileIcon = wrapper.createEl("span", {
						cls: "tree-file-icon",
					});
					fileIcon.setAttr("aria-label", `含 ${node.count} 个文件`);
					fileIcon.setText("📄"); // 替换为 Obsidian 图标："file"
				}
			}

			// 显示节点标签
			const label = wrapper.createEl("span", {
				text: node.label,
				cls: "tree-node-label",
			});

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

export { ArticleView, VIEW_TYPE };
