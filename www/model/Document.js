//The directory to store data
var store;

//Used for status updates
var $status;

function onAppReady() {
    if( navigator.splashscreen && navigator.splashscreen.hide ) {   // Cordova API detected
        navigator.splashscreen.hide() ;
    }
}

function Document(files) {
  this.name = files.name;
};
/***********************************************
***  Class-level ("static") properties  ********
************************************************/
Document.instances = {};  // initially an empty associative array

/*********************************************************
***  Class-level ("static") storage management methods ***
**********************************************************/

Document.documentFile = function (NewFile) {
  var document = new Document(NewFile);
  return document;
};

Document.returnDocument = function(keys){
   return keys; 
};

//check internet connection
Document.checkConnection = function(){

    if(navigator.network.connection.type == Connection.NONE){
        alert("Please enable internet connection");
    }else{ 
         
    }
};

//check last file name zip on server base on response
Document.checkUpdate = function(url){

     var result = null;
     $.ajax({
        url: url,
        type: 'get',
        async: false,
        success: function(data) {
            result = data;
        }
     });
     return result;
};


//List Documents covers
(function(){
    document.addEventListener("deviceready", function() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
           //console.log(fileSystem.root);
           fileSystem.root.getDirectory("Android/data/com.intel.appx.pdf_viewer.xwalk15/files/img/", {
                       create: true
                   }, function(directory) {    
                        var directoryReader = directory.createReader();
                        directoryReader.readEntries(function(entries) { 
                            var key, keys = Object.keys(entries);
                            console.log(entries);
                            console.log(entries.length +" document loaded.");
                            if(entries){
                                for (i=0; i<keys.length; i++) {
                                    key = keys[i];
                                    var files = {name: entries[key].name};
                                    Document.instances[key] = Document.documentFile(files);
                                    console.log(Document.instances[key]);
                                   
                                }
                            }
                        }, function (error) {
                            alert(error.code);
                        });

                   });
        }, function(error) {
               alert("can't even get the file system: " + error.code);
        });

    },false);
})();

Document.showAll = function() {
    return Document.instances
};


//Check newest file on mobile storage
Document.scanDir = function () {
    
    var results = Document.checkUpdate("http://dpaluszak.pl/aimg/check_ver.php");
    var assetURL = "http://dpaluszak.pl/aimg/zip/" + results.slice(4);
    var fileName = results.slice(4);
    //variables which we need to download file
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
               fileSystem.root.getDirectory("Android/data/com.intel.appx.pdf_viewer.xwalk15/files/zip/", {
                           create: true
                 }, function(directory) {
                            var directoryReader = directory.createReader();
                            directoryReader.readEntries(function(entries) {
                                var i;
                                for (i=0; i<entries.length; i++) {
                                    if (entries[i].name.indexOf(".zip") != -1) {
                                        console.log("test");
                                        last_zip_file = entries[i].name;
                                        if(last_zip_file == fileName){
                                            Document.removeOld(); 
                                            console.log('removed_old');
                                            intel.xdk.cache.setCookie("actual_zip", last_zip_file, -1);
                                            intel.xdk.cache.setCookie("downloaded_zip", fileName, -1);
                                        }else{
                                            intel.xdk.cache.setCookie("actual_zip", fileName, -1);
                                            intel.xdk.cache.setCookie("downloaded_zip", fileName, -1); 
                                        }
                                    }else{
                                        intel.xdk.cache.setCookie("actual_zip", "file.zip", -1);
                                        intel.xdk.cache.setCookie("downloaded_zip", fileName, -1); 
                                    }
                                }
                               

                            }, function (error) {
                                console.log(error.code);
                            });
             });

     }, function(error) {
                   alert("can't even get the file system: " + error.code);
     })
};

// Check if new files exist
Document.downloadAll = function() {
    
    var fileTransfer = new FileTransfer();
    var results = Document.checkUpdate("http://dpaluszak.pl/aimg/check_ver.php");
    var assetURL = "http://dpaluszak.pl/aimg/zip/" + results.slice(4);
    var fileName = results.slice(4);
    var actual_zip = intel.xdk.cache.getCookie("actual_zip");
    var downloaded_zip = intel.xdk.cache.getCookie("downloaded_zip");
    
	console.log("About to start transfer");
    
    console.log("File on memory: " + actual_zip);
    console.log("File from url: " + downloaded_zip);
    
    if(actual_zip !== downloaded_zip){
        fileTransfer.download(assetURL, store + 'zip/' + fileName, 
            function(entry) {
                console.log("Success!");
                Document.statusApp();
                zip.unzip(store + 'zip/' + fileName, 
                           store + 'img/', 
                           function(){
                              console.log('Zip decompressed successfully');
                           }
                 );
            }, 
            function(err) {
                console.log("Error");
                console.dir(err);
            });
    }else{
        console.log("No updates found");
        Document.statusApp();
    }

};

//remove old file
Document.removeOld = function(){
    function removefile(){
        var old_file = intel.xdk.cache.getCookie("actual_zip");
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
            fileSystem.getDirectory("Android/data/com.intel.appx.pdf_viewer.xwalk15/files/zip/" + old_file, {create: false, exclusive: false}, gotRemoveFileEntry, fail);
        });
    }

    function gotRemoveFileEntry(fileEntry){
        console.log(fileEntry);
        fileEntry.remove(success, fail);
    }

    function success(entry) {
        console.log("Removal succeeded");
    }

    function fail(error) {
        console.log("Error removing file: " + error.code);
    }
};
         
//I'm only called when the file exists or has been downloaded.
Document.statusApp = function(){
    function appStart() {
        $status.innerHTML = "App ready!";
    }
};


document.addEventListener("app.Ready", onDeviceReady, false) ;
// document.addEventListener("deviceready", onAppReady, false) ;
// document.addEventListener("onload", onAppReady, false) ;


//device ready
function onDeviceReady() {  
    
    $status = document.querySelector("#status");

	$status.innerHTML = "Checking for data file.";
    
    store = cordova.file.externalDataDirectory;
    
    console.log(store);
    
    console.log(Object.keys(Document.instances).length);
    
    document.getElementById("showFiles").addEventListener("click", pl.view.listDocuments.setupUserInterface);
    document.getElementById("checkUpdt").addEventListener("click", pl.view.checkUpdates.setupUserInterface);
    
	//Check for the file. 
    //if(intel.xdk.cache.getCookie("actual_zip") !== "undefined"){
      //console.log("Actual zip cookie: " + intel.xdk.cache.getCookie("actual_zip"));
	 // window.resolveLocalFileSystemURL(store + 'zip/' + fileName, appStart, downloadAsset);
   // }
    //console.log(store);
      
}
//end device ready