export interface UserSettings {
    name: string;
    email: string;
    notifications: boolean;
    darkMode: boolean;
  }
  
  const defaultSettings: UserSettings = {
    name: '',
    email: '',
    notifications: true,
    darkMode: true,
  };
  
  export const saveUserSettings = (userEmail: string, settings: UserSettings): boolean => {
    try {
      const settingsKey = `userSettings_${userEmail}`;
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  };
  
  export const getUserSettings = (userEmail: string): UserSettings => {
    try {
      const settingsKey = `userSettings_${userEmail}`;
      const storedSettings = localStorage.getItem(settingsKey);
      
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
      
      const newSettings = {
        ...defaultSettings,
        name: '',
        email: userEmail
      };
      
      saveUserSettings(userEmail, newSettings);
      
      return newSettings;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return {
        ...defaultSettings,
        email: userEmail
      };
    }
  };