import './Header.css';
import logo from '../logo.png';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { faSquare } from '@fortawesome/free-regular-svg-icons';

const { ipcRenderer } = require('electron');

// function minimizeWindow() {
//   ipcRenderer.send('minimize-window');
// }

// function maximizeWindow() {
//   ipcRenderer.send('maximize-window');
// }

// function closeWindow() {
//   ipcRenderer.send('close-window');
// }

export default function Header() {
    const minimizeWindow = () => {
        ipcRenderer.send('minimize-window');
    };

    const maximizeWindow = () => {
        ipcRenderer.send('maximize-window');
    };

    const closeWindow = () => {
        ipcRenderer.send('close-window');
    };

    // const minimizeWindow = () => {
    //     if (window.electron) {
    //         window.electron.minimize();
    //     } else {
    //         console.log('Running in browser, cannot minimize window.');
    //     }
    // };

    // const maximizeWindow = () => {
    //     if (window.electron) {
    //         window.electron.maximize();
    //     } else {
    //         console.log('Running in browser, cannot maximize window.');
    //     }
    // };

    // const closeWindow = () => {
    //     if (window.electron) {
    //         window.electron.close();
    //     } else {
    //         console.log('Running in browser, cannot close window.');
    //     }
    // };

    return (
        <header className="title-bar">
            <div className="app-icon"><img src={logo} alt="App Icon" /></div>
            <div className="app-name">Unified Framework for Visual Programming Languages</div>
            <div className="window-controls">
                <button className="minimize" title="Minimize" onClick={minimizeWindow}>
                    <FontAwesomeIcon icon={faMinus} />
                </button>
                <button className="maximize" title="Maximize" onClick={maximizeWindow}>
                    <FontAwesomeIcon icon={faSquare} />
                </button>
                <button className="close" title="Close" onClick={closeWindow}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
        </header>
    );
}

