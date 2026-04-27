// services/purchaseTracking.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PurchaseRecord {
  name: string;
  price: number;
  category: string;
  lastPurchased: string;
  timesChecked: number;
}

// Save items that were checked (purchased)
export const savePurchasedItems = async (items: any[]) => {
  try {
    const historyJson = await AsyncStorage.getItem('purchaseHistory');
    const history: PurchaseRecord[] = historyJson ? JSON.parse(historyJson) : [];
    
    items.forEach(item => {
      if (item.checked && item.price && item.price > 0) {
        const existingIndex = history.findIndex(
          p => p.name.toLowerCase() === item.name.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          history[existingIndex] = {
            ...history[existingIndex],
            price: item.price,
            lastPurchased: new Date().toISOString(),
            timesChecked: history[existingIndex].timesChecked + 1,
          };
        } else {
          history.push({
            name: item.name,
            price: item.price,
            category: item.category,
            lastPurchased: new Date().toISOString(),
            timesChecked: 1,
          });
        }
      }
    });
    
    await AsyncStorage.setItem('purchaseHistory', JSON.stringify(history));
    console.log(`✅ Saved ${items.filter(i => i.checked).length} purchased items`);
  } catch (error) {
    console.error('Error saving purchase history:', error);
  }
};

// Get historical price for an item
export const getHistoricalPrice = async (itemName: string): Promise<number | null> => {
  try {
    const historyJson = await AsyncStorage.getItem('purchaseHistory');
    if (!historyJson) return null;
    
    const history: PurchaseRecord[] = JSON.parse(historyJson);
    const item = history.find(
      p => p.name.toLowerCase() === itemName.toLowerCase()
    );
    
    if (item && item.price > 0) {
      console.log(`Found historical price for ${itemName}: $${item.price}`);
      return item.price;
    }
  } catch (error) {
    console.error('Error reading purchase history:', error);
  }
  return null;
};

// Get all purchase history
export const getPurchaseHistory = async (): Promise<PurchaseRecord[]> => {
  try {
    const historyJson = await AsyncStorage.getItem('purchaseHistory');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error reading purchase history:', error);
    return [];
  }
};

// Clear purchase history
export const clearPurchaseHistory = async () => {
  try {
    await AsyncStorage.removeItem('purchaseHistory');
    console.log('Purchase history cleared');
  } catch (error) {
    console.error('Error clearing purchase history:', error);
  }
};