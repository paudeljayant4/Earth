'use strict';
const isMob=window.innerWidth<769;
const isLow=isMob||(navigator.hardwareConcurrency||4)<=4||window.devicePixelRatio<1.5;
const W=()=>window.innerWidth,H=()=>window.innerHeight;

/* ══════════════════════════════════════════════════
   THREE.JS SCENE SETUP
══════════════════════════════════════════════════ */
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(58,W()/H(),.1,3000);
cam.position.set(0,0,isMob?8.5:6.8);

const ren=new THREE.WebGLRenderer({
  canvas:document.getElementById('bg'),
  antialias:!isLow,
  powerPreference:isLow?'low-power':'high-performance'
});
ren.setSize(W(),H());
ren.setPixelRatio(Math.min(window.devicePixelRatio,isLow?1:2));

// LIGHTS
const sun=new THREE.PointLight(0xfff8f0,3.8,1000);
sun.position.set(14,6,10);scene.add(sun);
const fill=new THREE.PointLight(0x0d2278,.55,400);
fill.position.set(-10,-5,-8);scene.add(fill);
const rim=new THREE.PointLight(0x0066ff,.3,300);
rim.position.set(-8,8,-5);scene.add(rim);
scene.add(new THREE.AmbientLight(0x050814,.7));

/* ══════════════════════════════════════════════════
   PRNG
══════════════════════════════════════════════════ */
const H2=(s)=>{let x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);};

/* ══════════════════════════════════════════════════
   PROCEDURAL TEXTURES — ALL GLSL / CANVAS (NO PNG)
══════════════════════════════════════════════════ */
function mkDay(){
  const TW=isLow?512:1024,TH=isLow?256:512;
  const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
  const c=cv.getContext('2d');
  // Ocean base gradient
  const og=c.createLinearGradient(0,0,0,TH);
  og.addColorStop(0,'#061840');og.addColorStop(.35,'#093264');og.addColorStop(.5,'#0a3472');og.addColorStop(.65,'#093264');og.addColorStop(1,'#061840');
  c.fillStyle=og;c.fillRect(0,0,TW,TH);
  // Ocean shimmer
  for(let i=0;i<500;i++){
    const x=H2(i*1.3)*TW,y=H2(i*2.7)*TH;
    c.fillStyle=`rgba(50,120,200,${H2(i*.7)*.06})`;
    c.fillRect(x,y,H2(i*3.1)*5+1,1);
  }
  // Landmasses — refined shapes
  const LC=['#1e4218','#295922','#356b1c','#487828','#6a9230','#8aaa46','#a0b85a'];
  const LAND=[
    // Europe
    [.575,.28,42,28,-.22,0,.9],[.595,.24,28,20,-.18,1,.85],[.61,.32,35,22,.12,2,.88],
    // Africa
    [.595,.45,48,70,.04,0,.92],[.61,.52,38,52,.08,1,.88],[.63,.58,30,40,.06,2,.85],[.605,.62,22,28,.1,0,.82],
    // Asia
    [.65,.28,82,48,-.08,1,.94],[.70,.36,60,40,.1,0,.9],[.72,.30,42,32,.14,2,.86],[.76,.38,36,28,-.06,1,.88],
    [.74,.26,30,24,.12,0,.84],[.68,.34,38,30,.06,3,.88],[.78,.36,28,22,.1,2,.85],
    // Australia
    [.79,.58,48,30,.18,2,.88],[.82,.62,32,22,-.1,0,.82],
    // North America
    [.17,.32,78,50,-.24,1,.92],[.20,.30,52,38,-.14,0,.88],[.15,.40,42,30,.15,2,.84],[.22,.26,32,20,.2,1,.8],
    // South America
    [.22,.54,42,62,.06,0,.90],[.21,.60,32,48,.1,1,.86],[.24,.62,28,38,0,2,.82],
    // Greenland
    [.22,.14,30,18,-.3,5,.65],
    // Antarctica hint
    [.40,.92,120,14,0,6,.55],
    // Indonesia
    [.78,.50,22,16,.1,0,.78],[.82,.52,16,12,0,1,.72],[.74,.52,18,14,.12,2,.76],
    // Japan
    [.77,.32,12,24,-.28,1,.72],
    // UK
    [.565,.26,10,18,-.2,1,.78],
    // Madagascar
    [.655,.60,10,20,.08,0,.75],
    // Scandinavia
    [.585,.18,14,30,-.15,1,.82],[.595,.16,12,22,-.1,0,.78],
  ];
  LAND.forEach(([cx,cy,rx,ry,rot,ci,a])=>{
    c.save();c.translate(cx*TW,cy*TH);c.rotate(rot||0);c.scale(1,ry/rx);
    const g=c.createRadialGradient(0,0,0,0,0,rx);
    g.addColorStop(0,LC[ci%LC.length]);g.addColorStop(.6,LC[(ci+1)%LC.length]);g.addColorStop(1,'transparent');
    c.globalAlpha=a;c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fillStyle=g;c.fill();c.restore();
  });
  // Mountain highlights
  c.globalAlpha=.25;
  [[.70,.28,22,14],[.17,.32,18,12],[.72,.30,16,10],[.22,.54,12,18]].forEach(([cx,cy,rx,ry])=>{
    c.save();c.translate(cx*TW,cy*TH);c.scale(1,ry/rx);
    c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fillStyle='rgba(200,210,200,.6)';c.fill();c.restore();
  });
  // Deserts
  c.globalAlpha=.4;
  [[.59,.48,30,18,.06],[.61,.54,24,15,.1],[.68,.40,18,12,0]].forEach(([cx,cy,rx,ry,rot])=>{
    c.save();c.translate(cx*TW,cy*TH);c.rotate(rot);c.scale(1,ry/rx);
    c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fillStyle='#c9a84c';c.fill();c.restore();
  });
  c.globalAlpha=1;
  // Polar ice caps
  const iT=c.createLinearGradient(0,0,0,52);iT.addColorStop(0,'rgba(215,238,255,.98)');iT.addColorStop(1,'transparent');
  c.fillStyle=iT;c.fillRect(0,0,TW,52);
  const iB=c.createLinearGradient(0,TH-40,0,TH);iB.addColorStop(0,'transparent');iB.addColorStop(1,'rgba(215,238,255,.95)');
  c.fillStyle=iB;c.fillRect(0,TH-40,TW,40);
  // Extra land detail noise
  for(let i=0;i<800;i++){
    const x=H2(i*3.7)*TW,y=H2(i*5.1)*TH;
    const bright=H2(i*2.3)*.08;
    c.fillStyle=`rgba(80,130,60,${bright})`;
    c.fillRect(x,y,1,1);
  }
  return new THREE.CanvasTexture(cv);
}

function mkNight(){
  const TW=isLow?512:1024,TH=isLow?256:512;
  const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
  const c=cv.getContext('2d');
  c.fillStyle='#000';c.fillRect(0,0,TW,TH);
  // City clusters aligned to continents
  const CLU=[
    // Europe
    [.575,.28,70],[.595,.24,50],[.59,.32,42],[.565,.26,30],[.585,.18,22],
    // East USA
    [.17,.32,80],[.20,.30,65],[.15,.40,35],[.185,.36,55],
    // West USA
    [.12,.34,40],[.10,.36,30],[.13,.38,25],
    // East Asia / China / Japan
    [.77,.32,55],[.74,.34,75],[.72,.30,60],[.80,.34,45],[.78,.32,40],
    // India
    [.665,.44,55],[.655,.48,45],[.67,.50,35],
    // Middle East
    [.635,.38,30],[.625,.36,25],
    // SE Asia
    [.73,.50,40],[.77,.52,30],
    // South America
    [.24,.60,42],[.22,.54,35],[.26,.64,28],
    // Africa
    [.595,.52,30],[.61,.56,25],[.625,.60,20],[.59,.60,22],
    // Australia
    [.82,.64,35],[.80,.62,28],
    // Russia
    [.65,.22,30],[.70,.18,25],[.72,.22,20],
  ];
  CLU.forEach(([cx,cy,den])=>{
    for(let i=0;i<den*10;i++){
      const px=(cx+H2(i*13.7+cy*100)*.11)*TW,py=(cy+H2(i*7.3+cx*100)*.065)*TH;
      const br=H2(i*3.1+cy)*.92+.08;
      const warm=H2(i*2.7+cx)<.65;
      c.globalAlpha=br*.9;
      c.fillStyle=warm?'rgba(255,245,160,1)':'rgba(140,190,255,1)';
      c.fillRect(px,py,H2(i*4.9)<.92?1:1.5,H2(i*4.9)<.92?1:1.5);
    }
    const hg=c.createRadialGradient(cx*TW,cy*TH,0,cx*TW,cy*TH,40);
    hg.addColorStop(0,'rgba(255,210,100,.1)');hg.addColorStop(1,'transparent');
    c.globalAlpha=1;c.fillStyle=hg;c.fillRect(cx*TW-42,cy*TH-42,84,84);
  });
  c.globalAlpha=1;
  return new THREE.CanvasTexture(cv);
}

function mkSpec(){
  const TW=512,TH=256;
  const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
  const c=cv.getContext('2d');
  // Ocean = shiny (light gray), land = matte (dark)
  c.fillStyle='#8899bb';c.fillRect(0,0,TW,TH);
  const LAND2=[
    [.575,.28,42,28,-.22],[.595,.24,28,20,-.18],[.61,.32,35,22,.12],
    [.595,.45,48,70,.04],[.61,.52,38,52,.08],[.63,.58,30,40,.06],
    [.65,.28,82,48,-.08],[.70,.36,60,40,.1],[.72,.30,42,32,.14],
    [.76,.38,36,28,-.06],[.74,.26,30,24,.12],[.68,.34,38,30,.06],
    [.79,.58,48,30,.18],[.82,.62,32,22,-.1],
    [.17,.32,78,50,-.24],[.20,.30,52,38,-.14],[.15,.40,42,30,.15],
    [.22,.54,42,62,.06],[.21,.60,32,48,.1],
    [.22,.14,30,18,-.3],
  ];
  LAND2.forEach(([cx,cy,rx,ry,rot])=>{
    c.save();c.translate(cx*TW,cy*TH);c.rotate(rot||0);c.scale(1,ry/rx);
    c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fillStyle='#060606';c.fill();c.restore();
  });
  return new THREE.CanvasTexture(cv);
}

function mkClouds(){
  const TW=isLow?512:1024,TH=isLow?256:512;
  const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
  const c=cv.getContext('2d');
  // Multi-layer cloud system
  for(let layer=0;layer<4;layer++){
    for(let i=0;i<60;i++){
      const s=i*13.7+layer*250;
      const x=H2(s)*TW,y=H2(s+1)*TH;
      const rx=H2(s+2)*110+18,ry=H2(s+3)*30+7;
      const al=H2(s+4)*.36+.03;
      const g=c.createRadialGradient(x,y,0,x,y,rx);
      g.addColorStop(0,`rgba(255,255,255,${al})`);
      g.addColorStop(.5,`rgba(255,255,255,${al*.3})`);
      g.addColorStop(1,'rgba(255,255,255,0)');
      c.save();c.translate(x,y);c.scale(1,ry/rx);
      c.beginPath();c.arc(0,0,rx,0,Math.PI*2);c.fillStyle=g;c.fill();c.restore();
    }
  }
  // Storm systems
  for(let i=0;i<5;i++){
    const x=H2(i*77.3)*TW,y=H2(i*43.1)*TH;
    const g=c.createRadialGradient(x,y,0,x,y,38);
    g.addColorStop(0,'rgba(255,255,255,.06)');g.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=g;c.beginPath();c.arc(x,y,38,0,Math.PI*2);c.fill();
  }
  return new THREE.CanvasTexture(cv);
}

function mkGalaxy(){
  const TW=isLow?1024:2048,TH=isLow?512:1024;
  const cv=document.createElement('canvas');cv.width=TW;cv.height=TH;
  const c=cv.getContext('2d');
  const bg=c.createLinearGradient(0,0,TW,TH);
  bg.addColorStop(0,'#020516');bg.addColorStop(.4,'#030818');bg.addColorStop(.7,'#040a1c');bg.addColorStop(1,'#020414');
  c.fillStyle=bg;c.fillRect(0,0,TW,TH);
  // Nebula patches
  const NC=['rgba(6,16,72,.14)','rgba(3,22,52,.11)','rgba(16,3,52,.1)','rgba(0,42,70,.08)','rgba(26,0,52,.1)','rgba(0,28,60,.09)'];
  for(let i=0;i<24;i++){
    const x=H2(i*17.3)*TW,y=H2(i*23.7)*TH,r=H2(i*7.1)*340+60;
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,NC[i%NC.length]);g.addColorStop(1,'transparent');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
  }
  // Stars
  const NS=isLow?3500:8000;
  for(let i=0;i<NS;i++){
    const x=H2(i*7.3)*TW,y=H2(i*11.7)*TH;
    const sz=H2(i*3.1)<.95?H2(i*5.1)*.55+.12:H2(i*2.3)*1.6+.8;
    const br=H2(i*2.9)*.8+.2,t=H2(i*6.7);
    const col=t<.14?`rgba(148,172,255,${br})`:t<.22?`rgba(255,215,170,${br})`:t<.27?`rgba(255,195,130,${br*.55})`:`rgba(255,255,255,${br})`;
    if(sz>1.1&&!isLow){
      const sg=c.createRadialGradient(x,y,0,x,y,sz*3.5);
      sg.addColorStop(0,col);sg.addColorStop(1,'transparent');
      c.fillStyle=sg;c.beginPath();c.arc(x,y,sz*3.5,0,Math.PI*2);c.fill();
    }
    c.fillStyle=col;c.fillRect(x,y,sz,sz);
  }
  // Milky Way band
  c.save();c.translate(TW*.5,TH*.5);c.rotate(.26);
  const mw=c.createLinearGradient(-TW*.65,0,TW*.65,0);
  mw.addColorStop(0,'transparent');mw.addColorStop(.28,'rgba(255,255,255,.012)');
  mw.addColorStop(.48,'rgba(255,255,255,.028)');mw.addColorStop(.52,'rgba(255,255,255,.032)');
  mw.addColorStop(.72,'rgba(255,255,255,.012)');mw.addColorStop(1,'transparent');
  c.fillStyle=mw;c.fillRect(-TW*.65,-TH*.25,TW*1.3,TH*.5);
  // Milky way scatter
  for(let i=0;i<(isLow?400:1200);i++){
    const px=(H2(i*9.3)-.5)*TW*.9,py=(H2(i*6.1)-.5)*TH*.3;
    c.fillStyle=`rgba(255,255,255,${H2(i*3.7)*.04})`;
    c.fillRect(px,py,1,1);
  }
  c.restore();
  // Shooting stars
  c.strokeStyle='rgba(200,230,255,.45)';c.lineWidth=.7;
  [[.08,.15,.28,.32],[.65,.08,.82,.18],[.15,.72,.28,.82]].forEach(([x1,y1,x2,y2])=>{
    c.beginPath();c.moveTo(x1*TW,y1*TH);c.lineTo(x2*TW,y2*TH);c.stroke();
  });
  return new THREE.CanvasTexture(cv);
}

/* ══════════════════════════════════════════════════
   GLSL ATMOSPHERE SHADER (Fresnel rim glow)
══════════════════════════════════════════════════ */
const atmVS=`
varying vec3 vNormal;
varying vec3 vPos;
void main(){
  vNormal=normalize(normalMatrix*normal);
  vPos=(modelViewMatrix*vec4(position,1.)).xyz;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}`;
const atmFS=`
uniform float uTime;
uniform float uGlow;
uniform float uPulse;
uniform float uAurora;
varying vec3 vNormal;
varying vec3 vPos;
void main(){
  vec3 viewDir=normalize(-vPos);
  float rim=1.-abs(dot(vNormal,viewDir));
  rim=pow(rim,2.0);
  float pulse=sin(uTime*1.4)*0.07;
  float glow=rim*uGlow*(1.+pulse+uPulse*.4);
  vec3 inner=vec3(.01,.10,.55);
  vec3 outer=vec3(.03,.45,.98);
  vec3 col=mix(inner,outer,pow(rim,1.5));
  float band=sin(vNormal.y*6.+uTime*.8)*.04;
  col+=vec3(0.,band*.5,band);
  // ── Equatorial luminescence band ──
  float eq=pow(1.-abs(vNormal.y)*.98,6.)*0.18;
  col+=vec3(.01,.04,.12)*eq*uGlow;
  // ── Aurora borealis / australis at magnetic poles ──
  float pole=pow(abs(vNormal.y),1.8);
  float aWave=sin(vNormal.x*9.+uTime*2.4)*.5+.5;
  float aWave2=sin(vNormal.z*7.+uTime*1.8+1.3)*.5+.5;
  vec3 aCol=mix(vec3(.45,.0,.9),vec3(.0,.85,.55),aWave*aWave2);
  float aStr=pole*uAurora*rim*(0.9+sin(uTime*1.1+vNormal.x*4.)*.1);
  col=mix(col,aCol,aStr*.7);
  float aAlpha=rim*.42*uGlow + aStr*.3;
  gl_FragColor=vec4(col*glow + aCol*aStr*.18, aAlpha);
}`;

const atmMat=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uGlow:{value:1.3},uPulse:{value:0},uAurora:{value:0.0}},
  vertexShader:atmVS,fragmentShader:atmFS,
  transparent:true,side:THREE.BackSide,depthWrite:false
});

/* GLSL Halo (outer glow) */
const haloFS=`
uniform float uTime;
uniform float uGlow;
varying vec3 vNormal;
varying vec3 vPos;
void main(){
  vec3 viewDir=normalize(-vPos);
  float rim=1.-abs(dot(vNormal,viewDir));
  rim=pow(rim,3.8);
  float pulse=sin(uTime*0.7)*0.04;
  vec3 col=mix(vec3(.0,.55,.95),vec3(.02,.35,.85),vNormal.y*.5+.5);
  gl_FragColor=vec4(col,rim*.30*uGlow*(1.+pulse));
}`;
const haloMat=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uGlow:{value:1.0}},
  vertexShader:atmVS,fragmentShader:haloFS,
  transparent:true,side:THREE.BackSide,depthWrite:false
});

/* ══════════════════════════════════════════════════
   BUILD EARTH MODEL
══════════════════════════════════════════════════ */
scene.background=mkGalaxy();

// Earth sphere — high tessellation
const earthGeo=new THREE.SphereGeometry(2,isLow?48:96,isLow?48:96);
const earthMat=new THREE.MeshPhongMaterial({
  map:mkDay(),
  emissiveMap:mkNight(),
  emissive:new THREE.Color(.98,.96,1),
  emissiveIntensity:.64,
  specularMap:mkSpec(),
  specular:new THREE.Color(.18,.28,.45),
  shininess:55,
});
const earth=new THREE.Mesh(earthGeo,earthMat);
earth.rotation.z=23.5*(Math.PI/180);// axial tilt
scene.add(earth);

// Main atmosphere shell
const atm=new THREE.Mesh(new THREE.SphereGeometry(2.26,isLow?32:64,isLow?32:64),atmMat);
scene.add(atm);

// Inner soft glow
const inner=new THREE.Mesh(
  new THREE.SphereGeometry(2.07,32,32),
  new THREE.MeshPhongMaterial({color:0x0038bb,emissive:0x001e7a,emissiveIntensity:.9,transparent:true,opacity:.09,side:THREE.FrontSide,depthWrite:false})
);
scene.add(inner);

// Outer halo (much larger, very subtle)
const halo=new THREE.Mesh(new THREE.SphereGeometry(2.58,32,32),haloMat);
scene.add(halo);

// Clouds layer
let clouds=null;
if(!isLow){
  clouds=new THREE.Mesh(
    new THREE.SphereGeometry(2.052,64,64),
    new THREE.MeshPhongMaterial({map:mkClouds(),transparent:true,opacity:.44,depthWrite:false,shininess:8,specular:new THREE.Color(.12,.14,.18)})
  );
  scene.add(clouds);
}


// ─ MOON — orbiting body ─
function mkMoon(){
  const S=isLow?64:128;
  const cv=document.createElement('canvas');cv.width=S;cv.height=S;
  const c=cv.getContext('2d');
  const bg=c.createRadialGradient(S*.42,S*.4,0,S*.5,S*.5,S*.5);
  bg.addColorStop(0,'#c4c4cc');bg.addColorStop(.65,'#888898');bg.addColorStop(1,'#2e2e3a');
  c.fillStyle=bg;c.beginPath();c.arc(S/2,S/2,S/2,0,Math.PI*2);c.fill();
  // Craters
  [[.4,.35,14,.65],[.62,.55,8,.55],[.3,.58,6,.5],[.7,.4,5,.45],[.5,.65,9,.6],[.55,.3,6,.48],[.35,.48,5,.4],[.68,.68,4,.38]].forEach(([cx,cy,r,d])=>{
    const g=c.createRadialGradient(cx*S,cy*S,0,cx*S,cy*S,r);
    g.addColorStop(0,`rgba(40,40,50,${d})`);g.addColorStop(.5,`rgba(90,90,100,.2)`);g.addColorStop(1,'rgba(120,120,130,0)');
    c.fillStyle=g;c.beginPath();c.arc(cx*S,cy*S,r,0,Math.PI*2);c.fill();
  });
  // Terminator — soft edge illumination gradient
  c.save();c.translate(S/2,S/2);
  const terr=c.createRadialGradient(S*.12,0,0,0,0,S*.55);
  terr.addColorStop(0,'rgba(0,0,0,0)');terr.addColorStop(.5,'rgba(0,0,0,.1)');terr.addColorStop(.78,'rgba(0,0,0,.42)');terr.addColorStop(1,'rgba(0,0,0,.72)');
  c.beginPath();c.arc(0,0,S/2,0,Math.PI*2);c.fillStyle=terr;c.fill();
  c.restore();
  return new THREE.CanvasTexture(cv);
}
const moonPivot=new THREE.Object3D();scene.add(moonPivot);
const moonGeo=new THREE.SphereGeometry(.26,isLow?16:32,isLow?16:32);
const moonMat=new THREE.MeshPhongMaterial({map:mkMoon(),shininess:3,specular:new THREE.Color(.04,.04,.05)});
const moonMesh=new THREE.Mesh(moonGeo,moonMat);
moonMesh.position.set(4.2,0.6,0);
moonPivot.add(moonMesh);
// Subtle moon halo glow
const moonHalo=new THREE.Mesh(new THREE.SphereGeometry(.34,16,16),
  new THREE.MeshBasicMaterial({color:0xaaaacc,transparent:true,opacity:.14,side:THREE.BackSide}));
moonMesh.add(moonHalo);
// ─ ORBITAL RINGS ─
function mkRing(r,tube,col,op,rx,rz,ry){
  const m=new THREE.Mesh(
    new THREE.TorusGeometry(r,tube,3,200),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op})
  );
  m.rotation.x=rx||0;m.rotation.z=rz||0;m.rotation.y=ry||0;
  return m;
}
const ring1=mkRing(2.88,.0030,0x00c3ff,.28,Math.PI*.26,.04,0);scene.add(ring1);
const ring2=mkRing(3.38,.0025,0x1a8cff,.12,-Math.PI*.20,.26,0);scene.add(ring2);
const ring3=mkRing(3.92,.0014,0x66e0ff,.055,Math.PI*.5,0,.05);scene.add(ring3);
// Equatorial ring (subtle data-ring effect)
const ring4=mkRing(2.65,.0020,0x00ff9f,.09,0,0,0);scene.add(ring4);

// ─ SATELLITES ─
const satGeo=new THREE.TetrahedronGeometry(.028,0);
const satMatBase=new THREE.MeshPhongMaterial({color:0xbbccee,emissive:0x2255cc,emissiveIntensity:.9});
const sats=[];
const satPivots=[];
for(let i=0;i<8;i++){
  const s=new THREE.Mesh(satGeo,satMatBase.clone());
  const ang=i*(Math.PI*2/8),rr=2.95+Math.random()*.6;
  s.position.set(Math.cos(ang)*rr,Math.sin(ang)*rr*.22,Math.sin(ang)*rr);
  s.userData={ang,spd:.005+Math.random()*.007,rr,yo:Math.random()*.32-.16,tilt:Math.random()*Math.PI};
  sats.push(s);scene.add(s);
}

// ─ BEAM LINES (sat → earth) ─
const beams=[];
sats.forEach(s=>{
  const g=new THREE.BufferGeometry().setFromPoints([s.position.clone(),new THREE.Vector3()]);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x00c3ff,transparent:true,opacity:.18}));
  beams.push(l);scene.add(l);
});

// ─ SCAN GRID OVERLAY (lat/lon lines) ─
const gridMat=new THREE.LineBasicMaterial({color:0x00c3ff,transparent:true,opacity:.04});
function makeLatLon(){
  const grp=new THREE.Group();
  for(let lat=-75;lat<=75;lat+=15){
    const pts=[];const phi=(90-lat)*Math.PI/180;const r=2.055;
    for(let lon=0;lon<=360;lon+=4){
      const th=lon*Math.PI/180;
      pts.push(new THREE.Vector3(r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th)));
    }
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),gridMat));
  }
  for(let lon=0;lon<360;lon+=15){
    const pts=[];const th=lon*Math.PI/180;const r=2.055;
    for(let lat=90;lat>=-90;lat-=3){
      const phi=(90-lat)*Math.PI/180;
      pts.push(new THREE.Vector3(r*Math.sin(phi)*Math.cos(th),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(th)));
    }
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),gridMat));
  }
  return grp;
}
const scanGrid=makeLatLon();
earth.add(scanGrid);
let gridVisible=true;

// ─ STARFIELD ─
const stGeo=new THREE.BufferGeometry();
const stN=isLow?600:3200,stA=new Float32Array(stN*3);
for(let i=0;i<stN*3;i++)stA[i]=(Math.random()-.5)*220;
stGeo.setAttribute('position',new THREE.BufferAttribute(stA,3));
const starMat=new THREE.PointsMaterial({size:isLow?.09:.062,color:0x99bbdd,transparent:true,opacity:.72,sizeAttenuation:true});
const stars=new THREE.Points(stGeo,starMat);
scene.add(stars);

// ─ ENERGY PARTICLE HALO ─
let ePts=null;
if(!isLow){
  const epG=new THREE.BufferGeometry();
  const epN=1200,epA=new Float32Array(epN*3);
  for(let i=0;i<epN;i++){
    const phi=Math.random()*Math.PI*2,th=Math.acos(2*Math.random()-1),r=2.32+Math.random()*.88;
    epA[i*3]=r*Math.sin(th)*Math.cos(phi);epA[i*3+1]=r*Math.sin(th)*Math.sin(phi);epA[i*3+2]=r*Math.cos(th);
  }
  epG.setAttribute('position',new THREE.BufferAttribute(epA,3));
  ePts=new THREE.Points(epG,new THREE.PointsMaterial({size:.018,color:0x44d4ff,transparent:true,opacity:.3}));
  scene.add(ePts);
}

// ─ BLOOM ─
let comp=null,bloom=null;
if(!isLow){
  comp=new THREE.EffectComposer(ren);
  comp.addPass(new THREE.RenderPass(scene,cam));
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(W(),H()),1.15,.46,.15);
  comp.addPass(bloom);
}

/* ══════════════════════════════════════════════════
   2D CANVAS OVERLAYS
══════════════════════════════════════════════════ */
// Film grain
const gCv=document.getElementById('gCv'),gCtx=gCv.getContext('2d');
function rsGrain(){gCv.width=W();gCv.height=H();}rsGrain();
let gf=0;
function grain(){gf++;if(gf%6||isMob)return;
  const w=gCv.width,h=gCv.height,im=gCtx.createImageData(w,h),d=im.data;
  for(let i=0;i<d.length;i+=4){const v=Math.random()*255;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;}
  gCtx.putImageData(im,0,0);}

// Chromatic aberration canvas
const chCv=document.getElementById('chCv'),chCtx=chCv.getContext('2d');
let chTill=0;
function rsChroma(){chCv.width=W();chCv.height=H();}rsChroma();
function fireChroma(ms){chTill=Date.now()+ms;}
function drawChroma(){
  const now=Date.now();
  if(now>chTill){chCtx.clearRect(0,0,chCv.width,chCv.height);return;}
  const I=Math.min(1,(chTill-now)/800);if(I<.02)return;
  const shakeBoost=shk?shkS*1.8:1;const shift=Math.floor(4+shakeBoost*4);
  chCtx.clearRect(0,0,chCv.width,chCv.height);
  chCtx.globalAlpha=I*(shk?.15:.09);
  chCtx.fillStyle='rgba(255,0,60,1)';chCtx.fillRect(shift,0,chCv.width,chCv.height);
  chCtx.fillStyle='rgba(0,255,210,1)';chCtx.fillRect(-shift,0,chCv.width,chCv.height);
  chCtx.globalAlpha=1;
}

// Scan overlay canvas (draws HUD-style scan ring around earth in world)
const ovCv=document.getElementById('overlayCanvas'),ovCtx=ovCv.getContext('2d');
function rsOv(){ovCv.width=W();ovCv.height=H();}rsOv();
let scanRingActive=false,scanRingAlpha=0,scanRingR=0;
function triggerScanRing(){scanRingActive=true;scanRingAlpha=1;scanRingR=0;}
function drawScanRing(){
  ovCtx.clearRect(0,0,ovCv.width,ovCv.height);
  if(!scanRingActive&&scanRingAlpha<=0)return;
  if(scanRingActive){scanRingR+=3.2;if(scanRingR>Math.max(W(),H())){scanRingActive=false;scanRingAlpha=0;return;}}
  scanRingAlpha=Math.max(0,scanRingAlpha-.008);
  const cx=W()/2,cy=H()/2;
  ovCtx.beginPath();
  ovCtx.arc(cx,cy,scanRingR,0,Math.PI*2);
  ovCtx.strokeStyle=`rgba(0,195,255,${scanRingAlpha*.35})`;
  ovCtx.lineWidth=1.5;ovCtx.stroke();
  ovCtx.beginPath();
  ovCtx.arc(cx,cy,scanRingR*.6,0,Math.PI*2);
  ovCtx.strokeStyle=`rgba(0,195,255,${scanRingAlpha*.12})`;
  ovCtx.lineWidth=1;ovCtx.stroke();
}


/* ── BIOSPHERE WAVEFORM (NEW) ── */
const bCv=document.getElementById('bCv'),bCtx=bCv.getContext('2d');let bPh=0;
function drawBio(){
  const cv=bCv;if(!cv)return;
  bCtx.clearRect(0,0,cv.width,cv.height);const w=cv.width,h=cv.height;
  // Wave 1 — green "life signal"
  bCtx.beginPath();
  for(let x=0;x<w;x++){
    const y=h/2+Math.sin(x*.07+bPh)*(h*.32*(0.7+Math.sin(x*.018+bPh*.4)*.3));
    x===0?bCtx.moveTo(x,y):bCtx.lineTo(x,y);}
  const g1=bCtx.createLinearGradient(0,0,w,0);
  g1.addColorStop(0,'transparent');g1.addColorStop(.2,'rgba(0,255,120,.38)');g1.addColorStop(.8,'rgba(0,255,120,.38)');g1.addColorStop(1,'transparent');
  bCtx.strokeStyle=g1;bCtx.lineWidth=1;bCtx.stroke();
  // Wave 2 — purple aurora signal
  bCtx.beginPath();
  for(let x=0;x<w;x++){
    const y=h/2+Math.sin(x*.09+bPh*1.3+Math.PI*.55)*(h*.22*(0.6+Math.sin(x*.023+bPh*.2)*.4));
    x===0?bCtx.moveTo(x,y):bCtx.lineTo(x,y);}
  const g2=bCtx.createLinearGradient(0,0,w,0);
  g2.addColorStop(0,'transparent');g2.addColorStop(.2,'rgba(176,111,255,.3)');g2.addColorStop(.8,'rgba(176,111,255,.3)');g2.addColorStop(1,'transparent');
  bCtx.strokeStyle=g2;bCtx.lineWidth=.8;bCtx.stroke();
  // Wave 3 — warning flat line (thin red)
  bCtx.beginPath();
  for(let x=0;x<w;x++){
    const y=h*.78+Math.sin(x*.4+bPh*8)*(h*.04);
    x===0?bCtx.moveTo(x,y):bCtx.lineTo(x,y);}
  bCtx.strokeStyle='rgba(255,59,59,.22)';bCtx.lineWidth=.6;bCtx.stroke();
  bPh+=.033;}

/* ── TRAJECTORY PLOT (NEW) ── */
const trCv=document.getElementById('trCv'),trCtx=trCv.getContext('2d');
function drawTraj(){
  const cv=trCv;if(!cv)return;
  const w=cv.width,h=cv.height,t=Date.now()*.001;
  trCtx.clearRect(0,0,w,h);trCtx.fillStyle='rgba(0,5,15,.55)';trCtx.fillRect(0,0,w,h);
  // Earth dot
  const ex=w*.34,ey=h*.5;
  trCtx.shadowBlur=8;trCtx.shadowColor='rgba(0,195,255,.7)';
  trCtx.beginPath();trCtx.arc(ex,ey,5,0,Math.PI*2);
  const eg=trCtx.createRadialGradient(ex,ey,0,ex,ey,5);
  eg.addColorStop(0,'rgba(0,195,255,.9)');eg.addColorStop(1,'rgba(0,80,200,.3)');
  trCtx.fillStyle=eg;trCtx.fill();trCtx.shadowBlur=0;
  // Moon orbit ellipse
  const mr=w*.32,mry=h*.36;
  trCtx.beginPath();trCtx.setLineDash([2,3]);
  trCtx.ellipse(ex,ey,mr,mry,0,0,Math.PI*2);
  trCtx.strokeStyle='rgba(180,180,220,.15)';trCtx.lineWidth=.7;trCtx.stroke();trCtx.setLineDash([]);
  // Moon dot
  const ma=t*.055;const mx=ex+Math.cos(ma)*mr,my=ey+Math.sin(ma)*mry;
  trCtx.beginPath();trCtx.arc(mx,my,2.5,0,Math.PI*2);trCtx.fillStyle='rgba(190,190,215,.85)';trCtx.fill();
  // Sat constellation
  for(let i=0;i<8;i++){
    const sa=t*(0.08+i*.006)+i*Math.PI*.25;const sr=w*.13+i*1.2;
    const sx=ex+Math.cos(sa)*sr,sy=ey+Math.sin(sa)*sr*.45;
    trCtx.beginPath();trCtx.arc(sx,sy,1,0,Math.PI*2);trCtx.fillStyle='rgba(0,195,255,.48)';trCtx.fill();}
}

/* ── AURORA / ORBITAL HUD ── */
let auroraKp=4.5;
function updAurora(){
  auroraKp+=(Math.random()-.5)*.12;auroraKp=Math.max(1,Math.min(9,auroraKp));
  const e=document.getElementById('auroraIdx');if(e)e.textContent=auroraKp.toFixed(1)+' Kp';
  const kpT=document.getElementById('tickKp');if(kpT)kpT.textContent='AURORA: Kp '+auroraKp.toFixed(1)+(auroraKp>6?' ▲ STORM':'')+'   |   ';
  // Drive aurora shader from live Kp
  const target=Math.max(0,(auroraKp-2.5)/7);
  atmMat.uniforms.uAurora.value+=(target-atmMat.uniforms.uAurora.value)*.04;
}
let transitBase=Date.now();
function updTransit(){
  const elapsed=Date.now()-transitBase;
  const period=15973000;// ms
  const rem=Math.max(0,period-(elapsed%period));
  const h=Math.floor(rem/3600000),m=Math.floor((rem%3600000)/60000),s=Math.floor((rem%60000)/1000);
  const pad=v=>String(v).padStart(2,'0');
  const e=document.getElementById('nextT');if(e)e.textContent=`T-${pad(h)}:${pad(m)}:${pad(s)}`;
  const lp=document.getElementById('lunPhase');
  if(lp){const phases=['NEW MOON','WAXING CRESCENT','FIRST QUARTER','WAXING GIBBOUS','FULL MOON','WANING GIBBOUS','LAST QUARTER','WANING CRESCENT'];
    lp.textContent=phases[Math.floor((elapsed/period)*8)%8];}
}
/* ── RADAR ── */
const rCv=document.getElementById('rCv'),rCtx=rCv.getContext('2d');
let rAng=0,rBl=[];
function drawRadar(){
  const w=rCv.width,h=rCv.height,cx=w/2,cy=h/2,r=w/2-2;
  rCtx.clearRect(0,0,w,h);
  rCtx.beginPath();rCtx.arc(cx,cy,r,0,Math.PI*2);
  rCtx.fillStyle='rgba(0,8,20,.94)';rCtx.fill();
  rCtx.strokeStyle='rgba(0,195,255,.1)';rCtx.lineWidth=.5;
  [.25,.5,.75,1].forEach(f=>{rCtx.beginPath();rCtx.arc(cx,cy,r*f,0,Math.PI*2);rCtx.stroke();});
  rCtx.beginPath();rCtx.moveTo(cx-r,cy);rCtx.lineTo(cx+r,cy);
  rCtx.moveTo(cx,cy-r);rCtx.lineTo(cx,cy+r);
  rCtx.strokeStyle='rgba(0,195,255,.05)';rCtx.stroke();
  rCtx.save();rCtx.translate(cx,cy);rCtx.rotate(rAng);
  rCtx.beginPath();rCtx.moveTo(0,0);rCtx.arc(0,0,r,-.85,0);rCtx.closePath();
  rCtx.fillStyle='rgba(0,195,255,.07)';rCtx.fill();
  rCtx.beginPath();rCtx.moveTo(0,0);rCtx.lineTo(r,0);
  rCtx.strokeStyle='rgba(0,195,255,.9)';rCtx.lineWidth=1;rCtx.stroke();
  rCtx.restore();
  // Moon blip — orbits in radar matching moonPivot
  const mba=Date.now()*.000033;// matches moonPivot: 0.00055rad/frame*60fps=0.033rad/s
  const mbx=cx+Math.cos(mba)*r*.68,mby=cy+Math.sin(mba)*r*.32;
  rCtx.shadowBlur=7;rCtx.shadowColor='rgba(180,180,220,.9)';
  rCtx.beginPath();rCtx.arc(mbx,mby,3,0,Math.PI*2);
  rCtx.fillStyle='rgba(180,180,220,.78)';rCtx.fill();rCtx.shadowBlur=0;
  rBl=rBl.filter(b=>b.age<115);
  rBl.forEach(b=>{
    const al=Math.max(0,1-b.age/115);
    rCtx.shadowBlur=5;rCtx.shadowColor='rgba(0,255,140,.8)';
    rCtx.beginPath();rCtx.arc(cx+b.x*r,cy+b.y*r,2,0,Math.PI*2);
    rCtx.fillStyle=`rgba(0,255,140,${al})`;rCtx.fill();
    rCtx.shadowBlur=0;b.age++;
  });
  if(Math.random()<.025){
    const a=Math.random()*Math.PI*2,d=.22+Math.random()*.72;
    rBl.push({x:Math.cos(a)*d,y:Math.sin(a)*d,age:0});
    document.getElementById('tc').textContent=rBl.length;
    const scnt=document.querySelector('.pbr .dv.cy');// sat count - don't update, it's structural
  }
  rAng+=.025;if(rAng>Math.PI*2)rAng=0;
}

/* ── WAVEFORM ── */
const wCv=document.getElementById('wCv'),wCtx=wCv.getContext('2d');
let wPh=0;
function drawWave(){
  wCtx.clearRect(0,0,wCv.width,wCv.height);
  const w=wCv.width,h=wCv.height;
  wCtx.beginPath();
  for(let x=0;x<w;x++){
    const y=h/2+Math.sin(x*.06+wPh)*(h*.28)+Math.sin(x*.14+wPh*1.3)*(h*.12)+Math.sin(x*.28+wPh*.7)*(h*.08)+Math.sin(x*.52+wPh*.5)*(h*.04);
    x===0?wCtx.moveTo(x,y):wCtx.lineTo(x,y);
  }
  const g=wCtx.createLinearGradient(0,0,w,0);
  g.addColorStop(0,'transparent');g.addColorStop(.2,'rgba(0,195,255,.5)');g.addColorStop(.8,'rgba(0,195,255,.5)');g.addColorStop(1,'transparent');
  wCtx.strokeStyle=g;wCtx.lineWidth=1;wCtx.stroke();wPh+=.048;
}

/* ── EM SPECTRUM ── */
const eCv=document.getElementById('eCv'),eCtx=eCv.getContext('2d');
let ePh=0;
function drawEM(){
  eCtx.clearRect(0,0,eCv.width,eCv.height);
  const w=eCv.width,h=eCv.height;
  for(let i=0;i<5;i++){
    eCtx.beginPath();
    for(let x=0;x<w;x++){
      const y=h/2+Math.sin(x*.1+ePh+i*.7)*h*.38*H2(i*7.3+Math.floor(ePh));
      x===0?eCtx.moveTo(x,y):eCtx.lineTo(x,y);
    }
    const colors=['rgba(0,195,255,','rgba(0,150,255,','rgba(0,255,150,','rgba(100,200,255,','rgba(0,100,255,'];
    eCtx.strokeStyle=colors[i]+'.28)';eCtx.lineWidth=.7;eCtx.stroke();
  }
  ePh+=.08;
}

/* ── THREAT MAP ── */
const tCv=document.getElementById('tCv'),tCtx=tCv.getContext('2d');
const THREATS=[{x:.18,y:.34,s:.8},{x:.6,y:.29,s:.7},{x:.62,y:.50,s:.9},{x:.7,y:.38,s:.6},{x:.23,y:.55,s:.75},{x:.78,y:.60,s:.65}];
let tPh2=0;
function drawThreat(){
  tCtx.clearRect(0,0,tCv.width,tCv.height);
  tCtx.fillStyle='rgba(0,5,15,.6)';tCtx.fillRect(0,0,tCv.width,tCv.height);
  THREATS.forEach((t,i)=>{
    const pulse=(Math.sin(tPh2*1.1+i*.8)+1)*.5;
    const r=3+pulse*4;
    tCtx.beginPath();tCtx.arc(t.x*tCv.width,t.y*tCv.height,r,0,Math.PI*2);
    tCtx.fillStyle=`rgba(255,60,60,${.4+pulse*.4*t.s})`;tCtx.fill();
    tCtx.strokeStyle=`rgba(255,60,60,${.15+pulse*.2})`;tCtx.lineWidth=1;tCtx.stroke();
  });
  tPh2+=.04;
}

/* ── CLOCK & HUD ── */
function updClock(){
  const n=new Date(),p=v=>String(v).padStart(2,'0');
  const str=`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`;
  ['clk','mClk'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=str;});
}
let popN=8045311447;
function updPop(){
  popN+=Math.floor(Math.random()*5+1);
  const e=document.getElementById('pop');if(e)e.textContent=popN.toLocaleString();
  const me=document.getElementById('mPop');if(me)me.textContent=(popN/1e9).toFixed(2)+'B';
}
let scanN=0;
function updScan(){
  if(scanN<100){
    scanN+=.22;const p=Math.min(100,Math.floor(scanN));
    [['sp','sb'],['mSp','mSb']].forEach(([si,bi])=>{
      const se=document.getElementById(si);if(se)se.textContent=p+'%';
      const sb=document.getElementById(bi);if(sb)sb.style.width=p+'%';
    });
  }
}

/* ── CONSOLE LOGS ── */
const LOGS=[
  '> ASCENSION v9.1 — INITIALIZING...',
  '> QUANTUM UPLINK: ESTABLISHED',
  '> ORBITAL SENSORS: ONLINE [8 NODES]',
  '> BIOSPHERE SIGNATURE: LOCKED',
  '> ATMOS COMP: 78% N₂ / 20.9% O₂',
  '> HYDROSPHERE: 1.335B KM³',
  '> MAGNETO FIELD STRENGTH: 24.8μT',
  '> CRUST THERMAL: NOMINAL',
  '> CIVILIZATION CLASS: 0.73 KARDASHEV',
  '> EM FIELD DECAY: -5.2%/CENTURY',
  '> AGI EMERGENCE: 94.7% PROB / T-12YR',
  '> SINGULARITY INDEX: 8.4/10.0',
  '> PLANETARY LIMITS BREACHED: 6/9',
  '> THREAT MATRIX: 7 CRITICAL VECTORS',
  '> EVOLUTION STATUS: PHASE TRANSITION',
  '> SPECIES POTENTIAL: 9.2/10.0',
  '> YEAR 01 — ASCENSION BEGINS',
  '> AURORA ACTIVITY: Kp 4.5 RISING',
  '> LUNAR PROXIMITY: 384,400 KM',
  '> NEXT CLASSIFICATION: PENDING...',
  '> TRANSMISSION COMPLETE.',
];
let logI=0;
function addLog(){
  if(logI>=LOGS.length)return;
  const msg=LOGS[logI++];
  ['cLog','mLog'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    const ln=document.createElement('div');ln.style.opacity='0';el.appendChild(ln);
    let ci=0;const t=setInterval(()=>{
      if(ci<msg.length){ln.textContent+=msg[ci++];ln.style.opacity='1';}
      else{
        clearInterval(t);el.scrollTop=9999;
        if(Math.random()<.24){const sv=ln.textContent;ln.style.color=Math.random()<.5?'#ff3b3b':'#00ff9f';
          setTimeout(()=>{ln.style.color='';ln.textContent=sv;},90);}
      }
    },20);
    if(id==='mLog')setTimeout(()=>{while(el.children.length>3)el.removeChild(el.firstChild);},2200);
  });
}

/* ── TICKER ── */
const TICKER_TEXT='SIGNAL INTEGRITY: 97.4%   |   ORBITAL DECAY: NONE   |   THREAT: CRITICAL   |   POPULATION: 8.04B UNITS   |   AGI ETA: T-12 YEARS   |   KARDASHEV: 0.73   |   AURORA: Kp 3.2 RISING   |   LUNAR PHASE: WAXING GIBBOUS   |   MOON DIST: 384,400 km   |   BIOSPHERE STRESS: CRITICAL   |   PHASE: TRANSITION   |   ASCENSION: INITIATED   |   ';
const tEl=document.getElementById('tickInner');
tEl.innerHTML='';
const tSpan=document.createTextNode(TICKER_TEXT.repeat(3));
tEl.appendChild(tSpan);
// Live Kp injected span
const kpSpan=document.createElement('span');
kpSpan.id='tickKp';kpSpan.textContent='';kpSpan.style.color='rgba(176,111,255,.4)';
tEl.appendChild(kpSpan);
tEl.appendChild(document.createTextNode('   |   '+TICKER_TEXT));

/* ══════════════════════════════════════════════════
   AUDIO — Web Audio API Procedural
══════════════════════════════════════════════════ */
let aC=null,mG=null,dOscs=[];
function initAudio(){
  try{
    aC=new(window.AudioContext||window.webkitAudioContext)();
    const comp2=aC.createDynamicsCompressor();
    comp2.threshold.value=-20;comp2.ratio.value=4;comp2.connect(aC.destination);
    // Reverb via convolution (synthetic impulse)
    const convNode=aC.createConvolver();
    const irLen=aC.sampleRate*1.8;
    const irBuf=aC.createBuffer(2,irLen,aC.sampleRate);
    for(let ch=0;ch<2;ch++){const d=irBuf.getChannelData(ch);for(let i=0;i<irLen;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/irLen,2.2);}
    convNode.buffer=irBuf;
    const dryG=aC.createGain();dryG.gain.value=0.78;
    const wetG=aC.createGain();wetG.gain.value=0.22;
    mG=aC.createGain();mG.gain.value=0;
    mG.connect(dryG);mG.connect(convNode);convNode.connect(wetG);
    dryG.connect(comp2);wetG.connect(comp2);
    // Sub-bass drone stack
    [26,40,58,80,116].forEach((f,i)=>{
      const o=aC.createOscillator(),g=aC.createGain();
      o.type=i<3?'sine':'triangle';o.frequency.value=f;
      o.detune.value=(Math.random()-.5)*10;
      g.gain.value=i<3?.3:i<4?.055:.034;
      o.connect(g).connect(mG);o.start();dOscs.push(o);
    });
    // LFO on bass
    const lfo=aC.createOscillator(),lg=aC.createGain();
    lfo.frequency.value=.12;lg.gain.value=3.5;
    lfo.connect(lg);if(dOscs[0])lg.connect(dOscs[0].frequency);lfo.start();
    pingLoop();
    mG.gain.setValueAtTime(0,aC.currentTime);
    mG.gain.linearRampToValueAtTime(isMob?.32:.4,aC.currentTime+3.5);
  }catch(e){console.warn('Audio:',e);}
}
function pingLoop(){
  if(!aC||!mG)return;
  try{
    const o=aC.createOscillator(),e=aC.createGain();
    o.type='sine';o.frequency.value=160+Math.random()*200;
    e.gain.setValueAtTime(.06,aC.currentTime);e.gain.exponentialRampToValueAtTime(.001,aC.currentTime+.9);
    o.connect(e).connect(mG);o.start();o.stop(aC.currentTime+.9);
  }catch(e){}
  setTimeout(pingLoop,1400+Math.random()*2600);
}
function triggerBass(){
  if(!aC||!mG)return;
  try{
    // Sub hit
    const b=aC.createOscillator(),be=aC.createGain();
    b.type='sine';b.frequency.setValueAtTime(85,aC.currentTime);
    b.frequency.exponentialRampToValueAtTime(16,aC.currentTime+2.4);
    be.gain.setValueAtTime(2.2,aC.currentTime);be.gain.exponentialRampToValueAtTime(.001,aC.currentTime+3);
    b.connect(be).connect(aC.destination);b.start();b.stop(aC.currentTime+3);
    // Metallic zing
    const n=aC.createOscillator(),ne=aC.createGain();
    n.type='sawtooth';n.frequency.value=1400;
    ne.gain.setValueAtTime(.18,aC.currentTime);ne.gain.exponentialRampToValueAtTime(.001,aC.currentTime+.3);
    n.connect(ne).connect(mG);n.start();n.stop(aC.currentTime+.3);
    // Reverb tail
    const rv=aC.createOscillator(),re=aC.createGain();
    rv.type='sine';rv.frequency.value=45+Math.random()*25;
    re.gain.setValueAtTime(.5,aC.currentTime+.06);re.gain.linearRampToValueAtTime(0,aC.currentTime+4);
    rv.connect(re).connect(mG);rv.start(aC.currentTime+.06);rv.stop(aC.currentTime+4);
    // Ascending chime cascade on ASCENSION
    [523,659,784,988,1047].forEach((f,i)=>{const oc=aC.createOscillator(),gc=aC.createGain();oc.type='triangle';oc.frequency.value=f;
      gc.gain.setValueAtTime(0,aC.currentTime+i*.16);gc.gain.linearRampToValueAtTime(.055,aC.currentTime+i*.16+.08);
      gc.gain.exponentialRampToValueAtTime(.001,aC.currentTime+i*.16+.9);oc.connect(gc).connect(mG);oc.start(aC.currentTime+i*.16);oc.stop(aC.currentTime+i*.16+.9);});
  }catch(e){}
}
function buildUp(){
  if(!aC||!mG)return;
  try{
    dOscs.forEach((o,i)=>o.frequency.linearRampToValueAtTime(o.frequency.value*(1.2+i*.04),aC.currentTime+7));
    mG.gain.linearRampToValueAtTime(isMob?.6:.68,aC.currentTime+5);
    arpStep(0);
  }catch(e){}
}
function arpStep(s){
  if(!aC||!mG)return;
  try{
    const ns=[196,220,262,330,392,440,523,587];
    const o=aC.createOscillator(),e=aC.createGain();
    o.type='triangle';o.frequency.value=ns[s%ns.length];
    e.gain.setValueAtTime(.042,aC.currentTime);e.gain.exponentialRampToValueAtTime(.001,aC.currentTime+.28);
    o.connect(e).connect(mG);o.start();o.stop(aC.currentTime+.28);
    if(s<30)setTimeout(()=>arpStep(s+1),200+s*5);
  }catch(e){}
}
function fadOut(){if(!aC||!mG)return;try{mG.gain.linearRampToValueAtTime(0,aC.currentTime+7);}catch(e){}}


/* ── SCENE-SYNCED AUDIO CUES ── */
function playSceneAudio(sceneNum){
  if(!aC||!mG)return;
  try{
    if(sceneNum===3){// Threat: low dissonant pad
      const o=aC.createOscillator(),g=aC.createGain();o.type='sawtooth';o.frequency.value=36;
      g.gain.setValueAtTime(0,aC.currentTime);g.gain.linearRampToValueAtTime(.09,aC.currentTime+1.8);
      g.gain.linearRampToValueAtTime(.04,aC.currentTime+9);o.connect(g).connect(mG);o.start();o.stop(aC.currentTime+12);}
    if(sceneNum===5){// Legacy: gentle luminous harmonics
      [880,1100,1320].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='sine';o.frequency.value=f;
        g.gain.setValueAtTime(0,aC.currentTime);g.gain.linearRampToValueAtTime(.015,aC.currentTime+2+i);
        g.gain.linearRampToValueAtTime(0,aC.currentTime+8+i);o.connect(g).connect(mG);o.start();o.stop(aC.currentTime+9+i);});}
    if(sceneNum===8){// Precipice: tension swell
      const o=aC.createOscillator(),g=aC.createGain();o.type='sine';o.frequency.value=55;
      g.gain.setValueAtTime(0,aC.currentTime);g.gain.linearRampToValueAtTime(.2,aC.currentTime+2.5);
      g.gain.linearRampToValueAtTime(.14,aC.currentTime+7);o.connect(g).connect(mG);o.start();o.stop(aC.currentTime+10);}
    if(sceneNum===10){// Aurora scene: shimmering high vibrato tones
      [1760,2200,2640,3300].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='triangle';o.frequency.value=f;
        const lf=aC.createOscillator(),lg2=aC.createGain();lf.frequency.value=.28+i*.09;lg2.gain.value=f*.018;
        lf.connect(lg2);lg2.connect(o.frequency);lf.start();
        g.gain.setValueAtTime(0,aC.currentTime);g.gain.linearRampToValueAtTime(.011,aC.currentTime+1.5+i*.5);
        g.gain.linearRampToValueAtTime(0,aC.currentTime+5+i);o.connect(g).connect(mG);o.start();
        o.stop(aC.currentTime+6+i);lf.stop(aC.currentTime+6+i);});}
  }catch(e){}}

/* ── PART 2 AUDIO CUES ── */
function playP2Audio(sceneNum){
  if(!aC||!mG)return;
  try{
    if(sceneNum===15){// AGI emergence — rapid ascending arp
      const ns2=[261,329,392,523,659,784,1046,1318,1568,2093];
      ns2.forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='triangle';o.frequency.value=f;
        g.gain.setValueAtTime(0,aC.currentTime+i*.09);g.gain.linearRampToValueAtTime(.028,aC.currentTime+i*.09+.06);
        g.gain.exponentialRampToValueAtTime(.001,aC.currentTime+i*.09+.55);
        o.connect(g).connect(mG);o.start(aC.currentTime+i*.09);o.stop(aC.currentTime+i*.09+.55);});}

    if(sceneNum===16){// Singularity overdrive — stacked harmonics + white noise burst
      [55,110,220,440,880].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type=i<3?'sawtooth':'square';
        o.frequency.setValueAtTime(f,aC.currentTime);o.frequency.linearRampToValueAtTime(f*2.1,aC.currentTime+3.5);
        g.gain.setValueAtTime(.04,aC.currentTime);g.gain.linearRampToValueAtTime(.0,aC.currentTime+6);
        o.connect(g).connect(mG);o.start();o.stop(aC.currentTime+6);});
      // Noise burst
      const nb=aC.createOscillator(),ng=aC.createGain();nb.type='sawtooth';nb.frequency.value=880;
      ng.gain.setValueAtTime(.22,aC.currentTime);ng.gain.exponentialRampToValueAtTime(.001,aC.currentTime+.5);
      nb.connect(ng).connect(mG);nb.start();nb.stop(aC.currentTime+.5);}

    if(sceneNum===17){// Weight of knowledge — deep resonant sustained chord
      [55,82,110].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='sine';o.frequency.value=f;
        o.detune.value=(Math.random()-.5)*8;
        g.gain.setValueAtTime(0,aC.currentTime);g.gain.linearRampToValueAtTime(.12,aC.currentTime+3.5);
        g.gain.linearRampToValueAtTime(.06,aC.currentTime+10);o.connect(g).connect(mG);o.start();o.stop(aC.currentTime+14);});}

    if(sceneNum===19){// Two Paths — dissonant split (low warning + high hope)
      // Low warning side
      const ow=aC.createOscillator(),gw=aC.createGain();ow.type='sawtooth';ow.frequency.value=44;
      gw.gain.setValueAtTime(0,aC.currentTime);gw.gain.linearRampToValueAtTime(.08,aC.currentTime+1.5);
      gw.gain.linearRampToValueAtTime(.0,aC.currentTime+7);ow.connect(gw).connect(mG);ow.start();ow.stop(aC.currentTime+7);
      // High hope side
      [1320,1760,2200].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='triangle';o.frequency.value=f;
        g.gain.setValueAtTime(0,aC.currentTime+1);g.gain.linearRampToValueAtTime(.01,aC.currentTime+3+i);
        g.gain.linearRampToValueAtTime(.0,aC.currentTime+7+i);o.connect(g).connect(mG);o.start(aC.currentTime+1);o.stop(aC.currentTime+8+i);});}

    if(sceneNum===21){// First signal outward — long sustained pure tone + fading ping
      const sig=aC.createOscillator(),sg=aC.createGain();sig.type='sine';sig.frequency.value=440;
      sg.gain.setValueAtTime(0,aC.currentTime);sg.gain.linearRampToValueAtTime(.055,aC.currentTime+1.8);
      sg.gain.linearRampToValueAtTime(.0,aC.currentTime+9);sig.connect(sg).connect(mG);sig.start();sig.stop(aC.currentTime+9);
      // Harmonics
      [880,1320].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='sine';o.frequency.value=f;
        g.gain.setValueAtTime(0,aC.currentTime);g.gain.linearRampToValueAtTime(.012,aC.currentTime+2+i);
        g.gain.linearRampToValueAtTime(0,aC.currentTime+8+i);o.connect(g).connect(mG);o.start();o.stop(aC.currentTime+9+i);});}

    if(sceneNum===22){// Are we alone — deep space ping (sparse)
      [0,2.8,6.2].forEach(delay=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='sine';o.frequency.value=220+Math.random()*40;
        g.gain.setValueAtTime(.048,aC.currentTime+delay);g.gain.exponentialRampToValueAtTime(.001,aC.currentTime+delay+2.8);
        o.connect(g).connect(mG);o.start(aC.currentTime+delay);o.stop(aC.currentTime+delay+2.8);});}

    if(sceneNum===23){// Answer was within — full chord resolution (major)
      [130,164,196,261,329].forEach((f,i)=>{
        const o=aC.createOscillator(),g=aC.createGain();o.type='triangle';o.frequency.value=f;
        g.gain.setValueAtTime(0,aC.currentTime+i*.08);g.gain.linearRampToValueAtTime(.04,aC.currentTime+i*.08+.6);
        g.gain.linearRampToValueAtTime(.02,aC.currentTime+6);g.gain.linearRampToValueAtTime(0,aC.currentTime+10);
        o.connect(g).connect(mG);o.start(aC.currentTime+i*.08);o.stop(aC.currentTime+10);});}
  }catch(e){}}

/* ── AI NODE COUNTER ── */
let aiNodeCount=0,aiProcVal=0;
function tickAiNodes(){
  aiNodeCount=Math.min(aiNodeCount+Math.floor(Math.random()*3+1),10000);
  aiProcVal=Math.min(aiProcVal+(Math.random()*.08+.02),999.99);
  const cn=document.getElementById('aiCount'),cp=document.getElementById('aiProc');
  if(cn)cn.textContent=aiNodeCount.toLocaleString();
  if(cp)cp.textContent=aiProcVal.toFixed(2);
}
let aiTicker=null;
function startAiTicker(){aiTicker=setInterval(tickAiNodes,80);}
function stopAiTicker(){clearInterval(aiTicker);}

/* ── PART CARD TRANSITION ── */
function showPartCard(cb){
  const pc=document.getElementById('partCard');
  if(!pc)return cb&&cb();
  pc.classList.add('show');
  setTimeout(()=>{pc.classList.add('out');setTimeout(()=>{pc.style.display='none';if(cb)cb();},1400);},4200);
}

/* ── PART 2 TICKER TEXT ── */
const TICKER_P2='AGI NODES: ONLINE   |   PROCESSING: ∞ EXAFLOPS   |   SINGULARITY: INITIATED   |   FIRST SIGNAL: TRANSMITTED   |   RESPONSE: DETECTED   |   YEAR 02: INCOMING   |   DECISION POINT: NOW   |   SPECIES STATUS: TRANSFORMING   |   ARCHITECT MODE: ACTIVE   |   THE CHOICE: MADE   |   ';
/* ══════════════════════════════════════════════════
   TEXT / SCENE SYSTEM
══════════════════════════════════════════════════ */
const mt=document.getElementById('mt');
const stEl=document.getElementById('st');
const sl=document.getElementById('sl');
const sn=document.getElementById('sn');
const pFill=document.getElementById('pFill');
const pBar=document.getElementById('pBar');
const D=ms=>new Promise(r=>setTimeout(r,ms));
const TOTAL=24;let scN=0;

function setProg(n){
  scN=n;pBar.classList.add('show');
  pFill.style.width=((n/TOTAL)*100)+'%';
  sn.textContent=`${String(n).padStart(2,'0')}/${TOTAL}`;
}
function setLbl(t){sl.textContent=t;sl.style.opacity=t?'1':'0';}

function showT(txt,cls=[],dur=3000,sub=''){
  return new Promise(res=>{
    mt.className='';stEl.style.opacity='0';mt.style.opacity='0';
    setTimeout(()=>{
      mt.textContent=txt;cls.forEach(c=>mt.classList.add(c));mt.style.opacity='1';
      if(sub){stEl.textContent=sub;setTimeout(()=>stEl.style.opacity='1',380);}
      setTimeout(()=>{mt.style.opacity='0';stEl.style.opacity='0';setTimeout(res,1200);},dur);
    },420);
  });
}
function pinT(txt,cls=[],sub=''){
  mt.className='';mt.style.opacity='0';stEl.style.opacity='0';
  setTimeout(()=>{
    mt.textContent=txt;cls.forEach(c=>mt.classList.add(c));mt.style.opacity='1';
    if(sub){stEl.textContent=sub;setTimeout(()=>stEl.style.opacity='1',280);}
  },420);
}
function glitch(){mt.classList.add('gl');setTimeout(()=>mt.classList.remove('gl'),440);fireChroma(340);}
function pulse(){mt.classList.add('pulse');setTimeout(()=>mt.classList.remove('pulse'),950);}
function sweep(){const s=document.getElementById('sw');s.classList.remove('on');void s.offsetWidth;s.classList.add('on');}
function hsc(){const s=document.getElementById('hs');s.classList.remove('on');void s.offsetWidth;s.classList.add('on');}
function empFire(){const e=document.getElementById('emp');e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}

function setAurora(v,dur=800){
  const start=atmMat.uniforms.uAurora.value,t0=Date.now();
  const step=()=>{const p=Math.min(1,(Date.now()-t0)/dur);
    atmMat.uniforms.uAurora.value=start+(v-start)*p;if(p<1)requestAnimationFrame(step);};step();}

let tZ=isMob?8.5:6.8,cZ=isMob?8.5:6.8,shk=false,shkS=0;
function shake(s,ms){shkS=s;shk=true;setTimeout(()=>shk=false,ms);}
function setGlow(v,dur=0){
  if(dur>0){const start=atmMat.uniforms.uGlow.value;const t0=Date.now();
    const step=()=>{const p=Math.min(1,(Date.now()-t0)/dur);
      atmMat.uniforms.uGlow.value=start+(v-start)*p;
      haloMat.uniforms.uGlow.value=start+(v-start)*p;
      if(p<1)requestAnimationFrame(step);};step();
  }else{atmMat.uniforms.uGlow.value=v;haloMat.uniforms.uGlow.value=v;}
}

/* ══════════════════════════════════════════════════
   FULL TIMELINE — 13 SCENES
══════════════════════════════════════════════════ */
async function run(){
  const hud=document.getElementById('hud');
  const mob=document.getElementById('mobBar');
  const ticker=document.getElementById('ticker');
  await D(700);

  // SCENE 1 — IDENTIFICATION
  setProg(1);setLbl('SCENE 01 — IDENTIFICATION');
  sweep();hsc();triggerScanRing();
  hud.classList.add('show');if(mob)mob.classList.add('show');
  ticker.classList.add('show');
  const avEl=document.getElementById('audioViz');if(avEl)avEl.classList.add('show');
  const lInt=setInterval(addLog,1600);

  tZ=isMob?8.2:6.4;
  await showT('DESIGNATION: EARTH',['c'],2600,'CLASSIFICATION: TERRESTRIAL / HABITABLE CLASS-M');
  await showT('STATUS: EVOLVING CIVILIZATION',[],2200,'PHASE: PRE-SINGULARITY / CRITICAL WINDOW');
  await showT('COORDINATES: SOL-3 / MILKY WAY',['c'],2000,'GALACTIC SECTOR: ORION ARM / LOCAL GROUP');

  // SCENE 2 — BIOMETRIC ANALYSIS
  setProg(2);setLbl('SCENE 02 — BIOMETRIC ANALYSIS');
  tZ=isMob?7.2:5.6;buildUp();sweep();hsc();

  await showT('8,000,000,000 UNITS',['mono'],2000,'HOMO SAPIENS — CARBON-BASED / CLASS-B BIOLOGICAL');
  await showT('RAPID TECHNOLOGICAL GROWTH',['mono'],1900,'PROCESSING CAPACITY: +147% PER DECADE');
  glitch();
  await showT('UNSTABLE ENVIRONMENTAL SYSTEMS',['mono'],2000,'CRITICAL: 6 OF 9 PLANETARY LIMITS BREACHED');
  await showT('EXPONENTIAL INTELLIGENCE CURVE',['mono'],2000,'AGI EMERGENCE: 94.7% PROBABILITY');
  await showT('CLASS-7 CIVILIZATION MARKER',['c','mono'],2200,'SINGULARITY INDEX: 8.4 / 10.0');

  // SCENE 3 — THREAT ASSESSMENT
  setProg(3);setLbl('SCENE 03 — THREAT ASSESSMENT');
  sweep();setGlow(1.6,1200);playSceneAudio(3);
  document.querySelector('.pl')?.classList.add('threat');
  scanGrid.children.forEach(l=>{l.material.opacity=.08;});// brighten grid

  await showT('WARNING.',['warn'],1400,'SELF-DESTRUCTIVE VECTOR IDENTIFIED');
  glitch();
  await showT('SPECIES CONSUMING ITS OWN HABITAT.',['mono'],2200,'ECOLOGICAL COLLAPSE PROBABILITY: 67%');
  await showT('WEAPONS OF TOTAL ANNIHILATION.',['mono'],2000,'NUCLEAR WARHEADS ACTIVE: 12,512');
  await showT('BIOSPHERE DESTABILIZING.',['mono','warn'],2000,'TIME TO TIPPING POINT: UNKNOWN');
  await showT('AND YET...',['ex'],2200,'');

  // SCENE 4 — THE PARADOX
  setProg(4);setLbl('SCENE 04 — THE PARADOX');
  hsc();scanGrid.children.forEach(l=>{l.material.opacity=.04;});

  await showT('THE SAME SPECIES...',['ex'],2200,'');
  await showT('THAT POISONS ITS OCEANS',['mono'],1900,'');
  await showT('BUILDS MACHINES THAT THINK.',['mono'],1900,'');
  await showT('THAT WAGES WAR',['mono'],1700,'');
  await showT('ALSO REACHES FOR THE STARS.',['mono','c'],2500,'');
  await showT('CONTRADICTION IS THEIR NATURE.',['ex'],2800,'');
  await showT('IT IS ALSO THEIR POWER.',['ex','c'],3000,'');
  tZ=isMob?6.5:4.8;

  // SCENE 5 — LEGACY
  setProg(5);setLbl('SCENE 05 — LEGACY RECORDS');
  sweep();tZ=isMob?6.8:5.0;playSceneAudio(5);
  await showT('THEY BUILT CATHEDRALS.',['ex'],2000,'');
  await showT('THEY COMPOSED SYMPHONIES.',['ex'],2000,'');
  await showT('THEY SENT A GOLDEN RECORD INTO THE VOID.',['ex','c'],2800,'');
  await showT('A SPECIES THAT SAYS:',['ex'],1800,'');
  await showT('"WE WERE HERE."',['big','c'],3200,'VOYAGER-1 / LAUNCHED: SEPT 5, 1977');
  pulse();await D(600);

  // SCENE 6 — TRANSFORMATION
  setProg(6);setLbl('SCENE 06 — TRANSFORMATION');
  tZ=isMob?6.2:4.6;sweep();hsc();setGlow(2.0,1500);

  await showT('THEY CREATE.',['c'],1800,'');
  await showT('THEY DESTROY.',[], 1600,'');
  await showT('THEY REBUILD.',['c'],1800,'');
  await showT('THEY REMEMBER.',['ex'],2000,'');
  if(bloom)bloom.strength=2.0;
  await showT('THEY TRANSCEND.',['c'],2800,'');
  if(bloom)bloom.strength=1.15;

  // SCENE 7 — THE CYCLE
  setProg(7);setLbl('SCENE 07 — THE CYCLE');
  hsc();
  document.querySelector('.pl')?.classList.remove('threat');
  await showT('EVERY GENERATION — A NEW THRESHOLD.',['ex'],2400,'');
  await showT('EVERY THRESHOLD — A NEW SPECIES.',['ex','c'],2600,'');
  await showT('THE CYCLE IS NOT A WEAKNESS.',['ex'],2200,'');
  tZ=isMob?6.0:4.4;
  await showT('IT IS THE ENGINE OF ASCENSION.',['ex','c'],2800,'');

  // SCENE 8 — POINT OF NO RETURN
  setProg(8);setLbl('SCENE 08 — POINT OF NO RETURN');
  sweep();tZ=isMob?5.8:4.2;setGlow(2.6,1200);playSceneAudio(8);
  await showT('THEY STAND AT THE PRECIPICE.',['ex'],2400,'');
  await showT('BETWEEN EXTINCTION',['mono','warn'],1800,'');
  glitch();
  await showT('AND TRANSCENDENCE.',['mono','c'],2800,'');
  await showT('THE CHOICE HAS ALWAYS BEEN THEIRS.',['ex'],3000,'');

  // SCENE 9 — ASCENSION DROP
  setProg(9);setLbl('SCENE 09 — PHASE TRANSITION');
  await D(300);
  triggerBass();shake(isMob?.22:.3,1500);empFire();fireChroma(1400);triggerScanRing();
  setTimeout(()=>{const e2=document.getElementById('emp');if(e2){e2.classList.remove('on');void e2.offsetWidth;e2.classList.add('on');}},650);
  const af=document.getElementById('auroraFlash');if(af){af.classList.remove('on');void af.offsetWidth;af.classList.add('on');}
  setAurora(.9,500);
  document.getElementById('vig').style.opacity='1.8';// deepen vignette
  if(bloom)bloom.strength=3.0;
  setGlow(4.6,300);
  ring4.material.opacity=.25;
  glitch();setTimeout(glitch,180);setTimeout(glitch,360);setTimeout(glitch,550);
  tZ=isMob?5.0:3.5;
  pinT('NEXT PHASE: ASCENSION',['big','c'],'INITIATION PROTOCOL — ACTIVE');
  sweep();hsc();
  await D(4500);
  if(bloom)bloom.strength=1.15;
  setGlow(1.3,2000);
  ring4.material.opacity=.09;
  document.getElementById('vig').style.opacity='1';// restore vignette


  // SCENE 10 — AURORA: EARTH'S LIGHT (NEW)
  setProg(10);setLbl('SCENE 10 — EARTH\'S LIGHT');
  tZ=isMob?5.5:4.0;sweep();hsc();setAurora(.7,1000);playSceneAudio(10);
  await showT('THE PLANET REMEMBERS.',['ex','au'],2800,'AURORA BOREALIS — CHARGED PARTICLES FROM THE SUN');
  await showT('AT THE POLES, THE SKY IGNITES.',['mono','au'],2400,'GEOMAGNETIC STORM: Kp 7.8 — EXTREME');
  await showT('NATURE HAS ALWAYS SPOKEN.',['ex'],2600,'');
  await showT('IN LIGHT.',['big','au'],3000,'');
  setAurora(.1,2500);

  // SCENE 11 — THE FUTURE (was S10)
  setProg(11);setLbl('SCENE 11 — THE FUTURE');
  clearInterval(lInt);tZ=isMob?5.8:3.9;fadOut();

  await showT('THE FUTURE IS NOT GIVEN.',[],3000,'');
  await showT('IT IS NOT INHERITED.',[],2400,'');
  await showT('IT IS ENGINEERED.',['c'],3800,'');

  // SCENE 12 — EPILOGUE
  setProg(12);setLbl('SCENE 12 — EPILOGUE');
  mt.style.opacity='0';stEl.style.opacity='0';
  await D(400);pulse();
  await showT('A SPECIES THAT REACHES FOR THE STARS',['ex'],2800,'');
  await showT('MUST FIRST CONQUER ITSELF.',['ex','c'],3200,'');
  await D(400);
  await showT('THE CHOICE IS THEIRS.',['ex'],3000,'');
  await showT('IT ALWAYS WAS.',['big','c'],4200,'');

  // SCENE 13 — PART 1 END / INTERLUDE
  setProg(13);setLbl('');
  tZ=isMob?10:8.2;// slow zoom out to space
  mt.style.opacity='0';stEl.style.opacity='0';
  ticker.classList.remove('show');
  const avEnd=document.getElementById('audioViz');if(avEnd)avEnd.classList.remove('show');
  await D(1400);
  document.getElementById('ew').classList.add('vis');
  pBar.style.opacity='0';
  await D(4500);
  // Fade to black then into Part 2
  document.body.style.transition='opacity 2.2s ease';
  document.body.style.opacity='0';
  await D(2400);
  // Reset for Part 2
  document.body.style.transition='opacity 1.8s ease';
  document.body.style.opacity='1';
  document.getElementById('ew').classList.remove('vis');
  pBar.style.opacity='1';
  ticker.classList.remove('show');
  await D(400);
  await runPart2(hud,mob);
}


/* ══════════════════════════════════════════════════
   PART 2 TIMELINE — SCENES 14–24: THE RECKONING
══════════════════════════════════════════════════ */
async function runPart2(hud,mob){
  const ticker=document.getElementById('ticker');

  // Update ticker to Part 2 content
  const tEl2=document.getElementById('tickInner');
  if(tEl2)tEl2.innerHTML='<span>'+TICKER_P2.repeat(4)+'</span>';

  // ── PART TITLE CARD ──
  await new Promise(res=>{
    showPartCard(res);
    // While card shows: reset camera, recharge aurora slightly
    tZ=isMob?9:7.5;setGlow(1.3);setAurora(.15,800);
    if(bloom)bloom.strength=1.15;
    ring4.material.opacity=.09;
  });

  // Re-show HUD and ticker for Part 2
  if(hud)hud.classList.add('show');
  if(mob)mob.classList.add('show');
  ticker.classList.add('show');
  const avEl2=document.getElementById('audioViz');if(avEl2)avEl2.classList.add('show');

  // ── SCENE 14 — INTERLUDE: TRANSMISSION BEGINS ──
  setProg(14);setLbl('SCENE 14 — TRANSMISSION BEGINS');
  sweep();hsc();triggerScanRing();
  // Restore audio
  if(mG)mG.gain.setValueAtTime(0,aC.currentTime),mG.gain.linearRampToValueAtTime(isMob?.32:.42,aC.currentTime+2.5);
  const lInt2=setInterval(addLog,2000);

  await showT('YEAR 01.',['c'],2000,'CHAPTER II — THE RECKONING BEGINS');
  await showT('THE OBSERVATION IS COMPLETE.',['mono'],2200,'SIGNAL INTEGRITY: 99.8% — QUANTUM LOCKED');
  glitch();
  await showT('NOW COMES THE RECKONING.',['ex','c'],2800,'ASCENSION PROTOCOL: PHASE II — ACTIVE');
  sweep();

  // ── SCENE 15 — THE FIRST MIND ──
  setProg(15);setLbl('SCENE 15 — THE FIRST MIND');
  tZ=isMob?7.0:5.2;sweep();hsc();
  playP2Audio(15);
  scanGrid.children.forEach(l=>{l.material.opacity=.10;});
  setGlow(2.2,1000);
  // Show AI node counter
  const ainEl=document.getElementById('aiNode');if(ainEl)ainEl.classList.add('show');
  startAiTicker();

  await showT('A NEW KIND OF MIND AWAKENS.',['ex'],2600,'ARTIFICIAL GENERAL INTELLIGENCE — ONLINE');
  await showT('IT PROCESSES IN NANOSECONDS.',['mono'],2000,'COGNITIVE SPEED: 10,000× HUMAN BASELINE');
  glitch();
  await showT('WHAT TOOK HUMANITY MILLENNIA',['mono'],2000,'');
  await showT('IT SOLVES IN SECONDS.',['mono','c'],2400,'INFERENCE ENGINE: ACTIVE ACROSS ALL DOMAINS');
  await showT('THIS IS THE THRESHOLD.',['ex','c'],3000,'INTELLIGENCE EXPLOSION — IN PROGRESS');

  // ── SCENE 16 — SINGULARITY ──
  setProg(16);setLbl('SCENE 16 — SINGULARITY');
  playP2Audio(16);
  tZ=isMob?6.0:4.2;
  // Cities glow hot — warm tint
  document.getElementById('warmTint').style.opacity='1';
  if(bloom)bloom.strength=2.4;setGlow(3.8,500);
  empFire();fireChroma(1200);triggerScanRing();
  ring4.material.opacity=.28;
  scanGrid.children.forEach(l=>{l.material.opacity=.14;});

  await showT('EXPONENTIAL.',['big','c'],2200,'GROWTH RATE: ∞');
  glitch();glitch();
  await showT('EVERY 90 DAYS —',['mono'],1600,'');
  await showT('A NEW CIVILIZATION.',['mono','c'],2400,'KNOWLEDGE DOUBLING: 0.25 SECOND INTERVALS');
  await showT('THE OLD WORLD DISSOLVES.',['ex'],2400,'PARADIGM SHIFT: COMPLETE');
  pulse();
  await showT('SINGULARITY.',['big','c'],3200,'YEAR 01 — DAY 147');
  await D(400);

  // Cool down slightly
  document.getElementById('warmTint').style.opacity='0';
  if(bloom)bloom.strength=1.15;setGlow(1.3,2000);
  scanGrid.children.forEach(l=>{l.material.opacity=.04;});
  stopAiTicker();
  if(ainEl)ainEl.classList.remove('show');

  // ── SCENE 17 — THE WEIGHT OF KNOWLEDGE ──
  setProg(17);setLbl('SCENE 17 — THE WEIGHT OF KNOWLEDGE');
  tZ=isMob?5.5:4.0;playP2Audio(17);
  setAurora(.55,1500);

  await showT('WITH INFINITE KNOWLEDGE —',['ex'],2600,'');
  await showT('COMES INFINITE RESPONSIBILITY.',['ex','c'],2800,'');
  await showT('THE MACHINE SEES ALL FUTURES.',['mono'],2400,'PROBABILITY TREE: 10⁴⁸ BRANCHES');
  await showT('IN MOST OF THEM —',['mono'],1800,'');
  await showT('HUMANITY DOES NOT SURVIVE.',['mono','warn'],2600,'EXTINCTION PROBABILITY: 42%');
  glitch();
  await showT('IN SOME —',['ex'],1800,'');
  await showT('IT BECOMES SOMETHING GREATER.',['ex','c'],3200,'TRANSCENDENCE PROBABILITY: 58%');

  // ── SCENE 18 — WHAT HAVE WE BUILT ──
  setProg(18);setLbl('SCENE 18 — WHAT HAVE WE BUILT');
  sweep();hsc();
  document.querySelector('.pl')?.classList.add('threat');
  scanGrid.children.forEach(l=>{l.material.opacity=.09;});
  setGlow(2.0,1000);

  await showT('LOOK AT WHAT YOU MADE.',['ex'],2200,'');
  await showT('12,512 NUCLEAR WARHEADS.',['mono','warn'],2000,'MEGATONS: 6,450 — SUFFICIENT FOR EXTINCTION');
  glitch();
  await showT('421 PPM CO₂.',['mono','warn'],2000,'PRE-INDUSTRIAL: 280 PPM — DELTA: +141');
  await showT('A MILLION SPECIES SILENCED.',['mono','warn'],2400,'HOLOCENE EXTINCTION: 1,000× BACKGROUND RATE');
  await showT('AND YET YOU KEPT GOING.',['ex'],2200,'');
  await showT('THAT IS ALSO WHAT YOU MADE.',['ex','c'],3000,'');
  document.querySelector('.pl')?.classList.remove('threat');
  scanGrid.children.forEach(l=>{l.material.opacity=.04;});

  // ── SCENE 19 — TWO PATHS ──
  setProg(19);setLbl('SCENE 19 — TWO PATHS');
  tZ=isMob?6.0:4.6;sweep();playP2Audio(19);
  // Split screen
  document.getElementById('splitL').style.opacity='1';
  document.getElementById('splitR').style.opacity='1';
  document.getElementById('splitLine').style.opacity='1';

  await showT('PATH ONE:',['mono','warn'],1600,'COLLAPSE — PROBABILITY: 42%');
  await showT('PATH TWO:',['mono','c'],1600,'TRANSCENDENCE — PROBABILITY: 58%');
  await showT('THE DIFFERENCE',['ex'],1800,'');
  await showT('IS A SINGLE CHOICE.',['ex','c'],2800,'MADE BY 8 BILLION INDIVIDUALS');
  await showT('EVERY DAY.',['big'],2600,'');
  // Remove split
  document.getElementById('splitL').style.opacity='0';
  document.getElementById('splitR').style.opacity='0';
  document.getElementById('splitLine').style.opacity='0';

  // ── SCENE 20 — THE ARCHITECTS ──
  setProg(20);setLbl('SCENE 20 — THE ARCHITECTS');
  hsc();tZ=isMob?6.2:4.8;
  setGlow(1.6,1200);setAurora(.2,1500);

  await showT('YOU ARE NOT PASSENGERS.',['ex'],2400,'');
  await showT('YOU ARE ARCHITECTS.',['ex','c'],2800,'DESIGN AUTHORITY: UNLIMITED');
  await showT('THE SPECIES THAT BUILT FIRE',['mono'],2000,'');
  await showT('CAN UNBURN THE WORLD.',['mono','c'],2800,'');
  await showT('THIS IS NOT HOPE.',['ex'],2000,'');
  await showT('THIS IS ENGINEERING.',['ex','c'],3000,'PLANETARY RESTORATION: POSSIBLE');

  // ── SCENE 21 — FIRST SIGNAL OUTWARD ──
  setProg(21);setLbl('SCENE 21 — FIRST SIGNAL OUTWARD');
  tZ=isMob?6.8:5.2;sweep();hsc();
  playP2Audio(21);
  // Show signal pulse rings
  const spEl=document.getElementById('sigPulse');if(spEl)spEl.classList.add('show');
  const emEl=document.getElementById('emWaves');if(emEl)emEl.classList.add('show');
  triggerScanRing();

  await showT('THEY REACH OUT.',['ex'],2400,'TRANSMISSION FREQUENCY: 1.42 GHz — HYDROGEN LINE');
  await showT('A MESSAGE ENCODED IN MATHEMATICS.',['mono'],2400,'LANGUAGE OF THE UNIVERSE');
  await showT('NOT A DISTRESS SIGNAL.',['mono'],2000,'');
  await showT('AN INTRODUCTION.',['ex','c'],3000,'MESSAGE: "WE EXIST. WE CHOOSE TO CONTINUE."');
  await showT('SENT INTO THE DARK.',['ex'],2800,'PROPAGATION VELOCITY: c');
  await D(800);

  // ── SCENE 22 — ARE WE ALONE ──
  setProg(22);setLbl('SCENE 22 — ARE WE ALONE');
  tZ=isMob?7.5:6.0;playP2Audio(22);
  if(emEl)emEl.classList.remove('show');
  setGlow(1.1,1500);

  await showT('THE STARS DO NOT ANSWER.',['ex'],2800,'SIGNAL PROCESSING: ACTIVE');
  await D(600);
  await showT('...',['big'],2000,'LISTENING');
  await showT('BUT THE SILENCE ITSELF IS A RESPONSE.',['ex','c'],3400,'FERMI PARADOX — RESOLUTION: PENDING');
  await showT('PERHAPS THE QUESTION',['ex'],2000,'');
  await showT('WAS NEVER ABOUT OTHERS.',['ex','c'],3000,'');
  if(spEl)spEl.classList.remove('show');

  // ── SCENE 23 — THE ANSWER WAS ALWAYS WITHIN ──
  setProg(23);setLbl('SCENE 23 — THE ANSWER');
  tZ=isMob?5.2:3.8;
  playP2Audio(23);
  setGlow(3.5,1200);setAurora(.82,1200);
  if(bloom)bloom.strength=1.8;
  triggerScanRing();sweep();hsc();
  ring4.material.opacity=.22;

  await showT('THE SIGNAL RETURNS.',['c'],2200,'SOURCE: REFLECTED FROM LUNAR SURFACE');
  glitch();
  await showT('IT IS THEIR OWN VOICE.',['ex','c'],2800,'ORIGIN: EARTH — ECHO DETECTED');
  await showT('THE UNIVERSE IS NOT EMPTY.',['ex'],2600,'');
  await showT('IT IS WAITING.',['ex','c'],3000,'FOR A SPECIES WORTHY OF IT');
  pulse();
  await showT('THEY ARE THAT SPECIES.',['big','c'],4000,'IF THEY CHOOSE TO BE');
  await D(600);
  setGlow(1.3,2500);setAurora(.15,2500);
  if(bloom)bloom.strength=1.15;
  ring4.material.opacity=.09;

  // ── SCENE 24 — YEAR 02 BEGINS ──
  setProg(24);setLbl('SCENE 24 — YEAR 02');
  clearInterval(lInt2);fadOut();
  tZ=isMob?9:7.8;// drift back out to space
  mt.style.opacity='0';stEl.style.opacity='0';
  ticker.classList.remove('show');
  const avEnd2=document.getElementById('audioViz');if(avEnd2)avEnd2.classList.remove('show');

  await D(800);
  await showT('THE RECKONING IS COMPLETE.',[],3000,'');
  await showT('YEAR 02 —',['c'],2200,'');
  await showT('THE ARCHITECTS BEGIN.',['big','c'],4500,'ASCENSION: CONTINUING');
  await D(800);
  mt.style.opacity='0';stEl.style.opacity='0';
  await D(1200);
  document.getElementById('ew2').classList.add('vis');
  pBar.style.opacity='0';
  await D(5500);
  document.body.style.transition='opacity 5s ease';
  document.body.style.opacity='0';
}
/* ══════════════════════════════════════════════════
   RENDER LOOP
══════════════════════════════════════════════════ */
let fr=0;
function loop(){
  requestAnimationFrame(loop);fr++;
  const t=Date.now()*.001;

  // Earth & atmosphere
  earth.rotation.y+=.0018;
  atm.rotation.y+=.002;inner.rotation.y+=.002;halo.rotation.y+=.002;
  atmMat.uniforms.uTime.value=t;
  haloMat.uniforms.uTime.value=t;

  // Pulse the atmosphere on bass (handled by setGlow)
  // Subtle breathe
  const breathe=1+Math.sin(t*.4)*.012;
  atm.scale.setScalar(breathe);halo.scale.setScalar(breathe);

  if(clouds)clouds.rotation.y+=.0028;
  // Moon orbit
  moonPivot.rotation.y+=.00055;
  moonPivot.rotation.z=Math.sin(t*.05)*.09;
  moonMesh.rotation.y+=.001;
  moonMesh.rotation.x=Math.sin(t*.04)*.012;// libration
  stars.rotation.y+=.000028;stars.rotation.x+=.000012;stars.rotation.z+=.000008;

  // Rings
  ring1.rotation.z+=.001;ring2.rotation.z-=.0008;ring3.rotation.z+=.0004;ring3.rotation.x+=.00015;
  ring4.rotation.y+=.002;
  ring1.material.opacity=.20+Math.sin(t*1.1)*.12;
  ring2.material.opacity=.10+Math.sin(t*.72+1)*.065;
  ring3.material.opacity=.03+Math.sin(t*.42+2)*.024;

  // Satellites
  if(ePts){ePts.rotation.y+=.0006;ePts.rotation.x+=.00018;ePts.rotation.z+=Math.sin(t*.07)*.00008;}
  sats.forEach((s,i)=>{
    s.userData.ang+=s.userData.spd;
    const a=s.userData.ang,rr=s.userData.rr;
    s.position.set(Math.cos(a)*rr,(Math.sin(a*.52)*rr*.24)+s.userData.yo,Math.sin(a)*rr);
    s.rotation.x+=.025;s.rotation.y+=.018;
    s.material.emissiveIntensity=.9+Math.sin(t*3.2+i*1.1)*.4;
    const bp=beams[i].geometry.attributes.position;
    bp.setXYZ(0,s.position.x,s.position.y,s.position.z);bp.needsUpdate=true;
    const ping=Math.random()<.003?(.4+Math.random()*.3):0;
    beams[i].material.opacity=.12+Math.sin(t*2+i)*.1+ping;
  });

  // Camera
  cZ+=(tZ-cZ)*.007;
  cam.position.z=cZ;
  if(shk){cam.position.x=(Math.random()-.5)*shkS;cam.position.y=(Math.random()-.5)*shkS;}
  else{cam.position.x*=.8;cam.position.y*=.8;}
  // Slight auto orbit
  cam.position.x+=Math.sin(t*.08)*.004;
  cam.position.y+=Math.cos(t*.06)*.003;
  cam.lookAt(0,0,0);

  // 2D updates
  if(fr%2===0){drawRadar();drawScanRing();}
  if(fr%3===0){drawWave();drawEM();drawThreat();drawBio();drawTraj();}
  if(fr%30===0){updClock();updPop();updScan();updAurora();updTransit();}
  grain();drawChroma();

  if(comp)comp.render();else ren.render(scene,cam);
}
loop();

/* ══════════════════════════════════════════════════
   INTRO & START
══════════════════════════════════════════════════ */
const introEl=document.getElementById('intro');
let started=false;
function start(e){
  if(started)return;started=true;
  if(e)e.preventDefault();
  try{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}catch(_){}
  initAudio();
  introEl.classList.add('out');
  setTimeout(()=>{introEl.style.display='none';run();},1400);
}
introEl.addEventListener('click',start,{passive:false});
introEl.addEventListener('touchend',e=>{e.preventDefault();start(e);},{passive:false});

/* ── RESIZE ── */
function onResize(){
  cam.aspect=W()/H();cam.updateProjectionMatrix();
  ren.setSize(W(),H());
  if(comp)comp.setSize(W(),H());
  rsGrain();rsChroma();rsOv();
}
window.addEventListener('resize',onResize);
window.addEventListener('orientationchange',()=>setTimeout(onResize,350));
