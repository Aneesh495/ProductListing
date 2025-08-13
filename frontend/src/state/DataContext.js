import React, { createContext, useCallback, useContext, useState, useRef, useMemo } from 'react';
import { 
  FaLaptop, 
  FaHeadphones, 
  FaDesktop, 
  FaChair, 
  FaTable, 
  FaTabletAlt, 
  FaGamepad, 
  FaHotel, 
  FaShoppingCart, 
  FaKeyboard, 
  FaMouse, 
  FaLaptopCode, 
  FaServer, 
  FaDatabase,
  FaMobileAlt, 
  FaTv, 
  FaHeadset
} from 'react-icons/fa';

const DataContext = createContext();

// Map categories to icons
const categoryIcons = {
  // Electronics
  'electronics': FaLaptop,
  'laptop': FaLaptop,
  'computer': FaDesktop,
  'headphones': FaHeadphones,
  'noise cancelling headphones': FaHeadphones,
  'monitor': FaDesktop,
  'phone': FaMobileAlt,
  'smartphone': FaMobileAlt,
  'tablet': FaTabletAlt,
  'tv': FaTv,
  'keyboard': FaKeyboard,
  'mouse': FaMouse,
  'gaming': FaGamepad,
  'headset': FaHeadset,
  'server': FaServer,
  'database': FaDatabase,
  'laptop code': FaLaptopCode,
  
  // Furniture
  'furniture': FaChair,
  'chair': FaChair,
  'desk': FaTable,
  'standing desk': FaTable,
  'table': FaTable,
  'sofa': FaChair,
  'bed': FaHotel,
  'office': FaTable,
  
  // Default fallback
  'default': FaShoppingCart
};

// Helper function to get the most appropriate icon for a category or product name
const getCategoryIcon = (category = '', productName = '') => {
  const lowerCategory = (category || '').toLowerCase();
  const lowerName = (productName || '').toLowerCase();
  
  // First, check for matches in the product name (more specific)
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  
  // Then check for exact category matches
  if (categoryIcons[lowerCategory]) {
    return categoryIcons[lowerCategory];
  }
  
  // Then check for partial category matches
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerCategory.includes(key)) {
      return icon;
    }
  }
  
  return categoryIcons.default;
};

const API_BASE_URL = 'http://localhost:3001/api';

export function DataProvider({ children }) {
  const [state, setState] = useState({
    items: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    },
    searchQuery: ''
  });

  const abortControllerRef = useRef(null);

  const fetchItems = useCallback(async (page = 1, limit = 10, searchQuery = '') => {
    // Create a new AbortController for this request
    const controller = new AbortController();
    
    // Track if the component is still mounted
    let isMounted = true;
    
    // Store the controller in the ref
    const currentController = abortControllerRef.current;
    abortControllerRef.current = controller;
    
    try {
      // Only set loading state if we're not already loading
      if (isMounted) {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null
        }));
      }

      // Abort the previous request if it exists
      if (currentController) {
        currentController.abort();
      }

      const params = new URLSearchParams({
        page,
        limit,
        ...(searchQuery && { q: searchQuery })
      });

      const response = await fetch(`${API_BASE_URL}/items?${params.toString()}`, {
        signal: controller.signal
      });

      // Verify the request wasn't aborted
      if (controller.signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data, pagination } = await response.json();
      
      // Add icons to items based on category and product name
      const itemsWithIcons = Array.isArray(data) 
        ? data.map(item => ({
            ...item,
            Icon: getCategoryIcon(item.category, item.name)
          }))
        : [];
      
      // Only update state if component is still mounted
      if (isMounted) {
        setState(prev => ({
          ...prev,
          items: itemsWithIcons,
          loading: false,
          pagination: {
            ...pagination,
            page: parseInt(pagination.page, 10),
            limit: parseInt(pagination.limit, 10)
          },
          searchQuery
        }));
      }

      return { data, pagination };
    } catch (error) {
      // Only update state for non-abort errors and if component is still mounted
      if (error.name !== 'AbortError' && isMounted) {
        console.error('Error fetching items:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
      // Re-throw the error for error boundaries or try/catch blocks
      if (error.name !== 'AbortError') {
        throw error;
      }
    }
  }, []);

  // Cleanup function to handle component unmounting
  React.useEffect(() => {
    return () => {
      // Abort any pending request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    fetchItems,
    setPage: (page) => fetchItems(page, state.pagination.limit, state.searchQuery),
    setLimit: (limit) => fetchItems(1, limit, state.searchQuery),
    setSearchQuery: (query) => fetchItems(1, state.pagination.limit, query),
    getCategoryIcon // Expose the icon getter function if needed by other components
  }), [state, fetchItems]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};