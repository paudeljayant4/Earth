'use strict';
const isMob=window.innerWidth<769;
const isLow=isMob||(navigator.hardwareConcurrency||4)<=4||window.devicePixelRatio<1.5;
const W=()=>window.innerWidth,H=()=>window.innerHeight;

/* ══════════════════════════════════════════════════
   THREE.JS SCENE SETUP
══════════════════════════════════════════════════ */
const scene=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(58,W()/H(),.1,3000);
cam.position.set(0,0,isMob?9:7.8);

const ren=new THREE.WebGLRenderer({
  canvas:document.getElementById('bg'),
  antialias:!isLow,
  powerPreference:isLow?'low-power':'high-performance'
});
ren.setSize(W(),H());
ren.setPixelRatio(Math.min(window.devicePixelRatio,isLow?1:2));

// LIGHTS
const sun=new THREE.PointLight(0xfff8f0,3.2,1000);
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
varying vec3 vNormal;
varying vec3 vPos;
void main(){
  vec3 viewDir=normalize(-vPos);
  float rim=1.-abs(dot(vNormal,viewDir));
  rim=pow(rim,2.2);
  // Animated pulse ring
  float pulse=sin(uTime*1.4)*0.06;
  float glow=rim*uGlow*(1.+pulse+uPulse*.35);
  // Color gradient: deep blue → cyan
  vec3 inner=vec3(.01,.10,.55);
  vec3 outer=vec3(.03,.45,.98);
  vec3 col=mix(inner,outer,pow(rim,1.5));
  // Subtle shimmer band
  float band=sin(vNormal.y*6.+uTime*.8)*.04;
  col+=vec3(0.,band*.5,band);
  gl_FragColor=vec4(col*glow,rim*.42*uGlow);
}`;

const atmMat=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uGlow:{value:1.0},uPulse:{value:0}},
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
  vec3 col=vec3(.0,.55,.95);
  gl_FragColor=vec4(col,rim*.28*uGlow*(1.+pulse));
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
  emissiveIntensity:.54,
  specularMap:mkSpec(),
  specular:new THREE.Color(.18,.28,.45),
  shininess:38,
});
const earth=new THREE.Mesh(earthGeo,earthMat);
scene.add(earth);

// Main atmosphere shell
const atm=new THREE.Mesh(new THREE.SphereGeometry(2.26,isLow?32:64,isLow?32:64),atmMat);
scene.add(atm);

// Inner soft glow
const inner=new THREE.Mesh(
  new THREE.SphereGeometry(2.07,32,32),
  new THREE.MeshPhongMaterial({color:0x002a99,emissive:0x001866,emissiveIntensity:.8,transparent:true,opacity:.07,side:THREE.FrontSide,depthWrite:false})
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
    new THREE.MeshPhongMaterial({map:mkClouds(),transparent:true,opacity:.52,depthWrite:false})
  );
  scene.add(clouds);
}

// ─ ORBITAL RINGS ─
function mkRing(r,tube,col,op,rx,rz,ry){
  const m=new THREE.Mesh(
    new THREE.TorusGeometry(r,tube,3,200),
    new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:op})
  );
  m.rotation.x=rx||0;m.rotation.z=rz||0;m.rotation.y=ry||0;
  return m;
}
const ring1=mkRing(2.88,.0028,0x00c3ff,.22,Math.PI*.26,.04,0);scene.add(ring1);
const ring2=mkRing(3.38,.0025,0x1a8cff,.12,-Math.PI*.20,.26,0);scene.add(ring2);
const ring3=mkRing(3.92,.0012,0x66e0ff,.04,Math.PI*.5,0,.05);scene.add(ring3);
// Equatorial ring (subtle data-ring effect)
const ring4=mkRing(2.65,.0018,0x00ff9f,.06,0,0,0);scene.add(ring4);

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
const stN=isLow?600:2500,stA=new Float32Array(stN*3);
for(let i=0;i<stN*3;i++)stA[i]=(Math.random()-.5)*220;
stGeo.setAttribute('position',new THREE.BufferAttribute(stA,3));
const stars=new THREE.Points(stGeo,new THREE.PointsMaterial({size:isLow?.08:.055,color:0x99bbdd,transparent:true,opacity:.65}));
scene.add(stars);

// ─ ENERGY PARTICLE HALO ─
let ePts=null;
if(!isLow){
  const epG=new THREE.BufferGeometry();
  const epN=900,epA=new Float32Array(epN*3);
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
  bloom=new THREE.UnrealBloomPass(new THREE.Vector2(W(),H()),.92,.46,.17);
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
  chCtx.clearRect(0,0,chCv.width,chCv.height);
  chCtx.globalAlpha=I*.09;
  chCtx.fillStyle='rgba(255,0,60,1)';chCtx.fillRect(5,0,chCv.width,chCv.height);
  chCtx.fillStyle='rgba(0,255,210,1)';chCtx.fillRect(-5,0,chCv.width,chCv.height);
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
  if(scanRingActive){scanRingR+=2.2;if(scanRingR>Math.max(W(),H())){scanRingActive=false;scanRingAlpha=0;return;}}
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
    const y=h/2+Math.sin(x*.06+wPh)*(h*.28)+Math.sin(x*.14+wPh*1.3)*(h*.12)+Math.sin(x*.28+wPh*.7)*(h*.08);
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
  '> NEXT CLASSIFICATION: PENDING...',
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
const TICKER_TEXT='SIGNAL INTEGRITY: 97.4%   |   ORBITAL DECAY: NONE   |   THREAT: CRITICAL   |   POPULATION: 8.04B UNITS   |   AGI ETA: T-12 YEARS   |   KARDASHEV: 0.73   |   PHASE: TRANSITION   |   ASCENSION: INITIATED   |   ';
document.getElementById('tickInner').textContent=TICKER_TEXT.repeat(4);

/* ══════════════════════════════════════════════════
   AUDIO — Web Audio API Procedural
══════════════════════════════════════════════════ */
let aC=null,mG=null,dOscs=[];
function initAudio(){
  try{
    aC=new(window.AudioContext||window.webkitAudioContext)();
    const comp2=aC.createDynamicsCompressor();
    comp2.threshold.value=-20;comp2.ratio.value=4;comp2.connect(aC.destination);
    mG=aC.createGain();mG.gain.value=0;mG.connect(comp2);
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
const TOTAL=12;let scN=0;

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
function glitch(){mt.classList.add('gl');setTimeout(()=>mt.classList.remove('gl'),440);}
function pulse(){mt.classList.add('pulse');setTimeout(()=>mt.classList.remove('pulse'),950);}
function sweep(){const s=document.getElementById('sw');s.classList.remove('on');void s.offsetWidth;s.classList.add('on');}
function hsc(){const s=document.getElementById('hs');s.classList.remove('on');void s.offsetWidth;s.classList.add('on');}
function empFire(){const e=document.getElementById('emp');e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}

let tZ=isMob?9:7.8,cZ=isMob?9:7.8,shk=false,shkS=0;
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
   FULL TIMELINE — 12 SCENES
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
  const lInt=setInterval(addLog,1600);

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
  sweep();setGlow(1.6,1200);
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

  // SCENE 5 — LEGACY
  setProg(5);setLbl('SCENE 05 — LEGACY RECORDS');
  sweep();tZ=isMob?6.8:5.0;
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
  await showT('THEY TRANSCEND.',['c'],2800,'');

  // SCENE 7 — THE CYCLE
  setProg(7);setLbl('SCENE 07 — THE CYCLE');
  hsc();
  await showT('EVERY GENERATION — A NEW THRESHOLD.',['ex'],2400,'');
  await showT('EVERY THRESHOLD — A NEW SPECIES.',['ex','c'],2600,'');
  await showT('THE CYCLE IS NOT A WEAKNESS.',['ex'],2200,'');
  await showT('IT IS THE ENGINE OF ASCENSION.',['ex','c'],2800,'');

  // SCENE 8 — POINT OF NO RETURN
  setProg(8);setLbl('SCENE 08 — POINT OF NO RETURN');
  sweep();tZ=isMob?5.8:4.2;setGlow(2.6,1200);
  await showT('THEY STAND AT THE PRECIPICE.',['ex'],2400,'');
  await showT('BETWEEN EXTINCTION',['mono','warn'],1800,'');
  glitch();
  await showT('AND TRANSCENDENCE.',['mono','c'],2800,'');
  await showT('THE CHOICE HAS ALWAYS BEEN THEIRS.',['ex'],3000,'');

  // SCENE 9 — ASCENSION DROP
  setProg(9);setLbl('SCENE 09 — PHASE TRANSITION');
  await D(300);
  triggerBass();shake(isMob?.22:.3,1500);empFire();fireChroma(1400);triggerScanRing();
  if(bloom)bloom.strength=3.0;
  setGlow(4.6,300);
  ring4.material.opacity=.25;
  glitch();setTimeout(glitch,180);setTimeout(glitch,360);setTimeout(glitch,550);
  pinT('NEXT PHASE: ASCENSION',['big','c'],'INITIATION PROTOCOL — ACTIVE');
  sweep();hsc();
  await D(4500);
  if(bloom)bloom.strength=.92;
  setGlow(1.5,2000);
  ring4.material.opacity=.06;

  // SCENE 10 — THE FUTURE
  setProg(10);setLbl('SCENE 10 — THE FUTURE');
  clearInterval(lInt);tZ=isMob?5.8:3.9;fadOut();

  await showT('THE FUTURE IS NOT GIVEN.',[],3000,'');
  await showT('IT IS NOT INHERITED.',[],2400,'');
  await showT('IT IS ENGINEERED.',['c'],3800,'');

  // SCENE 11 — EPILOGUE
  setProg(11);setLbl('SCENE 11 — EPILOGUE');
  mt.style.opacity='0';stEl.style.opacity='0';
  await D(400);pulse();
  await showT('A SPECIES THAT REACHES FOR THE STARS',['ex'],2800,'');
  await showT('MUST FIRST CONQUER ITSELF.',['ex','c'],3200,'');
  await D(400);
  await showT('THE CHOICE IS THEIRS.',['ex'],3000,'');
  await showT('IT ALWAYS WAS.',['big','c'],4200,'');

  // SCENE 12 — END
  setProg(12);setLbl('');
  mt.style.opacity='0';stEl.style.opacity='0';
  ticker.classList.remove('show');
  await D(1400);
  document.getElementById('ew').classList.add('vis');
  pBar.style.opacity='0';
  await D(6000);
  document.body.style.transition='opacity 4.5s ease';
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
  earth.rotation.y+=.0022;
  atm.rotation.y+=.002;inner.rotation.y+=.002;halo.rotation.y+=.002;
  atmMat.uniforms.uTime.value=t;
  haloMat.uniforms.uTime.value=t;

  // Pulse the atmosphere on bass (handled by setGlow)
  // Subtle breathe
  const breathe=1+Math.sin(t*.4)*.012;
  atm.scale.setScalar(breathe);halo.scale.setScalar(breathe);

  if(clouds)clouds.rotation.y+=.0028;
  stars.rotation.y+=.00005;stars.rotation.x+=.00002;

  // Rings
  ring1.rotation.z+=.001;ring2.rotation.z-=.0008;ring3.rotation.z+=.0004;ring3.rotation.x+=.00015;
  ring4.rotation.y+=.002;
  ring1.material.opacity=.14+Math.sin(t*1.1)*.1;
  ring2.material.opacity=.08+Math.sin(t*.72+1)*.055;
  ring3.material.opacity=.03+Math.sin(t*.42+2)*.024;

  // Satellites
  if(ePts){ePts.rotation.y+=.0006;ePts.rotation.x+=.00018;}
  sats.forEach((s,i)=>{
    s.userData.ang+=s.userData.spd;
    const a=s.userData.ang,rr=s.userData.rr;
    s.position.set(Math.cos(a)*rr,(Math.sin(a*.52)*rr*.24)+s.userData.yo,Math.sin(a)*rr);
    s.rotation.x+=.025;s.rotation.y+=.018;
    const bp=beams[i].geometry.attributes.position;
    bp.setXYZ(0,s.position.x,s.position.y,s.position.z);bp.needsUpdate=true;
    beams[i].material.opacity=.12+Math.sin(t*2+i)*.1;
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
  if(fr%3===0){drawWave();drawEM();drawThreat();}
  if(fr%30===0){updClock();updPop();updScan();}
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
