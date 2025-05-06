export interface FileWithId extends File {
    id: string;
  }
  
  export const generateUniqueId = (() => {
    let counter = 0;
    return () => `file-${Date.now()}-${counter++}`;
  })();
  
  export const addIdToFiles = (files: File[]): FileWithId[] => {
    return files.map(file => {
      const fileWithId = Object.assign(file, {
        id: generateUniqueId()
      });
      return fileWithId;
    });
  };