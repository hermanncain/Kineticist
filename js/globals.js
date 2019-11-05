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
    // updateCollider: function () {
    //     // this.colliders.children.map(function(obj){
    //     //     obj.geometry.dispose();
    //     // })
    //     // this.colliders.children = [];
        
    //     let zMax=-100,zMin=100,rMax=0;
    //     this.skeleton.children.map(function(rib){
    //         let p = rib.end.position;
    //         zMax = p.z > zMax ? p.z : zMax;
    //         zMin = p.z < zMin ? p.z : zMin;
    //         let rInner = rib.end.position.x**2+rib.end.position.y**2;
    //         rMax = rInner > rMax**2 ? Math.sqrt(rInner) : rMax;
    //     });
    //     // let h = zMax-zMin;

    //     // collider used in collision with axis
    //     // let outline = new THREE.Shape();
    //     // outline.arc(0,0,rMax);
    //     // let hole = new THREE.Shape();
    //     // hole.arc(0,0,this.userData.sleeve.rOut*0.2);
    //     // outline.holes.push(hole);
    //     // let extrudeSettings = {
    //     //     steps:1,
    //     //     depth:h,
    //     //     bevelEnabled:false
    //     // }
    //     // let collider1 = new THREE.Mesh(new THREE.ExtrudeGeometry(outline,extrudeSettings));
    //     // this.colliders.add(collider1);
    //     // collider1.position.set(0,0,zMin);
    //     // // invisible for camera
    //     // collider1.layers.set(7);

    //     // collider used in collision with other unit skeletons
    //     this.buildEnvelope(rMax,zMax,zMin);
    //     // h = h< 1e-4 ? 0.01:h;
    //     // let collider2 = new THREE.Mesh(new THREE.CylinderGeometry(rMax,rMax,h,12,1));
    //     // this.colliders.add(collider2);
    //     // collider2.position.set(0,0,(zMax+zMin)/2);
    //     // collider2.rotation.set(Math.PI/2,0,0)
    //     // // invisible for camera
    //     // collider2.layers.set(7);
    // },

        // buildEnvelope: function (radius,top,bottom) {
        
    //     if (radius<1e-4) {
    //         console.log('empty')
    //         this.isEmpty = true;
    //         return;
    //     }

    //     // clear memory
    //     this.colliders.children.map(function(obj){
    //         obj.geometry.dispose();
    //     })
    //     this.colliders.children = [];

    //     // build
    //     let h = top - bottom < 1e-4 ? 0.01 : top - bottom;
    //     let envelope = new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,h,12,1));
    //     this.colliders.add(envelope);
    //     envelope.position.set(0,0,(top+bottom)/2);
    //     envelope.rotation.set(Math.PI/2,0,0);

    //     // invisible for camera
    //     envelope.layers.set(7);

    // },

        // setUpload: function (obj) {
    //     this.upload.children = [];
    //     this.upload.add(obj);
    // },

        // Advanced visual point operations
    // resetVPs: function () {
    //     for (p of this.vps.children) {
    //         if (p.metaPosition) {
    //             p.position.copy(p.metaPosition);
    //         } else {
    //             p.metaPosition = p.position.clone();
    //         }
    //     }
    // },

    // scaleRadius: function (s) {
    //     this.resetVPs();
    //     for (p of this.vps.children) {
    //         p.position.set(p.position.x*s,p.position.y*s,p.position.z);
    //     }
    //     // this.generateShapes();
    // },

    // bias: function(dir,dist) {
    //     let t = dir/180*Math.PI;
    //     for (let p of this.vps.children) {
    //         p.position.set(p.position.x+dist*Math.cos(t), p.position.y+dist*Math.sin(t), p.position.z);
    //     }
    // },

    // radicalRotate: function(dir, t) {
    //     let a = dir/180*Math.PI;
    //     let axis = new THREE.Vector3(Math.cos(a),Math.sin(a),0);
    //     this.vps.rotateOnAxis(axis,t/180*Math.PI);
    //     this.vps.updateMatrixWorld();
    // },

    // this will change unit's rotation direction in motion
    // CAUTION: may make the mechanism unattainable
    // radicalTort: function (dir, t) {
    //     let a = dir/180*Math.PI;
    //     let axis = new THREE.Vector3(Math.cos(a),Math.sin(a),0);
    //     this.rotateOnAxis(axis,t/180*Math.PI);
    // },

        // 4. shape
    // shape group for parts
    // this.shape = new THREE.Group();
    // this.shape.name = 'shape';
    // this.add(this.shape);

    // 4.1 sleeve
    // this.sleeve = new THREE.Group();
    // this.sleeve.name = 'unit-sleeve';
    // this.shape.add(this.sleeve);

    // 4.2 blades
    // this.blades = new THREE.Group();
    // this.blades.name = 'blades';
    // this.shape.add(this.blades);

    // // 4.3 accessories
    // this.accessories = new THREE.Group();
    // this.accessories.name = 'accessories';
    // this.shape.add(this.accessories);

    // 4.4 transmissions
    // this.transmissions = new THREE.Group();
    // this.transmissions.name = 'transmissions';
    // this.shape.add(this.transmissions);

    // 4.5 bearing
    // this.bearing = new THREE.Group();
    // this.bearing.name = 'bearing';
    // this.shape.add(this.bearing);

    // 4.6 upload
    // this.upload = new THREE.Group();
    // this.upload.name = 'upload';
    // this.shape.add(this.upload);

    // 5. colliders
    // this.colliders = new THREE.Group();
    // this.add(this.colliders);

        // this.pointMaterial = new THREE.PointsMaterial( { color: 0x0000ff } );
    // this.tempPointMaterial = new THREE.PointsMaterial( { color: 0xffff00 } );

        // inner transform
    // resetInnerTransform: function () {
    //     for (let rib of this.skeleton.children) {
    //         rib.rotation.set(0,0,0);
    //         rib.scale.set(1,1,1);
    //     }
    // },

    //     // this.currentMaterial = new THREE.MeshBasicMaterial();


    //         parseTransmissionParameters: function () {
    //     let p = this.userData.transmissions;
    //     let params = {
    //         // cone parameters
    //         r:p.r,h:p.h,
    //         // rod
    //         pstart:new THREE.Vector3().fromArray(p.pstart),pdir:new THREE.Vector3().fromArray(p.pdir),
    //         rodLength:p.rodLength,
    //         // fork
    //         rstart:new THREE.Vector3().fromArray(p.rstart),rdir:new THREE.Vector3().fromArray(p.rdir),
    //         forkLength:p.forkLength,
    //         forkMinLength:p.forkMinLength,
    //         pusherStartWorld: new THREE.Vector3().fromArray(p.pusherStartWorld),
    //         receiverStartWorld: new THREE.Vector3().fromArray(p.receiverStartWorld),
    //         point: new THREE.Vector3().fromArray(p.point),
    //     };
    //     return params;
    // },

    // adjustJoint: function(mesh,params) {
    //     let v1 = params.point.clone().sub(params.pusherStartWorld);
    //     let v2 = params.point.clone().sub(params.receiverStartWorld);
    //     let crossDirWorld = v1.clone().cross(v2).normalize();
    //     let crossDirLocal = mesh.worldToLocal(crossDirWorld.clone().sub(v2)).normalize();
    //     let receiverNormalWorld = mesh.localToWorld(new THREE.Vector3(0,0,1));
    //     let yAxis = mesh.localToWorld(new THREE.Vector3(0,1,0));
    //     let angle = crossDirLocal.angleTo(receiverNormalWorld);
    //     let dir = crossDirLocal.clone().cross(receiverNormalWorld).multiply(yAxis);
    //     if (dir <0) {
    //         mesh.rotateY(-angle);
    //     } else {
    //         mesh.rotateY(angle);
    //     }
    // },

    // buildRod1: function () {
        
    //     let params = this.parseTransmissionParameters();

    //     // build geometry
    //     let geo = new THREE.CylinderBufferGeometry(0.1,0.1,params.rodLength);
    //     geo.translate(0,params.rodLength/2,0);
    //     let mesh = new THREE.Mesh(geo,this.currentMaterial);
    //     mesh.layers.set(4);
    //     mesh.name = 'transmission';

    //     // rod skeleton
    //     let rodSkeleton = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),params.rodLength,0xce21c7);
    //     rodSkeleton.line.layers.set(3);
    //     rodSkeleton.cone.layers.set(3);

    //     // rod skeleton motion envelope
    //     this.transmissions.add(this.buildTransmissionEnvelope('rod',params.r,params.h));

    //     // update matrix
    //     mesh.add(rodSkeleton);
    //     mesh.position.copy(params.pstart);
    //     mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), params.pdir.clone().normalize());
    //     mesh.updateMatrixWorld();
    //     let base = new THREE.Mesh(new THREE.SphereBufferGeometry(0.2),this.currentMaterial);
    //     base.layers.set(4);
    //     base.name = 'transmission';
    //     mesh.add(base);
    //     this.adjustJoint(mesh,params);
    //     this.transmissions.add(mesh);

    // },

    // buildFork1: function () {

    //     let params = this.parseTransmissionParameters();
        
    //     // build geometry
    //     let barGeo = new THREE.CylinderGeometry(0.1,0.1,params.forkMinLength);
    //     barGeo.translate(0,params.forkMinLength/2,0);
    //     let baseGeo = new THREE.BoxGeometry(0.2,0.2,0.6);
    //     baseGeo.translate(0,params.forkMinLength-0.1,0);
    //     barGeo.merge(baseGeo);
    //     let geo1 = new THREE.CylinderGeometry(0.1,0.1,params.forkLength-params.forkMinLength);
    //     geo1.translate(0,(params.forkLength+params.forkMinLength)/2,0.2);
    //     let geo2 = new THREE.CylinderGeometry(0.1,0.1,params.forkLength-params.forkMinLength);
    //     geo2.translate(0,(params.forkLength+params.forkMinLength)/2,-0.2);
    //     barGeo.merge(geo1);
    //     barGeo.merge(geo2);
    //     let bufferGeo = new THREE.BufferGeometry();
    //     bufferGeo.fromGeometry(barGeo);
    //     let mesh = new THREE.Mesh(bufferGeo,this.currentMaterial);
    //     mesh.layers.set(4);
    //     mesh.name = 'transmission';

    //     // fork skeleton
    //     let forkSkeleton = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),params.rodLength,0xce21c7);
    //     forkSkeleton.line.layers.set(3);
    //     forkSkeleton.cone.layers.set(3);
    //     mesh.add(forkSkeleton);

    //     // fork skeleton motion envelope
    //     this.transmissions.add(this.buildTransmissionEnvelope('fork',params.r,params.h));

    //     // update fork matrix
    //     mesh.position.copy(params.rstart);
    //     mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), params.rdir.clone().normalize());
    //     mesh.updateMatrixWorld();
    //     this.adjustJoint(mesh,params);
    //     this.transmissions.add(mesh);
        
    // },

    // buildTransmissionEnvelope: function (type,r,h) {
    //     let frustumH = h-h/r;
    //     let geo = new THREE.CylinderBufferGeometry(this.userData.sleeve.rOut, r, frustumH,64,1,true);
    //     let frustum = new THREE.Mesh(geo,new THREE.MeshPhongMaterial({shininess:0,color:0x26876a,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
    //     frustum.name = 'motion envelope';
    //     frustum.visible = false;
    //     if (type == 'rod') {
    //         frustum.rotateX(-Math.PI/2);
    //     } else if (type == 'fork') {
    //         frustum.rotateX(Math.PI/2);
    //     }
    //     frustum.translateY(-frustumH/2);
    //     return frustum;
    // },

// layout2D: function (positions, directions,p) {

//     let t = p.torsion;
//     let b = p.bias;
//     let rr = p.RadicalRotation;
//     let rt = p.RadicalTorsion;

//     // get the basis plane of the curve
//     let planeNormal = new THREE.Vector3().crossVectors(directions[0],directions[1]);

//     for (let i=0;i<positions.length;i++) {

//         let u = this.unit.clone();

//         // radical rotation
//         if (rr.world) {

//         } else {
//             u.radicalRotate(rr.axis,rr.angle);
//         }
        
//         // bias
//         if (b.world) {

//         } else {
//             u.bias(b.axis,b.distance);
//         }
//         // radical scale
//         u.scaleRadius(p.size);

//         u.generateShapes();

//         // align
//         // lookAt method will make local +x near to world +x
//         u.lookAt(directions[i]);
//         u.position.copy(positions[i]);
//         u.updateMatrixWorld();

//         let y = u.localToWorld(new THREE.Vector3(0,1,0)).sub(positions[i]);
//         let yCrossPN = new THREE.Vector3().crossVectors(y,planeNormal).normalize();
//         let angle = y.angleTo(planeNormal);
//         if (yCrossPN.dot(directions[i])>=0) {
//             u.rotateZ(angle);
//         } else {
//             u.rotateZ(-angle);
//         }

//         // torsion
//         u.rotateZ(i*t/180*Math.PI);
//         // scale
//         u.scale.set(p.scale,p.scale,p.scale);

//         // radical torsion
//         if (rt.world) {

//         } else {
//             u.radicalTort(rt.axis,rt.angle);
//         }

//         // store rotation
//         u.metaRotation = u.rotation.clone();

//         this.units.add(u);
//     }

// },


    // generateEnvelope: function () {
    //     this.clearEnvelope();
    //     let geo = new THREE.BufferGeometry();
    //     let vertices = [];
    //     let n = this.units.children.length;
    //     let m = this.units.children[0].vps.children.length;
    //     if (this.axis.isClosed) {
    //         for (let i=0;i<n;i++) {
    //             let u1 = this.units.children[i];
    //             let u2 = this.units.children[(i+1)%n];
    //             for (let j=0;j<m;j++) {
    //                 let p1 = u1.vps.localToWorld(u1.vps.children[j].position.clone());
    //                 let p2 = u2.vps.localToWorld(u2.vps.children[j].position.clone());
    //                 let p3 = u1.vps.localToWorld(u1.vps.children[(j+1)%m].position.clone());
    //                 vertices.push(p1.x);
    //                 vertices.push(p1.y);
    //                 vertices.push(p1.z);
    //                 vertices.push(p2.x);
    //                 vertices.push(p2.y);
    //                 vertices.push(p2.z);
    //                 vertices.push(p3.x);
    //                 vertices.push(p3.y);
    //                 vertices.push(p3.z);
    //             }
    //         }
    //     } else {
    //         for (let i=0;i<n;i++) {
    //             let u1 = this.units.children[i];
    //             let u2 = null;
    //             if (i==n-1) {
    //                 u2 = this.units.children[i-1];
    //                 for (let j=m;j>0;j--) {
    //                     let p1 = u1.vps.localToWorld(u1.vps.children[j%m].position.clone());
    //                     let p2 = u2.vps.localToWorld(u2.vps.children[j%m].position.clone());
    //                     let p3 = u1.vps.localToWorld(u1.vps.children[j-1].position.clone());
    //                     vertices.push(p1.x);
    //                     vertices.push(p1.y);
    //                     vertices.push(p1.z);
    //                     vertices.push(p2.x);
    //                     vertices.push(p2.y);
    //                     vertices.push(p2.z);
    //                     vertices.push(p3.x);
    //                     vertices.push(p3.y);
    //                     vertices.push(p3.z);
    //                 }
    //             } else {
    //                 u2 = this.units.children[i+1];
    //                 for (let j=0;j<m;j++) {
    //                     let p1 = u1.vps.localToWorld(u1.vps.children[j].position.clone());
    //                     let p2 = u2.vps.localToWorld(u2.vps.children[j].position.clone());
    //                     let p3 = u1.vps.localToWorld(u1.vps.children[(j+1)%m].position.clone());
    //                     vertices.push(p1.x);
    //                     vertices.push(p1.y);
    //                     vertices.push(p1.z);
    //                     vertices.push(p2.x);
    //                     vertices.push(p2.y);
    //                     vertices.push(p2.z);
    //                     vertices.push(p3.x);
    //                     vertices.push(p3.y);
    //                     vertices.push(p3.z);
    //                 }
    //             }
    //         }
    //     }
    //     geo.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
    //     let envGeo = new THREE.WireframeGeometry( geo );
    //     var env = new THREE.LineSegments( envGeo );
    //     env.material.depthTest = false;
    //     env.material.opacity = 0.25;
    //     env.material.transparent = true;
    //     env.material.color.setHex(0x0000ff);
    //     env.name = 'envelope';
    //     env.layers.set(5);
    //     this.add(env);
    //     this.generatedEnvelope = env;

    //     // test points
    //     // let pts = new THREE.Points(geo.clone(),new THREE.PointsMaterial({color:0x0000ff,size:0.8}));
    //     // this.add(pts);
    // },

    // generateEnvelope: function () {
    //     this.clearEnvelope();
    //     let geo = new THREE.BufferGeometry();
    //     let vertices = [];
    //     let n = this.units.children.length;
    //     let m = this.units.children[0].skeleton.children.length;
    //     console.log(n,m)
    //     if (this.axis.curve.closed) {
    //         for (let i=0;i<n;i++) {
    //             let u1 = this.units.children[i];
    //             let u2 = this.units.children[(i+1)%n];
    //             for (let j=0;j<m;j++) {
    //                 let p1 = u1.localToWorld(u1.skeleton.children[j].getEndPosition().clone());
    //                 let p2 = u2.localToWorld(u2.skeleton.children[j].getEndPosition().clone());
    //                 let p3 = u1.localToWorld(u1.skeleton.children[(j+1)%m].getEndPosition().clone());
    //                 vertices.push(p1.x);
    //                 vertices.push(p1.y);
    //                 vertices.push(p1.z);
    //                 vertices.push(p2.x);
    //                 vertices.push(p2.y);
    //                 vertices.push(p2.z);
    //                 vertices.push(p3.x);
    //                 vertices.push(p3.y);
    //                 vertices.push(p3.z);
    //             }
    //         }
    //     } else {
    //         for (let i=0;i<n;i++) {
    //             let u1 = this.units.children[i];
    //             let u2 = null;
    //             if (i==n-1) {
    //                 u2 = this.units.children[i-1];
    //                 for (let j=m;j>0;j--) {
    //                     let p1 = u1.localToWorld(u1.skeleton.children[j%m].getEndPosition().clone());
    //                     let p2 = u2.localToWorld(u2.skeleton.children[j%m].getEndPosition().clone());
    //                     let p3 = u1.localToWorld(u1.skeleton.children[j-1].getEndPosition().clone());
    //                     vertices.push(p1.x);
    //                     vertices.push(p1.y);
    //                     vertices.push(p1.z);
    //                     vertices.push(p2.x);
    //                     vertices.push(p2.y);
    //                     vertices.push(p2.z);
    //                     vertices.push(p3.x);
    //                     vertices.push(p3.y);
    //                     vertices.push(p3.z);
    //                 }
    //             } else {
    //                 u2 = this.units.children[i+1];
    //                 for (let j=0;j<m;j++) {
    //                     let p1 = u1.localToWorld(u1.skeleton.children[j].getEndPosition().clone());
    //                     let p2 = u2.localToWorld(u2.skeleton.children[j].getEndPosition().clone());
    //                     let p3 = u1.localToWorld(u1.skeleton.children[(j+1)%m].getEndPosition().clone());
    //                     vertices.push(p1.x);
    //                     vertices.push(p1.y);
    //                     vertices.push(p1.z);
    //                     vertices.push(p2.x);
    //                     vertices.push(p2.y);
    //                     vertices.push(p2.z);
    //                     vertices.push(p3.x);
    //                     vertices.push(p3.y);
    //                     vertices.push(p3.z);
    //                 }
    //             }
    //         }
    //     }
    //     geo.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(vertices), 3 ) );
    //     let envGeo = new THREE.WireframeGeometry( geo );
    //     var env = new THREE.LineSegments( envGeo );
    //     env.material.depthTest = false;
    //     env.material.opacity = 0.25;
    //     env.material.transparent = true;
    //     env.material.color.setHex(0x0000ff);
    //     env.name = 'envelope';
    //     env.layers.set(5);
    //     this.envelope.add(env);
    // },

        // updateLayout: function (p) {
    //     let n = this.units.children.length;
    //     let sizes = [], torsions = [];
    //     for (var i=0;i<n;i++) {
    //         for (let pt of p.sizes) {
    //             if (pt.x>=i) {
    //                 sizes.push(pt.y);
    //                 break;
    //             }
    //         }
    //         for (let pt of p.torsions) {
    //             if (pt.x>=i) {
    //                 torsions.push(pt.y);
    //                 break;
    //             }
    //         }
    //     }

    //     for (let i=0;i<n;i++) {
    //         let u = this.units.children[i];
    //         u.skeleton.scale.set(sizes[i],sizes[i],1);
    //         u.skeleton.rotation.z = torsions[i];
    //         u.skeleton.updateMatrix();
    //         u.generateShape();
    //     }
        
    // },

        // layout: function (params) {
    //     let positions = this.axis.samplingPoints;
    //     let ff = this.axis.ff;
    //     for (let i=0;i<positions.length;i++) {
    //         let u = this.unit.clone();
    //         u.idx = i;
    //         // align to frame
    //         let m = new THREE.Matrix4().makeBasis(ff.normals[i],ff.binormals[i],ff.tangents[i]).multiplyScalar(params.scale).setPosition(positions[i]);
    //         u.applyMatrix(m);
    //         u.updatePointSize();
    //         if (params) {
    //             u.rotateZ(params.torsion/180*Math.PI*i);
    //         }
    //         // store rotation
    //         u.metaRotation = u.rotation.clone();
    //         this.units.add(u);
    //         // important
    //         u.updateMatrixWorld();
    //     }
    // },

    // layoutRef: function (params) {
    //     let positions = this.axis.samplingPoints;
    //     // layout only with respect to the 1st sketch
    //     let rf = this.axis.getReferencedFrames(this.sketches[0],params.n);
    //     for (let i=0;i<positions.length;i++) {
    //         if (!rf.normals[i]) continue;
    //         let u = this.unit.clone();
    //         u.idx = i;
    //         // align
    //         let m = new THREE.Matrix4().makeBasis(rf.normals[i],rf.binormals[i],rf.tangents[i]).multiplyScalar(params.scale).setPosition(positions[i]);
    //         u.applyMatrix(m);
    //         u.updatePointSize();
    //         // store rotation
    //         u.metaRotation = u.rotation.clone();
    //         this.units.add(u);
    //     }
    // },

        // computeJointTrajectory: function (rTop, r,h,u1,u2) {
    //     // for test
    //     let removeCone = true;
    //     // pusher/receiver cone
    //     let geo = new THREE.ConeGeometry(r,h,64,1,true);
    //     let pusherCone = new THREE.Mesh(geo,new THREE.MeshPhongMaterial({shininess:0,color:0x26876a,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
    //     let receiverCone = pusherCone.clone();
    //     pusherCone.rotateX(-Math.PI/2);
    //     receiverCone.rotateX(Math.PI/2);
    //     dx = h*(r-2)/2/r;
    //     pusherCone.translateY(-dx);
    //     receiverCone.translateY(-dx);
    //     u1.transmissions.add(pusherCone);
    //     pusherCone.updateMatrixWorld();
    //     u2.transmissions.add(receiverCone);
    //     receiverCone.updateMatrixWorld();

    //     // check cones intersection with axis segment between u1 and u2
    //     let i1 = this.units.children.indexOf(u1)/this.units.children.length;
    //     let i2 = this.units.children.indexOf(u2)/this.units.children.length;
    //     let j1 = Math.floor(this.axis.densePoints.length*i1);
    //     let j2 = Math.floor(this.axis.densePoints.length*i2);
    //     for (let i=j1;i<j2-1;i++) {
    //         let start = this.axis.localToWorld(this.axis.densePoints[i]);
    //         let end = this.axis.localToWorld(this.axis.densePoints[i+1]);
    //         let far = end.distanceTo(start);
    //         let dir = new THREE.Vector3().subVectors(end,start).normalize();
    //         let ray = new THREE.Raycaster(start,dir,far/r,far);
    //         let istAxis = ray.intersectObjects([pusherCone,receiverCone]);
    //         if (istAxis.length>=1) {
    //             // console.log('intersect with axis',istAxis.length);
    //             if (removeCone) {
    //                 u1.transmissions.remove(pusherCone);
    //                 u2.transmissions.remove(receiverCone);
    //             }
    //             return 'intersect with axis';
    //         }
    //     }
    //     // check intersection between cones
    //     // ray
    //     let far = Math.sqrt(r**2+h**2);
    //     let near = far/r;
    //     // pusher's cone top
    //     let originWorld = pusherCone.localToWorld(pusherCone.geometry.vertices[0].clone());
    //     let originLocal = u1.worldToLocal(originWorld.clone());
    //     // receiver's cone top
    //     let rOriginWorld = receiverCone.localToWorld(receiverCone.geometry.vertices[0].clone());
    //     let rOriginLocal = u2.worldToLocal(rOriginWorld.clone());
    //     let ends = [], dirs = [];
    //     let points = [];
    //     let pmin=1000,rmin=1000,pmax=0,rmax=0,point = new THREE.Vector3(), maxAngle=0;
    //     for (let j=1;j<pusherCone.geometry.vertices.length;j++) {
    //         // for drawing ray helpers
    //         let endWorld = pusherCone.localToWorld(pusherCone.geometry.vertices[j].clone());
    //         let endLocal = u1.worldToLocal(endWorld.clone());
    //         ends.push(endLocal);
    //         let dirWorld = new THREE.Vector3().subVectors(endWorld,originWorld).normalize();
    //         let dirLocal = new THREE.Vector3().subVectors(endLocal,originLocal).normalize();
    //         dirs.push(dirLocal);

    //         // get intersecting line with another cone
    //         let ray1 = new THREE.Raycaster(originWorld,dirWorld,0,far*0.95);
    //         // let helper = new THREE.ArrowHelper(dirLocal,originLocal,(far*0.9),0xff0000);
    //         // u1.add(helper);
    //         let istCone = ray1.intersectObject(receiverCone);
    //         if (istCone.length==0) {
    //             // console.log('no intersections with cone');
    //             if (removeCone) {
    //                 u1.transmissions.remove(pusherCone);
    //                 u2.transmissions.remove(receiverCone);
    //             }
    //             return 'no intersections with cone';
    //         } else if (istCone.length>1){
    //             // some times the ray intersects with the same point twice
    //             let ist1 = istCone[0];
    //             let ist2 = istCone[1];
    //             if (ist1.distance != ist2.distance ) {
    //                 // console.log('multiple intersections with cone',istCone);
    //                 if (removeCone) {
    //                     u1.transmissions.remove(pusherCone);
    //                     u2.transmissions.remove(receiverCone);
    //                 }
    //                 return 'multiple intersections with cone';
    //             }
    //         // no intersections with axis, single intersection with another cone
    //         } else {
    //             // if (j==1) {
    //             //     point.copy(istCone[0].point);
    //             // }

    //             let pt = istCone[0].point;
    //             // check joint angle
    //             // on the min intersecting point of cones, the angle of joints will be max
    //             // max angle cannot be bigger than a value
    //             // otherwise joints will be hard to connect and move in rotation
    //             let angle = pt.clone().sub(originWorld).angleTo(pt.clone().sub(rOriginWorld));
    //             maxAngle = maxAngle>angle?maxAngle:angle;
    //             if (maxAngle>160/180*Math.PI) {
    //                 // console.log('bad angle');
    //                 if (removeCone) {
    //                     u1.transmissions.remove(pusherCone);
    //                     u2.transmissions.remove(receiverCone);
    //                 }
    //                 return 'bad angle';
    //             }

    //             // check intersection with unit
    //             let ray2 = new THREE.Raycaster(originWorld,dirWorld,0,far*1.05);
    //             // let uhelper = new THREE.ArrowHelper(dirLocal,originLocal,far*1.1,0xff0000);
    //             // u1.add(uhelper);

    //             let istUnit = ray2.intersectObject(u2.children[3].children[0]);
    //             if (istUnit.length>0) {
    //                 // console.log('intersect with unit');
    //                 if (removeCone) {
    //                     u1.transmissions.remove(pusherCone);
    //                     u2.transmissions.remove(receiverCone);
    //                 }
    //                 points.push('iu');
    //                 // return 'intersect with unit';
    //                 continue;
    //             }

    //             points.push(pt);
    //         }
    //     }

    //     // review points to get the safest joint point
    //     let indices = [];
    //     for (istpt of points) {
    //         if (istpt != 'iu') {
    //             indices.push(points.indexOf(istpt));
    //         }
    //     }
    //     if (indices.length==0) {
    //         return 'intersect with unit';
    //     }

    //     // pusherCone.visible = false;
    //     // receiverCone.visible = false;

    //     indices.push(-1);
    //     let startIndex=indices[0],length=1,tempStartIndex=indices[0],tempLength=1;
    //     for (let k=1;k<indices.length;k++) {
    //         if (indices[k]-indices[k-1]==1) {
    //             tempLength++;
    //         } else {
    //             if (tempStartIndex==startIndex) {
    //                 length = tempLength;
    //             } else {
    //                 if (tempLength>length) {
    //                     startIndex = tempStartIndex;
    //                     length = tempLength;
    //                 }
    //             }
    //             tempStartIndex = indices[k];
    //             tempLength=1;
    //         }
    //     }
        
    //     // data
    //     let idx = startIndex + Math.floor(length/2);
    //     let jointPoint = points[idx];
    //     let pusherLength = jointPoint.distanceTo(originWorld)/u1.scale.z-far/r;
    //     pmax = pusherLength>pmax?pusherLength:pmax;
    //     pmin = pusherLength<pmin?pusherLength:pmin;
    //     let receiverLength = jointPoint.distanceTo(rOriginWorld)/u1.scale.z-far/r;
    //     rmax = receiverLength>rmax?receiverLength:rmax;
    //     rmin = receiverLength<rmin?receiverLength:rmin;

    //     if (removeCone) {
    //         u1.transmissions.remove(pusherCone);
    //         u2.transmissions.remove(receiverCone);
    //     }

    //     let pDirLocal = u1.worldToLocal(jointPoint.clone()).sub(originLocal).normalize();
    //     let pStart = originLocal.clone().add(pDirLocal.clone().multiplyScalar(far/r));
    //     let rDirLocal = u2.worldToLocal(jointPoint.clone()).sub(rOriginLocal).normalize();
    //     let rStart = rOriginLocal.clone().add(rDirLocal.clone().multiplyScalar(far/r));
        
    //     let params = {
    //         // cone parameters
    //         r:r,h:h,
    //         // rod
    //         pstart:pStart.toArray(),pdir:pDirLocal.toArray(),
    //         rodLength:pmax*1.1,
    //         // fork
    //         rstart:rStart.toArray(),rdir:rDirLocal.toArray(),
    //         forkLength:rmax*1.1,
    //         forkMinLength:Math.min(0.4*rmax,rmin*0.8),
    //         pusherStartWorld: originWorld.toArray(),
    //         receiverStartWorld: rOriginWorld.toArray(),
    //         point: jointPoint.toArray(),
    //     };
    //     return params;
    // },


    // Build mechanisms




            // console.log('Searching... please wait a second');
        // for (let i=0;i< this.units.children.length-1 ;i++) {
        //     let u1 = this.units.children[i];
        //     let u2 = this.units.children[i+1];
        //     let info = 'failed';

        //     let radiusTop = u1.userData.sleeve.r1;
        //     // boundary
        //     let unitInterval = u1.position.distanceTo(u2.position);
        //     // for test
        //     // let a = 30;
        //     // let x = 0.75*unitInterval;
        //     // let h = u1.scale.z/Math.tan(a/180*Math.PI)+x;
        //     // let r = h*Math.tan(a/180*Math.PI);
        //     // console.log(this.computeJointTrajectory(r/u1.scale.z,h/u1.scale.z,u1,u2))

        //     let a = 15,x = 0.7*unitInterval;
        //     for (a = 30;a<60;a++) {
        //         // for (x = unitInterval/2;x<unitInterval;x+=unitInterval/100) {
        //             let h = u1.scale.z/Math.tan(a/180*Math.PI)+x;
        //             let r = h*Math.tan(a/180*Math.PI)
        //             info = this.computeJointTrajectory(radiusTop, r/u1.scale.z,h/u1.scale.z,u1,u2)
        //             if (typeof(info)!='string') {
        //                 break;
        //             }
        //         // }
        //         if (typeof(info)!='string') {
        //             break;
        //         }
        //     }
        //     if (typeof(info) == 'string') {
        //         // console.log('Exausted search space and find no solutions, failed to generate joints. Reason: '+info);
        //         return 'Failed after exhausting all possibilites. Reason: '+info;
        //     }
        //     u1.userData.transmissions = info;
        //     u2.userData.transmissions = info;
        //     u1.buildRod();
        //     u2.buildFork();

        // }
        // return 'Got a feasible solution';



    // var importBtn = new UI.Button().setId('import-unit').onClick(function(){
    //     importBtn.dom.classList.add('selected');
    //     // uploadUnit.style.display = '';
    //     uploadRow.setDisplay('');
    // });
    // genRow.add(importBtn);


    // upload geometry
    // var uploadRow = new UI.Row();
    // uploadRow.setDisplay('none');
    // uploadRow.add(new UI.Text('Z must be the rotation axis!').setFontSize('12px'))
    // var uploadUnit = document.createElement('input');
    // uploadUnit.style.marginLeft = '5px';
    // uploadUnit.style.width = '100%';
	// uploadUnit.id = 'uploadUnit';
	// uploadUnit.multiple = false;
	// uploadUnit.type = 'file';
	// uploadUnit.accept = '.obj';
	// uploadUnit.addEventListener( 'change', function ( event ) {
	// 	if(uploadUnit.files.length>0) {
    //         var file = uploadUnit.files[0];
    //         var reader = new FileReader();
    //         reader.addEventListener('load', function (event) {
    //             var contents = event.target.result;
    //             var object = OBJLoader.parse(contents);
    //             object.traverse(function(obj){
    //                 if(obj.type=='Mesh') {
    //                     obj.material = sculptor.unitMaterial;
    //                 }
    //             });
    //             sculptor.unit.clearShapes();
    //             sculptor.unit.setUpload(object);
    //         });
    //         reader.readAsText(file);
    //     }
            
	// } );
	// uploadRow.dom.appendChild( uploadUnit );
    // genRow.add(uploadRow);

        // container.add(propellerShapeRow);
    // propellerShapeRow.add(new UI.Text('shape control').setWidth('100%'));
    // container.add(new UI.Text('blades').setWidth('180px'));
    // tabs
    // var semanticTab = new UI.Button('seman').setId('semantic-tab').onClick(function(){
    //     select('semantic');
    // });
    // var bladeTab = new UI.Button('sweep').setId('blade-tab').onClick(function(){
    //     select('blade');
    // });
    // var accessoryTab = new UI.Button('acces').setId('accessory-tab').onClick(function(){
    //     select('accessory');
    // });

    // var tabs = new UI.Div().setMargin('10px');
    // tabs.setId( 'leftbar-unit-tabs' );
    // tabs.add( semanticTab, bladeTab, accessoryTab );
    // propellerShapeRow.add( tabs );

    // configs
    // var semanticConfig = new Leftbar.Unit.Semantic(sculptor);
    // propellerShapeRow.add( semanticConfig );

    // var bladeConfig = new Leftbar.Unit.Blade(sculptor);
    // propellerShapeRow.add( bladeConfig );

    // var accessoryConfig = new Leftbar.Unit.Accessory(sculptor);
    // propellerShapeRow.add( accessoryConfig );

    // function select(selection) {
        
    //     semanticTab.dom.classList.remove( 'selected' );
	// 	bladeTab.dom.classList.remove( 'selected' );
    //     accessoryTab.dom.classList.remove( 'selected' );

    //     semanticTab.setBorderBottom('solid 1px black');
    //     bladeTab.setBorderBottom('solid 1px black')
    //     accessoryTab.setBorderBottom('solid 1px black')
        
    //     semanticConfig.setDisplay( 'none' );
    //     bladeConfig.setDisplay( 'none' );
    //     accessoryConfig.setDisplay( 'none' );
        
    //     if (!sculptor.selected) {return;}
	// 	switch ( selection ) {
	// 		case 'semantic':
    //             semanticTab.dom.classList.add( 'selected' );
    //             semanticTab.setBorderBottom('none');
	// 			semanticConfig.setDisplay( '' );
	// 			break;
	// 		case 'blade':
    //             bladeTab.dom.classList.add( 'selected' );
    //             bladeTab.setBorderBottom('none');
	// 			bladeConfig.setDisplay( '' );
	// 			break;
	// 		case 'accessory':
    //             accessoryTab.dom.classList.add( 'selected' );
    //             accessoryTab.setBorderBottom('none');
	// 			accessoryConfig.setDisplay( '' );
    //             break;
    //         default:
    //             break;
	// 	}
    // }

    // container.add(new UI.HorizontalRule());


    // function selectRound () {
    //     sculptor.deselectGroup();
    //     if (sculptor.selected instanceof Rib) {
    //         for (let rib of sculptor.unit.skeleton.children) {
    //             rib.select();
    //             sculptor.selectedGroup.push(rib);
    //         }
    //     } else if (sculptor.selected.name == 'ribpoint') {
    //         let container = sculptor.selected.parent;
    //         let idx = container.parent.children.indexOf(container)
    //         for (let rib of sculptor.unit.skeleton.children) {
    //             let pt = rib.children[idx].children[0];
    //             pt.material.color.setHex(0xffaa00);
    //             sculptor.selectedGroup.push(pt);
    //         }
    //     }
    // }

        // mesh generation
    // var genRow = new UI.Row().add(
    //     // new UI.HorizontalRule().setWidth('90%'),
    //     new UI.Text('Generate mesh').setClass('sect-title')
    // );
    // content.add(genRow);

    // var genBtn = new UI.Button().setId('gen').onClick(function(){
    //     sculptor.unit.generateShape();
    //     // importBtn.dom.classList.remove('selected');
    //     // uploadUnit.style.display = 'none';
    //     // uploadRow.setDisplay('none');
    // });
    // genRow.add(genBtn);

    // var clBtn = new UI.Button().setId('clear').onClick(function(){
    //     sculptor.unit.clearShapes();
    //     // importBtn.dom.classList.remove('selected');
    //     // uploadUnit.style.display = 'none';
    //     // uploadRow.setDisplay('none');
    // });
    // genRow.add(clBtn);


    // handlers

    // function clickDraw () {
    //     // exit draw vp mode
    //     if (sculptor.drawMode == 'vp') {
    //         signals.drawModeChanged.dispatch('normal');
    //         drawRibButton.dom.classList.remove('selected');
    //     } else {
    //         // enter draw vp mode
    //         signals.drawModeChanged.dispatch('vp');
    //         drawRibButton.dom.classList.add('selected');
    //     }
    // }

    // function simulateCA () {
    //     if (!(sculptor.selected instanceof Rib)) return;
    //     // enter circle array parameter configuration
    //     if (circleArrayButton.dom.id.indexOf('selected')<0) {
    //         circleArrayButton.dom.classList.add('selected');
    //         caRow.setDisplay('');
    //         sculptor.unit.clearTemp();
    //         // let n = caNumber.getValue();
    //         sculptor.unit.generateCircleArray(sculptor.selected,caNumber.getValue());
    //         // simulateCA();
    //     } else {
    //         circleArrayButton.dom.classList.remove('selected');
    //         caRow.setDisplay('none');
    //     }
    // }

    // function applyArray () {
    //     if (!sculptor.selected) return;
    //     sculptor.unit.addTempleRibs();
    //     sculptor.select(null);
    //     hideArray();
    // }

    // function cancelArray(){
    //     sculptor.unit.clearTemp();
    //     hideArray();
    // }

    // function hideArray() {
    //     circleArrayButton.dom.classList.remove('selected');
    //     caRow.setDisplay('none');
    // }

    // subscribers

    // signals.drawModeChanged.add(function(mode){
    //     if (mode == 'normal') {
    //         drawRibButton.dom.classList.remove('selected');
    //     }
    // });

        // var drawRibButton = new UI.Button().setId('add-end').onClick(clickDraw);
    // drawRibButton.dom.title = 'draw an end to initialize a skeleton curve';
    // skeletonRow.add(drawRibButton);

    // batch duplication: circle array
    // var circleArrayButton = new UI.Button().setId('ca').onClick(simulateCA);
    // circleArrayButton.dom.title = 'circle array';
    // skeletonRow.add(circleArrayButton);
    // var caRow = new UI.Row().setDisplay('none');
    // skeletonRow.add(caRow);
    // caRow.add(new UI.Text('#').setClass('param').setWidth('10px'));
    // var caNumber = new UI.Integer(4).setRange(2,30).setWidth('30px').onChange(simulateCA);
    // caRow.add(caNumber);
    // var generateArray = new UI.Button().setId('gca').onClick(applyArray);
    // caRow.add(generateArray);
    // var cancelArrayButton = new UI.Button().setId('cca').onClick(cancelArray);
    // caRow.add(cancelArrayButton);