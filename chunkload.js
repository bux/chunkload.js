var Downloader;
(function (Downloader) {
    var ChunkLoader = (function () {
        function ChunkLoader(fileGuid, requestUrl, chunkCountMethod, getChunkMethod, fileGuidParamName, chunkNrParamName) {
            this.m_fileGuid = fileGuid;
            this.m_requestUrl = requestUrl;
            this.m_chunkCountMethod = chunkCountMethod;
            this.m_getChunkMethod = getChunkMethod;
            this.m_fileGuidParamName = fileGuidParamName;
            this.m_chunkNrParamName = chunkNrParamName;
        }
        ChunkLoader.prototype.startDownload = function (callback) {
            var that = this;
            this.m_allChunkDownloadedCallback = callback;
            this.m_arrBlobs = [];
            this.m_chunkQueue = [];
            this.getChunkCount(that.onChunkCountRecieved);
        };
        ChunkLoader.prototype.getChunkCount = function (callback) {
            var that = this;
            var params = this.m_fileGuidParamName + "=" + this.m_fileGuid;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", this.m_requestUrl + this.m_chunkCountMethod + "?" + params, true);
            xhr.onload = function () {
                callback(this, that);
            };
            xhr.send(null);
        };
        ChunkLoader.prototype.downloadChunks = function (chunkCount, fileGuid) {
            for(var i = 1; i <= chunkCount; i++) {
                var chunk = new Chunk(i, fileGuid);
                this.m_chunkQueue.push(chunk);
            }
            this.downloadNextChunk();
        };
        ChunkLoader.prototype.downloadNextChunk = function () {
            if(this.m_chunkQueue.length > 0) {
                var nextChunk = this.m_chunkQueue.shift();
                this.downloadChunk(nextChunk);
            } else {
                this.m_chunkQueue = null;
            }
        };
        ChunkLoader.prototype.downloadChunk = function (chunk) {
            var that = this;
            var params = this.m_fileGuidParamName + "=" + chunk.fileGuid + "&" + this.m_chunkNrParamName + "=" + chunk.chunkNr;
            var xhr = new XMLHttpRequest();
            xhr.open("POST", this.m_requestUrl + this.m_getChunkMethod, true);
            xhr.responseType = "blob";
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.onload = function () {
                that.onChunkDownloaded(this, chunk);
            };
            xhr.send(params);
        };
        ChunkLoader.prototype.onChunkCountRecieved = function (xhr, that) {
            that.m_chunkCount = parseInt(xhr.responseText);
            that.downloadChunks(that.m_chunkCount, that.m_fileGuid);
        };
        ChunkLoader.prototype.onChunkDownloaded = function (xhr, downloadedChunk) {
            this.m_arrBlobs.push(xhr.response);
            if(this.m_chunkQueue.length === 0) {
                this.onAllChunksDownloaded();
            } else {
                this.downloadNextChunk();
            }
            xhr = null;
        };
        ChunkLoader.prototype.onAllChunksDownloaded = function () {
            var finalBlob = new Blob(this.m_arrBlobs, {
                type: this.m_arrBlobs[0].type
            });
            this.m_arrBlobs = null;
            this.m_allChunkDownloadedCallback(finalBlob);
        };
        return ChunkLoader;
    })();
    Downloader.ChunkLoader = ChunkLoader;    
    var Chunk = (function () {
        function Chunk(chunkNr, fileGuid) {
            this.m_chunkNr = chunkNr;
            this.m_fileGuid = fileGuid;
        }
        Object.defineProperty(Chunk.prototype, "chunkNr", {
            get: function () {
                return this.m_chunkNr;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Chunk.prototype, "fileGuid", {
            get: function () {
                return this.m_fileGuid;
            },
            enumerable: true,
            configurable: true
        });
        return Chunk;
    })();
    Downloader.Chunk = Chunk;    
})(Downloader || (Downloader = {}));
