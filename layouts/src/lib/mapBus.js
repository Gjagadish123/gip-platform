// Lets page sections drive the hero map (fly to a landmark, focus an amenity) without prop drilling.
export const mapBus = new EventTarget();
export const showPlaceOnMap = (place) => mapBus.dispatchEvent(new CustomEvent('place', { detail: place }));
export const focusOnMap = (xy, label) => mapBus.dispatchEvent(new CustomEvent('focus', { detail: { xy, label } }));
export const applyFilterOnMap = (partial) => mapBus.dispatchEvent(new CustomEvent('filter', { detail: partial }));
