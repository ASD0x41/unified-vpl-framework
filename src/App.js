import './App.css';
import { fabric } from 'fabric';
import { useState, useRef, useCallback, useEffect } from 'react';

import Header from './gui-components/Header.js'
import MenuBar from './gui-components/MenuBar.js'
import Workspace from './gui-components/Workspace.js'
import Library from './gui-components/Library.js'
import Console from './gui-components/Console.js'
import Panel from './gui-components/Panel.js'

import { Loader } from './program-management/Loader.js';
import { Manager } from './program-management/Manager.js';


function App() {
  const { LoadLanguage } = Loader();
  const [lang, setLang] = useState({ name: null, type: null });
  const [libExtension, setLibExtension] = useState(false);
  const [logMessages, setLogMessages] = useState([]);
  const [libraryComponents, setLibraryComponents] = useState({});

  useEffect(() => {
    setTimeout(function () {
      document.getElementById('spinner-overlay').style.display = 'none';
    }, 3000);

    const params = new URLSearchParams(window.location.search);
    var langtype = params.get('type');

    if (langtype === null) {
      langtype = 'block';
    }

    fetch('./samples/' + langtype + '.json')
      .then((response) => response.json())
      .then((jsonData) => {
        const comps = jsonData["components"];

        setLibraryComponents({});

        comps.forEach((component) => {
          const id = component.id;
          setLibraryComponents((prevComponents) => ({
            ...prevComponents,
            [id]: component
          }));
        });

        setLang({ name: jsonData["name"], type: jsonData["type"] });
      })
      .catch((error) => console.error('Error fetching JSON:', error));
  }, []);


  const [draggedComponent, setDraggedComponent] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [canvasProps, setCanvasProps] = useState({
    vpWidth: 800,
    vpHeight: 600,
    vptx: 0,
    vpty: 0,
    zmx: 1,
    zmy: 1,
    centerX: 0,
    centerY: 0,
    clntx: 0,
    clnty: 0
  });
  const canvasRef = useRef(null);

  const handleCanvasReady = useCallback((canvasInstance) => {
    canvasInstance.on('mouse:move', function (opt) {
      var evt = opt.e;
      var vpt = canvasInstance.viewportTransform;
      var centerX = vpt[4] - canvasInstance.getWidth() / 2;
      var centerY = vpt[5] - canvasInstance.getHeight() / 2;

      setCanvasProps({
        vpWidth: canvasInstance.getWidth(),
        vpHeight: canvasInstance.getHeight(),
        vptx: vpt[4],
        vpty: vpt[5],
        zmx: vpt[0],
        zmy: vpt[3],
        centerX,
        centerY,
        clntx: evt.clientX,
        clnty: evt.clientY
      });
    });

    fabric.Group.prototype.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(this), {
          id: this.id || null,
          ID: this.ID || null
        });
      };
    })(fabric.Group.prototype.toObject);

    fabric.Group.prototype.stateProperties.push('id');
    fabric.Group.prototype.stateProperties.push('ID');

    fabric.Circle.prototype.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(this), {
          idx: this.idx || null,
          side: this.side || null
        });
      };
    })(fabric.Circle.prototype.toObject);

    fabric.Circle.prototype.stateProperties.push('idx');
    fabric.Circle.prototype.stateProperties.push('side');

    fabric.Text.prototype.toObject = (function (toObject) {
      return function () {
        return fabric.util.object.extend(toObject.call(this), {
          prop: this.id || null
        });
      };
    })(fabric.Group.prototype.toObject);

    fabric.Group.prototype.stateProperties.push('prop');

    canvasRef.current = canvasInstance;
  }, []);

  const clearConsole = () => {
    setLogMessages([]);
  };

  const loadVisualLang = (json) => {
    const loadedLang = LoadLanguage(json, setLibraryComponents);
    setLang(loadedLang);
  };

  const dragStarter = (id, e) => {
    const rect = e.target.getBoundingClientRect();

    let offsetX = e.clientX - rect.left;
    let offsetY = e.clientY - rect.top;

    setDraggedComponent([id, offsetX, offsetY]);
  };

  return (
    <Manager>
      <div className="App">
        <div id="spinner-overlay">
          <div className="spinner"></div>
        </div>
        <Header />
        <MenuBar clearConsole={clearConsole} canvas={canvasRef} loadComponents={loadVisualLang} setSelectedComponent={setSelectedComponent} lang={lang} libComps={libraryComponents} setLang={setLang} />
        <Workspace onCanvasReady={handleCanvasReady} draggedComponent={draggedComponent} libComps={libraryComponents} setSelectedComponent={setSelectedComponent} lang={lang} />
        <Library libLevel={libExtension} libcomponents={libraryComponents} onDragStart={dragStarter} lang={lang} />
        <Console logMessages={logMessages} setLogMessages={setLogMessages} />
        <Panel libLevel={libExtension} setLibLevel={setLibExtension} canvasProps={canvasProps} selectedComponent={selectedComponent} lang={lang} />
      </div>
    </Manager>
  );
}

export default App;
