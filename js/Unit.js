/**
 * @class Unit 
 * @param {Array} vps 
 * @param {JSON} params 
 * children
 *  - skeleton
 *  - temples
 *  - blades
 *  - accessories
 *  - sleeve
 *  - bearing
 *  - rod
 *  - fork
 */
function Unit (shape='propeller') {

    THREE.Object3D.call(this);

    // General attributes
    this.type = 'Unit';
    this.isEmpty = false;
    this.metaRotation = new THREE.Euler();
    this.currentMaterial = grayMaterial;
    this.shape = shape;

    // data
    this.userData = {
        morphTrans: {
            bias:[0,0,0],
            rotation:[0,0,0],
            size:[1,1,1],
        },

        blade: {
            shape: 'ellipse',
            a: 0.2,
            b: 0.2,
            seg:32,
            // scaleXControls:[],
            // scaleYControls:[],
            // twistControls:[],
            scales:[],
            twists:[],
        },

        decs: {
            has: false,
            positions:[],
            scales:[],
            rotations:[],
            shapes: [],
        },

        sleeve: {
            rOut:1,
            rInner:0.5,
            thickness:0.5
        },

    };

    // Children
    // prototypes
    // 1. skeleton
    this.skeleton = new THREE.Group();
    this.add(this.skeleton);

    // 2. temple skeleton for showing array
    this.templeSkeleton = new THREE.Group();
    this.add(this.templeSkeleton);

    // mechanisms
    // 3. entities
    this.sleeve = null;
    this.bearing = null;

    // 4. prototypes
    this.sleeveRing = null;
    this.rod = null;
    this.fork = null;

    // shapes
    // 5. propellers
    // 5.1 blades
    this.blades = new THREE.Group();
    this.blades.name = 'blades';
    this.add(this.blades);

    // 5.2 accessories
    this.accessories = new THREE.Group();
    this.accessories.name = 'accessories';
    this.add(this.accessories);

    // 6. polygons
    this.polygon = null;
}

Unit.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {
    constructor: Unit,

    clone: function () {

        var unit = new Unit();

        // clone skeleton
        for (let rib of this.skeleton.children) {
            unit.skeleton.add(rib.clone());
        }

        // to save time, instead of regeneration,
        // clone objects directly
        for (let blade of this.blades.children) {
            unit.blades.add(blade.clone());
        }
        for (let accessory of this.accessories.children) {
            unit.accessories.add(accessory.clone());
        }
        if(this.sleeve) {
            unit.sleeve = this.sleeve.clone();
            unit.add(unit.sleeve);
        }
        
        // clone data
        unit.userData = JSON.parse( JSON.stringify( this.userData ) );

        // clone transformations
        // inherited from the copy method of THREE.Object3D
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

    dispose: function () {
        // clear skeleton
        while (this.skeleton.children.length>0) {
            let rib = this.skeleton.children.pop();
            rib.dispose();
        }
        // clear meshes
        this.clearShapes();
    },

    setMaterial: function (mat) {
        if (mat == 'color') {
            this.colorMaterial();
            this.materialMode = 'color';
            return;
        }
        this.currentMaterial = mat;
        this.traverse(function(obj){
            if (obj.name == 'unit-sleeve'||obj.name=='unit-blade'||obj.name=='unit-accessory'||obj.name=='transmission') {
                obj.material = mat;
            }
        });
    },

    colorMaterial: function () {
        if (this.sleeve) {
            this.sleeve.material = sleeveColoredMaterial;
        }
        for (let blade of this.blades.children) {
            blade.material = bladeColoredMaterial;
        }
        for (let accessory of this.accessories.children) {
            accessory.material = accessoryColoredMaterial;
        }
        if (this.rod) {
            if (this.rod.mechanism) {
                this.rod.mechanism.material = rodColoredMaterial;
            }
        }
        if (this.fork) {
            if (this.fork.mechanism) {
                this.fork.mechanism.material = forkColoredMaterial;
            }
        }
    },

    updatePointSize: function (size) {
        if (size) {
            for (rib of this.skeleton.children) {
                rib.setPointSize(size);
            }
        } else {
            for (rib of this.skeleton.children) {
                rib.setPointSize(this.scale.z);
            }
        }
        
    },

    resetTransform: function() {
        this.rotation.set(0,0,0);
        this.scale.set(1,1,1);
        this.position.set(0,0,0);
        // this.resetRadius();
    },


    // Skeleton operations

    // rib basic operations

    addRib: function (position) {
        let pointGeometry = new THREE.BufferGeometry();
        pointGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, 0]), 3 ) );
        let end = new THREE.Points(pointGeometry,new THREE.PointsMaterial( { color: 0x0000ff } ));
        end.name = 'ribpoint';
        end.layers.set(1);
        end.position.copy(position);
        let rib = new Rib(end);
        rib.initialize();
        this.skeleton.add(rib);
        // this.updateCollider();
        // this.sortRibs();
    },

    removeRib: function (rib) {
        this.skeleton.remove(rib);
        rib.dispose();
    },


    // rib array operations

    clearTemp: function () {
        for (rib of this.templeSkeleton.children) {
            rib.dispose();
        }
        this.templeSkeleton.children = [];
    },

    generateCircleArray: function (rib,n) {
        for (let i=1;i<n;i++) {
            var templeRib = rib.clone();
            templeRib.setColor(0xffee00);
            templeRib.rotateZ(2*Math.PI/n*i);
            this.templeSkeleton.add(templeRib);
        }
    },

    addTempleRibs: function () {
        while(this.templeSkeleton.children.length>0) {
            let rib = this.templeSkeleton.children[0];
            let euler = new THREE.Euler(0,0,-rib.rotation.z);
            rib.end.position.applyEuler(euler);
            rib.p1.position.applyEuler(euler);
            rib.p2.position.applyEuler(euler);
            rib.buildCurve();
            rib.setColor(0x0000ff);
            rib.rotateZ(-euler.z);
            this.skeleton.add(rib);
        }
        this.sortRibs();
    },

    sortRibs: function() {
        this.skeleton.children = this.skeleton.children.sort(function(rib1,rib2){
            let a = rib1.p1.position.clone().applyMatrix4(rib1.endContainer.matrix).applyMatrix4(rib1.matrix);
            let b = rib2.p1.position.clone().applyMatrix4(rib2.endContainer.matrix).applyMatrix4(rib2.matrix);
            var a1 = Math.atan2(a.y,a.x);
            var a2 = Math.atan2(b.y,b.x);
            a1 = a1<0?a1+Math.PI*2:a1;
            a2 = a2<0?a2+Math.PI*2:a2;
            return a1-a2;
        });
    },

    // rib morph operations

    setMorphScale: function (sx,sy,sz) {
        for (let rib of this.skeleton.children) {
            rib.setMorphScale(sx,sy,sz);
            rib.buildCurve();
        }
        this.userData.morphTrans.size=[sx,sy,sz];
    },
    resetMorphScale: function () {
        for (let rib of this.skeleton.children) {
            rib.resetMorphScale();
            rib.buildCurve();
        }
        this.userData.morphTrans.size=[1,1,1];
    },
    setMorphRotation: function (rx,ry,rz) {
        for (let rib of this.skeleton.children) {
            rib.rotation.set(rx,ry,rz);
            rib.updateMatrix();
        }
        this.userData.morphTrans.rotation=[rx,ry,rz];
    },
    resetMorphRotation: function () {
        for (let rib of this.skeleton.children) {
            rib.rotation.set(0,0,0);
            rib.updateMatrix();
        }
        this.userData.morphTrans.rotation=[0,0,0];
    },
    setMorphTranslation: function (x,y,z) {
        for (let rib of this.skeleton.children) {
            rib.setMorphTranslation(x,y,z);
            rib.buildCurve();
        }
        this.userData.morphTrans.bias = [x,y,z];
    },
    resetMorphTranslation: function () {
        for (let rib of this.skeleton.children) {
            rib.resetMorphTranslation();
            rib.buildCurve();
        }
        this.userData.morphTrans.bias = [0,0,0];
    },


    // Mesh operations

    clearShapes: function () {
        for (blade of this.blades.children) {
            blade.geometry.dispose();
        }
        this.blades.children = [];
        for (acc of this.accessories.children) {
            acc.geometry.dispose();
        }
        this.accessories.children = [];
        if (this.sleeve) {
            this.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            })
            this.remove(this.sleeve);
            this.sleeve = null;
        }
        if (this.polygon) {
            this.polygon.geometry.dispose();
            this.remove(this.polygon);
            this.polygon = null;
        }
        if (this.bearing) {
            this.bearing.geometry.dispose();
            this.remove(this.bearing);
            this.bearing = null;
        }
        if (this.sleeveRing) {
            this.sleeveRing.geometry.dispose();
            this.remove(this.sleeveRing);
            this.sleeveRing = null;
        }
        if (this.rod) {
            this.rod.dispose();
            this.remove(this.rod);
            this.rod = null;
        }
        if (this.fork) {
            this.fork.dispose();
            this.remove(this.fork);
            this.fork = null;
        }
    },

    generateShape: function () {
        this.clearShapes();
        if (this.shape=='propeller') {
            this.buildSleeve();
            this.buildBlades();
            this.buildAccessories();
        } else if (this.shape == 'polygon') {
            this.buildSleeve();
            this.buildPolygon();
        }   
    },

    buildPolygon: function () {
        // clear
        if (this.polygon) {
            this.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            })
            this.remove(this.polygon);
            this.polygon = null;
        }

        this.sortRibs();
        let ps = [];
        // TODO: bevel, depth, convex
        for (let rib of this.skeleton.children) {
            let v = new THREE.Vector3();
            rib.end.localToWorld(v);
            ps.push(v);
        }
        let shape = new THREE.Shape();
        shape.moveTo(ps[0].x,ps[0].y);
        for (let i=1;i<ps.length;i++) {
            shape.lineTo(ps[i].x,ps[i].y);
        }
        shape.lineTo(ps[0].x,ps[0].y);
        let hole = new THREE.Shape();
        hole.arc(0,0,this.userData.sleeve.rOut);
        shape.holes.push(hole);
        let extrudeSettings = {
            steps:1,
            depth:0.5,
            bevelEnabled:false
        }
        let geometry = new THREE.ExtrudeBufferGeometry(shape,extrudeSettings);
        geometry.translate(0,0,-0.5/2);
        this.polygon = new THREE.Mesh(geometry, this.currentMaterial);
        this.add(this.polygon);
    },

    buildSleeve: function () {
        // clear
        if (this.sleeve) {
            this.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            })
            this.remove(this.sleeve);
            this.sleeve = null;
        }

        let rOut = this.userData.sleeve.rOut;
        let rInner = this.userData.sleeve.rInner;
        let thickness = this.userData.sleeve.thickness;
        let contour = new THREE.Shape();
        contour.arc(0,0,rOut*1.01);
        let hole = new THREE.Shape();
        hole.arc(0,0,rInner);
        contour.holes.push(hole);
        let extrudeSettings = {
            steps:1,
            depth:thickness,
            bevelEnabled:false
        }
        let geometry = new THREE.ExtrudeBufferGeometry(contour,extrudeSettings);
        geometry.translate(0,0,-thickness/2);
        this.sleeve = new THREE.Mesh(geometry, this.currentMaterial);
        this.sleeve.name = 'unit-sleeve';
        this.sleeve.layers.set(4);
        this.add(this.sleeve);
        if (!this.sleeveRing) {
            this.buildSleeveRing();
        }
    },

    buildSleeveRing: function () {
        if (this.sleeveRing) {
            this.sleeveRing.geometry.dispose();
            this.remove(this.sleeveRing);
        }
        let r = this.userData.sleeve.rOut;
        let geometry = new THREE.TorusBufferGeometry(0.9*r,0.1*r,4,16);
        this.sleeveRing = new THREE.Mesh(geometry, sleeveRingMaterial);
        this.sleeveRing.layers.set(3);
        this.add(this.sleeveRing);
    },

    buildBlades: function () {
        // clear shapes and memory
        for (blade of this.blades.children) {
            blade.geometry.dispose();
        }
        this.blades.children = [];

        // sweeping
        for (let rib of this.skeleton.children) {
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
                if (sweepPts[i].distanceTo(new THREE.Vector3())>=this.userData.sleeve.rInner) {
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
            blade.applyMatrix(this.skeleton.matrix);
            blade.layers.set(4);
            blade.name = 'unit-blade';
            this.blades.add(blade);
        }
    },

    buildAccessories: function () {
        // clear
        for (acc of this.accessories.children) {
            acc.geometry.dispose();
        }
        this.accessories.children = [];
        
        // build
        for (let rib of this.skeleton.children) {
            for (var i=0;i<this.userData.decs.positions.length;i++) {
                let t = this.userData.decs.positions[i];
                let s = this.userData.decs.scales[i];
                let decType = this.userData.decs.shapes[i];
                let dec = new THREE.Mesh(buildAccessoryGeometry(decType),this.currentMaterial);
                dec.scale.set(s,s,s);
                dec.layers.set(4);
                dec.name = 'unit-accessory';
                let pos = rib.curve.getPoint(t).applyMatrix4(rib.curveContainer.matrix).applyMatrix4(rib.matrix);
                dec.position.copy(pos);
                let tangent = rib.getTNB(t);
                let angle = Math.atan2(tangent.y,tangent.x);
                dec.rotateZ(angle+Math.PI);
                // let j = this.skeleton.children.indexOf(rib);
                if (pos.angleTo(new THREE.Vector3(0,1,0))<Math.PI/12||pos.angleTo(new THREE.Vector3(0,-1,0))<Math.PI/12) {
                    // console.log('s')
                    // dec.scale.set(s*this.userData.morphTrans.size[1],s*this.userData.morphTrans.size[1],s*this.userData.morphTrans.size[1]);
                    // console.log(j,dec.scale)
                }
                this.accessories.add(dec);
            }
        }
    },

    buildBearing: function (rMin=0.2) {
        // clear
        if (this.bearing) {
            this.bearing.geometry.dispose();
            this.remove(this.bearing);
            this.bearing = null;
        }
        // build
        let rMax = this.userData.sleeve.rInner*1.1;
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
        this.bearing = new THREE.Mesh(geometry,bearingMaterial);
        this.bearing.name = 'unit-bearing';
        this.bearing.layers.set(4);
        this.add(this.bearing);
    },

    buildRod: function (theta=Math.PI/3,height) {
        this.clearRod();
        let r = this.userData.sleeve.rOut;
        height = height ? height : 2 * r;
        this.rod = new Junction('Rod',theta,height,0,r);
        this.add(this.rod);
        this.rod.updateMatrixWorld();
    },

    clearRod: function () {
        if (this.rod) {
            this.rod.dispose();
            this.remove(this.rod);
            this.rod = null;
        }
    },

    buildFork: function (theta=Math.PI/3,height) {
        this.clearFork();
        let r = this.userData.sleeve.rOut;
        height = height ? height : 2 * r;
        this.fork = new Junction('Fork',theta,height,0,r);
        this.add(this.fork);
        this.fork.updateMatrixWorld();
    },

    clearFork: function () {
        if (this.fork) {
            this.fork.dispose();
            this.remove(this.fork);
            this.fork = null;
        }
    },


    // misc

    getMaxRadius: function () {
        let maxRadius = 0;
        for (let rib of this.skeleton.children) {
            let r = rib.getServoCylindrical(rib.end).r;
            maxRadius = r>maxRadius?r:maxRadius;
        }
        return maxRadius;
    },

    getMechanisms: function () {
        let mech = [];
        if (this.sleeve) {
            mech.push(this.sleeve);
        }
        if (this.blades) {
            mech.push(this.blades);
        }
        if (this.accessories) {
            mech.push(this.accessories);
        }
        if (this.polygon) {
            mech.push(this.polygon);
        }
        return mech;
    },

    toJSON: function () {
        return {
            type:'Unit',
            // 1. userData
            userData:this.userData,
            matrix: this.matrix.toArray(),
            // 2. semantic skeletons
            ribs: this.skeleton.children.map(function(rib){
                return rib.toJSON();
            }),
            metaRotation: this.metaRotation.toArray(),
        };
    },

    fromJSON: function (data) {

        this.userData = data.userData;

        // generate ribs
        for (let ribData of data.ribs) {
            var rib = new Rib();
            rib.fromJSON(ribData);
            this.skeleton.add(rib);
        }
        // build
        this.generateShape();

        // transform
        this.applyMatrix(new THREE.Matrix4().fromArray(data.matrix));
        this.metaRotation = new THREE.Euler().fromArray(data.metaRotation);
        this.updatePointSize();
        return this;
    },
    
});

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
