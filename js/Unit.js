/**
 * @class Unit 
 * @param {string} shape 
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
    // TODO: merge other string/number/bool properties into userdata
    // because {} can be encoding/decoding integrally
    this.userData = {
        morphTrans: {
            bias:[0,0,0],
            rotation:[0,0,0],
            size:[1,1,1],
        },

        sleeve: {
            rOut:1,
            rInner:0.5,
            thickness:0.5
        },

        velocity: 0.01,
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
        if(this.sleeveRing) {
            unit.sleeveRing = this.sleeveRing.clone();
            unit.add(unit.sleeveRing);
        }

        // regenerate shapes
        if (this.blades.children.length>0) {
            unit.generateShape();
        }

        // clone mechisms
        if (this.bearing) {
            this.buildBearing();
        }
        if(this.rod) {
            unit.rod = this.rod.clone();
            unit.add(unit.rod);
        }
        if(this.fork) {
            unit.fork = this.fork.clone();
            unit.add(unit.fork);
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
            if (obj.name == 'unit-sleeve'||obj.name=='unit-blade'||obj.name=='unit-accessory'||obj.name=='unit-rod'||obj.name=='unit-fork') {
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
            rib.rotation.z=0;
            rib.updateMatrix();
            rib.buildCurve();
            rib.setColor(0x0000ff);
            this.skeleton.add(rib);
        }
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
        let circle = new THREE.EllipseCurve(0,0,r,r);
        var points = circle.getPoints( 72 );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        this.sleeveRing = new THREE.Line(geometry, sleeveRingMaterial);
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
            if (rib.sectionShape== 'ellipse') {
                shape.ellipse(0,0,rib.sectionShapeParams.a,rib.sectionShapeParams.b);
            }

            // segments
            let steps = rib.sweepSteps;

            // start clipping
            let clipping = 0;
            var sweepPts = rib.curve.getSpacedPoints( steps );
            for (let i=1;i<=steps;i++) {
                if (sweepPts[i].distanceTo(new THREE.Vector3())>=this.userData.sleeve.rInner) {
                    clipping = i;
                    break;
                }
            }
            let scales = [];
            for (let i=0;i<rib.widths.length;i++) {
                scales.push(new THREE.Vector2(rib.widths[i][1],rib.thicknesses[i][1]));
            }
            let sweepSettings = {
                curveSegments:8,
                steps,
                depth: 1,
                sweepPath:rib.curve,
                bevelEnabled: false,
                scales:scales,
                twists:rib.twists.map(function(v){return v[1]/180*Math.PI}),
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
            for (let marker of rib.markerContainer.children) {
                let t = marker.pos;
                let s = marker.sca;
                let decType = marker.shape;
                let dec = new THREE.Mesh(buildAccessoryGeometry(decType),this.currentMaterial);
                dec.scale.set(s,s,s);
                dec.layers.set(4);
                dec.name = 'unit-accessory';
                let pos = rib.curve.getPoint(t).applyMatrix4(rib.curveContainer.matrix).applyMatrix4(rib.matrix);
                dec.position.copy(pos);
                let tangent = rib.getTNB(t);
                let angle = Math.atan2(tangent.y,tangent.x);
                dec.rotateZ(angle+Math.PI);
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
            // userData
            userData:this.userData,
            matrix: this.matrix.toArray(),
            // semantic skeletons
            ribs: this.skeleton.children.map(function(rib){
                return rib.toJSON();
            }),
            generated: this.blades.children.length>0,
            metaRotation: this.metaRotation.toArray(),
        };
    },

    fromJSON: function (data) {

        this.userData = data.userData;

        // restore ribs
        for (let ribData of data.ribs) {
            var rib = new Rib();
            rib.fromJSON(ribData);
            this.skeleton.add(rib);
        }
        // restore meshes
        if (data.generated) {
            this.generateShape();
        }
        // restore transformations
        this.applyMatrix(new THREE.Matrix4().fromArray(data.matrix));
        this.metaRotation = new THREE.Euler().fromArray(data.metaRotation);
        this.updatePointSize();
        return this;
    },
    
});