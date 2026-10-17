// Le couloir liminal : cinq portes, une ampoule qui hésite, un passage secret (trois clignements).
import { BaseScene } from '../base.js';
import { C, W, H, R } from '../../art/pixel.js';
import { glow } from '../../art/roomBase.js';
import { bakeCorridor, wallPatch, wallRect, proj, hex, shade, blend, drawSymbol, SYMBOL_COLOR, K, CX, CY } from './common.js';

const DOORS = {
  library: { side: -1, z: [26, 38], symbol: 'moon', label: 'Porte de la bibliothèque' },
  garden: { side: -1, z: [50, 62], symbol: 'star', label: 'Porte du jardin' },
  inverted: { side: 1, z: [26, 38], symbol: 'heart', label: 'Porte de la chambre inversée' },
  between: { side: 1, z: [50, 62], symbol: 'door', label: 'Porte entre les portes' },
  secret: { side: 1, z: [76, 88], symbol: 'lamp', label: 'Passage' },
  corridor: { side: -1, z: [76, 88], symbol: null, label: 'Couloir inconnu' },
};
const Y0 = 6, Y1 = 36;

export class Hallway extends BaseScene {
  constructor(game) {
    super(game, 'hallway');
    const wall = (side, z, Y) => {
      const lit = 1 + 0.22 * Math.exp(-(((z - 40) / 10) ** 2)) + 0.22 * Math.exp(-(((z - 70) / 10) ** 2));
      let c;
      if (Y > 32) c = hex(C.woodD);
      else if (Y > 6) { const edge = (Math.floor(z / 14) !== Math.floor((z + 0.9) / 14)); c = edge ? hex(C.p2) : hex('#493c66'); if (Y > 6 && Y < 8) c = hex(C.woodL); }
      else if (Y < -33) c = hex(C.woodL);
      else c = Math.floor(z / 7) % 2 ? hex('#8a7fa8') : hex('#8176a0');
      return shade(c, lit);
    };
    const floor = (X, z) => {
      const lit = 1 + 0.2 * Math.exp(-(((z - 40) / 10) ** 2)) + 0.2 * Math.exp(-(((z - 70) / 10) ** 2));
      let c = Math.abs(X) > 34 ? hex(C.plum) : ((Math.floor((X + 100) / 14) + Math.floor(z / 14)) & 1) ? hex('#2f2548') : hex('#3a2e58');
      if (Math.abs(X) < 2.2) c = hex(C.p3);
      return shade(c, lit);
    };
    const ceil = (X, z) => {
      const lamp = (Math.abs(z - 55) < 2.5 || Math.abs(z - 85) < 2.5 || Math.abs(z - 30) < 2.5) && Math.abs(X) < 6;
      if (lamp) return hex('#F2DDFB');
      const panel = (Math.floor((X + 100) / 20) + Math.floor(z / 20)) & 1;
      return panel ? hex('#463a63') : hex('#3d3257');
    };
    const end = (X, Y) => {
      if (Math.abs(X) < 10 && Y > 8) return hex('#e9dcff');
      if (Y > 33) return hex(C.woodD);
      return Y > 6 ? hex('#5a4d7b') : hex('#968bb2');
    };
    this.bg = bakeCorridor({ wall, floor, ceil, end, zEnd: 100, fog: { color: hex('#2b2145'), amount: 0.55 } });
    this.bulb = { clicks: [], blink: 0, off: 0 };
  }

  enter() {
    const g = this.g;
    g.progress.discoverZone('hallway');
    g.progress.setFlag('hallway_opened', true);
    g.audio.setZoneTrack('couloir'); g.audio.setAmbient({ hum: 0.9, wind: 0.08 });
    if (g.state.zones.includes('hallway')) g.anom.trigger('new_corridor') && (g.state.flags.new_corridor_open = true);
  }

  _doorState(id) {
    const g = this.g, s = g.state;
    switch (id) {
      case 'garden': return { open: !!s.flags.garden_unlocked, need: g.has('lavender_key') };
      case 'inverted': return { open: !!s.flags.inverted_unlocked, need: g.has('clock_hand') };
      case 'between': return { visible: s.shardOrder.length >= 3, open: true };
      case 'secret': return { visible: !!s.flags.hall_secret, open: true };
      case 'corridor': return { visible: !!s.flags.new_corridor_open, open: true };
      default: return { open: true };
    }
  }

  draw(g, t) {
    const G = this.g;
    g.drawImage(this.bg, 0, 0);
    // ampoule centrale qui hésite
    const b = this.bulb; b.blink = Math.max(0, b.blink - 1 / 60);
    const flick = G.state.settings.reduceMotion ? 1 : (Math.sin(t * 17) > 0.94 ? 0.6 : 1);
    const on = b.blink > 0 ? (Math.floor(b.blink * 12) % 2 === 0 ? 0.2 : 1.4) : flick;
    const lp = proj(0, -36, 55);
    glow(g, lp.x, lp.y + 2, 50, '#F2DDFB', 0.14 * on);
    glow(g, CX, CY + 6, 70, '#F2DDFB', 0.07);
    // portes
    for (const id of Object.keys(DOORS)) this._drawDoor(g, id, t);
    // lueur de la porte de fond
    const er = this._endRect();
    glow(g, er.x + er.w / 2, er.y + er.h / 2, 30, '#F2DDFB', 0.16 + Math.sin(t * 1.3) * 0.02);
    R(g, C.moon, er.x, er.y, er.w, er.h); R(g, C.white, er.x + 2, er.y + 2, er.w - 4, er.h - 2);
    // poussière
    for (let i = 0; i < 14; i++) { const x = (i * 47 + t * 3 * ((i % 3) + 1)) % W, y = 20 + ((i * 29 + Math.sin(t * 0.5 + i) * 9) % 140); g.fillStyle = 'rgba(242,221,251,0.35)'; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
    // ombre au sol / vignette
    g.fillStyle = 'rgba(8,7,16,0.22)'; g.fillRect(0, 0, W, 4); g.fillRect(0, H - 4, W, 4);
  }

  _endRect() { const a = proj(-8, Y0, 100), b = proj(8, Y1, 100); return { x: Math.round(a.x), y: Math.round(a.y), w: Math.round(b.x - a.x), h: Math.round(b.y - a.y) }; }

  _drawDoor(g, id, t) {
    const d = DOORS[id], st = this._doorState(id);
    const [z1, z2] = d.z;
    if (st.visible === false) {
      if (id === 'secret') {
        // couture discrète sur le mur : indice pour qui regarde bien
        wallPatch(g, d.side, z1, z2, Y0, Y1, (u, v) => ((u < 0.04 || u > 0.96) ? 'rgba(8,7,16,0.18)' : null));
      }
      return;
    }
    const dark = id === 'corridor';
    const unlocked = st.open;
    const base = id === 'garden' ? C.lav2 : id === 'inverted' ? C.pinkD : id === 'between' ? C.goldD : id === 'secret' ? C.cyanD : C.wood;
    wallPatch(g, d.side, z1, z2, Y0, Y1, (u, v) => {
      if (dark) { return v < 0.04 ? C.abyss : `rgba(8,7,16,${0.95 - v * 0.15})`; }
      if (u < 0.07 || u > 0.93 || v < 0.05) return C.woodD;
      const panel = (u > 0.18 && u < 0.82) && ((v > 0.1 && v < 0.46) || (v > 0.54 && v < 0.94));
      const knob = u > (d.side < 0 ? 0.74 : 0.2) && u < (d.side < 0 ? 0.82 : 0.28) && v > 0.52 && v < 0.58;
      if (knob) return C.gold;
      if (id === 'secret') return panel ? C.n3 : C.p2;
      return panel ? base : C.woodL;
    });
    // pictogramme au-dessus de la porte
    if (d.symbol && !dark) {
      const p = proj(d.side * 40, -2, (z1 + z2) / 2);
      drawSymbol(g, d.symbol, Math.round(p.x - 3), Math.round(p.y), unlocked ? SYMBOL_COLOR[d.symbol] : C.p3);
    }
    // lueur d'une porte déverrouillée / verrou
    if (!unlocked && !dark) { const p = proj(d.side * 40, 20, (z1 + z2) / 2); R(g, C.lav, Math.round(p.x), Math.round(p.y), 1, 1); }
  }

  hotspots() {
    const g = this.g, h = [];
    const add = (o) => h.push(o);
    for (const id of ['library', 'garden', 'inverted', 'between', 'secret', 'corridor']) {
      const st = this._doorState(id); if (st.visible === false) continue;
      const d = DOORS[id];
      const rect = wallRect(d.side, d.z[0], d.z[1], Y0 - 6, Y1);
      add({ id: 'door_' + id, label: d.label, rect, z: 10, actions: [{ label: id === 'corridor' ? 'Avancer' : 'Ouvrir', run: () => this._door(id) }, { label: 'Examiner', run: () => this._examineDoor(id) }] });
    }
    const er = this._endRect();
    add({ id: 'door_room', label: 'Porte de la chambre', rect: { x: er.x - 3, y: er.y - 3, w: er.w + 6, h: er.h + 6 }, z: 20, actions: [{ label: 'Retourner à la chambre', run: () => this._toRoom() }] });
    const lp = proj(0, -36, 55);
    add({ id: 'bulb', label: 'Ampoule', rect: { x: Math.round(lp.x - 14), y: Math.round(lp.y - 8), w: 28, h: 18 }, z: 15, actions: [{ label: 'Toucher', run: () => this._bulb() }, { label: 'Examiner', run: () => this.say('Une ampoule dans un plafonnier. Elle hésite, comme si elle cherchait quelque chose à dire.') }] });
    return h;
  }

  _toRoom() { this.g.audio.sfx('door'); this.g.goto('room', { from: 'hallway' }); }

  _examineDoor(id) {
    const g = this.g, st = this._doorState(id);
    const t = {
      library: 'Un croissant de lune est gravé au-dessus de la porte. Elle sent le vieux papier.',
      garden: st.open ? 'Une étoile gravée. La serrure est lavande, et elle est ouverte.' : 'Une étoile gravée. La serrure est lavande. Quelque part, une clé de cette couleur.',
      inverted: st.open ? 'Un cœur gravé. La poignée est une aiguille d\'horloge.' : 'Un cœur gravé. Il manque la poignée : il y a un trou fin, en forme d\'aiguille.',
      between: 'Une porte dorée sur un mur qui, un instant plus tôt, n\'avait rien. Un petit symbole de porte, gravé. Elle t\'attendait.',
      secret: 'Une porte étroite, bleu-nuit, qui n\'existait pas il y a une minute. Une lampe est gravée au-dessus.',
      corridor: 'Un tronçon de couloir qui n\'était pas là tout à l\'heure. L\'obscurité y est très calme.',
    }[id];
    this.say(t);
  }

  async _door(id) {
    const g = this.g, st = this._doorState(id);
    if (id === 'library') { g.audio.sfx('door'); g.goto('library', { spawn: 'hall' }); return; }
    if (id === 'garden') {
      if (!st.open) {
        if (!st.need) { g.audio.sfx('doorlock'); await this.say('Verrouillée. La serrure est lavande. Une clé de la même couleur doit exister quelque part, dans un lieu qui range des choses.'); return; }
        g.audio.sfx('key'); await this.say('La clé lavande tourne dans la serrure comme si elle y avait toujours vécu.'); g.setFlag('garden_unlocked', true);
      }
      g.audio.sfx('door'); g.goto('garden', { spawn: 'hall' }); return;
    }
    if (id === 'inverted') {
      if (!st.open) {
        if (!st.need) { g.audio.sfx('doorlock'); await this.say('Il n\'y a pas de poignée. À la place, un petit trou fin, comme pour une aiguille.'); return; }
        g.audio.sfx('key'); await this.say('Tu glisses l\'aiguille d\'horloge dans le trou. Elle tourne à l\'envers, puis s\'immobilise : une poignée.'); g.setFlag('inverted_unlocked', true);
      }
      g.audio.sfx('door'); g.goto('inverted', { spawn: 'hall' }); return;
    }
    if (id === 'between') { g.audio.sfx('portal'); g.goto('between', { spawn: 'hall' }); return; }
    if (id === 'secret') { g.audio.sfx('door'); g.goto('lighthouse', { spawn: 'hall' }); return; }
    if (id === 'corridor') {
      g.audio.sfx('whisper');
      await this.say('Tu avances de quelques pas dans le couloir inconnu. Au sol, un papier plié : « Les portes ne s\'ouvrent pas. C\'est toi qui te souviens qu\'elles étaient ouvertes. »');
      if (!g.flag('new_corridor_seen')) { g.setFlag('new_corridor_seen', true); g.anom.found('new_corridor'); }
    }
  }

  async _bulb() {
    const g = this.g, b = this.bulb;
    b.blink = 0.9; g.audio.sfx('lamp');
    const now = this.t;
    b.clicks = b.clicks.filter((c) => now - c < 8); b.clicks.push(now);
    if (b.clicks.length >= 3 && !g.flag('hall_secret')) {
      b.clicks = [];
      g.audio.sfx('secret');
      g.setFlag('hall_secret', true);
      await this.say('La lumière cligne trois fois. Au troisième clignement, un pan de mur, à droite, recule d\'un souffle. Une porte étroite est apparue.');
      g.progress.discoverSecret('hall_bulb', 'Le mur qui cède (couloir)');
    } else if (!g.flag('hall_secret')) {
      g.say([{ text: ['La lumière vacille, puis se calme. Comme si elle t\'avait répondu.', 'Un deuxième clignement. L\'ampoule semble compter.'][Math.min(1, b.clicks.length - 1)] }]);
    } else g.say([{ text: 'L\'ampoule clignote encore, avec un peu de fierté.' }]);
  }
}
