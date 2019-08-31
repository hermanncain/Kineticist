/**
 * @class KineticSculpture
 * @author hermanncain / https://hermanncain.github.io/
 */

function KineticSculpture (axis=null, sketches=[]) {

    THREE.Object3D.call(this);

    // input
    this.axis = axis;
    this.sketches = sketches;

    // units
    this.unit = null;
    this.units = new THREE.Group();
    this.add(this.units);

    // Outlines built from unit skeleton ends
    this.outlines = new THREE.Group();
    this.add(this.outlines);

    // Axis mechanism
    this.axisWidth = 0.11;
    this.axisMech = null;

}

KineticSculpture.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

    constructor: KineticSculpture,

    clear: function () {
        if (this.axisMech) {
            this.axisMech.geometry.dispose();
            this.remove(this.axisMech);
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
        sketch.setRole('axis');
        this.axis = sketch;
    },

    addContour: function (obj){
        if (this.sketches.indexOf(obj)<0) {
            this.sketches.push(obj);
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
        this.sketches.splice(this.sketches.indexOf(obj),1);
    },

    clearContours: function () {
        for (let obj of this.sketches) {
            if (obj instanceof Sketch) {
                obj.deselect();
                obj.setRole('sketch');
            }
        }
        this.sketches = [];
    },

    // Unit layout
    // if there is a reference sketch, arbitrary unit orientations may emerge
    // because if the sketch has multiple intersecting points 
    // with axis' normal plane, it is inaccurate to get the nearest one
    layout: function (unit,params,forcePTF=false) {
        this.unit = unit;
        this.clear();
        this.unit.resetTransform();

        // sample axis
        this.axis.sample(params.n);
        let positions = this.axis.samplingPoints;
        let frames = null;
        if (this.sketches.length==0 || forcePTF==true) {
            // no sketch, use PTF
            frames = this.axis.ff;
        } else {
            // has (a) sketch(es), only use sketch[0] to build frames
            frames = this.axis.getReferencedFrames(this.sketches[0],params.n);
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
            if (this.sketches.length==0 && params.torsion!=0) {
                u.rotateZ(params.torsion/180*Math.PI*i);
            }
            // store rotation
            u.metaRotation = u.rotation.clone();
            this.units.add(u);
            // important
            u.updateMatrixWorld();
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
    buildOutlines: function () {
        this.clearOutlines();

        let n = this.units.children[0].skeleton.children.length;
        for (let i=0;i<n;i++) {
            let pts = [];
            for (let j=0;j<this.units.children.length;j++) {
                let end = this.units.children[j].skeleton.children[i].end;
                pts.push(end.localToWorld(new THREE.Vector3()));
            }
            let curve = new Sketch('spline',pts,undefined,'sketch',this.axis.closed);
            curve.pointMeshes.map(function(p){
                p.material.size = 0.3;
            });
            this.outlines.add(curve);
        }
    },

    clearOutlines: function () {
        for (let contour of this.outlines.children) {
            contour.dispose();
        }
        this.outlines.children = [];
    },


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

    buildSkeleton: function (dist=Infinity,freq=20) {

        this.clearSkeleton();
        this.clear();

        // initialize an empty unit
        this.unit = new Unit();
        let params = {n:freq,scale:1,torsion:0};
        
        // sample axis and arrange empty units
        this.setSleeveRadii();
        this.axis.sample(params.n);
        this.layout(this.unit,params,true);
        
        // get all intersections of all sketches with axis normal planes
        let samplingEnds = this.axis.getNormalIntersectionsWithCurves(this.sketches,dist);
        for (i=0;i<freq;i++) {
            let ends = samplingEnds[i];
            let unit = this.units.children[i];
            // empty
            if (ends.length == 0) {
                unit.isEmpty = true;
                continue;
            }
            for (end of ends) {
                let point = end.clone();
                unit.worldToLocal(point);
                unit.addRib(point);
            }
            unit.buildSleeveRing();
            unit.updatePointSize(0.1);
        }

    },


    // motion control

    setController: function () {

    },

    simulateMotion: function () {
        // rotate units
        for(unit of this.units.children) {
            unit.rotateZ(0.01);
        }
        // update outlines
        if(this.outlines.children.length>0) {
            this.buildOutlines();
        }
    },

    reset: function () {
        // reset units
        for(unit of this.units.children) {
            unit.rotation.copy(unit.metaRotation);
            // must
            unit.updateMatrixWorld();
        }
        // reset outlines
        if(this.outlines.children.length>0) {
            this.buildOutlines();
        }
    },


    // Solve junctions

    // 1. If a junction's envelope collides with the axis, it must collide with at least 
    //    one unit, so collision checking with the axis is unnecessary
    // 2. Even a junction's envelope collides with a unit or unit skeleton, junction's
    //    mechanism may not collide with them. It depends on junction's phase

    buildJoints: function (highlight=false) {
        let connectivity = true;
        // build
        for (let i=0;i< this.units.children.length-1 ;i++) {
            let u1 = this.units.children[i];
            let u2 = this.units.children[i+1];
            if (u1.isEmpty || u2.isEmpty) {
                continue;
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
                        // u1.rod.buildMechanism();
                        // u2.fork.buildMechanism();
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

    buildAxis: function () {
        if (this.axisMech) {
            this.axisMech.geometry.dispose();
            this.remove(this.axisMech);
        }

        this.axisMech = new THREE.Mesh(new THREE.TubeBufferGeometry(
            this.axis.curve,
            100/* this.axis.curveResolution/2 */,
            this.axisWidth,8,this.axis.curve.autoClose),
            this.unit.currentMaterial
        );
        this.axisMech.layers.set(4);
        this.add(this.axisMech);
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

    // export/import
    toJSON: function () {
        return {
            type: 'Sculpture',
            unit: this.unit.toJSON(),
            axis: this.axis.toJSON(),
            sketches: this.sketches.map(function(c){return c.toJSON();}),
            units:this.units.children.map(function(u){return u.toJSON();}),
            axisWidth: this.axisWidth,
            params:this.params,
        }
    },

    fromJSON: function(data) {
        let scope = this;
        this.unit = new Unit().fromJSON(data.unit);
        this.axis = new Sketch().fromJSON(data.axis);
        this.sketches = data.sketches.map(function(c){return new Sketch().fromJSON(c)});
        data.units.map(function(u){
            var u = new Unit().fromJSON(u);
            u.setMaterial(scope.unit.currentMaterial);
            u.buildRod();
            u.buildFork();
            scope.units.add(u);
        });
        this.axisWidth = data.axisWidth;
        return this;
    },

});

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
