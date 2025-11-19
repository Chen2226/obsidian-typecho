import { getSettings } from "main";
import { Notice, Editor, TFolder, App } from "obsidian";
import { HttpUtils } from "./request";

// 定义树节点接口
export interface TreeNode {
	id?: number;
	[key: string]: any;
	children: TreeNode[];
	parent?: TreeNode;
}

export const Util = {
	// tree
	treeUtil: {
		generateTreeData: function <T extends Record<string, any>>(
			data: T[],
			nodeId: keyof T,
			parentNodeKey: keyof T
		): TreeNode[] {
			// 将数据存储为以 nodeId 为 KEY 的 map 索引数据列
			const map: Record<string | number, TreeNode> = {};
			data.forEach((item) => {
				(item as unknown as TreeNode).children = [];
				map[item[nodeId] as string | number] =
					item as unknown as TreeNode;
			});

			// 遍历数据，构建树形结构
			const rootNodes: TreeNode[] = [];
			data.forEach((item) => {
				const parent = map[item[parentNodeKey] as string | number];
				if (parent) {
					parent.children.push(item as unknown as TreeNode);
					(item as unknown as TreeNode).parent = parent;
				} else {
					rootNodes.push(item as unknown as TreeNode);
				}
			});

			return rootNodes;
		},
		// 在树形结构中查找指定id节点
		findNodeInTree: function (
			tree: TreeNode[],
			id: number
		): TreeNode | undefined {
			for (let i = 0; i < tree.length; i++) {
				if (tree[i].id === id) {
					return tree[i];
				} else {
					if (tree[i].children) {
						const node = this.findNodeInTree(tree[i].children, id);
						if (node) {
							return node;
						}
					}
				}
			}
			return undefined;
		},
		// 在树形结构中查找指定id节点的上一个父节点
		findParentNodeInTree: function (
			tree: TreeNode[],
			id: number
		): TreeNode | null {
			// Id等于0的节点为根节点，没有父节点
			// id找到了的话，往上找一层父节点返回
			if (id === 0) {
				return null;
			}
			for (let i = 0; i < tree.length; i++) {
				if (tree[i].id === id) {
					return tree[i].parent || null;
				} else {
					if (tree[i].children) {
						const node = this.findParentNodeInTree(
							tree[i].children,
							id
						);
						if (node) {
							return node;
						}
					}
				}
			}
			return null;
		},
	},
	hash: {
		simpleHash(str: string) {
			let hash = 0;
			for (let i = 0; i < str.length; i++) {
				const char = str.charCodeAt(i);
				hash = (hash << 5) - hash + char;
				hash |= 0; // Convert to 32bit integer
			}
			// 转成16进制并取最后6位
			return (hash >>> 0).toString(16).padStart(8, "0").slice(-6);
		},
	},
	file: {
		// 将file转换成Uint8Array
		async fileToUint8Array(file: File | Blob) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					const arrayBuffer = reader.result as ArrayBuffer;
					resolve(new Uint8Array(arrayBuffer));
				};
				reader.onerror = reject;
				reader.readAsArrayBuffer(file);
			});
		},
	},
	url: {
		extractDomain(url: string) {
			const domain = url.match(/https?:\/\/(www\.)?([^\s/]+)/);
			if (domain) {
				return domain[0];
			}
			return "";
		},
	},
	upload: {
		async handleImagePaste(
			app: App,
			editor: Editor,
			clipboardData: DataTransfer
		): Promise<boolean> {
			if (!getSettings().enablePasteUpload) {
				return false;
			}

			const items = Array.from(clipboardData.items || []);
			const imageItem = items.find((item) =>
				item.type.startsWith("image/")
			);
			if (!imageItem) return false;

			console.log("📥 Detected image paste, handling...", imageItem.type);

			try {
				const blob = imageItem.getAsFile();
				if (!blob) return false;

				const ext =
					blob.type.split("/")[1]?.replace(/;.*/, "") || "png";
				const fileName = `paste-${Date.now()}.${ext}`; // 👈 记住这个 fileName

				const notice = new Notice(`📥 正在上传图片：${fileName}`, 0);

				const buffer = await Util.file.fileToUint8Array(blob);

				const response = await HttpUtils.post(
					"/upload?authorId=" + getSettings().User.uid,
					{
						file: buffer,
						fileName: fileName,
					}
				);

				notice.hide();

				if (!response?.data?.url) {
					new Notice("❌ 图片上传失败", 3000);
					return true;
				}

				// ✅ 新增：删除 Obsidian 原生粘贴产生的 ![[fileName]] 或 ![](fileName)
				try {
					const cursor = editor.getCursor();
					const line = editor.getLine(cursor.line);
					// 构造可能的原生粘贴内容（Obsidian 偏好双括号）
					const nativeEmbed1 = `![[${blob.name}]]`;
					const nativeEmbed2 = `![](${blob.name})`;
					const nativeEmbed3 = `![image](${blob.name})`; // 少数情况

					// 从光标位置往前找（原生粘贴通常在当前光标处插入）
					const startPos = Math.max(
						0,
						cursor.ch - nativeEmbed1.length - 20
					);
					const segment = line.substring(startPos, cursor.ch + 20);

					let toDelete = null;
					if (segment.includes(nativeEmbed1)) {
						toDelete = nativeEmbed1;
					} else if (segment.includes(nativeEmbed2)) {
						toDelete = nativeEmbed2;
					} else if (segment.includes(nativeEmbed3)) {
						toDelete = nativeEmbed3;
					}

					if (toDelete) {
						// 找到匹配项，计算其在行内的位置
						const idx = line.indexOf(toDelete, startPos);
						if (idx !== -1) {
							editor.replaceRange(
								"",
								{ line: cursor.line, ch: idx },
								{ line: cursor.line, ch: idx + toDelete.length }
							);
							// 修正光标位置（恢复到删除后的位置）
							editor.setCursor({ line: cursor.line, ch: idx });
							console.log(`🧹 已删除原生粘贴占位符: ${toDelete}`);
						}
					}
				} catch (e) {
					console.warn(
						"Failed to remove native paste placeholder:",
						e
					);
					// 不中断主流程
				}

				const domain = Util.url.extractDomain(getSettings().Host);
				const imageUrl =
					(domain.endsWith("/") ? domain : domain + "/") +
					response.data.url;

				const markdownImage = `![](${imageUrl})`;
				editor.replaceSelection(markdownImage);

				// 上传成功后，检查并删除当前目录下的同名本地文件
				try {
					const activeFile = app.workspace.getActiveFile();
					if (activeFile) {
						const parentDir = app.vault.getAbstractFileByPath(
							activeFile.parent?.path || "/"
						);

						if (parentDir && parentDir instanceof TFolder) {
							const attachmentPath =
								(app.vault as any).config
									?.attachmentFolderPath || "";
							let delFilepath = blob.name;
							if (attachmentPath) {
								delFilepath = attachmentPath + "/" + blob.name;
								delFilepath = delFilepath.substring(1);
							}
							console.log(delFilepath);
							let existingFile =
								app.vault.getAbstractFileByPath(delFilepath);
							console.log(existingFile);
							if (existingFile) {
								await app.vault.delete(existingFile);
								console.log(
									`🗑️ 已删除本地重复文件: ${delFilepath}`
								);
							}
						}
					}
				} catch (delErr) {
					console.warn(
						"Cleanup local duplicate file failed:",
						delErr
					);
					// 不中断主流程，静默失败
				}

				new Notice("✅ 图片已上传并插入", 2000);
				return true;
			} catch (err) {
				console.error("Paste image upload failed:", err);
				new Notice("❌ 粘贴上传图片失败，请重试", 3000);
				return true;
			}
		},
	},
};
