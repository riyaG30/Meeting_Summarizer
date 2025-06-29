import { createContext, useContext, useState } from 'react';

const ParsedContext = createContext();

export const ParsedProvider = ({ children }) => {
  const [parsedData, setParsedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // connect uplaod to summary section

  return (
    <ParsedContext.Provider
      value={{
        parsedData,
        setParsedData,
        isProcessing,
        setIsProcessing, 
      }}
    >
      {children}
    </ParsedContext.Provider>
  );
};

export const useParsed = () => useContext(ParsedContext);
