const query = `
[out:json];
(
  way["highway"](around:600, 10.9415, 106.8615);
);
out tags geom;
`;

async function main() {
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });
    const d = await res.json();
    console.log('Total roads:', d.elements.length);
    const roads = [];
    d.elements.forEach(e => {
      if (e.tags && e.tags.name) {
        roads.push({
          name: e.tags.name,
          type: e.tags.highway,
          coords: e.geometry ? e.geometry.map(g => [g.lat, g.lon]) : []
        });
      }
    });
    console.log('Unique road names:', [...new Set(roads.map(r => r.name))]);
    // Also log school details
    const schoolQuery = `
[out:json];
(
  node["amenity"="school"](around:800, 10.9415, 106.8615);
  way["amenity"="school"](around:800, 10.9415, 106.8615);
);
out tags geom;
`;
    const res2 = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: schoolQuery,
    });
    const d2 = await res2.json();
    console.log('Surrounding schools:', d2.elements.map(e => e.tags ? e.tags.name : null));
  } catch (err) {
    console.error(err);
  }
}

main();
