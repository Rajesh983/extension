const vscode = require("vscode");
const { posix } = require('path');

let total = 0;
let count = 0;
let files = [];

class DataProvider {


   constructor (filesList) {
        // files=[];

        //vscode.window.registerFileDecorationProvider(this)
            const filesObj = {
                displayName: "Files",
                position: filesList,
            }
        this.treeFiles = filesObj;
        this.fileTreeItems = this.convertFilesToTreeItems();
    
        
  }

   _onDidChangeTreeData= new vscode.EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

    refresh() {
        this._onDidChangeTreeData.fire();
    }

  // provideFileDecoration(uri) {
  //   return {
  //     badge: "~",
  //     tooltip: "User count"
  //   };
  // }


  gettingUpdatedFilesList(filesList){
    const filesObj = {
      displayName: "Files",
      position: filesList,
  }
  this.treeFiles = filesObj
  this.fileTreeItems = this.convertFilesToTreeItems();
  
  }


  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (element) {
      return element.getPositionDetails();
    } else {
      return this.fileTreeItems;
    }
    
  }

 

  convertFilesToTreeItems() {
    let array = [];
      array.push(
        new fileTreeItem(this.treeFiles, vscode.TreeItemCollapsibleState.Expanded)
      );
    return array;
  }

  
 

}

class fileTreeItem {
  // we must provide the property label for it to show up the tree view
  constructor(displayDetails, collapsibleState) {
    this.displayDetails = displayDetails;
    this.label = `${displayDetails.displayName}`;
    this.collapsibleState = collapsibleState;
    this.positionDetails = [];
    this.convertPositionToTreeItems();
  }

  // Convert each property in displayDetails.position to a TreeItem which is treated as child of the file tree item
  convertPositionToTreeItems() {
    if (this.displayDetails.position) {
        const res = this.displayDetails.position.map((files)=> new TreeItem(files.name ,files.filePath))
        this.positionDetails = res;
    }
  }

  getPositionDetails() {
    return this.positionDetails;
  }
}

class TreeItem extends vscode.TreeItem {
    constructor(label,filePath) {
        super(label);
        this.resourceUri = vscode.Uri.file(filePath)
        const command = {
            "command": "open.file",
            "title": "Open file",
            arguments : [filePath]
          }

          this.command = command;
    }

   
  
}

module.exports = DataProvider;
