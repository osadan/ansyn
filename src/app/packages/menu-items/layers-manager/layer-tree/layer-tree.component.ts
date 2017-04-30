import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { OnInit, SimpleChanges, AfterViewInit } from '@angular/core';
import { NodeActivationChangedEventArgs } from '../event-args/node-activation-changed-event-args';
import { TreeActionMappingService } from '../services/tree-action-mapping.service';
import { TreeNode, TreeComponent } from 'angular-tree-component';
import { ILayerTreeNode } from '@ansyn/core';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-layer-tree',
  templateUrl: './layer-tree.component.html',
  styleUrls: ['./layer-tree.component.scss'],
  providers: [TreeActionMappingService]
})

export class LayerTreeComponent implements OnInit, AfterViewInit {

  private options;

  @ViewChild(TreeComponent) treeComponent: TreeComponent;

  @Input() source: Observable<ILayerTreeNode[]>;

  @Output() public nodeActivationChanged = new EventEmitter<NodeActivationChangedEventArgs>();

  constructor(private actionMappingService: TreeActionMappingService, private myElement: ElementRef) { }

  ngOnInit() {
    this.options = {
      getChildren: () => new Promise((resolve, reject) => { }),
      actionMapping: this.actionMappingService.getActionMapping(),
      useVirtualScroll: true,
      nodeHeight: 24
    };
  }

  ngAfterViewInit() {
    this.treeComponent.treeModel.virtualScroll.setViewport( this.myElement.nativeElement );
  }

  private onDivClicked(event, node: TreeNode): void {
    if (event.target.type === 'checkbox') {
      return;
    }
    this.onCheckboxClicked(null, node);
    event.stopPropagation();
  }

  private onSpanClicked(event, node: TreeNode): void {
    this.onCheckboxClicked(null, node);
    event.stopPropagation();
  }

  private onCheckboxClicked(event, node: TreeNode): void {
    let newCheckValue: boolean = !node.data.isChecked;
    let parentNode: TreeNode = node.realParent;

    node.data.isChecked = newCheckValue;
    if (node.isLeaf) {
      this.nodeActivationChanged.emit(new NodeActivationChangedEventArgs(node, newCheckValue));
    }

    this.bubbleActivationDown(node, newCheckValue);
    this.bubbleActivationUp(parentNode, newCheckValue);
    this.bubbleIndeterminate(node.realParent);
  }

  private bubbleActivationDown(node: TreeNode, activationValue: boolean) {

    node.children.filter(child => child.data.isChecked !== activationValue).forEach(child => {
      child.data.isChecked = activationValue;
      if (child.isLeaf) {
        this.nodeActivationChanged.emit(new NodeActivationChangedEventArgs(child, activationValue));
      }
      this.bubbleActivationDown(child, activationValue);
    });

    if (node.isLeaf) {
      this.bubbleIndeterminate(node.realParent);
    }
  }

  private bubbleActivationUp(node: TreeNode, newValue: boolean): void {
    if (!node) {
      return;
    }

    if ((newValue && node.children.every(child => child.data.isChecked === newValue)) ||
      (!newValue && node.children.some(child => child.data.isChecked === newValue))) {
      node.data.isChecked = newValue;
      this.bubbleActivationUp(node.realParent, newValue);
    }
  }

  private bubbleIndeterminate(node: TreeNode): void {
    if (!node) {
      return;
    }
    node.data.isIndeterminate = this.isNodeIndeterminate(node);
    if (node.realParent) {
      this.bubbleIndeterminate(node.realParent);
    }
  }

  private isNodeIndeterminate(node: TreeNode): boolean {
    if (!node.hasChildren) {
      return false;
    }

    if (node.children.every(child => child.data.isChecked) || node.children.every(child => !child.data.isChecked)) {
      return false;
    } else {
      return true;
    }
  }
};



