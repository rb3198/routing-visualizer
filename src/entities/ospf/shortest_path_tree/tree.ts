import { IPrintable } from "src/types/common/printable";

export class TreeNode<T> {
  data: T;
  children: TreeNode<T>[];
  parents: Set<TreeNode<T>>;
  constructor(data: T, children: TreeNode<T>[], parent?: TreeNode<T>) {
    this.data = data;
    this.children = children;
    this.parents = new Set([]);
    parent && this.parents.add(parent);
  }
}

export class Tree<T extends IPrintable> {
  root: TreeNode<T>;
  nodeMap: Map<string, T>;
  constructor(rootData: T) {
    this.root = new TreeNode(rootData, []);
    this.nodeMap = new Map();
    this.nodeMap.set(this.root.data.toString(), this.root.data);
  }

  insert(parent: TreeNode<T>, data: T) {
    const node = new TreeNode(data, [], parent);
    parent.children.push(node);
    this.nodeMap.set(data.toString(), data);
    return node;
  }

  insertNode(node: TreeNode<T>) {
    const { parents } = node;
    if (!parents.size) {
      console.error("No parent found in the node to be inserted in the tree");
      return;
    }
    for (let parent of parents) {
      parent.children.push(node);
    }
    this.nodeMap.set(node.data.toString(), node.data);
  }

  has = (nodeData: T) => this.nodeMap.has(nodeData.toString());

  bfsTraversal = () => {
    const queue: TreeNode<T>[] = [];
    const traversed: Set<TreeNode<T>> = new Set();
    queue.push(this.root);
    while (queue.length) {
      const ptr = queue.shift();
      if (!ptr) {
        break;
      }
      traversed.add(ptr);
      queue.push(...ptr.children);
    }
    return traversed;
  };

  getNode = (nodeData: T) => this.nodeMap.get(nodeData.toString());
}
