import './Panel.css';
import { useState, useEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useConnectionContext } from '../program-management/Manager.js';

export default function Panel({ libLevel, setLibLevel, canvasProps, selectedComponent, lang }) {
    const [collapse, setCollapse] = useState(false);
    const [textValues, setTextValues] = useState({});
    const { components } = useConnectionContext();

    const togglePanel = () => {
        setCollapse(prevCollapse => !prevCollapse);
        setLibLevel(!libLevel);
    };

    const handleInputChange = (key, event) => {
        components.current[selectedComponent].props[key][1] = event.target.value;
    };

    const autoResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    useEffect(() => {
        if (selectedComponent && components.current[selectedComponent]) {
            const updatedTextValues = {};
            Object.keys(components.current[selectedComponent].props).forEach((key) => {
                updatedTextValues[key] = components.current[selectedComponent].props[key][1];
            });
            setTextValues(updatedTextValues);
        }
    }, [selectedComponent, components.current[selectedComponent]]);

    return (
        <div className="panel" style={{ gridRow: collapse ? '4 / 5' : '3 / 5' }}>
            <div className="module-title-bar">
                <button
                    className="icon-button"
                    id="toggle-panel"
                    title={collapse ? 'Show Panel' : 'Hide Panel'}
                    onClick={togglePanel}
                >
                    <FontAwesomeIcon icon={collapse ? faChevronUp : faChevronDown} id="con-tog" />
                </button>
                Properties Panel
            </div>
            {!collapse && (
                <div id="panel-output">
                    {lang.type !== null ? <div>
                        <div className='langblock'>
                        <div className="langhead">{lang.name}</div>
                        <div className="langhead">
                            {lang.type === 'flowchart' ? '(Flowchart-Based VPL)' :
                                (lang.type === 'dataflow' ? '(Dataflow-Based VPL)' : '(Block-Based VPL)')}
                        </div>
                        </div>
                        <br />
                    </div> :
                        <div className='langblock'><div className="langheadnull">NO LANGUAGE LOADED</div></div>}
                    {selectedComponent && components.current[selectedComponent] && Object.keys(components.current[selectedComponent].props).map((key) => (
                        <div className="table-row" key={key}>
                            <div className="read-only-cell">{components.current[selectedComponent].props[key][0]}</div>
                            <div className="table-cell">
                                <textarea
                                    value={textValues[key] || ''}
                                    onInput={(e) => {
                                        const newTextValues = { ...textValues, [key]: e.target.value };
                                        setTextValues(newTextValues);
                                        handleInputChange(key, e);
                                        autoResize(e);
                                    }}
                                    rows={1}
                                    style={{ resize: 'none', overflowY: 'hidden' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
