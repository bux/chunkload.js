module Downloader {

    export class ChunkLoader { 

        private m_arrBlobs: any[];
        private m_chunkQueue: Chunk[];
        private m_fsh: FileSystemHandler;

        private m_fileGuid: string;
        private m_requestUrl: string;
        private m_chunkCountMethod: string;
        private m_getChunkMethod: string;
        private m_fileGuidParamName: string;
        private m_chunkNrParamName: string;

        private m_chunkCount: number;

        private m_allChunkDownloadedCallback: (fileBlob:any) => void;


        /*
        *       ########## CTOR ##########
        */

        // ctor
        constructor(fileGuid: string, requestUrl: string, chunkCountMethod: string, getChunkMethod: string, fileGuidParamName: string, chunkNrParamName:string) {
            this.m_fileGuid = fileGuid;

            this.m_requestUrl = requestUrl;
            this.m_chunkCountMethod = chunkCountMethod;
            this.m_getChunkMethod = getChunkMethod;

            this.m_fileGuidParamName = fileGuidParamName;
            this.m_chunkNrParamName = chunkNrParamName;
        }



        /*
        *       ########## PUBLIC ##########
        */

        public startDownload(callback:(fileBlob:any)=>void): void {

            var that = this;
            
            this.m_allChunkDownloadedCallback = callback;
            this.m_arrBlobs = [];
            this.m_chunkQueue = [];

            this.getChunkCount(that.onChunkCountRecieved);

        }



        /*
        *       ########## PRIVATE ##########
        */

        private getChunkCount(callback: (xhr:XMLHttpRequest, that:ChunkLoader) => void ):void {

            var that = this;

            var params: string = this.m_fileGuidParamName + "=" + this.m_fileGuid;

            // get the chunk count from server
            var xhr: XMLHttpRequest = new XMLHttpRequest();
            xhr.open("GET", this.m_requestUrl + this.m_chunkCountMethod + "?" + params, true);

            // callback function for the onload event
            xhr.onload = function () {

                // here: this is the scope of the xhr callback
                // so "this" is the xhr object and not the ChunkLoader class
                callback(this, that);
            };

            // send the request
            xhr.send(null);
        }

        private downloadChunks(chunkCount: number, fileGuid: string): void {

            // fill the chunkQueue
            for (var i = 1; i <= chunkCount; i++) {
                var chunk = new Chunk(i, fileGuid);
                this.m_chunkQueue.push(chunk);
            }

            // then start downloading
            this.downloadNextChunk();

        }

        private downloadNextChunk(): void {

            if (this.m_chunkQueue.length > 0) {
                // Array.shift() returns the topmost entry and removes it from the array
                // therefore newLength = oldLength - 1
                var nextChunk: Chunk = this.m_chunkQueue.shift();
                this.downloadChunk(nextChunk);
            } else {
                this.m_chunkQueue = null;
            }

        }

        private downloadChunk(chunk: Chunk): void {
            
            var that = this;

            var params: string = this.m_fileGuidParamName + "=" + chunk.fileGuid + "&" + this.m_chunkNrParamName + "=" + chunk.chunkNr;

            var xhr : XMLHttpRequest = new XMLHttpRequest();

            xhr.open("POST", this.m_requestUrl + this.m_getChunkMethod, true);
            xhr.responseType = "blob";

            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

            xhr.onload = function () {
                that.onChunkDownloaded(this, chunk);
            };

            xhr.send(params);

        }

        /*
        *       ########## EVENTS ##########
        */

        private onChunkCountRecieved(xhr: XMLHttpRequest, that: ChunkLoader): void {
            that.m_chunkCount = parseInt(xhr.responseText);
            
            that.downloadChunks(that.m_chunkCount, that.m_fileGuid);
        }


        private onChunkDownloaded(xhr: XMLHttpRequest, downloadedChunk: Chunk): void {

            this.m_arrBlobs.push(xhr.response);

            if (this.m_chunkQueue.length === 0) {
                this.onAllChunksDownloaded(/*downloadedChunk.fileGuid*/);
            } else {
                this.downloadNextChunk();
            }

            xhr = null;

        }

        private onAllChunksDownloaded(): void {

            var finalBlob:Blob = new Blob(this.m_arrBlobs, { type: this.m_arrBlobs[0].type });

            this.m_arrBlobs = null;

            this.m_allChunkDownloadedCallback(finalBlob);

        }


    }

    export class Chunk {

        private m_chunkNr: number;

        get chunkNr(): number {
            return this.m_chunkNr;
        }

        private m_fileGuid: string;

        get fileGuid(): string {
            return this.m_fileGuid;
        }

        constructor(chunkNr: number, fileGuid: string) {
            this.m_chunkNr = chunkNr;
            this.m_fileGuid = fileGuid;
        }

    }

}