export const displayMap = (locations) => {
    mapboxgl.accessToken = 'pk.eyJ1IjoibGVlMjEiLCJhIjoiY2x0NDQzYnR2MDB4aTJxcnd3NGV2emlqNCJ9.bzrSUlVqFKz5Ut-e--UOVQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/lee21/clt44m9dd004i01r064gk2vrz',
        scrollZoom: false
    });

    const bounds = new mapboxgl.LngLatBounds();
    locations.forEach(loc => {
        //1. Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        //2. Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        //3. Add popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}<p>`)
            .addTo(map);
        //4. Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
};