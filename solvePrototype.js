/**
 * General sculpture prototype solver
 * Solve a sculpture prototype based on 
 * single/multiple sketches combined with given/non-given axis
 * @input {Sketch}[] sketches : spatiotemporal sketches
 * @input {Sketch} axis : sculpture axis
 * @input {int} number : unit number
 * @params
 * @components
 */
class prototypeSolver {
    constructor (sketchArray=[],axis=null) {

        // Settings
        // how axis vary in iteration: shape, trans, both
        this.axisVariation = 'shape';
        // if unit skeleton are fixed in XOY plane in UCS: default true
        this.perpendicularSkeleton = true;
        // max iteration: default 10000
        this.maxIter = 10000;
        // optimization method: GA, SA, PSO
        this.optMethod = 'SA';
        // sleeve radius: default 0.2
        this.r0 = 0.2;
        // junction envelope segmentation: default 36
        this.radialSegments = 36;
        // number of units: default 10
        this.n = 20;

        // Input
        this.sketches = sketchArray;
        this.axis = axis;
        
        // Searching parameters
        
        // (A) axis: 2 x 6 + 3 = 15d
        this.axisPoints2D = [];
        this.axisPlaneNormalRotation = new THREE.Euler(0,0,0);
        // this.axisPlaneDistance = 0;

        // (J) junctions: 3(n-1)d
        this.junctionEnvelopeHeights = [];
        this.junctionEnvelopeAngles = [];
        this.junctionRodPhases = [];
        for (let i=0;i<this.n-1;i++) {
            this.junctionEnvelopeHeights.push(0.6);
            this.junctionEnvelopeAngles.push(Math.PI/8);
            this.junctionRodPhases.push(0);
        }
        
        
        // Follower parameters of searching parameters
        // releated with A
        //  3d axis control points
        this.axisPoints = [];
        //  axis' base plane
        this.axisPlane = new THREE.Plane(this.axisPlaneNormal, 0);// this.axisPlaneDistance);

        // skeleton
        //  skeleton phases, radius, and height: (phi, r, h) x m = 3md
        this.S = [];
        
        // prototype(s)
        this.sculpture = null;
        this.sculptures = [];
        
        // Energy
        this.E_dissimilarity = Infinity;
        this.E_connection = Infinity;
        this.E_collision = Infinity;
        this.E_axis = Infinity;
        this.energy = Infinity;
        this.computeEnergy();


        // discrete sketches
        //  - discrete sketch 1
        //      - discrete contour 1
        //          - point 1
        //          - point 2
        //          - ...
        //      - discrete contour 2
        //      - ...
        //  - discrete sketch 2
        //  - ...
        this.discreteSketches = [];


    }


    // 1. Initialization
    // 1.1 handle input sketches and get its AABB
    getSketchesBox () {
        let points = [];
        for (let sketch of this.sketches) {
            sketch.map(function(curve){
                points.push(...curve.curve.getSpacedPoints(200));
            });
        }
        this.sketchBox = new THREE.Box3().setFromPoints(points);
    }
    // 1.2 handle input axis:
    //   initialize the sculpture axis as the input axis, or
    //   initialize the sculpture axis as a straight/circle spline
    initializeAxis (axis='line') {
        if (axis instanceof Sketch) {
            this.axis = axis;
        } else {
            this.generateAxis(0,0.05,axis);
        }
    }

    // 1.4 initialize unit envelopes as cylinders
    // each cylinders radius is the minimum length of the longest skeleton of a unit
    initializeUnitEnvelopes () {

        // initialize a sculpture with empty units
        let u = new Unit();
        this.sculpture = new KineticSculpture(this.axis);
        this.sculpture.unit = u;
        this.axis.sample(this.n);
        this.sculpture.layout(this.axis.samplingPoints);

        // get all cylinder radii with max distances of IPNS
        // IPNS: Intersecting Points of axis' every Normal planes with all curves in a Sketch
        for (let i=0;i<this.n;i++) {            
            let u = this.sculpture.units.children[i];
            let top=-100,bottom=100,r=0;
            let normalPlane = this.axis.samplingNormalPlanes[i];
            for (let sketch of this.sketches) {
                for (let curve of sketch) {
                    for (let line of curve.denseLines) {
                        let point = new THREE.Vector3();
                        // intersect curve with normal plane
                        let intersection = normalPlane.intersectLine(line,point);
                        if (intersection == undefined) {
                            continue;
                        } else {
                            // convert intersecting point to UCS
                            let p = u.worldToLocal(point);
                            top = p.z > top ? p.z : top;
                            bottom = p.z < bottom ? p.z : bottom;
                            let re = Math.sqrt(p.x**2+p.y**2);
                            r = re > r ? re : r;
                        }
                    }
                }
            }
            u.buildEnvelope(r,top,bottom);
        }
    }


    // 2. Search
    // 2.1 search axis
    generateAxis (xExpandRatio=0,yExpandRatio=0.05,ini=false) {

        // compute ranges
        let boundaryBox = this.sketchBox;
        let bMin = boundaryBox.min, bMax = boundaryBox.max;
        let xMin = bMin.x - (bMax.x-bMin.x)*xExpandRatio;
        let xMax = bMax.x + (bMax.x-bMin.x)*xExpandRatio;
        let yMin = bMin.y - (bMax.y-bMin.y)*yExpandRatio;
        let yMax = bMax.y + (bMax.y-bMin.y)*yExpandRatio;
        let xRange = xMax-xMin, yRange = yMax-yMin;
        let minPtDist = Math.min(xRange,yRange)/10;

        // handle the given axis type
        if (ini=='line') {
            for (let i=0;i<6;i++) {
                this.axisPoints2D.push(new THREE.Vector3(xMin+xRange/2,yMin+yRange/5*i,0));
                this.axisPoints.push(new THREE.Vector3(xMin+xRange/2,yMin+yRange/5*i,0));
            }
        } else if (ini == 'circle') {
            // TODO
        } else {
            // clear memory
            this.axis.traverse(function(obj){
                if (obj.geometry) {
                    obj.geometry.dispose();
                }
            });
            // randomly generate axis control points
            this.generateAxisControlPoints(xMin,xMax,yMin,yMax,xRange,yRange);
            while (this.checkBadAxis(minPtDist)) {
                this.generateAxisControlPoints(xMin,xMax,yMin,yMax,xRange,yRange);
            }
        }

        this.axis = new Sketch('spline',this.axisPoints);

    }
    generateAxisControlPoints (xMin,xMax,yMin,yMax,xRange,yRange) {
        // clear
        this.axisPoints2D = [];
        this.axisPoints = [];
        // randomly sample 2d control points
        let xs = sample(xMin,xMax,6);
        let ys = sample(yMin,yMax,4);
        ys.sort();
        ys.unshift(yMin);
        ys.push(yMax);
        for (let i=0;i<6;i++) {
            this.axisPoints2D.push(new THREE.Vector3(xs[i],ys[i],0));
        }
        // randomly generate a base plane 
        let normal = new THREE.Vector3(0,0,1);
        this.axisPlaneNormalRotation = new THREE.Euler((1-2*Math.random())*Math.PI/6,(1-2*Math.random())*Math.PI/6,0);
        normal.applyEuler(this.axisPlaneNormalRotation);
        // this.axisPlaneDistance = (1-2*Math.random()) * Math.max(xRange,yRange)/2;
        this.axisPlane.set(normal, 0)//this.axisPlaneDistance);
        // get 3d control points
        this.axisPoints = pointsToPlane(this.axisPoints2D,this.axisPlane);
    }
    checkBadAxis (distMin=0,angleMax=Math.PI/4) {
        for (let i=1;i<6;i++) {
            let p2 = this.axisPoints[i];
            let p1 = this.axisPoints[i-1];
            // check distance
            if (p2.distanceTo(p1)<distMin) {
                return true;
            }
            if (i>1) {
                let p0 = this.axisPoints[i-2];
                let v1 = new THREE.Vector3().subVectors(p2,p1);
                let v0 = new THREE.Vector3().subVectors(p1,p0);
                if(v1.angleTo(v0)>=angleMax) {
                    return true;
                }
            }
        }
    }

    // 2.2 set unit emptiness
    setUnitEmptiness () {
        
    }

    // 2.2 search junctions envelopes
    searchFeasibleJunctionEnvelopes () {
        this.generateJunctionEnevelopes();
        while (!this.checkJunctionEnvelopes()) {
            this.generateJunctionEnevelopes();
        }
    }
    generateJunctionEnevelopes () {
        // randomly generate junction envelope heights and angles
        for (let i=0;i<this.n-1;i++) {
            let u1 = this.sculpture.units.children[i];
            let u2 = this.sculpture.units.children[i+1];
            if (u1.isEmpty || u2.isEmpty) {
                continue;
            }
            this.junctionEnvelopeHeights[i] = 0.6+Math.random() * 0.3;
            this.junctionEnvelopeAngles[i] = Math.PI/4 + Math.random() * Math.PI/12;
            let h = u1.position.distanceTo(u2.position) * this.junctionEnvelopeHeights[i];
            let r = h*Math.tan(this.junctionEnvelopeAngles[i])+this.r0;
            let rod = new Junction('Rod',this.r0,r,h,this.radialSegments);
            u1.rod = rod;
            u1.transmissions.add(rod);
            let fork = new Junction('Fork',this.r0,r,h,this.radialSegments);
            u2.fork = fork;
            u2.transmissions.add(fork);
        }
    }
    checkJunctionEnvelopes () {
        for (let i = 0; i < this.n - 1; i ++) {
            let u1 = this.sculpture.units.children[i];
            let u2 = this.sculpture.units.children[i+1];
            if (u1.isEmpty || u2.isEmpty) {
                continue;
            }
            let frustum1 = u1.rod.envelope;
            let frustum2 = u2.fork.envelope;
            let n = frustum1.geometry.vertices.length/2;
            let co = -1;
            for (let j=0;j<n;j++) {
                // check junction connections
                if (generatrixIntersection(frustum1, frustum2,0.95,n,j)) {
                    // connected
                    this.E_connection = 0;
                } else {
                    // due to unsolved intersection bugs, additional flag is used for record
                    // only continuous (i.e. j,j+1) disconnections are seen as separations
                    if (co == -1) {
                        co = j;
                    } else if (co==j-1) {
                        this.E_connection = Infinity;
                        return false;
                    }
                }
                // check collissions of junctions and axis
                if (generatrixIntersection(frustum1, this.axis, 1.05,n,j) ||
                    generatrixIntersection(frustum2, this.axis, 1.05,n,j)) {
                    // collide
                    this.E_collision = Infinity;
                    return false;
                } else {
                    this.E_collision = 0;
                }
            }
        }
        return true;
    }

    // 2.3 search junction phases

    // 2.4 search skeleton envelopes

    // 2.5 search skeletons

    // 3. Feasibility section
    // find a feasible junction envelope first, 
    // other wise E_shape cannot be computed
    computeJunctionEnvelopeFeasibility () {
        for (let i = 0; i < this.n - 1; i ++) {
            let u1 = this.sculpture.units.children[i];
            let u2 = this.sculpture.units.children[i+1];
            if (u1.isEmpty || u2.isEmpty) {
                continue;
            }
            this.collideJunctions(u1.rod.envelope,u2.fork.envelope);
        }
    }

    // 1.4 initialize skeletons


    // 1.5 initialize junction phases
    initializeJunctionPhases () {
        for (let i = 0; i < this.n - 1; i ++) {
            let u1 = this.sculpture.units.children[i];
            let u2 = this.sculpture.units.children[i+1];
            if (u1.isEmpty || u2.isEmpty) {
                continue;
            }

        }
    }

    // initialize a sculpture prototype based on the initial axis
    // number of units: 10 (to be tuned)
    initializeSculpture () {
        this.sculpture = new KineticSculpture(this.axis,this.sketches[0]);
        this.sculpture.buildSkeleton(10,this.n);
    }

    // initialize all junctions based on the initial sculpture prototype
    

    // get discrete sketches based on current axis and input sketches
    // from
    // input sketches: [ s1, ..., si, ..., sN ], N is the number of sketches
    //      where si = [ c1, ..., cj, ..., cM ], M is the number of curves in a sketch
    // to
    // discrete sketches: [ d1, ..., di, ..., dN]
    //      where di = [ r1, ..., ri, ..., rn ], n is the number of units
    //      where ri = [ p1, ..., pj, ..., pq],
    //      where q is the number of intersecting points of axis' normal planes with all curves in a sketch
    //      (q may vary in different ri)
    getObjectiveContours () {
        if (this.axis.samplingPoints.length==0) {
            this.axis.sample(this.n);
        }
        // clear all discrete sketches
        this.discreteSketches = [];
        for (let n=0;n<this.sketches.length;n++) {
            let sketch = this.sketches[n];
            // clear every discrete sketch
            let sampledSketch = [];
            for (let i=0;i<this.n;i++) {
                // get intersecting point of normal plane and each curve in a sketch
                let normalPlane = this.axis.samplingNormalPlanes[i];
                let unitObjectivePoints = [];
                for (let curve of sketch) {
                    for (let line of curve.denseLines) {
                        let point = new THREE.Vector3();
                        // intersect curve with normal plane
                        let intersection = normalPlane.intersectLine(line,point);
                        if (intersection == undefined) {
                            // no intersection
                            
                        } else {
                            unitObjectivePoints.push(point);
                            // DEBUG
                            // let box = new THREE.Mesh(new THREE.SphereBufferGeometry(0.2));
                            // box.position.copy(point)
                            // sketch[0].add(box);
                            continue;
                        }
                    }
                }
                sampledSketch.push(unitObjectivePoints);
            }
            this.discreteSketches.push(sampledSketch);
        }
    }

    // build just one skeleton based on N sketches
    initializeSkeleton () {
        // 1. generate normal planes of the axis
        this.axis.samplingTangents(this.n);

        // 2. get intersecting points of the normal planes with the jth curve of all N sketches
        let points = [];
        for (let i=0;i<this.n;i++) {
            // get all intersecting points of a sketch with the ith normal plane
            let unitPoints2D = [];
            let normalPlane = this.axis.samplingNormalPlanes[i];
            let point = new THREE.Vector3();
            var lineSegments = [];
            for (let curve of this.sketches[i]) {
                for (let lineSegment of curve.denseLines) {
                    lineSegments.push(lineSegment.clone()/* .applyMatrix4(this.axis.matrix) */);
                }
            }
            for (let lineSegment of lineSegments) {
                if (!normalPlane.intersectsLine(lineSegment)) {
                    continue;
                } else {
                    unitPoints2D.push(normalPlane.intersectLine(lineSegment,point));
                }
            }
            // generate 3D ends
            let planeCenter = this.axis.samplingPoints[i];
            for (let p of unitPoints2D) {

            }
        }

        // 3. set the initial r as the max distance from intersecting points to the axis sampling point
        
        // 4. compute other intersecting point phases based on sin or cos

        // 5. build 2d skeleton lines


    }

    // build N skeletons for N sketches
    buildSkeletons () {
        for (let sketch of this.sketches) {
            let tempAxis = this.axis.clone();
            let sculpture = new KineticSculpture(tempAxis,sketch);
            sculpture.buildSkeleton(10,this.n);
            this.sculptures.push(sculpture);
        }
    }

    // generateAxis () {

    // }

    searchSkeletons () {
        // 6. set the range of r as the 0.8min and 1.2max distances

        // 7. compute the dissimilarity
        this.getDissimilarity();
    }

    searchJunctions () {

    }

    // motion computation
    computeMotion () {

    }

    // energy computation section

    computeEnergy () {
        this.energy = this.E_connection + this.E_collision + this.E_dissimilarity + this.E_axis;
    }

    computeShapeEnergy () {
        // TODO: compute in motion
        for (let sketch of this.discreteSketches) {
            this.E_dissimilarity += this.getDissimilarity(sketch);
        }
    }

    getDissimilarity (sketch) {
        let dissimilarity = 0;
        for (let i=0;i<this.n;i++) {
            if (sketch[i].length==0) {
                continue;
            }
            let u = this.sculpture.units.children[i];
            let end2D = u.skeleton.children.map(function(rib){
                let p2D = u.localToWorld(rib.end.position.clone());
                p2D.z = 0;
                return p2D;
            });
            for (let p of end2D) {
                let minD = 100;
                for (let sp of sketch[i]) {
                    let d = p.distanceTo(sp);
                    minD = d<minD ? d: minD;
                }
                dissimilarity += minD;
            }
        }
        return dissimilarity;
    }

    computeAxisEnergy () {
        this.E_axis = getCurvatureData(this.axis.curve,200).curvature.max;
    }

    computeCollisions () {
        for (let i=0;i<this.n-1;i++) {
            let u1 = this.sculpture.units.children[i];
            let u2 = this.sculpture.units.children[i+1];
            // only traverse non-empty units (units with skeleton lines)
            if (u1.rod != undefined && u2.fork != undefined ) {

                // compute junction connections, and
                // compute collisions of junction & skeleton, junction & axis
                this.collideJunctions(u1.rod.envelope, u2.fork.envelope);
                
                // compute collisions of skeleton & skeleton, skeleton & axis
                this.collideSkeletons(u1,u2);

            }
        }
    }

    collideJunctions (frustum1, frustum2) {
        let n = frustum1.geometry.vertices.length/2;
        let co = -1;
        for (let j=0;j<n;j++) {

            // update E_connection
            if (generatrixIntersection(frustum1, frustum2,0.95,n,j)) {
                // connected
                this.E_connection = 0;
            } else {
                // due to intersection bugs, additional flag is used for record
                // only continuous (i.e. j,i+1) disconnections are seen as separations
                if (co == -1) {
                    co = j;
                } else if (co==j-1) {
                    console.log('junction separated');
                    this.E_connection = Infinity;
                    return;
                }
            }

            // update part of E_collisions
            // collide with axis
            if (generatrixIntersection(frustum1, this.axis ,1.05,n,j) ||
                generatrixIntersection(frustum2, this.axis ,1.05,n,j)) {
                // collide
                this.E_collision = Infinity;
                return;
            } else {
                this.E_collision = 0;
            }
            // collide with neighbor unit's skeleton
            if (generatrixIntersection(frustum1, frustum2.parent.parent.parent.parent.skeleton ,1.05,n,j) ||
                generatrixIntersection(frustum2, frustum1.parent.parent.parent.parent.skeleton ,1.05,n,j)) {
                // collide
                this.E_collision = Infinity;
                return;
            } else {
                this.E_collision = 0;
            }

        }
    }

    collideSkeletons (u1,u2) {
        let c1 = u1.colliders.children[0];
        let c2 = u2.colliders.children[0];
        let n = c1.geometry.vertices.length/2-1;
        for (let j=0;j<n;j++) {
            if (generatrixIntersection(c1, c2,1,n,j)) {
                this.E_collision = Infinity;
                return;
            }
            if (generatrixIntersection(c1, this.axis,1,n,j)||generatrixIntersection(c2, this.axis,1,n,j)) {
                this.E_collision = Infinity;
                return;
            }
        }
    }

    searchPhase () {

    }

    solve (method='SA') {
        this.getSketchesBox();
        this.initializeAxis();
        // this.initializeUnitEnvelopes();
        // this.getObjectiveContours();
        // this.initializeSculpture();
        // this.E_dissimilarity = 0;
        // for (let sketch of this.discreteSketches) {
        //     this.E_dissimilarity += this.getDissimilarity(sketch);
        // }
        // console.log(this.E_dissimilarity);
        this.initializeJunctionEnvelopes();
        // this.computeCollisions();
        // console.log('collision: ', this.E_collision);
        // console.log('connection: ', this.E_connection)
    }

}



// // connection detection
// let startWorld1 = frustum1.localToWorld(frustum1.geometry.vertices[j].clone());
// let endWorld1 = frustum1.localToWorld(frustum1.geometry.vertices[this.radialSegments+j].clone());
// let dist = endWorld1.distanceTo(startWorld1);
// let dir1 = new THREE.Vector3().subVectors(endWorld1,startWorld1).normalize();
// // DEBUG: show rays
// let arrow = new THREE.ArrowHelper(dir1,startWorld1,dist*0.95);
// frustum1.parent.parent.parent.parent.parent.parent.add(arrow);
// let rayShort = new THREE.Raycaster(startWorld1,dir1,0,dist*0.95);
// let ist = rayShort.intersectObject(frustum2,true);

// if (ist.length==0) {
//     this.E_connection = Infinity;
//     // return;
// } else {
//     this.E_connection = 0;
//     // DEBUG: show intesecting points
//     let bx = new THREE.Mesh(new THREE.SphereBufferGeometry(0.02));
//     bx.position.copy(ist[0].point);
//     frustum1.parent.parent.parent.parent.parent.parent.add(bx);
// }

// collision detection
// let ray1Long = new THREE.Raycaster(startWorld1,dir1,0,dist*1.05);
// let startWorld2 = frustum2.localToWorld(frustum2.geometry.vertices[j].clone());
// let endWorld2 = frustum2.localToWorld(frustum2.geometry.vertices[this.radialSegments+j].clone());
// let dir2 = new THREE.Vector3().subVectors(endWorld2,startWorld2).normalize();
// let ray2Long = new THREE.Raycaster(startWorld2,dir2,0,dist*1.05);

// // collide with axis
// if (ray1Long.intersectObject(this.axis,true).length==0 && 
//     ray2Long.intersectObject(this.axis,true).length==0) {
//     this.E_collision = 0;
// } else {
//     this.E_collision = Infinity;
//     return;
// }

// collide with neighbor unit's skeleton
// if (ray1Long.intersectObject(frustum2.parent.parent.parent.parent.skeleton,true).length==0 && 
//     ray2Long.intersectObject(frustum1.parent.parent.parent.parent.skeleton,true).length==0 ) {
//     this.E_collision = 0;
// } else {
//     this.E_collision = Infinity;
//     return;
// }


