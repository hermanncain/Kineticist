/**
 * line material drawing mode
 * gl: native webgl line
 * NOTE: due to some webgl history issue, line width configuration cannot work.
 *       Its collider cannot response to transformations, either.
 * 
 * DEFAULT
 * tube: use tube geometries to draw lines.
 * NOTE: hight consumption, and the intersecting method has no extending range
 *       so raycast needs more accurate mouse click.
 */
const lineModes = {gl:'gl', tube:'tube'};
// var lineMode = lineModes.tube;
var lineMode = 'tube';

// line widths
const lineWidths = {sketch:2, axis:3};

/**
 * line colors
 */
const lineColors = {
    selected:0xffaa00, 
    axis:0xff0000, 
    sketch:0x0000ff,
    contour:0xC0C0C0,
};
const timeOrderColors = {
    0:0xC0C0C0,
    1:0xFF9797,
    2:0xD9B300,
    3:0xBBFFBB,
    4:0x6FB7B7
};

// Accessory geometries
// more shapes to be added
var leafGeometry = null;
(function () {
    let shape = new THREE.Shape();
    shape.ellipse(0,0,0.5,0.5);
    let path = new THREE.CatmullRomCurve3(
        [
            new THREE.Vector3(1,-2,0),
            new THREE.Vector3(0.5,-1.4,0),
            new THREE.Vector3(0,0,0),
            new THREE.Vector3(0.5,1.4,0),
            new THREE.Vector3(1,2,0),
        ]
    );
    let sweepSettings = {
        curveSegments:8,
        steps:8,
        depth: 1,
        sweepPath:path,
        bevelEnabled: false,
        scales:[
            new THREE.Vector2(0,0),
            new THREE.Vector2(0.3,0.1),
            new THREE.Vector2(0.6,0.15),
            new THREE.Vector2(0.85,0.2),
            new THREE.Vector2(1,0.25),
            new THREE.Vector2(0.85,0.2),
            new THREE.Vector2(0.6,0.15),
            new THREE.Vector2(0.3,0.1),
            new THREE.Vector2(0,0),
        ],
        twists:[0,0,0,0,0,0,0,0,0]
    };
    leafGeometry = new SweepBufferGeometry(shape,sweepSettings);
}) ();
var bowlGeometry = null;
(function () {
    let bowlCurve = new THREE.Shape();
    bowlCurve.ellipse(0,0.5,1,0.5,-Math.PI/2,0);
    bowlCurve.lineTo(0.9,0.5);
    bowlCurve.ellipse(-0.9,0,0.9,0.4,0,-Math.PI/2,true);
    bowlGeometry = new THREE.LatheGeometry( bowlCurve.extractPoints(16).shape,16 );
}) ();
var ringGeometry = null;
(function () {
    let contour = new THREE.Shape();
    contour.arc(0,0,1);
    let hole = new THREE.Shape();
    hole.arc(0,0,0.6);
    contour.holes.push(hole);
    let extrudeSettings = {
        steps:1,
        depth:0.1,
        bevelEnabled:false
    }
    ringGeometry = new THREE.ExtrudeGeometry(contour,extrudeSettings);
    ringGeometry.translate(0,0,-0.05);
    ringGeometry.rotateX(Math.PI/2);
}) ();

function buildAccessoryGeometry(type){
    switch (parseInt(type)) {
        // plate
        case 0:
            return new THREE.CylinderGeometry(1,1,0.1,16);
        // ball
        case 1:
            return new THREE.SphereGeometry(1,16,16);
        // bowl
        case 2:
            return bowlGeometry.clone();
        // ring
        case 3:
            return ringGeometry.clone();
        // leaf
        case 4:
            return leafGeometry.clone();
        // TODO
        default:
        break;
    }
}

// Background textures
var cubemapLoader = new THREE.CubeTextureLoader();
function loadCubeMap(name) {
    cubemapLoader.setPath( 'cubemaps/'+name+'/' );
    var texture = cubemapLoader.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );
    texture.name = name;
    return texture;
}
const pureColor = new THREE.Color(0xffffff);
pureColor.name = 'none';
const bridgeTexture = loadCubeMap('scene1');
const skyTexture = loadCubeMap('scene2');
const backgrounds = {
    'none':pureColor,
    'scene1':bridgeTexture,
    'scene2':skyTexture
};

// Materials

// Sketch materials
// each sketch curve / point has its own material
// for setting different colors of various roles and selections

// Skeleton rib materials
// each rib curve / point has its own material
// for setting different colors of selections

// Prototype materials
// sleeve ring material
// all sleeve rings in sculpture prorotypes share the same material
const sleeveRingMaterial = new THREE.MeshBasicMaterial({color:0x000000});

// junction envelope materials
// all rods/forks in sculpture prorotypes share the same rod/fork material
const rodFrustumMaterial = new THREE.MeshStandardMaterial({color:0xa88300, roughness:1, metalness:0,side:THREE.DoubleSide,transparent:true,opacity:0.6});
const forkFrustumMaterial = new THREE.MeshStandardMaterial({color:0x1b6b36, roughness:1, metalness:0,side:THREE.DoubleSide,transparent:true,opacity:0.6});

// junction helper materials
// all rod/fork skeletons in sculpture prorotypes share the same rod/fork helper material
const rodHelperMaterial = new THREE.LineBasicMaterial({color:0x8c4b00});
const forkHelperMaterial = new THREE.LineBasicMaterial({color:0x8c6a});
const junctionHelperMaterials = {
    Rod:rodHelperMaterial,
    Fork:forkHelperMaterial,
};

// highlight unit material when junction solving failed
const highlightUnitMaterial = new THREE.MeshStandardMaterial({color:0xff0000, roughness:1, metalness:0});

// Mechanism materials

// 1. bearings share the same material below and keep constant
const bearingMaterial = new THREE.MeshStandardMaterial({color:0xF5F5F5, roughness:1, metalness:0});

// 2. other mesh materials
//   2.1 colored materials to distinguish meshes except bearings
const sleeveColoredMaterial = new THREE.MeshStandardMaterial({color:0x2166ce, roughness:1, metalness:0.3});
const bladeColoredMaterial = new THREE.MeshStandardMaterial({color:0x96d61, roughness:1, metalness:0.3});
const accessoryColoredMaterial = new THREE.MeshStandardMaterial({color:0x64f12, roughness:1, metalness:0});
const rodColoredMaterial = new THREE.MeshStandardMaterial({color:0x8c4b00, roughness:1, metalness:0.3});
const forkColoredMaterial = new THREE.MeshStandardMaterial({color:0x8c6a, roughness:1, metalness:0.3});

//   2.2 gray material
const grayMaterial = new THREE.MeshStandardMaterial({color:0x484848, emissive: 0x464646, roughness:1, metalness:0});
grayMaterial.name = 'gray';

//   2.3 metal material
var metalMaterial = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0, metalness:1,envMap:skyTexture});
metalMaterial.name = 'metal';

//   2.4 selected material
const selectedMaterial = new THREE.MeshStandardMaterial({color:0xffff00, roughness:1, metalness:0});

//   2.5 labeled material
var labeledMaterial = selectedMaterial.clone();
function getLabeledMaterial (label) {
    switch (label) {
        case 'T':
            labeledMaterial.color.setHex(0x880000);
        break;
        case 'S':
            labeledMaterial.color.setHex(0x000088);
        break;
        case 'R':
            labeledMaterial.color.setHex(0x008800);
        break;
    }
}

// function switchMechanismMaterial (type) {
//     switch (type) {
//         case 'gray':
//             mechanismMaterial.color.setHex(0x484848);
//             mechanismMaterial.roughness = 1;
//             mechanismMaterial.metalness = 0;
//             mechanismMaterial.needsUpdate = true;
//         break;
//         case 'metal':
//             mechanismMaterial.color.setHex(0xffffff);
//             mechanismMaterial.roughness = 0;
//             mechanismMaterial.metalness = 1;
//             mechanismMaterial.needsUpdate = true;
//         break;
//     }
// }
// const selectedMechanismMaterial = new THREE.MeshStandardMaterial({color:0xffff00, emissive: 0x464646, roughness:1, metalness:0});
