import { bodies, moons } from './celestialBodies.js';
import { dwarfPlanets } from './dwarfPlanets.js';
const aliases = { sun: 'sun matahari', mercury: 'mercury merkurius', earth: 'earth bumi', moon: 'moon bulan', saturn: 'saturn saturnus', neptune: 'neptune neptunus' };
export function searchObjects(query = '', type = 'all') {
  const term = query.trim().toLocaleLowerCase('id');
  return [...bodies, ...dwarfPlanets, ...moons].filter(body => (type === 'all' || (body.type || 'moon') === type)
    && `${body.name} ${body.id} ${aliases[body.id] || ''}`.toLocaleLowerCase('id').includes(term));
}
