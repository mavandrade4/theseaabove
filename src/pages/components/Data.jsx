import { useState, useEffect } from "react";
import * as d3 from "d3";

const Data = () => {
  const [neuraspaceData, setNeuraspaceData] = useState([]);
  const [spaceDecayData, setSpaceDecayData] = useState([]);
  const [loadingError, setLoadingError] = useState(false);
  const [db, setDb] = useState(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open("SpaceDataDB", 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('spaceData')) {
            db.createObjectStore('spaceData', { keyPath: 'key' });
          }
        };
      });
    };

    initDB()
      .then(setDb)
      .catch(error => console.error("Error initializing DB:", error));
  }, []);

  // Function to save data to IndexedDB
  const saveDataToDB = async (key, data) => {
    if (!db) return;
    
    try {
      const transaction = db.transaction(['spaceData'], 'readwrite');
      const store = transaction.objectStore('spaceData');
      await store.put({ key, data, timestamp: Date.now() });
      console.log(`Saved ${data.length} items to DB under key: ${key}`);
    } catch (error) {
      console.error("Error saving to DB:", error);
    }
  };

  // Function to load data from IndexedDB
  const loadDataFromDB = async (key) => {
    if (!db) return null;
    
    try {
      const transaction = db.transaction(['spaceData'], 'readonly');
      const store = transaction.objectStore('spaceData');
      const request = store.get(key);
      
      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error("Error loading from DB:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadSpaceDecayData = async () => {
      try {
        // First try to load from DB
        const cachedData = await loadDataFromDB("space_decay_data");
        
        if (cachedData) {
          setSpaceDecayData(cachedData);
          return;
        }

        // If not in DB, load from CSV
        const data = await d3.csv("space_decay.csv");
        setSpaceDecayData(data);
        await saveDataToDB("space_decay_data", data);
      } catch (error) {
        console.error("Error loading space decay data:", error);
        setLoadingError(true);
      }
    };

    if (db) loadSpaceDecayData();
  }, [db]);

  useEffect(() => {
    const loadNeuraspaceData = async () => {
      try {
        // First try to load from DB
        const cachedData = await loadDataFromDB("neuraspace_data");
        
        if (cachedData) {
          setNeuraspaceData(cachedData);
          return;
        }

        // If not in DB, fetch from API
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNeuraspaceData(data);
        await saveDataToDB("neuraspace_data", data);
      } catch (error) {
        console.error("Error fetching neuraspace data:", error);
        setLoadingError(true);
      }
    };

    if (db) loadNeuraspaceData();
  }, [db]);

  const normalizeData = async (neuraspaceData, spaceDecayData) => {
    // If we have a loading error, try to load the normalized combined data from DB
    if (loadingError) {
      const cachedCombinedData = await loadDataFromDB("combined_normalized_data");
      if (cachedCombinedData) {
        console.log("Using cached normalized data due to loading errors");
        return cachedCombinedData;
      }
    }

    const parseYear = (dateStr) => {
      const date = new Date(dateStr);
      return isNaN(date) ? null : date.getFullYear();
    };

    const normalizedNeuraspace = neuraspaceData.map((d) => {
      const year = d.launch ? parseYear(d.launch.Date) : null;
      const type = d.object_type?.toLowerCase() || "unknown";
      const country = d.operators?.[0]?.Country || "unknown";
      return {
        name: d.name,
        year,
        type,
        subtype: d.object_sub_type,
        country,
        id: d.cospar_id,
        source: "neuraspace",
      };
    });

    const getCountryName = (code) => {
      try {
        if (!code || typeof code !== "string") return "unknown";
        return (
          new Intl.DisplayNames(["en"], { type: "region" }).of(code) ||
          "unknown"
        );
      } catch {
        return "unknown";
      }
    };

    const normalizedSpaceDecay = spaceDecayData.map((d) => {
      let type = "unknown";
      if (["PAYLOAD", "ROCKET BODY"].includes(d.OBJECT_TYPE))
        type = "satellite";
      else if (d.OBJECT_TYPE === "DEBRIS") type = "debris";
      const subtype = d.object_type?.toLowerCase() || "unknown";

      return {
        name: d.OBJECT_NAME,
        year: parseYear(d.LAUNCH_DATE),
        type,
        subtype,
        country: getCountryName(d.COUNTRY_CODE),
        id: d.OBJECT_ID,
        source: "space_decay",
      };
    });

    const unique = new Map();
    [...normalizedNeuraspace, ...normalizedSpaceDecay].forEach((d) => {
      if (d.year && d.year >= 1957 && d.year <= 2024 && d.id) {
        unique.set(d.id, d);
      }
    });

    const combinedData = Array.from(unique.values());

    // Save the normalized combined data to DB for future use
    await saveDataToDB("combined_normalized_data", combinedData);

    // Debug logging (optional - you might want to remove this for production)
    console.log("=== Combined Data Summary ===");
    console.log(`Total objects: ${combinedData.length}`);

    return combinedData;
  };

  const getYearStartIndexes = (data) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);

    const yearIndexes = [];
    let lastYear = null;

    sortedData.forEach((item, index) => {
      if (item.year !== lastYear) {
        yearIndexes.push({ year: item.year, index: index + 1 });
        lastYear = item.year;
      }
    });

    return yearIndexes;
  };

  // Since normalizeData is now async, we need to handle it differently
  const [combinedData, setCombinedData] = useState([]);

  useEffect(() => {
    const processData = async () => {
      if (neuraspaceData.length > 0 && spaceDecayData.length > 0) {
        const normalized = await normalizeData(neuraspaceData, spaceDecayData);
        setCombinedData(normalized);
      }
    };

    processData();
  }, [neuraspaceData, spaceDecayData]);

  return combinedData;
};

export default Data;