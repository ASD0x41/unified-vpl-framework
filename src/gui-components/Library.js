import './Library.css';
import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function Library({ libLevel }) {
    const [collapse, setCollapse] = useState(false);

    const togglePanel = () => {
        setCollapse(prevCollapse => !prevCollapse);
    };

    return (
        <aside className="library" style={{ gridRow: libLevel? '2 / 4' : '2 / 3', gridColumn: collapse ? '4 / 5' : '3 / 5' }}>
            <div className="module-title-bar">
                <button className="icon-button" id="toggle-panel" title={collapse ? "Show Panel" : "Hide Panel"} onClick={togglePanel}>
                                                    <FontAwesomeIcon icon={collapse ? faChevronLeft : faChevronRight} id="con-tog" />
                                </button>
                <div id="library-title" style={{ writingMode: collapse? 'vertical-rl' : 'horizontal-tb', marginLeft: collapse? '5px' : '0px', fontWeight: collapse? '600' : 'normal'  }}>
                    Component Library</div>
            </div>
            {!collapse && (
                <div id="library-output">
                {/* <div className="visual" data-component="rect" draggable="true"><button className="image-button"
                        id="rect-button"></button></div>
                <div className="visual" data-component="circle" draggable="true"><button className="image-button"
                        id="circle-button"></button></div>
                <div className="visual" data-component="triangle" draggable="true"><button className="image-button"
                        id="triangle-button"></button></div> */}
            </div>
            )}
        </aside>
    );
}
