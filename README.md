chunkload.js
============

XHR downloads a file in chunks, puts the chunks together and returns the file.

## Usage

    
    var cl = new Downloader.ChunkLoader("big_buck_bunny.webm",  // fileGuid
                                        "/files/",              // requestUrl
                                        "getChunkCount",        // chunkCountMethod
                                        "getChunk",             // getChunkMethod
                                        "fileName",             // fileGuidParamName
                                        "chunkNr");             // chunkNrParamName
                                        
    cl.startDownload(function (fileBlob) {
      onFileDownloaded(fileBlob);
      cl = null;
    });
