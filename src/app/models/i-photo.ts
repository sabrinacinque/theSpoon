export interface IPhoto {
  id: number;
  fileName: string;
  filePath: string;
  description?: string;
  isMain: boolean;
  uploadDate: string;
}
