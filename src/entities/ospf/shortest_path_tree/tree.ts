export class TreeNode<T> {
  data: T;
  children: TreeNode<T>[];
  parent?: TreeNode<T>;
  constructor(data: T, children: TreeNode<T>[], parent?: TreeNode<T>) {
    this.data = data;
    this.children = children;
    this.parent = parent;
  }
}

export class Tree<T> {
  root: TreeNode<T>;
  constructor(rootData: T) {
    this.root = new TreeNode(rootData, []);
  }

  insert(parent: TreeNode<T>, data: T) {
    const node = new TreeNode(data, [], parent);
    parent.children.push(node);
    return node;
  }
}
