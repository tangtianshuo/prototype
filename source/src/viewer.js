import * as T from "three";
import { createDrone } from "./drone.js";
import { createCinematic } from "./cinematic.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const viewport = $("#viewport");
const canvas = $("#drone-canvas");
const hero = $(".hero");
const status = $("#viewer-status");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const partInfo = {
  propulsion: ["01", "旋翼与动力", "四组独立电机与两叶可拆卸旋翼。"],
  airframe: ["02", "外壳与电池", "机身上盖、快拆电池与中央承力舱。"],
  imaging: ["03", "三轴影像云台", "云台支架与相机独立分离，展示镜头和转轴位置。"],
  flight: ["04", "飞控与主板", "中央飞控板集成姿态传感器与电机控制接口。"],
};

for (const button of $$("[data-download]")) {
  button.addEventListener("click", () => {
    const records = $$("#spec-table > div").map(row => [row.querySelector("dt").textContent, row.querySelector("dd").textContent]);
    const content = "\ufeff项目,参数\r\n" + [["规格状态", "概念设计目标"], ...records].map(row =>
      row.map(value => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "STRATA-X1-概念技术规格.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}

const navigation = $$(".header-inner nav a");
if ("IntersectionObserver" in window) {
  const sections = navigation.map(link => $(link.getAttribute("href")));
  const navObserver = new IntersectionObserver((entries) => {
    const active = entries.filter(entry => entry.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!active) return;
    navigation.forEach(link => {
      if (link.hash === "#" + active.target.id) link.setAttribute("aria-current","location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "0px 0px -53% 0px" });
  sections.forEach(section => navObserver.observe(section));
}

function softboxEnvironment(renderer) {
  const studio = new T.Scene();
  studio.background = new T.Color(0x24304a);
  const panels = [
    { size:[8,5], at:[-4,6,4], color:[4.6,5.1,6.5] },
    { size:[7,3], at:[6,4,-4], color:[1.5,3.7,5.2] },
    { size:[3.5,4.3], at:[2,2,6], color:[2.9,3.1,3.4] },
    { size:[3,6], at:[-6,1,-2], color:[.78,1.7,2.6] },
    { size:[8,2], at:[.2,7,-2], color:[3.2,4.0,4.8] },
  ];
  for (const { size,at,color } of panels) {
    const lamp = new T.Mesh(new T.PlaneGeometry(...size), new T.MeshBasicMaterial({ color: new T.Color(...color), side: T.DoubleSide }));
    lamp.position.set(...at);
    lamp.lookAt(0,0,0);
    studio.add(lamp);
  }
  const generator = new T.PMREMGenerator(renderer);
  const environment = generator.fromScene(studio, .055, .1, 30, { size: 128 });
  studio.traverse(object => {
    object.geometry?.dispose();
    object.material?.dispose();
  });
  generator.dispose();
  return environment;
}

function makeFloor() {
  const material = new T.ShaderMaterial({
    uniforms: { energy: { value:0 }, visibility: { value:1 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 coord;
      void main() {
        coord = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: `
      varying vec2 coord;
      uniform float energy;
      uniform float visibility;
      float grid(float scale) {
        vec2 pos = coord / scale;
        vec2 width = max(fwidth(pos),vec2(.0001));
        vec2 distanceToLine = abs(fract(pos-.5)-.5)/width;
        return 1.-smoothstep(.07,1.2,min(distanceToLine.x,distanceToLine.y));
      }
      float ring(float radius, float dist) {
        return 1.-smoothstep(.018,.018+fwidth(dist)*1.4,abs(dist-radius));
      }
      void main() {
        float dist = length(coord);
        float angle = atan(coord.y,coord.x);
        float mask = exp(-dist*dist*.061);
        float stripes = grid(.5)*.105 + grid(2.)*.10;
        float marks = ring(2.73,dist)*.28 + ring(3.2,dist)*(.25+.13*cos(2.*angle+.4))
          + ring(3.38,dist)*.16;
        float ticks = step(.88,cos(angle*72.))*(smoothstep(3.24,3.27,dist)-smoothstep(3.32,3.35,dist))*.38;
        float pulse = ring(2.9 + (1.-energy)*1.85,dist)*energy*.6;
        float contact = exp(-dot(coord*vec2(.49,.86),coord*vec2(.49,.86)))*.55;
        float lines = (stripes+marks+ticks+pulse)*mask;
        vec3 rgb = mix(vec3(.014,.024,.041),vec3(.28,.71,.74),lines/(lines+contact+.05));
        gl_FragColor = vec4(rgb,visibility*clamp(lines+contact,0.,.72));
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(25,25),material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1.88;
  return mesh;
}

function makeAssemblyLines(count) {
  const geometry = new T.BufferGeometry();
  const coordinates = new T.BufferAttribute(new Float32Array(count*6),3);
  coordinates.setUsage(T.DynamicDrawUsage);
  geometry.setAttribute("position",coordinates);
  const material = new T.LineBasicMaterial({ color:0x5edacd, transparent:true, opacity:0, depthWrite:false });
  const lines = new T.LineSegments(geometry,material);
  lines.frustumCulled = false;
  lines.visible = false;
  return lines;
}

function createViewer(renderer) {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38,1,.1,60);
  const focus = new T.Vector3();
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.23;
  const environment = softboxEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.08;
  scene.add(new T.HemisphereLight(0xcbdfff,0x283252,1.16));
  function light(color,intensity,at) {
    const result = new T.DirectionalLight(color,intensity);
    result.position.set(...at);
    scene.add(result);
    return result;
  }
  light(0xe6efff,3.5,[-3,6,5]);
  const rimLight = light(0x77d9ff,2.9,[5,3,-6]);
  light(0xb7d2e6,1.4,[1,1,6]);
  const floor = makeFloor();
  scene.add(floor);
  const drone = createDrone();
  scene.add(drone.root);
  const lines = makeAssemblyLines(drone.sections.length);
  drone.root.add(lines);

  const cinematic = createCinematic({ renderer, scene, drone, floor, rimLight, canvas, viewport, viewerCamera: camera });
  const home = { yaw:.40, pitch:.51, zoom:1 };
  const goal = { ...home };
  const view = { ...home };
  const drag = new Map();
  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  const projected = new T.Vector3();
  const labelPositions = $$("[data-marker]").map(button => ({
    name: button.dataset.marker, button, path: $(`[data-leader="${button.dataset.marker}"]`),
    point: $(`[data-point="${button.dataset.marker}"]`),
  }));
  const readout = $("#part-readout");
  const selectionDot = document.createElement("span");
  selectionDot.className = "selection-dot";
  selectionDot.setAttribute("aria-hidden","true");
  selectionDot.hidden = true;
  viewport.append(selectionDot);

  let width = 1, height = 1;
  let markerEndsDirty = true;
  let explosion = 0;
  let expanded = false;
  let selected = "";
  let allowed = true;
  let frameId = 0;
  let lastFrame = 0;
  let hover = null;
  let gesture = null;
  let pinchDistance = 0;
  const clamp = T.MathUtils.clamp;
  const smooth = (a,b,speed,dt) => {
    if (motion.matches || Math.abs(a-b)<.001) return b;
    return T.MathUtils.damp(a,b,speed,dt);
  };
  const phase = (t,a,b) => clamp((t-a)/(b-a),0,1);
  const easeInOut = x => x*x*(3-2*x);

  function requestDraw() {
    if (!frameId && allowed && !document.hidden) frameId = requestAnimationFrame(draw);
  }

  function resize() {
    width = Math.max(1,viewport.clientWidth);
    height = Math.max(1,viewport.clientHeight);
    if (cinematic.active) cinematic.resize();
    else {
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1,1.75));
      renderer.setSize(width,height,false);
    }
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    markerEndsDirty = true;
    requestDraw();
  }

  function relocateCamera() {
    const aspect = width/height;
    const base = Math.max(7.83,11.64/aspect);
    const spread = Math.max(10.85,15.7/aspect);
    const distance = T.MathUtils.lerp(base,spread,explosion) / view.zoom;
    const horizontal = Math.cos(view.pitch)*distance;
    focus.set(0,.03-explosion*.13,.03);
    camera.position.set(
      focus.x + Math.sin(view.yaw)*horizontal,
      focus.y + Math.sin(view.pitch)*distance,
      focus.z + Math.cos(view.yaw)*horizontal,
    );
    camera.lookAt(focus);
    camera.updateMatrixWorld();
  }

  function applyExplosion() {
    const position = lines.geometry.attributes.position;
    let i = 0;
    for (const { group, home:rest, offset, rotate, delay } of drone.sections) {
      const value = easeInOut(phase(explosion,delay,1));
      group.position.copy(rest).addScaledVector(offset,value);
      group.rotation.set(rotate[0]*value,rotate[1]*value,rotate[2]*value);
      position.setXYZ(i++,rest.x,rest.y,rest.z);
      position.setXYZ(i++,group.position.x,group.position.y,group.position.z);
    }
    position.needsUpdate = true;
    lines.visible = explosion>.035;
    lines.material.opacity = .32*phase(explosion,.22,1);
  }

  function projectedPoint(anchor) {
    anchor.getWorldPosition(projected).project(camera);
    return { x:(.5+.5*projected.x)*width, y:(.5-.5*projected.y)*height, visible:projected.z<1 };
  }

  function updateLabels() {
    const atHome = !expanded && explosion<.035 && !drag.size &&
      Math.abs(Math.atan2(Math.sin(view.yaw-home.yaw),Math.cos(view.yaw-home.yaw)))<.11 &&
      Math.abs(view.pitch-home.pitch)<.09 && Math.abs(view.zoom-home.zoom)<.14;
    viewport.classList.toggle("show-markers",atHome);
    if (atHome) {
      if (markerEndsDirty) {
        const viewRect = viewport.getBoundingClientRect();
        for (const label of labelPositions) {
          const buttonRect = label.button.getBoundingClientRect();
          const side = label.name === "airframe" ? 1 : -1;
          label.end = { x:(side===1?buttonRect.right:buttonRect.left)-viewRect.left, y:buttonRect.top-viewRect.top+buttonRect.height/2, side };
        }
        markerEndsDirty = false;
      }
      for (const label of labelPositions) {
        const { x,y } = projectedPoint(drone.anchors[label.name]);
        const end = label.end;
        const elbow = end.x+end.side*21;
        const secondary = elbow+(x-elbow)*.62;
        label.path.setAttribute("points",`${end.x},${end.y} ${elbow},${end.y} ${secondary},${y} ${x},${y}`);
        label.point.setAttribute("cx",x);
        label.point.setAttribute("cy",y);
      }
    }
    if (selected && expanded) {
      const {x,y,visible} = projectedPoint(drone.anchors[selected]);
      selectionDot.hidden = !visible || x<10 || y<10 || x>width-10 || y>height-10 || explosion<.15;
      selectionDot.style.transform = `translate(${x}px,${y}px)`;
    } else {
      selectionDot.hidden = true;
    }
  }

  function stopEntry() {
    if (!cinematic.active) return;
    cinematic.end();
    hero.classList.remove("is-entering");
    status.textContent = "无人机已进入整机查看器。";
    resize();
  }

  function draw(now) {
    frameId = 0;
    const dt = lastFrame ? Math.min((now-lastFrame)/1000,.042) : 1/60;
    lastFrame = now;
    if (cinematic.active && cinematic.finished(now)) stopEntry();
    view.yaw = smooth(view.yaw,goal.yaw,14,dt);
    view.pitch = smooth(view.pitch,goal.pitch,14,dt);
    view.zoom = smooth(view.zoom,goal.zoom,13,dt);
    const target = expanded ? 1 : 0;
    explosion = smooth(explosion,target,expanded?5.65:7.7,dt);
    relocateCamera();
    applyExplosion();
    if (cinematic.active) {
      cinematic.render(now,focus);
      requestDraw();
      return;
    }
    scene.updateMatrixWorld(true);
    renderer.render(scene,camera);
    updateLabels();
    if (hover && !drag.size) canvas.classList.toggle("is-hot",Boolean(hitTest(hover.x,hover.y)));
    if (explosion!==target || view.yaw!==goal.yaw || view.pitch!==goal.pitch || view.zoom!==goal.zoom) requestDraw();
  }

  function setSelection(kind) {
    selected = kind || "";
    readout.hidden = !selected;
    if (selected) {
      const [code,name,description] = partInfo[selected];
      $("#part-code").textContent = code;
      $("#part-title").textContent = name;
      $("#part-description").textContent = description;
      status.textContent = `${name}。 ${description}`;
    }
    requestDraw();
  }

  function setMode(to,kind) {
    stopEntry();
    expanded = to;
    if (expanded) viewport.classList.remove("show-markers");
    $(".viewer-frame").dataset.view = expanded ? "exploded" : "assembled";
    for (const button of $$("[data-mode]")) button.setAttribute("aria-pressed",String((button.dataset.mode==="exploded")===expanded));
    for (const button of $$("[data-toggle-explode]")) {
      button.setAttribute("aria-pressed",String(expanded));
      button.querySelector("span").textContent = expanded ? "合拢机身" : "展开机身";
    }
    if (expanded && goal.zoom>1.13) goal.zoom = 1.13;
    setSelection(expanded ? kind : "");
    if (!kind) status.textContent = expanded ? "爆炸视图已开启。点击部件查看资料。" : "已切回整机视图。";
    requestDraw();
  }

  function resetView() {
    stopEntry();
    goal.yaw += Math.atan2(Math.sin(home.yaw-goal.yaw),Math.cos(home.yaw-goal.yaw));
    goal.pitch = home.pitch;
    goal.zoom = home.zoom;
    requestDraw();
  }

  function playEntry() {
    setMode(false);
    Object.assign(goal,home);
    Object.assign(view,home);
    explosion = 0;
    if (motion.matches) {
      status.textContent = "已显示入场后的整机视图。";
      requestDraw();
      return;
    }
    viewport.classList.remove("show-markers");
    hero.classList.add("is-entering");
    cinematic.start();
    status.textContent = "正在播放无人机入场动画。";
    requestDraw();
  }

  function zoom(factor) {
    stopEntry();
    goal.zoom = clamp(goal.zoom*factor,.68,2.1);
    requestDraw();
  }

  function hitTest(clientX,clientY) {
    const bounds = canvas.getBoundingClientRect();
    pointer.set((clientX-bounds.left)/bounds.width*2-1,1-(clientY-bounds.top)/bounds.height*2);
    ray.setFromCamera(pointer,camera);
    return ray.intersectObjects(drone.sections.map(({group}) => group),true)[0]?.object;
  }

  function clicked(event) {
    const hit = hitTest(event.clientX,event.clientY);
    if (!hit) return;
    if (!expanded) {
      setMode(true);
      return;
    }
    let object = hit;
    while (object && object.parent!==drone.root) object = object.parent;
    const part = drone.sections.find(({group}) => group===object);
    if (part) setSelection(part.kind);
  }

  function orbit(dx,dy) {
    stopEntry();
    goal.yaw -= dx*.0076;
    goal.pitch = clamp(goal.pitch+dy*.0076,-1.42,1.42);
    requestDraw();
  }

  function pinch() {
    const [a,b] = drag.values();
    return Math.hypot(a.x-b.x,a.y-b.y);
  }

  canvas.addEventListener("pointerdown",event => {
    if (event.button!==0 && event.pointerType==="mouse") return;
    stopEntry();
    if (!drag.size) gesture = { x:event.clientX,y:event.clientY,moved:false };
    drag.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (drag.size===2) {
      pinchDistance = pinch();
      gesture.moved = true;
    }
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
    viewport.classList.add("has-pointer-focus");
    viewport.focus({ preventScroll:true });
    requestDraw();
  });

  canvas.addEventListener("pointermove",event => {
    const prior = drag.get(event.pointerId);
    const x=event.clientX, y=event.clientY;
    if (!prior) {
      if (event.pointerType==="mouse") {
        hover = {x,y};
        requestDraw();
      }
      return;
    }
    drag.set(event.pointerId,{x,y});
    if (drag.size>1) {
      const distance = pinch();
      if (pinchDistance>0) zoom(distance/pinchDistance);
      pinchDistance = distance;
      return;
    }
    if (!gesture.moved && Math.hypot(x-gesture.x,y-gesture.y)<5) return;
    gesture.moved = true;
    orbit(x-prior.x,y-prior.y);
  });

  function finishPointer(event) {
    if (!drag.delete(event.pointerId)) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (drag.size) {
      pinchDistance = drag.size>1 ? pinch() : 0;
      return;
    }
    canvas.classList.remove("is-dragging");
    if (event.type==="pointerup" && gesture && !gesture.moved) clicked(event);
    gesture = null;
    requestDraw();
  }
  canvas.addEventListener("pointerup",finishPointer);
  canvas.addEventListener("pointercancel",finishPointer);
  canvas.addEventListener("lostpointercapture",finishPointer);
  canvas.addEventListener("pointerleave",() => {
    hover = null;
    canvas.classList.remove("is-hot");
  });
  canvas.addEventListener("wheel",event => {
    event.preventDefault();
    zoom(Math.exp(-clamp(event.deltaY*(event.deltaMode===1?14:1),-125,125)*.002));
  }, { passive:false });

  viewport.addEventListener("blur",() => viewport.classList.remove("has-pointer-focus"));
  viewport.addEventListener("keydown",event => {
    if (event.target!==viewport) return;
    viewport.classList.remove("has-pointer-focus");
    const operations = {
      ArrowLeft: () => orbit(21,0), ArrowRight: () => orbit(-21,0),
      ArrowUp: () => orbit(0,21), ArrowDown: () => orbit(0,-21),
      "+": () => zoom(1.18), "=": () => zoom(1.18), "-": () => zoom(1/1.18),
      Home: resetView, Enter: () => setMode(!expanded), " ": () => setMode(!expanded),
    };
    if (!operations[event.key]) return;
    event.preventDefault();
    operations[event.key]();
  });

  for (const button of $$("[data-mode]")) button.addEventListener("click",() => setMode(button.dataset.mode==="exploded"));
  for (const button of $$("[data-toggle-explode]")) button.addEventListener("click",() => setMode(!expanded));
  for (const button of $$("[data-marker]")) button.addEventListener("click",() => {
    setMode(true,button.dataset.marker);
    viewport.focus({ preventScroll:true });
  });
  for (const button of $$("[data-component]")) button.addEventListener("click",() => {
    resetView();
    setMode(true,button.dataset.component);
    viewport.focus({ preventScroll:true });
    viewport.scrollIntoView({block:"center",behavior:motion.matches?"instant":"smooth"});
  });
  $("#zoom-in").addEventListener("click",() => zoom(1.17));
  $("#zoom-out").addEventListener("click",() => zoom(1/1.17));
  $("#reset-view").addEventListener("click",resetView);
  $("#replay").addEventListener("click",playEntry);
  cinematic.onSkip(stopEntry);

  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  document.fonts?.ready.then(() => {
    markerEndsDirty = true;
    requestDraw();
  });
  document.addEventListener("visibilitychange",requestDraw);
  motion.addEventListener("change",() => {
    if (motion.matches) stopEntry();
    requestDraw();
  });
  canvas.addEventListener("webglcontextlost",() => {
    stopEntry();
    allowed = false;
    cancelAnimationFrame(frameId);
    showFallback();
  });
  resize();
  viewport.tabIndex = 0;
  document.documentElement.dataset.graphics = "ready";
  if (!motion.matches && (!location.hash || location.hash==="#overview")) playEntry();
}

function showFallback() {
  document.documentElement.dataset.graphics = "fallback";
  viewport.classList.remove("show-markers");
  hero.classList.remove("is-entering");
  delete document.documentElement.dataset.entry;
  viewport.removeAttribute("tabindex");
  viewport.removeAttribute("aria-describedby");
  viewport.setAttribute("aria-label","无人机静态预览");
}

try {
  const context = canvas.getContext("webgl2",{ alpha:true, antialias:true, premultipliedAlpha:true, powerPreference:"high-performance" });
  if (context) createViewer(new T.WebGLRenderer({ canvas, context, alpha:true, antialias:true }));
  else showFallback();
} catch (error) {
  console.error("STRATA 3D viewer initialization failed",error);
  showFallback();
}
