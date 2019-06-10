/**
 * @class KineticSculptureBranch
 * @author hermanncain / https://hermanncain.github.io/
 */

function KineticSculptureBranch (axis=null, contours=[], envelopes=[], references=[]) {

    THREE.Object3D.call(this);

    this.unit = null;
    // Unit clones
    this.units = new THREE.Group();
    this.add(this.units);

    // sculpture skeletons
    //  axis
    this.axis = axis;
    //  reference curve
    this.references = references;

    // Skeleton
    this.skeletons = [];

    // Envelopes
    this.curves = new THREE.Group();
    this.add(this.curves);

    // Mechanism
    this.axisMech = new THREE.Group();
    this.add(this.axisMech);
    this.bearings = new THREE.Group();
    this.add(this.bearings);

    // mechanism axis
    this.axisWidth = 0.11;

}

KineticSculptureBranch.prototype = Object.assign(Object.create(THREE.Object3D.prototype), {

    constructor: KineticSculptureBranch,

    clear: function () {

    },

    // sculpture skeleton operations
    setAxis: function (sketch) {
        this.axis = sketch;
    },

    addReference: function (obj){
        if (this.references.indexOf(obj)<0) {
            this.references.push(obj);
        }
        if (obj.type == 'sketch') {
            obj.deselect();
            obj.setCurveType('reference');
        }
        
    },

    removeReference: function (obj) {
        if (obj.type == 'sketch') {
            obj.deselect();
            obj.setCurveType('contour');
        }
        this.references.splice(this.references.indexOf(obj),1);
    },

    clearReference: function () {
        for (let obj of this.references) {
            if (obj.type == 'sketch') {
                obj.deselect();
                obj.setCurveType('contour');
            }
        }
        this.references = [];
    },

    // arrange unit clones
    arrange: function (u,p) {
        this.unit = u;
        this.unit.transmissions.children = [];
        this.axis.sample(p.g.n);
        // unit, axis, references

        // null unit or null axis
        if (this.unit.shape.children.length==0||this.axis==null) 
        {
            // alert('empty unit or axis!');
            // return;
        }
        
        // clear up
        this.units.children = [];
        this.unit.resetTransform();

        // sample axis
        this.axis.sample(p.g.n);
        let P = this.axis.samplingPoints;
        let T = this.axis.samplingTangents;

        // set reference
        if (this.references.length==0) {
            this.layout(P,p);
        } else if (this.references.length==1) {
            this.layoutRef(P,p);
        }
    },

    layout: function (positions, p) {
        let ff = this.axis.ff;
        for (let i=0;i<positions.length;i++) {
            let u = this.unit.clone();
            u.idx = i;
            // align to frame
            let m = new THREE.Matrix4().makeBasis(ff.normals[i],ff.binormals[i],ff.tangents[i]).multiplyScalar(p.g.scale).setPosition(positions[i]);
            u.applyMatrix(m);
            u.updatePointSize();
            u.rotateZ(p.g.torsion/180*Math.PI*i);
            // store rotation
            u.metaRotation = u.rotation.clone();
            this.units.add(u);
        }
    },

    layoutRef: function (positions, p) {
        let rf = this.axis.getReferencedFrames(this.references[0],p.g.n);
        for (let i=0;i<positions.length;i++) {
            if (!rf.normals[i]) continue;
            let m = new THREE.Matrix4().makeBasis(rf.normals[i],rf.binormals[i],rf.tangents[i]).multiplyScalar(p.g.scale).setPosition(positions[i]);
            let u = this.unit.clone();
            u.idx = i;
            // align
            u.applyMatrix(m);
            u.updatePointSize();
            // store rotation
            u.metaRotation = u.rotation.clone();
            this.units.add(u);
        }
    },

    // sculpture envelope
    buildCurves: function () {
        this.curves.children = []
        let n = this.unit.guides.children.length;
        for (let i=0;i<n;i++) {
            let pts = [];
            for (let j=0;j<this.units.children.length;j++) {
                let end = this.units.children[j].guides.children[i].end;
                pts.push(end.localToWorld(new THREE.Vector3()));
            }
            let curve = new Sketch('spline',pts);
            this.curves.add(curve);
        }
    },

    // skeleton
    clearSkeleton: function () {
        // for (bone of this.skeletons) {
        //     this.remove(bone);
        // }
        // this.skeletons = [];
        this.units.children = [];
    },
    
    buildSkeleton: function (dist,freq) {
        // console.log('a')
        // this.clearSkeleton();
        // this.skeletons.push(...this.axis.generateSkeleton(this.references, dist, freq));
        // for (bone of this.skeletons) {
        //     this.add(bone);
        // }

        // initialize an empty unit
        var unit = new Unit();
        this.unit = unit;
        let p = {g:{},l:[]};
        p.g.n = freq;
        p.g.scale = 1;
        p.g.torsion = 0;
        for (let i=0;i<p.g.n;i++) {
            p.l[i] = {};
        }

        // clear up
        this.units.children = [];
        this.unit.transmissions.children = [];

        // sample axis and arrange empty units
        this.axis.sample(p.g.n);
        this.layout(this.axis.samplingPoints,p);
        
        // intersect to add ribs to units
        for (let i=0;i<freq;i++) {
            this.units.children[i].updateMatrix();
            this.units.children[i].updateMatrixWorld();
            let planeCenter = this.axis.samplingPoints[i];
            let normalPlane = this.axis.samplingNormalPlanes[i];
            let point = new THREE.Vector3();
            var lines = [];
            for (c of this.references) {
                for (line of c.denseLines) {
                    lines.push(line.clone().applyMatrix4(this.axis.matrix));
                }
            }
            for (line of lines) {
                if (!normalPlane.intersectsLine(line)) {
                    continue;
                } else {
                    var end = normalPlane.intersectLine(line,point);
                    if (end.distanceTo(planeCenter)<dist) {
                        this.units.children[i].worldToLocal(end);
                        this.units.children[i].addRib(end);
                    }
                }
            }
            // build skeleton curve based on rib curve
            this.units.children[i].guides.children.map(function(r){
                r.skeleton = true;
                r.buildCurve();
            });
        }
    },

    // mechanisms

    // buildUtils: function () {

    // },

    // motion simulation
    setController: function () {

    },

    simulateMotion: function () {
        // rotate skeleton
        // for(bone of this.skeletons){
        //     bone.simulate();
        // }
        // rotate units
        for(unit of this.units.children) {
            unit.rotateZ(0.01);
        }
        // rotate envelope
        // if(this.envelope.children.length>0) {
        //     this.generateEnvelope();
        // }
        if(this.curves.children.length>0) {
            this.buildCurves();
        }
    },

    reset: function () {
        // reset skeleton
        // for(bone of this.skeletons){
        //     bone.rotation.set(0,0,0);
        // }
        // reset units
        for(unit of this.units.children) {
            unit.rotation.copy(unit.metaRotation);
            // must
            unit.updateMatrixWorld();
        }
        // reset envelope
        // if(this.envelope.children.length>0) {
        //     this.generateEnvelope();
        // }
        if(this.curves.children.length>0) {
            this.buildCurves();
        }
    },


    // Mechanisms
    buildAxis: function () {
        this.axisMech.children = [];
        let axisMesh = new THREE.Mesh(new THREE.TubeBufferGeometry(
            this.axis.curve,
            200/* this.axis.curveResolution/2 */,
            this.axisWidth,8,this.axis.curve.autoClose),
            this.unit.currentMaterial
        );
        axisMesh.layers.set(4);
        this.axisMech.add(axisMesh);
        this.buildBearings();
    },

    buildBearings: function () {
        for (let u of this.units.children) {
            u.buildBearing(this.axisWidth/u.scale.x);
        }
    },

    showTransmissionInMetaUnit: function () {
        this.unit.joints.children = [];
        this.unit.joints.add(this.units.children[1].joints.children[0].clone());
        this.unit.joints.add(this.units.children[1].joints.children[1].clone());
    },

    buildJoints: function () {
        // console.log('Searching... please wait a second');
        for (let i=0;i< this.units.children.length-1 ;i++) {
            let u1 = this.units.children[i];
            let u2 = this.units.children[i+1];
            let info = 'failed';

            let radiusTop = u1.userData.sleeve.r1;
            // boundary
            let unitInterval = u1.position.distanceTo(u2.position);
            // for test
            // let a = 30;
            // let x = 0.75*unitInterval;
            // let h = u1.scale.z/Math.tan(a/180*Math.PI)+x;
            // let r = h*Math.tan(a/180*Math.PI);
            // console.log(this.computeJointTrajectory(r/u1.scale.z,h/u1.scale.z,u1,u2))

            let a = 15,x = 0.7*unitInterval;
            for (a = 30;a<60;a++) {
                // for (x = unitInterval/2;x<unitInterval;x+=unitInterval/100) {
                    let h = u1.scale.z/Math.tan(a/180*Math.PI)+x;
                    let r = h*Math.tan(a/180*Math.PI)
                    info = this.computeJointTrajectory(radiusTop, r/u1.scale.z,h/u1.scale.z,u1,u2)
                    if (typeof(info)!='string') {
                        break;
                    }
                // }
                if (typeof(info)!='string') {
                    break;
                }
            }
            if (typeof(info) == 'string') {
                // console.log('Exausted search space and find no solutions, failed to generate joints. Reason: '+info);
                return 'Failed after exhausting all possibilites. Reason: '+info;
            }
            u1.userData.transmissions = info;
            u2.userData.transmissions = info;
            u1.buildRod();
            u2.buildFork();

        }
        return 'Got a feasible solution';
    },

    computeJointTrajectory: function (rTop, r,h,u1,u2) {
        // for test
        let removeCone = true;
        // pusher/receiver cone
        let geo = new THREE.ConeGeometry(r,h,64,1,true);
        let pusherCone = new THREE.Mesh(geo,new THREE.MeshPhongMaterial({shininess:0,color:0x26876a,side:THREE.DoubleSide,transparent:true,opacity:0.5}));
        let receiverCone = pusherCone.clone();
        pusherCone.rotateX(-Math.PI/2);
        receiverCone.rotateX(Math.PI/2);
        dx = h*(r-2)/2/r;
        pusherCone.translateY(-dx);
        receiverCone.translateY(-dx);
        u1.transmissions.add(pusherCone);
        pusherCone.updateMatrixWorld();
        u2.transmissions.add(receiverCone);
        receiverCone.updateMatrixWorld();

        // check cones intersection with axis segment between u1 and u2
        let i1 = this.units.children.indexOf(u1)/this.units.children.length;
        let i2 = this.units.children.indexOf(u2)/this.units.children.length;
        let j1 = Math.floor(this.axis.densePoints.length*i1);
        let j2 = Math.floor(this.axis.densePoints.length*i2);
        for (let i=j1;i<j2-1;i++) {
            let start = this.axis.localToWorld(this.axis.densePoints[i]);
            let end = this.axis.localToWorld(this.axis.densePoints[i+1]);
            let far = end.distanceTo(start);
            let dir = new THREE.Vector3().subVectors(end,start).normalize();
            let ray = new THREE.Raycaster(start,dir,far/r,far);
            let istAxis = ray.intersectObjects([pusherCone,receiverCone]);
            if (istAxis.length>=1) {
                // console.log('intersect with axis',istAxis.length);
                if (removeCone) {
                    u1.transmissions.remove(pusherCone);
                    u2.transmissions.remove(receiverCone);
                }
                return 'intersect with axis';
            }
        }
        // check intersection between cones
        // ray
        let far = Math.sqrt(r**2+h**2);
        let near = far/r;
        // pusher's cone top
        let originWorld = pusherCone.localToWorld(pusherCone.geometry.vertices[0].clone());
        let originLocal = u1.worldToLocal(originWorld.clone());
        // receiver's cone top
        let rOriginWorld = receiverCone.localToWorld(receiverCone.geometry.vertices[0].clone());
        let rOriginLocal = u2.worldToLocal(rOriginWorld.clone());
        let ends = [], dirs = [];
        let points = [];
        let pmin=1000,rmin=1000,pmax=0,rmax=0,point = new THREE.Vector3(), maxAngle=0;
        for (let j=1;j<pusherCone.geometry.vertices.length;j++) {
            // for drawing ray helpers
            let endWorld = pusherCone.localToWorld(pusherCone.geometry.vertices[j].clone());
            let endLocal = u1.worldToLocal(endWorld.clone());
            ends.push(endLocal);
            let dirWorld = new THREE.Vector3().subVectors(endWorld,originWorld).normalize();
            let dirLocal = new THREE.Vector3().subVectors(endLocal,originLocal).normalize();
            dirs.push(dirLocal);

            // get intersecting line with another cone
            let ray1 = new THREE.Raycaster(originWorld,dirWorld,0,far*0.95);
            // let helper = new THREE.ArrowHelper(dirLocal,originLocal,(far*0.9),0xff0000);
            // u1.add(helper);
            let istCone = ray1.intersectObject(receiverCone);
            if (istCone.length==0) {
                // console.log('no intersections with cone');
                if (removeCone) {
                    u1.transmissions.remove(pusherCone);
                    u2.transmissions.remove(receiverCone);
                }
                return 'no intersections with cone';
            } else if (istCone.length>1){
                // some times the ray intersects with the same point twice
                let ist1 = istCone[0];
                let ist2 = istCone[1];
                if (ist1.distance != ist2.distance ) {
                    // console.log('multiple intersections with cone',istCone);
                    if (removeCone) {
                        u1.transmissions.remove(pusherCone);
                        u2.transmissions.remove(receiverCone);
                    }
                    return 'multiple intersections with cone';
                }
            // no intersections with axis, single intersection with another cone
            } else {
                // if (j==1) {
                //     point.copy(istCone[0].point);
                // }

                let pt = istCone[0].point;
                // check joint angle
                // on the min intersecting point of cones, the angle of joints will be max
                // max angle cannot be bigger than a value
                // otherwise joints will be hard to connect and move in rotation
                let angle = pt.clone().sub(originWorld).angleTo(pt.clone().sub(rOriginWorld));
                maxAngle = maxAngle>angle?maxAngle:angle;
                if (maxAngle>160/180*Math.PI) {
                    // console.log('bad angle');
                    if (removeCone) {
                        u1.transmissions.remove(pusherCone);
                        u2.transmissions.remove(receiverCone);
                    }
                    return 'bad angle';
                }

                // check intersection with unit
                let ray2 = new THREE.Raycaster(originWorld,dirWorld,0,far*1.05);
                // let uhelper = new THREE.ArrowHelper(dirLocal,originLocal,far*1.1,0xff0000);
                // u1.add(uhelper);

                let istUnit = ray2.intersectObject(u2.children[3].children[0]);
                if (istUnit.length>0) {
                    // console.log('intersect with unit');
                    if (removeCone) {
                        u1.transmissions.remove(pusherCone);
                        u2.transmissions.remove(receiverCone);
                    }
                    points.push('iu');
                    // return 'intersect with unit';
                    continue;
                }

                points.push(pt);
            }
        }

        // review points to get the safest joint point
        let indices = [];
        for (istpt of points) {
            if (istpt != 'iu') {
                indices.push(points.indexOf(istpt));
            }
        }
        if (indices.length==0) {
            return 'intersect with unit';
        }

        // pusherCone.visible = false;
        // receiverCone.visible = false;

        indices.push(-1);
        let startIndex=indices[0],length=1,tempStartIndex=indices[0],tempLength=1;
        for (let k=1;k<indices.length;k++) {
            if (indices[k]-indices[k-1]==1) {
                tempLength++;
            } else {
                if (tempStartIndex==startIndex) {
                    length = tempLength;
                } else {
                    if (tempLength>length) {
                        startIndex = tempStartIndex;
                        length = tempLength;
                    }
                }
                tempStartIndex = indices[k];
                tempLength=1;
            }
        }
        
        // data
        let idx = startIndex + Math.floor(length/2);
        let jointPoint = points[idx];
        let pusherLength = jointPoint.distanceTo(originWorld)/u1.scale.z-far/r;
        pmax = pusherLength>pmax?pusherLength:pmax;
        pmin = pusherLength<pmin?pusherLength:pmin;
        let receiverLength = jointPoint.distanceTo(rOriginWorld)/u1.scale.z-far/r;
        rmax = receiverLength>rmax?receiverLength:rmax;
        rmin = receiverLength<rmin?receiverLength:rmin;

        if (removeCone) {
            u1.transmissions.remove(pusherCone);
            u2.transmissions.remove(receiverCone);
        }

        let pDirLocal = u1.worldToLocal(jointPoint.clone()).sub(originLocal).normalize();
        let pStart = originLocal.clone().add(pDirLocal.clone().multiplyScalar(far/r));
        let rDirLocal = u2.worldToLocal(jointPoint.clone()).sub(rOriginLocal).normalize();
        let rStart = rOriginLocal.clone().add(rDirLocal.clone().multiplyScalar(far/r));
        
        let params = {
            // cone parameters
            r:r,h:h,
            // rod
            pstart:pStart.toArray(),pdir:pDirLocal.toArray(),
            rodLength:pmax*1.1,
            // fork
            rstart:rStart.toArray(),rdir:rDirLocal.toArray(),
            forkLength:rmax*1.1,
            forkMinLength:Math.min(0.4*rmax,rmin*0.8),
            pusherStartWorld: originWorld.toArray(),
            receiverStartWorld: rOriginWorld.toArray(),
            point: jointPoint.toArray(),
        };
        return params;
    },

    // data exchange
    toJSON: function () {
        return {
            type: 'Sculpture',
            unit: this.unit.toJSON(),
            axis: this.axis.toJSON(),
            references: this.references.map(function(c){return c.toJSON();}),
            units:this.units.children.map(function(u){return u.toJSON();}),
            axisWidth: this.axisWidth,
            params:this.params,
        }
    },

    fromJSON: function(data) {
        let scope = this;
        this.unit = new Unit().fromJSON(data.unit);
        this.axis = new Sketch().fromJSON(data.axis);
        this.references = data.references.map(function(c){return new Sketch().fromJSON(c)});
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

    toSTL: function () {

    }
});

// layout2D: function (positions, directions,p) {

//     let t = p.g.torsion;
//     let b = p.g.bias;
//     let rr = p.g.RadicalRotation;
//     let rt = p.g.RadicalTorsion;

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
//         u.scaleRadius(p.g.size);

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
//         u.scale.set(p.g.scale,p.g.scale,p.g.scale);

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
    //     let m = this.units.children[0].guides.children.length;
    //     console.log(n,m)
    //     if (this.axis.curve.closed) {
    //         for (let i=0;i<n;i++) {
    //             let u1 = this.units.children[i];
    //             let u2 = this.units.children[(i+1)%n];
    //             for (let j=0;j<m;j++) {
    //                 let p1 = u1.localToWorld(u1.guides.children[j].getEndPosition().clone());
    //                 let p2 = u2.localToWorld(u2.guides.children[j].getEndPosition().clone());
    //                 let p3 = u1.localToWorld(u1.guides.children[(j+1)%m].getEndPosition().clone());
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
    //                     let p1 = u1.localToWorld(u1.guides.children[j%m].getEndPosition().clone());
    //                     let p2 = u2.localToWorld(u2.guides.children[j%m].getEndPosition().clone());
    //                     let p3 = u1.localToWorld(u1.guides.children[j-1].getEndPosition().clone());
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
    //                     let p1 = u1.localToWorld(u1.guides.children[j].getEndPosition().clone());
    //                     let p2 = u2.localToWorld(u2.guides.children[j].getEndPosition().clone());
    //                     let p3 = u1.localToWorld(u1.guides.children[(j+1)%m].getEndPosition().clone());
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
    //         u.guides.scale.set(sizes[i],sizes[i],1);
    //         u.guides.rotation.z = torsions[i];
    //         u.guides.updateMatrix();
    //         u.generateShape();
    //     }
        
    // },