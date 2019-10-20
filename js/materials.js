// Textures
// Backgrounds
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

// Prototype materials
// - Sketch materials
// each sketch curve / point has its own material
// for setting different colors of various roles and selections

// - Skeleton rib materials
// each rib curve / point has its own material
// for setting different colors of selections

// accessory marker
var markerMaterial = new THREE.SpriteMaterial({map:new THREE.TextureLoader().load('resource/marker.png')});

// - Sleeve ring
const sleeveRingMaterial = new THREE.LineBasicMaterial({color:0x000000});

// - Rod and fork skeletons
const rodHelperMaterial = new THREE.LineBasicMaterial({color:/* 0x8c4b00 */0xff5500});
const forkHelperMaterial = new THREE.LineBasicMaterial({color:/* 0x8c6a */0x00eeaa});
const junctionHelperMaterials = {
    Rod:rodHelperMaterial,
    Fork:forkHelperMaterial,
};

// - Rod and fork envelopes
const rodFrustumMaterial = new THREE.MeshStandardMaterial({color:/* 0xa88300 */0xff5500, roughness:1, metalness:0,side:THREE.DoubleSide,transparent:true,opacity:0.6});
const forkFrustumMaterial = new THREE.MeshStandardMaterial({color:/* 0x1b6b36 */0x00eeaa, roughness:1, metalness:0,side:THREE.DoubleSide,transparent:true,opacity:0.6});

// Mechanism materials
// - Colored materials to distinguish each part
//  - axle
const axleMaterial = new THREE.MeshStandardMaterial({color:0x404040, /* emissive: 0x464646, */ roughness:1, metalness:0})

//  - bearings share the same material
const bearingMaterial = new THREE.MeshStandardMaterial({color:0xF5F5F5, roughness:1, metalness:0});

//  - sleeve
const sleeveColoredMaterial = new THREE.MeshStandardMaterial({color:0x2166ce, roughness:1, metalness:0.3});

//  - rib blade
const bladeColoredMaterial = new THREE.MeshStandardMaterial({color:0x484848, emissive: 0x464646, roughness:1, metalness:0.3});

//  - accessory
const accessoryColoredMaterial = new THREE.MeshStandardMaterial({color:0x64f12, roughness:1, metalness:0});

//  - rod
const rodColoredMaterial = new THREE.MeshStandardMaterial({color:0xff5500, roughness:1, metalness:0.3});

//  - fork
const forkColoredMaterial = new THREE.MeshStandardMaterial({color:/* 0x008c6a */0x008855, roughness:1, metalness:0.3});

// - Uniform materials for rendering effects
//  - gray
const grayMaterial = new THREE.MeshStandardMaterial({color:0x484848, emissive: 0x464646, roughness:1, metalness:0});
grayMaterial.name = 'gray';

//  - metal
var metalMaterial = new THREE.MeshStandardMaterial({color:0xffffff, roughness:0, metalness:1,envMap:skyTexture});
metalMaterial.name = 'metal';

// - Colored materials for interactions
//  - selected unit: yellow colored
const selectedMaterial = new THREE.MeshStandardMaterial({color:0xffff00, roughness:1, metalness:0});

//  - morphing control units: translation: red; rotation: green, scale: blue
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

// highlighted unit when junction solving failed
const highlightUnitMaterial = new THREE.MeshStandardMaterial({color:0xff0000, roughness:1, metalness:0});
