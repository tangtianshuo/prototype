import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
const vec = (xyz) => new T.Vector3(...xyz);
const surface = (color, metalness, roughness, extra) =>
  new T.MeshStandardMaterial({ color, metalness, roughness, ...extra });

function texture(width, height, paint) {
  const image = document.createElement("canvas");
  image.width = width;
  image.height = height;
  paint(image.getContext("2d"), width, height);
  const result = new T.CanvasTexture(image);
  result.colorSpace = T.SRGBColorSpace;
  result.anisotropy = 4;
  return result;
}

function carbonTexture() {
  const result = texture(64, 64, (ctx, width, height) => {
    ctx.fillStyle = "#5b6270";
    ctx.fillRect(0, 0, width, height);
    for (let row = 0; row < 8; row++) {
      for (let column = 0; column < 8; column++) {
        const direction = (row + column) % 2;
        ctx.fillStyle = direction ? "#646c78" : "#757d8a";
        ctx.fillRect(column * 8, row * 8, 8, 8);
        ctx.fillStyle = "#939aa5";
        for (let thread = 1; thread < 7; thread += 2) {
          ctx.fillRect(column * 8 + (direction ? thread : 0), row * 8 + (direction ? 0 : thread), direction ? 1 : 8, direction ? 8 : 1);
        }
      }
    }
  });
  result.wrapS = result.wrapT = T.RepeatWrapping;
  result.repeat.set(10, 5);
  return result;
}

function materials() {
  return {
    titanium: surface(0x777f89, .68, .33),
    armor: surface(0x293342, .58, .38),
    edge: surface(0x9daad2, .76, .29),
    dark: surface(0x101823, .37, .41),
    rubber: surface(0x0c1117, .02, .76),
    carbon: surface(0x4a5363, .48, .34, { map: carbonTexture() }),
    trim: surface(0x267e80, .82, .33),
    silver: surface(0xa9b8c6, .78, .24),
    copper: surface(0xb26147, .73, .28),
    board: surface(0x103d39, .28, .43),
    trace: surface(0x8f7544, .68, .29),
    glass: new T.MeshPhysicalMaterial({
      color: 0x14324c, metalness: .52, roughness: .13, clearcoat: 1,
      clearcoatRoughness: .063, iridescence: .82, iridescenceIOR: 1.45, iridescenceThicknessRange: [180, 350],
    }),
    sensor: surface(0x122738, .72, .13),
    diode: surface(0x50ffe1, .36, .22, { emissive: 0x4affcf, emissiveIntensity: 2.15 }),
    amber: surface(0xf9ab67, .38, .28, { emissive: 0xe98b53, emissiveIntensity: .9 }),
  };
}

function mesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const result = new T.Mesh(geometry, material);
  result.position.set(...position);
  result.rotation.set(...rotation);
  parent.add(result);
  return result;
}

function polygon(points, depth, bevel) {
  const shape = new T.Shape();
  points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1 });
}

function panel(parent, material, points, y, depth, bevel = .025) {
  return mesh(parent, polygon(points.map(([x,z]) => [x,-z]), depth, bevel), material, [0,y,0], [-Math.PI / 2,0,0]);
}

function beveledBox(parent, material, dims, position, bevel = .035) {
  const [width, height, depth] = dims;
  const x = width / 2 - bevel;
  const y = height / 2 - bevel;
  const geometry = polygon([[-x,-y],[x,-y],[x,y],[-x,y]], depth - 2 * bevel, bevel);
  geometry.translate(0, 0, -depth / 2 + bevel);
  return mesh(parent, geometry, material, position);
}

function box(parent, material, dims, position, rotation) {
  return mesh(parent, new T.BoxGeometry(...dims), material, position, rotation);
}

function lathe(parent, material, top, base, height, position, axis = "y", segments = 40) {
  return mesh(parent, new T.CylinderGeometry(top, base, height, segments), material, position, axis === "z" ? [Math.PI / 2,0,0] : [0,0,0]);
}

function torus(parent, material, radius, thickness, position, axis = "y") {
  return mesh(parent, new T.TorusGeometry(radius, thickness, 8, 52), material, position, axis === "y" ? [Math.PI / 2,0,0] : [0,0,0]);
}

function bolt(parent, m, position, size = .044) {
  lathe(parent, m.silver, size, size * .95, .018, position, "y", 6);
  box(parent, m.dark, [size * .75,.005,size * .18], [position[0],position[1] + .0105,position[2]]);
}

function pipe(parent, material, points, radius) {
  const curve = new T.CatmullRomCurve3(points.map(vec));
  return mesh(parent, new T.TubeGeometry(curve, 12, radius, 7, false), material);
}

function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const batches = new Map();
  const inverse = group.matrixWorld.clone().invert();
  for (const child of group.children) {
    if (!child.isMesh || Array.isArray(child.material)) continue;
    const geo = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
    geo.applyMatrix4(inverse.clone().multiply(child.matrixWorld));
    if (!batches.has(child.material)) batches.set(child.material, []);
    batches.get(child.material).push({ child, geo });
  }
  for (const [material, batch] of batches) {
    if (batch.length > 1) {
      const combined = mergeGeometries(batch.map(({ geo }) => geo));
      for (const { child } of batch) {
        group.remove(child);
        child.geometry.dispose();
      }
      mesh(group, combined, material);
    }
    for (const { geo } of batch) geo.dispose();
  }
}

function loft(parent, material, sections) {
  const outline = [[-.69,0],[.69,0],[1,.15],[1,.63],[.92,.86],[.70,1],[-.70,1],[-.92,.86],[-1,.63],[-1,.15]];
  const rings = sections.map(([z, width, low, high]) =>
    outline.map(([u,v]) => [u * width / 2,low + v * (high - low),z]));
  const position = [];
  const uv = [];
  const tri = (a,b,c) => {
    position.push(...a,...b,...c);
    for (const p of [a,b,c]) uv.push(p[0],p[2]);
  };
  for (let segment = 0; segment < rings.length - 1; segment++) {
    for (let side = 0; side < outline.length; side++) {
      const next = (side + 1) % outline.length;
      const a = rings[segment][side];
      const b = rings[segment][next];
      const c = rings[segment + 1][next];
      const d = rings[segment + 1][side];
      tri(a,b,c);
      tri(a,c,d);
    }
  }
  for (let side = 1; side < outline.length - 1; side++) {
    const first = rings[0];
    const last = rings.at(-1);
    tri(first[0],first[side + 1],first[side]);
    tri(last[0],last[side],last[side + 1]);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(position, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return mesh(parent, geometry, material);
}

function bodyMark(parent) {
  const map = texture(512, 256, (ctx) => {
    ctx.fillStyle = "#e5edf3";
    ctx.font = "bold 70px Arial";
    ctx.textAlign = "center";
    ctx.fillText("STRATA", 256, 122);
    ctx.fillStyle = "#74f3df";
    ctx.font = "bold 28px monospace";
    ctx.fillText("X 1", 256, 164);
    ctx.fillRect(186, 185, 140, 2);
  });
  const ink = new T.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, toneMapped: false });
  mesh(parent, new T.PlaneGeometry(.69,.35), ink, [0,.713,.65], [-Math.PI / 2,0,0]);
}

function chassis(group, m) {
  loft(group, m.armor, [[-1.43,.63,-.23,.06],[-1.27,1.04,-.33,.13],[-.57,1.39,-.36,.17],[.66,1.57,-.35,.225],[1.27,1.43,-.30,.22],[1.51,.97,-.18,.19],[1.56,.77,-.12,.10]]);
  loft(group, m.dark, [[-1.29,.60,-.25,-.16],[-.91,1.17,-.43,-.13],[.68,1.16,-.42,-.14],[1.37,.74,-.26,-.10]]);
  beveledBox(group,m.dark,[1.06,.12,.19],[0,.05,1.515],.041);
  beveledBox(group,m.diode,[.55,.028,.045],[0,.072,1.631],.008);
  for (const side of [-1,1]) {
    const x = side * .438;
    lathe(group,m.dark,.113,.113,.082,[x,-.075,1.53],"z");
    torus(group,m.silver,.072,.011,[x,-.075,1.574],"z");
    lathe(group,m.sensor,.065,.064,.026,[x,-.075,1.582],"z");
    for (let vent = 0; vent < 6; vent++) {
      const z = -.86 + vent * .11;
      box(group,m.rubber,[.056,.126,.041],[side * (.638 + vent * .013),-.16,z],[0,side * -.15,side * -.24]);
    }
    beveledBox(group,m.rubber,[.164,.17,.46],[side * .465,-.44,-.86],.039);
    beveledBox(group,m.armor,[.18,.095,.58],[side * .459,-.41,.26],.03);
    pipe(group,m.edge,[[side*.35,-.142,1.548],[side*.63,-.17,1.32],[side*.744,-.18,.88]],.016);
  }
  beveledBox(group,m.dark,[.44,.092,.12],[0,-.082,-1.408],.026);
  box(group,m.amber,[.212,.026,.031],[0,-.068,-1.468]);
  for (let i = 0; i < 4; i++) bolt(group,m,[i % 2 ? .54 : -.54,-.328,i > 1 ? -.72 : .55],.036);
}

function topShell(group, m) {
  loft(group,m.titanium,[[-1.35,.62,.105,.30],[-1.18,.98,.13,.46],[-.55,1.27,.165,.63],[-.08,1.42,.18,.67],[.43,1.46,.197,.71],[.82,1.45,.195,.71],[1.16,1.32,.205,.64],[1.43,.98,.21,.43],[1.55,.70,.185,.27]]);
  loft(group,m.armor,[[-.99,.57,.42,.437],[-.59,.87,.54,.647],[-.16,.90,.60,.68],[.13,.79,.64,.704],[.25,.56,.65,.706]]);
  bodyMark(group);
  for (const side of [-1,1]) {
    pipe(group,m.edge,[[side*.38,.46,1.375],[side*.60,.616,1.03],[side*.64,.67,.66],[side*.604,.644,.17],[side*.543,.615,-.39],[side*.425,.485,-.98]],.012);
    pipe(group,m.dark,[[side*.264,.268,1.549],[side*.394,.38,1.455],[side*.55,.53,1.237]],.014);
    bolt(group,m,[side*.30,.716,.59],.030);
    for (let louver=0; louver<4; louver++) {
      box(group,m.dark,[.13,.012,.032],[side * .353,.689 - louver*.011,-.12-louver*.118],[.14,-side*.27,0]);
    }
  }
}

function battery(group, m) {
  beveledBox(group,m.armor,[.83,.29,1.11],[0,.27,-.56],.06);
  beveledBox(group,m.titanium,[.84,.105,1.047],[0,.42,-.55],.033);
  beveledBox(group,m.dark,[.77,.10,.17],[0,.27,-1.13],.021);
  for (let i=0;i<5;i++) {
    box(group,m.trace,[.047,.076,.019],[(i-2)*.082,.28,-1.227]);
  }
  for (let i=0;i<4;i++) box(group,i===3?m.trim:m.diode,[.042,.009,.067],[(i-1.5)*.084,.475,-.64]);
  for (const side of [-1,1]) {
    box(group,m.rubber,[.055,.101,.36],[side*.437,.277,-.49]);
    for (let i=0;i<5;i++) box(group,m.silver,[.017,.018,.02],[side*.47,.272,-.61+i*.053]);
  }
}

function flightBoard(group,m) {
  beveledBox(group,m.board,[1.12,.061,1.35],[0,.07,.42],.021);
  beveledBox(group,m.dark,[.375,.075,.385],[0,.132,.49],.023);
  beveledBox(group,m.armor,[.35,.026,.331],[0,.176,.49],.011);
  for (let i=0;i<5;i++) box(group,m.silver,[.032,.012,.248],[(i-2)*.063,.194,.49]);
  for (const side of [-1,1]) {
    for (let i=0;i<8;i++) box(group,m.trace,[.048,.012,.02],[side*.222,.105,.34+i*.042]);
    for (let i=0;i<6;i++) {
      const z = .07 + i*.145;
      box(group,i%2 ? m.dark : m.silver,[.09,.049,.083],[side*.392,.122,z]);
      box(group,m.trace,[.091,.008,.008],[side*.282,.105,z]);
    }
    for (const z of [-.13,.974]) bolt(group,m,[side*.472,.119,z],.044);
  }
  beveledBox(group,m.rubber,[.33,.13,.202],[0,.141,1.013],.023);
  for (let i=0;i<4;i++) box(group,m.trace,[.028,.036,.016],[(i-1.5)*.064,.151,1.123]);
}

function gimbalFrame(group,m) {
  lathe(group,m.dark,.33,.309,.105,[0,-.291,1.13]);
  lathe(group,m.trim,.256,.282,.087,[0,-.371,1.13]);
  torus(group,m.silver,.265,.016,[0,-.412,1.13]);
  const yoke = [[-.402,.02],[-.416,-.37],[-.336,-.53],[-.24,-.55],[-.20,-.46],[-.29,-.39],[-.28,-.04],[.266,-.04],[.289,-.37],[.20,-.46],[.241,-.55],[.337,-.53],[.41,-.37],[.402,.02],[.314,.066],[-.316,.066]];
  mesh(group,polygon(yoke,.162,.032),m.titanium,[0,-.414,1.015]);
  for (const side of [-1,1]) {
    const pivot = lathe(group,m.dark,.127,.127,.079,[side*.358,-.755,1.135]);
    pivot.rotation.z = Math.PI/2;
    const cap = lathe(group,m.edge,.086,.086,.015,[side*.406,-.755,1.135], "y", 32);
    cap.rotation.z = Math.PI/2;
  }
}

function optics(group,m) {
  beveledBox(group,m.dark,[.59,.51,.50],[0,-.762,1.258],.096);
  beveledBox(group,m.armor,[.582,.452,.16],[0,-.762,1.459],.07);
  lathe(group,m.titanium,.238,.244,.113,[0,-.762,1.548],"z");
  torus(group,m.trim,.208,.021,[0,-.762,1.604],"z");
  lathe(group,m.dark,.194,.202,.048,[0,-.762,1.622],"z");
  torus(group,m.silver,.169,.009,[0,-.762,1.651],"z");
  const lens = mesh(group,new T.SphereGeometry(1,36,20),m.glass,[0,-.762,1.634]);
  lens.scale.set(.164,.164,.06);
  const inner = mesh(group,new T.SphereGeometry(1,28,15),m.sensor,[0,-.762,1.687]);
  inner.scale.set(.073,.073,.013);
  torus(group,m.trim,.071,.004,[0,-.762,1.692],"z");
  const glint = new T.MeshBasicMaterial({ color:0x95ede7, transparent:true, opacity:.7, depthWrite:false });
  const reflection = mesh(group,new T.SphereGeometry(1,16,12),glint,[-.070,-.708,1.68]);
  reflection.scale.set(.042,.012,.0035);
  reflection.rotation.z = .44;
  const tiny = mesh(group,new T.SphereGeometry(.01,12,8),m.diode,[.061,-.796,1.691]);
  tiny.scale.set(1,.62,.4);
}

function arm(group,m,side,front,x,z) {
  const bend = front ? .75 : -.68;
  const xMount = front ? .60 : .53;
  const y = front ? .085 : .168;
  const path = (points) => points.map(([q,w]) => [side*q,w]);
  panel(group,m.armor,path([[xMount,bend-.185],[xMount+.27,bend-.242],[x-.37,z-.236],[x-.102,z-.248],[x+.18,z-.158],[x+.24,z+.096],[x+.039,z+.233],[x-.28,z+.19],[xMount+.265,bend+.192],[xMount,bend+.174]]),y-.185,.27,.046);
  panel(group,m.titanium,path([[xMount+.1,bend-.09],[xMount+.31,bend-.144],[x-.36,z-.163],[x-.106,z-.164],[x+.11,z-.108],[x+.16,z+.055],[x+.005,z+.147],[x-.29,z+.105],[xMount+.292,bend+.111],[xMount+.13,bend+.124]]),y+.104,.023,.021);
  panel(group,m.dark,path([[xMount+.28,bend-.036],[xMount+.405,bend-.094],[x-.37,z-.104],[x-.30,z-.073],[x-.27,z+.041],[xMount+.45,bend+.07]]),y+.138,.012,.009);
  panel(group,m.trim,path([[x-.53,z-.057],[x-.39,z-.062],[x-.268,z-.021],[x-.28,z+.014]]),y+.155,.010,.006);
  lathe(group,m.dark,.214,.218,.129,[side*(xMount+.17),y+.081,bend]);
  torus(group,m.edge,.156,.016,[side*(xMount+.17),y+.151,bend]);
  bolt(group,m,[side*(xMount+.17),y+.16,bend],.071);
  const endX = side*x;
  beveledBox(group,m.rubber,[.21,.20,.25],[endX,y-.264,z],.039);
  pipe(group,m.dark,[[side*(xMount+.315),y-.192,bend],[side*(x-.35),y-.201,z],[endX,y-.216,z]],.033);
  beveledBox(group,front?m.diode:m.amber,[.21,.028,.056],[side*(x-.072),y-.096,z+(front?.225:-.245)],.008);
}

function motor(group,m) {
  lathe(group,m.dark,.185,.227,.084,[0,.02,0]);
  lathe(group,m.titanium,.273,.247,.12,[0,.106,0]);
  lathe(group,m.dark,.246,.247,.085,[0,.202,0]);
  lathe(group,m.silver,.252,.253,.043,[0,.27,0]);
  lathe(group,m.armor,.233,.246,.044,[0,.315,0]);
  torus(group,m.trim,.225,.012,[0,.34,0]);
  for (let i=0;i<16;i++) {
    const theta = i * TAU / 16;
    box(group,m.copper,[.028,.05,.019],[Math.sin(theta)*.246,.208,Math.cos(theta)*.246],[0,theta,0]);
  }
  for (let i=0;i<4;i++) {
    const theta = i * TAU / 4 + Math.PI / 4;
    bolt(group,m,[Math.sin(theta)*.173,.343,Math.cos(theta)*.173],.022);
  }
  lathe(group,m.silver,.090,.09,.137,[0,.37,0]);
}

function rotor(group,m,length,flipped) {
  const shape = new T.Shape();
  shape.moveTo(.08,-.11);
  shape.bezierCurveTo(.30,-.152,.68,-.166,.94,-.103);
  shape.bezierCurveTo(1.025,-.081,1.013,-.021,.969,.014);
  shape.bezierCurveTo(.77,.128,.483,.152,.271,.113);
  shape.quadraticCurveTo(.13,.083,.083,.080);
  shape.closePath();
  const geo = new T.ExtrudeGeometry(shape,{depth:.019,bevelEnabled:true,bevelSize:.011,bevelThickness:.009,bevelSegments:2,curveSegments:15});
  geo.rotateX(-Math.PI/2);
  const p = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i=0;i<p.count;i++) {
    const x=p.getX(i), y=p.getY(i), z=p.getZ(i);
    p.setXYZ(i,x*length,y+z*(.42-.30*x),z);
    uv.setXY(i,x,z*2);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  for (const angle of [0,Math.PI]) {
    const blade = new T.Group();
    blade.rotation.y = angle;
    if (flipped) blade.scale.z = -1;
    group.add(blade);
    mesh(blade,geo.clone(),m.carbon,[0,.034,0]);
    panel(blade,m.titanium,[[length*.847,-.074],[length*.873,-.070],[length*.894,.077],[length*.873,.080]],.071,.003,.001);
    panel(blade,m.trim,[[length*.901,-.060],[length*.93,-.056],[length*.951,.057],[length*.924,.067]],.071,.003,.001);
  }
  geo.dispose();
  lathe(group,m.armor,.155,.134,.082,[0,.025,0]);
  lathe(group,m.silver,.100,.10,.047,[0,.078,0]);
  bolt(group,m,[0,.108,0],.050);
}

export function createDrone() {
  const root = new T.Group();
  const materialsByName = materials();
  const sections = [];
  const propellers = [];
  const anchors = {};
  function add(kind, position, offset, rotate, delay, draw) {
    const group = new T.Group();
    group.position.set(...position);
    root.add(group);
    draw(group,materialsByName);
    mergeStatic(group);
    sections.push({ kind, group, home: vec(position), offset: vec(offset), rotate, delay });
    return group;
  }
  function anchor(id, parent, location) {
    const point = new T.Object3D();
    point.position.set(...location);
    parent.add(point);
    anchors[id] = point;
  }

  add("airframe",[0,0,0],[0,-.18,-.10],[0,0,0],.08,chassis);
  const shell = add("airframe",[0,0,0],[0,1.74,-.55],[.05,.065,.025],0,topShell);
  anchor("airframe",shell,[0,.72,.22]);
  add("airframe",[0,0,0],[0,.91,-1.12],[0,0,0],.04,battery);
  const board = add("flight",[0,0,0],[0,.63,.58],[-.06,0,0],.1,flightBoard);
  anchor("flight",board,[0,.2,.48]);
  add("imaging",[0,0,0],[0,-.35,.79],[.03,0,0],.1,gimbalFrame);
  const camera = add("imaging",[0,0,0],[0,-.74,1.23],[.025,0,0],.12,optics);
  anchor("imaging",camera,[0,-.74,1.67]);

  for (const rear of [false,true]) {
    const x = rear ? 1.98 : 2.39;
    const z = rear ? -1.19 : 1.04;
    const y = rear ? .168 : .085;
    for (const s of [-1,1]) {
      const push = rear ? -.45 : .57;
      add("propulsion",[0,0,0],[s*.38,.02,push*.36],[0,-s*.024,0],.04,(group,m) => arm(group,m,s,!rear,x,z));
      const motorPart = add("propulsion",[s*x,y+.112,z],[s*.69,.17,push],[0,0,s*.065],.06,motor);
      if (rear && s === 1) anchor("propulsion",motorPart,[0,.36,0]);
      const prop = add("propulsion",[s*x,y+.535,z],[s*.69,.82,push],[0,0,s*.06],.01,(group,m) => rotor(group,m,rear?.876:1.015,s===1));
      const hub = new T.Group();
      hub.add(...[...prop.children]);
      prop.add(hub);
      const rest = rear ? s*.85 + .39 : s*.62 + .75;
      hub.rotation.y = rest;
      propellers.push({ hub, rest, direction: s*(rear?-1:1) });
    }
  }
  return { root, sections, anchors, propellers };
}
