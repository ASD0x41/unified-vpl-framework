import './App.css';
import { useState } from 'react';

import Header from './gui-components/Header.js'
import MenuBar from './gui-components/MenuBar.js'
import Workspace from './gui-components/Workspace.js'
import Library from './gui-components/Library.js'
import Console from './gui-components/Console.js'
import Panel from './gui-components/Panel.js'

function App() {
  const [libExtension, setLibExtension] = useState(false);
  const [logMessages, setLogMessages] = useState([]);

  const clearConsole = () => {
    setLogMessages([]);
  };

  return (
    <div className="App">
      <Header />
      <MenuBar clearConsole={clearConsole} />
      <Workspace />
      <Library libLevel={libExtension} />
      <Console logMessages={logMessages} setLogMessages={setLogMessages} />
      <Panel libLevel={libExtension} setLibLevel={setLibExtension}/>
    </div>
  );
}

export default App;
