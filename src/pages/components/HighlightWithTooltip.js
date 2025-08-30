
import React from 'react';
import WikipediaTooltip from './WikipediaTooltip';

const HighlightWithTooltip = ({ text, tooltipWords = [] }) => {
  if (!tooltipWords.length) {
    return <b className="highlight">{text}</b>;
  }

  // Check if this text should have a tooltip
  const shouldHaveTooltip = tooltipWords.some(word => 
    text.toLowerCase().includes(word.toLowerCase())
  );

  if (shouldHaveTooltip) {
    const matchingWord = tooltipWords.find(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );
    
    return <WikipediaTooltip word={matchingWord} />;
  }

  return <b className="highlight">{text}</b>;
};

export default HighlightWithTooltip;