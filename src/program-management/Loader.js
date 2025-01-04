export function LoadLanguage(json, loadComponents) {
    const Json = JSON.parse(json);
    const comps = Json["components"];

    comps.forEach(component => {
        const id = component.id;
        loadComponents(prevComponents => ({
            ...prevComponents,
            [id]: component
        }));
    });
};