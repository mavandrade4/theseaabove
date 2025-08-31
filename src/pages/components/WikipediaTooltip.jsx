// components/WikipediaTooltip.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';

const WikipediaTooltip = ({ word }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWikipediaSummary = async () => {
      if (!word) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`
        );
        
        if (response.data.extract) {
          // Limit the content to avoid overly long tooltips
          const limitedContent = response.data.extract.slice(0, 200) + 
                               (response.data.extract.length > 200 ? '...' : '');
          setContent(limitedContent);
        } else {
          setContent('No Wikipedia summary available');
        }
      } catch (error) {
        setContent('Could not load Wikipedia information');
      } finally {
        setLoading(false);
      }
    };

    fetchWikipediaSummary();
  }, [word]);

  const tooltipId = `wikipedia-tooltip-${word.replace(/\s+/g, '-')}`;

  if (loading) {
    return (
      <>
        <span 
          className="highlight" 
          data-tooltip-id={tooltipId}
          data-tooltip-content="Loading..."
        >
          {word}
        </span>
        <Tooltip id={tooltipId} />
      </>
    );
  }

  return (
    <>
      <span 
        className="highlight" 
        data-tooltip-id={tooltipId}
        data-tooltip-content={content}
      >
        {word}
      </span>
      <Tooltip 
        id={tooltipId}
        className="wikipedia-tooltip"
        place="top"
      />
    </>
  );
};

export default WikipediaTooltip;