import { ScanData, ScanResult } from './types';

const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface ScanDataInput {
  patientId: string;
  patientName: string;
  scanType: 'brain' | 'chest';
  result?: ScanResult;
  imageUrl?: string;
  userEmail: string;
}

export const saveScanToLocalStorage = (
  scanData: ScanDataInput
): ScanData => {
  try {
    const storedScans = localStorage.getItem('userScans');
    let scans: ScanData[] = [];
    
    if (storedScans) {
      try {
        scans = JSON.parse(storedScans);
      } catch (e) {
        console.error('Error parsing stored scans:', e);
        scans = [];
      }
    }
    
    const newScan: ScanData = {
      _id: generateId(),
      patientId: scanData.patientId,
      patientName: scanData.patientName,
      type: scanData.scanType,
      scanType: scanData.scanType,
      status: 'completed',
      createdAt: new Date().toISOString(),
      result: scanData.result,
      userEmail: scanData.userEmail,
      imageUrl: scanData.imageUrl || undefined
    };
    
    scans.push(newScan);
    
    localStorage.setItem('userScans', JSON.stringify(scans));
    
    return newScan;
  } catch (error) {
    console.error('Error saving scan to localStorage:', error);
    throw error;
  }
};

export const getScansFromLocalStorage = (userEmail: string): ScanData[] => {
  try {
    const storedScans = localStorage.getItem('userScans');
    let allScans: ScanData[] = [];
    
    if (storedScans) {
      try {
        allScans = JSON.parse(storedScans);
      } catch (e) {
        console.error('Error parsing stored scans:', e);
        allScans = [];
      }
    }
    
    const userScans = allScans.filter(scan => scan.userEmail === userEmail);
    return userScans;
  } catch (error) {
    console.error('Error fetching scans from localStorage:', error);
    return [];
  }
};

export const getScanByIdFromLocalStorage = (scanId: string): ScanData | null => {
  try {
    const storedScans = localStorage.getItem('userScans');
    let allScans: ScanData[] = [];
    
    if (storedScans) {
      try {
        allScans = JSON.parse(storedScans);
      } catch (e) {
        console.error('Error parsing stored scans:', e);
        allScans = [];
      }
    }
    
    const scan = allScans.find(scan => scan._id === scanId);
    return scan || null;
  } catch (error) {
    console.error('Error fetching scan from localStorage:', error);
    return null;
  }
};

export const deleteScanFromLocalStorage = (scanId: string): boolean => {
  try {
    const storedScans = localStorage.getItem('userScans');
    let allScans: ScanData[] = [];
    
    if (storedScans) {
      try {
        allScans = JSON.parse(storedScans);
      } catch (e) {
        console.error('Error parsing stored scans:', e);
        allScans = [];
      }
    }
    
    allScans = allScans.filter(scan => scan._id !== scanId);
    
    localStorage.setItem('userScans', JSON.stringify(allScans));
    
    return true;
  } catch (error) {
    console.error('Error deleting scan from localStorage:', error);
    return false;
  }
};