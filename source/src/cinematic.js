import { MathUtils, PerspectiveCamera, Vector3 } from "three";

const { clamp, lerp, smoothstep } = MathUtils;
const turn = 2 * Math.PI;
const duration = 3.58;
const handoffStart = 2.35;

// Each point sets the position on screen, camera distance and attitude through the flyby.
const flyby = [
  { t:0,    x:1.15,y:.30, distance:44,  yaw:.70, pitch:.16, bank:-.38, nose:-.12, bearing:.45, exposure:.10 },
  { t:.35,  x:.96, y:.33, distance:30,  yaw:.60, pitch:.19, bank:-.31, nose:-.10, bearing:.33, exposure:.21 },
  { t:.67,  x:.80, y:.37, distance:18,  yaw:.48, pitch:.18, bank:-.25, nose:-.14, bearing:.17, exposure:.47 },
  { t:1.05, x:.61, y:.445,distance:8.0, yaw:.32, pitch:.15, bank:-.13, nose:-.22, bearing:-.13,exposure:.83 },
  { t:1.34, x:.42, y:.53, distance:4.65,yaw:.27, pitch:.23, bank:.15,  nose:-.17, bearing:-.28,exposure:1.20 },
  { t:1.58, x:.34, y:.57, distance:5.15,yaw:.34, pitch:.34, bank:.26,  nose:-.04, bearing:-.22,exposure:1.31 },
  { t:1.93, x:.402,y:.54, distance:7.35,yaw:.46, pitch:.43, bank:.075, nose:.05,  bearing:-.09,exposure:1.15 },
  { t:2.35, x:.47, y:.52, distance:8.35,yaw:.49, pitch:.49, bank:-.02, nose:.015, bearing:.01, exposure:1.02 },
];
const shotFields = ["x","y","distance","yaw","pitch","bank","nose","bearing","exposure"];

function sampleFlight(elapsed, result) {
  let index = 1;
  while (index < flyby.length - 1 && elapsed > flyby[index].t) index++;
  const start = flyby[index - 1];
  const end = flyby[index];
  const before = flyby[Math.max(0,index - 2)];
  const after = flyby[Math.min(flyby.length - 1,index + 1)];
  const span = end.t - start.t;
  const u = clamp((elapsed - start.t) / span,0,1);
  const u2 = u * u;
  const u3 = u2 * u;
  for (const field of shotFields) {
    const startSpeed = (end[field] - before[field]) / (end.t - before.t);
    const endSpeed = index === flyby.length - 1 ? 0 : (after[field] - start[field]) / (after.t - start.t);
    result[field] = (2*u3-3*u2+1)*start[field] + (u3-2*u2+u)*span*startSpeed
      + (3*u2-2*u3)*end[field] + (u3-u2)*span*endSpeed;
  }
}

function createParticles() {
  let seed = 1946;
  const random = () => {
    seed = (Math.imul(seed,1664525)+1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length:184 }, (_, i) => ({
    angle: random()*turn,
    depth: random(),
    radius: .12 + random()*.77,
    speed: .5 + random()*.9,
    size: .5 + random()*1.48,
    warm: i % 12 === 0,
  }));
}

function paintAtmosphere(ctx, width, height, elapsed, shot, particles) {
  if (!ctx) return;
  ctx.clearRect(0,0,width,height);
  const fade = 1-smoothstep(elapsed,2.42,3.20);
  if (fade <= 0) return;
  const largeSide = Math.max(width,height);
  const turbulence = smoothstep(elapsed,.18,1.16)*(1-smoothstep(elapsed,1.35,2.12));
  const ignition = Math.exp(-39*(elapsed-1.29)**2);
  const shock = clamp((elapsed-1.30)/1.18,0,1);
  const plume = Math.max(0,Math.sin(Math.PI*shock));
  const originX = width*lerp(.79,.39,smoothstep(elapsed,.38,1.50));
  const originY = height*lerp(.33,.54,smoothstep(elapsed,.38,1.50));

  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const phase = (particle.depth + elapsed*(.085 + .07*particle.speed) + turbulence*.43) % 1;
    const radius = largeSide*particle.radius*(.06+phase*phase);
    const c = Math.cos(particle.angle);
    const s = Math.sin(particle.angle);
    const x = originX + c*radius;
    const y = originY + s*radius*.69;
    const streak = (.45+(turbulence*51+plume*16)*phase)*particle.speed;
    const edge = Math.sin(Math.PI*phase);
    ctx.globalAlpha = fade * edge * (.07 + turbulence*(.28 + particle.depth*.22) + plume*.08);
    ctx.strokeStyle = particle.warm ? "#ecc19d" : i%3===0 ? "#b3f9ff" : "#4d9fc2";
    ctx.lineWidth = particle.size*(.67 + turbulence*.39);
    ctx.beginPath();
    ctx.moveTo(x-c*streak,y-s*streak*.69);
    ctx.lineTo(x,y);
    ctx.stroke();
  }

  if (ignition > .02) {
    const x = width*(shot.x+.08);
    const y = height*(shot.y-.13);
    const light = ctx.createRadialGradient(x,y,0,x,y,largeSide*.43);
    light.addColorStop(0,"rgba(100, 215, 249, .31)");
    light.addColorStop(.17,"rgba(50, 158, 219, .14)");
    light.addColorStop(1,"rgba(35, 111, 178, 0)");
    ctx.globalAlpha = ignition;
    ctx.fillStyle = light;
    ctx.fillRect(0,0,width,height);

    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(-.22);
    const slash = ctx.createLinearGradient(-width*.93,0,width*.86,0);
    slash.addColorStop(0,"#48ceff00");
    slash.addColorStop(.23,"#459fcb2b");
    slash.addColorStop(.49,"#91f9ffa0");
    slash.addColorStop(.52,"#e9ffff");
    slash.addColorStop(.63,"#51ccff79");
    slash.addColorStop(1,"#48ceff00");
    ctx.fillStyle = slash;
    ctx.globalAlpha = ignition*.86;
    ctx.fillRect(-width*.93,-.85,width*1.79,1.7);
    ctx.globalAlpha = ignition*.24;
    ctx.fillRect(-width*.93,-3.4,width*1.79,6.8);
    ctx.restore();
  }

  if (shock > 0 && shock < 1) {
    const x = width*.37;
    const y = height*.55;
    const radius = largeSide*(.16+.54*(1-(1-shock)**2));
    ctx.strokeStyle = "#a0f9ff";
    ctx.globalAlpha = plume*.34*fade;
    ctx.lineWidth = Math.max(1,largeSide*.0012);
    ctx.beginPath();
    ctx.ellipse(x,y,radius,radius*.44,-.24,0,turn);
    ctx.stroke();
    ctx.strokeStyle = "#68b6ec";
    ctx.globalAlpha = plume*.115*fade;
    ctx.lineWidth = Math.max(2,largeSide*.005);
    ctx.beginPath();
    ctx.ellipse(x,y,radius*.987,radius*.445,-.24,0,turn);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export function createCinematic({ renderer, scene, drone, floor, rimLight, canvas, viewport, viewerCamera }) {
  const stage = document.querySelector("#cinematic");
  const sky = stage.querySelector(".cinematic-sky");
  const picture = stage.querySelector(".cinematic-picture");
  const grade = stage.querySelector(".cinematic-grade");
  const skip = stage.querySelector("#skip-entry");
  const effects = stage.querySelector("#entry-fx");
  const viewerExposure = renderer.toneMappingExposure;
  const viewerRim = { intensity:rimLight.intensity, position:rimLight.position.clone() };
  const ctx = effects.getContext("2d");
  const afterCanvas = canvas.nextElementSibling;
  const filmCamera = new PerspectiveCamera(viewerCamera.fov,1,.1,160);
  const aim = new Vector3();
  const orbit = new Vector3();
  const particles = createParticles();
  const shot = {};
  let started = null;
  let width = 0, height = 0, ratio = 0;

  function start() {
    started = null;
    sky.style.opacity = "1";
    sky.style.setProperty("--sky-light","0");
    picture.style.clipPath = "none";
    effects.style.opacity = "1";
    grade.style.opacity = "1";
    skip.hidden = false;
    document.documentElement.dataset.entry = "";
    stage.showModal();
    picture.append(canvas);
    width = 0;
    resize();
  }

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1,1.45);
    if (w === width && h === height && dpr === ratio) return;
    width = Math.max(1,w);
    height = Math.max(1,h);
    ratio = dpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width,height,false);
    const fxRatio = Math.min(dpr,1.12);
    effects.width = Math.round(width*fxRatio);
    effects.height = Math.round(height*fxRatio);
    ctx?.setTransform(fxRatio,0,0,fxRatio,0,0);
  }

  function end() {
    if (!stage.open) return;
    viewport.insertBefore(canvas,afterCanvas);
    stage.close();
    delete document.documentElement.dataset.entry;
    drone.root.rotation.set(0,0,0);
    for (const {hub,rest} of drone.propellers) hub.rotation.y = rest;
    floor.visible = true;
    floor.material.uniforms.energy.value = 0;
    floor.material.uniforms.visibility.value = 1;
    renderer.toneMappingExposure = viewerExposure;
    rimLight.intensity = viewerRim.intensity;
    rimLight.position.copy(viewerRim.position);
  }

  function render(now, viewerFocus) {
    started ??= now;
    const elapsed = (now - started)/1000;
    resize();
    sampleFlight(Math.min(elapsed,handoffStart),shot);
    const fit = smoothstep(elapsed,handoffStart,duration-.10);
    const clip = smoothstep(elapsed,2.66,duration-.08);
    const page = smoothstep(elapsed,2.42,duration-.06);
    const rect = viewport.getBoundingClientRect();
    const frameWidth = lerp(width,rect.width,fit);
    const frameHeight = lerp(height,rect.height,fit);
    const impact = elapsed >= 1.29 ? Math.sin((elapsed-1.29)*48)*Math.exp(-(elapsed-1.29)*12) : 0;
    const centerX = lerp(shot.x*width,rect.left+rect.width/2,fit) + impact*width*.007;
    const centerY = lerp(shot.y*height,rect.top+rect.height/2,fit) + impact*height*.009;
    filmCamera.setViewOffset(frameWidth,frameHeight,frameWidth/2-centerX,frameHeight/2-centerY,width,height);
    const portrait = Math.max(1,.98*height/width);
    const distance = shot.distance*portrait;
    const horizontal = Math.cos(shot.pitch)*distance;
    orbit.set(Math.sin(shot.yaw)*horizontal,Math.sin(shot.pitch)*distance,Math.cos(shot.yaw)*horizontal);
    filmCamera.position.copy(orbit.lerp(viewerCamera.position,fit));
    aim.set(0,0,0).lerp(viewerFocus,fit);
    filmCamera.lookAt(aim);
    filmCamera.updateMatrixWorld();

    drone.root.rotation.set(shot.nose*(1-fit),shot.bearing*(1-fit),shot.bank*(1-fit));
    const spin = 11*(1-(1-clamp(elapsed/2.52,0,1))**2.25)*turn;
    for (const {hub,direction,rest} of drone.propellers) hub.rotation.y = rest+direction*spin;
    renderer.toneMappingExposure = viewerExposure*lerp(shot.exposure,1,fit);
    const flash = Math.exp(-23*(elapsed-1.32)**2);
    rimLight.intensity = viewerRim.intensity + 4.5*flash;
    rimLight.position.set(lerp(-4.8,viewerRim.position.x,smoothstep(elapsed,.82,2.54)),viewerRim.position.y,viewerRim.position.z);
    const floorFade = smoothstep(clip,.31,1);
    floor.visible = floorFade > 0;
    floor.material.uniforms.energy.value = .38*Math.sin(Math.PI*floorFade);
    floor.material.uniforms.visibility.value = floorFade;
    renderer.render(scene,filmCamera);

    if (clip > 0) {
      const top = Math.max(0,rect.top)*clip;
      const right = Math.max(0,width-rect.right)*clip;
      const bottom = Math.max(0,height-rect.bottom)*clip;
      const left = Math.max(0,rect.left)*clip;
      picture.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
    }
    sky.style.opacity = String(1-page);
    sky.style.setProperty("--sky-light",String(smoothstep(elapsed,.13,.92)));
    grade.style.opacity = String(1-smoothstep(elapsed,2.21,3.22));
    if (page > .38) skip.hidden = true;
    paintAtmosphere(ctx,width,height,elapsed,shot,particles);
  }

  return {
    get active() { return stage.open; },
    finished: (now) => started !== null && now-started >= duration*1000,
    start, end, resize, render,
    onSkip(callback) {
      skip.addEventListener("click",callback);
      stage.addEventListener("cancel",event => {
        event.preventDefault();
        callback();
      });
    },
  };
}
