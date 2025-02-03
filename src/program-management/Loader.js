export function Loader() {

    const LoadLanguage = (json, loadComponents) => {
        const Json = JSON.parse(json);
        const comps = Json["components"];

        loadComponents({});
    
        comps.forEach(component => {
            const id = component.id;
            loadComponents(prevComponents => ({
                ...prevComponents,
                [id]: component
            }));
        });

        //console.log("comps loaded");

        return { name: Json["name"], type: Json["type"] };
    };

    return { LoadLanguage };
};

