// Mars Trek's EQ/default028mm matrix has two columns at zoom zero.
function layout(bounds, zoom) {
  const degreesPerTile = 180 / 2 ** zoom;
  const left = (bounds.west + 180) / degreesPerTile;
  const right = (bounds.east + 180) / degreesPerTile;
  const top = (90 - bounds.north) / degreesPerTile;
  const bottom = (90 - bounds.south) / degreesPerTile;
  return { left, right, top, bottom };
}

export async function showMarsTrek(container, metadata, bounds) {
  const zoom = bounds.east - bounds.west < 2 ? 7 : metadata.initial_zoom;
  const { left, right, top, bottom } = layout(bounds, zoom);
  const width = right - left, height = bottom - top;
  const images = [];
  for (let y = Math.floor(top); y < Math.ceil(bottom); y++) {
    for (let x = Math.floor(left); x < Math.ceil(right); x++) {
      const img = new Image();
      img.alt = '';
      img.style.left = (x - left) / width * 100 + '%';
      img.style.top = (y - top) / height * 100 + '%';
      img.style.width = 100 / width + '%';
      img.style.height = 100 / height + '%';
      img.src = metadata.tile_url.replace('{z}', zoom).replace('{y}', y).replace('{x}', x);
      images.push(img);
    }
  }
  await Promise.all(images.map(img => img.decode()));
  container.replaceChildren(...images);
}
