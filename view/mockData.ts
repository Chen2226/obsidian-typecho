// mockData.ts

export const mockTreeData = [
    {
      id: '1',
      label: '根节点',
      isExpanded: true,
      count: 5, // 文件数
      children: [
        {
          id: '1-1',
          label: '子节点1',
          count: 0, // 无文件
          isExpanded: false,
          children: [
            { id: '1-1-1', label: '孙节点A', count: 3 },
            { id: '1-1-2', label: '孙节点B' }, // 未设置 count，默认视为 0
          ],
        },
        {
          id: '1-2',
          label: '子节点2',
          count: 2,
          isExpanded: true,
          children: [
            { id: '1-2-1', label: '孙节点C', count: 0 },
          ],
        },
      ],
    },
  ];