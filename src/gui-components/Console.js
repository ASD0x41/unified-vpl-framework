import './Console.css';
import { useState, useEffect, useRef } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

export default function Console({ logMessages, setLogMessages }) {
  const [collapse, setCollapse] = useState(true);
  const consoleInputRef = useRef(null);
  const consoleOutputRef = useRef(null);

  const togglePanel = () => {
    setCollapse(prevCollapse => !prevCollapse);
  };

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog(...args);
      const logMessage = args.join(' ');
      setLogMessages(prevMessages => [...prevMessages, { type: 'log', message: logMessage }]);
    };

    console.error = (...args) => {
      originalConsoleError(...args);
      const errorMessage = args.join(' ');
      setLogMessages(prevMessages => [...prevMessages, { type: 'error', message: errorMessage }]);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, [setLogMessages]);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      const command = consoleInputRef.current.value;
      try {
        // eslint-disable-next-line
        // const result = eval(command);
        // console.log(result);

        window.dispatchEvent(
            new CustomEvent("get-input", { detail: command })
        );

      } catch (error) {
        console.error('Error:', error);
      }
      consoleInputRef.current.value = '';
    }
  };

  return (
    <div className="console" style={{ gridRow: collapse ? '4 / 5' : '3 / 5' }}>
      <div className="module-title-bar">
        <button
          className="icon-button"
          id="toggle-panel"
          title={collapse ? "Show Panel" : "Hide Panel"}
          onClick={togglePanel}
        >
          <FontAwesomeIcon icon={collapse ? faChevronUp : faChevronDown} id="con-tog" />
        </button>
        Console
      </div>

      {!collapse && (
        <div style={{ height: "100%" }}>
          <div className="console-output" ref={consoleOutputRef}>
            {logMessages.map((msg, index) => (
              <div key={index} className={msg.type === 'error' ? 'console-error' : 'console-log'}>
                {msg.message}
              </div>
            ))}
          </div>
          <input
            type="text"
            id="console-input"
            placeholder="Type your command here and press Enter"
            ref={consoleInputRef}
            onKeyDown={handleKeyPress}
            autoComplete="off"
          />
        </div>
      )}
    </div>
  );
}
