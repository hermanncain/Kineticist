/**
 * @class KineticSculpture
 * @author hermanncain / https://hermanncain.github.io/
 */

function KineticSculpture (axis=null, contours=[]) {

    THREE.Object3D.call(this);

    // input
    this.axis = axis;
    this.reference = null;

    // cages
    // 静态轮廓
    this.contours = contours;
    this.samplingFreq = 20;
    // 主轴法平面
    this.planes = new THREE.Group();
    this.add(this.planes);
    // 骨架
    this.skeletons = new THREE.Group();
    this.add(this.skeletons);
    // 动态轮廓
    this.outlines = new THREE.Group();
    this.add(this.outlines);

    // units
    this.unit = null;
    this.units = new THREE.Group();
    this.add(this.units);

    // Axis mechanism
    this.axisWidth = 0.11;
    this.axle = null;

}

KineticSculpture.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

    constructor: KineticSculpture,

    clone: function () {
        let axis = this.axis.clone();
        let contours = this.contours.map(function(s){return s.clone();});
        let ks = new KineticSculpture(axis,contours);
        ks.unit = this.unit.clone();
        for (let u of this.units.children) {
            ks.units.add(u.clone());
        }
        for (let outline of this.outlines.children) {
            ks.outline.add(outline.clone());
        }
        ks.axisWidth = this.axisWidth;
        ks.buildAxle();
        return ks;
    },

    clear: function () {
        if (this.axle) {
            this.axle.geometry.dispose();
            this.remove(this.axle);
        }
        for (let contour of this.outlines.children) {
            contour.dispose();
            this.outlines.remove(contour);
        }
        this.outlines.children = [];
        for (let unit of this.units.children) {
            unit.dispose();
        }
        this.units.children = [];
    },

    // sculpture skeleton operations
    setAxis: function (sketch) {
        if(sketch instanceof Sketch) {
            sketch.setRole('axis');
            this.axis = sketch;
        } else {
            this.axis = null;
        }
    },

    addContour: function (obj){
        if (this.contours.indexOf(obj)<0) {
            this.contours.push(obj);
        }
        if (obj instanceof Sketch) {
            obj.deselect();
            obj.setRole('contour');
        }      
    },

    removeContour: function (obj) {
        if (obj instanceof Sketch) {
            obj.deselect();
            obj.setRole('sketch');
        }
        this.contours.splice(this.contours.indexOf(obj),1);
    },

    clearContours: function () {
        for (let obj of this.contours) {
            if (obj instanceof Sketch) {
                obj.deselect();
                obj.setRole('sketch');
            }
        }
        this.contours = [];
    },

    // Unit layout
    // if there is a reference sketch, arbitrary unit orientations may emerge
    // because if the sketch has multiple intersecting points 
    // with axis' normal plane, it is inaccurate to get the nearest one
    layout: function (unit,params,forcePTF=false) {
        this.params = params;
        this.unit = unit;
        this.clear();
        this.unit.resetTransform();

        // sample axis
        this.axis.sample(params.n);
        let positions = this.axis.samplingPoints;
        let frames = null;
        if (this.reference) {
            frames = this.axis.getReferencedFrames(this.reference,params.n);
        } else if (this.contours.length==0 || forcePTF==true) {
            // no sketch, use PTF
            frames = this.axis.ff;
        }
        for (let i=0;i<positions.length;i++) {
            if (!frames.normals[i]) {
                console.log('missing')
                continue;
            }
            let u = this.unit.clone();
            u.idx = i;
            // align to frame
            let m = new THREE.Matrix4().makeBasis(frames.normals[i],frames.binormals[i],frames.tangents[i]).multiplyScalar(params.scale).setPosition(positions[i]);
            u.applyMatrix(m);
            u.updatePointSize();
            if (this.contours.length==0 && params.torsion!=0) {
                u.rotateZ(params.torsion/180*Math.PI*i);
            }
            // store rotation
            u.metaRotation = u.rotation.clone();
            this.units.add(u);
            // important
            u.updateMatrixWorld();
            // console.log(u.skeleton.children[0].p1.position)
        }

    },


    // Morph

    showTransmissionInMetaUnit: function () {
        this.unit.joints.children = [];
        this.unit.joints.add(this.units.children[1].joints.children[0].clone());
        this.unit.joints.add(this.units.children[1].joints.children[1].clone());
    },


    // Outline
    // draw spline outlines passing through unit ends
    // computeOutlines: function () {
    //     let n = this.units.children.length;
    //     for (let u of this.units.children) {
            
    //     }

    // },

    // buildOutlines: function () {
    //     this.clearOutlines();

    //     let n = this.units.children[0].skeleton.children.length;
    //     for (let i=0;i<n;i++) {
    //         let pts = [];
    //         for (let j=0;j<this.units.children.length;j++) {
    //             let end = this.units.children[j].skeleton.children[i].end;
    //             pts.push(end.localToWorld(new THREE.Vector3()));
    //         }
    //         let curve = new Sketch('spline',pts,undefined,'sketch',this.axis.closed);
    //         curve.pointMeshes.map(function(p){
    //             p.material.size = 0.3;
    //         });
    //         this.outlines.add(curve);
    //     }
    // },

    // clearOutlines: function () {
    //     for (let contour of this.outlines.children) {
    //         contour.dispose();
    //     }
    //     this.outlines.children = [];
    // },


    // Sketch-based generation

    clearSkeleton: function () {
        for (let unit of this.units.children) {
            unit.dispose();
        }
        this.units.children = [];
    },

    setSleeveRadii: function () {
        this.axis.curveMesh.geometry.computeBoundingSphere();
        let axisRadius = this.axis.curveMesh.geometry.boundingSphere.radius * this.axis.curveMesh.scale.z;
        // set sleeve radius
        this.unit.userData.sleeve.rOut = axisRadius/25;
        this.unit.userData.sleeve.rInner = axisRadius/50;
        this.unit.userData.sleeve.thickness = axisRadius/50;
        if (!this.axis.closed) {
            this.unit.userData.sleeve.rOut /= 2;
            this.unit.userData.sleeve.rInner /= 2;
            this.unit.userData.sleeve.thickness /= 2;
        }
    },

    // Dynamic cage module
    // 生成骨架
    generateSkeletons: function () {
        for (let p of this.skeletons.children) {
            p.geometry.dispose();
        }
        this.skeletons.children = [];
        let positions = this.axis.samplingPoints;
        let frames = this.axis.ff;
        for (let i=0;i<positions.length;i++) {
            // align to frame
            let m = new THREE.Matrix4().makeBasis(frames.normals[i],frames.binormals[i],frames.tangents[i]).setPosition(positions[i]);
            let u = new Unit();
            u.applyMatrix(m);
            u.metaRotation = u.rotation.clone();
            this.skeletons.add(u);
            // important
            u.updateMatrixWorld();
        }
    },

    // 生成法平面
    generateNormalPlanes: function () {
        for (let p of this.planes.children) {
            p.geometry.dispose();
        }
        this.planes.children = [];
        let positions = this.axis.samplingPoints;
        let frames = this.axis.ff;
        for (let i=0;i<positions.length;i++) {
            // align to frame
            let m = new THREE.Matrix4().makeBasis(frames.normals[i],frames.binormals[i],frames.tangents[i]).setPosition(positions[i]);
            let plane = nplane.clone();
            plane.applyMatrix(m);
            this.planes.add(plane);
            plane.scale.set(5,5,5);
            // important
            plane.updateMatrixWorld();
        }
    },

    // 初始化动态笼体
    initDynamicCage: function (freq=20) {
        // 主轴曲线采样
        this.samplingFreq = freq;
        this.axis.sample(freq);
        // 构造法平面
        this.generateNormalPlanes();
        // this.clearOutlines();
        // 求法平面和静态轮廓交点
        let pij = [];
        for (let contour of this.contours) {
            let pj = this.axis.getNormalIntersectionsWithCurve(contour);
            pij.push(pj);
        }
        console.log(pij);
        // 初始化骨架
        this.generateSkeletons();
        for (let i=0;i<freq;i++) {
            let u = this.skeletons.children[i];
            for (let j=0;j<pij.length;j++) {
                if(pij[j][i]!==null) {
                    u.addRib(u.worldToLocal(pij[j][i].clone()));
                    let rib = u.skeleton.children[u.skeleton.children.length-1];
                    rib.p1.visible=false;
                    rib.p2.visible=false;
                } else {
                    u.skeleton.add(new THREE.Group());
                }
            }
        }
        // 构造动态轮廓
        this.buildDynamicContours();
    },

    clearDynamicContours: function () {
        for (let dc of this.outlines.children) {
            dc.dispose();
        }
        this.outlines.children = [];
    },

    buildDynamicContours: function () {
        this.clearDynamicContours();
        for (let j=0;j<this.contours.length;j++) {
            let pts = [];
            for (let i=0;i<this.samplingFreq;i++) {
                let u = this.skeletons.children[i];
                let rib = u.skeleton.children[j];
                if (rib instanceof Rib) {
                    let pt = u.localToWorld(rib.end.position.clone());
                    pts.push(pt);
                }
            }
            let outline = new Sketch('spline',pts);
            outline.pointMeshes.map(function(p){p.visible=false});
            this.outlines.add(outline);
        }
    },

    // motion control

    setController: function () {

    },

    testGroupedSpeed: function (v1,v2) {
        for(let i=0;i<this.units.children.length;i++) {
            if (i%2==0) {
                this.units.children[i].userData.velocity = v1;
            } else {
                this.units.children[i].userData.velocity = v2;
            }
        }
    },

    testVariedSpeed: function () {
        for (let i = 0; i<this.units.children.length;i++) {
            let u = this.units.children[i];
            u.userData.velocity = Math.sin(i/5*Math.PI)*0.01+0.02;
        }
        let scope = this;
        setInterval(function(){
            for (let i = 0; i<scope.units.children.length;i++) {
                let u = scope.units.children[i];
                u.userData.velocity = -u.userData.velocity;
            }
        },2000)
    },

    testVariedSpeed1: function () {
        this.clearSkeleton();
        this.clear();

        // initialize an empty unit
        this.unit = new Unit();
        let params = {n:20,scale:1,torsion:0};
        
        // sample axis and arrange empty units
        this.setSleeveRadii();
        this.axis.sample(params.n);
        this.layout(this.unit,params,true);
        
        // get all intersections of all contours with axis normal planes
        let samplingEnds = this.axis.getNormalIntersectionsWithCurves([this.contours[0]],5);
        // for (i=0;i<20;i++) {
        //     let ends = samplingEnds[i];
        //     let unit = this.units.children[i];
        //     // empty
        //     if (ends.length == 0) {
        //         unit.isEmpty = true;
        //         continue;
        //     }
        //     for (end of ends) {
        //         let point = end.clone();
        //         unit.worldToLocal(point);
        //         unit.addRib(point);
        //     }
        //     unit.buildSleeveRing();
        //     unit.updatePointSize(0.1);
        // }


        
        let omegas = []
        for (i=0;i<20;i++) {
            let ends = samplingEnds[i];
            let unit = this.units.children[i];
            // empty
            if (ends.length == 0) {
                unit.isEmpty = true;
                continue;
            }
            let timeOmegas = [];
            for (let j=0;j<ends.length-1;j++) {
                let point = ends[j].clone();
                timeOmegas.push(ends[j+1].angleTo(point)/60);
                if (j==0) {
                    unit.worldToLocal(point);
                    unit.addRib(point);
                }
                if (j==ends.length-2) {
                    timeOmegas.push(ends[0].angleTo(ends[j+1])/60);
                }
            }
            omegas.push(timeOmegas);
            unit.buildSleeveRing();
            unit.updatePointSize(0.1);
        }
    },

    simulateMotion: function () {
        // rotate units
        for(let unit of this.units.children) {
            unit.rotateZ(unit.userData.velocity);
        }
        // rotate skeletons
        for (let sk of this.skeletons.children) {
            sk.rotateZ(sk.userData.velocity);
        }
        // update dynamic contours
        if(this.skeletons.children.length>0) {
            this.buildDynamicContours();
        }
        
    },

    reset: function () {
        // reset units
        for(unit of this.units.children) {
            unit.rotation.copy(unit.metaRotation);
            // must
            unit.updateMatrixWorld();
        }
        // reset skeletons
        for(sk of this.skeletons.children) {
            sk.rotation.copy(sk.metaRotation);
            // must
            sk.updateMatrixWorld();
        }
        // reset outlines
        if(this.skeletons.children.length>0) {
            this.buildDynamicContours();
        }
    },


    // Solve junctions

    // 1. If a junction's envelope collides with the axis, it must collide with at least 
    //    one unit, so collision checking with the axis is unnecessary
    // 2. Even a junction's envelope collides with a unit or unit skeleton, junction's
    //    mechanism may not collide with them. It depends on junction's phase

    // single, double, cross
    buildJoints: function (layout='single', highlight=false) {
        // compute phases
        for (let u of this.units.children) {
            u.computeBestPhase();
        }
        let connectivity = true;
        // build
        for (let i=0;i< this.units.children.length-1 ;i++) {
            let u1 = this.units.children[i];
            let u2 = this.units.children[i+1];
            if (u1.isEmpty || u2.isEmpty) {
                continue;
            }
            if (u1.junctionPhase != u2.junctionPhase) {
                u1.junctionPhase = u2.junctionPhase;
            }
            // remember unit's scale!
            let d = u1.position.distanceTo(u2.position)/u1.scale.z;
            let connect = false;

            // exhaust h, theta for feasible junctions (search h first)
            // 30 degree <= theta <= 60 degree
            // 0.6d <= h <= 0.9d
            // strides: theta 1 degree, h 0.015 d
            // max iteration: 30 x 20 = 600 times per junction pair

            for (let theta=Math.PI/6;theta<Math.PI/3;theta+=Math.PI/180) {
                for (let h=0.6*d;h<0.9*d;h+=0.015*d) {
                    u1.buildRod(theta,h);
                    u2.buildFork(theta,h);
                    // u1 and u2 are fully connected, break the 2 for-loops
                    if (u1.rod.checkConnection(u2.fork)) {
                        // TODO: build mechanism later
                        u1.rod.buildMechanism();
                        u2.fork.buildMechanism();
                        // make rod and fork on the same unit has a phase difference of PI
                        if (layout == 'cross') {
                            if (i % 2 == 1) {
                                u1.rod.rotateZ(Math.PI);
                                u2.fork.rotateZ(Math.PI);
                            }
                        } else if (layout == 'double') {
                            u1.buildBiRod(theta,h);
                            u2.buildBiFork(theta,h);
                            u1.birod.buildMechanism();
                            u2.bifork.buildMechanism();
                        }
                        
                        if (this.params) {
                            u2.fork.rotateZ(-this.params.torsion/180*Math.PI);
                        }
                        connect = true;
                        break;
                    }
                }
                if (connect) {
                    break;
                }
            }

            // exhausted the ranges, but u1 and u2 are still separated
            if (!connect) {
                // clear all junctions
                // u1.clearRod();
                // u2.clearFork();
                
                if (highlight) {
                    // if highlight units on infeasible segments, highlight them and go on
                    u1.setMaterial(highlightUnitMaterial);
                    u2.setMaterial(highlightUnitMaterial);
                    connectivity = false;
                } else {
                    // if highlight is not needed, break the solving process
                    connectivity = false;
                    break;
                }
            }
        }

        return connectivity;
    },

    buildAxle: function () {
        if (this.axle) {
            this.axle.geometry.dispose();
            this.remove(this.axle);
        }

        this.axle = new THREE.Mesh(new THREE.TubeBufferGeometry(
            this.axis.curve,
            100/* this.axis.curveResolution/2 */,
            this.axisWidth,8,this.axis.curve.autoClose),
            axleMaterial
        );
        this.axle.layers.set(4);
        this.add(this.axle);
    },

    buildBearings: function () {
        for (let u of this.units.children) {
            u.buildBearing(this.axisWidth/u.scale.x);
        }
    },

    getMechanisms: function () {
        let r = [];
        for (u of this.units.children) {
            let mech = u.getMechanisms();
            if (mech.length>0) {
                r.push(...mech);
            }
        }
        return r;
    },

    toJSON: function () {
        let axisId = this.axis?this.axis.uuid:null;
        let sketchIds = [];
        for (let sketch of this.contours) {
            sketchIds.push(sketch.uuid);
        }

        return {
            // save the e-ids of axis and contours
            axisId,
            sketchIds,
            // save each unit's morph transformations
            morphTrans: this.units.children.map(function(u){
                return u.userData.morphTrans;
            }),
            // save data
            params: this.params
        }
    },

    fromJSON: function (data) {
        for (let i=0;i<this.units.children.length;i++) {
            let u = this.units.children[i];
            // restore morphs
            for (let key in data.morphTrans[i]) {
                let [x,y,z] = data.morphTrans[i][key];
                u[morphOpMap[key]](x,y,z);
            }
            // morph only when unit has shape meshes
            if (u.blades.children.length>0) {
                u.generateShape();
            }
        }
        this.buildJoints();
    },

});