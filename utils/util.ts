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
		async fileToUint8Array(file: File): Promise<Uint8Array> {
			return new Uint8Array(await file.arrayBuffer());
		},
	}
};
