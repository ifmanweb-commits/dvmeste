export type FileScope = 'pages' | 'articles';

export type FileItem = {
  name: string;
  url: string;
  size: number;
  legacy?: boolean;
};

export type FileManagerProps = {
  scope: FileScope;
  entityKey: string;
  title: string;
  hint?: string;
  initialUrls?: string[];
  onFilesChange?: (urls: string[]) => void;
  onInsertLink?: (file: FileItem) => void;
  onInsertImage?: (file: FileItem) => void;
};