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
    reference: 0x00ff00,
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
            return new THREE.CylinderGeometry(1,1,0.1,16);
    }
}

// normal plane
var nplane = new THREE.Mesh(new THREE.PlaneBufferGeometry(),normalPlaneMaterial);
nplane.layers.set(5);

// stl exporter
var exporter = new THREE.STLExporter();

let morphOpMap = {'bias':'setMorphTranslation','rotation':'setMorphRotation','size':'setMorphScale'};

// for downloading
function save( blob, filename ) {

    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();

}

function saveString( text, filename ) {

    save( new Blob( [ text ], { type: 'text/plain' } ), filename );

}
