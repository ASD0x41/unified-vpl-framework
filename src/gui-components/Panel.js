import './Panel.css';
import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

export default function Panel({ libLevel, setLibLevel }) {
    const [collapse, setCollapse] = useState(false);

    const togglePanel = () => {
        setCollapse(prevCollapse => !prevCollapse);
        setLibLevel(!libLevel);
    };

    return (
        <div className="panel" style={{ gridRow: collapse ? '4 / 5' : '3 / 5' }}>
            <div className="module-title-bar">
                <button className="icon-button" id="toggle-panel" title={collapse ? "Show Panel" : "Hide Panel"} onClick={togglePanel}>
                    <FontAwesomeIcon icon={collapse ? faChevronUp : faChevronDown} id="con-tog" />
                </button>
                Properties Panel
            </div>
            {!collapse && (
                <div id="panel-output">
                    <div>(width,height) = (<span id="width"></span>,<span id="height"></span>)</div>
                    <div>(vpt[4],vpt[5]) = (<span id="vptx"></span>,<span id="vpty"></span>)</div>
                    <div>(vpt[0],vpt[3]) = (<span id="zmx"></span>,<span id="zmy"></span>)</div>
                    <div>(centX,centY) = (<span id="centx"></span>,<span id="centy"></span>)</div>
                    <div>(clntX,clntY) = (<span id="clntx"></span>,<span id="clnty"></span>)</div>
                </div>
            )}
        </div>
    );
}
