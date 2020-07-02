import {
  Event,
  EventEmitter,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from "vscode";
import { QueueItem } from "../constant/type";
const { unsortInplace } = require("array-unsort");

export class QueueProvider implements TreeDataProvider<QueueItemTreeItem> {
  private static instance: QueueProvider;

  private _onDidChangeTreeData: EventEmitter<
    QueueItemTreeItem | undefined | void
  > = new EventEmitter<QueueItemTreeItem | undefined | void>();

  readonly onDidChangeTreeData: Event<
    QueueItemTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private songs: Map<number, QueueItemTreeItem> = new Map<
    number,
    QueueItemTreeItem
  >();

  constructor() {}

  static getInstance(): QueueProvider {
    return this.instance || (this.instance = new QueueProvider());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: QueueItemTreeItem): TreeItem {
    return element;
  }

  getChildren(_element?: QueueItemTreeItem): QueueItemTreeItem[] {
    return [...this.songs.values()];
  }

  clear() {
    this.songs.clear();
  }

  random() {
    this.songs = new Map(unsortInplace([...this.songs]));
  }

  top(element: QueueItemTreeItem, callback?: Function) {
    this.shift([...this.songs.keys()].indexOf(element.item.id), callback);
  }

  shift(index: number, callback?: Function) {
    const previous = [...this.songs];
    while (index < 0) {
      index += previous.length;
    }
    const current = previous.slice(index).concat(previous.slice(0, index));
    this.songs = new Map(current);
    if (callback) {
      callback(current);
    }
  }

  add(elements: QueueItemTreeItem[]) {
    for (const i of elements) {
      this.songs.set(i.item.id, i);
    }
  }

  delete(id: number) {
    this.songs.delete(id);
  }
}

export class QueueItemTreeItem extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly item: QueueItem,
    public readonly pid: number,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }

  get tooltip(): string {
    return ``;
  }

  get description(): string {
    return this.item.arName;
  }

  iconPath = new ThemeIcon("zap");

  contextValue = "QueueItemTreeItem";
}
