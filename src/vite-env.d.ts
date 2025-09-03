/// <reference types="vite/client" />

// Chrome Extension API 类型声明
declare global {
  interface Window {
    chrome: typeof chrome;
  }

  const chrome: {
    bookmarks: {
      getTree(): Promise<any[]>;
      create(bookmark: {
        title: string;
        url: string;
        parentId?: string;
      }): Promise<any>;
      update(id: string, changes: any): Promise<any>;
      remove(id: string): Promise<void>;
      move(
        id: string,
        destination: { parentId?: string; index?: number }
      ): Promise<any>;
    };
    permissions: {
      contains(permissions: { permissions: string[] }): Promise<boolean>;
      request(permissions: { permissions: string[] }): Promise<boolean>;
    };
    runtime: {
      sendMessage(message: any): void;
    };
    tabs: {
      create(createProperties: { url: string }): Promise<any>;
    };
  };
}

export {};
