/**
 * @fileOverview  Contains various view functions for the use case listDocuments
 * @author Gerd Wagner
 */

 pl.view.checkUpdates = {
  setupUserInterface: function () {
    // load all Document objects
    Document.scanDir();
    Document.downloadAll();
  }
};