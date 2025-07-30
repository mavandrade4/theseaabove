import { useState, useEffect } from "react";
import * as d3 from "d3";

const Data = () => {
  const [neuraspaceData, setNeuraspaceData] = useState([]);
  const [spaceDecayData, setSpaceDecayData] = useState([]);

  useEffect(() => {
    d3.csv("space_decay.csv")
      .then(setSpaceDecayData)
      .catch((error) => console.error("Error loading CSV:", error));
  }, []);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/data`)
      .then((res) => res.json())
      .then(setNeuraspaceData)
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const normalizeData = (neuraspaceData, spaceDecayData) => {
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

    // Add debug logging for combined data
    console.log("=== Combined Data Summary ===");
    console.log(`Total objects: ${combinedData.length}`);

    // Group by year and type
    const yearTypeCounts = combinedData.reduce((acc, item) => {
      const year = item.year || "unknown";
      const type = item.type || "unknown";
      
      if (!acc[year]) {
        acc[year] = { satellite: 0, debris: 0, unknown: 0 };
      }
      
      if (type === "satellite") {
        acc[year].satellite++;
      } else if (type === "debris") {
        acc[year].debris++;
      } else {
        acc[year].unknown++;
      }
      
      return acc;
    }, {});

    // Log counts per year
    console.log("Objects per year and type:");
    Object.entries(yearTypeCounts)
      .sort(([yearA], [yearB]) => yearA - yearB)
      .forEach(([year, counts]) => {
        console.log(
          `${year}: ` +
          `${counts.satellite} satellites, ` +
          `${counts.debris} debris, ` +
          `${counts.unknown} unknown`
        );
      });

    return combinedData;
  };

  const getYearStartIndexes = (data) => {
    const sortedData = [...data].sort((a, b) => a.year - b.year);

    const yearIndexes = [];
    let lastYear = null;

    sortedData.forEach((item, index) => {
      if (item.year !== lastYear) {
        yearIndexes.push({ year: item.year, index: index + 1 }); // +1 for 1-based index
        lastYear = item.year;
      }
    });

    //console.log("Year Start Indexes:", yearIndexes);
    return yearIndexes;
  };

  const combinedData = normalizeData(neuraspaceData, spaceDecayData);
  const yearStartIndexes = getYearStartIndexes(combinedData);

  return combinedData;
};

export default Data;
