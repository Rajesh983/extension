const vscode = require("vscode");
const axios = require("axios");
const view = require("./view");
const path = require("path");
const fs = require("fs");
const { posix } = require('path');

const DataProvider = require("./dataProvider.js");



/**
 * @param {vscode.ExtensionContext} context
 *
 *
 * fhx7pcw4ro5zdwav4csygacyjcfcqld56o6wwikdznforskrzpdq
 */

 let total = 0;
 let count = 0;
 let files = [];
 let gitEnabled = false;
 let filesList;

 async function countAndTotalOfFilesInFolder(folder) {
  //console.log({folder})
  for (const [name, type] of await vscode.workspace.fs.readDirectory(folder)) {
       //console.log({name,type})
      if (type === vscode.FileType.File && name[0] !== '.') {
          const filePath = posix.join(folder.path, name);
          files.push({filePath,name})
          const stat = await vscode.workspace.fs.stat(folder.with({ path: filePath }));
          total += stat.size;
          count += 1;
      }else if (type === vscode.FileType.Directory)  {
          if(name[0] !== '.'){
          const filePath = posix.join(folder.path, name);
          const folderUri = vscode.Uri.file(filePath); 
          const folderPath = posix.dirname(folderUri.path);
          const subFolder = folderUri.with({ path: filePath });
          //console.log({filePath,folderPath,folderUri})
          await countAndTotalOfFilesInFolder(subFolder);
          //console.log({allFiles})
          }
          if (name === '.git'){
            gitEnabled = true;
          }
      }
  }
  return { total, count , files ,gitEnabled };
}


async function activate(context) {

  // Adding files to our extension dynamically

  context.subscriptions.push(
    vscode.workspace.onDidCreateFiles(async(e) => {
      console.log({created:e})
      files = [];
      const filesList = await countAndTotalOfFilesInFolder(vscode.workspace.workspaceFolders[0].uri)
      myData.gettingUpdatedFilesList(filesList)
      myData.refresh();
      
      view.badge = {value:filesList.length}
    })
  )

  //making API call

  const res = await axios.get("https://jsonplaceholder.typicode.com/photos");

  const updatedData = res.data.map((eachPhoto) => {
    return {
      label: eachPhoto.title.slice(0, 7),
      detail: eachPhoto.title,
      link: eachPhoto.thumbnailUrl,
    };
  });

  // registering commands

  let disposable = vscode.commands.registerCommand(
    "alpine.search",
    async function () {
      const todo = await vscode.window.showQuickPick(updatedData, {
        matchOnDetail: true,
      });

      if (todo == null) return;

      vscode.env.openExternal(todo.link);
    }
  );

  let openFileCmd = vscode.commands.registerCommand(
    "open.file",
    async function (args) {
      vscode.window.showInformationMessage(args);
      try {
        let uri = vscode.Uri.file(args);
        //console.log({uri})
        await vscode.commands.executeCommand("vscode.openFolder", uri);
      } catch (error) {
        console.log(error);
      }
    }
  );


  // accessing git extension from our extension
 

  vscode.extensions.onDidChange(function(event) { console.log("Event happened: " + event); });

  const gitExtension =  vscode.extensions.getExtension('vscode.git').exports;
  const api = gitExtension.getAPI(1);
  
  const repo = api.repositories[0];

  const changes = await repo.diffWithHEAD();

  
  if(changes.length === 0){
    const latestFiles = await countAndTotalOfFilesInFolder(vscode.workspace.workspaceFolders[0].uri)
    filesList = latestFiles.files
  }else{
    const updatedFilesList =  changes.map(eachChange => {
      const filePath = eachChange.uri.path 
      const name = filePath.split('/').slice(-1)[0];
      return {filePath,name}
    })
filesList = updatedFilesList
  }

  // creating treeView(to show files in our plugin)

    let myData = new DataProvider(filesList);
  
  vscode.window.registerTreeDataProvider(
    'exampleTreeview',
    myData
  );
  let view = vscode.window.createTreeView("exampleTreeview", {
    treeDataProvider: myData,
  });
  view.badge = { value: filesList.length };
  //    view.message = "This is message"
  //view.onDidChangeSelection( e => click(e.selection));
  context.subscriptions.push(view);

  context.subscriptions.push(disposable);

  context.subscriptions.push(
    vscode.commands.registerCommand("alpine.show", () => {
      vscode.window.showInformationMessage("alpine.show triggerred.....");
    })
  );

  //Adding WebView

  // Create and show panel
  const panel = vscode.window.createWebviewPanel(
    "webview-1",
    "Hello World View",
    vscode.ViewColumn.One,
    {}
  );

  // And set its HTML content
  panel.webview.html = getWebviewContent();

  context.subscriptions.push(panel);

  const panel2 = vscode.window.createWebviewPanel(
    "webview-2",
    "Second View",
    vscode.ViewColumn.One,
    {}
  );

  // And set its HTML content
  panel2.webview.html = getWebviewContent();

  context.subscriptions.push(panel2);

  const panel3 = vscode.window.createWebviewPanel(
    "webview-2",
    "Third View",
    vscode.ViewColumn.One,
    {}
  );

  // And set its HTML content
  panel3.webview.html = getWebviewContent();

  context.subscriptions.push(panel3);

  // making background API

  function makeAPICall(triggerCmd) {
    axios
      .post(
        "http://127.0.0.1:3000/vsextension",
        vscode.workspace.getConfiguration(),
        { "Content-Type": "application/json" }
      )
      .then((response) => {
        // console.log(response?.status
        if (response?.status === 200) {
          // response.send("reached.....")
          if (!triggerCmd) {
            vscode.window.showInformationMessage(
              "Background API has been triggerred...."
            );
          } else {
            vscode.window.showInformationMessage("API has been invoked....");
          }
        } else {
          // Unexpected response
          console.log(response);
          vscode.window.showErrorMessage(response);
        }
      })
      .catch((error) => {
        // API has returned an error
        // const strError = `Taxi for Email: ${error.response.status} - ${error.response.statusText}`;
        console.log(error);
        // vscode.window.showErrorMessage(strError);
      });
  }
  makeAPICall();

  // Attaching API call to command

  context.subscriptions.push(
    vscode.commands.registerCommand("invoke-api", () => {
      makeAPICall("triggerred");
    })
  );
}

// This method is called when your extension is deactivated
async function deactivate() {
  await axios.get("http://127.0.0.1:3000/sample")
	console.log("deactivated")
}

function getWebviewContent() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>

	  <style>
table, th, td {
  border:1px solid white;
}
</style>
  </head>
  <body>
	  <h1>Hello World</h1>

<h2>TH elements define table headers</h2>

<table style="width:100%">
  <tr>
    <th>Person 1</th>
    <th>Person 2</th>
    <th>Person 3</th>
  </tr>
  <tr>
    <td>Emil</td>
    <td>Tobias</td>
    <td>Linus</td>
  </tr>
  <tr>
    <td>16</td>
    <td>14</td>
    <td>10</td>
  </tr>
</table>

<p>sample table</p>

  </body>
  </html>`;
}
//
module.exports = {
  activate,
  deactivate,
};
