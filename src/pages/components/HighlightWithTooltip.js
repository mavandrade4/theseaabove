
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';

const HighlightWithTooltip = ({ text }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState('');
  const [hasSummary, setHasSummary] = useState(false);

  useEffect(() => {
    const fetchWikipediaSummary = async () => {
      if (!text) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`
        );
        
        if (response.data.extract) {
          // Limit the content to avoid overly long tooltips
          const limitedContent = response.data.extract.slice(0, 200) + 
                               (response.data.extract.length > 200 ? '...' : '');
          setPage(response.data.content_urls.desktop.page);
          setContent(limitedContent);
          setHasSummary(true);
        } else {
          setHasSummary(false);
        }
      } catch (error) {
        setHasSummary(false);
      } finally {
        setLoading(false);
      }
    };

    fetchWikipediaSummary();
  }, [text]);

  const tooltipId = `wikipedia-tooltip-${text.replace(/\s+/g, '-')}`;
  const anchorId = `wikipedia-anchor-${text.replace(/\s+/g, '-')}`;

  // If no Wikipedia summary is found, return plain text
  if (!loading && !hasSummary) {
    return <span>{text}</span>;
  }

  // If loading, show loading state
  if (loading) {
    return (
      <>
        <span 
          id={anchorId}
          className="highlight" 
        >
          {text}
        </span>
        <Tooltip anchorSelect={`#${anchorId}`} clickable id={tooltipId} />
      </>
    );
  }

  // If summary is found, show highlighted text with tooltip
  return (
    <>
      <a 
        href={page}
        id={anchorId}
        className="highlight" 
      >
        {text}
      </a>
      <Tooltip
        anchorSelect={`#${anchorId}`}
        clickable
        className="wikipedia-tooltip"
        place="top"
      >
        <div>
          {content}
          <br />
          <a href={page} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>
            Read more on Wikipedia →
          </a>
        </div>
      </Tooltip>
    </>
  );
};

export default HighlightWithTooltip;