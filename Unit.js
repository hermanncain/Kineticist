/**
 * @class Unit 
 * @param {Array} vps 
 * @param {JSON} params 
 * structure
 * children
 *  - axes helper
 *  - guides
 *      - rib1
 *          - end
 *          - p2
 *          - p1
 *      - rib2
 *  - temples
 *  - shape
 *      - sleeve
 *      - blades
 *      - accessories
 *      - transmissions
 *      - bearing
 *      - upload
 */
function Unit (params) {
    THREE.Object3D.call(this);

    this.type = 'Unit';

    this.metaRotation = new THREE.Euler();

    this.userData = params || {

        // sleeve
        sleeve: {
            r1:1,
            r2:0.5,
            thickness:0.5
        },

        blade: {
            shape: 'ellipse',
            a: 0.2,
            b: 0.2,
            seg:32,
            scaleXControls:[],
            scaleYControls:[],
            twistControls:[],
            scales:[],
            twists:[],
        },

        decs: {
            shape: 0,
            has: false,
            positions:[],
            scales:[],
            rotations:[],
        },

        innerTransform: {
            bias:[0,0,0],
            rotation:[0,0,0],
            size:[1,1,1],
        },

        transmissions: {

        },
    };

    this.currentMaterial = new THREE.MeshBasicMaterial();
    this.vpMaterial = new THREE.PointsMaterial( { color: 0x0000ff } );//new THREE.MeshBasicMaterial({color:0x0000ff});
    this.tempVPMaterial = new THREE.PointsMaterial( { color: 0xffff00 } );//new THREE.MeshBasicMaterial({color:0xffff00});

    // Structure
    // 1. axes helper
    let axes = new THREE.AxesHelper(2);
    axes.layers.set(6);
    this.add(axes);

    // 2. guides
    this.guides = new THREE.Group();
    this.add(this.guides);

    // 3. temple drawings for array
    this.templeRibs = new THREE.Group();
    this.add(this.templeRibs);

    // 4. shape
    // shape group for parts
    this.shape = new THREE.Group();
    this.shape.name = 'shape';
    this.add(this.shape);

    // 4.1 sleeve
    this.sleeve = new THREE.Group();
    this.sleeve.name = 'sleeve';
    this.shape.add(this.sleeve);

    // 4.2 blades
    this.blades = new THREE.Group();
    this.blades.name = 'blades';
    this.shape.add(this.blades);

    // 4.3 accessories
    this.accessories = new THREE.Group();
    this.accessories.name = 'accessories';
    this.shape.add(this.accessories);

    // 4.4 transmissions
    this.transmissions = new THREE.Group();
    this.transmissions.name = 'transmissions';
    this.shape.add(this.transmissions);

    // 4.5 bearing
    this.bearing = new THREE.Group();
    this.bearing.name = 'bearing';
    this.shape.add(this.bearing);

    // 4.6 upload
    this.upload = new THREE.Group();
    this.upload.name = 'upload';
    this.shape.add(this.upload);

}

Unit.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
    constructor: Unit,

    clone: function () {
        var unit = new Unit();
        unit.currentMaterial = this.currentMaterial;

        // clone guides
        for (let rib of this.guides.children) {
            unit.guides.add(rib.clone());
        }
        unit.userData = JSON.parse( JSON.stringify( this.userData ) );

        
        // unit.generateShape();
        // save time
        for (let i=0;i<this.shape.children.length;i++) {
            for (let shape of this.shape.children[i].children) {
                unit.shape.children[i].add(shape.clone());
            }
        }

        // clone transform
        unit.up.copy( this.up );
        unit.position.copy( this.position );
        unit.quaternion.copy( this.quaternion );
        unit.scale.copy( this.scale );
        unit.matrix.copy( this.matrix );
        unit.matrixWorld.copy( this.matrixWorld );
        unit.matrixAutoUpdate = this.matrixAutoUpdate;
        unit.matrixWorldNeedsUpdate = this.matrixWorldNeedsUpdate;
        
        return unit;
    },

    setMaterial: function (mat) {
        this.currentMaterial = mat;
        this.traverse(function(obj){
            if (obj.name == 'sleeve'||obj.name=='blades'||obj.name=='accessory'||obj.name=='transmission') {
                obj.material = mat;
            }
        });
    },

    setUpload: function (obj) {
        this.upload.children = [];
        this.upload.add(obj);
    },

    updatePointSize: function () {
        for (rib of this.guides.children) {
            rib.setPointSize(this.scale.z);
        }
    },

    resetTransform: function() {
        this.rotation.set(0,0,0);
        this.scale.set(1,1,1);
        this.position.set(0,0,0);
        // this.resetRadius();
    },

    // inner transform
    // resetInnerTransform: function () {
    //     for (let rib of this.guides.children) {
    //         rib.rotation.set(0,0,0);
    //         rib.scale.set(1,1,1);
    //     }
    // },
    setInnerScale: function (sx,sy,sz) {
        for (let rib of this.guides.children) {
            rib.setInnerScale(sx,sy,sz);
            rib.buildCurve();
        }
        this.userData.innerTransform.size=[sx,sy,sz];
    },
    resetInnerScale: function () {
        for (let rib of this.guides.children) {
            rib.resetInnerScale();
            rib.buildCurve();
        }
        this.userData.innerTransform.size=[1,1,1];
    },
    setInnerRotation: function (rx,ry,rz) {
        for (let rib of this.guides.children) {
            rib.rotation.set(rx,ry,rz);
            rib.updateMatrix();
        }
        this.userData.innerTransform.rotation=[rx,ry,rz];
    },
    resetInnerRotation: function () {
        for (let rib of this.guides.children) {
            rib.rotation.set(0,0,0);
            rib.updateMatrix();
        }
        this.userData.innerTransform.rotation=[0,0,0];
    },
    setInnerTranslation: function (x,y,z) {
        for (let rib of this.guides.children) {
            rib.setInnerBias(x,y,z);
            rib.buildCurve();
        }
        this.userData.innerTransform.bias = [x,y,z];
    },
    resetInnerTranslation: function () {
        for (let rib of this.guides.children) {
            rib.resetInnerBias();
            rib.buildCurve();
        }
        this.userData.innerTransform.bias = [0,0,0];
    },

    // basic rib operations
    addRib: function (position) {
        let pointGeometry = new THREE.BufferGeometry();
        pointGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, 0]), 3 ) );
        let end = new THREE.Points(pointGeometry,new THREE.PointsMaterial( { color: 0x0000ff } ));
        end.name = 'ribpoint';
        end.layers.set(1);
        end.position.copy(position);
        let rib = new Rib(end);
        rib.initialize();
        this.guides.add(rib);
        this.sortGuides();
    },

    removeRib: function (rib) {
        this.guides.children.splice(this.guides.children.indexOf(rib),1);
    },

    // rib array operations
    clearTemp: function () {
        this.templeRibs.children = [];
    },

    generateCircleArray: function (rib,n) {
        for (let i=1;i<n;i++) {
            var templeRib = rib.clone();
            templeRib.setColor(0xffee00);
            templeRib.rotateZ(2*Math.PI/n*i);
            this.templeRibs.add(templeRib);
        }
    },

    addTempleRibs: function () {
        while(this.templeRibs.children.length>0) {
            let rib = this.templeRibs.children[0];
            let euler = new THREE.Euler(0,0,-rib.rotation.z);
            rib.end.position.applyEuler(euler);
            rib.p1.position.applyEuler(euler);
            rib.p2.position.applyEuler(euler);
            rib.buildCurve();
            rib.setColor(0x0000ff);
            rib.rotateZ(-euler.z);
            this.guides.add(rib);
        }
        this.sortGuides();
    },

    sortGuides: function() {
        this.guides.children = this.guides.children.sort(function(rib1,rib2){
            let a = rib1.p1.position.clone().applyMatrix4(rib1.endContainer.matrix).applyMatrix4(rib1.matrix);
            let b = rib2.p1.position.clone().applyMatrix4(rib2.endContainer.matrix).applyMatrix4(rib2.matrix);
            var a1 = Math.atan2(a.y,a.x);
            var a2 = Math.atan2(b.y,b.x);
            a1 = a1<0?a1+Math.PI*2:a1;
            a2 = a2<0?a2+Math.PI*2:a2;
            return a1-a2;
        });
    },

    clearShapes: function () {
        for (let part of this.shape.children) {
            part.children = [];
        }
    },

    generateShape: function () {
        // this.clearShapes();
        // build a sleeve
        this.buildSleeve();
        // build blades
        this.buildBlades();
        // build accessories
        this.buildAccessories();
        // transmissions and the bearing will be built after layout 
    },

    buildSleeve: function () {
        // clear
        this.sleeve.traverse(function(obj) {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
        });
        this.sleeve.children = [];

        // build
        let r1 = this.userData.sleeve.r1;
        let r2 = this.userData.sleeve.r2
        let thickness = this.userData.sleeve.thickness;
        let contour = new THREE.Shape();
        contour.arc(0,0,r1);
        let hole = new THREE.Shape();
        hole.arc(0,0,r2);
        contour.holes.push(hole);
        let extrudeSettings = {
            steps:1,
            depth:thickness,
            bevelEnabled:false
        }
        let geometry = new THREE.ExtrudeGeometry(contour,extrudeSettings);
        geometry.translate(0,0,-thickness/2);
        let mesh = new THREE.Mesh(geometry, this.currentMaterial);
        mesh.name = 'sleeve';
        mesh.layers.set(4);
        this.sleeve.add(mesh);
    },

    buildBlades: function () {
        // clear shapes and memory
        this.blades.traverse(function(obj) {
            if (obj.geometry) {
                obj.geometry.dispose();
            }
        });
        this.blades.children=[];

        // sweeping
        for (let rib of this.guides.children) {
            if (!rib.curve) {
                rib.initialize();
            }
            
            // section shape
            let shape = new THREE.Shape();
            if (this.userData.blade.shape== 'ellipse') {
                shape.ellipse(0,0,this.userData.blade.a,this.userData.blade.b);
            }

            // segments
            let steps = this.userData.blade.seg;

            // start clipping
            let clipping = 0;
            var sweepPts = rib.curve.getSpacedPoints( steps );
            for (let i=1;i<=steps;i++) {
                if (sweepPts[i].distanceTo(new THREE.Vector3())>=this.userData.sleeve.r2) {
                    clipping = i;
                    break;
                }
            }

            let sweepSettings = {
                curveSegments:8,
                steps,
                depth: 1,
                sweepPath:rib.curve,
                bevelEnabled: false,
                scales:this.userData.blade.scales,
                twists:this.userData.blade.twists,
                clipping
            };
            
            // controllable sweeping geometry
            let blade = new THREE.Mesh(new SweepBufferGeometry(shape,sweepSettings),this.currentMaterial);
            blade.applyMatrix(rib.matrix);
            blade.applyMatrix(this.guides.matrix);
            blade.layers.set(4);
            blade.name = 'blades';
            this.blades.add(blade);
        }
    },

    buildAccessories: function () {
        // clear
        this.accessories.children = [];
        
        // build
        for (let rib of this.guides.children) {
            for (var i=0;i<this.userData.decs.positions.length;i++) {
                let t = this.userData.decs.positions[i];
                let s = this.userData.decs.scales[i];
                let decType = this.userData.decs.shapes[i];
                let dec = createDecoration(s,decType);
                dec.layers.set(4);
                dec.name = 'accessory'
                dec.material = this.currentMaterial;
                let pos = rib.curve.getPoint(t).applyMatrix4(rib.curveContainer.matrix).applyMatrix4(rib.matrix);
                dec.position.copy(pos);
                let tangent = rib.getTNB(t);
                let angle = Math.atan2(tangent.y,tangent.x);
                dec.rotateZ(angle+Math.PI);
                // let j = this.guides.children.indexOf(rib);
                if (pos.angleTo(new THREE.Vector3(0,1,0))<Math.PI/12||pos.angleTo(new THREE.Vector3(0,-1,0))<Math.PI/12) {
                    // console.log('s')
                    // dec.scale.set(s*this.userData.innerTransform.size[1],s*this.userData.innerTransform.size[1],s*this.userData.innerTransform.size[1]);
                    // console.log(j,dec.scale)
                }
                this.accessories.add(dec);
            }
        }
    },

    buildBearing: function (rMin) {
        // clear
        let scope = this;
        this.bearing.traverse(function(obj) {
            scope.bearing.remove(obj);
            if (obj.geometry) {
                obj.geometry.dispose();
            }
        });
        // build
        let rMax = this.userData.sleeve.r2*1.1;
        let h = this.userData.sleeve.thickness*1.2;
        let contour = new THREE.Shape();
        contour.arc(0,0,rMax);
        let hole = new THREE.Shape();
        hole.arc(0,0,rMin);
        contour.holes.push(hole);
        let extrudeSettings = {
            steps:1,
            depth:h,
            bevelEnabled:false
        }
        let geometry = new THREE.ExtrudeGeometry(contour,extrudeSettings);
        geometry.translate(0,0,-h/2);
        let mesh = new THREE.Mesh(geometry,new THREE.MeshPhongMaterial());
        mesh.name = 'bearing';
        mesh.material.color.setHex(0x444444);
        mesh.layers.set(4);
        this.bearing.add(mesh);
    },

    getMaxRadius: function () {
        let maxRadius = 0;
        for (rib of this.guides.children) {
            let r = rib.getServoCylindrical(rib.end).r;
            maxRadius = r>maxRadius?r:maxRadius;
        }
        if (this.upload.children.length>0) {
            maxRadius = this.upload.children[0].children[0].geometry.boundingSphere.radius/2;
        }
        return maxRadius;
    },

    // Advanced visual point operations
    resetVPs: function () {
        for (p of this.vps.children) {
            if (p.metaPosition) {
                p.position.copy(p.metaPosition);
            } else {
                p.metaPosition = p.position.clone();
            }
        }
    },

    scaleRadius: function (s) {
        this.resetVPs();
        for (p of this.vps.children) {
            p.position.set(p.position.x*s,p.position.y*s,p.position.z);
        }
        // this.generateShapes();
    },

    bias: function(dir,dist) {
        let t = dir/180*Math.PI;
        for (let p of this.vps.children) {
            p.position.set(p.position.x+dist*Math.cos(t), p.position.y+dist*Math.sin(t), p.position.z);
        }
    },

    radicalRotate: function(dir, t) {
        let a = dir/180*Math.PI;
        let axis = new THREE.Vector3(Math.cos(a),Math.sin(a),0);
        this.vps.rotateOnAxis(axis,t/180*Math.PI);
        this.vps.updateMatrixWorld();
    },

    // this will change unit's rotation direction in motion
    // CAUTION: may make the mechanism unattainable
    // radicalTort: function (dir, t) {
    //     let a = dir/180*Math.PI;
    //     let axis = new THREE.Vector3(Math.cos(a),Math.sin(a),0);
    //     this.rotateOnAxis(axis,t/180*Math.PI);
    // },

    parseTransmissionParameters: function () {
        let p = this.userData.transmissions;
        let params = {
            // cone parameters
            r:p.r,h:p.h,
            // rod
            pstart:new THREE.Vector3().fromArray(p.pstart),pdir:new THREE.Vector3().fromArray(p.pdir),
            rodLength:p.rodLength,
            // fork
            rstart:new THREE.Vector3().fromArray(p.rstart),rdir:new THREE.Vector3().fromArray(p.rdir),
            forkLength:p.forkLength,
            forkMinLength:p.forkMinLength,
            pusherStartWorld: new THREE.Vector3().fromArray(p.pusherStartWorld),
            receiverStartWorld: new THREE.Vector3().fromArray(p.receiverStartWorld),
            point: new THREE.Vector3().fromArray(p.point),
        };
        return params;
    },

    adjustJoint: function(mesh,params) {
        let v1 = params.point.clone().sub(params.pusherStartWorld);
        let v2 = params.point.clone().sub(params.receiverStartWorld);
        let crossDirWorld = v1.clone().cross(v2).normalize();
        let crossDirLocal = mesh.worldToLocal(crossDirWorld.clone().sub(v2)).normalize();
        let receiverNormalWorld = mesh.localToWorld(new THREE.Vector3(0,0,1));
        let yAxis = mesh.localToWorld(new THREE.Vector3(0,1,0));
        let angle = crossDirLocal.angleTo(receiverNormalWorld);
        let dir = crossDirLocal.clone().cross(receiverNormalWorld).multiply(yAxis);
        if (dir <0) {
            mesh.rotateY(-angle);
        } else {
            mesh.rotateY(angle);
        }
    },

    buildRod: function () {
        
        let params = this.parseTransmissionParameters();

        // build geometry
        let geo = new THREE.CylinderBufferGeometry(0.1,0.1,params.rodLength);
        geo.translate(0,params.rodLength/2,0);
        let mesh = new THREE.Mesh(geo,this.currentMaterial);
        mesh.layers.set(4);
        mesh.name = 'transmission';

        // rod skeleton
        let rodSkeleton = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),params.rodLength,0xce21c7);
        rodSkeleton.line.layers.set(3);
        rodSkeleton.cone.layers.set(3);

        // rod skeleton motion envelope
        this.transmissions.add(this.buildTransmissionEnvelope('rod',params.r,params.h));

        // update matrix
        mesh.add(rodSkeleton);
        mesh.position.copy(params.pstart);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), params.pdir.clone().normalize());
        mesh.updateMatrixWorld();
        let base = new THREE.Mesh(new THREE.SphereBufferGeometry(0.2),this.currentMaterial);
        base.layers.set(4);
        base.name = 'transmission';
        mesh.add(base);
        this.adjustJoint(mesh,params);
        this.transmissions.add(mesh);

    },

    buildFork: function () {

        let params = this.parseTransmissionParameters();
        
        // build geometry
        let barGeo = new THREE.CylinderGeometry(0.1,0.1,params.forkMinLength);
        barGeo.translate(0,params.forkMinLength/2,0);
        let baseGeo = new THREE.BoxGeometry(0.2,0.2,0.6);
        baseGeo.translate(0,params.forkMinLength-0.1,0);
        barGeo.merge(baseGeo);
        let geo1 = new THREE.CylinderGeometry(0.1,0.1,params.forkLength-params.forkMinLength);
        geo1.translate(0,(params.forkLength+params.forkMinLength)/2,0.2);
        let geo2 = new THREE.CylinderGeometry(0.1,0.1,params.forkLength-params.forkMinLength);
        geo2.translate(0,(params.forkLength+params.forkMinLength)/2,-0.2);
        barGeo.merge(geo1);
        barGeo.merge(geo2);
        let bufferGeo = new THREE.BufferGeometry();
        bufferGeo.fromGeometry(barGeo);
        let mesh = new THREE.Mesh(bufferGeo,this.currentMaterial);
        mesh.layers.set(4);
        mesh.name = 'transmission';

        // fork skeleton
        let forkSkeleton = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(),params.rodLength,0xce21c7);
        forkSkeleton.line.layers.set(3);
        forkSkeleton.cone.layers.set(3);
        mesh.add(forkSkeleton);

        // fork skeleton motion envelope
        this.transmissions.add(this.buildTransmissionEnvelope('fork',params.r,params.h));

        // update fork matrix
        mesh.position.copy(params.rstart);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), params.rdir.clone().normalize());
        mesh.updateMatrixWorld();
        this.adjustJoint(mesh,params);
        this.transmissions.add(mesh);
        
    },

    buildTransmissionEnvelope: function (type,r,h) {
        let frustumH = h-h/r;
        let geo = new THREE.CylinderBufferGeometry(this.userData.sleeve.r1, r, frustumH,64,1,true);
        let frustum = new THREE.Mesh(geo,new THREE.MeshPhongMaterial({shininess:0,color:0x26876a,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
        frustum.name = 'motion envelope';
        frustum.visible = false;
        if (type == 'rod') {
            frustum.rotateX(-Math.PI/2);
        } else if (type == 'fork') {
            frustum.rotateX(Math.PI/2);
        }
        frustum.translateY(-frustumH/2);
        return frustum;
    },

    toJSON: function () {
        upload = this.upload.children.length>0?this.upload.children[0].toJSON():null;
        return {
            type:'Unit',
            // 1. userData
            userData:this.userData,
            matrix: this.matrix.toArray(),
            // 2. semantic skeletons
            ribs: this.guides.children.map(function(rib){
                return rib.toJSON();
            }),
            metaRotation: this.metaRotation.toArray(),
            // 3. uploads
            upload
        };
    },

    fromJSON: function (data) {

        this.userData = data.userData;
        var loader = new THREE.ObjectLoader();
        // parse uploaded objects
        if (data.upload) {
            this.upload.add(loader.parse(data.upload));
            return;
        }

        // generate ribs
        for (let ribData of data.ribs) {
            var rib = new Rib();
            rib.fromJSON(ribData);
            this.guides.add(rib);
        }
        // build
        this.generateShape();

        // transform
        this.applyMatrix(new THREE.Matrix4().fromArray(data.matrix));
        this.metaRotation = new THREE.Euler().fromArray(data.metaRotation);
        this.updatePointSize();
        return this;
    },

    toSTL: function () {

    }
    
});


/**
 * generate decorations
 * more shapes to be added
 */
var leaf = null;
var loader = new THREE.OBJLoader();
loader.load(
    'resource/leaf.obj',
    function (obj) {
        let leafGeometry = new THREE.Geometry().fromBufferGeometry(obj.children[0].geometry);
        leafGeometry.scale(0.5,0.5,0.5);
        leafGeometry.rotateX(Math.PI/2);
        leaf = new THREE.Mesh(leafGeometry);
    }
);
var bowlCurve = new THREE.Shape();
bowlCurve.ellipse(0,0.5,1,0.5,-Math.PI/2,0);
bowlCurve.lineTo(0.9,0.5);
bowlCurve.ellipse(-0.9,0,0.9,0.4,0,-Math.PI/2,true);
var bowlMesh = new THREE.Mesh(new THREE.LatheGeometry( bowlCurve.extractPoints(16).shape,16 ));

function createDecoration(r,type){
    
    switch (parseInt(type)) {
        // plate
        case 0:
            return new THREE.Mesh(new THREE.CylinderGeometry(r,r,0.1*r,16));
        // ball
        case 1:
            return new THREE.Mesh(new THREE.SphereGeometry(r,16,16));
        // bowl
        case 2:
            let bowl = bowlMesh.clone();
            bowl.scale.set(r,r,r);
            return bowl;
        // ring
        case 3:
            let contour = new THREE.Shape();
            contour.arc(0,0,r);
            let hole = new THREE.Shape();
            hole.arc(0,0,0.6*r);
            contour.holes.push(hole);
            let extrudeSettings = {
                steps:1,
                depth:r*0.1,
                bevelEnabled:false
            }
            let geo = new THREE.ExtrudeGeometry(contour,extrudeSettings);
            geo.translate(0,0,-r*0.05);
            geo.rotateX(Math.PI/2);
            return new THREE.Mesh(geo);
        // leaf
        case 4:
            let leafMesh = leaf.clone();
            leafMesh.scale.set(r,r,r);
            return leafMesh;
        // TODO
        default:
        break;

    }
}