export interface StoredFile {
  key: string;
  url: string;
}

export interface FileStorage {
  put(key: string, contents: Buffer, contentType: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}
