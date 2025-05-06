import { ScanData, ScanResult } from './types';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

export const saveScanToLocalStorage = (
  scanData: {
    patientId: string;
    patientName: string;
    scanType: 'brain' | 'chest';
    result?: ScanResult;
    imageUrl?: string;
    userEmail: string;
  }
) => {
  try {
    // Get existing scans from localStorage
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
    
    // Create new scan object
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
      imageUrl: scanData.imageUrl || null
    };
    
    // Add new scan to array
    scans.push(newScan);
    
    // Save updated array back to localStorage
    localStorage.setItem('userScans', JSON.stringify(scans));
    
    return newScan;
  } catch (error) {
    console.error('Error saving scan to localStorage:', error);
    throw error;
  }
};

export const getScansFromLocalStorage = (userEmail: string) => {
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
    
    // Filter scans for the current user
    const userScans = allScans.filter(scan => scan.userEmail === userEmail);
    return userScans;
  } catch (error) {
    console.error('Error fetching scans from localStorage:', error);
    return [];
  }
};

export const getScanByIdFromLocalStorage = (scanId: string) => {
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
    
    // Find scan with matching ID
    const scan = allScans.find(scan => scan._id === scanId);
    return scan || null;
  } catch (error) {
    console.error('Error fetching scan from localStorage:', error);
    return null;
  }
};

export const deleteScanFromLocalStorage = (scanId: string) => {
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